using Microsoft.Extensions.Caching.Memory;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace ai_hr.Services
{
    public class AdvancedAuthenticationService : IAdvancedAuthenticationService
    {
        private readonly IMemoryCache _cache;
        private readonly ISecurityLoggingService _securityLogger;
        private readonly ILogger<AdvancedAuthenticationService> _logger;
        private readonly IConfiguration _configuration;
        
        private const string FAILED_ATTEMPTS_KEY_PREFIX = "failed_attempts_";
        private const string ACCOUNT_LOCKOUT_KEY_PREFIX = "account_lockout_";
        private const string TWO_FACTOR_CODE_KEY_PREFIX = "2fa_code_";
        private const string SESSION_KEY_PREFIX = "session_";
        private const string USER_SESSIONS_KEY_PREFIX = "user_sessions_";
        private const string PASSWORD_HISTORY_KEY_PREFIX = "pwd_history_";

        private readonly TimeSpan _lockoutDuration = TimeSpan.FromMinutes(30);
        private readonly int _maxFailedAttempts = 5;
        private readonly int _captchaThreshold = 3;

        public AdvancedAuthenticationService(
            IMemoryCache cache,
            ISecurityLoggingService securityLogger,
            ILogger<AdvancedAuthenticationService> logger,
            IConfiguration configuration)
        {
            _cache = cache;
            _securityLogger = securityLogger;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<AuthenticationAttemptResult> ValidateAuthenticationAttemptAsync(string email, string ipAddress, string userAgent)
        {
            try
            {
                var failedAttemptsKey = $"{FAILED_ATTEMPTS_KEY_PREFIX}{email}";
                var lockoutKey = $"{ACCOUNT_LOCKOUT_KEY_PREFIX}{email}";

                // Check if account is locked
                if (_cache.TryGetValue(lockoutKey, out AccountLockout? lockout) && lockout != null)
                {
                    if (lockout.ExpiresAt > DateTime.UtcNow)
                    {
                        return new AuthenticationAttemptResult
                        {
                            IsAllowed = false,
                            BlockReason = $"Account is locked due to {lockout.Reason}",
                            LockoutDuration = lockout.ExpiresAt - DateTime.UtcNow,
                            RequiresAdditionalVerification = true
                        };
                    }
                    else
                    {
                        // Lockout expired, remove it
                        _cache.Remove(lockoutKey);
                        _cache.Remove(failedAttemptsKey);
                    }
                }

                // Get failed attempts count
                var failedAttempts = _cache.Get<int>(failedAttemptsKey);
                var remainingAttempts = Math.Max(0, _maxFailedAttempts - failedAttempts);

                // Check for suspicious patterns
                var suspiciousActivity = await DetectSuspiciousActivityAsync(email, ipAddress, userAgent);
                if (suspiciousActivity.IsSuspicious)
                {
                    await _securityLogger.LogSuspiciousActivityAsync(
                        "SUSPICIOUS_LOGIN_PATTERN",
                        null,
                        ipAddress,
                        userAgent,
                        suspiciousActivity.Reason
                    );

                    return new AuthenticationAttemptResult
                    {
                        IsAllowed = false,
                        BlockReason = "Suspicious activity detected",
                        RequiresAdditionalVerification = true
                    };
                }

                return new AuthenticationAttemptResult
                {
                    IsAllowed = true,
                    FailedAttemptsCount = failedAttempts,
                    RemainingAttempts = remainingAttempts,
                    RequiresCaptcha = failedAttempts >= _captchaThreshold
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating authentication attempt for {Email}", email);
                // Fail secure - block the attempt
                return new AuthenticationAttemptResult
                {
                    IsAllowed = false,
                    BlockReason = "Security validation error"
                };
            }
        }

        public async Task RecordAuthenticationAttemptAsync(string email, bool success, string ipAddress, string userAgent, string? failureReason = null)
        {
            try
            {
                var failedAttemptsKey = $"{FAILED_ATTEMPTS_KEY_PREFIX}{email}";
                var lockoutKey = $"{ACCOUNT_LOCKOUT_KEY_PREFIX}{email}";

                if (success)
                {
                    // Clear failed attempts on successful login
                    _cache.Remove(failedAttemptsKey);
                    await _securityLogger.LogAuthenticationAttemptAsync(email, true, ipAddress, userAgent);
                }
                else
                {
                    // Increment failed attempts
                    var failedAttempts = _cache.Get<int>(failedAttemptsKey) + 1;
                    _cache.Set(failedAttemptsKey, failedAttempts, TimeSpan.FromHours(1));

                    await _securityLogger.LogAuthenticationAttemptAsync(email, false, ipAddress, userAgent, failureReason);

                    // Lock account if too many failures
                    if (failedAttempts >= _maxFailedAttempts)
                    {
                        await LockAccountAsync(email, $"Too many failed login attempts ({failedAttempts})", ipAddress, _lockoutDuration);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording authentication attempt for {Email}", email);
            }
        }

        public async Task<bool> IsAccountLockedAsync(string email)
        {
            var lockoutKey = $"{ACCOUNT_LOCKOUT_KEY_PREFIX}{email}";
            
            if (_cache.TryGetValue(lockoutKey, out AccountLockout? lockout) && lockout != null)
            {
                if (lockout.ExpiresAt > DateTime.UtcNow)
                {
                    return true;
                }
                else
                {
                    _cache.Remove(lockoutKey);
                }
            }

            return await Task.FromResult(false);
        }

        public async Task LockAccountAsync(string email, string reason, string ipAddress, TimeSpan? duration = null)
        {
            try
            {
                var lockoutKey = $"{ACCOUNT_LOCKOUT_KEY_PREFIX}{email}";
                var lockoutDuration = duration ?? _lockoutDuration;

                var lockout = new AccountLockout
                {
                    Email = email,
                    Reason = reason,
                    LockedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.Add(lockoutDuration),
                    LockedFromIp = ipAddress
                };

                _cache.Set(lockoutKey, lockout, lockoutDuration.Add(TimeSpan.FromMinutes(5))); // Keep slightly longer than lockout

                await _securityLogger.LogAccountLockoutAsync(email, ipAddress, reason);
                
                _logger.LogWarning("Account locked: {Email} for {Duration} minutes - {Reason}",
                    email, lockoutDuration.TotalMinutes, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error locking account {Email}", email);
            }
        }

        public async Task UnlockAccountAsync(string email, string adminUserId, string reason)
        {
            try
            {
                var lockoutKey = $"{ACCOUNT_LOCKOUT_KEY_PREFIX}{email}";
                var failedAttemptsKey = $"{FAILED_ATTEMPTS_KEY_PREFIX}{email}";

                _cache.Remove(lockoutKey);
                _cache.Remove(failedAttemptsKey);

                await _securityLogger.LogSecurityConfigurationChangeAsync(
                    adminUserId,
                    "ACCOUNT_UNLOCK",
                    $"Unlocked account {email}: {reason}",
                    "admin_action"
                );

                _logger.LogInformation("Account unlocked by admin {AdminUserId}: {Email} - {Reason}",
                    adminUserId, email, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unlocking account {Email}", email);
            }
        }

        public async Task<bool> RequiresTwoFactorAuthAsync(string userId)
        {
            // In production, check user's 2FA settings from database
            // For now, return false as placeholder
            return await Task.FromResult(false);
        }

        public async Task<string> GenerateTwoFactorCodeAsync(string userId, string method)
        {
            try
            {
                var code = GenerateSecureCode(6);
                var key = $"{TWO_FACTOR_CODE_KEY_PREFIX}{userId}";
                
                var twoFactorData = new TwoFactorCode
                {
                    Code = code,
                    Method = method,
                    GeneratedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(10)
                };

                _cache.Set(key, twoFactorData, TimeSpan.FromMinutes(10));

                _logger.LogInformation("2FA code generated for user {UserId} via {Method}", userId, method);
                return code;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating 2FA code for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> ValidateTwoFactorCodeAsync(string userId, string code)
        {
            try
            {
                var key = $"{TWO_FACTOR_CODE_KEY_PREFIX}{userId}";
                
                if (_cache.TryGetValue(key, out TwoFactorCode? twoFactorData) && twoFactorData != null)
                {
                    if (twoFactorData.ExpiresAt > DateTime.UtcNow && twoFactorData.Code == code)
                    {
                        _cache.Remove(key); // Remove used code
                        _logger.LogInformation("2FA code validated successfully for user {UserId}", userId);
                        return true;
                    }
                }

                _logger.LogWarning("Invalid 2FA code attempt for user {UserId}", userId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating 2FA code for user {UserId}", userId);
                return false;
            }
        }

        public async Task<SessionSecurityInfo> CreateSecureSessionAsync(string userId, string ipAddress, string userAgent)
        {
            try
            {
                var sessionId = Guid.NewGuid().ToString();
                var now = DateTime.UtcNow;
                
                var sessionInfo = new SessionSecurityInfo
                {
                    SessionId = sessionId,
                    UserId = userId,
                    CreatedAt = now,
                    ExpiresAt = now.AddHours(8), // 8-hour session
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    IsSecure = true,
                    SecurityMetadata = new Dictionary<string, object>
                    {
                        ["created_timestamp"] = now.Ticks,
                        ["ip_hash"] = ComputeHash(ipAddress),
                        ["user_agent_hash"] = ComputeHash(userAgent),
                        ["security_level"] = "HIGH"
                    }
                };

                // Store session
                var sessionKey = $"{SESSION_KEY_PREFIX}{sessionId}";
                _cache.Set(sessionKey, sessionInfo, TimeSpan.FromHours(8));

                // Track user sessions
                var userSessionsKey = $"{USER_SESSIONS_KEY_PREFIX}{userId}";
                var userSessions = _cache.Get<List<string>>(userSessionsKey) ?? new List<string>();
                userSessions.Add(sessionId);
                _cache.Set(userSessionsKey, userSessions, TimeSpan.FromHours(8));

                _logger.LogInformation("Secure session created for user {UserId}: {SessionId}", userId, sessionId);
                return sessionInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating secure session for user {UserId}", userId);
                throw;
            }
        }

        public async Task InvalidateSessionAsync(string sessionId, string reason)
        {
            try
            {
                var sessionKey = $"{SESSION_KEY_PREFIX}{sessionId}";
                
                if (_cache.TryGetValue(sessionKey, out SessionSecurityInfo? sessionInfo) && sessionInfo != null)
                {
                    _cache.Remove(sessionKey);

                    // Remove from user sessions
                    var userSessionsKey = $"{USER_SESSIONS_KEY_PREFIX}{sessionInfo.UserId}";
                    var userSessions = _cache.Get<List<string>>(userSessionsKey) ?? new List<string>();
                    userSessions.Remove(sessionId);
                    _cache.Set(userSessionsKey, userSessions, TimeSpan.FromHours(8));

                    _logger.LogInformation("Session invalidated: {SessionId} for user {UserId} - {Reason}",
                        sessionId, sessionInfo.UserId, reason);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating session {SessionId}", sessionId);
            }
        }

        public async Task<bool> IsSessionValidAsync(string sessionId)
        {
            try
            {
                var sessionKey = $"{SESSION_KEY_PREFIX}{sessionId}";
                
                if (_cache.TryGetValue(sessionKey, out SessionSecurityInfo? sessionInfo) && sessionInfo != null)
                {
                    if (sessionInfo.ExpiresAt > DateTime.UtcNow)
                    {
                        return true;
                    }
                    else
                    {
                        await InvalidateSessionAsync(sessionId, "Expired");
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating session {SessionId}", sessionId);
                return false;
            }
        }

        public async Task<List<ActiveSession>> GetActiveSessionsForUserAsync(string userId)
        {
            try
            {
                var userSessionsKey = $"{USER_SESSIONS_KEY_PREFIX}{userId}";
                var sessionIds = _cache.Get<List<string>>(userSessionsKey) ?? new List<string>();
                var activeSessions = new List<ActiveSession>();

                foreach (var sessionId in sessionIds.ToList())
                {
                    var sessionKey = $"{SESSION_KEY_PREFIX}{sessionId}";
                    if (_cache.TryGetValue(sessionKey, out SessionSecurityInfo? sessionInfo) && sessionInfo != null)
                    {
                        if (sessionInfo.ExpiresAt > DateTime.UtcNow)
                        {
                            activeSessions.Add(new ActiveSession
                            {
                                SessionId = sessionId,
                                CreatedAt = sessionInfo.CreatedAt,
                                LastAccessedAt = sessionInfo.CreatedAt, // Placeholder
                                IpAddress = MaskIpAddress(sessionInfo.IpAddress),
                                UserAgent = sessionInfo.UserAgent,
                                DeviceInfo = ExtractDeviceInfo(sessionInfo.UserAgent)
                            });
                        }
                        else
                        {
                            await InvalidateSessionAsync(sessionId, "Expired");
                        }
                    }
                }

                return activeSessions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active sessions for user {UserId}", userId);
                return new List<ActiveSession>();
            }
        }

        public async Task InvalidateAllUserSessionsAsync(string userId, string reason)
        {
            try
            {
                var activeSessions = await GetActiveSessionsForUserAsync(userId);
                
                foreach (var session in activeSessions)
                {
                    await InvalidateSessionAsync(session.SessionId, reason);
                }

                _logger.LogInformation("All sessions invalidated for user {UserId} - {Reason}", userId, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating all sessions for user {UserId}", userId);
            }
        }

        public async Task<PasswordSecurityResult> ValidatePasswordSecurityAsync(string password, string userId)
        {
            var result = new PasswordSecurityResult();

            try
            {
                // Check password strength
                result.StrengthScore = CalculatePasswordStrength(password);
                
                // Check against common violations
                ValidatePasswordComplexity(password, result);
                
                // Check if password was recently used
                result.IsReused = await IsPasswordRecentlyUsedAsync(userId, ComputeHash(password));

                // Check against known compromised passwords (placeholder)
                result.IsCompromised = await IsPasswordCompromisedAsync(password);

                result.IsSecure = result.StrengthScore >= 60 && 
                                 result.Violations.Count == 0 && 
                                 !result.IsReused && 
                                 !result.IsCompromised;

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating password security for user {UserId}", userId);
                result.IsSecure = false;
                result.Violations.Add("Error occurred during password validation");
                return result;
            }
        }

        public async Task RecordPasswordChangeAsync(string userId, string oldPasswordHash, string newPasswordHash, string ipAddress)
        {
            try
            {
                var historyKey = $"{PASSWORD_HISTORY_KEY_PREFIX}{userId}";
                var history = _cache.Get<List<PasswordHistoryEntry>>(historyKey) ?? new List<PasswordHistoryEntry>();

                history.Add(new PasswordHistoryEntry
                {
                    PasswordHash = newPasswordHash,
                    ChangedAt = DateTime.UtcNow,
                    ChangedFromIp = ipAddress
                });

                // Keep only last 10 passwords
                if (history.Count > 10)
                {
                    history = history.TakeLast(10).ToList();
                }

                _cache.Set(historyKey, history, TimeSpan.FromDays(365));

                await _securityLogger.LogPasswordChangeAsync(userId, ipAddress, "password_change");
                
                _logger.LogInformation("Password change recorded for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording password change for user {UserId}", userId);
            }
        }

        public async Task<bool> IsPasswordRecentlyUsedAsync(string userId, string passwordHash)
        {
            try
            {
                var historyKey = $"{PASSWORD_HISTORY_KEY_PREFIX}{userId}";
                var history = _cache.Get<List<PasswordHistoryEntry>>(historyKey) ?? new List<PasswordHistoryEntry>();

                return history.Any(entry => entry.PasswordHash == passwordHash);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking password history for user {UserId}", userId);
                return false; // Fail open for this check
            }
        }

        public async Task<AccountSecurityStatus> GetAccountSecurityStatusAsync(string userId)
        {
            try
            {
                var failedAttemptsKey = $"{FAILED_ATTEMPTS_KEY_PREFIX}{userId}";
                var failedAttempts = _cache.Get<int>(failedAttemptsKey);
                var activeSessions = await GetActiveSessionsForUserAsync(userId);

                return new AccountSecurityStatus
                {
                    UserId = userId,
                    IsLocked = await IsAccountLockedAsync(userId),
                    FailedLoginAttempts = failedAttempts,
                    ActiveSessionCount = activeSessions.Count,
                    TwoFactorEnabled = await RequiresTwoFactorAuthAsync(userId),
                    SecurityScore = CalculateSecurityScore(failedAttempts, activeSessions.Count)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting account security status for user {UserId}", userId);
                return new AccountSecurityStatus { UserId = userId };
            }
        }

        // Helper methods
        private async Task<(bool IsSuspicious, string Reason)> DetectSuspiciousActivityAsync(string email, string ipAddress, string userAgent)
        {
            // Implement suspicious activity detection logic
            // This is a simplified version - in production, you'd have more sophisticated detection
            
            // Check for rapid-fire attempts from same IP
            // Check for attempts from multiple IPs for same email
            // Check for unusual user agents
            // etc.
            
            return await Task.FromResult((false, string.Empty));
        }

        private string GenerateSecureCode(int length)
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[length];
            rng.GetBytes(bytes);
            
            var code = "";
            for (int i = 0; i < length; i++)
            {
                code += (bytes[i] % 10).ToString();
            }
            return code;
        }

        private int CalculatePasswordStrength(string password)
        {
            var score = 0;

            if (password.Length >= 8) score += 20;
            if (password.Length >= 12) score += 10;
            if (password.Any(char.IsLower)) score += 15;
            if (password.Any(char.IsUpper)) score += 15;
            if (password.Any(char.IsDigit)) score += 15;
            if (password.Any(ch => "!@#$%^&*()_+-=[]{}|;:,.<>?".Contains(ch))) score += 25;

            return Math.Min(100, score);
        }

        private void ValidatePasswordComplexity(string password, PasswordSecurityResult result)
        {
            if (password.Length < 8)
                result.Violations.Add("Password must be at least 8 characters long");
            
            if (!password.Any(char.IsUpper))
                result.Violations.Add("Password must contain at least one uppercase letter");
            
            if (!password.Any(char.IsLower))
                result.Violations.Add("Password must contain at least one lowercase letter");
            
            if (!password.Any(char.IsDigit))
                result.Violations.Add("Password must contain at least one digit");
            
            if (!password.Any(ch => "!@#$%^&*()_+-=[]{}|;:,.<>?".Contains(ch)))
                result.Violations.Add("Password must contain at least one special character");

            // Check for common patterns
            if (Regex.IsMatch(password, @"(.)\1{2,}"))
                result.Violations.Add("Password contains repeated characters");
            
            if (Regex.IsMatch(password, @"(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)", RegexOptions.IgnoreCase))
                result.Violations.Add("Password contains sequential characters");
        }

        private async Task<bool> IsPasswordCompromisedAsync(string password)
        {
            // In production, check against known compromised password databases
            // For now, return false as placeholder
            return await Task.FromResult(false);
        }

        private string ComputeHash(string input)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(hashedBytes);
        }

        private string MaskIpAddress(string ipAddress)
        {
            if (string.IsNullOrEmpty(ipAddress)) return "unknown";
            
            var parts = ipAddress.Split('.');
            if (parts.Length == 4)
            {
                return $"{parts[0]}.{parts[1]}.xxx.xxx";
            }
            
            return "masked_ip";
        }

        private string ExtractDeviceInfo(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent)) return "Unknown Device";
            
            // Simple device detection - in production, use a proper library
            if (userAgent.Contains("Mobile")) return "Mobile Device";
            if (userAgent.Contains("Chrome")) return "Chrome Browser";
            if (userAgent.Contains("Firefox")) return "Firefox Browser";
            if (userAgent.Contains("Safari")) return "Safari Browser";
            
            return "Unknown Device";
        }

        private int CalculateSecurityScore(int failedAttempts, int activeSessionCount)
        {
            var score = 100;
            
            score -= Math.Min(failedAttempts * 10, 50); // Max -50 for failed attempts
            score -= Math.Max(0, (activeSessionCount - 3) * 5); // Penalty for too many sessions
            
            return Math.Max(0, score);
        }

        private class AccountLockout
        {
            public string Email { get; set; } = string.Empty;
            public string Reason { get; set; } = string.Empty;
            public DateTime LockedAt { get; set; }
            public DateTime ExpiresAt { get; set; }
            public string LockedFromIp { get; set; } = string.Empty;
        }

        private class TwoFactorCode
        {
            public string Code { get; set; } = string.Empty;
            public string Method { get; set; } = string.Empty;
            public DateTime GeneratedAt { get; set; }
            public DateTime ExpiresAt { get; set; }
        }

        private class PasswordHistoryEntry
        {
            public string PasswordHash { get; set; } = string.Empty;
            public DateTime ChangedAt { get; set; }
            public string ChangedFromIp { get; set; } = string.Empty;
        }
    }
}
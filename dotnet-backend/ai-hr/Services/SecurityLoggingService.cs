using System.Text.Json;

namespace ai_hr.Services
{
    public class SecurityLoggingService : ISecurityLoggingService
    {
        private readonly ILogger<SecurityLoggingService> _logger;
        private readonly IConfiguration _configuration;

        public SecurityLoggingService(ILogger<SecurityLoggingService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task LogAuthenticationAttemptAsync(string email, bool success, string ipAddress, string userAgent, string? failureReason = null)
        {
            var logData = new
            {
                EventType = "AUTHENTICATION_ATTEMPT",
                Email = MaskEmail(email),
                Success = success,
                IpAddress = MaskIpAddress(ipAddress),
                UserAgent = SanitizeUserAgent(userAgent),
                FailureReason = failureReason,
                Timestamp = DateTime.UtcNow,
                SessionId = GenerateSessionId()
            };

            if (success)
            {
                _logger.LogInformation("🔐 Authentication Success: {Email} from {IpAddress}", 
                    MaskEmail(email), MaskIpAddress(ipAddress));
            }
            else
            {
                _logger.LogWarning("🚨 Authentication Failed: {Email} from {IpAddress} - Reason: {Reason}", 
                    MaskEmail(email), MaskIpAddress(ipAddress), failureReason ?? "Invalid credentials");
            }

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogAuthenticationSuccessAsync(string userId, string email, string ipAddress, string userAgent)
        {
            var logData = new
            {
                EventType = "AUTHENTICATION_SUCCESS",
                UserId = userId,
                Email = MaskEmail(email),
                IpAddress = MaskIpAddress(ipAddress),
                UserAgent = SanitizeUserAgent(userAgent),
                Timestamp = DateTime.UtcNow,
                SessionId = GenerateSessionId()
            };

            _logger.LogInformation("✅ User Authenticated: {UserId} ({Email}) from {IpAddress}", 
                userId, MaskEmail(email), MaskIpAddress(ipAddress));

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogUnauthorizedAccessAsync(string endpoint, string? userId, string ipAddress, string userAgent, string reason)
        {
            var logData = new
            {
                EventType = "UNAUTHORIZED_ACCESS",
                Endpoint = endpoint,
                UserId = userId,
                IpAddress = MaskIpAddress(ipAddress),
                UserAgent = SanitizeUserAgent(userAgent),
                Reason = reason,
                Timestamp = DateTime.UtcNow,
                Severity = "HIGH"
            };

            _logger.LogWarning("🚫 Unauthorized Access Attempt: {Endpoint} by {UserId} from {IpAddress} - {Reason}", 
                endpoint, userId ?? "Anonymous", MaskIpAddress(ipAddress), reason);

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogSuspiciousActivityAsync(string activity, string? userId, string ipAddress, string userAgent, string details)
        {
            var logData = new
            {
                EventType = "SUSPICIOUS_ACTIVITY",
                Activity = activity,
                UserId = userId,
                IpAddress = MaskIpAddress(ipAddress),
                UserAgent = SanitizeUserAgent(userAgent),
                Details = details,
                Timestamp = DateTime.UtcNow,
                Severity = "CRITICAL"
            };

            _logger.LogError("🔴 Suspicious Activity Detected: {Activity} by {UserId} from {IpAddress} - {Details}", 
                activity, userId ?? "Anonymous", MaskIpAddress(ipAddress), details);

            await WriteSecurityLogAsync(logData);
            await SendSecurityAlertAsync(logData);
        }

        public async Task LogPasswordChangeAsync(string userId, string ipAddress, string userAgent)
        {
            var logData = new
            {
                EventType = "PASSWORD_CHANGE",
                UserId = userId,
                IpAddress = MaskIpAddress(ipAddress),
                UserAgent = SanitizeUserAgent(userAgent),
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation("🔑 Password Changed: User {UserId} from {IpAddress}", userId, MaskIpAddress(ipAddress));

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogAccountLockoutAsync(string email, string ipAddress, string reason)
        {
            var logData = new
            {
                EventType = "ACCOUNT_LOCKOUT",
                Email = MaskEmail(email),
                IpAddress = MaskIpAddress(ipAddress),
                Reason = reason,
                Timestamp = DateTime.UtcNow,
                Severity = "HIGH"
            };

            _logger.LogWarning("🔒 Account Locked: {Email} from {IpAddress} - {Reason}", 
                MaskEmail(email), MaskIpAddress(ipAddress), reason);

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogTokenRevocationAsync(string userId, string tokenId, string reason, string ipAddress)
        {
            var logData = new
            {
                EventType = "TOKEN_REVOCATION",
                UserId = userId,
                TokenId = tokenId,
                Reason = reason,
                IpAddress = MaskIpAddress(ipAddress),
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation("🎫 Token Revoked: {TokenId} for User {UserId} - {Reason}", 
                tokenId, userId, reason);

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogPrivilegeEscalationAttemptAsync(string userId, string requestedAction, string ipAddress, string userAgent)
        {
            var logData = new
            {
                EventType = "PRIVILEGE_ESCALATION_ATTEMPT",
                UserId = userId,
                RequestedAction = requestedAction,
                IpAddress = MaskIpAddress(ipAddress),
                UserAgent = SanitizeUserAgent(userAgent),
                Timestamp = DateTime.UtcNow,
                Severity = "CRITICAL"
            };

            _logger.LogError("⚠️ Privilege Escalation Attempt: User {UserId} attempted {Action} from {IpAddress}", 
                userId, requestedAction, MaskIpAddress(ipAddress));

            await WriteSecurityLogAsync(logData);
            await SendSecurityAlertAsync(logData);
        }

        public async Task LogDataAccessAsync(string userId, string dataType, string action, string resourceId, string ipAddress)
        {
            var logData = new
            {
                EventType = "DATA_ACCESS",
                UserId = userId,
                DataType = dataType,
                Action = action,
                ResourceId = resourceId,
                IpAddress = MaskIpAddress(ipAddress),
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation("📊 Data Access: User {UserId} {Action} {DataType} {ResourceId} from {IpAddress}", 
                userId, action, dataType, resourceId, MaskIpAddress(ipAddress));

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogSecurityConfigurationChangeAsync(string adminUserId, string changeType, string details, string ipAddress)
        {
            var logData = new
            {
                EventType = "SECURITY_CONFIGURATION_CHANGE",
                AdminUserId = adminUserId,
                ChangeType = changeType,
                Details = details,
                IpAddress = MaskIpAddress(ipAddress),
                Timestamp = DateTime.UtcNow,
                Severity = "HIGH"
            };

            _logger.LogWarning("⚙️ Security Configuration Changed: {ChangeType} by Admin {AdminUserId} from {IpAddress} - {Details}", 
                changeType, adminUserId, MaskIpAddress(ipAddress), details);

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogExternalApiCallAsync(string service, string action, bool success, string? userId, string? errorDetails = null)
        {
            var logData = new
            {
                EventType = "EXTERNAL_API_CALL",
                Service = service,
                Action = action,
                Success = success,
                UserId = userId,
                ErrorDetails = errorDetails,
                Timestamp = DateTime.UtcNow
            };

            if (success)
            {
                _logger.LogInformation("🌐 External API Success: {Service}.{Action} by User {UserId}", 
                    service, action, userId ?? "System");
            }
            else
            {
                _logger.LogWarning("🌐 External API Failure: {Service}.{Action} by User {UserId} - {Error}", 
                    service, action, userId ?? "System", errorDetails ?? "Unknown error");
            }

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogRateLimitExceededAsync(string ipAddress, string endpoint, int requestCount, string timeWindow)
        {
            var logData = new
            {
                EventType = "RATE_LIMIT_EXCEEDED",
                IpAddress = MaskIpAddress(ipAddress),
                Endpoint = endpoint,
                RequestCount = requestCount,
                TimeWindow = timeWindow,
                Timestamp = DateTime.UtcNow,
                Severity = "MEDIUM"
            };

            _logger.LogWarning("🚦 Rate Limit Exceeded: {IpAddress} made {RequestCount} requests to {Endpoint} in {TimeWindow}", 
                MaskIpAddress(ipAddress), requestCount, endpoint, timeWindow);

            await WriteSecurityLogAsync(logData);
        }

        public async Task LogInputValidationFailureAsync(string endpoint, string? userId, string ipAddress, string validationErrors)
        {
            var logData = new
            {
                EventType = "INPUT_VALIDATION_FAILURE",
                Endpoint = endpoint,
                UserId = userId,
                IpAddress = MaskIpAddress(ipAddress),
                ValidationErrors = validationErrors,
                Timestamp = DateTime.UtcNow,
                Severity = "MEDIUM"
            };

            _logger.LogWarning("❌ Input Validation Failed: {Endpoint} by {UserId} from {IpAddress} - {Errors}", 
                endpoint, userId ?? "Anonymous", MaskIpAddress(ipAddress), validationErrors);

            await WriteSecurityLogAsync(logData);
        }

        private async Task WriteSecurityLogAsync(object logData)
        {
            try
            {
                // In production, you would write to a secure log store (e.g., Azure Monitor, ELK Stack, etc.)
                var logJson = JsonSerializer.Serialize(logData, new JsonSerializerOptions 
                { 
                    WriteIndented = true 
                });
                
                // For now, write to a local security log file
                var logPath = GetSecurityLogPath();
                await File.AppendAllTextAsync(logPath, logJson + Environment.NewLine);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to write security log");
            }
        }

        private async Task SendSecurityAlertAsync(object alertData)
        {
            try
            {
                // In production, you would send alerts via email, SMS, Slack, etc.
                // For now, just log as critical
                var alertJson = JsonSerializer.Serialize(alertData);
                _logger.LogCritical("🚨 SECURITY ALERT: {AlertData}", alertJson);
                
                // You could integrate with services like:
                // - SendGrid for email alerts
                // - Twilio for SMS alerts
                // - Slack webhooks for team notifications
                // - Azure Monitor for cloud alerting
                
                await Task.CompletedTask; // Placeholder for actual alert implementation
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send security alert");
            }
        }

        private string MaskEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return "unknown";
            
            var parts = email.Split('@');
            if (parts.Length != 2) return "invalid_email";
            
            var localPart = parts[0];
            var domain = parts[1];
            
            if (localPart.Length <= 2)
                return $"{localPart}***@{domain}";
            
            return $"{localPart[0]}***{localPart[^1]}@{domain}";
        }

        private string MaskIpAddress(string ipAddress)
        {
            if (string.IsNullOrEmpty(ipAddress)) return "unknown";
            
            // For IPv4: show first two octets, mask last two
            var parts = ipAddress.Split('.');
            if (parts.Length == 4)
            {
                return $"{parts[0]}.{parts[1]}.xxx.xxx";
            }
            
            // For IPv6 or other formats, show first part only
            if (ipAddress.Contains(':'))
            {
                var firstPart = ipAddress.Split(':')[0];
                return $"{firstPart}:***";
            }
            
            return "masked_ip";
        }

        private string SanitizeUserAgent(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent)) return "unknown";
            
            // Truncate long user agents and remove potentially sensitive data
            var sanitized = userAgent.Length > 200 ? userAgent.Substring(0, 200) + "..." : userAgent;
            
            // Remove potentially sensitive patterns
            sanitized = System.Text.RegularExpressions.Regex.Replace(sanitized, 
                @"(password|token|key|secret)=[^;&\s]*", 
                "$1=***", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            return sanitized;
        }

        private string GenerateSessionId()
        {
            return Guid.NewGuid().ToString("N")[0..8];
        }

        private string GetSecurityLogPath()
        {
            var logDirectory = _configuration["Security:LogDirectory"] ?? "logs/security";
            Directory.CreateDirectory(logDirectory);
            
            var fileName = $"security_{DateTime.UtcNow:yyyy-MM-dd}.log";
            return Path.Combine(logDirectory, fileName);
        }
    }
}
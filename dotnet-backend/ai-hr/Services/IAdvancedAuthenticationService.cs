namespace ai_hr.Services
{
    public interface IAdvancedAuthenticationService
    {
        Task<AuthenticationAttemptResult> ValidateAuthenticationAttemptAsync(string email, string ipAddress, string userAgent);
        Task RecordAuthenticationAttemptAsync(string email, bool success, string ipAddress, string userAgent, string? failureReason = null);
        Task<bool> IsAccountLockedAsync(string email);
        Task LockAccountAsync(string email, string reason, string ipAddress, TimeSpan? duration = null);
        Task UnlockAccountAsync(string email, string adminUserId, string reason);
        Task<bool> RequiresTwoFactorAuthAsync(string userId);
        Task<string> GenerateTwoFactorCodeAsync(string userId, string method);
        Task<bool> ValidateTwoFactorCodeAsync(string userId, string code);
        Task<SessionSecurityInfo> CreateSecureSessionAsync(string userId, string ipAddress, string userAgent);
        Task InvalidateSessionAsync(string sessionId, string reason);
        Task<bool> IsSessionValidAsync(string sessionId);
        Task<List<ActiveSession>> GetActiveSessionsForUserAsync(string userId);
        Task InvalidateAllUserSessionsAsync(string userId, string reason);
        Task<PasswordSecurityResult> ValidatePasswordSecurityAsync(string password, string userId);
        Task RecordPasswordChangeAsync(string userId, string oldPasswordHash, string newPasswordHash, string ipAddress);
        Task<bool> IsPasswordRecentlyUsedAsync(string userId, string passwordHash);
        Task<AccountSecurityStatus> GetAccountSecurityStatusAsync(string userId);
    }

    public class AuthenticationAttemptResult
    {
        public bool IsAllowed { get; set; }
        public string? BlockReason { get; set; }
        public TimeSpan? LockoutDuration { get; set; }
        public int FailedAttemptsCount { get; set; }
        public int RemainingAttempts { get; set; }
        public bool RequiresCaptcha { get; set; }
        public bool RequiresAdditionalVerification { get; set; }
    }

    public class SessionSecurityInfo
    {
        public string SessionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public bool IsSecure { get; set; }
        public Dictionary<string, object> SecurityMetadata { get; set; } = new();
    }

    public class ActiveSession
    {
        public string SessionId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastAccessedAt { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string DeviceInfo { get; set; } = string.Empty;
        public bool IsCurrent { get; set; }
    }

    public class PasswordSecurityResult
    {
        public bool IsSecure { get; set; }
        public List<string> Violations { get; set; } = new();
        public int StrengthScore { get; set; }
        public bool IsCompromised { get; set; }
        public bool IsReused { get; set; }
    }

    public class AccountSecurityStatus
    {
        public string UserId { get; set; } = string.Empty;
        public bool IsLocked { get; set; }
        public int FailedLoginAttempts { get; set; }
        public DateTime? LastSuccessfulLogin { get; set; }
        public DateTime? LastFailedLogin { get; set; }
        public int ActiveSessionCount { get; set; }
        public DateTime? PasswordLastChanged { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public List<string> SecurityAlerts { get; set; } = new();
        public int SecurityScore { get; set; }
    }
}
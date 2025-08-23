namespace ai_hr.Services
{
    public interface ISecurityLoggingService
    {
        Task LogAuthenticationAttemptAsync(string email, bool success, string ipAddress, string userAgent, string? failureReason = null);
        Task LogAuthenticationSuccessAsync(string userId, string email, string ipAddress, string userAgent);
        Task LogUnauthorizedAccessAsync(string endpoint, string? userId, string ipAddress, string userAgent, string reason);
        Task LogSuspiciousActivityAsync(string activity, string? userId, string ipAddress, string userAgent, string details);
        Task LogPasswordChangeAsync(string userId, string ipAddress, string userAgent);
        Task LogAccountLockoutAsync(string email, string ipAddress, string reason);
        Task LogTokenRevocationAsync(string userId, string tokenId, string reason, string ipAddress);
        Task LogPrivilegeEscalationAttemptAsync(string userId, string requestedAction, string ipAddress, string userAgent);
        Task LogDataAccessAsync(string userId, string dataType, string action, string resourceId, string ipAddress);
        Task LogSecurityConfigurationChangeAsync(string adminUserId, string changeType, string details, string ipAddress);
        Task LogExternalApiCallAsync(string service, string action, bool success, string? userId, string? errorDetails = null);
        Task LogRateLimitExceededAsync(string ipAddress, string endpoint, int requestCount, string timeWindow);
        Task LogInputValidationFailureAsync(string endpoint, string? userId, string ipAddress, string validationErrors);
    }
}
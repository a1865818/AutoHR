namespace ai_hr.Services
{
    public interface ISecureExternalApiService
    {
        Task<SecureApiResult<T>> ExecuteSecureApiCallAsync<T>(
            string service,
            string action,
            string userId,
            Func<Task<T>> apiCall,
            int maxRetries = 3,
            int timeoutSeconds = 30
        );

        Task<bool> ValidateApiCredentialsAsync(string service, string userId);
        Task InvalidateApiCredentialsAsync(string service, string userId, string reason);
        Task<string> GetSecureApiKeyAsync(string service, string userId);
        Task LogApiAbuseAsync(string service, string userId, string ipAddress, string details);
    }

    public class SecureApiResult<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ErrorCode { get; set; }
        public int AttemptsMade { get; set; }
        public TimeSpan Duration { get; set; }
        public bool IsRetryable { get; set; }
    }

    public class ApiCredentialValidationResult
    {
        public bool IsValid { get; set; }
        public string? Reason { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool RequiresRefresh { get; set; }
    }
}
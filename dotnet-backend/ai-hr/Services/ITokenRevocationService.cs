namespace ai_hr.Services
{
    public interface ITokenRevocationService
    {
        Task RevokeTokenAsync(string tokenId, string userId, string reason, string ipAddress);
        Task RevokeAllUserTokensAsync(string userId, string reason, string ipAddress);
        Task<bool> IsTokenRevokedAsync(string tokenId);
        Task<bool> IsTokenValidAsync(string token);
        Task CleanupExpiredTokensAsync();
        Task<List<string>> GetActiveTokensForUserAsync(string userId);
        Task<TokenValidationResult> ValidateTokenAsync(string token, string? expectedUserId = null);
    }

    public class TokenValidationResult
    {
        public bool IsValid { get; set; }
        public string? UserId { get; set; }
        public string? TokenId { get; set; }
        public string? FailureReason { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
    }
}
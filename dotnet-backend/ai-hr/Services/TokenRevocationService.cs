using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ai_hr.Models;

namespace ai_hr.Services
{
    public class TokenRevocationService : ITokenRevocationService
    {
        private readonly IMemoryCache _cache;
        private readonly ISecurityLoggingService _securityLogger;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TokenRevocationService> _logger;
        private readonly JwtSecurityTokenHandler _tokenHandler;
        private const string REVOKED_TOKENS_KEY = "revoked_tokens";
        private const string USER_TOKENS_KEY_PREFIX = "user_tokens_";

        public TokenRevocationService(
            IMemoryCache cache, 
            ISecurityLoggingService securityLogger,
            IConfiguration configuration,
            ILogger<TokenRevocationService> logger)
        {
            _cache = cache;
            _securityLogger = securityLogger;
            _configuration = configuration;
            _logger = logger;
            _tokenHandler = new JwtSecurityTokenHandler();
        }

        public async Task RevokeTokenAsync(string tokenId, string userId, string reason, string ipAddress)
        {
            try
            {
                var revokedToken = new RevokedToken
                {
                    TokenId = tokenId,
                    UserId = userId,
                    RevokedAt = DateTime.UtcNow,
                    Reason = reason,
                    RevokedFromIp = ipAddress
                };

                // Add to revoked tokens cache
                var revokedTokens = GetRevokedTokens();
                revokedTokens[tokenId] = revokedToken;
                
                _cache.Set(REVOKED_TOKENS_KEY, revokedTokens, TimeSpan.FromDays(30)); // Keep for 30 days

                // Remove from user's active tokens
                var userTokensKey = $"{USER_TOKENS_KEY_PREFIX}{userId}";
                var userTokens = _cache.Get<HashSet<string>>(userTokensKey) ?? new HashSet<string>();
                userTokens.Remove(tokenId);
                _cache.Set(userTokensKey, userTokens, TimeSpan.FromDays(7));

                await _securityLogger.LogTokenRevocationAsync(userId, tokenId, reason, ipAddress);
                
                _logger.LogInformation("Token {TokenId} revoked for user {UserId} - Reason: {Reason}", 
                    tokenId, userId, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to revoke token {TokenId} for user {UserId}", tokenId, userId);
                throw;
            }
        }

        public async Task RevokeAllUserTokensAsync(string userId, string reason, string ipAddress)
        {
            try
            {
                var userTokensKey = $"{USER_TOKENS_KEY_PREFIX}{userId}";
                var userTokens = _cache.Get<HashSet<string>>(userTokensKey) ?? new HashSet<string>();

                var revokedTokens = GetRevokedTokens();
                var revokedCount = 0;

                foreach (var tokenId in userTokens)
                {
                    var revokedToken = new RevokedToken
                    {
                        TokenId = tokenId,
                        UserId = userId,
                        RevokedAt = DateTime.UtcNow,
                        Reason = $"Bulk revocation: {reason}",
                        RevokedFromIp = ipAddress
                    };

                    revokedTokens[tokenId] = revokedToken;
                    revokedCount++;
                }

                _cache.Set(REVOKED_TOKENS_KEY, revokedTokens, TimeSpan.FromDays(30));
                _cache.Remove(userTokensKey); // Clear all user tokens

                await _securityLogger.LogTokenRevocationAsync(userId, $"ALL_TOKENS_{revokedCount}", reason, ipAddress);
                
                _logger.LogInformation("All {Count} tokens revoked for user {UserId} - Reason: {Reason}", 
                    revokedCount, userId, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to revoke all tokens for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> IsTokenRevokedAsync(string tokenId)
        {
            try
            {
                var revokedTokens = GetRevokedTokens();
                var isRevoked = revokedTokens.ContainsKey(tokenId);
                
                if (isRevoked)
                {
                    _logger.LogDebug("Token {TokenId} is revoked", tokenId);
                }
                
                return await Task.FromResult(isRevoked);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check if token {TokenId} is revoked", tokenId);
                return true; // Fail secure - assume revoked if we can't check
            }
        }

        public async Task<bool> IsTokenValidAsync(string token)
        {
            var validationResult = await ValidateTokenAsync(token);
            return validationResult.IsValid;
        }

        public async Task<TokenValidationResult> ValidateTokenAsync(string token, string? expectedUserId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return new TokenValidationResult 
                    { 
                        IsValid = false, 
                        FailureReason = "Token is null or empty" 
                    };
                }

                // Parse token without validation first to get claims
                var jsonToken = _tokenHandler.ReadJwtToken(token);
                var tokenId = jsonToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
                var userId = jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(tokenId))
                {
                    return new TokenValidationResult 
                    { 
                        IsValid = false, 
                        FailureReason = "Token missing JTI claim" 
                    };
                }

                // Check if token is revoked
                if (await IsTokenRevokedAsync(tokenId))
                {
                    return new TokenValidationResult 
                    { 
                        IsValid = false, 
                        TokenId = tokenId,
                        UserId = userId,
                        IsRevoked = true,
                        FailureReason = "Token has been revoked" 
                    };
                }

                // Validate token signature and expiration
                var jwtSettings = _configuration.GetSection("Jwt").Get<JwtSettings>();
                var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? jwtSettings?.SecretKey;

                if (string.IsNullOrEmpty(secretKey))
                {
                    _logger.LogError("JWT SecretKey not configured for token validation");
                    return new TokenValidationResult 
                    { 
                        IsValid = false, 
                        FailureReason = "JWT configuration error" 
                    };
                }

                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings?.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSettings?.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = _tokenHandler.ValidateToken(token, tokenValidationParameters, out var validatedToken);

                // Additional validation for expected user ID
                if (!string.IsNullOrEmpty(expectedUserId) && userId != expectedUserId)
                {
                    return new TokenValidationResult 
                    { 
                        IsValid = false, 
                        TokenId = tokenId,
                        UserId = userId,
                        FailureReason = "Token user ID mismatch" 
                    };
                }

                return new TokenValidationResult 
                { 
                    IsValid = true,
                    TokenId = tokenId,
                    UserId = userId,
                    ExpiresAt = validatedToken.ValidTo,
                    IsRevoked = false
                };
            }
            catch (SecurityTokenExpiredException)
            {
                return new TokenValidationResult 
                { 
                    IsValid = false, 
                    FailureReason = "Token has expired" 
                };
            }
            catch (SecurityTokenException ex)
            {
                return new TokenValidationResult 
                { 
                    IsValid = false, 
                    FailureReason = $"Token validation failed: {ex.Message}" 
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during token validation");
                return new TokenValidationResult 
                { 
                    IsValid = false, 
                    FailureReason = "Token validation error" 
                };
            }
        }

        public async Task CleanupExpiredTokensAsync()
        {
            try
            {
                var revokedTokens = GetRevokedTokens();
                var cutoffDate = DateTime.UtcNow.AddDays(-30); // Remove tokens revoked more than 30 days ago
                
                var expiredTokens = revokedTokens
                    .Where(kvp => kvp.Value.RevokedAt < cutoffDate)
                    .Select(kvp => kvp.Key)
                    .ToList();

                foreach (var tokenId in expiredTokens)
                {
                    revokedTokens.Remove(tokenId);
                }

                _cache.Set(REVOKED_TOKENS_KEY, revokedTokens, TimeSpan.FromDays(30));

                _logger.LogInformation("Cleaned up {Count} expired revoked tokens", expiredTokens.Count);
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup expired tokens");
            }
        }

        public async Task<List<string>> GetActiveTokensForUserAsync(string userId)
        {
            try
            {
                var userTokensKey = $"{USER_TOKENS_KEY_PREFIX}{userId}";
                var userTokens = _cache.Get<HashSet<string>>(userTokensKey) ?? new HashSet<string>();
                
                // Filter out revoked tokens
                var revokedTokens = GetRevokedTokens();
                var activeTokens = userTokens.Where(tokenId => !revokedTokens.ContainsKey(tokenId)).ToList();

                return await Task.FromResult(activeTokens);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get active tokens for user {UserId}", userId);
                return new List<string>();
            }
        }

        public void RegisterToken(string tokenId, string userId)
        {
            try
            {
                var userTokensKey = $"{USER_TOKENS_KEY_PREFIX}{userId}";
                var userTokens = _cache.Get<HashSet<string>>(userTokensKey) ?? new HashSet<string>();
                userTokens.Add(tokenId);
                
                _cache.Set(userTokensKey, userTokens, TimeSpan.FromDays(7));
                
                _logger.LogDebug("Registered token {TokenId} for user {UserId}", tokenId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to register token {TokenId} for user {UserId}", tokenId, userId);
            }
        }

        private Dictionary<string, RevokedToken> GetRevokedTokens()
        {
            return _cache.Get<Dictionary<string, RevokedToken>>(REVOKED_TOKENS_KEY) 
                ?? new Dictionary<string, RevokedToken>();
        }
    }

    internal class RevokedToken
    {
        public string TokenId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime RevokedAt { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string RevokedFromIp { get; set; } = string.Empty;
    }
}
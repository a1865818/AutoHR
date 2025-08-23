using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;

namespace ai_hr.Services
{
    public class SecureExternalApiService : ISecureExternalApiService
    {
        private readonly ILogger<SecureExternalApiService> _logger;
        private readonly ISecurityLoggingService _securityLogger;
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _configuration;
        private const string API_RATE_LIMIT_KEY_PREFIX = "api_rate_limit_";
        private const string API_CREDENTIALS_KEY_PREFIX = "api_credentials_";

        public SecureExternalApiService(
            ILogger<SecureExternalApiService> logger,
            ISecurityLoggingService securityLogger,
            IMemoryCache cache,
            IConfiguration configuration)
        {
            _logger = logger;
            _securityLogger = securityLogger;
            _cache = cache;
            _configuration = configuration;
        }

        public async Task<SecureApiResult<T>> ExecuteSecureApiCallAsync<T>(
            string service,
            string action,
            string userId,
            Func<Task<T>> apiCall,
            int maxRetries = 3,
            int timeoutSeconds = 30)
        {
            var stopwatch = Stopwatch.StartNew();
            var attemptsMade = 0;
            Exception? lastException = null;

            // Check rate limiting
            if (!await CheckRateLimitAsync(service, userId))
            {
                await _securityLogger.LogExternalApiCallAsync(service, action, false, userId, "Rate limit exceeded");
                return new SecureApiResult<T>
                {
                    Success = false,
                    ErrorMessage = "Rate limit exceeded for external API calls",
                    ErrorCode = "RATE_LIMIT_EXCEEDED",
                    AttemptsMade = 0,
                    Duration = stopwatch.Elapsed,
                    IsRetryable = false
                };
            }

            // Validate API credentials
            if (!await ValidateApiCredentialsAsync(service, userId))
            {
                await _securityLogger.LogExternalApiCallAsync(service, action, false, userId, "Invalid credentials");
                return new SecureApiResult<T>
                {
                    Success = false,
                    ErrorMessage = "Invalid or expired API credentials",
                    ErrorCode = "INVALID_CREDENTIALS",
                    AttemptsMade = 0,
                    Duration = stopwatch.Elapsed,
                    IsRetryable = false
                };
            }

            for (attemptsMade = 1; attemptsMade <= maxRetries; attemptsMade++)
            {
                try
                {
                    _logger.LogInformation("Executing {Service}.{Action} for user {UserId} (attempt {Attempt}/{MaxRetries})",
                        service, action, userId, attemptsMade, maxRetries);

                    // Execute API call with timeout
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
                    var result = await ExecuteWithTimeoutAsync(apiCall, cts.Token);

                    await _securityLogger.LogExternalApiCallAsync(service, action, true, userId);

                    stopwatch.Stop();
                    return new SecureApiResult<T>
                    {
                        Success = true,
                        Data = result,
                        AttemptsMade = attemptsMade,
                        Duration = stopwatch.Elapsed,
                        IsRetryable = false
                    };
                }
                catch (OperationCanceledException) when (attemptsMade < maxRetries)
                {
                    lastException = new TimeoutException($"API call to {service}.{action} timed out after {timeoutSeconds} seconds");
                    _logger.LogWarning("API call timed out on attempt {Attempt}: {Service}.{Action}",
                        attemptsMade, service, action);
                    
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attemptsMade))); // Exponential backoff
                }
                catch (HttpRequestException ex) when (IsRetryableHttpError(ex) && attemptsMade < maxRetries)
                {
                    lastException = ex;
                    _logger.LogWarning("Retryable HTTP error on attempt {Attempt}: {Service}.{Action} - {Error}",
                        attemptsMade, service, action, ex.Message);
                    
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attemptsMade)));
                }
                catch (Exception ex) when (attemptsMade < maxRetries && IsRetryableError(ex))
                {
                    lastException = ex;
                    _logger.LogWarning("Retryable error on attempt {Attempt}: {Service}.{Action} - {Error}",
                        attemptsMade, service, action, ex.Message);
                    
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attemptsMade)));
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogError(ex, "Non-retryable error in {Service}.{Action} for user {UserId}",
                        service, action, userId);
                    break;
                }
            }

            await _securityLogger.LogExternalApiCallAsync(service, action, false, userId, lastException?.Message);

            stopwatch.Stop();
            var errorMessage = lastException?.Message ?? "Unknown error";
            var errorCode = GetErrorCode(lastException);
            var isRetryable = IsRetryableError(lastException);

            return new SecureApiResult<T>
            {
                Success = false,
                ErrorMessage = errorMessage,
                ErrorCode = errorCode,
                AttemptsMade = attemptsMade,
                Duration = stopwatch.Elapsed,
                IsRetryable = isRetryable
            };
        }

        public async Task<bool> ValidateApiCredentialsAsync(string service, string userId)
        {
            try
            {
                var cacheKey = $"{API_CREDENTIALS_KEY_PREFIX}{service}_{userId}";
                var cachedResult = _cache.Get<ApiCredentialValidationResult>(cacheKey);

                if (cachedResult != null)
                {
                    if (cachedResult.IsValid && cachedResult.ExpiresAt > DateTime.UtcNow.AddMinutes(5))
                    {
                        return true;
                    }
                    
                    if (!cachedResult.IsValid)
                    {
                        return false;
                    }
                }

                // Perform actual credential validation based on service
                var validationResult = service.ToLower() switch
                {
                    "gmail" => await ValidateGmailCredentialsAsync(userId),
                    "calendar" => await ValidateCalendarCredentialsAsync(userId),
                    "google" => await ValidateGoogleCredentialsAsync(userId),
                    _ => new ApiCredentialValidationResult { IsValid = false, Reason = "Unsupported service" }
                };

                // Cache result
                var cacheExpiry = validationResult.IsValid ? TimeSpan.FromMinutes(15) : TimeSpan.FromMinutes(5);
                _cache.Set(cacheKey, validationResult, cacheExpiry);

                if (!validationResult.IsValid)
                {
                    _logger.LogWarning("API credentials validation failed for {Service} user {UserId}: {Reason}",
                        service, userId, validationResult.Reason);
                }

                return validationResult.IsValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating API credentials for {Service} user {UserId}", service, userId);
                return false; // Fail secure
            }
        }

        public async Task InvalidateApiCredentialsAsync(string service, string userId, string reason)
        {
            try
            {
                var cacheKey = $"{API_CREDENTIALS_KEY_PREFIX}{service}_{userId}";
                _cache.Remove(cacheKey);

                _logger.LogInformation("Invalidated API credentials for {Service} user {UserId} - Reason: {Reason}",
                    service, userId, reason);

                await _securityLogger.LogExternalApiCallAsync(service, "CREDENTIALS_INVALIDATED", true, userId, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating API credentials for {Service} user {UserId}", service, userId);
            }
        }

        public async Task<string> GetSecureApiKeyAsync(string service, string userId)
        {
            try
            {
                // In production, retrieve encrypted API keys from secure storage
                // For now, return a placeholder that indicates proper security should be implemented
                var envVarName = $"{service.ToUpper()}_API_KEY_{userId}";
                var apiKey = Environment.GetEnvironmentVariable(envVarName);

                if (string.IsNullOrEmpty(apiKey))
                {
                    throw new InvalidOperationException($"API key not configured for {service} user {userId}");
                }

                // Decrypt API key if stored encrypted
                return DecryptApiKey(apiKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving secure API key for {Service} user {UserId}", service, userId);
                throw new InvalidOperationException("Failed to retrieve secure API key");
            }
        }

        public async Task LogApiAbuseAsync(string service, string userId, string ipAddress, string details)
        {
            await _securityLogger.LogSuspiciousActivityAsync(
                $"API_ABUSE_{service.ToUpper()}",
                userId,
                ipAddress,
                "External API",
                details
            );

            _logger.LogError("API abuse detected for {Service} by user {UserId} from {IpAddress}: {Details}",
                service, userId, ipAddress, details);
        }

        private async Task<bool> CheckRateLimitAsync(string service, string userId)
        {
            var rateLimitKey = $"{API_RATE_LIMIT_KEY_PREFIX}{service}_{userId}";
            var currentCount = _cache.Get<int>(rateLimitKey);
            
            // Configure rate limits per service
            var maxRequests = service.ToLower() switch
            {
                "gmail" => 100, // 100 requests per hour
                "calendar" => 200, // 200 requests per hour
                "google" => 150, // 150 requests per hour
                _ => 50
            };

            if (currentCount >= maxRequests)
            {
                return false;
            }

            _cache.Set(rateLimitKey, currentCount + 1, TimeSpan.FromHours(1));
            return await Task.FromResult(true);
        }

        private async Task<ApiCredentialValidationResult> ValidateGmailCredentialsAsync(string userId)
        {
            try
            {
                // Implement Gmail-specific credential validation
                // This would typically involve checking OAuth tokens, refresh tokens, etc.
                await Task.Delay(100); // Simulate validation
                
                return new ApiCredentialValidationResult
                {
                    IsValid = true, // Placeholder - implement actual validation
                    ExpiresAt = DateTime.UtcNow.AddHours(1)
                };
            }
            catch (Exception ex)
            {
                return new ApiCredentialValidationResult
                {
                    IsValid = false,
                    Reason = $"Gmail validation error: {ex.Message}"
                };
            }
        }

        private async Task<ApiCredentialValidationResult> ValidateCalendarCredentialsAsync(string userId)
        {
            try
            {
                // Implement Calendar-specific credential validation
                await Task.Delay(100); // Simulate validation
                
                return new ApiCredentialValidationResult
                {
                    IsValid = true, // Placeholder - implement actual validation
                    ExpiresAt = DateTime.UtcNow.AddHours(1)
                };
            }
            catch (Exception ex)
            {
                return new ApiCredentialValidationResult
                {
                    IsValid = false,
                    Reason = $"Calendar validation error: {ex.Message}"
                };
            }
        }

        private async Task<ApiCredentialValidationResult> ValidateGoogleCredentialsAsync(string userId)
        {
            try
            {
                // Implement general Google API credential validation
                await Task.Delay(100); // Simulate validation
                
                return new ApiCredentialValidationResult
                {
                    IsValid = true, // Placeholder - implement actual validation
                    ExpiresAt = DateTime.UtcNow.AddHours(1)
                };
            }
            catch (Exception ex)
            {
                return new ApiCredentialValidationResult
                {
                    IsValid = false,
                    Reason = $"Google validation error: {ex.Message}"
                };
            }
        }

        private async Task<T> ExecuteWithTimeoutAsync<T>(Func<Task<T>> apiCall, CancellationToken cancellationToken)
        {
            try
            {
                return await apiCall().WaitAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw new TimeoutException("API call timed out");
            }
        }

        private bool IsRetryableHttpError(HttpRequestException ex)
        {
            var message = ex.Message.ToLower();
            return message.Contains("timeout") ||
                   message.Contains("connection") ||
                   message.Contains("network") ||
                   message.Contains("502") ||
                   message.Contains("503") ||
                   message.Contains("504");
        }

        private bool IsRetryableError(Exception? ex)
        {
            return ex switch
            {
                TimeoutException => true,
                HttpRequestException httpEx => IsRetryableHttpError(httpEx),
                TaskCanceledException => true,
                OperationCanceledException => true,
                _ => false
            };
        }

        private string GetErrorCode(Exception? ex)
        {
            return ex switch
            {
                TimeoutException => "TIMEOUT",
                HttpRequestException => "HTTP_ERROR",
                UnauthorizedAccessException => "UNAUTHORIZED",
                ArgumentException => "INVALID_ARGUMENT",
                InvalidOperationException => "INVALID_OPERATION",
                _ => "UNKNOWN_ERROR"
            };
        }

        private string DecryptApiKey(string encryptedKey)
        {
            try
            {
                // In production, implement proper encryption/decryption
                // This is a placeholder implementation
                if (encryptedKey.StartsWith("ENCRYPTED:"))
                {
                    var base64Key = encryptedKey.Substring("ENCRYPTED:".Length);
                    var encryptedBytes = Convert.FromBase64String(base64Key);
                    
                    // Use a proper encryption key from secure storage
                    var key = Encoding.UTF8.GetBytes(_configuration["Security:ApiKeyEncryptionKey"] ?? "DefaultKey1234567890123456789012"); // 32 bytes for AES-256
                    
                    using var aes = Aes.Create();
                    aes.Key = key.Take(32).ToArray();
                    aes.IV = new byte[16]; // In production, store IV with encrypted data
                    
                    using var decryptor = aes.CreateDecryptor();
                    var decryptedBytes = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);
                    
                    return Encoding.UTF8.GetString(decryptedBytes);
                }
                
                return encryptedKey; // Return as-is if not encrypted (for development)
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to decrypt API key");
                throw new InvalidOperationException("Failed to decrypt API key");
            }
        }
    }
}
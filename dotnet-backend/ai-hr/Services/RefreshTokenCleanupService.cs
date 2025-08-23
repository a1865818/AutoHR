using ai_hr.Models;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;

namespace ai_hr.Services
{
    public class RefreshTokenCleanupService : BackgroundService, IRefreshTokenCleanupService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RefreshTokenCleanupService> _logger;
        private readonly JwtSettings _jwtSettings;
        private readonly TimeSpan _cleanupInterval;
        private DateTime _lastCleanupRun = DateTime.MinValue;

        public RefreshTokenCleanupService(
            IServiceScopeFactory scopeFactory,
            ILogger<RefreshTokenCleanupService> logger,
            IOptions<JwtSettings> jwtSettings)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _jwtSettings = jwtSettings.Value;
            _cleanupInterval = TimeSpan.FromHours(6); // Run cleanup every 6 hours
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RefreshTokenCleanupService starting up");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredRefreshTokensAsync();
                    _lastCleanupRun = DateTime.UtcNow;
                    
                    _logger.LogDebug("Next cleanup scheduled in {Hours} hours", _cleanupInterval.TotalHours);
                    await Task.Delay(_cleanupInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("RefreshTokenCleanupService stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during refresh token cleanup");
                    // Wait a shorter time before retrying on error
                    await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
                }
            }

            _logger.LogInformation("RefreshTokenCleanupService stopped");
        }

        public async Task CleanupExpiredRefreshTokensAsync()
        {
            try
            {
                _logger.LogInformation("Starting expired refresh token cleanup");

                var applicationUserCount = await CleanupExpiredApplicationUserTokensAsync();
                var hiringUserCount = await CleanupExpiredHiringUserTokensAsync();
                var totalCount = applicationUserCount + hiringUserCount;

                if (totalCount > 0)
                {
                    _logger.LogInformation("Cleaned up {TotalCount} expired refresh tokens ({AppUserCount} ApplicationUser, {HiringUserCount} HiringUser)",
                        totalCount, applicationUserCount, hiringUserCount);
                }
                else
                {
                    _logger.LogDebug("No expired refresh tokens found during cleanup");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup expired refresh tokens");
                throw;
            }
        }

        public async Task<int> CleanupExpiredApplicationUserTokensAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var supabaseClient = scope.ServiceProvider.GetRequiredService<Supabase.Client>();
                
                var cutoffDate = DateTime.UtcNow;

                // Get all ApplicationUsers with expired refresh tokens
                // Note: We need to check for not-null separately because of Supabase query limitations
                var expiredUsersResponse = await supabaseClient
                    .From<ApplicationUser>()
                    .Not("RefreshTokenExpiry", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Not("RefreshToken", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Where(u => u.RefreshTokenExpiry <= cutoffDate)
                    .Get();

                var expiredUsers = expiredUsersResponse.Models.ToList();

                if (!expiredUsers.Any())
                {
                    return 0;
                }

                _logger.LogDebug("Found {Count} ApplicationUsers with expired refresh tokens", expiredUsers.Count);

                var cleanedCount = 0;
                foreach (var user in expiredUsers)
                {
                    try
                    {
                        // Clear the expired refresh token
                        user.RefreshToken = null;
                        user.RefreshTokenExpiry = null;

                        await supabaseClient
                            .From<ApplicationUser>()
                            .Where(u => u.Id == user.Id)
                            .Update(user);

                        cleanedCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to clean up expired token for ApplicationUser {UserId}", user.Id);
                    }
                }

                _logger.LogDebug("Cleaned up {Count} expired ApplicationUser refresh tokens", cleanedCount);
                return cleanedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup expired ApplicationUser refresh tokens");
                throw;
            }
        }

        public async Task<int> CleanupExpiredHiringUserTokensAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var supabaseClient = scope.ServiceProvider.GetRequiredService<Supabase.Client>();
                
                var cutoffDate = DateTime.UtcNow;

                // Get all HiringUsers with expired refresh tokens
                // Note: We need to check for not-null separately because of Supabase query limitations
                var expiredUsersResponse = await supabaseClient
                    .From<HiringUserProfile>()
                    .Not("RefreshTokenExpiry", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Not("RefreshToken", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Where(u => u.RefreshTokenExpiry <= cutoffDate)
                    .Get();

                var expiredUsers = expiredUsersResponse.Models.ToList();

                if (!expiredUsers.Any())
                {
                    return 0;
                }

                _logger.LogDebug("Found {Count} HiringUsers with expired refresh tokens", expiredUsers.Count);

                var cleanedCount = 0;
                foreach (var user in expiredUsers)
                {
                    try
                    {
                        // Clear the expired refresh token
                        user.RefreshToken = null;
                        user.RefreshTokenExpiry = null;

                        await supabaseClient
                            .From<HiringUserProfile>()
                            .Where(u => u.Id == user.Id)
                            .Update(user);

                        cleanedCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to clean up expired token for HiringUser {UserId}", user.Id);
                    }
                }

                _logger.LogDebug("Cleaned up {Count} expired HiringUser refresh tokens", cleanedCount);
                return cleanedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup expired HiringUser refresh tokens");
                throw;
            }
        }

        public async Task<int> GetExpiredTokenCountAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var supabaseClient = scope.ServiceProvider.GetRequiredService<Supabase.Client>();
                
                var cutoffDate = DateTime.UtcNow;

                // Count expired ApplicationUser tokens
                var expiredAppUsersResponse = await supabaseClient
                    .From<ApplicationUser>()
                    .Not("RefreshTokenExpiry", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Not("RefreshToken", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Where(u => u.RefreshTokenExpiry <= cutoffDate)
                    .Get();

                // Count expired HiringUser tokens
                var expiredHiringUsersResponse = await supabaseClient
                    .From<HiringUserProfile>()
                    .Not("RefreshTokenExpiry", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Not("RefreshToken", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Where(u => u.RefreshTokenExpiry <= cutoffDate)
                    .Get();

                var totalExpired = expiredAppUsersResponse.Models.Count() + expiredHiringUsersResponse.Models.Count();
                return totalExpired;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get expired token count");
                return 0;
            }
        }

        public async Task<CleanupStatistics> GetCleanupStatisticsAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var supabaseClient = scope.ServiceProvider.GetRequiredService<Supabase.Client>();
                
                var cutoffDate = DateTime.UtcNow;

                // Count expired ApplicationUser tokens
                var expiredAppUsersResponse = await supabaseClient
                    .From<ApplicationUser>()
                    .Not("RefreshTokenExpiry", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Not("RefreshToken", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Where(u => u.RefreshTokenExpiry <= cutoffDate)
                    .Get();

                // Count expired HiringUser tokens
                var expiredHiringUsersResponse = await supabaseClient
                    .From<HiringUserProfile>()
                    .Not("RefreshTokenExpiry", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Not("RefreshToken", Supabase.Postgrest.Constants.Operator.Is, "null")
                    .Where(u => u.RefreshTokenExpiry <= cutoffDate)
                    .Get();

                var nextCleanupTime = _lastCleanupRun.Add(_cleanupInterval);
                var nextCleanupIn = nextCleanupTime > DateTime.UtcNow 
                    ? nextCleanupTime - DateTime.UtcNow 
                    : TimeSpan.Zero;

                return new CleanupStatistics
                {
                    ExpiredApplicationUserTokens = expiredAppUsersResponse.Models.Count(),
                    ExpiredHiringUserTokens = expiredHiringUsersResponse.Models.Count(),
                    LastCleanupRun = _lastCleanupRun,
                    NextCleanupIn = nextCleanupIn
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get cleanup statistics");
                return new CleanupStatistics
                {
                    LastCleanupRun = _lastCleanupRun,
                    NextCleanupIn = TimeSpan.Zero
                };
            }
        }
    }
}
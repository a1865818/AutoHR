namespace ai_hr.Services
{
    public interface IRefreshTokenCleanupService
    {
        Task CleanupExpiredRefreshTokensAsync();
        Task<int> CleanupExpiredApplicationUserTokensAsync();
        Task<int> CleanupExpiredHiringUserTokensAsync();
        Task<int> GetExpiredTokenCountAsync();
        Task<CleanupStatistics> GetCleanupStatisticsAsync();
    }

    public class CleanupStatistics
    {
        public int ExpiredApplicationUserTokens { get; set; }
        public int ExpiredHiringUserTokens { get; set; }
        public int TotalExpiredTokens => ExpiredApplicationUserTokens + ExpiredHiringUserTokens;
        public DateTime LastCleanupRun { get; set; }
        public TimeSpan NextCleanupIn { get; set; }
    }
}
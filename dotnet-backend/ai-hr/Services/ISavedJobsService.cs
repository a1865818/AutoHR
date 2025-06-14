namespace ai_hr.Services
{
    public interface ISavedJobsService
    {
        Task<bool> SaveJobAsync(string userId, string jobId);
        Task<bool> UnsaveJobAsync(string userId, string jobId);
        Task<List<string>> GetSavedJobIdsAsync(string userId);
        Task<bool> IsJobSavedAsync(string userId, string jobId);
    }
}
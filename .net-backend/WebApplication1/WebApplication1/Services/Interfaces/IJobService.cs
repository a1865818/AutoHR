using WebApplication1.Entities;

namespace WebApplication1.Services.Interfaces
{
    public interface IJobService
    {
        Task<IEnumerable<Jobs>> GetAllJobsAsync();
        Task<IEnumerable<Jobs>> GetJobsByStatusAsync(string status);
        Task<IEnumerable<Jobs>> GetJobsByCompanyAsync(string company);
        Task<IEnumerable<Jobs>> SearchJobsAsync(string searchTerm);
        Task<Jobs?> GetJobByIdAsync(Guid id);
        Task<Jobs> CreateJobAsync(Jobs job, string userId);
        Task<Jobs?> UpdateJobAsync(Guid id, Jobs job);
        Task<bool> DeleteJobAsync(Guid id);
        Task<bool> IncrementApplicantsAsync(Guid id);
    }
}
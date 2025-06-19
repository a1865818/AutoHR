
using ai_hr.Models;
using Supabase;
using System.Security.Claims;
namespace ai_hr.Services
{
    public interface IJobViewTrackingService
    {
        Task<bool> RecordJobViewAsync(Guid jobId, ClaimsPrincipal? user, string? sessionId, string? ipAddress, string? userAgent, string? referrer);
        Task<int> GetJobViewCountAsync(Guid jobId);
        Task<bool> HasUserViewedJobAsync(Guid jobId, ClaimsPrincipal? user, string? sessionId);
        Task UpdateJobViewCountAsync(Guid jobId, Supabase.Client client);
    }
}

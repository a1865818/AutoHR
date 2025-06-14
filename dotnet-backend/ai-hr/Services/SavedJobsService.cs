using ai_hr.Models;
using Supabase;

namespace ai_hr.Services
{
    public class SavedJobsService : ISavedJobsService
    {
        private readonly Client _supabaseClient;
        private readonly ILogger<SavedJobsService> _logger;

        public SavedJobsService(Client supabaseClient, ILogger<SavedJobsService> logger)
        {
            _supabaseClient = supabaseClient;
            _logger = logger;
        }

        public async Task<bool> SaveJobAsync(string userId, string jobId)
        {
            try
            {
                // Get the current user
                var userResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == userId)
                    .Single();

                if (userResponse == null)
                {
                    _logger.LogWarning($"User with ID {userId} not found");
                    return false;
                }

                // Initialize SavedJobs list if null
                if (userResponse.SavedJobs == null)
                {
                    userResponse.SavedJobs = new List<string>();
                }

                // Add job ID if not already saved
                if (!userResponse.SavedJobs.Contains(jobId))
                {
                    userResponse.SavedJobs.Add(jobId);

                    // Update the user in database
                    await _supabaseClient
                        .From<ApplicationUser>()
                        .Where(u => u.Id == userId)
                        .Update(userResponse);

                    _logger.LogInformation($"Job {jobId} saved for user {userId}");
                    return true;
                }

                _logger.LogInformation($"Job {jobId} already saved for user {userId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving job {jobId} for user {userId}");
                return false;
            }
        }

        public async Task<bool> UnsaveJobAsync(string userId, string jobId)
        {
            try
            {
                // Get the current user
                var userResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == userId)
                    .Single();

                if (userResponse == null)
                {
                    _logger.LogWarning($"User with ID {userId} not found");
                    return false;
                }

                // Remove job ID if it exists
                if (userResponse.SavedJobs != null && userResponse.SavedJobs.Contains(jobId))
                {
                    userResponse.SavedJobs.Remove(jobId);

                    // Update the user in database
                    await _supabaseClient
                        .From<ApplicationUser>()
                        .Where(u => u.Id == userId)
                        .Update(userResponse);

                    _logger.LogInformation($"Job {jobId} unsaved for user {userId}");
                    return true;
                }

                _logger.LogInformation($"Job {jobId} was not saved for user {userId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error unsaving job {jobId} for user {userId}");
                return false;
            }
        }

        public async Task<List<string>> GetSavedJobIdsAsync(string userId)
        {
            try
            {
                var userResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == userId)
                    .Single();

                if (userResponse?.SavedJobs == null)
                {
                    return new List<string>();
                }

                return userResponse.SavedJobs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting saved jobs for user {userId}");
                return new List<string>();
            }
        }

        public async Task<bool> IsJobSavedAsync(string userId, string jobId)
        {
            try
            {
                var savedJobIds = await GetSavedJobIdsAsync(userId);
                return savedJobIds.Contains(jobId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking if job {jobId} is saved for user {userId}");
                return false;
            }
        }
    }
}
using ai_hr.Models;
using Supabase;
using System.Security.Claims;

namespace ai_hr.Services
{
    public class JobViewTrackingService : IJobViewTrackingService
    {
        private readonly Supabase.Client _client;
        public JobViewTrackingService(Supabase.Client client)
        {
            _client = client;
        }

        public async Task<bool> RecordJobViewAsync(
            Guid jobId,
            ClaimsPrincipal? user,
            string? sessionId,
            string? ipAddress,
            string? userAgent,
            string? referrer)
        {
            try
            {
                Console.WriteLine($"🔍 BACKEND: RecordJobViewAsync called for job {jobId}");
                Console.WriteLine($"🔍 BACKEND: SessionId: {sessionId}");
                Console.WriteLine($"🔍 BACKEND: UserAgent: {userAgent?.Substring(0, Math.Min(50, userAgent?.Length ?? 0))}...");

                // Extract user information
                var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userType = DetermineUserType(user);

                Console.WriteLine($"🔍 BACKEND: UserId: '{userId}', UserType: {userType}");

                // Check if this user/session has already viewed this job
                var hasViewed = await HasUserViewedJobAsync(jobId, user, sessionId);
                Console.WriteLine($"🔍 BACKEND: HasViewed check result: {hasViewed}");

                if (hasViewed)
                {
                    Console.WriteLine($"🔍 BACKEND: User/session has already viewed job {jobId}, skipping view count increment");
                    return false; // No new view recorded
                }

                // Get current view count before inserting
                var currentViewCount = await GetJobViewCountAsync(jobId);
                Console.WriteLine($"🔍 BACKEND: Current view count before insert: {currentViewCount}");

                // Create new job view record
                var jobView = new JobView
                {
                    JobId = jobId,
                    UserId = !string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var userGuid) ? userGuid : null,
                    SessionId = sessionId,
                    UserType = userType,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Referrer = referrer,
                    ViewedAt = DateTime.UtcNow
                };

                Console.WriteLine($"🔍 BACKEND: Inserting JobView record for {userType} user...");
                Console.WriteLine($"🔍 BACKEND: - JobId: {jobView.JobId}");
                Console.WriteLine($"🔍 BACKEND: - UserId: {jobView.UserId}");
                Console.WriteLine($"🔍 BACKEND: - SessionId: {jobView.SessionId}");
                Console.WriteLine($"🔍 BACKEND: - UserType: {jobView.UserType}");

                // Insert the view record
                await _client.From<JobView>().Insert(jobView);
                Console.WriteLine($"🔍 BACKEND: JobView record inserted successfully");

                // Get view count after inserting
                var newViewCount = await GetJobViewCountAsync(jobId);
                Console.WriteLine($"🔍 BACKEND: View count after insert: {newViewCount}");

                // Update the job's view count
                Console.WriteLine($"🔍 BACKEND: Updating job view count...");
                await UpdateJobViewCountAsync(jobId, _client);
                Console.WriteLine($"🔍 BACKEND: Job view count updated");

                Console.WriteLine($"✅ BACKEND: Successfully recorded new view for job {jobId} by {userType} user");
                return true; // New view recorded
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ BACKEND: Error recording job view: {ex.Message}");
                Console.WriteLine($"❌ BACKEND: Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        public async Task<int> GetJobViewCountAsync(Guid jobId)
        {
            try
            {
                var response = await _client.From<JobView>()
                    .Where(jv => jv.JobId == jobId)
                    .Get();

                return response.Models?.Count ?? 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error getting job view count: {ex.Message}");
                return 0;
            }
        }

        public async Task<bool> HasUserViewedJobAsync(Guid jobId, ClaimsPrincipal? user, string? sessionId)
        {
            try
            {
                Console.WriteLine($"🔍 BACKEND: Checking if user has viewed job {jobId}");
                var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Console.WriteLine($"🔍 BACKEND: UserId: '{userId}', SessionId: '{sessionId}'");

                // Build query based on available identifiers
                var query = _client.From<JobView>().Where(jv => jv.JobId == jobId);

                if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var userGuid))
                {
                    // For authenticated users, check by user ID only
                    Console.WriteLine($"🔍 BACKEND: Checking by UserId: {userGuid}");
                    query = query.Where(jv => jv.UserId == userGuid);
                }
                else if (!string.IsNullOrEmpty(sessionId))
                {
                    // For anonymous users, check by session ID and ensure UserId is null
                    Console.WriteLine($"🔍 BACKEND: Checking by SessionId: {sessionId} (anonymous user)");
                    query = query.Where(jv => jv.SessionId == sessionId && jv.UserId == null);
                }
                else
                {
                    Console.WriteLine($"🔍 BACKEND: No valid identifier available, allowing view");
                    // No way to identify user, allow the view
                    return false;
                }

                var response = await query.Get();
                var existingViews = response.Models ?? new List<JobView>();
                var hasViewed = existingViews.Any();

                Console.WriteLine($"🔍 BACKEND: HasViewed result: {hasViewed}");
                Console.WriteLine($"🔍 BACKEND: Found {existingViews.Count} existing views");

                // Debug: Log existing views
                foreach (var view in existingViews.Take(3)) // Log first 3
                {
                    Console.WriteLine($"🔍 BACKEND: Existing view - UserId: {view.UserId}, SessionId: {view.SessionId}, ViewedAt: {view.ViewedAt}");
                }

                return hasViewed;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ BACKEND: Error checking if user viewed job: {ex.Message}");
                return false; // Default to allowing the view if we can't check
            }
        }
        public async Task UpdateJobViewCountAsync(Guid jobId, Supabase.Client client)
        {
            try
            {
                // Get actual view count
                var actualViewCount = await GetJobViewCountAsync(jobId);

                // Get current job
                var jobResponse = await client.From<Job>().Get();
                var job = jobResponse.Models.FirstOrDefault(j => j.Id == jobId);

                if (job == null)
                {
                    Console.WriteLine($"❌ Job {jobId} not found when updating view count");
                    return;
                }

                // Update if different
                if (job.ViewCount != actualViewCount)
                {
                    job.ViewCount = actualViewCount;
                    await client.From<Job>().Update(job);
                    Console.WriteLine($"✅ Updated view count for job {jobId} ({job.Title}): {actualViewCount} views");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error updating job view count: {ex.Message}");
            }
        }


        private string DetermineUserType(ClaimsPrincipal? user)
        {
            if (user?.Identity?.IsAuthenticated != true)
                return "Anonymous";

            // Check user claims to determine type
            var userCategory = user.FindFirst("UserCategory")?.Value;

            Console.WriteLine($"🔍 BACKEND: User claims - UserCategory: {userCategory}");

            return userCategory switch
            {
                "HiringUserProfile" => "HiringUser",
                "ApplicationUser" => "ApplicationUser", // ✅ Make sure this is correct
                _ => "Anonymous"
            };
        }
    }
}

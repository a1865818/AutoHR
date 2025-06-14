using ai_hr.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ai_hr.Endpoints
{
    public static class SavedJobsEndpoints
    {
        public static void MapSavedJobsEndpoints(this IEndpointRouteBuilder endpoints)
        {
            var group = endpoints.MapGroup("/api/saved-jobs").WithTags("Saved Jobs");

            // Save a job for the authenticated user
            group.MapPost("/{jobId}", SaveJobAsync)
                .WithName("SaveJob")
                .WithSummary("Save a job to user's favorites")
                .RequireAuthorization();

            // Remove a saved job for the authenticated user
            group.MapDelete("/{jobId}", UnsaveJobAsync)
                .WithName("UnsaveJob")
                .WithSummary("Remove a job from user's favorites")
                .RequireAuthorization();

            // Get all saved job IDs for the authenticated user
            group.MapGet("/", GetSavedJobIdsAsync)
                .WithName("GetSavedJobIds")
                .WithSummary("Get list of saved job IDs for user")
                .RequireAuthorization();

            // Check if a specific job is saved by the authenticated user
            group.MapGet("/check/{jobId}", IsJobSavedAsync)
                .WithName("IsJobSaved")
                .WithSummary("Check if a job is saved by user")
                .RequireAuthorization();
        }

        private static async Task<IResult> SaveJobAsync(
            string jobId,
            ISavedJobsService savedJobsService,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Results.Unauthorized();
                }

                if (string.IsNullOrEmpty(jobId))
                {
                    return Results.BadRequest("Job ID is required");
                }

                var success = await savedJobsService.SaveJobAsync(userId, jobId);
                if (success)
                {
                    return Results.Ok(new { message = "Job saved successfully", jobId });
                }

                return Results.Problem("Failed to save job");
            }
            catch (Exception ex)
            {
                return Results.Problem($"An error occurred: {ex.Message}");
            }
        }

        private static async Task<IResult> UnsaveJobAsync(
            string jobId,
            ISavedJobsService savedJobsService,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Results.Unauthorized();
                }

                if (string.IsNullOrEmpty(jobId))
                {
                    return Results.BadRequest("Job ID is required");
                }

                var success = await savedJobsService.UnsaveJobAsync(userId, jobId);
                if (success)
                {
                    return Results.Ok(new { message = "Job unsaved successfully", jobId });
                }

                return Results.Problem("Failed to unsave job");
            }
            catch (Exception ex)
            {
                return Results.Problem($"An error occurred: {ex.Message}");
            }
        }

        private static async Task<IResult> GetSavedJobIdsAsync(
            ISavedJobsService savedJobsService,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Results.Unauthorized();
                }

                var savedJobIds = await savedJobsService.GetSavedJobIdsAsync(userId);
                return Results.Ok(new { savedJobs = savedJobIds, count = savedJobIds.Count });
            }
            catch (Exception ex)
            {
                return Results.Problem($"An error occurred: {ex.Message}");
            }
        }

        private static async Task<IResult> IsJobSavedAsync(
            string jobId,
            ISavedJobsService savedJobsService,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Results.Unauthorized();
                }

                if (string.IsNullOrEmpty(jobId))
                {
                    return Results.BadRequest("Job ID is required");
                }

                var isSaved = await savedJobsService.IsJobSavedAsync(userId, jobId);
                return Results.Ok(new { jobId, isSaved });
            }
            catch (Exception ex)
            {
                return Results.Problem($"An error occurred: {ex.Message}");
            }
        }
    }
}
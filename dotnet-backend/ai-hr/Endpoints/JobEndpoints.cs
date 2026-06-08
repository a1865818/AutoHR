using ai_hr.Models;
using ai_hr.Contracts;
using ai_hr.Utils;
using Supabase;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;
using ai_hr.Services;
using System.Linq;
using FluentValidation;

namespace ai_hr.Endpoints;

public static class JobEndpoints
{
    // Helper method to convert JsonElement values to proper values
    private static Dictionary<string, object> ConvertLocationsDictionary(Dictionary<string, object> locations)
    {
        if (locations == null) return new Dictionary<string, object>();

        var converted = new Dictionary<string, object>();

        foreach (var kvp in locations)
        {
            if (kvp.Value is JsonElement element)
            {
                converted[kvp.Key] = ConvertJsonElement(element);
            }
            else
            {
                converted[kvp.Key] = kvp.Value;
            }
        }

        return converted;
    }

    private static object ConvertJsonElement(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
                return element.GetString();
            case JsonValueKind.Number:
                if (element.TryGetInt32(out int intValue))
                    return intValue;
                if (element.TryGetDouble(out double doubleValue))
                    return doubleValue;
                return element.GetDecimal();
            case JsonValueKind.True:
                return true;
            case JsonValueKind.False:
                return false;
            case JsonValueKind.Null:
                return null;
            case JsonValueKind.Object:
                var dict = new Dictionary<string, object>();
                foreach (var property in element.EnumerateObject())
                {
                    dict[property.Name] = ConvertJsonElement(property.Value);
                }
                return dict;
            case JsonValueKind.Array:
                var list = new List<object>();
                foreach (var item in element.EnumerateArray())
                {
                    list.Add(ConvertJsonElement(item));
                }
                return list;
            default:
                return element.ToString();
        }
    }

    public static void MapJobEndpoints(this WebApplication app)
    {
        app.MapPost("/jobs", CreateJob)
            .WithTags("Jobs")
            .WithName("CreateJob")
            .WithSummary("Create new job")
            .WithDescription("Create a new job posting with comprehensive details for candidates to apply");

        app.MapGet("/jobs/{id}", async (
             Guid id,
             Supabase.Client client,
             HttpContext context) =>
        {
            // Get the view tracking service from DI
            var viewTrackingService = context.RequestServices.GetService<IJobViewTrackingService>();
            return await GetJobById(id, client, context, viewTrackingService);
        })
         .WithTags("Jobs")
         .WithName("GetJobById")
         .WithSummary("Get job by ID")
         .WithDescription("Retrieves complete details of a specific job posting by its unique identifier and tracks view count");



        // ============== NEW STATUS MANAGEMENT ENDPOINTS ==============

        // Single job status change
        app.MapPatch("/jobs/{id}/status", ChangeJobStatus)
            .WithTags("Jobs")
            .WithName("ChangeJobStatus")
            .WithSummary("Change job status")
            .WithDescription("Updates the status of a specific job (Active, Paused, Closed, etc.)")
            .RequireAuthorization();

        // Bulk status change
        app.MapPatch("/jobs/bulk-status", BulkChangeJobStatus)
            .WithTags("Jobs")
            .WithName("BulkChangeJobStatus")
            .WithSummary("Bulk change job statuses")
            .WithDescription("Updates the status of multiple jobs at once")
            .RequireAuthorization();

        // Duplicate job
        app.MapPost("/jobs/{id}/duplicate", DuplicateJob)
            .WithTags("Jobs")
            .WithName("DuplicateJob")
            .WithSummary("Duplicate job")
            .WithDescription("Creates a copy of an existing job with optional modifications")
            .RequireAuthorization();

        // Get jobs by status with company filtering
        app.MapGet("/jobs/by-status/{status}", GetJobsByStatus)
            .WithTags("Jobs")
            .WithName("GetJobsByStatus")
            .WithSummary("Get jobs by status")
            .WithDescription("Retrieves jobs filtered by status and company")
            .RequireAuthorization();

        // Get job status history
        app.MapGet("/jobs/{id}/status-history", GetJobStatusHistory)
            .WithTags("Jobs")
            .WithName("GetJobStatusHistory")
            .WithSummary("Get job status history")
            .WithDescription("Retrieves the status change history for a job")
            .RequireAuthorization();

        app.MapGet("/jobs", GetJobs)
            .WithTags("Jobs")
            .WithName("GetJobs")
            .WithSummary("List all jobs")
            .WithDescription("Gets a list of all jobs with optional filtering by status and company")
            .RequireAuthorization();

        app.MapPut("/jobs/{id}", UpdateJob)
            .WithTags("Jobs")
            .WithName("UpdateJob")
            .WithSummary("Update job")
            .WithDescription("Update an existing job posting's details, requirements, or status");

        app.MapDelete("/jobs/{id}", DeleteJob)
            .WithTags("Jobs")
            .WithName("DeleteJob")
            .WithSummary("Delete job")
            .WithDescription("Permanently removes a job posting from the system");

        // Public endpoints for applicant users
        app.MapGet("/public/jobs", GetPublicJobs)
            .WithTags("Public Jobs")
            .WithName("GetPublicJobs")
            .WithSummary("Browse public jobs")
            .WithDescription("Gets a list of active jobs for applicant browsing - no authentication required");

        app.MapGet("/public/jobs/{id}", async (
             Guid id,
             Supabase.Client client,
             HttpContext context) =>
        {
            // Get the view tracking service from DI
            var viewTrackingService = context.RequestServices.GetService<IJobViewTrackingService>();
            return await GetPublicJobById(id, client, context, viewTrackingService);
        })
         .WithTags("Public Jobs")
         .WithName("GetPublicJobById")
         .WithSummary("Get public job by ID")
         .WithDescription("Retrieves complete details of a specific active job posting - no authentication required and tracks view count");


        app.MapGet("/jobs/interview-templates", GetInterviewTemplatesForJobs)
            .WithTags("Jobs")
            .WithName("GetInterviewTemplatesForJobs")
            .WithSummary("Get interview templates for job creation")
            .WithDescription("Retrieves available interview templates that can be linked to jobs")
            .RequireAuthorization();

        app.MapPost("/jobs/fix-applicant-counts", FixAllApplicantCounts)
            .WithTags("Jobs")
            .WithName("FixAllApplicantCounts")
            .WithSummary("Fix all applicant counts")
            .WithDescription("Recalculates and updates applicant counts for all jobs")
            .RequireAuthorization();

        app.MapPost("/jobs/fix-view-counts", FixAllViewCounts)
          .WithTags("Jobs")
          .WithName("FixAllViewCounts")
          .WithSummary("Fix all view counts")
          .WithDescription("Recalculates and updates view counts for all jobs")
          .RequireAuthorization();

        app.MapGet("/jobs/{id}/analytics", GetJobAnalytics)
            .WithTags("Jobs")
            .WithName("GetJobAnalytics")
            .WithSummary("Get job analytics")
            .WithDescription("Get detailed analytics for a job including view breakdown by user type")
            .RequireAuthorization();


        //Authenticated applicant endpoint (for logged-in applicants)
        app.MapGet("/applicant/jobs/{id}", async (
             Guid id,
             Supabase.Client client,
             HttpContext context) =>
        {
            var viewTrackingService = context.RequestServices.GetService<IJobViewTrackingService>();
            return await GetApplicantJobById(id, client, context, viewTrackingService);
        })
         .WithTags("Applicant Jobs")
         .WithName("GetApplicantJobById")
         .WithSummary("Get job details for authenticated applicants")
         .WithDescription("Retrieves job details for logged-in applicant users with proper view tracking and enhanced security")
         .RequireAuthorization(); // Authenticated applicants only with enhanced validation

        // Test endpoint to verify Supabase client is working
        app.MapGet("/test/jobs", async (Supabase.Client client) =>
        {
            try
            {
                Console.WriteLine("🧪 Testing Supabase client...");
                var response = await client.From<Job>().Get();
                Console.WriteLine($"🧪 Retrieved {response.Models?.Count ?? 0} jobs");
                return Results.Ok(new { success = true, count = response.Models?.Count ?? 0 });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🧪 Test failed: {ex.Message}");
                return Results.BadRequest(new { error = ex.Message });
            }
        })
         .WithTags("Test")
         .WithName("TestJobs")
         .WithSummary("Test endpoint to verify Supabase client");

    }


    // ============== NEW STATUS MANAGEMENT METHODS ==============
    private static async Task<IResult> ChangeJobStatus(
           Guid id,
           JobStatusChangeRequest request,
           Supabase.Client client,
           ClaimsPrincipal user)
    {
        try
        {

            // Verify user has access to this job
            var userId = UserIdExtractor.ExtractUserId(user);
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            // Get job and verify company access
            var jobResponse = await client.From<Job>().Get();
            var job = jobResponse.Models.FirstOrDefault(j => j.Id == id);

            if (job == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            // Verify user can modify this job (company check)
            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null || hiringUser.CompanyId != job.CompanyId)
            {
                return Results.Forbid();
            }

            Console.WriteLine($"📊 Current job status in DB: '{job.Status}'");

            // Update job status
            var oldStatus = job.Status;
            job.Status = request.Status;

            // Set additional fields based on status
            if (request.Status == "Active")
            {
                if (oldStatus == "Draft")
                {
                    job.PostedDate = DateTime.UtcNow;
                    Console.WriteLine($"📅 Set PostedDate for job transitioning from Draft to Active");
                }
                job.ClosedDate = null; // Clear closed date if re-activa
            }
            else if (request.Status == "Closed" || request.Status == "Expired")
            {
                job.ClosedDate = request.EffectiveDate ?? DateTime.UtcNow;
                Console.WriteLine($"📅 Set ClosedDate for job transitioning to {request.Status}");
            }

            await client.From<Job>().Update(job);

            // Record status change history
            await RecordStatusChange(id, oldStatus, request.Status, userGuid, request.Reason, client);

            // Return updated job
            var jobDto = new
            {
                Id = job.Id,
                Title = job.Title,
                CompanyId = job.CompanyId,
                CreatedBy = job.CreatedBy,
                Description = job.Description,
                Department = job.Department,
                Responsibilities = job.Responsibilities,
                Requirements = job.Requirements,
                Qualifications = job.Qualifications,
                Benefits = job.Benefits,
                EmploymentType = job.EmploymentType,
                SeniorityLevel = job.SeniorityLevel,
                ExperienceYearsMin = job.ExperienceYearsMin,
                LocationType = job.LocationType,
                Locations = job.Locations,
                SalaryMin = job.SalaryMin,
                SalaryMax = job.SalaryMax,
                SalaryCurrency = job.SalaryCurrency,
                ApplicationDeadline = job.ApplicationDeadline,
                Status = job.Status,
                ApplicantCount = job.ApplicantCount,
                ViewCount = job.ViewCount,
                AiGeneratedDescription = job.AiGeneratedDescription,
                SkillMatchThreshold = job.SkillMatchThreshold,
                PostedDate = job.PostedDate,
                ClosedDate = job.ClosedDate,
                InterviewTemplateId = job.InterviewTemplateId
            };

            Console.WriteLine($"✅ Successfully changed job {id} status from '{oldStatus}' to '{request.Status}'");

            return Results.Ok(new
            {
                success = true,
                message = $"Job status changed to {request.Status}",
                job = jobDto
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error changing job status: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    private static async Task<IResult> BulkChangeJobStatus(
          BulkJobStatusChangeRequest request,
          Supabase.Client client,
          ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"🔄 Bulk status change: {request.JobIds.Count} jobs to status '{request.Status}'");

            var userId = UserIdExtractor.ExtractUserId(user);
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null)
            {
                return Results.Unauthorized();
            }

            var jobsResponse = await client.From<Job>().Get();
            var jobs = jobsResponse.Models
                .Where(j => request.JobIds.Contains(j.Id) && j.CompanyId == hiringUser.CompanyId)
                .ToList();

            var updatedJobs = new List<object>();
            var errors = new List<string>();

            foreach (var job in jobs ?? new List<Job>())
            {
                try
                {
                    var oldStatus = job.Status;
                    job.Status = request.Status;

                    // Set additional fields based on status
                    if (request.Status == "Active" && oldStatus == "Draft")
                    {
                        job.PostedDate = DateTime.UtcNow;
                    }
                    else if (request.Status == "Closed" || request.Status == "Expired")
                    {
                        job.ClosedDate = DateTime.UtcNow;
                    }

                    await client.From<Job>().Update(job);
                    await RecordStatusChange(job.Id, oldStatus, request.Status, userGuid, request.Reason, client);

                    // Create DTO
                    updatedJobs.Add(new
                    {
                        Id = job.Id,
                        Title = job.Title,
                        Status = job.Status,
                        // ... other properties
                    });
                }
                catch (Exception ex)
                {
                    errors.Add($"Job {job.Id}: {ex.Message}");
                }
            }

            Console.WriteLine($"✅ Bulk operation completed: {updatedJobs.Count} jobs updated to '{request.Status}'");

            return Results.Ok(new
            {
                success = true,
                updatedJobs = updatedJobs.Count,
                totalRequested = request.JobIds.Count,
                errors = errors
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in bulk status change: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message });
        }
    }




    private static bool IsValidStatusTransition(string fromStatus, string toStatus)
    {
        return (fromStatus, toStatus) switch
        {
            // From Draft
            ("Draft", "Active") => true,

            // From Active
            ("Active", "Paused") => true,
            ("Active", "Closed") => true,
            ("Active", "Draft") => true, // Allow back to draft for editing
            ("Active", "Expired") => true,

            // From Paused
            ("Paused", "Active") => true,
            ("Paused", "Closed") => true,
            ("Paused", "Expired") => true,

            // From Closed
            ("Closed", "Active") => true, // Allow re-active
            ("Closed", "Expired") => true,

            // From Expired
            ("Expired", "Active") => true, // Allow re-active
            ("Expired", "Closed") => true,

            // Same status transitions (no-op)
            ("Draft", "Draft") => true,
            ("Active", "Active") => true,
            ("Paused", "Paused") => true,
            ("Closed", "Closed") => true,
            ("Expired", "Expired") => true,

            // Default: invalid transition
            _ => false
        };
    }
    private static async Task RecordStatusChange(
           Guid jobId,
           string fromStatus,
           string toStatus,
           Guid changedBy,
           string? reason,
           Supabase.Client client)
    {
        try
        {
            var statusChange = new JobStatusHistory
            {
                JobId = jobId,
                FromStatus = fromStatus,  // Store backend status in history
                ToStatus = toStatus,      // Store backend status in history
                ChangedBy = changedBy,
                ChangedAt = DateTime.UtcNow,
                Reason = reason
            };

            await client.From<JobStatusHistory>().Insert(statusChange);
            Console.WriteLine($"📝 Recorded status change: {fromStatus} -> {toStatus} for job {jobId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Failed to record status change: {ex.Message}");
            // Don't fail the main operation if status history fails
        }
    }
    private static async Task<IResult> DuplicateJob(
        Guid id,
        JobDuplicateRequest request,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = UserIdExtractor.ExtractUserId(user);
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            // Get original job
            var jobResponse = await client.From<Job>().Get();
            var originalJob = jobResponse.Models.FirstOrDefault(j => j.Id == id);

            if (originalJob == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            // Verify access
            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null || hiringUser.CompanyId != originalJob.CompanyId)
            {
                return Results.Forbid();
            }

            // Create duplicate job
            var duplicateJob = new Job
            {
                Title = request.NewTitle ?? $"{originalJob.Title} (Copy)",
                CompanyId = originalJob.CompanyId,
                CreatedBy = userGuid,
                Description = originalJob.Description,
                Department = originalJob.Department,
                Responsibilities = originalJob.Responsibilities,
                Requirements = originalJob.Requirements,
                Qualifications = originalJob.Qualifications,
                Benefits = originalJob.Benefits,
                EmploymentType = originalJob.EmploymentType,
                SeniorityLevel = originalJob.SeniorityLevel,
                ExperienceYearsMin = originalJob.ExperienceYearsMin,
                LocationType = originalJob.LocationType,
                Locations = originalJob.Locations,
                SalaryMin = originalJob.SalaryMin,
                SalaryMax = originalJob.SalaryMax,
                SalaryCurrency = originalJob.SalaryCurrency,
                ApplicationDeadline = originalJob.ApplicationDeadline,
                Status = request.Status,
                AiGeneratedDescription = originalJob.AiGeneratedDescription,
                SkillMatchThreshold = originalJob.SkillMatchThreshold,
                InterviewTemplateId = originalJob.InterviewTemplateId,
                PostedDate = request.Status == "Active" ? DateTime.UtcNow : null,
                ViewCount = 0,
                ApplicantCount = 0
            };

            await client.From<Job>().Insert(duplicateJob);

            Console.WriteLine($"✅ Successfully duplicated job {id}");

            return Results.Ok(new
            {
                success = true,
                message = "Job duplicated successfully",
                duplicatedJob = await CreateJobDto(duplicateJob, client)
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error duplicating job: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    private static async Task<IResult> GetJobsByStatus(
           string status,
           int? page,
           int? pageSize,
           Supabase.Client client,
           ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"🔍 GetJobsByStatus called - Status: '{status}', Page: {page}, PageSize: {pageSize}");

            // Set default pagination values
            var currentPage = page ?? 1;
            var itemsPerPage = pageSize ?? 10;

            if (currentPage < 1) currentPage = 1;
            if (itemsPerPage < 1) itemsPerPage = 10;
            if (itemsPerPage > 100) itemsPerPage = 100; // Limit max page size

            var userId = UserIdExtractor.ExtractUserId(user);
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null)
            {
                return Results.Unauthorized();
            }

            var jobsResponse = await client.From<Job>().Get();
            var jobs = jobsResponse.Models
                .Where(j => j.CompanyId == hiringUser.CompanyId)
                .ToList();

            Console.WriteLine($"🏢 Found {jobs.Count} jobs for company {hiringUser.CompanyId}");

            // Filter by status
            if (!string.IsNullOrEmpty(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"🔄 Filtering by status: '{status}'");

                jobs = jobs.Where(j => j.Status.Equals(status, StringComparison.OrdinalIgnoreCase))
                         .ToList();

                Console.WriteLine($"📊 After status filter: {jobs.Count} jobs with status '{status}'");
            }

            // Calculate total count before pagination
            var totalCount = jobs.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / itemsPerPage);

            Console.WriteLine($"✅ Final filtered jobs count: {totalCount}, Total pages: {totalPages}");

            // Apply pagination
            var startIndex = (currentPage - 1) * itemsPerPage;
            var endIndex = Math.Min(startIndex + itemsPerPage, totalCount);
            var pagedJobs = jobs.Skip(startIndex).Take(itemsPerPage).ToList();

            Console.WriteLine($"📄 Page {currentPage}: Showing jobs {startIndex + 1}-{endIndex} of {totalCount}");

            // Create DTOs with real-time applicant counts
            var jobDtos = new List<object>();
            foreach (var job in pagedJobs)
            {
                // Calculate actual applicant count in real-time
                var actualApplicantCount = await CalculateApplicantCount(job.Id, client);

                jobDtos.Add(new
                {
                    Id = job.Id,
                    Title = job.Title,
                    CompanyId = job.CompanyId,
                    CreatedBy = job.CreatedBy,
                    Description = job.Description,
                    Department = job.Department,
                    Responsibilities = job.Responsibilities,
                    Requirements = job.Requirements,
                    Qualifications = job.Qualifications,
                    Benefits = job.Benefits,
                    EmploymentType = job.EmploymentType,
                    SeniorityLevel = job.SeniorityLevel,
                    ExperienceYearsMin = job.ExperienceYearsMin,
                    LocationType = job.LocationType,
                    Locations = job.Locations,
                    SalaryMin = job.SalaryMin,
                    SalaryMax = job.SalaryMax,
                    SalaryCurrency = job.SalaryCurrency,
                    ApplicationDeadline = job.ApplicationDeadline,
                    Status = job.Status,
                    ApplicantCount = actualApplicantCount, // Use real-time count
                    ViewCount = job.ViewCount,
                    AiGeneratedDescription = job.AiGeneratedDescription,
                    SkillMatchThreshold = job.SkillMatchThreshold,
                    PostedDate = job.PostedDate,
                    ClosedDate = job.ClosedDate,
                    InterviewTemplateId = job.InterviewTemplateId
                });
            }

            Console.WriteLine($"✅ Returning {jobDtos.Count} jobs for page {currentPage}");

            // Debug: Log status distribution
            var statusGroups = jobDtos.GroupBy(j => ((dynamic)j).Status).ToDictionary(g => g.Key, g => g.Count());
            Console.WriteLine($"📊 Status distribution: {string.Join(", ", statusGroups.Select(kvp => $"{kvp.Key}: {kvp.Value}"))}");

            // Return paginated response
            return Results.Ok(new
            {
                jobs = jobDtos,
                pagination = new
                {
                    currentPage = currentPage,
                    pageSize = itemsPerPage,
                    totalCount = totalCount,
                    totalPages = totalPages,
                    hasNextPage = currentPage < totalPages,
                    hasPreviousPage = currentPage > 1
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error getting jobs by status: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message });
        }
    }

    private static async Task<IResult> GetJobStatusHistory(
        Guid id,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = UserIdExtractor.ExtractUserId(user);
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            // Verify user has access to this job
            var jobResponse = await client.From<Job>().Get();
            var job = jobResponse.Models.FirstOrDefault(j => j.Id == id);

            if (job == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null || hiringUser.CompanyId != job.CompanyId)
            {
                return Results.Forbid();
            }

            // Get status history - Fixed query syntax
            var historyResponse = await client.From<JobStatusHistory>().Get();
            var allHistory = historyResponse.Models ?? new List<JobStatusHistory>();

            // Filter in memory since Supabase client might not support complex Where clauses
            var history = allHistory.Where(jsh => jsh.JobId == id)
                .OrderBy(h => h.ChangedAt)
                .Select(h => new
                {
                    Id = h.Id,
                    JobId = h.JobId,
                    FromStatus = h.FromStatus,
                    ToStatus = h.ToStatus,
                    ChangedBy = h.ChangedBy,
                    ChangedAt = h.ChangedAt,
                    Reason = h.Reason
                })
                .ToList();

            return Results.Ok(history);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error getting job status history: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message });
        }
    }

    private static async Task<IResult> GetApplicantJobById(
    Guid id,
    Supabase.Client client,
    HttpContext context,
    IJobViewTrackingService? viewTrackingService = null)
    {
        try
        {
            Console.WriteLine($"👤 Applicant job endpoint called for job: {id}");
            Console.WriteLine($"👤 User authenticated: {context.User?.Identity?.IsAuthenticated}");

            // Verify user is authenticated
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                Console.WriteLine("❌ User not authenticated for applicant endpoint");
                return Results.Unauthorized();
            }

            // Get user ID from claims
            var userId = UserIdExtractor.ExtractUserId(context.User);
            Console.WriteLine($"👤 Authenticated applicant user ID: {userId}");

            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("❌ No user ID found in claims");
                return Results.Unauthorized();
            }

            // Get specific job by ID
            Job? job = null;
            try
            {
                Console.WriteLine($"👤 Attempting to fetch job with ID: {id}");
                
                // Use the same pattern as other working endpoints
                var response = await client.From<Job>().Get();
                Console.WriteLine($"👤 Retrieved {response.Models?.Count ?? 0} jobs from database");
                
                job = response.Models?.FirstOrDefault(j => j.Id == id);
                Console.WriteLine($"👤 Job found: {job != null}");
                
                if (job != null)
                {
                    Console.WriteLine($"👤 Job title: {job.Title}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error fetching job from database: {ex.Message}");
                Console.WriteLine($"❌ Exception type: {ex.GetType().Name}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                return Results.BadRequest(new { error = "Database error occurred while fetching job details", details = ex.Message });
            }

            if (job == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            // For applicant endpoint, only allow access to "Active" jobs
            if (!job.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
            {
                return Results.NotFound(new { message = $"Job with ID {id} is not available" });
            }

            Console.WriteLine($"👤 Found job for applicant: {job.Title}");

            // Track the view with authenticated user info
            if (viewTrackingService != null)
            {
                try
                {
                    var ipAddress = context.Connection.RemoteIpAddress?.ToString();
                    var userAgent = context.Request.Headers.UserAgent.ToString();
                    var referrer = context.Request.Headers.Referer.ToString();

                    Console.WriteLine($"👤 Tracking view for authenticated applicant: {userId}");

                    var viewRecorded = await viewTrackingService.RecordJobViewAsync(
                        id,
                        context.User, // Pass the authenticated user
                        null, // No session ID needed for authenticated users
                        ipAddress,
                        userAgent,
                        referrer
                    );

                    Console.WriteLine($"👤 Applicant view tracking result: {viewRecorded}");
                }
                catch (Exception viewEx)
                {
                    Console.WriteLine($"⚠️ Applicant view tracking failed (non-critical): {viewEx.Message}");
                }
            }

            // Update applicant count if needed
            var actualApplicantCount = await CalculateApplicantCount(job.Id, client);
            if (job.ApplicantCount != actualApplicantCount)
            {
                await UpdateJobApplicantCount(job.Id, client);
                job.ApplicantCount = actualApplicantCount;
            }

            // Update view count if needed
            if (viewTrackingService != null)
            {
                var actualViewCount = await viewTrackingService.GetJobViewCountAsync(job.Id);
                if (job.ViewCount != actualViewCount)
                {
                    await viewTrackingService.UpdateJobViewCountAsync(job.Id, client);
                    job.ViewCount = actualViewCount;
                }
            }

            // ✅ Check if the authenticated user has applied to this job
            // Extract the real database user ID from JWT metadata
            var realUserId = UserIdExtractor.ExtractUserId(context.User);

            var userIdToCompare = !string.IsNullOrEmpty(realUserId) ? realUserId : userId;
            if (!Guid.TryParse(userIdToCompare, out var userGuidForCompare))
            {
                return Results.Unauthorized();
            }

            var userApplicationResponse = await client.From<ApplicationDetail>()
                .Where(ad => ad.JobId == id && ad.CandidateUserId == userGuidForCompare)
                .Get();

            var userApplication = userApplicationResponse.Models?.FirstOrDefault();

            // ✅ Get interview template details if user has applied and template exists
            object? interviewTemplate = null;
            if (userApplication != null && job.InterviewTemplateId != null)
            {
                try
                {
                    var templateResponse = await client.From<InterviewTemplate>().Get();
                    var template = templateResponse.Models?.FirstOrDefault(t => t.Id == job.InterviewTemplateId);
                    
                    if (template != null)
                    {
                        // Get rounds for this template
                        var roundsResponse = await client.From<InterviewRound>().Get();
                        var rounds = roundsResponse.Models == null
                            ? new List<object>()
                            : roundsResponse.Models
                                .Where(r => r.TemplateId == template.Id)
                                .OrderBy(r => r.RoundOrder)
                                .Select(r => new
                                {
                                    Id = r.Id,
                                    Name = r.Name,
                                    Type = r.Type,
                                    Duration = r.Duration,
                                    RoundOrder = r.RoundOrder,
                                    Description = r.Description,
                                    IsOptional = r.IsOptional,
                                    PassingCriteria = r.PassingCriteria
                                }).ToList<object>();

                        interviewTemplate = new
                        {
                            Id = template.Id,
                            Name = template.Name,
                            Description = template.Description,
                            Rounds = rounds
                        };
                    }
                }
                catch (Exception templateEx)
                {
                    Console.WriteLine($"⚠️ Error loading interview template: {templateEx.Message}");
                    // Don't fail the request if template loading fails
                }
            }

            // Create response DTO
            var jobDto = new
            {
                Id = job.Id,
                Title = job.Title,
                CompanyId = job.CompanyId,
                CreatedBy = job.CreatedBy,
                Description = job.Description,
                Department = job.Department,
                Responsibilities = job.Responsibilities,
                Requirements = job.Requirements,
                Qualifications = job.Qualifications,
                Benefits = job.Benefits,
                EmploymentType = job.EmploymentType,
                SeniorityLevel = job.SeniorityLevel,
                ExperienceYearsMin = job.ExperienceYearsMin,
                LocationType = job.LocationType,
                Locations = job.Locations,
                SalaryMin = job.SalaryMin,
                SalaryMax = job.SalaryMax,
                SalaryCurrency = job.SalaryCurrency,
                ApplicationDeadline = job.ApplicationDeadline,
                Status = job.Status,
                ApplicantCount = job.ApplicantCount,
                ViewCount = job.ViewCount,
                AiGeneratedDescription = job.AiGeneratedDescription,
                SkillMatchThreshold = job.SkillMatchThreshold,
                PostedDate = job.PostedDate,
                ClosedDate = job.ClosedDate,
                InterviewTemplateId = job.InterviewTemplateId,
                // ✅ Enhanced data for candidates who applied
                InterviewTemplate = interviewTemplate, // null if user hasn't applied or no template
                ApplicationStatus = userApplication?.Status,
                CurrentRoundId = userApplication?.CurrentRoundId,
                HasApplied = userApplication != null
            };

            return Results.Ok(jobDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error retrieving applicant job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> CreateJob(CreateJobRequest request, IValidator<CreateJobRequest> validator, Supabase.Client client)
    {
        try
        {
            // Validate the request
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                Console.WriteLine($"❌ Validation failed for job creation: {string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage))}");
                return Results.BadRequest(new 
                { 
                    message = "Validation failed", 
                    errors = validationResult.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }) 
                });
            }

            Console.WriteLine($"Creating job with title: {request.Title}");
            Console.WriteLine($"InterviewTemplateId received: {request.InterviewTemplateId}");

            var job = new Job
            {
                Title = request.Title,
                CompanyId = request.CompanyId,
                CreatedBy = request.CreatedBy,
                Description = request.Description,
                Department = request.Department,
                Responsibilities = request.Responsibilities,
                Requirements = request.Requirements,
                Qualifications = request.Qualifications,
                Benefits = request.Benefits,
                EmploymentType = request.EmploymentType,
                SeniorityLevel = request.SeniorityLevel,
                ExperienceYearsMin = request.ExperienceYearsMin,
                LocationType = request.LocationType,
                Locations = ConvertLocationsDictionary(request.Locations),
                SalaryMin = request.SalaryMin,
                SalaryMax = request.SalaryMax,
                SalaryCurrency = request.SalaryCurrency,
                ApplicationDeadline = request.ApplicationDeadline,
                Status = request.Status,
                AiGeneratedDescription = request.AiGeneratedDescription,
                SkillMatchThreshold = request.SkillMatchThreshold,
                InterviewTemplateId = request.InterviewTemplateId,
                PostedDate = DateTime.UtcNow,
                ViewCount = 0,
            };

            Console.WriteLine($"Job.InterviewTemplateId being inserted: {job.InterviewTemplateId}");

            var response = await client.From<Job>().Insert(job);
            
            // Return the created job with its ID
            var createdJob = await CreateJobDto(job, client);
            return Results.Ok(new { 
                success = true, 
                message = "Job created successfully", 
                data = createdJob 
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }
    private static async Task<IResult> GetJobById(
       Guid id,
       Supabase.Client client,
       HttpContext context,
       IJobViewTrackingService? viewTrackingService = null)
    {
        try
        {
            Console.WriteLine($"🔍 Getting job {id} - tracking view...");
            Console.WriteLine($"🔍 ViewTrackingService available: {viewTrackingService != null}");

            // Get all jobs and filter by ID
            var response = await client.From<Job>().Get();
            var job = response.Models.FirstOrDefault(j => j.Id == id);

            if (job == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            // Track the view if service is available
            if (viewTrackingService != null)
            {
                try
                {
                    var sessionId = context.Session?.Id ?? context.TraceIdentifier;
                    var ipAddress = context.Connection.RemoteIpAddress?.ToString();
                    var userAgent = context.Request.Headers.UserAgent.ToString();
                    var referrer = context.Request.Headers.Referer.ToString();

                    Console.WriteLine($"🔍 Attempting to track view with session: {sessionId}");

                    var viewRecorded = await viewTrackingService.RecordJobViewAsync(
                        id,
                        context.User?.Identity?.IsAuthenticated == true ? context.User : null,
                        sessionId,
                        ipAddress,
                        userAgent,
                        referrer
                    );

                    Console.WriteLine($"🔍 View tracking result: {viewRecorded}");
                }
                catch (Exception viewEx)
                {
                    Console.WriteLine($"⚠️ View tracking failed (non-critical): {viewEx.Message}");
                    // Don't fail the request if view tracking fails
                }
            }
            else
            {
                Console.WriteLine("⚠️ ViewTrackingService is null - view not tracked");
            }

            // Update applicant count if needed (real-time fallback)
            var actualApplicantCount = await CalculateApplicantCount(job.Id, client);
            if (job.ApplicantCount != actualApplicantCount)
            {
                await UpdateJobApplicantCount(job.Id, client);
                job.ApplicantCount = actualApplicantCount;
            }

            // Update view count if needed (real-time fallback)
            if (viewTrackingService != null)
            {
                var actualViewCount = await viewTrackingService.GetJobViewCountAsync(job.Id);
                if (job.ViewCount != actualViewCount)
                {
                    await viewTrackingService.UpdateJobViewCountAsync(job.Id, client);
                    job.ViewCount = actualViewCount;
                    // Get interview template data if available
                }
            }
            object? interviewTemplate = null;
            if (job.InterviewTemplateId.HasValue)
            {
                try
                {
                    var templateResponse = await client.From<InterviewTemplate>().Get();
                    var template = templateResponse.Models.FirstOrDefault(t => t.Id == job.InterviewTemplateId.Value);

                    if (template != null)
                    {
                        // Get rounds for this template
                        var roundsResponse = await client.From<InterviewRound>().Get();
                        var rounds = roundsResponse.Models
                            .Where(r => r.TemplateId == template.Id)
                            .OrderBy(r => r.RoundOrder)
                            .Select(r => new
                            {
                                id = r.Id.ToString(),
                                name = r.Name,
                                type = r.Type,
                                duration = r.Duration,
                                roundOrder = r.RoundOrder,
                                passingCriteria = r.PassingCriteria,
                                description = r.Description,
                                requirements = r.Requirements,
                                interviewers = r.Interviewers,
                                isOptional = r.IsOptional
                            })
                            .ToList();

                        interviewTemplate = new
                        {
                            id = template.Id.ToString(),
                            name = template.Name,
                            rounds = rounds
                        };
                    }
                }
                catch (Exception templateEx)
                {
                    Console.WriteLine($"Warning: Could not load interview template: {templateEx.Message}");
                }
            }


            // Create a simple DTO to avoid serialization issues
            var jobDto = new
            {
                Id = job.Id,
                Title = job.Title,
                CompanyId = job.CompanyId,
                CreatedBy = job.CreatedBy,
                Description = job.Description,
                Department = job.Department,
                Responsibilities = job.Responsibilities,
                Requirements = job.Requirements,
                Qualifications = job.Qualifications,
                Benefits = job.Benefits,
                EmploymentType = job.EmploymentType,
                SeniorityLevel = job.SeniorityLevel,
                ExperienceYearsMin = job.ExperienceYearsMin,
                LocationType = job.LocationType,
                Locations = job.Locations,
                SalaryMin = job.SalaryMin,
                SalaryMax = job.SalaryMax,
                SalaryCurrency = job.SalaryCurrency,
                ApplicationDeadline = job.ApplicationDeadline,
                Status = job.Status,
                ApplicantCount = job.ApplicantCount,
                ViewCount = job.ViewCount,
                AiGeneratedDescription = job.AiGeneratedDescription,
                SkillMatchThreshold = job.SkillMatchThreshold,
                PostedDate = job.PostedDate,
                ClosedDate = job.ClosedDate,
                InterviewTemplateId = job.InterviewTemplateId,
                InterviewTemplate = interviewTemplate
            };

            return Results.Ok(new { success = true, data = jobDto });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }

    }
    private static async Task<IResult> GetJobs(string? status, Guid? companyId, int? page, int? pageSize, Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"🔍 GetJobs called - Status: {status}, CompanyId: {companyId}, Page: {page}, PageSize: {pageSize}");

            // Set default pagination values
            var currentPage = page ?? 1;
            var itemsPerPage = pageSize ?? 10;

            if (currentPage < 1) currentPage = 1;
            if (itemsPerPage < 1) itemsPerPage = 10;
            if (itemsPerPage > 100) itemsPerPage = 100; // Limit max page size

            // Start with a base query
            var query = client.From<Job>();
            var response = await query.Get();
            var jobs = response.Models;

            Console.WriteLine($"📊 Total jobs in database: {jobs?.Count ?? 0}");

            // Apply company filter FIRST (most important for hiring users)
            if (companyId.HasValue)
            {
                jobs = jobs?.Where(j => j.CompanyId == companyId.Value).ToList() ?? new List<Job>();
                Console.WriteLine($"🏢 After company filter ({companyId}): {jobs.Count} jobs");
            }

            // Apply status filter
            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                jobs = jobs?.Where(j => j.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList() ?? new List<Job>();
                Console.WriteLine($"📊 After status filter ('{status}'): {jobs.Count} jobs");
            }
            else if (string.IsNullOrEmpty(status) && !companyId.HasValue)
            {
                // If no status specified and no company filter, default to active jobs only
                jobs = jobs?.Where(j => j.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)).ToList() ?? new List<Job>();
                Console.WriteLine($"📊 No filters - showing only Active jobs: {jobs.Count} jobs");
            }

            // Calculate total count before pagination
            var totalCount = jobs?.Count ?? 0;
            var totalPages = (int)Math.Ceiling((double)totalCount / itemsPerPage);

            Console.WriteLine($"✅ Final filtered jobs count: {totalCount}, Total pages: {totalPages}");

            // Apply pagination
            var startIndex = (currentPage - 1) * itemsPerPage;
            var endIndex = Math.Min(startIndex + itemsPerPage, totalCount);
            var pagedJobs = jobs?.Skip(startIndex).Take(itemsPerPage).ToList() ?? new List<Job>();

            Console.WriteLine($"📄 Page {currentPage}: Showing jobs {startIndex + 1}-{endIndex} of {totalCount}");

            // Create DTOs with real-time applicant counts
            var jobDtos = new List<object>();
            foreach (var job in pagedJobs)
            {
                // Calculate actual applicant count in real-time
                var actualApplicantCount = await CalculateApplicantCount(job.Id, client);

                jobDtos.Add(new
                {
                    Id = job.Id,
                    Title = job.Title,
                    CompanyId = job.CompanyId,
                    CreatedBy = job.CreatedBy,
                    Description = job.Description,
                    Department = job.Department,
                    EmploymentType = job.EmploymentType,
                    LocationType = job.LocationType,
                    Locations = job.Locations,
                    SalaryMin = job.SalaryMin,
                    SalaryMax = job.SalaryMax,
                    SalaryCurrency = job.SalaryCurrency,
                    Status = job.Status,
                    ApplicantCount = actualApplicantCount, // Use real-time count
                    PostedDate = job.PostedDate,
                    InterviewTemplateId = job.InterviewTemplateId,
                    Responsibilities = job.Responsibilities,
                    Requirements = job.Requirements,
                    Qualifications = job.Qualifications,
                    Benefits = job.Benefits,
                    SeniorityLevel = job.SeniorityLevel,
                    ExperienceYearsMin = job.ExperienceYearsMin,
                    ApplicationDeadline = job.ApplicationDeadline,
                    ViewCount = job.ViewCount,
                    AiGeneratedDescription = job.AiGeneratedDescription,
                    SkillMatchThreshold = job.SkillMatchThreshold,
                    ClosedDate = job.ClosedDate
                });
            }

            Console.WriteLine($"🔄 Converted {jobDtos.Count} jobs for page {currentPage}");

            // Debug: Log first few jobs with their statuses
            foreach (var job in jobDtos.Take(3))
            {
                var jobObj = (dynamic)job;
                Console.WriteLine($"📋 Job: {jobObj.Title} - Status: {jobObj.Status}");
            }

            // Return paginated response
            return Results.Ok(new
            {
                jobs = jobDtos,
                pagination = new
                {
                    currentPage = currentPage,
                    pageSize = itemsPerPage,
                    totalCount = totalCount,
                    totalPages = totalPages,
                    hasNextPage = currentPage < totalPages,
                    hasPreviousPage = currentPage > 1
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error retrieving jobs: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }


    private static async Task<IResult> UpdateJob(Guid id, UpdateJobRequest request, Supabase.Client client)
    {
        try
        {
            // First, get all jobs and filter by ID
            var getResponse = await client.From<Job>().Get();
            var job = getResponse.Models.FirstOrDefault(j => j.Id == id);

            if (job == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            // Update properties if provided in the request
            if (request.Title != null) job.Title = request.Title;
            if (request.Department != null) job.Department = request.Department;
            if (request.Description != null) job.Description = request.Description;
            if (request.Responsibilities != null) job.Responsibilities = request.Responsibilities;
            if (request.Requirements != null) job.Requirements = request.Requirements;
            if (request.Qualifications != null) job.Qualifications = request.Qualifications;
            if (request.Benefits != null) job.Benefits = request.Benefits;
            if (request.EmploymentType != null) job.EmploymentType = request.EmploymentType;
            if (request.SeniorityLevel != null) job.SeniorityLevel = request.SeniorityLevel;
            if (request.ExperienceYearsMin.HasValue) job.ExperienceYearsMin = request.ExperienceYearsMin;
            if (request.LocationType != null) job.LocationType = request.LocationType;
            if (request.Locations != null) job.Locations = ConvertLocationsDictionary(request.Locations);
            if (request.SalaryMin.HasValue) job.SalaryMin = request.SalaryMin;
            if (request.SalaryMax.HasValue) job.SalaryMax = request.SalaryMax;
            if (request.SalaryCurrency != null) job.SalaryCurrency = request.SalaryCurrency;
            if (request.ApplicationDeadline.HasValue) job.ApplicationDeadline = request.ApplicationDeadline;
            if (request.Status != null) job.Status = request.Status;
            if (request.AiGeneratedDescription.HasValue) job.AiGeneratedDescription = request.AiGeneratedDescription.Value;
            if (request.SkillMatchThreshold.HasValue) job.SkillMatchThreshold = request.SkillMatchThreshold.Value;
            if (request.PostedDate.HasValue) job.PostedDate = request.PostedDate;
            if (request.ClosedDate.HasValue) job.ClosedDate = request.ClosedDate;
            if (request.InterviewTemplateId.HasValue) job.InterviewTemplateId = request.InterviewTemplateId;

            // Update the record
            var response = await client.From<Job>().Update(job);

            return Results.Accepted($"/jobs/{id}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> DeleteJob(Guid id, Supabase.Client client)
    {
        try
        {
            // First, get all jobs and filter by ID
            var getResponse = await client.From<Job>().Get();
            var job = getResponse.Models.FirstOrDefault(j => j.Id == id);

            if (job == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            // Delete the job
            var response = await client.From<Job>().Delete(job);
            return Results.NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetPublicJobs(string? status, Guid? companyId, int? page, int? pageSize, Supabase.Client client)
    {
        try
        {
            Console.WriteLine("🌍 Public jobs endpoint called - no authentication required");

            // Set default pagination values
            var currentPage = page ?? 1;
            var itemsPerPage = pageSize ?? 10;

            if (currentPage < 1) currentPage = 1;
            if (itemsPerPage < 1) itemsPerPage = 10;
            if (itemsPerPage > 100) itemsPerPage = 100; // Limit max page size

            // Start with a base query
            var query = client.From<Job>();
            var response = await query.Get();
            var jobs = response.Models;

            // For public endpoint, only show "Active" jobs (active for applicants)
            jobs = jobs.Where(j => j.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)).ToList();

            // Apply company filter if specified
            if (companyId.HasValue)
            {
                jobs = jobs.Where(j => j.CompanyId == companyId.Value).ToList();
            }

            Console.WriteLine($"🌍 Found {jobs.Count} public jobs");

            // Calculate total count before pagination
            var totalCount = jobs.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / itemsPerPage);

            Console.WriteLine($"✅ Final filtered jobs count: {totalCount}, Total pages: {totalPages}");

            // Apply pagination
            var startIndex = (currentPage - 1) * itemsPerPage;
            var endIndex = Math.Min(startIndex + itemsPerPage, totalCount);
            var pagedJobs = jobs.Skip(startIndex).Take(itemsPerPage).ToList();

            Console.WriteLine($"📄 Page {currentPage}: Showing jobs {startIndex + 1}-{endIndex} of {totalCount}");

            // Create DTOs with real-time applicant counts
            var jobDtos = new List<object>();
            foreach (var job in pagedJobs)
            {
                // Calculate actual applicant count in real-time
                var actualApplicantCount = await CalculateApplicantCount(job.Id, client);

                jobDtos.Add(new
                {
                    Id = job.Id,
                    Title = job.Title,
                    CompanyId = job.CompanyId,
                    Description = job.Description,
                    Department = job.Department,
                    EmploymentType = job.EmploymentType,
                    LocationType = job.LocationType,
                    Locations = job.Locations,
                    SalaryMin = job.SalaryMin,
                    SalaryMax = job.SalaryMax,
                    SalaryCurrency = job.SalaryCurrency,
                    Status = job.Status,
                    ApplicantCount = actualApplicantCount, // Use real-time count
                    PostedDate = job.PostedDate,
                    InterviewTemplateId = job.InterviewTemplateId,
                    Responsibilities = job.Responsibilities,
                    Requirements = job.Requirements,
                    Qualifications = job.Qualifications,
                    Benefits = job.Benefits,
                    SeniorityLevel = job.SeniorityLevel,
                    ExperienceYearsMin = job.ExperienceYearsMin,
                    ApplicationDeadline = job.ApplicationDeadline,
                    ViewCount = job.ViewCount,
                    AiGeneratedDescription = job.AiGeneratedDescription,
                    SkillMatchThreshold = job.SkillMatchThreshold,
                    ClosedDate = job.ClosedDate
                });
            }

            // Return paginated response
            return Results.Ok(new
            {
                jobs = jobDtos,
                pagination = new
                {
                    currentPage = currentPage,
                    pageSize = itemsPerPage,
                    totalCount = totalCount,
                    totalPages = totalPages,
                    hasNextPage = currentPage < totalPages,
                    hasPreviousPage = currentPage > 1
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving public jobs: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetPublicJobById(
        Guid id,
        Supabase.Client client,
        HttpContext context,
        IJobViewTrackingService? viewTrackingService = null)
    {
        try
        {
            Console.WriteLine($"🌍 Public job by ID endpoint called for job: {id}");

            // Get all jobs and filter by ID
            var response = await client.From<Job>().Get();
            var job = response.Models.FirstOrDefault(j => j.Id == id);

            if (job == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            // For public endpoint, only allow access to "Active" jobs
            if (!job.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
            {
                return Results.NotFound(new { message = $"Job with ID {id} is not available for public viewing" });
            }

            Console.WriteLine($"🌍 Found public job: {job.Title}");

            // Track the view if service is available
            if (viewTrackingService != null)
            {
                try
                {
                    // 🔥 IMPROVED: Better session ID extraction
                    string sessionId;

                    // First, try to get session ID from custom header (for consistency)
                    var customSessionId = context.Request.Headers["X-Session-ID"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(customSessionId))
                    {
                        sessionId = customSessionId;
                        Console.WriteLine($"🌍 Using custom session ID from header: {sessionId}");
                    }
                    else
                    {
                        // Fallback to built-in session or trace identifier
                        sessionId = context.Session?.Id ?? context.TraceIdentifier;
                        Console.WriteLine($"🌍 Using fallback session ID: {sessionId}");
                    }

                    var ipAddress = context.Connection.RemoteIpAddress?.ToString();
                    var userAgent = context.Request.Headers.UserAgent.ToString();
                    var referrer = context.Request.Headers.Referer.ToString();

                    Console.WriteLine($"🌍 Attempting to track public view - Job: {id}, Session: {sessionId}");

                    var viewRecorded = await viewTrackingService.RecordJobViewAsync(
                        id,
                        context.User?.Identity?.IsAuthenticated == true ? context.User : null,
                        sessionId,
                        ipAddress,
                        userAgent,
                        referrer
                    );

                    Console.WriteLine($"🌍 Public view tracking result: {viewRecorded}");
                }
                catch (Exception viewEx)
                {
                    Console.WriteLine($"⚠️ View tracking failed: {viewEx.Message}");
                }
            }
            else
            {
                Console.WriteLine("⚠️ ViewTrackingService is null - public view not tracked");
            }

            // Update applicant count if needed (real-time fallback)
            var actualApplicantCount = await CalculateApplicantCount(job.Id, client);
            if (job.ApplicantCount != actualApplicantCount)
            {
                await UpdateJobApplicantCount(job.Id, client);
                job.ApplicantCount = actualApplicantCount;
            }

            if (viewTrackingService != null)
            {
                var actualViewCount = await viewTrackingService.GetJobViewCountAsync(job.Id);
                if (job.ViewCount != actualViewCount)
                {
                    await viewTrackingService.UpdateJobViewCountAsync(job.Id, client);
                    job.ViewCount = actualViewCount;
                }
            }

            // Create a complete DTO for applicants
            var jobDto = new
            {
                Id = job.Id,
                Title = job.Title,
                CompanyId = job.CompanyId,
                CreatedBy = job.CreatedBy,
                Description = job.Description,
                Department = job.Department,
                Responsibilities = job.Responsibilities,
                Requirements = job.Requirements,
                Qualifications = job.Qualifications,
                Benefits = job.Benefits,
                EmploymentType = job.EmploymentType,
                SeniorityLevel = job.SeniorityLevel,
                ExperienceYearsMin = job.ExperienceYearsMin,
                LocationType = job.LocationType,
                Locations = job.Locations,
                SalaryMin = job.SalaryMin,
                SalaryMax = job.SalaryMax,
                SalaryCurrency = job.SalaryCurrency,
                ApplicationDeadline = job.ApplicationDeadline,
                Status = job.Status,
                ApplicantCount = job.ApplicantCount,
                ViewCount = job.ViewCount,
                AiGeneratedDescription = job.AiGeneratedDescription,
                SkillMatchThreshold = job.SkillMatchThreshold,
                PostedDate = job.PostedDate,
                ClosedDate = job.ClosedDate,
                InterviewTemplateId = job.InterviewTemplateId,

            };

            return Results.Ok(jobDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving public job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetInterviewTemplatesForJobs(
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine("🔍 Getting interview templates for job creation");

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
            {
                Console.WriteLine("❌ Company ID not found in JWT");
                return Results.Unauthorized();
            }

            Console.WriteLine($"🔍 Getting templates for company: {companyId.Value}");

            // Get interview templates for this company and global templates
            var templatesResponse = await client.From<ai_hr.Models.InterviewTemplate>().Get();
            var templates = templatesResponse.Models
                .Where(t => t.CompanyId == companyId.Value || t.CompanyId == null)
                .OrderByDescending(t => t.IsDefault)
                .ThenBy(t => t.Name)
                .ToList();

            // Create simple DTOs for job creation dropdown
            var templateDtos = templates.Select(template => new
            {
                Id = template.Id,
                Name = template.Name,
                Description = template.Description,
                IsDefault = template.IsDefault,
                CompanyId = template.CompanyId
            }).ToList();

            Console.WriteLine($"🔍 Found {templateDtos.Count} interview templates for company {companyId.Value}");
            return Results.Ok(templateDtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving interview templates for jobs: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    // Helper methods for applicant count management
    public static async Task<int> CalculateApplicantCount(Guid jobId, Supabase.Client client)
    {
        try
        {
            var response = await client.From<ApplicationDetail>()
                .Where(ad => ad.JobId == jobId)
                .Get();

            return response.Models?.Count ?? 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error calculating applicant count for job {jobId}: {ex.Message}");
            return 0;
        }
    }

    public static async Task UpdateJobApplicantCount(Guid jobId, Supabase.Client client)
    {
        try
        {
            // Get current job
            var jobResponse = await client.From<Job>().Get();
            var job = jobResponse.Models.FirstOrDefault(j => j.Id == jobId);

            if (job == null)
            {
                Console.WriteLine($"Job {jobId} not found when updating applicant count");
                return;
            }

            // Calculate actual count
            var actualCount = await CalculateApplicantCount(jobId, client);

            // Update if different
            if (job.ApplicantCount != actualCount)
            {
                job.ApplicantCount = actualCount;
                await client.From<Job>().Update(job);
                Console.WriteLine($"Updated applicant count for job {jobId} ({job.Title}): {actualCount}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating applicant count for job {jobId}: {ex.Message}");
        }
    }

    private static async Task<IResult> FixAllApplicantCounts(Supabase.Client client)
    {
        try
        {
            Console.WriteLine("🔧 Starting bulk fix of all applicant counts");

            var jobsResponse = await client.From<Job>().Get();
            var jobs = jobsResponse.Models;

            int updated = 0;
            int errors = 0;

            foreach (var job in jobs ?? new List<Job>())
            {
                try
                {
                    var actualCount = await CalculateApplicantCount(job.Id, client);
                    if (job.ApplicantCount != actualCount)
                    {
                        job.ApplicantCount = actualCount;
                        await client.From<Job>().Update(job);
                        updated++;
                        Console.WriteLine($"✅ Updated job {job.Id} ({job.Title}): {job.ApplicantCount} → {actualCount} applicants");
                    }
                    else
                    {
                        Console.WriteLine($"✓ Job {job.Id} ({job.Title}): {actualCount} applicants (already correct)");
                    }
                }
                catch (Exception ex)
                {
                    errors++;
                    Console.WriteLine($"❌ Error updating job {job.Id}: {ex.Message}");
                }
            }

            Console.WriteLine($"🔧 Bulk fix completed: {updated} jobs updated, {errors} errors");

            return Results.Ok(new
            {
                message = $"Applicant count fix completed",
                totalJobs = jobs.Count,
                updatedJobs = updated,
                errors = errors,
                success = errors == 0
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error fixing applicant counts: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> FixAllViewCounts(Supabase.Client client)
    {
        try
        {
            Console.WriteLine("🔧 Starting bulk fix of all view counts");

            var jobsResponse = await client.From<Job>().Get();
            var jobs = jobsResponse.Models;

            int updated = 0;
            int errors = 0;

            foreach (var job in jobs ?? new List<Job>())
            {
                try
                {
                    // Get actual view count from job_views table
                    var viewsResponse = await client.From<JobView>()
                        .Where(jv => jv.JobId == job.Id)
                        .Get();

                    var actualViewCount = viewsResponse.Models?.Count ?? 0;

                    if (job.ViewCount != actualViewCount)
                    {
                        job.ViewCount = actualViewCount;
                        await client.From<Job>().Update(job);
                        updated++;
                        Console.WriteLine($"✅ Updated job {job.Id} ({job.Title}): {job.ViewCount} → {actualViewCount} views");
                    }
                    else
                    {
                        Console.WriteLine($"✓ Job {job.Id} ({job.Title}): {actualViewCount} views (already correct)");
                    }
                }
                catch (Exception ex)
                {
                    errors++;
                    Console.WriteLine($"❌ Error updating job {job.Id}: {ex.Message}");
                }
            }

            Console.WriteLine($"🔧 View count fix completed: {updated} jobs updated, {errors} errors");

            return Results.Ok(new
            {
                message = $"View count fix completed",
                totalJobs = jobs.Count,
                updatedJobs = updated,
                errors = errors,
                success = errors == 0
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error fixing view counts: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }



    private static async Task<object> CreateJobDto(Job job, Supabase.Client client)
    {
        // Calculate actual applicant count in real-time
        var actualApplicantCount = await CalculateApplicantCount(job.Id, client);

        return new
        {
            Id = job.Id,
            Title = job.Title,
            CompanyId = job.CompanyId,
            CreatedBy = job.CreatedBy,
            Description = job.Description,
            Department = job.Department,
            Responsibilities = job.Responsibilities,
            Requirements = job.Requirements,
            Qualifications = job.Qualifications,
            Benefits = job.Benefits,
            EmploymentType = job.EmploymentType,
            SeniorityLevel = job.SeniorityLevel,
            ExperienceYearsMin = job.ExperienceYearsMin,
            LocationType = job.LocationType,
            Locations = job.Locations,
            SalaryMin = job.SalaryMin,
            SalaryMax = job.SalaryMax,
            SalaryCurrency = job.SalaryCurrency,
            ApplicationDeadline = job.ApplicationDeadline,
            Status = job.Status,
            ApplicantCount = actualApplicantCount, // Use real-time count
            ViewCount = job.ViewCount,
            AiGeneratedDescription = job.AiGeneratedDescription,
            SkillMatchThreshold = job.SkillMatchThreshold,
            PostedDate = job.PostedDate,
            ClosedDate = job.ClosedDate,
            InterviewTemplateId = job.InterviewTemplateId
        };
    }

    private static async Task<IResult> GetJobAnalytics(
        Guid id,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"📊 Getting analytics for job: {id}");

            // Verify user has access to this job
            var userId = UserIdExtractor.ExtractUserId(user);
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            // Get job
            var jobResponse = await client.From<Job>().Get();
            var job = jobResponse.Models.FirstOrDefault(j => j.Id == id);

            if (job == null)
            {
                return Results.NotFound(new { message = $"Job with ID {id} not found" });
            }

            // Get hiring user to verify they can access this job
            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null || hiringUser.CompanyId != job.CompanyId)
            {
                return Results.Forbid();
            }

            // Get all views for this job
            var viewsResponse = await client.From<JobView>()
                .Where(jv => jv.JobId == id)
                .Get();

            var views = viewsResponse.Models ?? new List<JobView>();

            // Calculate actual applicant count in real-time
            var actualApplicantCount = await CalculateApplicantCount(job.Id, client);

            // Calculate analytics
            var analytics = new
            {
                JobId = job.Id,
                JobTitle = job.Title,
                TotalViews = views.Count,
                UniqueViewers = views.Count, // Since we enforce 1 view per user/session
                ViewsByUserType = views.GroupBy(v => v.UserType)
                    .ToDictionary(g => g.Key, g => g.Count()),
                ViewsByDate = views.GroupBy(v => v.ViewedAt.Date)
                    .OrderBy(g => g.Key)
                    .ToDictionary(g => g.Key.ToString("yyyy-MM-dd"), g => g.Count()),
                RecentViews = views.OrderByDescending(v => v.ViewedAt)
                    .Take(10)
                    .Select(v => new
                    {
                        ViewedAt = v.ViewedAt,
                        UserType = v.UserType,
                        IpAddress = v.IpAddress?.Substring(0, Math.Min(v.IpAddress.Length, 12)) + "...", // Partial IP for privacy
                        UserAgent = !string.IsNullOrEmpty(v.UserAgent) && v.UserAgent.Length > 50
                            ? v.UserAgent.Substring(0, 50) + "..."
                            : v.UserAgent
                    }).ToList(),
                ApplicantCount = actualApplicantCount, // Use real-time count
                ApplicationRate = job.ViewCount > 0 ? (double)actualApplicantCount / job.ViewCount * 100 : 0,
                PostedDate = job.PostedDate
            };

            return Results.Ok(analytics);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error getting job analytics: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static Guid? GetUserCompanyId(ClaimsPrincipal user)
    {
        // Check JWT claims for company_id in user_metadata first
        var userMetadataClaim = user.FindFirst("user_metadata")?.Value;
        if (!string.IsNullOrEmpty(userMetadataClaim))
        {
            try
            {
                var userMetadata = JsonDocument.Parse(userMetadataClaim);
                if (userMetadata.RootElement.TryGetProperty("company_id", out var companyIdElement))
                {
                    var companyIdStr = companyIdElement.GetString();
                    if (companyIdStr != null && Guid.TryParse(companyIdStr, out var companyId))
                    {
                        return companyId;
                    }
                }
            }
            catch
            {
                // If parsing fails, continue to fallback
            }
        }

        // Fallback: Check for direct company_id claim
        var companyIdClaim = user.FindFirst("company_id")?.Value;
        if (companyIdClaim != null && Guid.TryParse(companyIdClaim, out var companyIdFromJwt))
        {
            return companyIdFromJwt;
        }

        return null;
    }
}
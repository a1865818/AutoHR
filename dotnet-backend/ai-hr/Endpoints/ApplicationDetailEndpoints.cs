using ai_hr.Models;
using ai_hr.Contracts;
using Supabase;

namespace ai_hr.Endpoints;

public static class ApplicationDetailEndpoints
{
    public static void MapApplicationDetailEndpoints(this WebApplication app)
    {
        app.MapPost("/applicationdetails", CreateApplicationDetail)
            .WithTags("Application Details")
            .WithName("CreateApplicationDetail")
            .WithSummary("Create new application")
            .WithDescription("Submit a new job application with candidate details and optional documents");

        app.MapGet("/applicationdetails/{id}", GetApplicationDetailById)
            .WithTags("Application Details")
            .WithName("GetApplicationDetailById")
            .WithSummary("Get application by ID")
            .WithDescription("Retrieves details of a specific job application by its unique identifier");

        app.MapGet("/applicationdetails/job/{jobId}", GetApplicationDetailsByJob)
            .WithTags("Application Details")
            .WithName("GetApplicationDetailsByJob")
            .WithSummary("Get applications by job")
            .WithDescription("Retrieves all applications for a specific job posting");

        app.MapGet("/applicationdetails/candidate/{candidateUserId}", GetApplicationDetailsByCandidate)
            .WithTags("Application Details")
            .WithName("GetApplicationDetailsByCandidate")
            .WithSummary("Get applications by candidate")
            .WithDescription("Retrieves all applications submitted by a specific candidate");

        app.MapPut("/applicationdetails/{id}", UpdateApplicationDetail)
            .WithTags("Application Details")
            .WithName("UpdateApplicationDetail")
            .WithSummary("Update application")
            .WithDescription("Update an existing job application's details, documents, or status");

        app.MapDelete("/applicationdetails/{id}", DeleteApplicationDetail)
            .WithTags("Application Details")
            .WithName("DeleteApplicationDetail")
            .WithSummary("Delete application")
            .WithDescription("Permanently removes a job application from the system");
    }

    private static async Task<IResult> CreateApplicationDetail(CreateApplicationDetailRequest request, Supabase.Client client)
    {
        try
        {
            // Generate the ID first
            var applicationId = Guid.NewGuid();

            var applicationDetail = new ApplicationDetail
            {
                Id = applicationId,
                JobId = request.JobId,
                CandidateUserId = request.CandidateUserId,
                ResumeUrl = request.ResumeUrl,
                CoverLetterText = request.CoverLetterText,
                ExpectedSalary = request.ExpectedSalary,
                AvailabilityDate = request.AvailabilityDate,
                JobSource = request.JobSource,
                AiAnalysis = request.AiAnalysis,
                Status = "applied", // Explicitly set default status
                Stage = "initial_review", // Explicitly set default stage
                AppliedAt = DateTime.UtcNow.AddHours(7),
                StatusChangedAt = DateTime.UtcNow.AddHours(7)
            };

            Console.WriteLine($"Creating application detail with ID: {applicationId}");
            Console.WriteLine($"JobId: {request.JobId}, CandidateUserId: {request.CandidateUserId}");

            var response = await client.From<ApplicationDetail>()
         .Upsert(applicationDetail);

            var newApplicationDetail = response.Models.FirstOrDefault();

            if (newApplicationDetail == null)
            {
                Console.WriteLine("Failed to create application detail - no model returned");
                return Results.BadRequest(new { error = "Failed to create application detail." });
            }

            Console.WriteLine($"Application detail created successfully with ID: {newApplicationDetail.Id}");

            // Update job applicant count
            try
            {
                await ai_hr.Endpoints.JobEndpoints.UpdateJobApplicantCount(request.JobId, client);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to update applicant count for job {request.JobId}: {ex.Message}");
                // Don't fail the application creation if count update fails
            }

            // Return the created application with relevant details
            return Results.Ok(new
            {
                applicationId = newApplicationDetail.Id,
                status = newApplicationDetail.Status,
                submittedAt = newApplicationDetail.AppliedAt,
                message = "Application submitted successfully"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating application detail: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");

            // Log the inner exception if it exists
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }

            return Results.BadRequest(new
            {
                error = ex.Message,
                details = ex.ToString(),
                innerException = ex.InnerException?.Message
            });
        }
    }

    private static async Task<IResult> GetApplicationDetailById(Guid id, Supabase.Client client)
    {
        try
        {
            var response = await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Get();
            var applicationDetail = response.Models.FirstOrDefault();

            if (applicationDetail is null)
            {
                return Results.NotFound();
            }

            // Create a simple anonymous object with just the properties we want to return
            // This avoids serialization issues with attributes
            var detailDto = new
            {
                Id = applicationDetail.Id,
                JobId = applicationDetail.JobId,
                CandidateUserId = applicationDetail.CandidateUserId,
                ResumeUrl = applicationDetail.ResumeUrl,
                CoverLetterText = applicationDetail.CoverLetterText,
                ExpectedSalary = applicationDetail.ExpectedSalary,
                AvailabilityDate = applicationDetail.AvailabilityDate,
                Status = applicationDetail.Status,
                Stage = applicationDetail.Stage,
                JobSource = applicationDetail.JobSource,
                OverallAiScore = applicationDetail.OverallAiScore,
                AppliedAt = applicationDetail.AppliedAt,
                StatusChangedAt = applicationDetail.StatusChangedAt
            };

            return Results.Ok(detailDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving application detail: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetApplicationDetailsByJob(Guid jobId, Supabase.Client client)
    {
        try
        {
            var response = await client.From<ApplicationDetail>().Where(ad => ad.JobId == jobId).Get();
            var applicationDetails = response.Models;

            if (applicationDetails == null || !applicationDetails.Any())
            {
                return Results.NotFound(new { message = $"No applications found for job ID: {jobId}" });
            }

            // Create a list of simple DTOs to avoid serialization issues with attributes
            var detailDtos = applicationDetails.Select(ad => new
            {
                Id = ad.Id,
                JobId = ad.JobId,
                CandidateUserId = ad.CandidateUserId,
                ResumeUrl = ad.ResumeUrl,
                CoverLetterText = ad.CoverLetterText,
                ExpectedSalary = ad.ExpectedSalary,
                AvailabilityDate = ad.AvailabilityDate,
                Status = ad.Status,
                Stage = ad.Stage,
                JobSource = ad.JobSource,
                OverallAiScore = ad.OverallAiScore,
                AppliedAt = ad.AppliedAt,
                StatusChangedAt = ad.StatusChangedAt
            }).ToList();

            return Results.Ok(detailDtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving application details by job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetApplicationDetailsByCandidate(Guid candidateUserId, Supabase.Client client)
    {
        try
        {
            var response = await client.From<ApplicationDetail>().Where(ad => ad.CandidateUserId == candidateUserId).Get();
            var applicationDetails = response.Models;

            if (applicationDetails == null || !applicationDetails.Any())
            {
                return Results.NotFound(new { message = $"No applications found for candidate ID: {candidateUserId}" });
            }

            // Create a list of simple DTOs to avoid serialization issues with attributes
            var detailDtos = applicationDetails.Select(ad => new
            {
                Id = ad.Id,
                JobId = ad.JobId,
                CandidateUserId = ad.CandidateUserId,
                ResumeUrl = ad.ResumeUrl,
                CoverLetterText = ad.CoverLetterText,
                ExpectedSalary = ad.ExpectedSalary,
                AvailabilityDate = ad.AvailabilityDate,
                Status = ad.Status,
                Stage = ad.Stage,
                JobSource = ad.JobSource,
                OverallAiScore = ad.OverallAiScore,
                AppliedAt = ad.AppliedAt,
                StatusChangedAt = ad.StatusChangedAt
            }).ToList();

            return Results.Ok(detailDtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving application details by candidate: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> UpdateApplicationDetail(Guid id, UpdateApplicationDetailRequest request, Supabase.Client client)
    {
        try
        {
            // First, get the current application detail
            var getResponse = await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Get();
            var applicationDetail = getResponse.Models.FirstOrDefault();

            if (applicationDetail == null)
            {
                return Results.NotFound();
            }

            // Update the properties if provided in the request
            if (request.ResumeUrl != null) applicationDetail.ResumeUrl = request.ResumeUrl;
            if (request.CoverLetterText != null) applicationDetail.CoverLetterText = request.CoverLetterText;
            if (request.ExpectedSalary.HasValue) applicationDetail.ExpectedSalary = request.ExpectedSalary;
            if (request.AvailabilityDate.HasValue) applicationDetail.AvailabilityDate = request.AvailabilityDate;
            if (request.Status != null) applicationDetail.Status = request.Status;
            if (request.Stage != null) applicationDetail.Stage = request.Stage;
            if (request.JobSource != null) applicationDetail.JobSource = request.JobSource;
            if (request.OverallAiScore.HasValue) applicationDetail.OverallAiScore = request.OverallAiScore;
            if (request.AiAnalysis != null) applicationDetail.AiAnalysis = request.AiAnalysis;

            // Always update the status changed timestamp
            applicationDetail.StatusChangedAt = DateTime.UtcNow.AddHours(7);

            // Update the record
            var response = await client.From<ApplicationDetail>().Update(applicationDetail);

            return Results.Accepted($"/applicationdetails/{id}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating application detail: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> DeleteApplicationDetail(Guid id, Supabase.Client client)
    {
        try
        {
            // First, get the application detail to retrieve the job ID
            var getResponse = await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Get();
            var applicationDetail = getResponse.Models.FirstOrDefault();

            if (applicationDetail == null)
            {
                return Results.NotFound(new { message = $"Application with ID {id} not found" });
            }

            var jobId = applicationDetail.JobId;

            // Delete the application
            await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Delete();

            // Update job applicant count
            try
            {
                await ai_hr.Endpoints.JobEndpoints.UpdateJobApplicantCount(jobId, client);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to update applicant count for job {jobId} after deletion: {ex.Message}");
                // Don't fail the deletion if count update fails
            }

            return Results.NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting application detail: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }



}
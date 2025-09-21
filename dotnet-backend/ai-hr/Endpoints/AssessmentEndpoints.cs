using Microsoft.AspNetCore.Mvc;
using Supabase;
using ai_hr.Models;
using ai_hr.Contracts;
using ai_hr.Utils;
using System.Security.Claims;
using System.Text.Json;
using System.Collections;
using Newtonsoft.Json.Linq;

namespace ai_hr.Endpoints
{
    public static class AssessmentEndpoints
    {
        public static void MapAssessmentEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/assessments")
                .WithTags("Assessments")
                .RequireAuthorization();

            // Assessment Submissions
            group.MapGet("/submissions/{candidateId}/{roundId}", GetAssessmentSubmission)
                .WithName("GetAssessmentSubmission")
                .WithSummary("Get assessment submission for a candidate and round")
                .AllowAnonymous(); // Temporarily allow anonymous access for testing

            group.MapGet("/submissions/job/{jobId}", GetJobAssessmentSubmissions)
                .WithName("GetJobAssessmentSubmissions")
                .WithSummary("Get all assessment submissions for a job")
                .AllowAnonymous(); // Temporarily allow anonymous access for testing

            group.MapGet("/submissions/candidate/{candidateId}", GetCandidateAssessmentSubmissions)
                .WithName("GetCandidateAssessmentSubmissions")
                .WithSummary("Get all assessment submissions for a candidate")
                .AllowAnonymous(); // Temporarily allow anonymous access for testing

            group.MapGet("/submissions/round/{roundId}", GetRoundAssessmentSubmissions)
                .WithName("GetRoundAssessmentSubmissions")
                .WithSummary("Get all assessment submissions for a round");

            group.MapPost("/submissions", CreateAssessmentSubmission)
                .WithName("CreateAssessmentSubmission")
                .WithSummary("Create a new assessment submission");

            group.MapPut("/submissions/{id}", UpdateAssessmentSubmission)
                .WithName("UpdateAssessmentSubmission")
                .WithSummary("Update an assessment submission");

            group.MapDelete("/submissions/{id}", DeleteAssessmentSubmission)
                .WithName("DeleteAssessmentSubmission")
                .WithSummary("Delete an assessment submission");

            // Assessment Grades
            group.MapGet("/grades/{submissionId}", GetAssessmentGrade)
                .WithName("GetAssessmentGrade")
                .WithSummary("Get assessment grade for a submission");

            group.MapPost("/grades", SaveAssessmentGrade)
                .WithName("SaveAssessmentGrade")
                .WithSummary("Save assessment grade");

            group.MapPut("/grades/{id}", UpdateAssessmentGrade)
                .WithName("UpdateAssessmentGrade")
                .WithSummary("Update assessment grade");

            group.MapDelete("/grades/{id}", DeleteAssessmentGrade)
                .WithName("DeleteAssessmentGrade")
                .WithSummary("Delete assessment grade");

            // Test endpoint to verify the API is working
            group.MapGet("/test", () => Results.Ok(new { message = "Assessment API is working!", timestamp = DateTime.UtcNow }))
                .WithName("TestAssessmentAPI")
                .WithSummary("Test endpoint to verify assessment API is working");

            // Simple test endpoint for debugging
            group.MapGet("/debug/{roundId}", (string roundId) => 
                Results.Ok(new { 
                    message = "Debug endpoint working", 
                    roundId = roundId,
                    roundIdLength = roundId?.Length,
                    timestamp = DateTime.UtcNow 
                }))
                .WithName("DebugAssessmentAPI")
                .WithSummary("Debug endpoint to test roundId parsing");

            // Culture Fit Assessment Endpoints (temporarily without auth for testing)
            group.MapGet("/{roundId}/configuration", GetAssessmentConfiguration)
                .WithName("GetAssessmentConfiguration")
                .WithSummary("Get assessment configuration for a round")
                .AllowAnonymous(); // Temporarily allow anonymous access for testing

            group.MapPost("/{roundId}/submit", SubmitAssessmentResults)
                .WithName("SubmitAssessmentResults")
                .WithSummary("Submit assessment results")
                .AllowAnonymous(); // Temporarily allow anonymous access for testing

            group.MapGet("/{roundId}/submission-status/{candidateId}", GetAssessmentSubmissionStatus)
                .WithName("GetAssessmentSubmissionStatus")
                .WithSummary("Check if candidate has submitted assessment for a round")
                .AllowAnonymous(); // Temporarily allow anonymous access for testing
        }

        // // Assessment Submission Endpoints
        // private static async Task<IResult> GetAssessmentSubmission(
        //    Guid candidateId,
        //    Guid roundId,
        //    Supabase.Client client,
        //    ClaimsPrincipal user)
        // {
        //    try
        //    {
        //        Console.WriteLine($"🔍 GetAssessmentSubmission called with:");
        //        Console.WriteLine($"   candidateId: {candidateId}");
        //        Console.WriteLine($"   roundId: {roundId}");

        //        var response = await client
        //            .From<AssessmentSubmission>()
        //            .Where(x => x.CandidateId == candidateId && x.RoundId == roundId)
        //            .Get();

        //        Console.WriteLine($"🔍 Query returned {response.Models.Count} results");

        //        var submission = response.Models.FirstOrDefault();
        //        if (submission == null)
        //        {
        //            Console.WriteLine($"❌ No submission found for candidateId: {candidateId}, roundId: {roundId}");

        //            // Let's also check what submissions DO exist in the table
        //            var allSubmissionsResponse = await client.From<AssessmentSubmission>().Get();
        //            var allSubmissions = allSubmissionsResponse.Models;
        //            Console.WriteLine($"🔍 Total submissions in database: {allSubmissions.Count}");

        //            foreach (var sub in allSubmissions.Take(5)) // Show first 5
        //            {
        //                Console.WriteLine($"   - CandidateId: {sub.CandidateId}, RoundId: {sub.RoundId}, Status: {sub.Status}");
        //            }

        //            return Results.NotFound("Assessment submission not found");
        //        }

        //        // Convert bucket path to signed URL for browser access
        //        string accessiblePdfUrl = submission.PdfUrl;
        //        if (!string.IsNullOrEmpty(submission.PdfUrl) && !submission.PdfUrl.StartsWith("http"))
        //        {
        //            try
        //            {
        //                // Extract bucket name and file name from stored path
        //                var pathParts = submission.PdfUrl.Split('/', 2);
        //                if (pathParts.Length == 2)
        //                {
        //                    var bucketName = pathParts[0];
        //                    var fileName = pathParts[1];

        //                    Console.WriteLine($"🔗 Converting bucket path to signed URL: {bucketName}/{fileName}");
        //                    accessiblePdfUrl = await StorageBucketEndpoints.get_file_url_backend(client, bucketName, fileName);
        //                    Console.WriteLine($"✅ Generated signed URL for PDF access");
        //                }
        //            }
        //            catch (Exception urlEx)
        //            {
        //                Console.WriteLine($"⚠️ Failed to generate signed URL for PDF: {urlEx.Message}");
        //                // Keep original URL as fallback
        //            }
        //        }

        //        var responseDto = new AssessmentSubmissionResponse
        //        {
        //            Id = submission.Id,
        //            CandidateId = submission.CandidateId,
        //            RoundId = submission.RoundId,
        //            JobId = submission.JobId,
        //            SubmittedAt = submission.SubmittedAt,
        //            PdfUrl = accessiblePdfUrl, // Use signed URL
        //            Status = submission.Status,
        //            SubmissionData = submission.SubmissionData,
        //            CreatedAt = submission.CreatedAt,
        //            UpdatedAt = submission.UpdatedAt
        //        };

        //        return Results.Ok(responseDto);
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine($"Error getting assessment submission: {ex.Message}");
        //        return Results.Problem("Failed to get assessment submission");
        //    }
        // }

        private static async Task<IResult> GetAssessmentSubmission(
    Guid candidateId,
    Guid roundId,
    Supabase.Client client,
    ClaimsPrincipal user)
        {
            try
            {
                Console.WriteLine($"🔍 GetAssessmentSubmission called with:");
                Console.WriteLine($"   candidateId: {candidateId}");
                Console.WriteLine($"   roundId: {roundId}");

                var response = await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.CandidateId == candidateId && x.RoundId == roundId)
                    .Get();

                Console.WriteLine($"🔍 Query returned {response.Models.Count} results");

                var submission = response.Models.FirstOrDefault();
                if (submission == null)
                {
                    Console.WriteLine($"❌ No submission found for candidateId: {candidateId}, roundId: {roundId}");
                    
                    // Let's also check what submissions DO exist in the table
                    var allSubmissionsResponse = await client.From<AssessmentSubmission>().Get();
                    var allSubmissions = allSubmissionsResponse.Models;
                    Console.WriteLine($"🔍 Total submissions in database: {allSubmissions.Count}");
                    
                    foreach (var sub in allSubmissions.Take(5)) // Show first 5
                    {
                        Console.WriteLine($"   - CandidateId: {sub.CandidateId}, RoundId: {sub.RoundId}, Status: {sub.Status}");
                    }
                    
                    return Results.NotFound("Assessment submission not found");
                }

                // Convert bucket path to signed URL for browser access
                string accessiblePdfUrl = submission.PdfUrl;
                if (!string.IsNullOrEmpty(submission.PdfUrl) && !submission.PdfUrl.StartsWith("http"))
                {
                    try
                    {
                        var pathParts = submission.PdfUrl.Split('/', 2);
                        if (pathParts.Length == 2)
                        {
                            var bucketName = pathParts[0];
                            var fileName = pathParts[1];
                            accessiblePdfUrl = await StorageBucketEndpoints.get_file_url_backend(client, bucketName, fileName);
                        }
                    }
                    catch (Exception urlEx)
                    {
                        Console.WriteLine($"⚠️ Failed to generate signed URL for PDF: {urlEx.Message}");
                    }
                }

                // --- Fetch candidate info from ApplicationUser ---
                CandidateInfo? candidateInfo = null;
                try
                {
                    // ApplicationUser.Id is a string, so convert candidateId to string
                    var candidateUserResponse = await client
                        .From<ApplicationUser>()
                        .Get();

                    var candidateUser = candidateUserResponse.Models
                        .FirstOrDefault(u =>
                            string.Equals(
                                u.Id.Replace("-", "").ToLowerInvariant(),
                                candidateId.ToString().Replace("-", "").ToLowerInvariant()
                            )
                        );

                    Console.WriteLine($"Looking for ApplicationUser with Id: {candidateId.ToString()}");
                    Console.WriteLine($"Found {candidateUserResponse.Models.Count} users");
                    if (candidateUserResponse.Models.Count > 0)
                    {
                        Console.WriteLine($"First user Id: {candidateUserResponse.Models[0].Id}");
                    }

                    if (candidateUser != null)
                    {
                        candidateInfo = new CandidateInfo
                        {
                            Id = Guid.TryParse(candidateUser.Id, out var guid) ? guid : Guid.Empty,
                            Name = $"{candidateUser.FirstName} {candidateUser.LastName}".Trim(),
                            Email = candidateUser.Email,
                            Photo = candidateUser.SocialLink != null && candidateUser.SocialLink.ContainsKey("photo")
                                ? candidateUser.SocialLink["photo"]?.ToString()
                                : null
                        };
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Failed to fetch candidate info: {ex.Message}");
                }

                var responseDto = new AssessmentSubmissionResponse
                {
                    Id = submission.Id,
                    CandidateId = submission.CandidateId,
                    RoundId = submission.RoundId,
                    JobId = submission.JobId,
                    SubmittedAt = submission.SubmittedAt,
                    PdfUrl = accessiblePdfUrl,
                    Status = submission.Status,
                    SubmissionData = ProcessRetrievedSubmissionData(submission.SubmissionData),
                    CreatedAt = submission.CreatedAt,
                    UpdatedAt = submission.UpdatedAt,
                    Candidate = candidateInfo
                };

                return Results.Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting assessment submission: {ex.Message}");
                return Results.Problem("Failed to get assessment submission");
            }
        }

        private static async Task<IResult> GetJobAssessmentSubmissions(
            Guid jobId,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                var response = await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.JobId == jobId)
                    .Get();

                var submissions = new List<AssessmentSubmissionResponse>();

                foreach (var s in response.Models)
                {
                    // Convert bucket path to signed URL for browser access
                    string accessiblePdfUrl = s.PdfUrl;
                    if (!string.IsNullOrEmpty(s.PdfUrl) && !s.PdfUrl.StartsWith("http"))
                    {
                        try
                        {
                            var pathParts = s.PdfUrl.Split('/', 2);
                            if (pathParts.Length == 2)
                            {
                                var bucketName = pathParts[0];
                                var fileName = pathParts[1];
                                accessiblePdfUrl = await StorageBucketEndpoints.get_file_url_backend(client, bucketName, fileName);
                            }
                        }
                        catch (Exception urlEx)
                        {
                            Console.WriteLine($"⚠️ Failed to generate signed URL for PDF: {urlEx.Message}");
                        }
                    }

                    submissions.Add(new AssessmentSubmissionResponse
                    {
                        Id = s.Id,
                        CandidateId = s.CandidateId,
                        RoundId = s.RoundId,
                        JobId = s.JobId,
                        SubmittedAt = s.SubmittedAt,
                        PdfUrl = accessiblePdfUrl,
                        Status = s.Status,
                        SubmissionData = ProcessRetrievedSubmissionData(s.SubmissionData),
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt
                    });
                }

                return Results.Ok(submissions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting job assessment submissions: {ex.Message}");
                return Results.Problem("Failed to get job assessment submissions");
            }
        }

        private static async Task<IResult> GetCandidateAssessmentSubmissions(
            Guid candidateId,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                Console.WriteLine($"🔍 GetCandidateAssessmentSubmissions called for candidateId: {candidateId}");

                var response = await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.CandidateId == candidateId)
                    .Get();

                Console.WriteLine($"🔍 Found {response.Models.Count} submissions for candidate {candidateId}");

                var submissions = new List<AssessmentSubmissionResponse>();

                foreach (var s in response.Models)
                {
                    Console.WriteLine($"🔍 Processing submission: ID={s.Id}, RoundId={s.RoundId}, Status={s.Status}");

                    // Convert bucket path to signed URL for browser access
                    string accessiblePdfUrl = s.PdfUrl;
                    if (!string.IsNullOrEmpty(s.PdfUrl) && !s.PdfUrl.StartsWith("http"))
                    {
                        try
                        {
                            var pathParts = s.PdfUrl.Split('/', 2);
                            if (pathParts.Length == 2)
                            {
                                var bucketName = pathParts[0];
                                var fileName = pathParts[1];
                                accessiblePdfUrl = await StorageBucketEndpoints.get_file_url_backend(client, bucketName, fileName);
                            }
                        }
                        catch (Exception urlEx)
                        {
                            Console.WriteLine($"⚠️ Failed to generate signed URL for PDF: {urlEx.Message}");
                        }
                    }

                    submissions.Add(new AssessmentSubmissionResponse
                    {
                        Id = s.Id,
                        CandidateId = s.CandidateId,
                        RoundId = s.RoundId,
                        JobId = s.JobId,
                        SubmittedAt = s.SubmittedAt,
                        PdfUrl = accessiblePdfUrl,
                        Status = s.Status,
                        SubmissionData = ProcessRetrievedSubmissionData(s.SubmissionData),
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt
                    });
                }

                return Results.Ok(submissions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting candidate assessment submissions: {ex.Message}");
                return Results.Problem("Failed to get candidate assessment submissions");
            }
        }

        private static async Task<IResult> GetRoundAssessmentSubmissions(
            Guid roundId,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                var response = await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.RoundId == roundId)
                    .Get();

                var submissions = new List<AssessmentSubmissionResponse>();

                foreach (var s in response.Models)
                {
                    // Convert bucket path to signed URL for browser access
                    string accessiblePdfUrl = s.PdfUrl;
                    if (!string.IsNullOrEmpty(s.PdfUrl) && !s.PdfUrl.StartsWith("http"))
                    {
                        try
                        {
                            var pathParts = s.PdfUrl.Split('/', 2);
                            if (pathParts.Length == 2)
                            {
                                var bucketName = pathParts[0];
                                var fileName = pathParts[1];
                                accessiblePdfUrl = await StorageBucketEndpoints.get_file_url_backend(client, bucketName, fileName);
                            }
                        }
                        catch (Exception urlEx)
                        {
                            Console.WriteLine($"⚠️ Failed to generate signed URL for PDF: {urlEx.Message}");
                        }
                    }

                    submissions.Add(new AssessmentSubmissionResponse
                    {
                        Id = s.Id,
                        CandidateId = s.CandidateId,
                        RoundId = s.RoundId,
                        JobId = s.JobId,
                        SubmittedAt = s.SubmittedAt,
                        PdfUrl = accessiblePdfUrl,
                        Status = s.Status,
                        SubmissionData = ProcessRetrievedSubmissionData(s.SubmissionData),
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt
                    });
                }

                return Results.Ok(submissions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting round assessment submissions: {ex.Message}");
                return Results.Problem("Failed to get round assessment submissions");
            }
        }

        private static async Task<IResult> CreateAssessmentSubmission(
            AssessmentSubmissionCreateRequest request,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                Console.WriteLine($"[Backend] Incoming AssessmentSubmissionCreateRequest: {System.Text.Json.JsonSerializer.Serialize(request)}");
                var submission = new AssessmentSubmission
                {
                    CandidateId = request.CandidateId,
                    RoundId = request.RoundId,
                    JobId = request.JobId,
                    PdfUrl = request.PdfUrl,
                    SubmissionData = request.SubmissionData ?? new Dictionary<string, object>(),
                    Status = "submitted"
                };

                var response = await client
                    .From<AssessmentSubmission>()
                    .Insert(submission);

                var createdSubmission = response.Models.First();
                var responseDto = new AssessmentSubmissionResponse
                {
                    Id = createdSubmission.Id,
                    CandidateId = createdSubmission.CandidateId,
                    RoundId = createdSubmission.RoundId,
                    JobId = createdSubmission.JobId,
                    SubmittedAt = createdSubmission.SubmittedAt,
                    PdfUrl = createdSubmission.PdfUrl,
                    Status = createdSubmission.Status,
                    SubmissionData = ProcessRetrievedSubmissionData(createdSubmission.SubmissionData),
                    CreatedAt = createdSubmission.CreatedAt,
                    UpdatedAt = createdSubmission.UpdatedAt
                };

                return Results.Created($"/api/assessments/submissions/{createdSubmission.Id}", responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating assessment submission: {ex.Message}");
                return Results.Problem("Failed to create assessment submission");
            }
        }

        private static async Task<IResult> UpdateAssessmentSubmission(
            Guid id,
            AssessmentSubmissionUpdateRequest request,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                var response = await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.Id == id)
                    .Get();

                var submission = response.Models.FirstOrDefault();
                if (submission == null)
                {
                    return Results.NotFound("Assessment submission not found");
                }

                // Update fields if provided
                if (!string.IsNullOrEmpty(request.PdfUrl))
                    submission.PdfUrl = request.PdfUrl;
                if (!string.IsNullOrEmpty(request.Status))
                    submission.Status = request.Status;
                if (request.SubmissionData != null)
                    submission.SubmissionData = request.SubmissionData;

                submission.UpdatedAt = DateTime.UtcNow;

                var updateResponse = await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.Id == id)
                    .Update(submission);

                var updatedSubmission = updateResponse.Models.First();
                var responseDto = new AssessmentSubmissionResponse
                {
                    Id = updatedSubmission.Id,
                    CandidateId = updatedSubmission.CandidateId,
                    RoundId = updatedSubmission.RoundId,
                    JobId = updatedSubmission.JobId,
                    SubmittedAt = updatedSubmission.SubmittedAt,
                    PdfUrl = updatedSubmission.PdfUrl,
                    Status = updatedSubmission.Status,
                    SubmissionData = ProcessRetrievedSubmissionData(updatedSubmission.SubmissionData),
                    CreatedAt = updatedSubmission.CreatedAt,
                    UpdatedAt = updatedSubmission.UpdatedAt
                };

                return Results.Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating assessment submission: {ex.Message}");
                return Results.Problem("Failed to update assessment submission");
            }
        }

        private static async Task<IResult> DeleteAssessmentSubmission(
            Guid id,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.Id == id)
                    .Delete();

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting assessment submission: {ex.Message}");
                return Results.Problem("Failed to delete assessment submission");
            }
        }

        // Assessment Grade Endpoints
        private static async Task<IResult> GetAssessmentGrade(
            Guid submissionId,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                Console.WriteLine($"🔍 Looking for assessment grade for submission: {submissionId}");

                var response = await client
                    .From<AssessmentGrade>()
                    .Where(x => x.SubmissionId == submissionId)
                    .Get();

                var grade = response.Models.FirstOrDefault();
                if (grade == null)
                {
                    Console.WriteLine($"📝 No existing grade found for submission: {submissionId} (this is normal for new submissions)");
                    return Results.NotFound("Assessment grade not found");
                }

                Console.WriteLine($"✅ Found existing grade for submission: {submissionId}");

                var responseDto = new AssessmentGradeResponse
                {
                    Id = grade.Id,
                    SubmissionId = grade.SubmissionId,
                    CandidateId = grade.CandidateId,
                    RoundId = grade.RoundId,
                    JobId = grade.JobId,
                    TotalScore = grade.TotalScore,
                    MaxScore = grade.MaxScore,
                    Percentage = grade.Percentage,
                    OverallNotes = grade.OverallNotes,
                    QuestionScores = ConvertQuestionScores(grade.QuestionScores),
                    GradedAt = grade.GradedAt,
                    GradedBy = grade.GradedBy,
                    Status = grade.Status,
                    CreatedAt = grade.CreatedAt,
                    UpdatedAt = grade.UpdatedAt
                };

                return Results.Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting assessment grade: {ex.Message}");
                return Results.Problem("Failed to get assessment grade");
            }
        }

        private static async Task<IResult> SaveAssessmentGrade(
            AssessmentGradeRequest request,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                Console.WriteLine($"🔍 SaveAssessmentGrade called with request: {System.Text.Json.JsonSerializer.Serialize(request)}");

                var userId = GetUserId(user);
                if (!userId.HasValue)
                {
                    Console.WriteLine("❌ User ID not found in claims");
                    return Results.Unauthorized();
                }

                Console.WriteLine($"✅ User ID: {userId.Value}");

                // Check if submission exists
                var submissionResponse = await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.Id == request.SubmissionId)
                    .Get();

                var submission = submissionResponse.Models.FirstOrDefault();
                if (submission == null)
                {
                    return Results.NotFound("Assessment submission not found");
                }

                // Check if grade already exists
                var existingGradeResponse = await client
                    .From<AssessmentGrade>()
                    .Where(x => x.SubmissionId == request.SubmissionId)
                    .Get();

                var existingGrade = existingGradeResponse.Models.FirstOrDefault();

                // Calculate percentage
                var percentage = request.MaxScore > 0 ? (request.TotalScore / request.MaxScore) * 100 : 0;

                if (existingGrade != null)
                {
                    // Update existing grade
                    existingGrade.TotalScore = request.TotalScore;
                    existingGrade.MaxScore = request.MaxScore;
                    existingGrade.Percentage = percentage;
                    existingGrade.OverallNotes = request.OverallNotes;
                    existingGrade.QuestionScores = ConvertQuestionScoresToDict(request.QuestionScores);
                    existingGrade.Status = "final";
                    existingGrade.UpdatedAt = DateTime.UtcNow;

                    var updateResponse = await client
                        .From<AssessmentGrade>()
                        .Where(x => x.Id == existingGrade.Id)
                        .Update(existingGrade);

                    var updatedGrade = updateResponse.Models.First();
                    var responseDto = new AssessmentGradeResponse
                    {
                        Id = updatedGrade.Id,
                        SubmissionId = updatedGrade.SubmissionId,
                        CandidateId = updatedGrade.CandidateId,
                        RoundId = updatedGrade.RoundId,
                        JobId = updatedGrade.JobId,
                        TotalScore = updatedGrade.TotalScore,
                        MaxScore = updatedGrade.MaxScore,
                        Percentage = updatedGrade.Percentage,
                        OverallNotes = updatedGrade.OverallNotes,
                        QuestionScores = ConvertQuestionScores(updatedGrade.QuestionScores),
                        GradedAt = updatedGrade.GradedAt,
                        GradedBy = updatedGrade.GradedBy,
                        Status = updatedGrade.Status,
                        CreatedAt = updatedGrade.CreatedAt,
                        UpdatedAt = updatedGrade.UpdatedAt
                    };

                    // Update submission status to graded
                    submission.Status = "graded";
                    submission.UpdatedAt = DateTime.UtcNow;
                    await client
                        .From<AssessmentSubmission>()
                        .Where(x => x.Id == request.SubmissionId)
                        .Update(submission);

                    return Results.Ok(responseDto);
                }
                else
                {
                    // Create new grade
                    var grade = new AssessmentGrade
                    {
                        SubmissionId = request.SubmissionId,
                        CandidateId = submission.CandidateId,
                        RoundId = submission.RoundId,
                        JobId = submission.JobId,
                        TotalScore = request.TotalScore,
                        MaxScore = request.MaxScore,
                        Percentage = percentage,
                        OverallNotes = request.OverallNotes,
                        QuestionScores = ConvertQuestionScoresToDict(request.QuestionScores),
                        GradedBy = userId.Value,
                        Status = "final"
                    };

                    var response = await client
                        .From<AssessmentGrade>()
                        .Insert(grade);

                    var createdGrade = response.Models.First();

                    // Update submission status to graded
                    submission.Status = "graded";
                    submission.UpdatedAt = DateTime.UtcNow;
                    await client
                        .From<AssessmentSubmission>()
                        .Where(x => x.Id == request.SubmissionId)
                        .Update(submission);

                    var responseDto = new AssessmentGradeResponse
                    {
                        Id = createdGrade.Id,
                        SubmissionId = createdGrade.SubmissionId,
                        CandidateId = createdGrade.CandidateId,
                        RoundId = createdGrade.RoundId,
                        JobId = createdGrade.JobId,
                        TotalScore = createdGrade.TotalScore,
                        MaxScore = createdGrade.MaxScore,
                        Percentage = createdGrade.Percentage,
                        OverallNotes = createdGrade.OverallNotes,
                        QuestionScores = ConvertQuestionScores(createdGrade.QuestionScores),
                        GradedAt = createdGrade.GradedAt,
                        GradedBy = createdGrade.GradedBy,
                        Status = createdGrade.Status,
                        CreatedAt = createdGrade.CreatedAt,
                        UpdatedAt = createdGrade.UpdatedAt
                    };

                    return Results.Created($"/api/assessments/grades/{createdGrade.Id}", responseDto);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving assessment grade: {ex.Message}");
                return Results.Problem("Failed to save assessment grade");
            }
        }


        private static async Task<IResult> UpdateAssessmentGrade(
            Guid id,
            AssessmentGradeUpdateRequest request,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                var response = await client
                    .From<AssessmentGrade>()
                    .Where(x => x.Id == id)
                    .Get();

                var grade = response.Models.FirstOrDefault();
                if (grade == null)
                {
                    return Results.NotFound("Assessment grade not found");
                }

                // Update fields if provided
                if (request.TotalScore.HasValue)
                    grade.TotalScore = request.TotalScore.Value;
                if (request.MaxScore.HasValue)
                    grade.MaxScore = request.MaxScore.Value;
                if (!string.IsNullOrEmpty(request.OverallNotes))
                    grade.OverallNotes = request.OverallNotes;
                if (request.QuestionScores != null)
                    grade.QuestionScores = ConvertQuestionScoresToDict(request.QuestionScores);
                if (!string.IsNullOrEmpty(request.Status))
                    grade.Status = request.Status;

                // Recalculate percentage if scores changed
                if (request.TotalScore.HasValue || request.MaxScore.HasValue)
                {
                    grade.Percentage = grade.MaxScore > 0 ? (grade.TotalScore / grade.MaxScore) * 100 : 0;
                }

                grade.UpdatedAt = DateTime.UtcNow;

                var updateResponse = await client
                    .From<AssessmentGrade>()
                    .Where(x => x.Id == id)
                    .Update(grade);

                var updatedGrade = updateResponse.Models.First();
                var responseDto = new AssessmentGradeResponse
                {
                    Id = updatedGrade.Id,
                    SubmissionId = updatedGrade.SubmissionId,
                    CandidateId = updatedGrade.CandidateId,
                    RoundId = updatedGrade.RoundId,
                    JobId = updatedGrade.JobId,
                    TotalScore = updatedGrade.TotalScore,
                    MaxScore = updatedGrade.MaxScore,
                    Percentage = updatedGrade.Percentage,
                    OverallNotes = updatedGrade.OverallNotes,
                    QuestionScores = ConvertQuestionScores(updatedGrade.QuestionScores),
                    GradedAt = updatedGrade.GradedAt,
                    GradedBy = updatedGrade.GradedBy,
                    Status = updatedGrade.Status,
                    CreatedAt = updatedGrade.CreatedAt,
                    UpdatedAt = updatedGrade.UpdatedAt
                };

                return Results.Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating assessment grade: {ex.Message}");
                return Results.Problem("Failed to update assessment grade");
            }
        }

        private static async Task<IResult> DeleteAssessmentGrade(
            Guid id,
            Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                await client
                    .From<AssessmentGrade>()
                    .Where(x => x.Id == id)
                    .Delete();

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting assessment grade: {ex.Message}");
                return Results.Problem("Failed to delete assessment grade");
            }
        }

        // Helper methods
        private static Guid? GetUserId(ClaimsPrincipal user)
        {
            var userIdClaim = UserIdExtractor.ExtractUserId(user);
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        private static List<QuestionScoreResponse> ConvertQuestionScores(object questionScores)
        {
            if (questionScores == null)
            {
                Console.WriteLine("🔍 Question scores is null, returning empty list");
                return new List<QuestionScoreResponse>();
            }

            try
            {
                Console.WriteLine($"🔍 Processing question scores of type: {questionScores.GetType().Name}");

                // First, convert the raw data using the same pattern as RoundConfiguration
                var processedData = ConvertFromJsonElement(questionScores);
                Console.WriteLine($"🔍 Processed data type: {processedData?.GetType().Name}");

                // Now convert to List<QuestionScoreResponse>
                return ConvertToQuestionScoreResponseList(processedData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error processing question scores: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                return new List<QuestionScoreResponse>();
            }
        }

        // Convert processed data to List<QuestionScoreResponse>
        private static List<QuestionScoreResponse> ConvertToQuestionScoreResponseList(object processedData)
        {
            var result = new List<QuestionScoreResponse>();

            try
            {
                if (processedData is List<object> list)
                {
                    Console.WriteLine($"🔍 Converting list with {list.Count} items");

                    foreach (var item in list)
                    {
                        if (item is Dictionary<string, object> dict)
                        {
                            var score = ConvertDictionaryToQuestionScoreResponse(dict);
                            if (score != null)
                            {
                                result.Add(score);
                            }
                        }
                    }
                }
                else if (processedData is Dictionary<string, object> dict)
                {
                    // Single item case
                    var score = ConvertDictionaryToQuestionScoreResponse(dict);
                    if (score != null)
                    {
                        result.Add(score);
                    }
                }

                Console.WriteLine($"✅ Converted to {result.Count} question score responses");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error converting to QuestionScoreResponse list: {ex.Message}");
                return new List<QuestionScoreResponse>();
            }
        }

        // Convert Dictionary to QuestionScoreResponse
        private static QuestionScoreResponse? ConvertDictionaryToQuestionScoreResponse(Dictionary<string, object> dict)
        {
            try
            {
                var score = new QuestionScoreResponse();

                if (dict.TryGetValue("questionId", out var questionId))
                    score.QuestionId = questionId?.ToString() ?? "";

                if (dict.TryGetValue("score", out var scoreValue) && scoreValue != null)
                {
                    if (decimal.TryParse(scoreValue.ToString(), out var parsedScore))
                        score.Score = parsedScore;
                }

                if (dict.TryGetValue("maxScore", out var maxScoreValue) && maxScoreValue != null)
                {
                    if (decimal.TryParse(maxScoreValue.ToString(), out var parsedMaxScore))
                        score.MaxScore = parsedMaxScore;
                }

                if (dict.TryGetValue("notes", out var notes))
                    score.Notes = notes?.ToString() ?? "";

                return score;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error converting dictionary to QuestionScoreResponse: {ex.Message}");
                return null;
            }
        }

        // Helper method to convert JsonElement objects to .NET types
        private static object ConvertFromJsonElement(object value)
        {
            if (value is JArray jArray)
            {
                var list = new List<object>();
                foreach (var item in jArray)
                {
                    list.Add(ConvertFromJsonElement(item));
                }
                return list;
            }
            else if (value is JObject jObject)
            {
                var dict = new Dictionary<string, object>();
                foreach (var prop in jObject.Properties())
                {
                    dict[prop.Name] = ConvertFromJsonElement(prop.Value);
                }
                return dict;
            }
            else if (value is JValue jValue)
            {
                return jValue.Value;
            }
            else if (value is JsonElement jsonElement)
            {
                switch (jsonElement.ValueKind)
                {
                    case JsonValueKind.Object:
                        return ConvertJsonElementObject(jsonElement);
                    case JsonValueKind.Array:
                        return ConvertJsonElementArray(jsonElement);
                    case JsonValueKind.String:
                        return jsonElement.GetString() ?? string.Empty;
                    case JsonValueKind.Number:
                        return jsonElement.TryGetInt64(out long l) ? l : jsonElement.GetDouble();
                    case JsonValueKind.True:
                        return true;
                    case JsonValueKind.False:
                        return false;
                    case JsonValueKind.Null:
                        return null;
                    default:
                        return null;
                }
            }
            else if (value is Dictionary<string, object> dict)
            {
                var result = new Dictionary<string, object>();
                foreach (var kvp in dict)
                {
                    result[kvp.Key] = ConvertFromJsonElement(kvp.Value);
                }
                return result;
            }
            else if (value is IList list)
            {
                var result = new List<object>();
                foreach (var item in list)
                {
                    result.Add(ConvertFromJsonElement(item));
                }
                return result;
            }
            return value;
        }

        private static Dictionary<string, object> ConvertJsonElementObject(JsonElement element)
        {
            var result = new Dictionary<string, object>();
            foreach (var property in element.EnumerateObject())
            {
                result[property.Name] = ConvertFromJsonElement(property.Value);
            }
            return result;
        }

        private static List<object> ConvertJsonElementArray(JsonElement element)
        {
            var result = new List<object>();
            foreach (var item in element.EnumerateArray())
            {
                result.Add(ConvertFromJsonElement(item));
            }
            return result;
        }

        private static object ConvertQuestionScoresToDict(List<QuestionScoreRequest> questionScores)
        {
            var scores = questionScores.Select(qs => new
            {
                questionId = qs.QuestionId,
                score = qs.Score,
                maxScore = qs.MaxScore,
                notes = qs.Notes
            }).ToList();

            return scores;
        }

        // Culture Fit Assessment Endpoints
        private static async Task<IResult> GetAssessmentConfiguration(
            string roundId,
            Supabase.Client client,
            ClaimsPrincipal? user = null)
        {
            try
            {
                Console.WriteLine($"🔍 GetAssessmentConfiguration called for roundId: {roundId}");
                Console.WriteLine($"🔍 RoundId length: {roundId?.Length}");
                Console.WriteLine($"🔍 RoundId format check: {roundId?.Contains("-")} (contains hyphens)");
                Console.WriteLine($"🔍 RoundId format: {roundId}");

                // Parse the roundId to get the actual GUID
                if (!Guid.TryParse(roundId, out var roundGuid))
                {
                    Console.WriteLine($"❌ Failed to parse roundId as GUID: {roundId}");
                    return Results.BadRequest(new { error = "Invalid round ID format" });
                }
                
                Console.WriteLine($"✅ Successfully parsed roundId as GUID: {roundGuid}");

                // Get ALL round configurations for this round to see what we have
                Console.WriteLine($"🔍 Looking for ALL round configurations with RoundId: {roundGuid}");
                var allConfigsResponse = await client.From<RoundConfiguration>()
                    .Where(rc => rc.RoundId == roundGuid)
                    .Get();
                
                Console.WriteLine($"🔍 Found {allConfigsResponse.Models?.Count ?? 0} total round configurations");
                
                // Log all configurations found
                foreach (var cfg in allConfigsResponse.Models)
                {
                    Console.WriteLine($"🔍 Config: ID={cfg.Id}, Type={cfg.RoundType}, Name={cfg.Name}, Status={cfg.Status}");
                    if (cfg.ConfigurationData != null)
                    {
                        Console.WriteLine($"🔍   ConfigData keys: {string.Join(", ", cfg.ConfigurationData.Keys)}");
                        Console.WriteLine($"🔍   ConfigData count: {cfg.ConfigurationData.Count}");
                    }
                }
                
                // Try to find a configuration with cultureQuestions
                var configWithCultureQuestions = allConfigsResponse.Models.FirstOrDefault(cfg => 
                    cfg.ConfigurationData != null && 
                    cfg.ConfigurationData.ContainsKey("cultureQuestions"));
                
                RoundConfiguration? config;
                if (configWithCultureQuestions != null)
                {
                    Console.WriteLine($"✅ Found config with cultureQuestions: ID={configWithCultureQuestions.Id}, Type={configWithCultureQuestions.RoundType}");
                    config = configWithCultureQuestions;
                }
                else
                {
                    Console.WriteLine($"❌ No config found with cultureQuestions in this round, searching for any culture_fit round with complete data...");
                    
                    // If no config with cultureQuestions found in this specific round, 
                    // search for ANY culture_fit round that has complete configuration
                    var allCultureFitConfigsResponse = await client.From<RoundConfiguration>()
                        .Where(rc => rc.RoundType == "culture_fit")
                        .Get();
                    
                    var cultureFitConfigWithQuestions = allCultureFitConfigsResponse.Models.FirstOrDefault(cfg => 
                        cfg.ConfigurationData != null && 
                        cfg.ConfigurationData.ContainsKey("cultureQuestions"));
                    
                    if (cultureFitConfigWithQuestions != null)
                    {
                        Console.WriteLine($"✅ Found culture_fit config with cultureQuestions from different round: ID={cultureFitConfigWithQuestions.Id}, RoundId={cultureFitConfigWithQuestions.RoundId}");
                        config = cultureFitConfigWithQuestions;
                    }
                    else
                    {
                        Console.WriteLine($"❌ No culture_fit config with cultureQuestions found anywhere, using first available");
                        config = allConfigsResponse.Models.FirstOrDefault();
                    }
                }
                if (config == null)
                {
                    Console.WriteLine($"❌ No configuration found for roundId: {roundGuid}");
                    return Results.NotFound(new { error = "Assessment configuration not found" });
                }

                // Debug: Log the configuration data
                Console.WriteLine($"🔍 Selected config: ID={config.Id}, Type={config.RoundType}, Name={config.Name}");
                Console.WriteLine($"🔍 Configuration data type: {config.ConfigurationData?.GetType()}");
                Console.WriteLine($"🔍 Configuration data keys: {config.ConfigurationData?.Keys?.Count ?? 0}");
                if (config.ConfigurationData != null)
                {
                    Console.WriteLine($"🔍 Configuration data keys: {string.Join(", ", config.ConfigurationData.Keys)}");
                    
                    // Check if cultureQuestions exists
                    if (config.ConfigurationData.TryGetValue("cultureQuestions", out var originalCultureQuestions))
                    {
                        Console.WriteLine($"✅ cultureQuestions found: {originalCultureQuestions?.GetType()}");
                        if (originalCultureQuestions is IList list)
                        {
                            Console.WriteLine($"✅ cultureQuestions count: {list.Count}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"❌ cultureQuestions NOT found in configuration data");
                    }
                }
                
                // Use the same proven approach as RoundConfigurationEndpoints
                Console.WriteLine($"🔍 Processing configuration data using RoundConfigurationEndpoints approach...");
                
                // Process the configuration data using the same method as RoundConfigurationEndpoints
                var processedConfigData = ProcessRetrievedConfigurationData(config.ConfigurationData);
                
                Console.WriteLine($"🔍 Processed config data keys: {string.Join(", ", processedConfigData.Keys)}");
                if (processedConfigData.TryGetValue("cultureQuestions", out var processedCultureQuestions))
                {
                    Console.WriteLine($"✅ cultureQuestions found in processed data: {processedCultureQuestions?.GetType()}");
                    if (processedCultureQuestions is IList list)
                    {
                        Console.WriteLine($"✅ cultureQuestions count: {list.Count}");
                    }
                }
                else
                {
                    Console.WriteLine($"❌ cultureQuestions NOT found in processed data");
                }
                
                // Use the processed configuration data
                var finalConfigData = processedConfigData;
                
                Console.WriteLine($"🔍 Final config data keys: {string.Join(", ", finalConfigData.Keys)}");
                Console.WriteLine($"🔍 Final config data count: {finalConfigData.Count}");
                
                // Check if we have any data at all
                if (finalConfigData.Count == 0)
                {
                    Console.WriteLine($"❌ No data in final config - returning empty response");
                    return Results.Ok(new
                    {
                        success = true,
                        data = new Dictionary<string, object>()
                    });
                }
                
                // Calculate duration based on actual questions and scenarios
                int calculatedDuration = CalculateAssessmentDuration(finalConfigData, config.Duration);
                finalConfigData["duration"] = calculatedDuration;
                Console.WriteLine($"✅ Calculated assessment duration: {calculatedDuration} minutes");
                
                // Return the configuration data
                return Results.Ok(new
                {
                    success = true,
                    data = finalConfigData
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error getting assessment configuration: {ex.Message}");
                return Results.Problem($"Failed to get assessment configuration: {ex.Message}");
            }
        }


        // Helper method to process configuration data retrieved from database
        private static Dictionary<string, object> ProcessRetrievedConfigurationData(Dictionary<string, object>? configData)
        {
            Console.WriteLine($"🔍 ProcessRetrievedConfigurationData called with configData: {configData?.Count ?? 0} keys");
            
            if (configData == null)
            {
                Console.WriteLine($"❌ ConfigData is null");
                return new Dictionary<string, object>();
            }

            Console.WriteLine($"🔍 Original configData keys: {string.Join(", ", configData.Keys)}");
            
            var processedData = new Dictionary<string, object>();

            foreach (var kvp in configData)
            {
                Console.WriteLine($"🔍 Processing key: {kvp.Key}, value type: {kvp.Value?.GetType()}");
                var convertedValue = ConvertFromJsonElement(kvp.Value);
                Console.WriteLine($"🔍 Converted value type: {convertedValue?.GetType()}");
                processedData[kvp.Key] = convertedValue;
            }

            Console.WriteLine($"🔍 Processed data keys: {string.Join(", ", processedData.Keys)}");
            return processedData;
        }

        // Helper method to process submission data before storing in database
        private static Dictionary<string, object> ProcessSubmissionData(Dictionary<string, object>? submissionData)
        {
            Console.WriteLine($"🔍 ProcessSubmissionData called with submissionData: {submissionData?.Count ?? 0} keys");
            
            if (submissionData == null)
            {
                Console.WriteLine($"❌ SubmissionData is null");
                return new Dictionary<string, object>();
            }

            Console.WriteLine($"🔍 Original submissionData keys: {string.Join(", ", submissionData.Keys)}");
            
            // Use the same processing logic as configuration data
            return ProcessRetrievedConfigurationData(submissionData);
        }

        // Helper method to process submission data when retrieving from database
        private static object? ProcessRetrievedSubmissionData(object? submissionData)
        {
            Console.WriteLine($"🔍 ProcessRetrievedSubmissionData called with submissionData type: {submissionData?.GetType()}");
            
            if (submissionData == null)
            {
                Console.WriteLine($"❌ SubmissionData is null");
                return null;
            }

            // If it's already a Dictionary<string, object>, it might be processed data
            if (submissionData is Dictionary<string, object> dict)
            {
                Console.WriteLine($"🔍 SubmissionData is already Dictionary<string, object> with {dict.Count} keys");
                // Still process it to ensure all nested objects are converted
                var processed = ProcessRetrievedConfigurationData(dict);
                Console.WriteLine($"🔍 After processing - keys: {string.Join(", ", processed.Keys)}");
                if (processed.ContainsKey("gameAnswers"))
                {
                    Console.WriteLine($"🔍 Retrieved game answers type: {processed["gameAnswers"]?.GetType()}");
                    Console.WriteLine($"🔍 Retrieved game answers count: {((processed["gameAnswers"] as IList)?.Count ?? 0)}");
                }
                return processed;
            }

            // If it's JsonElement, convert it using the proper conversion method
            if (submissionData is JsonElement jsonElement)
            {
                Console.WriteLine($"🔍 Converting JsonElement to Dictionary<string, object>");
                var converted = ConvertFromJsonElement(jsonElement);
                Console.WriteLine($"🔍 Converted type: {converted?.GetType()}");
                return converted;
            }

            // For any other type, try to convert it
            Console.WriteLine($"🔍 Converting unknown type to Dictionary<string, object>");
            return ConvertFromJsonElement(submissionData);
        }

        private static async Task<IResult> SubmitAssessmentResults(
            string roundId,
            [FromBody] AssessmentSubmissionRequest request,
            Supabase.Client client,
            ClaimsPrincipal? user = null)
        {
            try
            {
                Console.WriteLine($"🔍 SubmitAssessmentResults called for roundId: {roundId}");

                // Parse the roundId to get the actual GUID
                Console.WriteLine($"🔍 Attempting to parse roundId as GUID: {roundId}");
                if (!Guid.TryParse(roundId, out var roundGuid))
                {
                    Console.WriteLine($"❌ Failed to parse roundId as GUID: {roundId}");
                    return Results.BadRequest(new { error = "Invalid round ID format" });
                }
                Console.WriteLine($"✅ Successfully parsed roundId as GUID: {roundGuid}");

                var userId = GetUserId(user);
                // For now, use a default user ID if none is provided (for testing)
                var effectiveUserId = userId ?? Guid.NewGuid();

                // Get the job ID from the round
                var roundResponse = await client.From<InterviewRound>()
                    .Where(r => r.Id == roundGuid)
                    .Get();

                var round = roundResponse.Models.FirstOrDefault();
                if (round == null)
                {
                    Console.WriteLine($"❌ Round not found for ID: {roundGuid}");
                    return Results.NotFound(new { error = "Round not found" });
                }

                Console.WriteLine($"✅ Found round: {round.Name}, TemplateId: {round.TemplateId}");

                // Get the job ID from the template
                var templateResponse = await client.From<InterviewTemplate>()
                    .Where(t => t.Id == round.TemplateId)
                    .Get();

                var template = templateResponse.Models.FirstOrDefault();
                if (template == null)
                {
                    Console.WriteLine($"❌ Template not found for ID: {round.TemplateId}");
                    return Results.NotFound(new { error = "Interview template not found" });
                }

                Console.WriteLine($"✅ Found template: {template.Name}");

                // Find a job that uses this template
                var jobResponse = await client.From<Job>()
                    .Where(j => j.InterviewTemplateId == template.Id)
                    .Get();

                var job = jobResponse.Models.FirstOrDefault();
                if (job == null)
                {
                    Console.WriteLine($"❌ No job found using template: {template.Id}");
                    
                    // Try to find any job that might be related to this round
                    var allJobsResponse = await client.From<Job>().Get();
                    var allJobs = allJobsResponse.Models;
                    Console.WriteLine($"🔍 Total jobs in database: {allJobs.Count}");
                    
                    if (allJobs.Any())
                    {
                        // Use the first available job as fallback
                        job = allJobs.First();
                        Console.WriteLine($"⚠️ Using fallback job: {job.Title} (ID: {job.Id})");
                    }
                    else
                    {
                        return Results.NotFound(new { error = "No jobs found in the system" });
                    }
                }
                else
                {
                    Console.WriteLine($"✅ Found job: {job.Title} (ID: {job.Id})");
                }

                // Parse candidate ID properly
                Guid candidateGuid;
                if (!string.IsNullOrEmpty(request.CandidateId) && Guid.TryParse(request.CandidateId, out candidateGuid))
                {
                    Console.WriteLine($"✅ Using provided candidate ID: {candidateGuid}");
                }
                else
                {
                    Console.WriteLine($"⚠️ Invalid candidate ID provided: {request.CandidateId}, using effective user ID: {effectiveUserId}");
                    candidateGuid = effectiveUserId;
                }

                // Create assessment submission
                var processedSubmissionData = ProcessSubmissionData(request.Results);
                Console.WriteLine($"🔍 Processed submission data keys: {string.Join(", ", processedSubmissionData.Keys)}");
                if (processedSubmissionData.ContainsKey("gameAnswers"))
                {
                    Console.WriteLine($"🔍 Game answers type: {processedSubmissionData["gameAnswers"]?.GetType()}");
                    Console.WriteLine($"🔍 Game answers count: {((processedSubmissionData["gameAnswers"] as IList)?.Count ?? 0)}");
                }
                if (processedSubmissionData.ContainsKey("scenarioAnswers"))
                {
                    Console.WriteLine($"🔍 Scenario answers type: {processedSubmissionData["scenarioAnswers"]?.GetType()}");
                    Console.WriteLine($"🔍 Scenario answers count: {((processedSubmissionData["scenarioAnswers"] as IList)?.Count ?? 0)}");
                }

                var submission = new AssessmentSubmission
                {
                    CandidateId = candidateGuid,
                    RoundId = roundGuid,
                    JobId = job.Id,
                    SubmissionData = processedSubmissionData,
                    Status = "submitted",
                    SubmittedAt = DateTime.UtcNow
                };

                Console.WriteLine($"💾 Creating assessment submission:");
                Console.WriteLine($"   CandidateId: {submission.CandidateId}");
                Console.WriteLine($"   RoundId: {submission.RoundId}");
                Console.WriteLine($"   JobId: {submission.JobId}");
                Console.WriteLine($"   Status: {submission.Status}");
                Console.WriteLine($"   Results count: {request.Results?.Count ?? 0}");
                Console.WriteLine($"   Request candidateId: {request.CandidateId}");
                Console.WriteLine($"   Parsed candidateGuid: {candidateGuid}");
                Console.WriteLine($"   Effective userId: {effectiveUserId}");

                var insertResponse = await client.From<AssessmentSubmission>().Insert(submission);
                var createdSubmission = insertResponse.Models.FirstOrDefault();

                if (createdSubmission == null)
                {
                    Console.WriteLine($"❌ Failed to create assessment submission");
                    return Results.Problem("Failed to create assessment submission");
                }

                Console.WriteLine($"✅ Assessment results submitted successfully. Submission ID: {createdSubmission.Id}");

                // Update the application status to reflect assessment completion
                try
                {
                    // Find the application for this candidate and job
                    var applicationResponse = await client.From<ApplicationDetail>()
                        .Where(ad => ad.CandidateUserId == submission.CandidateId && ad.JobId == submission.JobId)
                        .Get();

                    var application = applicationResponse.Models.FirstOrDefault();
                    if (application != null)
                    {
                        Console.WriteLine($"📝 Updating application status for application ID: {application.Id}");
                        
                        // Update the application to reflect assessment completion
                        application.StatusChangedAt = DateTime.UtcNow;
                        
                       
                        
                        var updateResponse = await client.From<ApplicationDetail>()
                            .Where(ad => ad.Id == application.Id)
                            .Update(application);
                            
                        Console.WriteLine($"✅ Application status updated successfully");
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ No application found for candidate {submission.CandidateId} and job {submission.JobId}");
                    }
                }
                catch (Exception appUpdateEx)
                {
                    Console.WriteLine($"⚠️ Failed to update application status: {appUpdateEx.Message}");
                    // Don't fail the submission if application update fails
                }

                return Results.Ok(new
                {
                    success = true,
                    message = "Assessment results submitted successfully",
                    submissionId = createdSubmission.Id
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error submitting assessment results: {ex.Message}");
                return Results.Problem($"Failed to submit assessment results: {ex.Message}");
            }
        }

        // Check if a candidate has submitted an assessment for a specific round
        private static async Task<IResult> GetAssessmentSubmissionStatus(
            string roundId,
            string candidateId,
            Supabase.Client client,
            ClaimsPrincipal? user = null)
        {
            try
            {
                Console.WriteLine($"🔍 GetAssessmentSubmissionStatus called for roundId: {roundId}, candidateId: {candidateId}");

                // Parse the roundId to get the actual GUID
                if (!Guid.TryParse(roundId, out var roundGuid))
                {
                    Console.WriteLine($"❌ Failed to parse roundId as GUID: {roundId}");
                    return Results.BadRequest(new { error = "Invalid round ID format" });
                }

                // Parse the candidateId to get the actual GUID
                if (!Guid.TryParse(candidateId, out var candidateGuid))
                {
                    Console.WriteLine($"❌ Failed to parse candidateId as GUID: {candidateId}");
                    return Results.BadRequest(new { error = "Invalid candidate ID format" });
                }

                Console.WriteLine($"✅ Successfully parsed roundId: {roundGuid}, candidateId: {candidateGuid}");

                // Check if submission exists
                var response = await client
                    .From<AssessmentSubmission>()
                    .Where(x => x.CandidateId == candidateGuid && x.RoundId == roundGuid)
                    .Get();

                var submission = response.Models.FirstOrDefault();
                var hasSubmitted = submission != null;

                Console.WriteLine($"🔍 Submission found: {hasSubmitted}");
                if (hasSubmitted)
                {
                    Console.WriteLine($"   Submission ID: {submission.Id}");
                    Console.WriteLine($"   Status: {submission.Status}");
                    Console.WriteLine($"   Submitted at: {submission.SubmittedAt}");
                }

                return Results.Ok(new
                {
                    hasSubmitted = hasSubmitted,
                    submissionId = submission?.Id,
                    status = submission?.Status,
                    submittedAt = submission?.SubmittedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error checking assessment submission status: {ex.Message}");
                return Results.Problem($"Failed to check assessment submission status: {ex.Message}");
            }
        }

        // Helper method to calculate assessment duration based on questions and scenarios
        private static int CalculateAssessmentDuration(Dictionary<string, object> configData, int fallbackDuration)
        {
            try
            {
                Console.WriteLine($"🔍 Calculating assessment duration...");
                
                // Get game questions count
                int gameQuestionsCount = 0;
                if (configData.TryGetValue("cultureQuestions", out var cultureQuestions) && cultureQuestions is IList cultureQuestionsList)
                {
                    gameQuestionsCount = cultureQuestionsList.Count;
                    Console.WriteLine($"🔍 Found {gameQuestionsCount} culture questions");
                }
                
                // Get scenarios count
                int scenariosCount = 0;
                if (configData.TryGetValue("culturalScenarios", out var culturalScenarios) && culturalScenarios is IList scenariosList)
                {
                    scenariosCount = scenariosList.Count;
                    Console.WriteLine($"🔍 Found {scenariosCount} cultural scenarios");
                }
                
                // Get time per question from assessment settings
                int timePerQuestionSeconds = 60; // Default
                if (configData.TryGetValue("assessmentSettings", out var assessmentSettings) && assessmentSettings is Dictionary<string, object> settingsDict)
                {
                    if (settingsDict.TryGetValue("timePerQuestionSeconds", out var timePerQuestion) && timePerQuestion != null)
                    {
                        if (int.TryParse(timePerQuestion.ToString(), out var parsedTime))
                        {
                            timePerQuestionSeconds = parsedTime;
                            Console.WriteLine($"🔍 Using {timePerQuestionSeconds} seconds per question");
                        }
                    }
                }
                
                // Calculate time for game questions (in minutes)
                double gameQuestionsTimeMinutes = gameQuestionsCount * (timePerQuestionSeconds / 60.0);
                Console.WriteLine($"🔍 Game questions time: {gameQuestionsCount} × {timePerQuestionSeconds}s = {gameQuestionsTimeMinutes} minutes");
                
                // Calculate time for scenarios (in minutes)
                double scenariosTimeMinutes = 0;
                if (scenariosCount > 0 && culturalScenarios is IList scenariosListForTime)
                {
                    foreach (var scenario in scenariosListForTime)
                    {
                        if (scenario is Dictionary<string, object> scenarioDict)
                        {
                            if (scenarioDict.TryGetValue("timeLimitMinutes", out var timeLimit) && timeLimit != null)
                            {
                                if (int.TryParse(timeLimit.ToString(), out var parsedTimeLimit))
                                {
                                    scenariosTimeMinutes += parsedTimeLimit;
                                }
                                else
                                {
                                    scenariosTimeMinutes += 5; // Default scenario time
                                }
                            }
                            else
                            {
                                scenariosTimeMinutes += 5; // Default scenario time
                            }
                        }
                    }
                    Console.WriteLine($"🔍 Scenarios time: {scenariosTimeMinutes} minutes");
                }
                
                // Calculate total duration (no buffer for exact calculation)
                double totalMinutes = gameQuestionsTimeMinutes + scenariosTimeMinutes;
                int calculatedDuration = (int)Math.Ceiling(totalMinutes);
                
                // Ensure minimum duration
                if (calculatedDuration < 15)
                {
                    calculatedDuration = 15;
                }
                
                // Use fallback if calculation seems unreasonable
                if (calculatedDuration > 480) // More than 8 hours
                {
                    Console.WriteLine($"⚠️ Calculated duration ({calculatedDuration} minutes) seems unreasonable, using fallback");
                    calculatedDuration = fallbackDuration > 0 ? fallbackDuration : 45;
                }
                
                Console.WriteLine($"🔍 Final calculated duration: {calculatedDuration} minutes");
                Console.WriteLine($"🔍 Calculation breakdown: {gameQuestionsTimeMinutes}m (questions) + {scenariosTimeMinutes}m (scenarios) = {totalMinutes}m (rounded up to {calculatedDuration}m)");
                
                return calculatedDuration;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error calculating assessment duration: {ex.Message}");
                Console.WriteLine($"🔍 Using fallback duration: {fallbackDuration} minutes");
                return fallbackDuration > 0 ? fallbackDuration : 45;
            }
        }

        // Request/Response DTOs for assessment endpoints
        public class AssessmentSubmissionRequest
        {
            public string? CandidateId { get; set; }
            public Dictionary<string, object>? Results { get; set; }
        }
    }
}
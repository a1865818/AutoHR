using Microsoft.AspNetCore.Mvc;
using Supabase;
using ai_hr.Models;
using ai_hr.Contracts;
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
                .WithSummary("Get assessment submission for a candidate and round");

            group.MapGet("/submissions/job/{jobId}", GetJobAssessmentSubmissions)
                .WithName("GetJobAssessmentSubmissions")
                .WithSummary("Get all assessment submissions for a job");

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
        }

        //// Assessment Submission Endpoints
        //private static async Task<IResult> GetAssessmentSubmission(
        //    Guid candidateId,
        //    Guid roundId,
        //    Supabase.Client client,
        //    ClaimsPrincipal user)
        //{
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
        //}

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
                    SubmissionData = submission.SubmissionData,
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
                        SubmissionData = s.SubmissionData,
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
                        SubmissionData = s.SubmissionData,
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
                    SubmissionData = createdSubmission.SubmissionData,
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
                    SubmissionData = updatedSubmission.SubmissionData,
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
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
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

        // Use the same JsonElement conversion pattern as RoundConfiguration
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
            var dict = new Dictionary<string, object>();
            foreach (var property in element.EnumerateObject())
            {
                dict[property.Name] = ConvertFromJsonElement(property.Value);
            }
            return dict;
        }

        private static List<object> ConvertJsonElementArray(JsonElement element)
        {
            var list = new List<object>();
            foreach (var item in element.EnumerateArray())
            {
                list.Add(ConvertFromJsonElement(item));
            }
            return list;
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
    }
}
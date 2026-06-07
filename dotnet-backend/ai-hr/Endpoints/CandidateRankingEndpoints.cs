using ai_hr.Models;
using ai_hr.Contracts;
using ai_hr.Contracts.Langgraph;
using ai_hr.Services;
using Supabase;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace ai_hr.Endpoints;

public static class CandidateRankingEndpoints
{
    public static void MapCandidateRankingEndpoints(this WebApplication app)
    {
        app.MapPost("/candidates/rankings/add", AddCandidatesToRanking)
            .WithTags("Candidate Rankings")
            .WithName("AddCandidatesToRanking")
            .WithSummary("Add candidates to ranking for a specific job")
            .WithDescription("Adds multiple candidates to the ranking system for a specific job position");



        app.MapDelete("/candidates/rankings/remove", RemoveCandidateFromRanking)
            .WithTags("Candidate Rankings")
            .WithName("RemoveCandidateFromRanking")
            .WithSummary("Remove candidate from ranking")
            .WithDescription("Removes a specific candidate from the ranking for a job position");



        app.MapPut("/candidates/rankings/update", UpdateRankingPosition)
            .WithTags("Candidate Rankings")
            .WithName("UpdateRankingPosition")
            .WithSummary("Update candidate ranking position")
            .WithDescription("Updates the ranking position and score for a specific candidate");



        app.MapGet("/candidates/rankings/job/{jobId}", GetRankingsByJob)
            .WithTags("Candidate Rankings")
            .WithName("GetRankingsByJob")
            .WithSummary("Get rankings for a specific job")
            .WithDescription("Retrieves all candidate rankings for a specific job position");



        app.MapGet("/candidates/rankings/company/{companyId}", GetRankingsByCompany)
            .WithTags("Candidate Rankings")
            .WithName("GetRankingsByCompany")
            .WithSummary("Get all rankings for a company")
            .WithDescription("Retrieves all candidate rankings across all jobs for a company");


        app.MapGet("/candidates/rankings/check-ranked/{applicationId}", CheckCandidateRanked)
            .WithTags("Candidate Rankings")
            .WithName("CheckCandidateRanked")
            .WithSummary("Check if candidate is ranked")
            .WithDescription("Checks if a specific candidate is already ranked for any job");
           
    }

    private static async Task<IResult> AddCandidatesToRanking(
        [FromBody] AddCandidatesToRankingRequest request,
        [FromServices] Supabase.Client client,
        [FromServices] ILangGraphService langGraph,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"Adding {request.ApplicationIds.Count} candidates to ranking for job: {request.JobId}");

            // Validate request
            if (request.ApplicationIds == null || !request.ApplicationIds.Any())
            {
                return Results.BadRequest(new { error = "No application IDs provided" });
            }

            // Get job details to validate
            var jobResponse = await client.From<Job>().Get();
            var job = jobResponse.Models?.FirstOrDefault(j => j.Id == request.JobId);
            if (job == null)
            {
                return Results.NotFound(new { error = "Job not found" });
            }

            // Get existing applications to validate
            var appResponse = await client.From<ApplicationDetail>().Get();
            var applications = appResponse.Models?.Where(a => request.ApplicationIds.Contains(a.Id)).ToList() ?? new List<ApplicationDetail>();

            if (applications.Count != request.ApplicationIds.Count)
            {
                return Results.BadRequest(new { error = "Some application IDs are invalid" });
            }

            // Check for existing rankings to avoid duplicates
            var existingRankingsResponse = await client.From<CandidateRanking>().Get();
            var existingRankings = existingRankingsResponse.Models?.Where(r => 
                r.JobId == request.JobId && 
                request.ApplicationIds.Contains(r.ApplicationId)).ToList() ?? new List<CandidateRanking>();

            var existingApplicationIds = existingRankings.Select(r => r.ApplicationId).ToHashSet();
            var newApplicationIds = request.ApplicationIds.Where(id => !existingApplicationIds.Contains(id)).ToList();

            var addedCount = 0;
            var skippedCount = existingApplicationIds.Count;
            var errors = new List<string>();

            // Run the resume_ranker LangGraph graph to produce real, per-dimension AI scores for the
            // newly-added candidates. If LangGraph is unavailable/misconfigured, this returns an empty map
            // and each candidate falls back to its existing score (or the heuristic) so the action still works.
            var newApplications = applications.Where(a => newApplicationIds.Contains(a.Id)).ToList();
            var jobDescription = BuildJobDescription(job);
            var companyInfo = await BuildCompanyInfoAsync(job.CompanyId, client);
            var aiScores = await TryRankWithLangGraphAsync(langGraph, jobDescription, companyInfo, newApplications);
            Console.WriteLine($"Resume ranker returned AI scores for {aiScores.Count}/{newApplications.Count} candidates");

            // Add new rankings
            foreach (var applicationId in newApplicationIds)
            {
                try
                {
                    var application = applications.First(a => a.Id == applicationId);

                    // Prefer real AI scores from resume_ranker; otherwise reuse an existing score / heuristic.
                    decimal rankingScore;
                    Dictionary<string, object>? aiAnalysisData = null;

                    if (aiScores.TryGetValue(applicationId, out var dimensionScores))
                    {
                        rankingScore = decimal.Round(dimensionScores.OverallScore, 2);
                        aiAnalysisData = BuildAiAnalysisData(dimensionScores);

                        // Persist the AI result on the application so downstream reads (assessment score,
                        // OverallAiScore) reflect the real value and aren't re-computed by the heuristic.
                        try
                        {
                            application.OverallAiScore = rankingScore;
                            application.AiAnalysis = aiAnalysisData;
                            await client.From<ApplicationDetail>().Update(application);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Warning: failed to persist AI score on application {applicationId}: {ex.Message}");
                        }
                    }
                    else
                    {
                        rankingScore = application.OverallAiScore ?? CalculateInitialRankingScore(application);
                    }

                    var ranking = new CandidateRanking
                    {
                        CompanyId = request.CompanyId,
                        JobId = request.JobId,
                        ApplicationId = applicationId,
                        CandidateUserId = application.CandidateUserId,
                        RankingScore = rankingScore,
                        AiAnalysisData = aiAnalysisData,
                        RankingPosition = 1, // Temporary valid value, will be recalculated
                        RankedBy = request.RankedBy,
                        IsRanked = true
                    };

                    await client.From<CandidateRanking>().Insert(ranking);
                    addedCount++;
                }
                catch (Exception ex)
                {
                    errors.Add($"Failed to add application {applicationId}: {ex.Message}");
                }
            }

            // Recalculate ranking positions for this job
            if (addedCount > 0)
            {
                await RecalculateRankingPositions(request.JobId, client);
            }

            var response = new BulkRankingResponse
            {
                Success = true,
                AddedCount = addedCount,
                SkippedCount = skippedCount,
                Errors = errors,
                Message = $"Successfully added {addedCount} candidates to ranking, skipped {skippedCount} already ranked candidates"
            };

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error adding candidates to ranking: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> RemoveCandidateFromRanking(
        [FromBody] RemoveCandidateFromRankingRequest request,
        [FromServices] Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"Removing candidate {request.ApplicationId} from ranking for job: {request.JobId}");

            // Find and delete the ranking
            var rankingResponse = await client.From<CandidateRanking>().Get();
            var ranking = rankingResponse.Models?.FirstOrDefault(r => 
                r.JobId == request.JobId && 
                r.ApplicationId == request.ApplicationId);

            if (ranking == null)
            {
                return Results.NotFound(new { error = "Ranking not found" });
            }

            await client.From<CandidateRanking>().Delete(ranking);

            // Recalculate ranking positions
            await RecalculateRankingPositions(request.JobId, client);

            return Results.Ok(new { message = "Candidate removed from ranking successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error removing candidate from ranking: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> UpdateRankingPosition(
        [FromBody] UpdateRankingPositionRequest request,
        [FromServices] Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"Updating ranking position for candidate {request.ApplicationId} to position {request.NewPosition}");

            // Find the ranking
            var rankingResponse = await client.From<CandidateRanking>().Get();
            var ranking = rankingResponse.Models?.FirstOrDefault(r => 
                r.JobId == request.JobId && 
                r.ApplicationId == request.ApplicationId);

            if (ranking == null)
            {
                return Results.NotFound(new { error = "Ranking not found" });
            }

            // Update the ranking
            ranking.RankingPosition = request.NewPosition;
            if (request.NewScore.HasValue)
            {
                ranking.RankingScore = request.NewScore.Value;
            }
            if (request.AiAnalysisData != null)
            {
                ranking.AiAnalysisData = request.AiAnalysisData;
            }
           
            ranking.UpdatedAt = DateTime.UtcNow;

            await client.From<CandidateRanking>().Update(ranking);

            return Results.Ok(new { message = "Ranking position updated successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating ranking position: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetRankingsByJob(
        Guid jobId,
        [FromServices] Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"Getting rankings for job: {jobId}");

            // Get rankings for this job
            var rankingResponse = await client.From<CandidateRanking>().Get();
            var rankings = rankingResponse.Models?.Where(r => r.JobId == jobId).ToList() ?? new List<CandidateRanking>();

            if (!rankings.Any())
            {
                return Results.Ok(new RankingsByJobResponse
                {
                    JobId = jobId,
                    Rankings = new List<CandidateRankingResponse>(),
                    TotalRanked = 0
                });
            }

            // Get job details
            var jobResponse = await client.From<Job>().Get();
            var job = jobResponse.Models?.FirstOrDefault(j => j.Id == jobId);

            // Get company details
            var companyResponse = await client.From<Company>().Get();
            var company = companyResponse.Models?.FirstOrDefault(c => c.Id == job?.CompanyId);

            // Get application details
            var appResponse = await client.From<ApplicationDetail>().Get();
            var applications = appResponse.Models?.Where(a => rankings.Select(r => r.ApplicationId).Contains(a.Id)).ToList() ?? new List<ApplicationDetail>();

            // Get user details
            var userResponse = await client.From<ApplicationUser>().Get();
            var candidateUserIds = applications.Select(a => a.CandidateUserId.ToString()).ToHashSet();
            var users = userResponse.Models?.Where(u => candidateUserIds.Contains(u.Id)).ToList() ?? new List<ApplicationUser>();

            // Build response
            var rankingResponses = rankings.Select(r =>
            {
                var application = applications.FirstOrDefault(a => a.Id == r.ApplicationId);
                var candidateUser = users.FirstOrDefault(u => u.Id == application?.CandidateUserId.ToString());

                return new CandidateRankingResponse
                {
                    Id = r.Id,
                    CompanyId = r.CompanyId,
                    JobId = r.JobId,
                    ApplicationId = r.ApplicationId,
                    CandidateUserId = r.CandidateUserId,
                    RankingScore = r.RankingScore,
                    RankingPosition = r.RankingPosition,
                    AiAnalysisData = r.AiAnalysisData,
                 
                    IsRanked = r.IsRanked,
                    RankedBy = r.RankedBy,
                    RankedAt = r.RankedAt,
                    UpdatedAt = r.UpdatedAt,
                    CandidateName = candidateUser != null ? $"{candidateUser.FirstName} {candidateUser.LastName}" : "Unknown",
                    CandidateEmail = candidateUser?.Email ?? "No email",
                    CandidatePhoto = candidateUser != null ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString($"{candidateUser.FirstName} {candidateUser.LastName}")}&size=32&background=e5e7eb&color=374151&rounded=true" : null,
                    JobTitle = job?.Title ?? "Unknown Position",
                    CompanyName = company?.Name ?? "Unknown Company",
                    AssessmentScore = application?.OverallAiScore ?? 0,
                    Stage = application?.Stage ?? "Applied",
                    Status = application?.Status ?? "In Progress"
                };
            }).OrderBy(r => r.RankingPosition).ToList();

            var response = new RankingsByJobResponse
            {
                JobId = jobId,
                JobTitle = job?.Title ?? "Unknown Position",
                CompanyName = company?.Name ?? "Unknown Company",
                Rankings = rankingResponses,
                TotalRanked = rankingResponses.Count,
                LastUpdated = rankingResponses.Any() ? rankingResponses.Max(r => r.UpdatedAt) : DateTime.UtcNow
            };

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting rankings by job: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetRankingsByCompany(
        Guid companyId,
        [FromServices] Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"Getting all rankings for company: {companyId}");

            // Get all rankings for this company
            var rankingResponse = await client.From<CandidateRanking>().Get();
            var rankings = rankingResponse.Models?.Where(r => r.CompanyId == companyId).ToList() ?? new List<CandidateRanking>();

            if (!rankings.Any())
            {
                return Results.Ok(new List<RankingsByJobResponse>());
            }

            // Group by job
            var rankingsByJob = rankings.GroupBy(r => r.JobId).ToList();
            var responses = new List<RankingsByJobResponse>();


            foreach (var jobGroup in rankingsByJob)
            {
                var jobId = jobGroup.Key;
                var jobRankings = jobGroup.ToList();

                // Get job details
                var jobResponse = await client.From<Job>().Get();
                var job = jobResponse.Models?.FirstOrDefault(j => j.Id == jobId);

                // Get company details
                var companyResponse = await client.From<Company>().Get();
                var company = companyResponse.Models?.FirstOrDefault(c => c.Id == companyId);

                // Get application details
                var appResponse = await client.From<ApplicationDetail>().Get();
                var applications = appResponse.Models?.Where(a => jobRankings.Select(r => r.ApplicationId).Contains(a.Id)).ToList() ?? new List<ApplicationDetail>();

                // Get user details
                var userResponse = await client.From<ApplicationUser>().Get();
                var candidateUserIds = applications.Select(a => a.CandidateUserId.ToString()).ToHashSet();
                var users = userResponse.Models?.Where(u => candidateUserIds.Contains(u.Id)).ToList() ?? new List<ApplicationUser>();

                // Build response for this job
                var rankingResponses = jobRankings.Select(r =>
                {
                    var application = applications.FirstOrDefault(a => a.Id == r.ApplicationId);
                    var candidateUser = users.FirstOrDefault(u => u.Id == application?.CandidateUserId.ToString());

                    return new CandidateRankingResponse
                    {
                        Id = r.Id,
                        CompanyId = r.CompanyId,
                        JobId = r.JobId,
                        ApplicationId = r.ApplicationId,
                        CandidateUserId = r.CandidateUserId,
                        RankingScore = r.RankingScore,
                        RankingPosition = r.RankingPosition,
                        AiAnalysisData = r.AiAnalysisData,
                       
                        IsRanked = r.IsRanked,
                        RankedBy = r.RankedBy,
                        RankedAt = r.RankedAt,
                        UpdatedAt = r.UpdatedAt,
                        CandidateName = candidateUser != null ? $"{candidateUser.FirstName} {candidateUser.LastName}" : "Unknown",
                        CandidateEmail = candidateUser?.Email ?? "No email",
                        CandidatePhoto = candidateUser != null ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString($"{candidateUser.FirstName} {candidateUser.LastName}")}&size=32&background=e5e7eb&color=374151&rounded=true" : null,
                        JobTitle = job?.Title ?? "Unknown Position",
                        CompanyName = company?.Name ?? "Unknown Company",
                        AssessmentScore = application?.OverallAiScore ?? 0,
                        Stage = application?.Stage ?? "Applied",
                        Status = application?.Status ?? "In Progress"
                    };
                }).OrderBy(r => r.RankingPosition).ToList();

                responses.Add(new RankingsByJobResponse
                {
                    JobId = jobId,
                    JobTitle = job?.Title ?? "Unknown Position",
                    CompanyName = company?.Name ?? "Unknown Company",
                    Rankings = rankingResponses,
                    TotalRanked = rankingResponses.Count,
                    LastUpdated = rankingResponses.Any() ? rankingResponses.Max(r => r.UpdatedAt) : DateTime.UtcNow
                });
            }

            return Results.Ok(responses);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting rankings by company: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> CheckCandidateRanked(
        Guid applicationId,
        [FromServices] Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"Checking if candidate {applicationId} is ranked");

            // Check if this application is ranked anywhere
            var rankingResponse = await client.From<CandidateRanking>().Get();
            var ranking = rankingResponse.Models?.FirstOrDefault(r => r.ApplicationId == applicationId);

            if (ranking == null)
            {
                return Results.Ok(new { isRanked = false, ranking = (object?)null });
            }

            return Results.Ok(new { 
                isRanked = true, 
                ranking = new
                {
                    ranking.JobId,
                    ranking.RankingPosition,
                    ranking.RankingScore,
                    ranking.RankedAt
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking if candidate is ranked: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    /// <summary>
    /// Calls the resume_ranker LangGraph graph for the given applications and returns the per-dimension
    /// scores keyed by application id. Never throws — on any failure it logs and returns what it has
    /// (possibly empty), so the caller degrades gracefully to existing/heuristic scores.
    /// </summary>
    private static async Task<Dictionary<Guid, ResumeDimensionScores>> TryRankWithLangGraphAsync(
        ILangGraphService langGraph,
        string jobDescription,
        string companyInfo,
        List<ApplicationDetail> applications)
    {
        var result = new Dictionary<Guid, ResumeDimensionScores>();

        if (string.IsNullOrWhiteSpace(jobDescription) || applications.Count == 0)
            return result;

        var defaultBucket = Environment.GetEnvironmentVariable("BUCKET_NAME") ?? "resume-storage";

        // resume_ranker takes one bucket + a list of file names per run, and keys its output by the
        // resume id (file name without extension). Group applications by bucket and remember the
        // mapping back to the application id.
        var filesByBucket = new Dictionary<string, List<string>>();
        var appByResumeKey = new Dictionary<string, Guid>(); // "<bucket>|<resumeId>" -> applicationId

        foreach (var app in applications)
        {
            var location = ParseResumeLocation(app.ResumeUrl, defaultBucket);
            if (location == null)
            {
                Console.WriteLine($"Skipping AI ranking for application {app.Id}: no usable resume file in '{app.ResumeUrl}'");
                continue;
            }

            var (bucket, fileName) = location.Value;
            var resumeId = FileNameWithoutExtension(fileName);

            if (!filesByBucket.TryGetValue(bucket, out var files))
            {
                files = new List<string>();
                filesByBucket[bucket] = files;
            }
            files.Add(fileName);
            appByResumeKey[$"{bucket}|{resumeId}"] = app.Id;
        }

        foreach (var (bucket, files) in filesByBucket)
        {
            try
            {
                var rankerResult = await langGraph.RankResumesAsync(new ResumeRankerRequest
                {
                    JobDescription = jobDescription,
                    CompanyInfo = companyInfo,
                    ResumeBucketName = bucket,
                    ResumeFileNames = files.Distinct().ToList()
                });

                foreach (var (resumeId, scores) in rankerResult.ResumeScores)
                {
                    if (appByResumeKey.TryGetValue($"{bucket}|{resumeId}", out var appId))
                        result[appId] = scores;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ resume_ranker failed for bucket '{bucket}': {ex.Message}. Falling back to heuristic scores for those candidates.");
            }
        }

        return result;
    }

    /// <summary>Build the structured aiAnalysisData persisted on the ranking + application (jsonb).</summary>
    private static Dictionary<string, object> BuildAiAnalysisData(ResumeDimensionScores dim)
    {
        return new Dictionary<string, object>
        {
            // Front-end friendly dimension keys (consumed by the ranking UI)
            ["skillMatch"] = decimal.Round(dim.SkillsAssessmentScore, 1),
            ["experienceMatch"] = decimal.Round(dim.ProfessionalExperienceScore, 1),
            ["cultureMatch"] = decimal.Round(dim.CulturalFitScore, 1),
            ["educationMatch"] = decimal.Round(dim.EducationGrowthScore, 1),
            ["communicationScore"] = decimal.Round(dim.CulturalFitScore, 1),
            // Raw resume_ranker dimension scores (all 0-100)
            ["overallScore"] = decimal.Round(dim.OverallScore, 2),
            ["culturalFitScore"] = decimal.Round(dim.CulturalFitScore, 1),
            ["skillsAssessmentScore"] = decimal.Round(dim.SkillsAssessmentScore, 1),
            ["professionalExperienceScore"] = decimal.Round(dim.ProfessionalExperienceScore, 1),
            ["educationGrowthScore"] = decimal.Round(dim.EducationGrowthScore, 1),
            ["detailedFeedback"] = dim.DetailedFeedback ?? string.Empty,
            ["source"] = "resume_ranker"
        };
    }

    /// <summary>Compose a rich job-description string from the Job record for the ranker.</summary>
    private static string BuildJobDescription(Job job)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Job Title: {job.Title}");
        if (!string.IsNullOrWhiteSpace(job.SeniorityLevel)) sb.AppendLine($"Seniority Level: {job.SeniorityLevel}");
        if (job.ExperienceYearsMin.HasValue) sb.AppendLine($"Minimum Experience (years): {job.ExperienceYearsMin.Value}");
        if (!string.IsNullOrWhiteSpace(job.EmploymentType)) sb.AppendLine($"Employment Type: {job.EmploymentType}");

        if (!string.IsNullOrWhiteSpace(job.Description))
        {
            sb.AppendLine();
            sb.AppendLine("Description:");
            sb.AppendLine(job.Description);
        }
        AppendList(sb, "Responsibilities", job.Responsibilities);
        AppendList(sb, "Requirements", job.Requirements);
        AppendList(sb, "Qualifications", job.Qualifications);
        return sb.ToString().Trim();
    }

    private static void AppendList(StringBuilder sb, string heading, List<string>? items)
    {
        if (items == null || items.Count == 0) return;
        sb.AppendLine();
        sb.AppendLine($"{heading}:");
        foreach (var item in items)
            sb.AppendLine($"- {item}");
    }

    /// <summary>Compose a company-context string for cultural-fit assessment.</summary>
    private static async Task<string> BuildCompanyInfoAsync(Guid companyId, Supabase.Client client)
    {
        try
        {
            var companyResponse = await client.From<Company>().Get();
            var company = companyResponse.Models?.FirstOrDefault(c => c.Id == companyId);
            if (company == null) return string.Empty;

            var sb = new StringBuilder();
            sb.AppendLine($"Company: {company.Name}");
            if (!string.IsNullOrWhiteSpace(company.Industry)) sb.AppendLine($"Industry: {company.Industry}");
            if (!string.IsNullOrWhiteSpace(company.CompanySize)) sb.AppendLine($"Company Size: {company.CompanySize}");
            if (!string.IsNullOrWhiteSpace(company.Description))
            {
                sb.AppendLine();
                sb.AppendLine(company.Description);
            }
            return sb.ToString().Trim();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: failed to build company info for {companyId}: {ex.Message}");
            return string.Empty;
        }
    }

    /// <summary>
    /// Resolve a stored resume reference into (bucketName, fileName). Handles both the
    /// "&lt;bucket&gt;/&lt;file&gt;" form used at upload time and full signed/public Supabase storage URLs.
    /// </summary>
    private static (string bucket, string fileName)? ParseResumeLocation(string? resumeUrl, string defaultBucket)
    {
        if (string.IsNullOrWhiteSpace(resumeUrl)) return null;

        try
        {
            if (resumeUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                resumeUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                var uri = new Uri(resumeUrl);
                var path = uri.AbsolutePath; // e.g. /storage/v1/object/sign/<bucket>/<file>
                const string marker = "/object/";
                var idx = path.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
                if (idx >= 0)
                {
                    var after = path.Substring(idx + marker.Length);
                    var segs = after.Split('/', StringSplitOptions.RemoveEmptyEntries);
                    if (segs.Length >= 3 && (segs[0] == "sign" || segs[0] == "public" || segs[0] == "authenticated"))
                    {
                        var bucket = Uri.UnescapeDataString(segs[1]);
                        var file = Uri.UnescapeDataString(string.Join('/', segs.Skip(2)));
                        return (bucket, file);
                    }
                    if (segs.Length >= 2)
                    {
                        var bucket = Uri.UnescapeDataString(segs[0]);
                        var file = Uri.UnescapeDataString(string.Join('/', segs.Skip(1)));
                        return (bucket, file);
                    }
                }

                var last = Uri.UnescapeDataString(path.Split('/').Last());
                return string.IsNullOrEmpty(last) ? null : (defaultBucket, last);
            }

            // Stored form: "<bucket>/<file...>"
            var firstSlash = resumeUrl.IndexOf('/');
            if (firstSlash > 0 && firstSlash < resumeUrl.Length - 1)
                return (resumeUrl.Substring(0, firstSlash), resumeUrl.Substring(firstSlash + 1));

            return (defaultBucket, resumeUrl);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>Mirror Python's <c>Path(file_name).stem</c> — basename minus its final extension.</summary>
    private static string FileNameWithoutExtension(string fileName)
    {
        var baseName = fileName;
        var slash = baseName.LastIndexOf('/');
        if (slash >= 0) baseName = baseName.Substring(slash + 1);
        var dot = baseName.LastIndexOf('.');
        return dot > 0 ? baseName.Substring(0, dot) : baseName;
    }

    public static decimal CalculateInitialRankingScore(ApplicationDetail application)
    {
        
    
        var random = new Random();

        // Base random score between 50-100
        var baseScore = random.Next(50, 101);

        // Optional: Add slight bonuses to make it feel less completely random
        var bonusScore = 0;

        // Small bonus for having resume (0-5 points)
        if (!string.IsNullOrEmpty(application.ResumeUrl))
            bonusScore += random.Next(0, 6);

        // Small bonus for having cover letter (0-5 points)
        if (!string.IsNullOrEmpty(application.CoverLetterText))
            bonusScore += random.Next(0, 6);

        // Ensure we don't exceed 100
        var finalScore = Math.Min(100, baseScore + bonusScore);
        return finalScore;

    
    }

    private static async Task RecalculateRankingPositions(Guid jobId, Supabase.Client client)
    {
        try
        {
            // Get all rankings for this job
            var rankingResponse = await client.From<CandidateRanking>().Get();
            var rankings = rankingResponse.Models?.Where(r => r.JobId == jobId).ToList() ?? new List<CandidateRanking>();

            if (!rankings.Any()) return;

            // Sort by score (descending) and assign positions
            var sortedRankings = rankings.OrderByDescending(r => r.RankingScore).ToList();
            
            for (int i = 0; i < sortedRankings.Count; i++)
            {
                sortedRankings[i].RankingPosition = i + 1;
                sortedRankings[i].UpdatedAt = DateTime.UtcNow;
            }

            // Update all rankings
            foreach (var ranking in sortedRankings)
            {
                await client.From<CandidateRanking>().Update(ranking);
            }

            Console.WriteLine($"Recalculated ranking positions for job {jobId}: {sortedRankings.Count} candidates");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error recalculating ranking positions: {ex.Message}");
        }
    }
} 
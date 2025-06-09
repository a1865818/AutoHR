using ai_hr.Models;
using Supabase;

namespace ai_hr.Endpoints;

public static class CandidateEndpoints
{
    public static void MapCandidateEndpoints(this WebApplication app)
    {
        app.MapGet("/candidates/company/{companyId}", GetCandidatesByCompany)
            .WithTags("Candidates")
            .WithName("GetCandidatesByCompany")
            .WithSummary("Get all candidates for a company")
            .WithDescription("Retrieves all job applicants for positions at the specified company")
            .RequireAuthorization();

        app.MapGet("/candidates/job/{jobId}", GetCandidatesByJob)
            .WithTags("Candidates")
            .WithName("GetCandidatesByJob")
            .WithSummary("Get candidates for specific job")
            .WithDescription("Retrieves all applicants for a specific job posting")
            .RequireAuthorization();
    }

    private static async Task<IResult> GetCandidatesByCompany(Guid companyId, Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"Fetching candidates for company: {companyId}");

            // Step 1: Get company information
            var companyResponse = await client.From<Company>()
                .Where(c => c.Id == companyId)
                .Get();

            var company = companyResponse.Models?.FirstOrDefault();
            if (company == null)
            {
                return Results.NotFound(new { message = $"Company not found: {companyId}" });
            }

            // Step 2: Get all jobs for this company
            var jobsResponse = await client.From<Job>()
                .Where(j => j.CompanyId == companyId)
                .Get();

            var companyJobs = jobsResponse.Models;
            if (companyJobs == null || !companyJobs.Any())
            {
                return Results.Ok(new
                {
                    candidates = new List<object>(),
                    totalCount = 0,
                    companyName = company.Name
                });
            }

            var jobIds = companyJobs.Select(j => j.Id).ToList();

            // Step 3: Get all applications for these jobs
            var applications = new List<ApplicationDetail>();
            foreach (var jobId in jobIds)
            {
                var appResponse = await client.From<ApplicationDetail>()
                    .Where(ad => ad.JobId == jobId)
                    .Get();

                if (appResponse.Models != null)
                {
                    applications.AddRange(appResponse.Models);
                }
            }

            Console.WriteLine($"Found {applications.Count} total applications");

            // 🔥 PUT THE DEBUG CODE RIGHT HERE 🔥
            // RIGHT AFTER YOU FETCH THE APPLICATIONS BUT BEFORE YOU PROCESS THEM

            foreach (var app in applications.Take(1))
            {
                Console.WriteLine($"🔍 Raw Application Debug:");
                Console.WriteLine($"   ID: {app.Id}");
                Console.WriteLine($"   HiringNotes Property: '{app.HiringNotes}'");
                Console.WriteLine($"   NotesCreatedAt Property: {app.NotesCreatedAt}");
                Console.WriteLine($"   NotesUpdatedAt Property: {app.NotesUpdatedAt}");

                // Check if the object has these properties at all
                var type = app.GetType();
                var props = type.GetProperties().Where(p => p.Name.Contains("Notes")).ToList();
                Console.WriteLine($"   Available Notes Properties: {string.Join(", ", props.Select(p => p.Name))}");
            }

            // Continue with the rest of your existing code...
            if (!applications.Any())
            {
                return Results.Ok(new
                {
                    candidates = new List<object>(),
                    totalCount = 0,
                    companyName = company.Name
                });
            }

            // Step 4: Get user lookup
            var allUsersResponse = await client.From<ApplicationUser>().Get();
            var allUsers = allUsersResponse.Models ?? new List<ApplicationUser>();
            var userLookup = allUsers.ToDictionary(u => u.Id, u => u);

            //private static async Task<IResult> GetCandidatesByCompany(Guid companyId, Supabase.Client client)
            //{
            //    try
            //    {
            //        Console.WriteLine($"Fetching candidates for company: {companyId}");

            //        // Step 1: Get company information (same as before)
            //        var companyResponse = await client.From<Company>()
            //            .Where(c => c.Id == companyId)
            //            .Get();

            //        var company = companyResponse.Models?.FirstOrDefault();
            //        if (company == null)
            //        {
            //            Console.WriteLine($"Company not found: {companyId}");
            //            return Results.NotFound(new { message = $"Company not found: {companyId}" });
            //        }

            //        Console.WriteLine($"✅ Found company: {company.Name}");

            //        // Step 2: Get all jobs for this company (same as before)
            //        var jobsResponse = await client.From<Job>()
            //            .Where(j => j.CompanyId == companyId)
            //            .Get();

            //        var companyJobs = jobsResponse.Models;
            //        if (companyJobs == null || !companyJobs.Any())
            //        {
            //            Console.WriteLine($"No jobs found for company: {companyId}");
            //            return Results.Ok(new
            //            {
            //                candidates = new List<object>(),
            //                totalCount = 0,
            //                companyName = company.Name
            //            });
            //        }

            //        Console.WriteLine($"✅ Found {companyJobs.Count} jobs for company");

            //        // Step 3: Get all applications for these jobs (same as before)
            //        var jobIds = companyJobs.Select(j => j.Id).ToList();
            //        var applications = new List<ApplicationDetail>();

            //        foreach (var jobId in jobIds)
            //        {
            //            var appResponse = await client.From<ApplicationDetail>()
            //                .Where(ad => ad.JobId == jobId)
            //                .Get();

            //            if (appResponse.Models != null)
            //            {
            //                applications.AddRange(appResponse.Models);
            //            }
            //        }

            //        Console.WriteLine($"✅ Found {applications.Count} total applications");

            //        if (!applications.Any())
            //        {
            //            return Results.Ok(new
            //            {
            //                candidates = new List<object>(),
            //                totalCount = 0,
            //                companyName = company.Name
            //            });
            //        }

            //        // Step 4: Get ALL ApplicationUsers at once (more efficient)
            //        var candidateUserIds = applications.Select(a => a.CandidateUserId).Distinct().ToList();
            //        Console.WriteLine($"🔍 Need to lookup {candidateUserIds.Count} unique users");

            //        // Get all ApplicationUsers in one query
            //        var allUsersResponse = await client.From<ApplicationUser>().Get();
            //        var allUsers = allUsersResponse.Models ?? new List<ApplicationUser>();

            //        Console.WriteLine($"📊 Found {allUsers.Count} total users in ApplicationUser table");

            //        // Create a lookup dictionary for fast matching
            //        var userLookup = allUsers.ToDictionary(u => u.Id, u => u);
            //        Console.WriteLine($"💾 Created user lookup dictionary with {userLookup.Count} entries");

            // Step 5: Build candidate response objects with proper error handling
            var candidates = applications.Select(app =>
            {
                // Find the job (we know this exists)
                var job = companyJobs.FirstOrDefault(j => j.Id == app.JobId);

                // Find the user using the lookup dictionary
                var candidateUserIdString = app.CandidateUserId.ToString();
                userLookup.TryGetValue(candidateUserIdString, out var candidateUser);

                // Log the lookup result
                if (candidateUser != null)
                {
                    Console.WriteLine($"✅ Found user for application {app.Id}: {candidateUser.FirstName} {candidateUser.LastName}");
                }
                else
                {
                    Console.WriteLine($"❌ User not found for application {app.Id}, candidate_user_id: {candidateUserIdString}");

                    // Debug: Check if there's a similar ID
                    var similarIds = userLookup.Keys.Where(k => k.StartsWith(candidateUserIdString.Substring(0, 8))).ToList();
                    if (similarIds.Any())
                    {
                        Console.WriteLine($"🔍 Similar user IDs found: {string.Join(", ", similarIds)}");
                    }
                }

                // Calculate assessment score
                var assessmentScore = app.OverallAiScore ?? CalculateAssessmentScore(app);

                // Generate proper names and avatars
                var candidateName = candidateUser != null
                    ? $"{candidateUser.FirstName} {candidateUser.LastName}"
                    : $"Unknown User ({candidateUserIdString.Substring(0, 8)}...)";

                var candidateEmail = candidateUser?.Email ?? "No email available";

                var companyInitial = !string.IsNullOrEmpty(company.Name) ? company.Name.Substring(0, 1).ToUpper() : "C";

                return new
                {
                    id = app.Id.ToString(),
                    applicationId = app.Id.ToString(),
                    candidateUserId = app.CandidateUserId.ToString(),
                    jobId = app.JobId.ToString(),
                    name = candidateName,
                    email = candidateEmail,
                    photo = candidateUser != null
                        ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(candidateName)}&size=32&background=e5e7eb&color=374151&rounded=true"
                        : "https://ui-avatars.com/api/?name=Unknown&size=32&background=f87171&color=ffffff&rounded=true",
                    role = job?.Title ?? "Unknown Position",
                    company = company.Name,
                    companyLogo = !string.IsNullOrEmpty(company.LogoUrl)
                        ? company.LogoUrl
                        : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(companyInitial)}&size=24&background=3b82f6&color=ffffff&rounded=true",
                    assessment = (int)Math.Round(assessmentScore),
                    stage = MapStageToEnum(app.Stage),
                    status = MapStatusToEnum(app.Status),
                    appliedAt = app.AppliedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    resumeUrl = app.ResumeUrl,
                    coverLetterText = app.CoverLetterText,
                    expectedSalary = app.ExpectedSalary,
                    availabilityDate = app.AvailabilityDate?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    jobSource = app.JobSource,
                    overallAiScore = app.OverallAiScore,
                    jobTitle = job?.Title ?? "Unknown Position",
                    jobDepartment = job?.Department ?? "",
                    jobLocationType = job?.LocationType ?? "Unknown",
                    jobEmploymentType = job?.EmploymentType ?? "Unknown",

                    // ✅ ADD THESE MISSING FIELDS:
                    hiringNotes = app.HiringNotes ?? "",
                    notesCreatedAt = app.NotesCreatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notesUpdatedAt = app.NotesUpdatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),

                    // Debug info to help identify issues
                    debug = new
                    {
                        userFound = candidateUser != null,
                        searchedUserId = candidateUserIdString,
                        totalUsersInDb = allUsers.Count,
                        userLookupKeys = userLookup.Count,
                        // ✅ ADD DEBUG INFO FOR NOTES:
                        hasHiringNotes = !string.IsNullOrEmpty(app.HiringNotes),
                        hiringNotesValue = app.HiringNotes ?? "null",
                        notesCreatedAtValue = app.NotesCreatedAt?.ToString() ?? "null",
                        notesUpdatedAtValue = app.NotesUpdatedAt?.ToString() ?? "null"
                    }
                };
            }).ToList();

            // Count successful user lookups
            var successfulLookups = candidates.Count(c => c.debug.userFound);
            Console.WriteLine($"📊 FINAL RESULT: {successfulLookups}/{candidates.Count} users found successfully");

            var response = new
            {
                candidates = candidates,
                totalCount = candidates.Count,
                companyName = company.Name,
                debug = new
                {
                    totalApplications = applications.Count,
                    totalJobs = companyJobs.Count,
                    totalUsersInDb = allUsers.Count,
                    successfulUserLookups = successfulLookups,
                    userLookupRate = $"{successfulLookups}/{candidates.Count}"
                }
            };

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"💥 ERROR in GetCandidatesByCompany: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new
            {
                error = ex.Message,
                details = ex.ToString()
            });
        }
    }




    private static async Task<IResult> GetCandidatesByJob(Guid jobId, Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"Fetching candidates for job: {jobId}");

            // Get the job details first
            var jobResponse = await client.From<Job>()
                .Where(j => j.Id == jobId)
                .Get();

            var job = jobResponse.Models?.FirstOrDefault();
            if (job == null)
            {
                return Results.NotFound(new { message = $"Job not found: {jobId}" });
            }

            // Get company information for this job
            var companyResponse = await client.From<Company>()
                .Where(c => c.Id == job.CompanyId)
                .Get();

            var company = companyResponse.Models?.FirstOrDefault();
            var companyName = company?.Name ?? "Unknown Company";

            // Get all applications for this job
            var appResponse = await client.From<ApplicationDetail>()
                .Where(ad => ad.JobId == jobId)
                .Get();

            var applications = appResponse.Models;
            if (applications == null || !applications.Any())
            {
                return Results.Ok(new List<object>());
            }

            Console.WriteLine($"Found {applications.Count} applications for job");

            // Get candidate user details
            var candidateUserIds = applications.Select(a => a.CandidateUserId).Distinct().ToList();
            var candidateUsers = new List<ApplicationUser>();

            foreach (var userId in candidateUserIds)
            {
                try
                {
                    var userResponse = await client.From<ApplicationUser>()
                        .Where(u => u.Id == userId.ToString())
                        .Get();

                    if (userResponse.Models != null && userResponse.Models.Any())
                    {
                        candidateUsers.AddRange(userResponse.Models);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error fetching user {userId}: {ex.Message}");
                }
            }

            // Build candidate response objects
            var candidates = applications.Select(app =>
            {
                var candidateUser = candidateUsers.FirstOrDefault(u => u.Id == app.CandidateUserId.ToString());
                var assessmentScore = app.OverallAiScore ?? CalculateAssessmentScore(app);
                var stage = MapStageToEnum(app.Stage);
                var status = MapStatusToEnum(app.Status);

                var candidateName = candidateUser != null ? $"{candidateUser.FirstName} {candidateUser.LastName}" : "Unknown Candidate";
                var companyInitial = !string.IsNullOrEmpty(companyName) ? companyName.Substring(0, 1).ToUpper() : "C";

                return new
                {
                    id = app.Id.ToString(),
                    applicationId = app.Id.ToString(),
                    candidateUserId = app.CandidateUserId.ToString(),
                    jobId = app.JobId.ToString(),
                    name = candidateName,
                    email = candidateUser?.Email ?? "",
                    photo = candidateUser != null
                        ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(candidateName)}&size=32&background=e5e7eb&color=374151&rounded=true"
                        : "https://ui-avatars.com/api/?name=User&size=32&background=e5e7eb&color=374151&rounded=true",
                    role = job.Title,
                    company = companyName, // Use actual company name
                    companyLogo = !string.IsNullOrEmpty(company?.LogoUrl)
                        ? company.LogoUrl
                        : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(companyInitial)}&size=24&background=3b82f6&color=ffffff&rounded=true",
                    assessment = (int)Math.Round(assessmentScore),
                    stage = stage,
                    status = status,
                    appliedAt = app.AppliedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    resumeUrl = app.ResumeUrl,
                    coverLetterText = app.CoverLetterText,
                    expectedSalary = app.ExpectedSalary,
                    availabilityDate = app.AvailabilityDate?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    jobSource = app.JobSource,
                    overallAiScore = app.OverallAiScore,
                    jobTitle = job.Title,
                    jobDepartment = job.Department ?? "",
                    jobLocationType = job.LocationType ?? "Unknown",
                    jobEmploymentType = job.EmploymentType ?? "Unknown",


                    hiringNotes = app.HiringNotes ?? "unknown",
                    notesCreatedAt = app.NotesCreatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notesUpdatedAt = app.NotesUpdatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ")
                };
            }).ToList();

            Console.WriteLine($"Returning {candidates.Count} candidates for job {jobId}");
            return Results.Ok(candidates);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching candidates for job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    // Helper methods remain the same


    private static decimal CalculateAssessmentScore(ApplicationDetail application)
    {
        decimal score = 50;
        if (!string.IsNullOrEmpty(application.ResumeUrl)) score += 20;
        if (!string.IsNullOrEmpty(application.CoverLetterText)) score += 15;
        if (application.ExpectedSalary.HasValue) score += 10;
        if (application.AvailabilityDate.HasValue) score += 5;
        return Math.Max(0, Math.Min(100, score));
    }

    private static string MapStageToEnum(string stage)
    {
        return stage?.ToLower() switch
        {
            "initial_review" or "applied" => "Applied",
            "interview" or "interviewing" => "Interview",
            "offer" or "offer_extended" => "Offer",
            _ => "Applied"
        };
    }

    private static string MapStatusToEnum(string status)
    {
        return status?.ToLower() switch
        {
            "applied" or "in_review" or "interview" => "In Progress",
            "hired" or "accepted" => "Hired",
            "rejected" or "declined" or "disqualified" => "Disqualified",
            _ => "In Progress"
        };
    }
}
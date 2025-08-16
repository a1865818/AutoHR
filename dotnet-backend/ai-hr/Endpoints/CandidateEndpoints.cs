using ai_hr.Models;
using Supabase;
using ai_hr.Endpoints;

namespace ai_hr.Endpoints;

public static class CandidateEndpoints
{
    public static void MapCandidateEndpoints(this WebApplication app)
    {
        app.MapGet("/candidates/company/{companyId}", GetCandidatesByCompany)
            .WithTags("Candidates")
            .WithName("GetCandidatesByCompany")
            .WithSummary("Get candidates for a company")
            .WithDescription("Retrieves all job applicants for positions at the specified company")
            .RequireAuthorization();

        // Paged variant for interview pipeline – avoids loading all candidates at once
        app.MapGet("/candidates/job/{jobId:guid}/paged", (Guid jobId, int? page, int? pageSize, Supabase.Client client) =>
            GetCandidatesByJobPaged(jobId, page ?? 1, pageSize ?? 50, client))
            .WithTags("Candidates")
            .WithName("GetCandidatesByJobPaged")
            .WithSummary("Get candidates for specific job (paged)")
            .WithDescription("Retrieves candidates for a specific job posting with pagination support")
            .RequireAuthorization();

        app.MapGet("/candidates/job/{jobId:guid}", GetCandidatesByJob)
            .WithTags("Candidates")
            .WithName("GetCandidatesByJob")
            .WithSummary("Get candidates for specific job")
            .WithDescription("Retrieves all applicants for a specific job posting")
            .RequireAuthorization();

        app.MapGet("/candidates/company/{companyId}/rejected", GetRejectedCandidatesByCompany)
            .WithTags("Candidates")
            .WithName("GetRejectedCandidatesByCompany")
            .WithSummary("Get rejected candidates for a company")
            .WithDescription("Retrieves all rejected candidates for a specific company with filtering options")
            .RequireAuthorization();

        app.MapGet("/candidates/job/{jobId}/rejected", GetRejectedCandidatesByJob)
            .WithTags("Candidates")
            .WithName("GetRejectedCandidatesByJob")
            .WithSummary("Get rejected candidates for specific job")
            .WithDescription("Retrieves all rejected candidates for a specific job posting")
            .RequireAuthorization();

        // This should be last to avoid catching other routes
        app.MapGet("/candidates/{candidateId}/details", GetCandidateDetails)
            .WithTags("Candidates")
            .WithName("GetCandidateDetails")
            .WithSummary("Get detailed candidate information")
            .WithDescription("Retrieves detailed information for a specific candidate including profile data and experiences")
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

            // Step 5: Build candidate response objects with proper error handling
            var candidates = applications.Select(app =>
            {
                // Find the job (we know this exists)
                var job = companyJobs.FirstOrDefault(j => j.Id == app.JobId);

                // Find the user using the lookup dictionary
                var candidateUserIdString = app.CandidateUserId.ToString();
                userLookup.TryGetValue(candidateUserIdString, out var candidateUser);

                // Calculate assessment score
                var assessmentScore = app.OverallAiScore ?? CandidateRankingEndpoints.CalculateInitialRankingScore(app);

                // Generate proper names and avatars
                var candidateName = candidateUser != null
                    ? $"{candidateUser.FirstName} {candidateUser.LastName}"
                    : $"Unknown User ({candidateUserIdString.Substring(0, 8)}...)";

                var candidateEmail = candidateUser?.Email ?? "No email available";

                var companyInitial = !string.IsNullOrEmpty(company.Name) ? company.Name.Substring(0, 1).ToUpper() : "C";

                Console.WriteLine($"🔍 Application: {candidateName} {app.Stage} {app.Status}");

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
                    stage = app.Stage,
                    status = app.Status,
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
        Console.WriteLine($"🚀 GetCandidatesByJob method called with jobId: {jobId}");
        Console.WriteLine($"🚀 JobId type: {jobId.GetType()}");
        Console.WriteLine($"🚀 JobId value: {jobId}");

        try
        {
            Console.WriteLine($"🔍 GetCandidatesByJob called for jobId: {jobId}");

            // Get the job details first
            var jobResponse = await client.From<Job>()
                .Where(j => j.Id == jobId)
                .Get();

            var job = jobResponse.Models?.FirstOrDefault();
            if (job == null)
            {
                Console.WriteLine($"❌ Job not found: {jobId}");
                return Results.NotFound(new { message = $"Job not found: {jobId}" });
            }

            Console.WriteLine($"✅ Job found: {job.Title}");

            // Get company information for this job
            var companyResponse = await client.From<Company>()
                .Where(c => c.Id == job.CompanyId)
                .Get();

            var company = companyResponse.Models?.FirstOrDefault();
            var companyName = company?.Name ?? "Unknown Company";

            Console.WriteLine($"✅ Company found: {companyName}");

            // Get all applications for this job
            var appResponse = await client.From<ApplicationDetail>()
                .Where(ad => ad.JobId == jobId)
                .Get();

            var applications = appResponse.Models;
            if (applications == null || !applications.Any())
            {
                Console.WriteLine($"📭 No applications found for job: {jobId}");
                return Results.Ok(new List<object>());
            }

            Console.WriteLine($"✅ Found {applications.Count} applications for job {jobId}");

            // ✅ FIX: Use the same approach as GetCandidatesByCompany
            // Get ALL ApplicationUsers at once (more efficient)
            var allUsersResponse = await client.From<ApplicationUser>().Get();
            var allUsers = allUsersResponse.Models ?? new List<ApplicationUser>();

            Console.WriteLine($"📊 Found {allUsers.Count} total users in ApplicationUser table");

            // Create a lookup dictionary for fast matching
            var userLookup = allUsers.ToDictionary(u => u.Id, u => u);
            Console.WriteLine($"💾 Created user lookup dictionary with {userLookup.Count} entries");

            // Build candidate response objects
            var candidates = applications.Select(app =>
            {
                // ✅ FIX: Use the same lookup logic as GetCandidatesByCompany
                var candidateUserIdString = app.CandidateUserId.ToString();
                userLookup.TryGetValue(candidateUserIdString, out var candidateUser);

                // Log the lookup result for debugging
                if (candidateUser != null)
                {
                    Console.WriteLine($"✅ Found user for application {app.Id}: {candidateUser.FirstName} {candidateUser.LastName}");
                }
                else
                {
                    Console.WriteLine($"❌ User not found for application {app.Id}, candidate_user_id: {candidateUserIdString}");
                }

                var assessmentScore = app.OverallAiScore ?? CandidateRankingEndpoints.CalculateInitialRankingScore(app);

                var candidateName = candidateUser != null
                    ? $"{candidateUser.FirstName} {candidateUser.LastName}"
                    : $"Unknown User ({candidateUserIdString.Substring(0, 8)}...)";

                var companyInitial = !string.IsNullOrEmpty(companyName) ? companyName.Substring(0, 1).ToUpper() : "C";

                return new
                {
                    id = app.Id.ToString(),
                    applicationId = app.Id.ToString(),
                    candidateUserId = app.CandidateUserId.ToString(),
                    jobId = app.JobId.ToString(),
                    name = candidateName,
                    email = candidateUser?.Email ?? "No email available",
                    location = candidateUser?.Location,
                    experiences = candidateUser?.Experiences,
                    photo = candidateUser != null
                        ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(candidateName)}&size=32&background=e5e7eb&color=374151&rounded=true"
                        : "https://ui-avatars.com/api/?name=Unknown&size=32&background=f87171&color=ffffff&rounded=true",
                    role = job.Title,
                    company = companyName,
                    companyLogo = !string.IsNullOrEmpty(company?.LogoUrl)
                        ? company.LogoUrl
                        : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(companyInitial)}&size=24&background=3b82f6&color=ffffff&rounded=true",
                    assessment = (int)Math.Round(assessmentScore),
                    stage = app.Stage,
                    status = app.Status,
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
                    hiringNotes = app.HiringNotes ?? "",
                    notesCreatedAt = app.NotesCreatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notesUpdatedAt = app.NotesUpdatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),

                    rejectionReason = app.RejectionReason,
                    rejectionNotes = app.RejectionNotes,
                    rejectedAt = app.RejectedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    isSendRejectEmail = app.IsSendRejectEmail,

                    // Debug info
                    debug = new
                    {
                        userFound = candidateUser != null,
                        searchedUserId = candidateUserIdString,
                        totalUsersInDb = allUsers.Count
                    }
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

    // New: Paged candidates by job
    private static async Task<IResult> GetCandidatesByJobPaged(Guid jobId, int page, int pageSize, Supabase.Client client)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;

            // Get the job
            var jobResponse = await client.From<Job>()
                .Where(j => j.Id == jobId)
                .Get();
            var job = jobResponse.Models?.FirstOrDefault();
            if (job == null)
            {
                return Results.NotFound(new { message = $"Job not found: {jobId}" });
            }

            // Company for display fields
            var companyResponse = await client.From<Company>()
                .Where(c => c.Id == job.CompanyId)
                .Get();
            var company = companyResponse.Models?.FirstOrDefault();
            var companyName = company?.Name ?? "Unknown Company";

            // Load all applications for count and paging
            var appResponse = await client.From<ApplicationDetail>()
                .Where(ad => ad.JobId == jobId)
                .Get();
            var allApplications = appResponse.Models ?? new List<ApplicationDetail>();
            var total = allApplications.Count;

            // Apply paging in-memory (Supabase .NET SDK call above fetched all; if needed, replace with RPC or filter client-side)
            var pagedApplications = allApplications
                .OrderByDescending(a => a.AppliedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            if (!pagedApplications.Any())
            {
                return Results.Ok(new
                {
                    candidates = new List<object>(),
                    totalCount = total,
                    page,
                    pageSize
                });
            }

            // Fetch all users and create lookup
            var allUsersResponse = await client.From<ApplicationUser>().Get();
            var allUsers = allUsersResponse.Models ?? new List<ApplicationUser>();
            var userLookup = allUsers.ToDictionary(u => u.Id, u => u);

            var candidates = pagedApplications.Select(app =>
            {
                var userIdStr = app.CandidateUserId.ToString();
                userLookup.TryGetValue(userIdStr, out var user);

                var name = user != null ? $"{user.FirstName} {user.LastName}" : $"Unknown User ({userIdStr[..8]}...)";
                var companyInitial = !string.IsNullOrEmpty(companyName) ? companyName.Substring(0, 1).ToUpper() : "C";
                var assessmentScore = app.OverallAiScore ?? CandidateRankingEndpoints.CalculateInitialRankingScore(app);

                return new
                {
                    id = app.Id.ToString(),
                    applicationId = app.Id.ToString(),
                    candidateUserId = app.CandidateUserId.ToString(),
                    jobId = app.JobId.ToString(),
                    name,
                    email = user?.Email ?? "No email available",
                    location = user?.Location,
                    experiences = user?.Experiences,
                    photo = user != null
                        ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(name)}&size=32&background=e5e7eb&color=374151&rounded=true"
                        : "https://ui-avatars.com/api/?name=Unknown&size=32&background=f87171&color=ffffff&rounded=true",
                    role = job.Title,
                    company = companyName,
                    companyLogo = !string.IsNullOrEmpty(company?.LogoUrl)
                        ? company.LogoUrl
                        : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(companyInitial)}&size=24&background=3b82f6&color=ffffff&rounded=true",
                    assessment = (int)Math.Round(assessmentScore),
                    stage = app.Stage,
                    status = app.Status,
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
                    hiringNotes = app.HiringNotes ?? "",
                    notesCreatedAt = app.NotesCreatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notesUpdatedAt = app.NotesUpdatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                };
            }).ToList();

            return Results.Ok(new
            {
                candidates,
                totalCount = total,
                page,
                pageSize
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching paged candidates for job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetRejectedCandidatesByCompany(
        Guid companyId,
        Supabase.Client client,
        string? jobId = null,
        string? rejectionReason = null,
        int? days = null)
    {
        try
        {
            Console.WriteLine($"Fetching rejected candidates for company: {companyId}");

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

            // Step 3: Get all rejected applications for these jobs
            var applications = new List<ApplicationDetail>();
            foreach (var jobIdItem in jobIds)
            {
                var appResponse = await client.From<ApplicationDetail>()
                    .Where(ad => ad.JobId == jobIdItem)
                    .Get();

                if (appResponse.Models != null)
                {
                    applications.AddRange(appResponse.Models);
                }
            }

            // Filter for rejected candidates only
            applications = applications.Where(a => a.Status == "Rejected").ToList();

            // Apply additional filters
            if (!string.IsNullOrEmpty(jobId) && Guid.TryParse(jobId, out var jobGuid))
            {
                applications = applications.Where(a => a.JobId == jobGuid).ToList();
            }

            if (!string.IsNullOrEmpty(rejectionReason))
            {
                applications = applications.Where(a =>
                    a.RejectionReason?.Equals(rejectionReason, StringComparison.OrdinalIgnoreCase) == true).ToList();
            }

            if (days.HasValue)
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-days.Value);
                applications = applications.Where(a =>
                    a.RejectedAt.HasValue && a.RejectedAt.Value >= cutoffDate).ToList();
            }

            Console.WriteLine($"Found {applications.Count} rejected applications");

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

            // Step 5: Build rejected candidate response objects
            var rejectedCandidates = applications.Select(app =>
            {
                var candidateUserIdString = app.CandidateUserId.ToString();
                var candidateUser = userLookup.ContainsKey(candidateUserIdString)
                    ? userLookup[candidateUserIdString]
                    : null;

                var job = companyJobs.FirstOrDefault(j => j.Id == app.JobId);

                return new
                {
                    id = app.Id.ToString(),
                    applicationId = app.Id.ToString(),
                    candidateUserId = candidateUserIdString,
                    jobId = app.JobId.ToString(),
                    jobTitle = job?.Title ?? "Unknown Position",
                    jobDepartment = job?.Department,
                    name = candidateUser != null ? $"{candidateUser.FirstName} {candidateUser.LastName}" : "Unknown Candidate",
                    email = candidateUser?.Email ?? "unknown@example.com",
                    company = company.Name,
                    role = job?.Title,
                    stage = app.Stage,
                    status = app.Status,
                    appliedAt = app.AppliedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rejectedAt = app.RejectedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rejectionReason = app.RejectionReason,
                    rejectionNotes = app.RejectionNotes,
                    statusChangedAt = app.StatusChangedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    resumeUrl = app.ResumeUrl,
                    expectedSalary = app.ExpectedSalary,
                    overallAiScore = app.OverallAiScore,
                    assessment = (int)(app.OverallAiScore ?? 0),
                    photo = "https://ui-avatars.com/api/?name=" + Uri.EscapeDataString(candidateUser?.FirstName ?? "U") + "&size=64&background=e5e7eb&color=374151&rounded=true",

                    // Notes
                    hiringNotes = app.HiringNotes,
                    notesCreatedAt = app.NotesCreatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notesUpdatedAt = app.NotesUpdatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    isSendRejectEmail = app.IsSendRejectEmail,
                };
            }).ToList();

            var response = new
            {
                candidates = rejectedCandidates,
                totalCount = rejectedCandidates.Count,
                companyName = company.Name,
                summary = new
                {
                    totalRejected = rejectedCandidates.Count,
                    rejectionReasons = rejectedCandidates
                        .Where(c => !string.IsNullOrEmpty(c.rejectionReason))
                        .GroupBy(c => c.rejectionReason)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    jobBreakdown = rejectedCandidates
                        .GroupBy(c => c.jobTitle)
                        .ToDictionary(g => g.Key, g => g.Count())
                }
            };

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"💥 ERROR in GetRejectedCandidatesByCompany: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new
            {
                error = ex.Message,
                details = ex.ToString()
            });
        }
    }

    private static async Task<IResult> GetRejectedCandidatesByJob(Guid jobId, Supabase.Client client)
    {
        try
        {
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

            // Get all rejected applications for this job
            var appResponse = await client.From<ApplicationDetail>()
                .Where(ad => ad.JobId == jobId)
                .Get();

            var applications = appResponse.Models?.Where(a => a.Status == "Rejected").ToList();
            if (applications == null || !applications.Any())
            {
                return Results.Ok(new List<object>());
            }

            Console.WriteLine($"Found {applications.Count} rejected applications for job");

            // Get ALL ApplicationUsers at once (more efficient)
            var allUsersResponse = await client.From<ApplicationUser>().Get();
            var allUsers = allUsersResponse.Models ?? new List<ApplicationUser>();
            var userLookup = allUsers.ToDictionary(u => u.Id, u => u);

            // Build rejected candidate response objects
            var rejectedCandidates = applications.Select(app =>
            {
                var candidateUserIdString = app.CandidateUserId.ToString();
                var candidateUser = userLookup.ContainsKey(candidateUserIdString)
                    ? userLookup[candidateUserIdString]
                    : null;

                return new
                {
                    id = app.Id.ToString(),
                    applicationId = app.Id.ToString(),
                    candidateUserId = candidateUserIdString,
                    jobId = app.JobId.ToString(),
                    jobTitle = job.Title,
                    jobDepartment = job.Department,
                    name = candidateUser != null ? $"{candidateUser.FirstName} {candidateUser.LastName}" : "Unknown Candidate",
                    email = candidateUser?.Email ?? "unknown@example.com",
                    company = companyName,
                    role = job.Title,
                    stage = app.Stage,
                    status = app.Status,
                    appliedAt = app.AppliedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rejectedAt = app.RejectedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rejectionReason = app.RejectionReason,
                    rejectionNotes = app.RejectionNotes,
                    statusChangedAt = app.StatusChangedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    resumeUrl = app.ResumeUrl,
                    expectedSalary = app.ExpectedSalary,
                    overallAiScore = app.OverallAiScore,
                    assessment = (int)(app.OverallAiScore ?? 0),
                    photo = "https://ui-avatars.com/api/?name=" + Uri.EscapeDataString(candidateUser?.FirstName ?? "U") + "&size=64&background=e5e7eb&color=374151&rounded=true",

                    // Notes
                    hiringNotes = app.HiringNotes,
                    notesCreatedAt = app.NotesCreatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notesUpdatedAt = app.NotesUpdatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    isSendRejectEmail = app.IsSendRejectEmail,
                };
            }).ToList();

            Console.WriteLine($"Returning {rejectedCandidates.Count} rejected candidates for job {jobId}");
            return Results.Ok(rejectedCandidates);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching rejected candidates for job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetCandidateDetails(string candidateId, Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"Fetching detailed candidate information for: {candidateId}");

            // Parse the candidateId string to Guid
            if (!Guid.TryParse(candidateId, out Guid candidateIdGuid))
            {
                return Results.BadRequest(new { message = $"Invalid candidate ID format: {candidateId}" });
            }

            // Get the application detail first
            var appResponse = await client.From<ApplicationDetail>()
                .Where(ad => ad.Id == candidateIdGuid)
                .Get();

            var application = appResponse.Models?.FirstOrDefault();
            if (application == null)
            {
                return Results.NotFound(new { message = $"Application not found: {candidateId}" });
            }

            // Get job details
            var jobResponse = await client.From<Job>()
                .Where(j => j.Id == application.JobId)
                .Get();

            var job = jobResponse.Models?.FirstOrDefault();
            if (job == null)
            {
                return Results.NotFound(new { message = $"Job not found for application: {candidateId}" });
            }

            // Get company information
            var companyResponse = await client.From<Company>()
                .Where(c => c.Id == job.CompanyId)
                .Get();

            var company = companyResponse.Models?.FirstOrDefault();
            var companyName = company?.Name ?? "Unknown Company";

            // Get candidate user details
            var candidateUserIdString = application.CandidateUserId.ToString();
            var userResponse = await client.From<ApplicationUser>()
                .Where(u => u.Id == candidateUserIdString)
                .Get();

            var candidateUser = userResponse.Models?.FirstOrDefault();
            if (candidateUser == null)
            {
                return Results.NotFound(new { message = $"Candidate user not found: {application.CandidateUserId}" });
            }

            var candidateName = $"{candidateUser.FirstName} {candidateUser.LastName}";
            var assessmentScore = application.OverallAiScore ?? CandidateRankingEndpoints.CalculateInitialRankingScore(application);

            var detailedCandidate = new
            {
                id = application.Id.ToString(),
                applicationId = application.Id.ToString(),
                candidateUserId = application.CandidateUserId.ToString(),
                jobId = application.JobId.ToString(),
                name = candidateName,
                email = candidateUser.Email,
                phoneNumber = candidateUser.PhoneNumber,
                location = candidateUser.Location,
                experiences = candidateUser.Experiences,
                education = candidateUser.Education,
                photo = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(candidateName)}&size=64&background=e5e7eb&color=374151&rounded=true",
                role = job.Title,
                company = companyName,
                companyLogo = !string.IsNullOrEmpty(company?.LogoUrl)
                    ? company.LogoUrl
                    : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(companyName.Substring(0, 1).ToUpper())}&size=24&background=3b82f6&color=ffffff&rounded=true",
                assessment = (int)Math.Round(assessmentScore),
                stage = application.Stage,
                status = application.Status,
                appliedAt = application.AppliedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                resumeUrl = application.ResumeUrl,
                coverLetterText = application.CoverLetterText,
                expectedSalary = application.ExpectedSalary,
                availabilityDate = application.AvailabilityDate?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                jobSource = application.JobSource,
                overallAiScore = application.OverallAiScore,
                jobTitle = job.Title,
                jobDepartment = job.Department ?? "",
                jobLocationType = job.LocationType ?? "Unknown",
                jobEmploymentType = job.EmploymentType ?? "Unknown",
                hiringNotes = application.HiringNotes ?? "",
                notesCreatedAt = application.NotesCreatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                notesUpdatedAt = application.NotesUpdatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                rejectionReason = application.RejectionReason,
                rejectionNotes = application.RejectionNotes,
                rejectedAt = application.RejectedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                isSendRejectEmail = application.IsSendRejectEmail,
                currentRoundId = application.CurrentRoundId
            };

            Console.WriteLine($"✅ Returning detailed candidate information for: {candidateName}");
            return Results.Ok(detailedCandidate);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching candidate details: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }
}
using Supabase;
using ai_hr.Models;
using ai_hr.Contracts;
using DotNetEnv;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Annotations;

// Load environment variables from .env file
Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.EnableAnnotations();
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AI HR Platform API",
        Version = "v1",
        Description = "A comprehensive HR platform API with job management, candidate tracking, and recruitment features"
    });

    // Define tags for grouping endpoints
    c.TagActionsBy(api => new[] { api.GroupName ?? api.ActionDescriptor.EndpointMetadata.OfType<TagsAttribute>().SelectMany(t => t.Tags).FirstOrDefault() ?? "Default" });
    c.DocInclusionPredicate((name, api) => true);
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',')
            ?? new[] { "http://localhost:3000", "https://localhost:3000" };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddScoped<Supabase.Client>(_ => new Supabase.Client(
    Environment.GetEnvironmentVariable("SUPABASE_URL") ?? builder.Configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase URL not configured"),
    Environment.GetEnvironmentVariable("SUPABASE_KEY") ?? builder.Configuration["Supabase:Key"] ?? throw new InvalidOperationException("Supabase Key not configured"),
    new SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true
    }
));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS
app.UseCors("AllowNextJs");

app.MapPost("/users/create", async (CreateUserRequest request, Supabase.Client client) =>
{
    try
    {
        Console.WriteLine($"Creating user with email: {request.Email}");

        var user = new ApplicationUser
        {
            Email = request.Email,
            Password = request.Password,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow.AddHours(7)
        };

        Console.WriteLine($"User object created - Email: {user.Email}, Name: {user.FirstName} {user.LastName}");

        var response = await client.From<ApplicationUser>().Insert(user);
        var newUser = response.Models.First();

        Console.WriteLine($"Insert successful - User ID: {newUser.Id}");

        return Results.Ok(); // Return 202 Accepted with location header
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating user: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Users")
.WithName("CreateUser")
.WithSummary("Create a new user")
.WithDescription("Creates a new user account with email, password, and personal details");

app.MapGet("/users/{id}", async (string id, Supabase.Client client) =>
{
    try
    {
        var response = await client.From<ApplicationUser>().Where(n => n.Id == id).Get();

        var user = response.Models.FirstOrDefault();

        if (user is null)
        {
            return Results.NotFound();
        }

        // Create a simple anonymous object with just the properties we want to return
        // This avoids serialization issues with the PrimaryKeyAttribute
        var userDto = new
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            CreatedAt = user.CreatedAt
        };

        return Results.Ok(userDto);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving user: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Users")
.WithName("GetUserById")
.WithSummary("Get user by ID")
.WithDescription("Retrieves a specific user by their unique identifier");

app.MapDelete("/users/{id}", async (string id, Supabase.Client client) =>
{
    await client.From<ApplicationUser>().Where(n => n.Id == id).Delete();
    return Results.NoContent();
})
.WithTags("Users")
.WithName("DeleteUser")
.WithSummary("Delete user")
.WithDescription("Permanently removes a user from the system");

// ApplicationDetails CRUD Endpoints

app.MapPost("/applicationdetails", async (CreateApplicationDetailRequest request, Supabase.Client client) =>
{
    try
    {
        var applicationDetail = new ApplicationDetail
        {
            JobId = request.JobId,
            CandidateUserId = request.CandidateUserId,
            ResumeUrl = request.ResumeUrl,
            CoverLetterText = request.CoverLetterText,
            ExpectedSalary = request.ExpectedSalary,
            AvailabilityDate = request.AvailabilityDate,
            JobSource = request.JobSource,
            AiAnalysis = request.AiAnalysis,
            AppliedAt = DateTime.UtcNow.AddHours(7), // Consistent with User creation
            StatusChangedAt = DateTime.UtcNow.AddHours(7)
        };

        var response = await client.From<ApplicationDetail>().Insert(applicationDetail);
        var newApplicationDetail = response.Models.FirstOrDefault();

        if (newApplicationDetail == null)
        {
            return Results.BadRequest(new { error = "Failed to create application detail." });
        }

        // Return 200 OK with no response body
        return Results.Ok();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating application detail: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Application Details")
.WithName("CreateApplicationDetail")
.WithSummary("Create new application")
.WithDescription("Submit a new job application with candidate details and optional documents");

app.MapGet("/applicationdetails/{id}", async (Guid id, Supabase.Client client) =>
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
})
.WithTags("Application Details")
.WithName("GetApplicationDetailById")
.WithSummary("Get application by ID")
.WithDescription("Retrieves details of a specific job application by its unique identifier");

app.MapGet("/applicationdetails/job/{jobId}", async (Guid jobId, Supabase.Client client) =>
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
})
.WithTags("Application Details")
.WithName("GetApplicationDetailsByJob")
.WithSummary("Get applications by job")
.WithDescription("Retrieves all applications for a specific job posting");

app.MapGet("/applicationdetails/candidate/{candidateUserId}", async (Guid candidateUserId, Supabase.Client client) =>
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
})
.WithTags("Application Details")
.WithName("GetApplicationDetailsByCandidate")
.WithSummary("Get applications by candidate")
.WithDescription("Retrieves all applications submitted by a specific candidate");

app.MapPut("/applicationdetails/{id}", async (Guid id, UpdateApplicationDetailRequest request, Supabase.Client client) =>
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
})
.WithTags("Application Details")
.WithName("UpdateApplicationDetail")
.WithSummary("Update application")
.WithDescription("Update an existing job application's details, documents, or status");

app.MapDelete("/applicationdetails/{id}", async (Guid id, Supabase.Client client) =>
{
    try
    {
        await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Delete();
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error deleting application detail: {ex.Message}");
        // Consider logging ex.StackTrace here as well for more detailed debugging if needed
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithTags("Application Details")
.WithName("DeleteApplicationDetail")
.WithSummary("Delete application")
.WithDescription("Permanently removes a job application from the system");


// Create a new job
app.MapPost("/jobs", async (CreateJobRequest request, Supabase.Client client) =>
{
    try
    {
        Console.WriteLine($"Creating job with title: {request.Title}");
        var job = new Job
        {
            Title = request.Title,
            CompanyId = request.CompanyId,
            CreatedBy = request.CreatedBy,
            Description = request.Description,
            Responsibilities = request.Responsibilities,
            Requirements = request.Requirements,
            Qualifications = request.Qualifications,
            Benefits = request.Benefits,
            EmploymentType = request.EmploymentType,
            SeniorityLevel = request.SeniorityLevel,
            ExperienceYearsMin = request.ExperienceYearsMin,
            LocationType = request.LocationType,
            Locations = request.Locations,
            SalaryMin = request.SalaryMin,
            SalaryMax = request.SalaryMax,
            SalaryCurrency = request.SalaryCurrency,
            ApplicationDeadline = request.ApplicationDeadline,
            Status = request.Status,
            AiGeneratedDescription = request.AiGeneratedDescription,
            SkillMatchThreshold = request.SkillMatchThreshold,
            CreatedAt = DateTime.UtcNow,
        };

        var response = await client.From<Job>().Insert(job);
        return Results.Ok();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating job: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Jobs")
.WithName("CreateJob")
.WithSummary("Create new job")
.WithDescription("Create a new job posting with comprehensive details for candidates to apply");

// Get a specific job by ID
app.MapGet("/jobs/{id}", async (Guid id, Supabase.Client client) =>
{
    try
    {
        // Get all jobs and filter by ID
        var response = await client.From<Job>().Get();
        var job = response.Models.FirstOrDefault(j => j.Id == id);

        if (job == null)
        {
            return Results.NotFound(new { message = $"Job with ID {id} not found" });
        }

        // Create a simple DTO to avoid serialization issues
        var jobDto = new
        {
            Id = job.Id,
            Title = job.Title,
            CompanyId = job.CompanyId,
            CreatedBy = job.CreatedBy,
            Description = job.Description,
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
            CreatedAt = job.CreatedAt,
        };

        return Results.Ok(jobDto);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving job: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Jobs")
.WithName("GetJobById")
.WithSummary("Get job by ID")
.WithDescription("Retrieves complete details of a specific job posting by its unique identifier");

// Get all jobs with optional filtering
app.MapGet("/jobs", async (string status, Guid? companyId, Supabase.Client client) =>
{
    try
    {
        // Start with a base query
        var query = client.From<Job>();
        var response = await query.Get();
        var jobs = response.Models;

        // Apply filters after getting the data
        if (!string.IsNullOrEmpty(status))
        {
            jobs = jobs.Where(j => j.Status == status).ToList();
        }

        if (companyId.HasValue)
        {
            jobs = jobs.Where(j => j.CompanyId == companyId.Value).ToList();
        }

        // Create DTOs to avoid serialization issues
        var jobDtos = jobs.Select(job => new
        {
            Id = job.Id,
            Title = job.Title,
            CompanyId = job.CompanyId,
            Description = job.Description,
            EmploymentType = job.EmploymentType,
            LocationType = job.LocationType,
            SalaryMin = job.SalaryMin,
            SalaryMax = job.SalaryMax,
            SalaryCurrency = job.SalaryCurrency,
            Status = job.Status,
            ApplicantCount = job.ApplicantCount,
            PostedDate = job.PostedDate,
            CreatedAt = job.CreatedAt
        }).ToList();

        return Results.Ok(jobDtos);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving jobs: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Jobs")
.WithName("GetJobs")
.WithSummary("List all jobs")
.WithDescription("Gets a list of all jobs with optional filtering by status and company");

// Update a job
app.MapPut("/jobs/{id}", async (Guid id, UpdateJobRequest request, Supabase.Client client) =>
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
        if (request.Description != null) job.Description = request.Description;
        if (request.Responsibilities != null) job.Responsibilities = request.Responsibilities;
        if (request.Requirements != null) job.Requirements = request.Requirements;
        if (request.Qualifications != null) job.Qualifications = request.Qualifications;
        if (request.Benefits != null) job.Benefits = request.Benefits;
        if (request.EmploymentType != null) job.EmploymentType = request.EmploymentType;
        if (request.SeniorityLevel != null) job.SeniorityLevel = request.SeniorityLevel;
        if (request.ExperienceYearsMin.HasValue) job.ExperienceYearsMin = request.ExperienceYearsMin;
        if (request.LocationType != null) job.LocationType = request.LocationType;
        if (request.Locations != null) job.Locations = request.Locations;
        if (request.SalaryMin.HasValue) job.SalaryMin = request.SalaryMin;
        if (request.SalaryMax.HasValue) job.SalaryMax = request.SalaryMax;
        if (request.SalaryCurrency != null) job.SalaryCurrency = request.SalaryCurrency;
        if (request.ApplicationDeadline.HasValue) job.ApplicationDeadline = request.ApplicationDeadline;
        if (request.Status != null) job.Status = request.Status;
        if (request.AiGeneratedDescription.HasValue) job.AiGeneratedDescription = request.AiGeneratedDescription.Value;
        if (request.SkillMatchThreshold.HasValue) job.SkillMatchThreshold = request.SkillMatchThreshold.Value;
        if (request.PostedDate.HasValue) job.PostedDate = request.PostedDate;
        if (request.ClosedDate.HasValue) job.ClosedDate = request.ClosedDate;


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
})
.WithTags("Jobs")
.WithName("UpdateJob")
.WithSummary("Update job")
.WithDescription("Update an existing job posting's details, requirements, or status");

// Delete a job
app.MapDelete("/jobs/{id}", async (Guid id, Supabase.Client client) =>
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
})
.WithTags("Jobs")
.WithName("DeleteJob")
.WithSummary("Delete job")
.WithDescription("Permanently removes a job posting from the system");

// Get all jobs for a specific company
app.MapGet("/jobs/company/{companyId}", async (Guid companyId, Supabase.Client client) =>
{
    try
    {
        // Get all jobs first
        var response = await client.From<Job>().Get();
        var allJobs = response.Models;

        // Filter by company ID
        var jobs = allJobs.Where(j => j.CompanyId == companyId).ToList();

        if (jobs == null || !jobs.Any())
        {
            return Results.NotFound(new { message = $"No jobs found for company ID: {companyId}" });
        }

        // Create DTOs to avoid serialization issues
        var jobDtos = jobs.Select(job => new
        {
            Id = job.Id,
            Title = job.Title,
            Description = job.Description,
            EmploymentType = job.EmploymentType,
            LocationType = job.LocationType,
            SalaryMin = job.SalaryMin,
            SalaryMax = job.SalaryMax,
            SalaryCurrency = job.SalaryCurrency,
            Status = job.Status,
            ApplicantCount = job.ApplicantCount,
            PostedDate = job.PostedDate,
            CreatedAt = job.CreatedAt
        }).ToList();

        return Results.Ok(jobDtos);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving jobs for company: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Jobs")
.WithName("GetJobsByCompany")
.WithSummary("Get jobs by company")
.WithDescription("Retrieves all job postings for a specific company");

app.MapPost("/companies", async (CreateCompanyRequest request, Supabase.Client client) =>
{
    try
    {
        var company = new Company
        {
            Name = request.Name,
            Description = request.Description,
            Website = request.Website,
            LogoUrl = request.LogoUrl,
            Industry = request.Industry,
            CompanySize = request.CompanySize,
            Headquarters = request.Headquarters,
            FoundedYear = request.FoundedYear,
            IsVerified = false,
            CreatedAt = DateTime.UtcNow,
        };

        var response = await client.From<Company>().Insert(company);
        return Results.Accepted($"/companies/{company.Id}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating company: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Companies")
.WithName("CreateCompany")
.WithSummary("Create new company")
.WithDescription("Creates a new company profile in the system");

app.MapGet("/companies/{id}", async (Guid id, Supabase.Client client) =>
{
    try
    {
        // Get all companies and filter by ID
        var response = await client.From<Company>().Get();
        var company = response.Models.FirstOrDefault(c => c.Id == id);

        if (company == null)
        {
            return Results.NotFound(new { message = $"Company with ID {id} not found" });
        }

        // Create a simple DTO to avoid serialization issues
        var companyDto = new
        {
            Id = company.Id,
            Name = company.Name,
            Description = company.Description,
            Website = company.Website,
            LogoUrl = company.LogoUrl,
            Industry = company.Industry,
            CompanySize = company.CompanySize,
            Headquarters = company.Headquarters,
            FoundedYear = company.FoundedYear,
            IsVerified = company.IsVerified,
            CreatedAt = company.CreatedAt
        };

        return Results.Ok(companyDto);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving company: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Companies")
.WithName("GetCompanyById")
.WithSummary("Get company by ID")
.WithDescription("Retrieves a specific company's profile by its unique identifier");

app.MapGet("/companies/filter", async (string industry, bool? isVerified, Supabase.Client client) =>
{
    try
    {
        // Get all companies
        var response = await client.From<Company>().Get();
        var companies = response.Models;

        // Apply filters if provided
        if (!string.IsNullOrEmpty(industry))
        {
            companies = companies.Where(c => c.Industry == industry).ToList();
        }

        if (isVerified.HasValue)
        {
            companies = companies.Where(c => c.IsVerified == isVerified.Value).ToList();
        }

        // Create DTOs to avoid serialization issues
        var companyDtos = companies.Select(company => new
        {
            Id = company.Id,
            Name = company.Name,
            Description = company.Description,
            Website = company.Website,
            LogoUrl = company.LogoUrl,
            Industry = company.Industry,
            CompanySize = company.CompanySize,
            Headquarters = company.Headquarters,
            FoundedYear = company.FoundedYear,
            IsVerified = company.IsVerified,
            CreatedAt = company.CreatedAt
        }).ToList();

        return Results.Ok(companyDtos);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving companies: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Companies")
.WithName("FilterCompanies")
.WithSummary("Filter companies")
.WithDescription("Get a list of companies with optional filtering by industry and verification status");

app.MapPut("/companies/{id}", async (Guid id, UpdateCompanyRequest request, Supabase.Client client) =>
{
    try
    {
        // First, get all companies and filter by ID
        var getResponse = await client.From<Company>().Get();
        var company = getResponse.Models.FirstOrDefault(c => c.Id == id);

        if (company == null)
        {
            return Results.NotFound(new { message = $"Company with ID {id} not found" });
        }

        // Update properties if provided in the request
        if (request.Name != null) company.Name = request.Name;
        if (request.Description != null) company.Description = request.Description;
        if (request.Website != null) company.Website = request.Website;
        if (request.LogoUrl != null) company.LogoUrl = request.LogoUrl;
        if (request.Industry != null) company.Industry = request.Industry;
        if (request.CompanySize != null) company.CompanySize = request.CompanySize;
        if (request.Headquarters != null) company.Headquarters = request.Headquarters;
        if (request.FoundedYear.HasValue) company.FoundedYear = request.FoundedYear;
        if (request.IsVerified.HasValue) company.IsVerified = request.IsVerified.Value;

        // Update the record
        var response = await client.From<Company>().Update(company);

        return Results.Accepted($"/companies/{id}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error updating company: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Companies")
.WithName("UpdateCompany")
.WithSummary("Update company")
.WithDescription("Update an existing company's profile details");

app.MapDelete("/companies/{id}", async (Guid id, Supabase.Client client) =>
{
    try
    {
        // First, get all companies and filter by ID
        var getResponse = await client.From<Company>().Get();
        var company = getResponse.Models.FirstOrDefault(c => c.Id == id);

        if (company == null)
        {
            return Results.NotFound(new { message = $"Company with ID {id} not found" });
        }

        // Delete the company
        var response = await client.From<Company>().Delete(company);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error deleting company: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Companies")
.WithName("DeleteCompany")
.WithSummary("Delete company")
.WithDescription("Permanently removes a company and its profile from the system");

app.MapGet("/companies/verified", async (Supabase.Client client) =>
{
    try
    {
        // Get all companies
        var response = await client.From<Company>().Get();
        var companies = response.Models;

        // Filter to only verified companies
        var verifiedCompanies = companies.Where(c => c.IsVerified).ToList();

        // Create DTOs to avoid serialization issues
        var companyDtos = verifiedCompanies.Select(company => new
        {
            Id = company.Id,
            Name = company.Name,
            Description = company.Description,
            Website = company.Website,
            LogoUrl = company.LogoUrl,
            Industry = company.Industry,
            CompanySize = company.CompanySize,
            Headquarters = company.Headquarters,
            FoundedYear = company.FoundedYear,
            CreatedAt = company.CreatedAt
        }).ToList();

        return Results.Ok(companyDtos);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving verified companies: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Companies")
.WithName("GetVerifiedCompanies")
.WithSummary("Get verified companies")
.WithDescription("Retrieves a list of all companies that have been verified");

app.MapPut("/companies/{id}/verify", async (Guid id, Supabase.Client client) =>
{
    try
    {
        // First, get all companies and filter by ID
        var getResponse = await client.From<Company>().Get();
        var company = getResponse.Models.FirstOrDefault(c => c.Id == id);

        if (company == null)
        {
            return Results.NotFound(new { message = $"Company with ID {id} not found" });
        }

        // Update verification status
        company.IsVerified = true;

        // Update the record
        var response = await client.From<Company>().Update(company);

        return Results.Accepted($"/companies/{id}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error verifying company: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Companies")
.WithName("VerifyCompany")
.WithSummary("Verify company")
.WithDescription("Marks a company as verified to indicate legitimacy");

app.MapPost("/hiring-user-profiles", async (CreateHiringUserProfileRequest request, Supabase.Client client) =>
{
    try
    {

        var profile = new HiringUserProfile
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            UserType = request.UserType,
            CompanyId = request.CompanyId,
            Bio = request.Bio,
            LinkedinUrl = request.LinkedinUrl,
            Location = request.Location,
            Preferences = request.Preferences,
            CreatedAt = DateTime.UtcNow
        };

        var response = await client.From<HiringUserProfile>().Insert(profile);
        return Results.Accepted($"/hiring-user-profiles/{profile.Id}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating hiring user profile: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Hiring User Profiles")
.WithName("CreateHiringUserProfile")
.WithSummary("Create hiring user profile")
.WithDescription("Creates a new profile for a recruiter, hiring manager, or other HR professional");

app.MapGet("/hiring-user-profiles/{id}", async (Guid id, Supabase.Client client) =>
{
    try
    {
        var response = await client.From<HiringUserProfile>().Get();
        var profile = response.Models.FirstOrDefault(p => p.Id == id);

        if (profile == null)
        {
            return Results.NotFound(new { message = $"Hiring user profile with ID {id} not found" });
        }

        var profileDto = new
        {
            Id = profile.Id,
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            Email = profile.Email,
            UserType = profile.UserType,
            CompanyId = profile.CompanyId,
            Bio = profile.Bio,
            LinkedinUrl = profile.LinkedinUrl,
            Location = profile.Location,
            Preferences = profile.Preferences,
            CreatedAt = profile.CreatedAt
        };

        return Results.Ok(profileDto);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving hiring user profile: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Hiring User Profiles")
.WithName("GetHiringUserProfileById")
.WithSummary("Get hiring user profile by ID")
.WithDescription("Retrieves details of a specific hiring user profile by its unique identifier");

app.MapGet("/hiring-user-profiles/filter", async (string userType, Guid? companyId, Supabase.Client client) =>
{
    try
    {
        var response = await client.From<HiringUserProfile>().Get();
        var profiles = response.Models;

        // Apply filters if provided
        if (!string.IsNullOrEmpty(userType))
        {
            profiles = profiles.Where(p => p.UserType == userType).ToList();
        }

        if (companyId.HasValue)
        {
            profiles = profiles.Where(p => p.CompanyId == companyId.Value).ToList();
        }

        var profileDtos = profiles.Select(profile => new
        {
            Id = profile.Id,
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            Email = profile.Email,
            UserType = profile.UserType,
            CompanyId = profile.CompanyId,
            Bio = profile.Bio,
            LinkedinUrl = profile.LinkedinUrl,
            Location = profile.Location,
            Preferences = profile.Preferences,
            CreatedAt = profile.CreatedAt
        }).ToList();

        return Results.Ok(profileDtos);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error retrieving hiring user profiles: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Hiring User Profiles")
.WithName("FilterHiringUserProfiles")
.WithSummary("Filter hiring user profiles")
.WithDescription("Retrieves hiring user profiles with optional filtering by user type and company");

app.MapPut("/hiring-user-profiles/{id}", async (Guid id, UpdateHiringUserProfileRequest request, Supabase.Client client) =>
{
    try
    {
        // Validate user type if provided
        if (!string.IsNullOrEmpty(request.UserType))
        {
            var validUserTypes = new[] { "recruiter", "candidate", "admin", "hiring_manager" };
            if (!validUserTypes.Contains(request.UserType))
            {
                return Results.BadRequest(new { error = "Invalid user type. Must be one of: recruiter, candidate, admin, hiring_manager" });
            }
        }


        var getResponse = await client.From<HiringUserProfile>().Get();
        var profile = getResponse.Models.FirstOrDefault(p => p.Id == id);

        if (profile == null)
        {
            return Results.NotFound(new { message = $"Hiring user profile with ID {id} not found" });
        }

        // Update properties if provided in the request
        if (request.FirstName != null) profile.FirstName = request.FirstName;
        if (request.LastName != null) profile.LastName = request.LastName;
        if (request.Email != null) profile.Email = request.Email;
        if (request.UserType != null) profile.UserType = request.UserType;
        if (request.CompanyId.HasValue) profile.CompanyId = request.CompanyId;
        if (request.Bio != null) profile.Bio = request.Bio;
        if (request.LinkedinUrl != null) profile.LinkedinUrl = request.LinkedinUrl;
        if (request.Location != null) profile.Location = request.Location;
        if (request.Preferences != null) profile.Preferences = request.Preferences;

        var response = await client.From<HiringUserProfile>().Update(profile);

        return Results.Accepted($"/hiring-user-profiles/{id}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error updating hiring user profile: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Hiring User Profiles")
.WithName("UpdateHiringUserProfile")
.WithSummary("Update hiring user profile")
.WithDescription("Updates an existing hiring user profile's details and preferences");

app.MapDelete("/hiring-user-profiles/{id}", async (Guid id, Supabase.Client client) =>
{
    try
    {
        var getResponse = await client.From<HiringUserProfile>().Get();
        var profile = getResponse.Models.FirstOrDefault(p => p.Id == id);

        if (profile == null)
        {
            return Results.NotFound(new { message = $"Hiring user profile with ID {id} not found" });
        }

        var response = await client.From<HiringUserProfile>().Delete(profile);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error deleting hiring user profile: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
})
.WithTags("Hiring User Profiles")
.WithName("DeleteHiringUserProfile")
.WithSummary("Delete hiring user profile")
.WithDescription("Permanently removes a hiring user profile from the system");

app.UseHttpsRedirection();

app.Run();

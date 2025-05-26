using Supabase;
using ai_hr.Models;
using ai_hr.Contracts;
using DotNetEnv;

// Load environment variables from .env file
Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
});

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
});

app.MapDelete("/users/{id}", async (string id, Supabase.Client client) =>
{
    await client.From<ApplicationUser>().Where(n => n.Id == id).Delete();
    return Results.NoContent();
});

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
});

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
});

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
});

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
});

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
});

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
});


// Create a new job
app.MapPost("/jobs", async (CreateJobRequest request, Supabase.Client client) =>
{
    try
    {
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
        return Results.Accepted($"/jobs/{job.Id}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating job: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
});

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
});

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
});

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
});

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
});

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
});

app.MapPost("/companies", async (CreateCompanyRequest request, Supabase.Client client) =>
{
    try
    {
        var company = new Company
        {
            Id = Guid.NewGuid(),
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
});

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
});

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
});

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
});

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
});

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
});

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
});

app.UseHttpsRedirection();

app.Run();

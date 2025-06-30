using ai_hr.Models;
using ai_hr.Contracts;
using Supabase;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ai_hr.Endpoints;

public static class CompanyEndpoints
{
    public static void MapCompanyEndpoints(this WebApplication app)
    {
        app.MapPost("/companies", CreateCompany)
            .WithTags("Companies")
            .WithName("CreateCompany")
            .WithSummary("Create new company")
            .WithDescription("Creates a new company profile in the system");

        app.MapGet("/companies/{id}", GetCompanyById)
            .WithTags("Companies")
            .WithName("GetCompanyById")
            .WithSummary("Get company by ID")
            .WithDescription("Retrieves a specific company's profile by its unique identifier");

        app.MapGet("/companies", GetAllCompanies)
            .WithTags("Companies")
            .WithName("GetAllCompanies")
            .WithSummary("Get all companies")
            .WithDescription("Retrieves a list of all companies in the system");

        app.MapGet("/companies/filter", FilterCompanies)
            .WithTags("Companies")
            .WithName("FilterCompanies")
            .WithSummary("Filter companies")
            .WithDescription("Get a list of companies with optional filtering by industry and verification status");

        app.MapPut("/companies/{id}", UpdateCompany)
            .WithTags("Companies")
            .WithName("UpdateCompany")
            .WithSummary("Update company")
            .WithDescription("Update an existing company's profile details");

        app.MapDelete("/companies/{id}", DeleteCompany)
            .WithTags("Companies")
            .WithName("DeleteCompany")
            .WithSummary("Delete company")
            .WithDescription("Permanently removes a company and its profile from the system");

        app.MapGet("/companies/verified", GetVerifiedCompanies)
            .WithTags("Companies")
            .WithName("GetVerifiedCompanies")
            .WithSummary("Get verified companies")
            .WithDescription("Retrieves a list of all companies that have been verified");

        app.MapPut("/companies/{id}/verify", VerifyCompany)
            .WithTags("Companies")
            .WithName("VerifyCompany")
            .WithSummary("Verify company")
            .WithDescription("Marks a company as verified to indicate legitimacy");

        app.MapPost("/companies/{companyId}/copy-standard-templates", CopyStandardTemplates)
            .WithTags("Companies")
            .WithName("CopyStandardTemplates")
            .WithSummary("Copy standard interview templates to new company")
            .WithDescription("Copies all interview templates from the template company to a newly registered company")
            .RequireAuthorization();

        // Public endpoints for applicant users
        app.MapGet("/public/companies", GetPublicCompanies)
            .WithTags("Public Companies")
            .WithName("GetPublicCompanies")
            .WithSummary("Browse public companies")
            .WithDescription("Gets a list of verified companies for applicant browsing - no authentication required");

        app.MapGet("/public/companies/{id}", GetPublicCompanyById)
            .WithTags("Public Companies")
            .WithName("GetPublicCompanyById")
            .WithSummary("Get public company by ID")
            .WithDescription("Retrieves complete details of a specific company with their job postings - no authentication required");
    }

    private static async Task<IResult> CreateCompany(CreateCompanyRequest request, Supabase.Client client)
    {
        try
        {
            // Validate request object
            if (request == null)
            {
                return Results.BadRequest(new { error = "Request object is null" });
            }

            // Validate required fields
            if (string.IsNullOrEmpty(request.email))
            {
                return Results.BadRequest(new { error = "Email is required" });
            }

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
                email = request.email,
                IsVerified = false,
                CreatedAt = DateTime.UtcNow,
            };

            var response = await client.From<Company>().Insert(company);

            Console.WriteLine($"[DEBUG] Company inserted successfully");

            // Get the created company from the response
            var createdCompany = response.Models.FirstOrDefault();

            if (createdCompany == null)
            {
                Console.WriteLine($"[DEBUG] No company returned from insert operation");
                return Results.BadRequest(new { error = "Failed to create company" });
            }

            Console.WriteLine($"[DEBUG] Created company ID: {createdCompany.Id}");

            // Create a response DTO that matches the existing company structure
            var companyResponse = new
            {
                id = createdCompany.Id,  // Use lowercase 'id' to match frontend expectations
                name = createdCompany.Name,
                description = createdCompany.Description,
                website = createdCompany.Website,
                logoUrl = createdCompany.LogoUrl,
                industry = createdCompany.Industry,
                companySize = createdCompany.CompanySize,
                headquarters = createdCompany.Headquarters,
                foundedYear = createdCompany.FoundedYear,
                email = createdCompany.email,
                isVerified = createdCompany.IsVerified,
                createdAt = createdCompany.CreatedAt
            };

            Console.WriteLine($"[DEBUG] Returning company response with ID: {companyResponse.id}");

            // Return 201 Created with the company data in the response body
            return Results.Created($"/companies/{createdCompany.Id}", companyResponse);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating company: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetCompanyById(Guid id, Supabase.Client client)
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
                email = company.email,
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
    }

    private static async Task<IResult> GetAllCompanies(Supabase.Client client)
    {
        try
        {
            // Get all companies
            var response = await client.From<Company>().Get();
            var companies = response.Models;

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
                email = company.email,
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
    }

    private static async Task<IResult> FilterCompanies(string? industry, bool? isVerified, Supabase.Client client)
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
                email = company.email,
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
    }

    private static async Task<IResult> UpdateCompany(Guid id, UpdateCompanyRequest request, Supabase.Client client)
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
            if (request.email != null) company.email = request.email;
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
    }

    private static async Task<IResult> DeleteCompany(Guid id, Supabase.Client client)
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
    }

    private static async Task<IResult> GetVerifiedCompanies(Supabase.Client client)
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
                email = company.email,
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
    }

    private static async Task<IResult> VerifyCompany(Guid id, Supabase.Client client)
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
    }

    private static async Task<IResult> CopyStandardTemplates(
        Guid companyId,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            // Template company ID that contains all standard templates
            var templateCompanyId = Guid.Parse("979d1d98-28f2-4dac-8690-7a05986aead7");

            // Get all interview templates from the template company
            var templateResponse = await client.From<InterviewTemplate>().Get();
            var sourceTemplates = templateResponse.Models
                .Where(t => t.CompanyId == templateCompanyId)
                .ToList();

            if (!sourceTemplates.Any())
            {
                // Check if the template company exists
                var companyResponse = await client.From<Company>().Get();
                var templateCompany = companyResponse.Models.FirstOrDefault(c => c.Id == templateCompanyId);

                if (templateCompany == null)
                {
                    return Results.Ok(new
                    {
                        message = "Template company not found",
                        templatesCreated = 0,
                        error = "Template company does not exist"
                    });
                }
                else
                {
                    return Results.Ok(new
                    {
                        message = "Template company exists but has no templates",
                        templatesCreated = 0,
                        templateCompanyName = templateCompany.Name
                    });
                }
            }

            var copiedTemplates = new List<InterviewTemplate>();
            var copiedRounds = new List<InterviewRound>();

            // Copy each template
            foreach (var sourceTemplate in sourceTemplates)
            {
                // Create new template for the target company
                var newTemplate = new InterviewTemplate
                {
                    Id = Guid.NewGuid(),
                    Name = sourceTemplate.Name,
                    Description = sourceTemplate.Description,
                    CompanyId = companyId, // Assign to new company
                    IsDefault = sourceTemplate.IsDefault,
                    CreatedBy = Guid.Parse("8169bddd-fbd6-48d5-bca4-333642eee938"), // Template company creator
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    UsageCount = 0,
                    SuccessRate = 0.0m,
                    AverageRating = 0.0m
                };

                copiedTemplates.Add(newTemplate);

                // Get rounds for this template
                var roundsResponse = await client.From<InterviewRound>().Get();
                var sourceRounds = roundsResponse.Models
                    .Where(r => r.TemplateId == sourceTemplate.Id)
                    .OrderBy(r => r.RoundOrder)
                    .ToList();

                // Copy each round
                foreach (var sourceRound in sourceRounds)
                {
                    var newRound = new InterviewRound
                    {
                        Id = Guid.NewGuid(),
                        TemplateId = newTemplate.Id, // Link to new template
                        Name = sourceRound.Name,
                        Type = sourceRound.Type,
                        Duration = sourceRound.Duration,
                        RoundOrder = sourceRound.RoundOrder,
                        Description = sourceRound.Description,
                        PassingCriteria = sourceRound.PassingCriteria,
                        IsOptional = sourceRound.IsOptional,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    // Validate that template ID is not empty
                    if (newRound.TemplateId == Guid.Empty)
                    {
                        throw new InvalidOperationException($"Template ID cannot be empty for round {newRound.Name}");
                    }

                    copiedRounds.Add(newRound);
                }
            }

            // Insert templates one by one and capture actual IDs
            var insertedTemplateIds = new List<Guid>();
            foreach (var template in copiedTemplates)
            {
                try
                {
                    var insertResponse = await client.From<InterviewTemplate>().Insert(template);

                    // Get the actual inserted template from the response
                    var insertedTemplate = insertResponse.Models.FirstOrDefault();
                    if (insertedTemplate != null)
                    {
                        insertedTemplateIds.Add(insertedTemplate.Id);

                        // Update the rounds to use the actual inserted template ID
                        foreach (var round in copiedRounds.Where(r => r.TemplateId == template.Id))
                        {
                            round.TemplateId = insertedTemplate.Id;
                        }
                    }
                }
                catch (Exception templateEx)
                {
                    Console.WriteLine($"Failed to insert template {template.Name}: {templateEx.Message}");
                }
            }

            // Insert rounds one by one, only for successfully inserted templates
            var insertedRoundsCount = 0;
            foreach (var round in copiedRounds)
            {
                try
                {
                    if (!insertedTemplateIds.Contains(round.TemplateId))
                    {
                        continue;
                    }

                    await client.From<InterviewRound>().Insert(round);
                    insertedRoundsCount++;
                }
                catch (Exception roundEx)
                {
                    Console.WriteLine($"Failed to insert round {round.Name}: {roundEx.Message}");
                }
            }

            return Results.Ok(new
            {
                message = "Standard templates copied successfully",
                templatesCreated = insertedTemplateIds.Count,
                roundsCreated = insertedRoundsCount,
                templates = copiedTemplates
                    .Where(t => insertedTemplateIds.Contains(t.Id))
                    .Select(t => new
                    {
                        id = t.Id,
                        name = t.Name,
                        isDefault = t.IsDefault
                    })
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error copying standard templates: {ex.Message}");

            // Don't fail the registration process, just log the error
            return Results.Ok(new
            {
                message = "Template copying failed, but company registration was successful",
                error = ex.Message,
                templatesCreated = 0
            });
        }
    }

    // Public endpoints for applicants
    private static async Task<IResult> GetPublicCompanies(string? industry, Supabase.Client client)
    {
        try
        {
            Console.WriteLine("🌍 Public companies endpoint called - no authentication required");

            // Get all companies
            var response = await client.From<Company>().Get();
            var companies = response.Models;

            // For public endpoint, only show verified companies
            // companies = companies.Where(c => c.IsVerified).ToList();

            // Apply industry filter if provided
            if (!string.IsNullOrEmpty(industry))
            {
                companies = companies.Where(c => c.Industry != null &&
                    c.Industry.Equals(industry, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            Console.WriteLine($"🌍 Found {companies.Count} public companies");

            // Get job counts for each company
            var jobsResponse = await client.From<Job>().Get();
            var openJobs = jobsResponse.Models.Where(j => j.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)).ToList();

            // Create DTOs with job counts
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
                CreatedAt = company.CreatedAt,
                JobCount = openJobs.Count(j => j.CompanyId == company.Id)
            }).OrderByDescending(c => c.JobCount).ThenBy(c => c.Name).ToList();

            return Results.Ok(companyDtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving public companies: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetPublicCompanyById(Guid id, Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"🌍 Public company by ID endpoint called for company: {id}");

            // Get company by ID
            var response = await client.From<Company>().Get();
            var company = response.Models.FirstOrDefault(c => c.Id == id);

            if (company == null)
            {
                return Results.NotFound(new { message = $"Company with ID {id} not found" });
            }

            // For public endpoint, allow access to all companies (no verification required)
            // if (!company.IsVerified)
            // {
            //     return Results.NotFound(new { message = $"Company with ID {id} is not available for public viewing" });
            // }

            Console.WriteLine($"🌍 Found public company: {company.Name}");

            // Get open jobs for this company
            var jobsResponse = await client.From<Job>().Get();
            var openJobs = jobsResponse.Models
                .Where(j => j.CompanyId == company.Id && j.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(j => j.PostedDate)
                .ToList();

            // Create job DTOs
            var jobDtos = openJobs.Select(job => new
            {
                Id = job.Id,
                Title = job.Title,
                Description = job.Description,
                Department = job.Department,
                EmploymentType = job.EmploymentType,
                LocationType = job.LocationType,
                Locations = job.Locations,
                SalaryMin = job.SalaryMin,
                SalaryMax = job.SalaryMax,
                SalaryCurrency = job.SalaryCurrency,
                Status = job.Status,
                ApplicantCount = job.ApplicantCount,
                PostedDate = job.PostedDate,
                ApplicationDeadline = job.ApplicationDeadline,
                SeniorityLevel = job.SeniorityLevel,
                ExperienceYearsMin = job.ExperienceYearsMin
            }).ToList();

            // Create complete company DTO with jobs
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
                CreatedAt = company.CreatedAt,
                Jobs = jobDtos,
                JobCount = jobDtos.Count
            };

            return Results.Ok(companyDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving public company: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }
}
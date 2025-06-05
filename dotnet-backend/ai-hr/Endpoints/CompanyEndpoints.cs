using ai_hr.Models;
using ai_hr.Contracts;
using Supabase;

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
}
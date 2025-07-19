using ai_hr.Models;
using ai_hr.Contracts;
using Supabase;

namespace ai_hr.Endpoints;

public static class HiringUserProfileEndpoints
{
    public static void MapHiringUserProfileEndpoints(this WebApplication app)
    {
        app.MapPost("/hiring-user-profiles", CreateHiringUserProfile)
            .WithTags("Hiring User Profiles")
            .WithName("CreateHiringUserProfile")
            .WithSummary("Create hiring user profile")
            .WithDescription("Creates a new profile for a recruiter, hiring manager, or other HR professional");

        app.MapGet("/hiring-user-profiles/{id}", GetHiringUserProfileById)
            .WithTags("Hiring User Profiles")
            .WithName("GetHiringUserProfileById")
            .WithSummary("Get hiring user profile by ID")
            .WithDescription("Retrieves details of a specific hiring user profile by its unique identifier");

        app.MapGet("/hiring-user-profiles/filter", FilterHiringUserProfiles)
            .WithTags("Hiring User Profiles")
            .WithName("FilterHiringUserProfiles")
            .WithSummary("Filter hiring user profiles")
            .WithDescription("Retrieves hiring user profiles with optional filtering by user type and company");

        app.MapPut("/hiring-user-profiles/{id}", UpdateHiringUserProfile)
            .WithTags("Hiring User Profiles")
            .WithName("UpdateHiringUserProfile")
            .WithSummary("Update hiring user profile")
            .WithDescription("Updates an existing hiring user profile's details and preferences")
            .RequireAuthorization();

        app.MapDelete("/hiring-user-profiles/{id}", DeleteHiringUserProfile)
            .WithTags("Hiring User Profiles")
            .WithName("DeleteHiringUserProfile")
            .WithSummary("Delete hiring user profile")
            .WithDescription("Permanently removes a hiring user profile from the system");

        app.MapGet("/hiring-user-profiles/{id}/role-info", GetUserRoleInfo)
            .WithTags("Hiring User Profiles")
            .WithName("GetUserRoleInfo")
            .WithSummary("Get user role information")
            .WithDescription("Returns role and company ownership information for a hiring user");
    }

    // Helper method to verify if a user is a company admin
    private static async Task<bool> IsCompanyAdmin(Guid userId, Guid companyId, Supabase.Client client)
    {
        try
        {
            var userResponse = await client.From<HiringUserProfile>().Get();
            var user = userResponse.Models.FirstOrDefault(u => u.Id == userId);

            if (user == null || user.Roles != "Admin" || user.CompanyId != companyId)
            {
                return false;
            }

            // Double-check by verifying the user is the company creator
            var companyResponse = await client.From<Company>().Get();
            var company = companyResponse.Models.FirstOrDefault(c => c.Id == companyId);

            return company != null && company.CreatedBy == userId;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking admin status: {ex.Message}");
            return false;
        }
    }

    private static async Task<IResult> CreateHiringUserProfile(CreateHiringUserProfileRequest request, Supabase.Client client)
    {
        try
        {
            // SECURITY: Prevent manual Admin role assignment
            // Admin roles are automatically assigned during registration for company creators
            // This endpoint should not be used to create profiles with Admin privileges

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
                CreatedAt = DateTime.UtcNow,
                // Force HiringUser role for manual profile creation
                // Admin role can only be assigned during registration flow
                Roles = "HiringUser"
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
    }

    private static async Task<IResult> GetHiringUserProfileById(Guid id, Supabase.Client client)
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
                CreatedAt = profile.CreatedAt,
                IsActive = profile.IsActive,
                Roles = profile.Roles
            };

            return Results.Ok(profileDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving hiring user profile: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> FilterHiringUserProfiles(string? roles, Guid? companyId, Supabase.Client client)
    {

        Console.WriteLine($"[DEBUG] FilterHiringUserProfiles called with roles='{roles}', companyId={companyId}");
        try
        {
            var response = await client.From<HiringUserProfile>().Get();
            var profiles = response.Models;

            // Apply filters if provided
            if (!string.IsNullOrEmpty(roles))
            {
                profiles = profiles.Where(p => p.Roles == roles).ToList();
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
                CreatedAt = profile.CreatedAt,
                IsActive = profile.IsActive,
                Roles = profile.Roles
            }).ToList();

            return Results.Ok(profileDtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving hiring user profiles: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> UpdateHiringUserProfile(Guid id, UpdateHiringUserProfileRequest request, Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"[DEBUG] UpdateHiringUserProfile called for ID: {id}");
            Console.WriteLine($"[DEBUG] Request data: FirstName={request.FirstName}, LastName={request.LastName}, Email={request.Email}");
            Console.WriteLine($"[DEBUG] LinkedinUrl={request.LinkedinUrl}, Bio={request.Bio}");

            Console.WriteLine($"[DEBUG] Fetching profile from database...");
            var getResponse = await client.From<HiringUserProfile>().Get();
            var profile = getResponse.Models.FirstOrDefault(p => p.Id == id);

            if (profile == null)
            {
                Console.WriteLine($"[DEBUG] Profile not found for ID: {id}");
                return Results.NotFound(new { message = $"Hiring user profile with ID {id} not found" });
            }

            Console.WriteLine($"[DEBUG] Profile found: {profile.Email} with role: {profile.Roles}");
            Console.WriteLine($"[DEBUG] Updating profile properties...");

            // SECURITY: Preserve role assignments and prevent unauthorized changes
            // Admin roles can only be assigned during company creation registration
            // Once assigned, roles should not be changed through this endpoint
            var originalRole = profile.Roles;

            // Update properties if provided in the request
            if (request.FirstName != null) profile.FirstName = request.FirstName;
            if (request.LastName != null) profile.LastName = request.LastName;
            if (request.Email != null) profile.Email = request.Email;
            if (request.UserType != null) profile.UserType = request.UserType;

            // SECURITY: Only allow company changes for non-Admin users
            // Admins are tied to their company and shouldn't be moved
            if (request.CompanyId.HasValue)
            {
                if (profile.Roles == "Admin")
                {
                    Console.WriteLine($"[DEBUG] Warning: Attempted to change company for Admin user {profile.Email}, ignoring request");
                    // Don't change company for Admin users
                }
                else
                {
                    profile.CompanyId = request.CompanyId;
                }
            }

            if (request.Bio != null) profile.Bio = request.Bio;
            if (request.LinkedinUrl != null) profile.LinkedinUrl = request.LinkedinUrl;
            if (request.Location != null) profile.Location = request.Location;
            if (request.Preferences != null) profile.Preferences = request.Preferences;

            // SECURITY: Ensure role is preserved
            profile.Roles = originalRole;

            Console.WriteLine($"[DEBUG] Calling Supabase update...");
            var response = await client.From<HiringUserProfile>().Update(profile);

            Console.WriteLine($"[DEBUG] Update successful for user with role: {profile.Roles}");
            return Results.Ok(new
            {
                message = "Profile updated successfully",
                id = id,
                role = profile.Roles,
                updatedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Error updating hiring user profile: {ex.Message}");
            Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> DeleteHiringUserProfile(Guid id, Supabase.Client client)
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
    }

    private static async Task<IResult> GetUserRoleInfo(Guid id, Supabase.Client client)
    {
        try
        {
            var response = await client.From<HiringUserProfile>().Get();
            var profile = response.Models.FirstOrDefault(p => p.Id == id);

            if (profile == null)
            {
                return Results.NotFound(new { message = $"Hiring user profile with ID {id} not found" });
            }

            // Get company information if user has a company
            object companyInfo = null;
            if (profile.CompanyId.HasValue)
            {
                var companyResponse = await client.From<Company>().Get();
                var company = companyResponse.Models.FirstOrDefault(c => c.Id == profile.CompanyId.Value);

                if (company != null)
                {
                    companyInfo = new
                    {
                        Id = company.Id,
                        Name = company.Name,
                        IsCreator = company.CreatedBy == profile.Id,
                        CreatedAt = company.CreatedAt
                    };
                }
            }

            var roleInfo = new
            {
                UserId = profile.Id,
                Email = profile.Email,
                FirstName = profile.FirstName,
                LastName = profile.LastName,
                Role = profile.Roles,
                UserType = profile.UserType,
                CompanyId = profile.CompanyId,
                Company = companyInfo,
                IsAdmin = profile.Roles == "Admin",
                CreatedAt = profile.CreatedAt
            };

            return Results.Ok(roleInfo);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving role info: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }
}
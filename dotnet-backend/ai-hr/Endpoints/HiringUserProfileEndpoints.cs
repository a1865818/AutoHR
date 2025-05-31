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
    }

    private static async Task<IResult> CreateHiringUserProfile(CreateHiringUserProfileRequest request, Supabase.Client client)
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
    }

    private static async Task<IResult> FilterHiringUserProfiles(string userType, Guid? companyId, Supabase.Client client)
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

            Console.WriteLine($"[DEBUG] Profile found: {profile.Email}");
            Console.WriteLine($"[DEBUG] Updating profile properties...");

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

            Console.WriteLine($"[DEBUG] Calling Supabase update...");
            var response = await client.From<HiringUserProfile>().Update(profile);

            Console.WriteLine($"[DEBUG] Update successful");
            return Results.Ok(new
            {
                message = "Profile updated successfully",
                id = id,
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
}
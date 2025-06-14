using ai_hr.Models;
using ai_hr.Contracts;
using Supabase;

namespace ai_hr.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        app.MapPost("/users/create", CreateUser)
            .WithTags("Users")
            .WithName("CreateUser")
            .WithSummary("Create a new user")
            .WithDescription("Creates a new user account with email, password, and personal details");

        app.MapGet("/users/{id}", GetUserById)
            .WithTags("Users")
            .WithName("GetUserById")
            .WithSummary("Get user by ID")
            .WithDescription("Retrieves a specific user by their unique identifier");

        app.MapDelete("/users/{id}", DeleteUser)
            .WithTags("Users")
            .WithName("DeleteUser")
            .WithSummary("Delete user")
            .WithDescription("Permanently removes a user from the system");
    }

    private static async Task<IResult> CreateUser(CreateUserRequest request, Supabase.Client client)
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
                CreatedAt = DateTime.UtcNow.AddHours(7),
                IsActive = true,
                Roles = "User",
                // Initialize optional fields with default values
                ResumeList = new List<Dictionary<string, object>>(),
                Education = new List<Dictionary<string, object>>(),
                Experiences = new List<Dictionary<string, object>>(),
                SocialLink = new Dictionary<string, object>(),
                Location = new Dictionary<string, object>()
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
    }

    private static async Task<IResult> GetUserById(string id, Supabase.Client client)
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
    }

    private static async Task<IResult> DeleteUser(string id, Supabase.Client client)
    {
        await client.From<ApplicationUser>().Where(n => n.Id == id).Delete();
        return Results.NoContent();
    }
}
using ai_hr.Contracts;
using ai_hr.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ai_hr.Endpoints
{
    public static class AuthenticationEndpoints
    {
        public static void MapAuthenticationEndpoints(this WebApplication app)
        {
            var authGroup = app.MapGroup("/auth").WithTags("ApplicationUser Authentication");

            // POST /auth/login
            authGroup.MapPost("/login", async (LoginRequest request, IAuthenticationService authService) =>
            {
                try
                {
                    var result = await authService.LoginAsync(request);
                    if (result == null)
                    {
                        return Results.Unauthorized();
                    }

                    return Results.Ok(result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Login endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Login failed" });
                }
            })
            .WithName("Login")
            .WithSummary("ApplicationUser login")
            .WithDescription("Authenticate application user and return JWT tokens");

            // POST /auth/register
            authGroup.MapPost("/register", async (RegisterRequest request, IAuthenticationService authService) =>
            {
                try
                {
                    var result = await authService.RegisterAsync(request);
                    if (result == null)
                    {
                        return Results.BadRequest(new { error = "Registration failed. Email may already exist." });
                    }

                    return Results.Created($"/auth/me", result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Register endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Registration failed" });
                }
            })
            .WithName("Register")
            .WithSummary("ApplicationUser registration")
            .WithDescription("Register a new application user account and return JWT tokens");

            // POST /auth/refresh
            authGroup.MapPost("/refresh", async (RefreshTokenRequest request, IAuthenticationService authService) =>
            {
                try
                {
                    var result = await authService.RefreshTokenAsync(request);
                    if (result == null)
                    {
                        return Results.Unauthorized();
                    }

                    return Results.Ok(result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Refresh token endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Token refresh failed" });
                }
            })
            .WithName("RefreshToken")
            .WithSummary("Refresh ApplicationUser access token")
            .WithDescription("Get new access token using refresh token for application users");

            // POST /auth/logout
            authGroup.MapPost("/logout", async (ClaimsPrincipal user, IAuthenticationService authService) =>
            {
                try
                {
                    Console.WriteLine("[DEBUG] ApplicationUser logout endpoint called");
                    Console.WriteLine($"[DEBUG] User authenticated: {user.Identity?.IsAuthenticated}");
                    Console.WriteLine($"[DEBUG] User claims count: {user.Claims.Count()}");

                    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var userCategory = user.FindFirst("userCategory")?.Value;

                    Console.WriteLine($"[DEBUG] UserId from token: {userId ?? "NULL"}");
                    Console.WriteLine($"[DEBUG] UserCategory from token: {userCategory ?? "NULL"}");

                    if (string.IsNullOrEmpty(userId))
                    {
                        Console.WriteLine("[DEBUG] ApplicationUser logout failed: Invalid user - no userId in claims");
                        return Results.BadRequest(new { error = "Invalid user" });
                    }

                    if (userCategory != "ApplicationUser")
                    {
                        Console.WriteLine($"[DEBUG] ApplicationUser logout failed: Invalid user type - expected 'ApplicationUser', got '{userCategory}'");
                        return Results.BadRequest(new { error = "Invalid user type for this endpoint" });
                    }

                    Console.WriteLine("[DEBUG] Calling ApplicationUser authService.LogoutAsync...");
                    var result = await authService.LogoutAsync(userId);

                    if (!result)
                    {
                        Console.WriteLine("[DEBUG] ApplicationUser LogoutAsync returned false");
                        return Results.BadRequest(new { error = "Logout failed" });
                    }

                    Console.WriteLine("[DEBUG] ApplicationUser logout successful");
                    return Results.Ok(new { message = "Logged out successfully" });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Logout endpoint error: {ex.Message}");
                    Console.WriteLine($"[DEBUG] ApplicationUser full logout exception: {ex}");
                    return Results.BadRequest(new { error = "Logout failed" });
                }
            })
            .RequireAuthorization()
            .WithName("Logout")
            .WithSummary("ApplicationUser logout")
            .WithDescription("Logout application user and invalidate refresh token");

            // GET /auth/me
            authGroup.MapGet("/me", async (ClaimsPrincipal user, Supabase.Client client) =>
            {
                try
                {
                    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var userCategory = user.FindFirst("userCategory")?.Value;

                    if (string.IsNullOrEmpty(userId))
                    {
                        return Results.Unauthorized();
                    }

                    if (userCategory != "ApplicationUser")
                    {
                        return Results.BadRequest(new { error = "Invalid user type for this endpoint" });
                    }

                    var response = await client.From<ai_hr.Models.ApplicationUser>()
                        .Where(u => u.Id == userId && u.IsActive == true)
                        .Get();

                    var appUser = response.Models.FirstOrDefault();
                    if (appUser == null)
                    {
                        return Results.NotFound();
                    }

                    var userInfo = new
                    {
                        Id = appUser.Id,
                        Email = appUser.Email,
                        FirstName = appUser.FirstName,
                        LastName = appUser.LastName,
                        Roles = appUser.Roles,
                        IsActive = appUser.IsActive,
                        CreatedAt = appUser.CreatedAt,
                        UserCategory = "ApplicationUser",
                        Education = appUser.Education,
                        Experiences = appUser.Experiences,
                        SocialLink = appUser.SocialLink,
                        PhoneNumber = appUser.PhoneNumber,
                        Location = appUser.Location,
                        ResumeList = appUser.ResumeList
                    };

                    return Results.Ok(userInfo);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Get current user endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Failed to get user info" });
                }
            })
            .RequireAuthorization()
            .WithName("GetCurrentUser")
            .WithSummary("Get current ApplicationUser")
            .WithDescription("Get current authenticated application user information");

            // PUT /auth/profile
            authGroup.MapPut("/profile", async (UpdateApplicationUserProfileRequest request, ClaimsPrincipal user, Supabase.Client client) =>
            {
                try
                {
                    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var userCategory = user.FindFirst("userCategory")?.Value;

                    if (string.IsNullOrEmpty(userId))
                    {
                        return Results.Unauthorized();
                    }

                    if (userCategory != "ApplicationUser")
                    {
                        return Results.BadRequest(new { error = "Invalid user type for this endpoint" });
                    }

                    Console.WriteLine($"[DEBUG] Updating ApplicationUser profile for userId: {userId}");

                    // Get the current user
                    var response = await client.From<ai_hr.Models.ApplicationUser>()
                        .Where(u => u.Id == userId && u.IsActive == true)
                        .Get();

                    var appUser = response.Models.FirstOrDefault();
                    if (appUser == null)
                    {
                        return Results.NotFound(new { message = "User not found" });
                    }

                    // Update the profile fields
                    if (request.Education != null)
                    {
                        Console.WriteLine($"[DEBUG] Processing Education update with {request.Education.Count} items");
                        // Convert JsonElement to proper Dictionary for storage
                        appUser.Education = request.Education.Select(item =>
                        {
                            var dict = JsonElementToDictionary(item);
                            Console.WriteLine($"[DEBUG] Education item converted: {string.Join(", ", dict.Select(kvp => $"{kvp.Key}={kvp.Value}"))}");
                            return dict;
                        }).ToList();
                        Console.WriteLine($"[DEBUG] Education field updated with {appUser.Education.Count} items");
                    }

                    if (request.Experience != null)
                    {
                        Console.WriteLine($"[DEBUG] Processing Experience update with {request.Experience.Count} items");
                        // Convert JsonElement to proper Dictionary for storage
                        appUser.Experiences = request.Experience.Select(item =>
                        {
                            var dict = JsonElementToDictionary(item);
                            Console.WriteLine($"[DEBUG] Experience item converted: {string.Join(", ", dict.Select(kvp => $"{kvp.Key}={kvp.Value}"))}");
                            return dict;
                        }).ToList();
                        Console.WriteLine($"[DEBUG] Experiences field updated with {appUser.Experiences.Count} items");
                    }

                    if (request.SocialLink != null)
                    {
                        // Convert JsonElement to proper Dictionary for storage
                        appUser.SocialLink = JsonElementToDictionary(request.SocialLink.Value);
                    }

                    if (request.PhoneNumber != null) appUser.PhoneNumber = request.PhoneNumber;

                    if (request.Location != null)
                    {
                        Console.WriteLine($"[DEBUG] Processing Location update");
                        // Convert JsonElement to proper Dictionary for storage
                        appUser.Location = JsonElementToDictionary(request.Location.Value);
                        Console.WriteLine($"[DEBUG] Location field updated");
                    }

                    if (request.ResumeList != null)
                    {
                        Console.WriteLine($"[DEBUG] Processing ResumeList update with {request.ResumeList.Count} items");
                        // Convert JsonElement to proper Dictionary for storage
                        appUser.ResumeList = request.ResumeList.Select(item =>
                        {
                            var dict = JsonElementToDictionary(item);
                            Console.WriteLine($"[DEBUG] Resume item converted: {string.Join(", ", dict.Select(kvp => $"{kvp.Key}={kvp.Value}"))}");
                            return dict;
                        }).ToList();
                        Console.WriteLine($"[DEBUG] ResumeList field updated with {appUser.ResumeList.Count} items");
                    }

                    Console.WriteLine($"[DEBUG] Updating user with Education count: {appUser.Education?.Count ?? 0}, Experience count: {appUser.Experiences?.Count ?? 0}, Resume count: {appUser.ResumeList?.Count ?? 0}");

                    // Update the user in the database
                    var updateResponse = await client.From<ai_hr.Models.ApplicationUser>().Update(appUser);

                    Console.WriteLine("[DEBUG] ApplicationUser profile updated successfully");

                    return Results.Ok(new { message = "Profile updated successfully" });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Update ApplicationUser profile error: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return Results.BadRequest(new { error = "Failed to update profile", details = ex.Message });
                }
            })
            .RequireAuthorization()
            .WithName("UpdateApplicationUserProfile")
            .WithSummary("Update ApplicationUser profile")
            .WithDescription("Update education, experience, and social links for the current application user");
        }

        // Helper method to convert JsonElement to Dictionary
        private static Dictionary<string, object> JsonElementToDictionary(System.Text.Json.JsonElement element)
        {
            var dict = new Dictionary<string, object>();

            if (element.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                foreach (var property in element.EnumerateObject())
                {
                    dict[property.Name] = JsonElementToObject(property.Value);
                }
            }

            return dict;
        }

        // Helper method to convert JsonElement to proper object
        private static object JsonElementToObject(System.Text.Json.JsonElement element)
        {
            switch (element.ValueKind)
            {
                case System.Text.Json.JsonValueKind.String:
                    return element.GetString() ?? "";
                case System.Text.Json.JsonValueKind.Number:
                    if (element.TryGetInt32(out int intValue))
                        return intValue;
                    if (element.TryGetDouble(out double doubleValue))
                        return doubleValue;
                    return element.GetDecimal();
                case System.Text.Json.JsonValueKind.True:
                    return true;
                case System.Text.Json.JsonValueKind.False:
                    return false;
                case System.Text.Json.JsonValueKind.Null:
                    return null;
                case System.Text.Json.JsonValueKind.Object:
                    var dict = new Dictionary<string, object>();
                    foreach (var property in element.EnumerateObject())
                    {
                        dict[property.Name] = JsonElementToObject(property.Value);
                    }
                    return dict;
                case System.Text.Json.JsonValueKind.Array:
                    return element.EnumerateArray().Select(JsonElementToObject).ToList();
                default:
                    return element.ToString();
            }
        }
    }
}
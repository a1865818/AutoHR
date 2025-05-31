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
                        UserCategory = "ApplicationUser"
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
        }
    }
}
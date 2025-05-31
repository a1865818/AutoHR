using ai_hr.Contracts;
using ai_hr.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ai_hr.Endpoints
{
    public static class HiringUserProfileAuthenticationEndpoints
    {
        public static void MapHiringUserProfileAuthenticationEndpoints(this WebApplication app)
        {
            var authGroup = app.MapGroup("/hiring-auth").WithTags("HiringUserProfile Authentication");

            // POST /hiring-auth/login
            authGroup.MapPost("/login", async (LoginRequest request, IHiringUserProfileAuthenticationService authService) =>
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
                    Console.WriteLine($"HiringUserProfile login endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Login failed" });
                }
            })
            .WithName("HiringUserProfileLogin")
            .WithSummary("HiringUserProfile login")
            .WithDescription("Authenticate hiring user (recruiter, hiring manager, admin, candidate) and return JWT tokens");

            // POST /hiring-auth/register
            authGroup.MapPost("/register", async (UnifiedRegisterRequest request, IHiringUserProfileAuthenticationService authService) =>
            {
                try
                {
                    // Ensure UserCategory is set correctly
                    request.UserCategory = "HiringUserProfile";

                    var result = await authService.RegisterAsync(request);
                    if (result == null)
                    {
                        return Results.BadRequest(new { error = "Registration failed. Email may already exist or invalid user type." });
                    }

                    return Results.Created($"/hiring-auth/me", result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"HiringUserProfile register endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Registration failed" });
                }
            })
            .WithName("HiringUserProfileRegister")
            .WithSummary("HiringUserProfile registration")
            .WithDescription("Register a new hiring user account (recruiter, hiring manager, admin, candidate) and return JWT tokens");

            // POST /hiring-auth/refresh
            authGroup.MapPost("/refresh", async (RefreshTokenRequest request, IHiringUserProfileAuthenticationService authService) =>
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
                    Console.WriteLine($"HiringUserProfile refresh token endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Token refresh failed" });
                }
            })
            .WithName("HiringUserProfileRefreshToken")
            .WithSummary("Refresh HiringUserProfile access token")
            .WithDescription("Get new access token using refresh token for hiring users");

            // POST /hiring-auth/logout
            authGroup.MapPost("/logout", async (ClaimsPrincipal user, IHiringUserProfileAuthenticationService authService) =>
            {
                try
                {
                    Console.WriteLine("[DEBUG] Logout endpoint called");
                    Console.WriteLine($"[DEBUG] User authenticated: {user.Identity?.IsAuthenticated}");
                    Console.WriteLine($"[DEBUG] User claims count: {user.Claims.Count()}");

                    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var userCategory = user.FindFirst("userCategory")?.Value;

                    Console.WriteLine($"[DEBUG] UserId from token: {userId ?? "NULL"}");
                    Console.WriteLine($"[DEBUG] UserCategory from token: {userCategory ?? "NULL"}");

                    if (string.IsNullOrEmpty(userId))
                    {
                        Console.WriteLine("[DEBUG] Logout failed: Invalid user - no userId in claims");
                        return Results.BadRequest(new { error = "Invalid user" });
                    }

                    if (userCategory != "HiringUserProfile")
                    {
                        Console.WriteLine($"[DEBUG] Logout failed: Invalid user type - expected 'HiringUserProfile', got '{userCategory}'");
                        return Results.BadRequest(new { error = "Invalid user type for this endpoint" });
                    }

                    Console.WriteLine("[DEBUG] Calling authService.LogoutAsync...");
                    var result = await authService.LogoutAsync(userId);

                    if (!result)
                    {
                        Console.WriteLine("[DEBUG] LogoutAsync returned false");
                        return Results.BadRequest(new { error = "Logout failed" });
                    }

                    Console.WriteLine("[DEBUG] Logout successful");
                    return Results.Ok(new { message = "Logged out successfully" });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Logout endpoint error: {ex.Message}");
                    Console.WriteLine($"[DEBUG] Full logout exception: {ex}");
                    return Results.BadRequest(new { error = "Logout failed" });
                }
            })
            .RequireAuthorization()
            .WithName("HiringUserProfileLogout")
            .WithSummary("HiringUserProfile logout")
            .WithDescription("Logout hiring user and invalidate refresh token");

            // GET /hiring-auth/me
            authGroup.MapGet("/me", async (ClaimsPrincipal user, Supabase.Client client) =>
            {
                try
                {
                    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var userCategory = user.FindFirst("userCategory")?.Value;

                    Console.WriteLine($"[DEBUG] Get /me endpoint - UserID: {userId}, Category: {userCategory}");

                    if (string.IsNullOrEmpty(userId))
                    {
                        Console.WriteLine("[DEBUG] Get /me endpoint - No userId found in claims");
                        return Results.Unauthorized();
                    }

                    if (userCategory != "HiringUserProfile")
                    {
                        Console.WriteLine($"[DEBUG] Get /me endpoint - Invalid user category: {userCategory}");
                        return Results.BadRequest(new { error = "Invalid user type for this endpoint" });
                    }

                    // Parse userId and add validation
                    if (!Guid.TryParse(userId, out var userGuid))
                    {
                        Console.WriteLine($"[DEBUG] Get /me endpoint - Invalid userId format: {userId}");
                        return Results.BadRequest(new { error = "Invalid user ID format" });
                    }

                    Console.WriteLine($"[DEBUG] Get /me endpoint - Querying database for user: {userGuid}");

                    // Simplify the query to avoid Supabase BaseModel issues
                    var response = await client.From<ai_hr.Models.HiringUserProfile>()
                        .Where(u => u.Id == userGuid)
                        .Get();

                    Console.WriteLine($"[DEBUG] Get /me endpoint - Query completed, found {response.Models?.Count ?? 0} records");

                    var hiringUser = response.Models?.FirstOrDefault();
                    if (hiringUser == null)
                    {
                        Console.WriteLine("[DEBUG] Get /me endpoint - No user found in database");
                        return Results.NotFound(new { error = "User not found" });
                    }

                    // Check if user is active
                    if (!hiringUser.IsActive)
                    {
                        return Results.BadRequest(new { error = "User account is inactive" });
                    }

                    Console.WriteLine($"[DEBUG] Get /me endpoint - Successfully found user: {hiringUser.LinkedinUrl}");
                    var userInfo = new
                    {
                        Id = hiringUser.Id,
                        Email = hiringUser.Email,
                        FirstName = hiringUser.FirstName,
                        LastName = hiringUser.LastName,
                        Roles = hiringUser.Roles,
                        IsActive = hiringUser.IsActive,
                        CreatedAt = hiringUser.CreatedAt,
                        UserCategory = "HiringUserProfile",
                        UserType = hiringUser.UserType,
                        CompanyId = hiringUser.CompanyId,
                        Bio = hiringUser.Bio,
                        LinkedinUrl = hiringUser.LinkedinUrl,
                        Location = hiringUser.Location,
                        Preferences = hiringUser.Preferences
                    };

                    return Results.Ok(userInfo);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DEBUG] Get current HiringUserProfile endpoint error: {ex.Message}");
                    Console.WriteLine($"[DEBUG] Exception details: {ex}");
                    return Results.BadRequest(new { error = "Failed to get user info", details = ex.Message });
                }
            })
            .RequireAuthorization()
            .WithName("GetCurrentHiringUserProfile")
            .WithSummary("Get current HiringUserProfile")
            .WithDescription("Get current authenticated hiring user information");
        }
    }
}
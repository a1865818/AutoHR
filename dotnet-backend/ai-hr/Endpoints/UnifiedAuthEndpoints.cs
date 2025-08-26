using ai_hr.Contracts;
using ai_hr.Services;
using ai_hr.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;

namespace ai_hr.Endpoints
{
    public static class UnifiedAuthEndpoints
    {
        public static void MapUnifiedAuthEndpoints(this WebApplication app)
        {
            var authGroup = app.MapGroup("/auth").WithTags("Unified Authentication");

            // POST /auth/login - Works for both ApplicationUser and HiringUser
            authGroup.MapPost("/login", async (LoginRequest request, IUnifiedAuthService authService) =>
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
                    Console.WriteLine($"Unified login endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Login failed" });
                }
            })
            .WithName("UnifiedLogin")
            .WithSummary("User login (both types)")
            .WithDescription("Authenticate user (ApplicationUser or HiringUser) and return Supabase tokens. User type is automatically detected.");

            // POST /auth/register - Creates ApplicationUser by default
            authGroup.MapPost("/register", async (RegisterRequest request, IUnifiedAuthService authService) =>
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
                    Console.WriteLine($"Unified register endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Registration failed" });
                }
            })
            .WithName("UnifiedRegister")
            .WithSummary("Register ApplicationUser")
            .WithDescription("Register a new ApplicationUser account using Supabase Auth");

            // POST /auth/register-hiring - Creates HiringUser specifically
            authGroup.MapPost("/register-hiring", async (RegisterHiringUserRequest request, IUnifiedAuthService authService) =>
            {
                try
                {
                    var result = await authService.RegisterHiringUserAsync(request);
                    if (result == null)
                    {
                        return Results.BadRequest(new { error = "Hiring user registration failed. Email may already exist." });
                    }

                    return Results.Created($"/auth/me", result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Unified hiring register endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Hiring user registration failed" });
                }
            })
            .WithName("UnifiedRegisterHiring")
            .WithSummary("Register HiringUser")
            .WithDescription("Register a new HiringUser account using Supabase Auth");

            // POST /auth/refresh - Works for both user types
            authGroup.MapPost("/refresh", async (RefreshTokenRequest request, IUnifiedAuthService authService) =>
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
                    Console.WriteLine($"Unified refresh token endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Token refresh failed" });
                }
            })
            .WithName("UnifiedRefreshToken")
            .WithSummary("Refresh user token")
            .WithDescription("Get new access token using refresh token for both user types");

            // POST /auth/forgot-password - Works for both user types
            authGroup.MapPost("/forgot-password", async (ForgotPasswordRequest request, IUnifiedAuthService authService) =>
            {
                try
                {
                    var result = await authService.ForgotPasswordAsync(request.Email);
                    if (!result)
                    {
                        return Results.BadRequest(new { error = "Failed to send password reset email" });
                    }

                    return Results.Ok(new { message = "Password reset email sent successfully" });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Unified forgot password endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Failed to send password reset email" });
                }
            })
            .WithName("UnifiedForgotPassword")
            .WithSummary("Send password reset email")
            .WithDescription("Send password reset email to user (works for both user types)");

            // POST /auth/logout - Works for both user types
            authGroup.MapPost("/logout", async (ClaimsPrincipal user, IUnifiedAuthService authService, ILogger logger) =>
            {
                try
                {
                    // Try multiple ways to get the user ID, similar to /me endpoint
                    var userId = user.FindFirst("sub")?.Value ?? 
                                user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                                user.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ??
                                user.Identity?.Name;
                                
                    logger.LogInformation("🔍 /auth/logout endpoint - Extracted user ID: {UserId}", userId);
                                
                    if (string.IsNullOrEmpty(userId))
                    {
                        logger.LogWarning("🔍 /auth/logout endpoint - No user ID found in claims");
                        return Results.Unauthorized();
                    }

                    var result = await authService.LogoutAsync(userId);
                    if (!result)
                    {
                        logger.LogWarning("🔍 /auth/logout endpoint - Logout failed for user: {UserId}", userId);
                        return Results.BadRequest(new { error = "Logout failed" });
                    }

                    logger.LogInformation("🔍 /auth/logout endpoint - Successfully logged out user: {UserId}", userId);
                    return Results.Ok(new { message = "Logged out successfully" });
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "🔍 /auth/logout endpoint - Error during logout");
                    return Results.BadRequest(new { error = "Logout failed" });
                }
            })
            .RequireAuthorization()
            .WithName("UnifiedLogout")
            .WithSummary("User logout")
            .WithDescription("Logout user and invalidate Supabase session (works for both user types)");

            // GET /auth/me - Returns user data based on token type
            authGroup.MapGet("/me", async (ClaimsPrincipal user, IUnifiedAuthService authService, ILogger logger) =>
            {
                try
                {
                    // Log all available claims for debugging
                    logger.LogDebug("🔍 /auth/me endpoint - Available claims: {Claims}", 
                        string.Join(", ", user.Claims.Select(c => $"{c.Type}={c.Value}")));

                    // Try multiple ways to get the Supabase user ID
                    var supabaseUserId = user.FindFirst("sub")?.Value ?? 
                                        user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                                        user.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ??
                                        user.Identity?.Name;
                    
                    logger.LogInformation("🔍 /auth/me endpoint - Extracted user ID: {UserId}, Identity.Name: {IdentityName}, IsAuthenticated: {IsAuthenticated}", 
                        supabaseUserId, user.Identity?.Name, user.Identity?.IsAuthenticated);
                    
                    if (string.IsNullOrEmpty(supabaseUserId))
                    {
                        logger.LogWarning("🔍 /auth/me endpoint - No user ID found in claims");
                        return Results.Unauthorized();
                    }

                    var userInfo = await authService.GetCurrentUserAsync(supabaseUserId);
                    if (userInfo == null)
                    {
                        logger.LogWarning("🔍 /auth/me endpoint - User not found for ID: {UserId}", supabaseUserId);
                        return Results.NotFound(new { message = "User profile not found" });
                    }

                    logger.LogInformation("🔍 /auth/me endpoint - Successfully retrieved user info for: {UserId}", supabaseUserId);
                    return Results.Ok(userInfo);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "🔍 /auth/me endpoint - Error getting user info");
                    return Results.BadRequest(new { error = "Failed to get user info" });
                }
            })
            .RequireAuthorization()
            .WithName("UnifiedGetCurrentUser")
            .WithSummary("Get current authenticated user")
            .WithDescription("Get current authenticated user information (ApplicationUser or HiringUser based on token)");

            // DEBUG ENDPOINT - GET /auth/debug-token - Debug token validation issues
            authGroup.MapGet("/debug-token", async (HttpContext context, ILogger logger) =>
            {
                try
                {
                    logger.LogInformation("🔍 /auth/debug-token endpoint - Starting debug");
                    
                    var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                    var hasAuthHeader = !string.IsNullOrEmpty(authHeader);
                    var hasBearer = hasAuthHeader && authHeader.StartsWith("Bearer ");
                    
                    var debugInfo = new
                    {
                        HasAuthorizationHeader = hasAuthHeader,
                        HasBearerPrefix = hasBearer,
                        AuthHeaderLength = authHeader?.Length ?? 0,
                        IsAuthenticated = context.User?.Identity?.IsAuthenticated ?? false,
                        ClaimsCount = context.User?.Claims?.Count() ?? 0,
                        Claims = context.User?.Claims?.Select(c => new { Type = c.Type, Value = c.Value }).ToArray() ?? new object[0],
                        IdentityName = context.User?.Identity?.Name,
                        AuthenticationType = context.User?.Identity?.AuthenticationType
                    };
                    
                    logger.LogInformation("🔍 /auth/debug-token endpoint - Debug info: {@DebugInfo}", debugInfo);
                    return Results.Ok(debugInfo);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "🔍 /auth/debug-token endpoint - Error during debug");
                    return Results.BadRequest(new { error = "Debug failed", details = ex.Message });
                }
            })
            .WithName("DebugToken")
            .WithSummary("[DEBUG] Debug JWT token validation")
            .WithDescription("Debug endpoint to help troubleshoot JWT token validation issues");

            // PUT /auth/profile - Update ApplicationUser profile
            authGroup.MapPut("/profile", async (UpdateApplicationUserProfileRequest request, ClaimsPrincipal user, Supabase.Client client, ILogger<UnifiedAuthService> logger) =>
            {
                try
                {
                    // Extract real database user ID from JWT metadata
                    string? realUserId = null;
                    var userMetadataClaim = user.FindFirst("user_metadata")?.Value;
                    if (!string.IsNullOrEmpty(userMetadataClaim))
                    {
                        try
                        {
                            var userMetadata = JsonDocument.Parse(userMetadataClaim);
                            
                            // Try database_user_id first (for new users)
                            if (userMetadata.RootElement.TryGetProperty("database_user_id", out var databaseUserIdElement))
                            {
                                realUserId = databaseUserIdElement.GetString();
                                logger.LogInformation("Found database_user_id in metadata: {UserId}", realUserId);
                            }
                            // Fallback to migrated_user_id (for migrated users)
                            else if (userMetadata.RootElement.TryGetProperty("migrated_user_id", out var migratedUserIdElement))
                            {
                                realUserId = migratedUserIdElement.GetString();
                                logger.LogInformation("Found migrated_user_id in metadata: {UserId}", realUserId);
                            }
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(ex, "Failed to parse user_metadata");
                        }
                    }

                    if (string.IsNullOrEmpty(realUserId))
                    {
                        logger.LogWarning("No real user ID found in JWT metadata");
                        return Results.BadRequest(new { error = "User ID not found in token" });
                    }

                    logger.LogInformation("Updating ApplicationUser profile for userId: {UserId}", realUserId);

                    // Get the current user
                    var response = await client.From<ApplicationUser>()
                        .Where(u => u.Id == realUserId && u.IsActive == true)
                        .Get();

                    var appUser = response.Models.FirstOrDefault();
                    if (appUser == null)
                    {
                        logger.LogWarning("ApplicationUser not found for ID: {UserId}", realUserId);
                        return Results.NotFound(new { message = "User not found" });
                    }

                    // Update the profile fields
                    if (request.Education != null)
                    {
                        logger.LogInformation("Processing Education update with {Count} items", request.Education.Count);
                        appUser.Education = request.Education.Select(item =>
                            JsonElementToDictionary(item)).ToList();
                    }

                    if (request.Experience != null)
                    {
                        logger.LogInformation("Processing Experience update with {Count} items", request.Experience.Count);
                        appUser.Experiences = request.Experience.Select(item =>
                            JsonElementToDictionary(item)).ToList();
                    }

                    if (request.SocialLink != null)
                    {
                        appUser.SocialLink = JsonElementToDictionary(request.SocialLink.Value);
                    }

                    if (request.PhoneNumber != null)
                    {
                        appUser.PhoneNumber = request.PhoneNumber;
                    }

                    if (request.Location != null)
                    {
                        appUser.Location = JsonElementToDictionary(request.Location.Value);
                    }

                    if (request.ResumeList != null)
                    {
                        logger.LogInformation("Processing ResumeList update with {Count} items", request.ResumeList.Count);
                        appUser.ResumeList = request.ResumeList.Select(item =>
                            JsonElementToDictionary(item)).ToList();
                    }

                    logger.LogInformation("Updating user with Education: {EducationCount}, Experience: {ExperienceCount}, Resume: {ResumeCount}",
                        appUser.Education?.Count ?? 0, appUser.Experiences?.Count ?? 0, appUser.ResumeList?.Count ?? 0);

                    // Update the user in the database
                    var updateResponse = await client.From<ApplicationUser>().Update(appUser);

                    logger.LogInformation("ApplicationUser profile updated successfully for user: {UserId}", realUserId);

                    return Results.Ok(new { message = "Profile updated successfully" });
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error updating ApplicationUser profile");
                    return Results.BadRequest(new { error = "Failed to update profile", details = ex.Message });
                }
            })
            .RequireAuthorization()
            .WithName("UpdateUnifiedUserProfile")
            .WithSummary("Update ApplicationUser profile")
            .WithDescription("Update education, experience, and social links for the current application user");
        }

        // Helper method to convert JsonElement to Dictionary
        private static Dictionary<string, object> JsonElementToDictionary(JsonElement element)
        {
            var dictionary = new Dictionary<string, object>();

            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in element.EnumerateObject())
                {
                    dictionary[property.Name] = ConvertJsonElementValue(property.Value);
                }
            }

            return dictionary;
        }

        private static object ConvertJsonElementValue(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.String => element.GetString()!,
                JsonValueKind.Number => element.TryGetInt32(out var intValue) ? intValue : element.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Array => element.EnumerateArray().Select(ConvertJsonElementValue).ToArray(),
                JsonValueKind.Object => JsonElementToDictionary(element),
                JsonValueKind.Null => null!,
                _ => element.ToString()
            };
        }
    }
}
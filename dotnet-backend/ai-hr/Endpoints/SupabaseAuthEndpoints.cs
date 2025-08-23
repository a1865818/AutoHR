using ai_hr.Contracts;
using ai_hr.Services;
using ai_hr.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ai_hr.Endpoints
{
    public static class SupabaseAuthEndpoints
    {
        public static void MapSupabaseAuthEndpoints(this WebApplication app)
        {
            var authGroup = app.MapGroup("/supabase-auth").WithTags("Supabase Authentication");

            // POST /auth/signup - Register new user with Supabase Auth
            authGroup.MapPost("/signup", async (SupabaseSignUpRequest request, ISupabaseAuthService authService) =>
            {
                try
                {
                    var result = await authService.SignUpAsync(request);
                    if (result == null)
                    {
                        return Results.BadRequest(new { error = "Registration failed. Email may already exist or be invalid." });
                    }

                    return Results.Created($"/auth/me", result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Signup endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Registration failed" });
                }
            })
            .WithName("SupabaseSignup")
            .WithSummary("User signup with Supabase Auth")
            .WithDescription("Register a new user account using Supabase Auth and return access tokens");

            // POST /auth/signin - Authenticate user with Supabase Auth
            authGroup.MapPost("/signin", async (SupabaseSignInRequest request, ISupabaseAuthService authService) =>
            {
                try
                {
                    var result = await authService.SignInAsync(request);
                    if (result == null)
                    {
                        return Results.Unauthorized();
                    }

                    return Results.Ok(result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Signin endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Sign in failed" });
                }
            })
            .WithName("SupabaseSignin")
            .WithSummary("User signin with Supabase Auth")
            .WithDescription("Authenticate user with Supabase Auth and return access tokens");

            // POST /auth/signout - Sign out current user
            authGroup.MapPost("/signout", async (ISupabaseAuthService authService) =>
            {
                try
                {
                    var result = await authService.SignOutAsync();
                    if (!result)
                    {
                        return Results.BadRequest(new { error = "Sign out failed" });
                    }

                    return Results.Ok(new { message = "Signed out successfully" });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Signout endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Sign out failed" });
                }
            })
            .RequireAuthorization()
            .WithName("SupabaseSignout")
            .WithSummary("User signout")
            .WithDescription("Sign out current user and invalidate session");

            // POST /auth/password-reset - Send password reset email
            authGroup.MapPost("/password-reset", async (PasswordResetRequest request, ISupabaseAuthService authService) =>
            {
                try
                {
                    var result = await authService.SendPasswordResetAsync(request.Email);
                    if (!result)
                    {
                        return Results.BadRequest(new { error = "Failed to send password reset email" });
                    }

                    return Results.Ok(new { message = "Password reset email sent" });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Password reset endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Failed to send password reset email" });
                }
            })
            .WithName("PasswordReset")
            .WithSummary("Send password reset email")
            .WithDescription("Send password reset email to user");

            // PUT /auth/password - Update user password
            authGroup.MapPut("/password", async (UpdatePasswordRequest request, ISupabaseAuthService authService) =>
            {
                try
                {
                    var result = await authService.UpdateUserPasswordAsync(request.NewPassword);
                    if (!result)
                    {
                        return Results.BadRequest(new { error = "Failed to update password" });
                    }

                    return Results.Ok(new { message = "Password updated successfully" });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Update password endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Failed to update password" });
                }
            })
            .RequireAuthorization()
            .WithName("UpdatePassword")
            .WithSummary("Update user password")
            .WithDescription("Update current user's password");

            // PUT /auth/email - Update user email
            authGroup.MapPut("/email", async (UpdateEmailRequest request, ISupabaseAuthService authService) =>
            {
                try
                {
                    var result = await authService.UpdateUserEmailAsync(request.NewEmail);
                    if (!result)
                    {
                        return Results.BadRequest(new { error = "Failed to update email" });
                    }

                    return Results.Ok(new { message = "Email update initiated. Please check your new email for confirmation." });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Update email endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Failed to update email" });
                }
            })
            .RequireAuthorization()
            .WithName("UpdateEmail")
            .WithSummary("Update user email")
            .WithDescription("Update current user's email address");

            // GET /auth/me - Get current user information
            authGroup.MapGet("/me", async (ClaimsPrincipal user, Supabase.Client client, ISupabaseAuthService authService) =>
            {
                try
                {
                    var userId = user.FindFirst("sub")?.Value; // Supabase uses 'sub' claim for user ID
                    if (string.IsNullOrEmpty(userId))
                    {
                        return Results.Unauthorized();
                    }

                    // Try to get ApplicationUser first
                    var appUserResponse = await client.From<ApplicationUser>()
                        .Where(u => u.SupabaseAuthId == userId && u.IsActive == true)
                        .Get();

                    var appUser = appUserResponse.Models.FirstOrDefault();
                    if (appUser != null)
                    {
                        var userInfo = new
                        {
                            Id = appUser.Id,
                            SupabaseAuthId = appUser.SupabaseAuthId,
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
                            ResumeList = appUser.ResumeList,
                            SavedJobs = appUser.SavedJobs
                        };

                        return Results.Ok(userInfo);
                    }

                    // Try to get HiringUserProfile
                    var hiringUserResponse = await client.From<HiringUserProfile>()
                        .Where(u => u.SupabaseAuthId == userId && u.IsActive == true)
                        .Get();

                    var hiringUser = hiringUserResponse.Models.FirstOrDefault();
                    if (hiringUser != null)
                    {
                        var userInfo = new
                        {
                            Id = hiringUser.Id,
                            SupabaseAuthId = hiringUser.SupabaseAuthId,
                            Email = hiringUser.Email,
                            FirstName = hiringUser.FirstName,
                            LastName = hiringUser.LastName,
                            UserType = hiringUser.UserType,
                            CompanyId = hiringUser.CompanyId,
                            Roles = hiringUser.Roles,
                            IsActive = hiringUser.IsActive,
                            CreatedAt = hiringUser.CreatedAt,
                            UserCategory = "HiringUser",
                            Bio = hiringUser.Bio,
                            LinkedinUrl = hiringUser.LinkedinUrl,
                            Location = hiringUser.Location,
                            Preferences = hiringUser.Preferences
                        };

                        return Results.Ok(userInfo);
                    }

                    // User exists in Supabase but not in local database
                    return Results.NotFound(new { message = "User profile not found" });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Get current user endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Failed to get user info" });
                }
            })
            .RequireAuthorization()
            .WithName("GetCurrentSupabaseUser")
            .WithSummary("Get current authenticated user")
            .WithDescription("Get current authenticated user information from Supabase Auth");

            // POST /auth/refresh - Refresh session
            authGroup.MapPost("/refresh", async (ISupabaseAuthService authService) =>
            {
                try
                {
                    var session = await authService.RefreshSessionAsync();
                    if (session == null)
                    {
                        return Results.Unauthorized();
                    }

                    var response = new
                    {
                        AccessToken = session.AccessToken,
                        RefreshToken = session.RefreshToken,
                        ExpiresAt = session.ExpiresAt()
                    };

                    return Results.Ok(response);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Refresh session endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Session refresh failed" });
                }
            })
            .WithName("RefreshSession")
            .WithSummary("Refresh user session")
            .WithDescription("Refresh the current user session and get new tokens");
        }

        public static void MapSupabaseHiringAuthEndpoints(this WebApplication app)
        {
            var hiringAuthGroup = app.MapGroup("/supabase-hiring-auth").WithTags("Supabase Hiring Authentication");

            // POST /hiring-auth/signup - Register new hiring user with Supabase Auth
            hiringAuthGroup.MapPost("/signup", async (SupabaseSignUpRequest request, ISupabaseAuthService authService) =>
            {
                try
                {
                    // Ensure this is for hiring users
                    request.UserType = "HiringUser";

                    var result = await authService.SignUpAsync(request);
                    if (result == null)
                    {
                        return Results.BadRequest(new { error = "Registration failed. Email may already exist or be invalid." });
                    }

                    return Results.Created($"/hiring-auth/me", result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Hiring signup endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Registration failed" });
                }
            })
            .WithName("SupabaseHiringSignup")
            .WithSummary("Hiring user signup with Supabase Auth")
            .WithDescription("Register a new hiring user account using Supabase Auth");

            // POST /hiring-auth/signin - Authenticate hiring user with Supabase Auth
            hiringAuthGroup.MapPost("/signin", async (SupabaseSignInRequest request, ISupabaseAuthService authService) =>
            {
                try
                {
                    var result = await authService.SignInAsync(request);
                    if (result == null)
                    {
                        return Results.Unauthorized();
                    }

                    // Verify this is a hiring user
                    if (result.UserType != "HiringUser")
                    {
                        return Results.BadRequest(new { error = "Invalid user type for this endpoint" });
                    }

                    return Results.Ok(result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Hiring signin endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Sign in failed" });
                }
            })
            .WithName("SupabaseHiringSignin")
            .WithSummary("Hiring user signin with Supabase Auth")
            .WithDescription("Authenticate hiring user with Supabase Auth and return access tokens");

            // GET /hiring-auth/me - Get current hiring user information
            hiringAuthGroup.MapGet("/me", async (ClaimsPrincipal user, Supabase.Client client) =>
            {
                try
                {
                    var userId = user.FindFirst("sub")?.Value;
                    if (string.IsNullOrEmpty(userId))
                    {
                        return Results.Unauthorized();
                    }

                    var hiringUserResponse = await client.From<HiringUserProfile>()
                        .Where(u => u.SupabaseAuthId == userId && u.IsActive == true)
                        .Get();

                    var hiringUser = hiringUserResponse.Models.FirstOrDefault();
                    if (hiringUser == null)
                    {
                        return Results.NotFound(new { message = "Hiring user profile not found" });
                    }

                    var userInfo = new
                    {
                        Id = hiringUser.Id,
                        SupabaseAuthId = hiringUser.SupabaseAuthId,
                        Email = hiringUser.Email,
                        FirstName = hiringUser.FirstName,
                        LastName = hiringUser.LastName,
                        UserType = hiringUser.UserType,
                        CompanyId = hiringUser.CompanyId,
                        Roles = hiringUser.Roles,
                        IsActive = hiringUser.IsActive,
                        CreatedAt = hiringUser.CreatedAt,
                        UserCategory = "HiringUser",
                        Bio = hiringUser.Bio,
                        LinkedinUrl = hiringUser.LinkedinUrl,
                        Location = hiringUser.Location,
                        Preferences = hiringUser.Preferences
                    };

                    return Results.Ok(userInfo);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Get current hiring user endpoint error: {ex.Message}");
                    return Results.BadRequest(new { error = "Failed to get user info" });
                }
            })
            .RequireAuthorization()
            .WithName("GetCurrentHiringUser")
            .WithSummary("Get current authenticated hiring user")
            .WithDescription("Get current authenticated hiring user information from Supabase Auth");
        }
    }
}
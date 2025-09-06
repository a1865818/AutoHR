using ai_hr.Services;
using ai_hr.Utils;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ai_hr.Endpoints
{
    public static class GmailAuthEndpoints
    {
        public static void MapGmailAuthEndpoints(this WebApplication app)
        {
            app.MapGet("/api/gmail/auth/url", GetAuthUrl)
                .WithTags("Gmail Auth")
                .WithName("GetGmailAuthUrl")
                .WithSummary("Get Gmail OAuth authorization URL")
                .RequireAuthorization();

            app.MapPost("/api/gmail/auth/callback", HandleAuthCallback)
                .WithTags("Gmail Auth")
                .WithName("HandleGmailAuthCallback")
                .WithSummary("Handle Gmail OAuth callback")
                .RequireAuthorization();

            app.MapGet("/api/gmail/auth/status", GetAuthStatus)
                .WithTags("Gmail Auth")
                .WithName("GetGmailAuthStatus")
                .WithSummary("Check Gmail authorization status")
                .RequireAuthorization();

            app.MapPost("/api/gmail/auth/revoke", RevokeAuth)
                .WithTags("Gmail Auth")
                .WithName("RevokeGmailAuth")
                .WithSummary("Revoke Gmail authorization")
                .RequireAuthorization();
        }

        private static async Task<IResult> GetAuthUrl(
            [FromServices] IGmailService gmailService,
            ClaimsPrincipal user,
            [FromQuery] string? redirectUri = null)
        {
            try
            {
                var userId = UserIdExtractor.ExtractUserId(user);
                if (string.IsNullOrEmpty(userId))
                    return Results.Unauthorized();

                redirectUri ??= "http://localhost:3000/gmail/callback";

                var authUrl = await gmailService.GetAuthorizationUrlAsync(userId, redirectUri);

                return Results.Ok(new { authUrl });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 ERROR in GetAuthUrl: {ex.Message}");
                return Results.BadRequest(new { error = ex.Message });
            }
        }

        private static async Task<IResult> HandleAuthCallback(
            [FromBody] AuthCallbackRequest request,
            [FromServices] IGmailService gmailService,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = UserIdExtractor.ExtractUserId(user);
                if (string.IsNullOrEmpty(userId))
                    return Results.Unauthorized();

                var success = await gmailService.HandleAuthCallbackAsync(userId, request.Code, request.RedirectUri);

                if (success)
                {
                    return Results.Ok(new { message = "Gmail authorization successful" });
                }
                else
                {
                    return Results.BadRequest(new { error = "Gmail authorization failed" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 ERROR in HandleAuthCallback: {ex.Message}");
                return Results.BadRequest(new { error = ex.Message });
            }
        }

        private static async Task<IResult> GetAuthStatus(
            [FromServices] IGmailService gmailService,
            ClaimsPrincipal user)
        {
            try
            {
                Console.WriteLine($"🔍 GetAuthStatus called - User authenticated: {user.Identity?.IsAuthenticated}");

                var userId = UserIdExtractor.ExtractUserId(user);
                var userCategory = user.FindFirst("userCategory")?.Value;

                Console.WriteLine($"🔍 UserId: {userId}, UserCategory: {userCategory}");

                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("❌ GetAuthStatus: No userId found in claims");
                    return Results.Unauthorized();
                }

                var isAuthorized = await gmailService.IsUserAuthorizedAsync(userId);
                Console.WriteLine($"✅ Gmail authorization status for user {userId}: {isAuthorized}");

                return Results.Ok(new { isAuthorized });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 ERROR in GetAuthStatus: {ex.Message}");
                Console.WriteLine($"💥 Stack trace: {ex.StackTrace}");
                return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
            }
        }

        private static async Task<IResult> RevokeAuth(
            [FromServices] IGmailService gmailService,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = UserIdExtractor.ExtractUserId(user);
                if (string.IsNullOrEmpty(userId))
                    return Results.Unauthorized();

                await gmailService.RevokeAuthorizationAsync(userId);

                return Results.Ok(new { message = "Gmail authorization revoked" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 ERROR in RevokeAuth: {ex.Message}");
                return Results.BadRequest(new { error = ex.Message });
            }
        }
    }

    public class AuthCallbackRequest
    {
        public string Code { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = string.Empty;
    }
}
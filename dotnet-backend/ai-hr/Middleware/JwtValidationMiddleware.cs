using ai_hr.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ai_hr.Middleware
{
    public class JwtValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtValidationMiddleware> _logger;

        public JwtValidationMiddleware(RequestDelegate next, ILogger<JwtValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ITokenRevocationService tokenRevocationService, ISecurityLoggingService securityLogger)
        {
            var token = ExtractTokenFromRequest(context.Request);
            
            if (!string.IsNullOrEmpty(token) && context.User.Identity?.IsAuthenticated == true)
            {
                try
                {
                    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var tokenId = context.User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

                    if (!string.IsNullOrEmpty(tokenId))
                    {
                        // Check if token is revoked
                        if (await tokenRevocationService.IsTokenRevokedAsync(tokenId))
                        {
                            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                            var userAgent = context.Request.Headers.UserAgent.ToString();

                            await securityLogger.LogUnauthorizedAccessAsync(
                                context.Request.Path,
                                userId,
                                ipAddress,
                                userAgent,
                                "Revoked token used"
                            );

                            context.Response.StatusCode = 401;
                            await context.Response.WriteAsync("{\"error\": \"Token has been revoked\"}");
                            return;
                        }

                        // Additional token validation
                        var validationResult = await tokenRevocationService.ValidateTokenAsync(token, userId);
                        if (!validationResult.IsValid)
                        {
                            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                            var userAgent = context.Request.Headers.UserAgent.ToString();

                            await securityLogger.LogUnauthorizedAccessAsync(
                                context.Request.Path,
                                userId,
                                ipAddress,
                                userAgent,
                                $"Token validation failed: {validationResult.FailureReason}"
                            );

                            context.Response.StatusCode = 401;
                            await context.Response.WriteAsync($"{{\"error\": \"{validationResult.FailureReason}\"}}");
                            return;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during JWT validation middleware");
                    // Continue to next middleware - let the default JWT handler deal with it
                }
            }

            await _next(context);
        }

        private string? ExtractTokenFromRequest(HttpRequest request)
        {
            var authHeader = request.Headers.Authorization.FirstOrDefault();
            if (authHeader != null && authHeader.StartsWith("Bearer "))
            {
                return authHeader.Substring("Bearer ".Length);
            }
            return null;
        }
    }
}
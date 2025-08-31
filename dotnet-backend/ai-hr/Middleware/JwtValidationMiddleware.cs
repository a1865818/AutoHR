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

        public async Task InvokeAsync(HttpContext context, ISecurityLoggingService securityLogger)
        {
            var token = ExtractTokenFromRequest(context.Request);
            
            if (!string.IsNullOrEmpty(token) && context.User.Identity?.IsAuthenticated == true)
            {
                try
                {
                    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                                 context.User.FindFirst("sub")?.Value;
                    var audience = context.User.FindFirst("aud")?.Value;

                    _logger.LogInformation("🔍 JWT Middleware: UserId={UserId}, Audience={Audience}, Path={Path}", 
                        userId, audience, context.Request.Path);

                    // All tokens are now Supabase tokens - no additional validation needed
                    // The JWT Bearer middleware has already validated the token signature, expiration, etc.
                    _logger.LogInformation("🔍 JWT Middleware: Supabase token validated successfully");
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
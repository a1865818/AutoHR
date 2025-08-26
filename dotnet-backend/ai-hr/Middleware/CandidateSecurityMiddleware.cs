using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ai_hr.Middleware
{
    public class CandidateSecurityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<CandidateSecurityMiddleware> _logger;

        public CandidateSecurityMiddleware(RequestDelegate next, ILogger<CandidateSecurityMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value;
            var method = context.Request.Method;

            // Apply special security for candidate-accessible endpoints
            if (IsCandidateEndpoint(path))
            {
                var securityResult = await ValidateCandidateAccess(context, path);
                if (!securityResult.IsValid)
                {
                    _logger.LogWarning("Candidate endpoint security violation: {Path} from {IP} - {Reason}",
                        path, context.Connection.RemoteIpAddress, securityResult.Reason);
                    
                    context.Response.StatusCode = securityResult.StatusCode;
                    await context.Response.WriteAsync($"{{\"error\": \"{securityResult.Reason}\"}}");
                    return;
                }
            }

            await _next(context);
        }

        private bool IsCandidateEndpoint(string? path)
        {
            if (string.IsNullOrEmpty(path))
                return false;

            var candidateEndpoints = new[]
            {
                "/applicant/jobs/",
                "/public/jobs/"
                // Removed "/jobs/" as it catches all job-related API endpoints including admin ones
                // Only specific public and applicant endpoints should be subject to candidate security
            };

            return candidateEndpoints.Any(endpoint => path?.StartsWith(endpoint, StringComparison.OrdinalIgnoreCase) == true);
        }

        private async Task<SecurityValidationResult> ValidateCandidateAccess(HttpContext context, string path)
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = context.Request.Headers.UserAgent.ToString();
            var method = context.Request.Method;

            // 1. Rate limiting check for candidate endpoints (more permissive than admin endpoints)
            if (await IsRateLimitExceeded(context, ipAddress, isCandidate: true))
            {
                return new SecurityValidationResult(false, 429, "Rate limit exceeded for candidate endpoint");
            }

            // 2. Validate user agent (block obvious bots and scrapers)
            if (IsSuspiciousUserAgent(userAgent))
            {
                return new SecurityValidationResult(false, 403, "Suspicious user agent detected");
            }

            // 3. For authenticated candidate endpoints (/applicant/jobs/), verify user is authenticated
            if (path?.StartsWith("/applicant/", StringComparison.OrdinalIgnoreCase) == true)
            {
                if (!context.User.Identity?.IsAuthenticated == true)
                {
                    return new SecurityValidationResult(false, 401, "Authentication required for candidate endpoint");
                }

                // Verify the user has appropriate claims (is actually an applicant user)
                if (!IsValidCandidateUser(context.User))
                {
                    return new SecurityValidationResult(false, 403, "Invalid user type for candidate endpoint");
                }
            }

            // 4. Validate request parameters for potential attacks
            if (ContainsMaliciousParameters(context.Request))
            {
                return new SecurityValidationResult(false, 400, "Malicious request parameters detected");
            }

            // 5. Check for request body size limits (prevent DoS attacks)
            if (context.Request.ContentLength > 10_000_000) // 10MB limit for candidate endpoints
            {
                return new SecurityValidationResult(false, 413, "Request too large");
            }

            return new SecurityValidationResult(true, 200, "Valid");
        }

        private async Task<bool> IsRateLimitExceeded(HttpContext context, string ipAddress, bool isCandidate)
        {
            // Implement simple in-memory rate limiting (in production, use Redis or similar)
            var cacheKey = $"rate_limit_{ipAddress}_{(isCandidate ? "candidate" : "admin")}";
            
            // For this implementation, we'll use a simple check
            // In production, implement proper rate limiting with sliding windows
            
            // Candidate endpoints: 100 requests per minute
            // Public job endpoints: 200 requests per minute (for browsing)
            var limit = context.Request.Path.StartsWithSegments("/public") ? 200 : 100;
            
            // This is a simplified implementation - in production use AspNetCoreRateLimit properly
            return false; // For now, don't block - proper implementation would use distributed cache
        }

        private bool IsSuspiciousUserAgent(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent) || userAgent.Length < 10)
                return true; // Suspicious if too short or empty

            var suspiciousPatterns = new[]
            {
                "sqlmap", "nikto", "nmap", "dirb", "gobuster", "wfuzz",
                "python-requests", "curl/", "wget/", "scrapy",
                "bot", "crawler", "spider", "scraper",
                "postman", "insomnia", // Block API testing tools in production
                "masscan", "zap", "burp"
            };

            var userAgentLower = userAgent.ToLower();
            return suspiciousPatterns.Any(pattern => userAgentLower.Contains(pattern));
        }

        private bool IsValidCandidateUser(ClaimsPrincipal user)
        {
            if (!user.Identity?.IsAuthenticated == true)
                return false;

            // Check if user has valid claims structure for an applicant
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = user.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
                return false;

            // Additional validation: ensure user ID is a valid GUID
            if (!Guid.TryParse(userId, out _))
                return false;

            return true;
        }

        private bool ContainsMaliciousParameters(HttpRequest request)
        {
            // Check query parameters
            foreach (var param in request.Query)
            {
                if (ContainsMaliciousContent(param.Key) || 
                    param.Value.Any(value => ContainsMaliciousContent(value)))
                {
                    return true;
                }
            }

            // Check route parameters
            foreach (var routeValue in request.RouteValues)
            {
                if (routeValue.Value != null && ContainsMaliciousContent(routeValue.Value.ToString()))
                {
                    return true;
                }
            }

            return false;
        }

        private bool ContainsMaliciousContent(string? content)
        {
            if (string.IsNullOrEmpty(content))
                return false;

            var maliciousPatterns = new[]
            {
                "<script", "javascript:", "vbscript:", "onload=", "onclick=",
                "union", "select", "drop", "delete", "insert", "update",
                "../", "..\\", "%2e%2e", "%252e",
                "file://", "data:text/html", "eval(", "expression(",
                "<iframe", "<object", "<embed", "<link",
                "cmd.exe", "powershell", "/bin/bash", "/bin/sh"
            };

            var contentLower = content.ToLower();
            return maliciousPatterns.Any(pattern => contentLower.Contains(pattern));
        }

        private record SecurityValidationResult(bool IsValid, int StatusCode, string Reason);
    }
}
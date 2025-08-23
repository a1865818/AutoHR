namespace ai_hr.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecurityHeadersMiddleware> _logger;

        public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Add security headers to all responses
            AddSecurityHeaders(context.Response, context);

            await _next(context);

            // Log security events
            LogSecurityInfo(context);
        }

        private void AddSecurityHeaders(HttpResponse response, HttpContext context)
        {
            // Prevent MIME type sniffing
            response.Headers.Append("X-Content-Type-Options", "nosniff");

            // Prevent clickjacking attacks
            response.Headers.Append("X-Frame-Options", "DENY");

            // Enable XSS protection in browsers
            response.Headers.Append("X-XSS-Protection", "1; mode=block");

            // Control referrer information
            response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

            // Content Security Policy - allow Swagger UI in development
            var isSwaggerPath = context.Request.Path.StartsWithSegments("/swagger");
            
            string csp;
            if (isSwaggerPath)
            {
                // Relaxed CSP for Swagger UI
                csp = "default-src 'self'; " +
                     "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                     "style-src 'self' 'unsafe-inline'; " +
                     "img-src 'self' data: https:; " +
                     "font-src 'self'; " +
                     "connect-src 'self'; " +
                     "frame-ancestors 'none'; " +
                     "base-uri 'self'; " +
                     "form-action 'self'";
            }
            else
            {
                // Restrictive CSP for API endpoints
                csp = "default-src 'self'; " +
                     "script-src 'self'; " +
                     "style-src 'self' 'unsafe-inline'; " +
                     "img-src 'self' data: https:; " +
                     "font-src 'self'; " +
                     "connect-src 'self'; " +
                     "frame-ancestors 'none'; " +
                     "base-uri 'self'; " +
                     "form-action 'self'";
            }
            
            response.Headers.Append("Content-Security-Policy", csp);

            // Strict Transport Security (HSTS) - only in production with HTTPS
            if (IsProductionAndHttps(context))
            {
                response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
            }

            // Remove server information headers for security
            response.Headers.Remove("Server");
            response.Headers.Remove("X-Powered-By");

            // Permissions Policy (Feature Policy replacement)
            response.Headers.Append("Permissions-Policy", 
                "camera=(), " +
                "microphone=(), " +
                "geolocation=(), " +
                "interest-cohort=()");
        }

        private bool IsProductionAndHttps(HttpContext context)
        {
            var environment = context.RequestServices.GetService<IWebHostEnvironment>();
            return environment?.IsProduction() == true && context.Request.IsHttps;
        }

        private void LogSecurityInfo(HttpContext context)
        {
            // Log suspicious requests
            var userAgent = context.Request.Headers.UserAgent.ToString();
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            var path = context.Request.Path;
            var method = context.Request.Method;

            // Check for suspicious patterns
            if (ContainsSuspiciousPatterns(userAgent, path.ToString()))
            {
                _logger.LogWarning("Suspicious request detected: {Method} {Path} from {IP} with User-Agent: {UserAgent}",
                    method, path, ipAddress, userAgent);
            }

            // Log failed authentication attempts
            if (context.Response.StatusCode == 401)
            {
                _logger.LogWarning("Unauthorized access attempt: {Method} {Path} from {IP}",
                    method, path, ipAddress);
            }

            // Log potential attacks
            if (context.Response.StatusCode == 400 || context.Response.StatusCode == 403)
            {
                _logger.LogWarning("Potentially malicious request: {Method} {Path} from {IP} - Status: {StatusCode}",
                    method, path, ipAddress, context.Response.StatusCode);
            }
        }

        private bool ContainsSuspiciousPatterns(string userAgent, string path)
        {
            var suspiciousPatterns = new[]
            {
                "sqlmap", "nikto", "nmap", "masscan", "zap", "burp",
                "wget", "curl", "python", "bot", "crawler", "spider",
                "<script", "javascript:", "vbscript:", "onload=",
                "union", "select", "drop", "delete", "insert", "update",
                "../", "..\\", "%2e%2e", "%252e", "file://", "http://localhost"
            };

            var checkString = (userAgent + " " + path).ToLower();

            return suspiciousPatterns.Any(pattern => checkString.Contains(pattern));
        }
    }
}
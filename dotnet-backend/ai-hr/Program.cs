using Supabase;
using ai_hr.Models;
using ai_hr.Services;
using ai_hr.Endpoints;
using DotNetEnv;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Annotations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Logging;
using FluentValidation;
using FluentValidation.AspNetCore;
using AspNetCoreRateLimit;
using ai_hr.Validators;
using ai_hr.Middleware;

// Load environment variables from .env file
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add logging services
builder.Services.AddLogging(builder =>
{
    builder.AddConsole();
    builder.AddDebug();
});

// Add specific logger factory
builder.Services.AddSingleton<ILoggerFactory, LoggerFactory>();

// Add ILogger service explicitly
builder.Services.AddScoped<ILogger>(provider =>
    provider.GetRequiredService<ILoggerFactory>().CreateLogger("Default"));

// Configure JWT settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// Configure FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<CreateJobRequestValidator>();

// Configure Rate Limiting
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(options =>
{
    options.EnableEndpointRateLimiting = true;
    options.StackBlockedRequests = false;
    options.HttpStatusCode = 429;
    options.RealIpHeader = "X-Real-IP";
    options.ClientIdHeader = "X-ClientId";
    options.GeneralRules = new List<RateLimitRule>
    {
        new RateLimitRule
        {
            Endpoint = "*",
            Period = "1m",
            Limit = 100 // 100 requests per minute per IP
        },
        new RateLimitRule
        {
            Endpoint = "POST:/auth/*",
            Period = "1m",
            Limit = 10 // Login attempts: 10 per minute
        },
        new RateLimitRule
        {
            Endpoint = "*:/public/jobs/*",
            Period = "1m",
            Limit = 200 // Public job browsing: 200 per minute
        },
        new RateLimitRule
        {
            Endpoint = "*:/applicant/jobs/*",
            Period = "1m",
            Limit = 150 // Candidate job access: 150 per minute
        }
    };
});
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();

// Configure HTTPS redirection options
builder.Services.AddHttpsRedirection(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.RedirectStatusCode = StatusCodes.Status307TemporaryRedirect;
        options.HttpsPort = 5189;
    }
});

// Add authentication and authorization
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
    var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? jwtSettings?.SecretKey;

    if (string.IsNullOrEmpty(secretKey))
    {
        throw new InvalidOperationException("JWT SecretKey not configured");
    }

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings?.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings?.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Register JWT and Authentication services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IHiringUserProfileAuthenticationService, HiringUserProfileAuthenticationService>();
builder.Services.AddScoped<ISavedJobsService, SavedJobsService>();
builder.Services.AddScoped<IJobViewTrackingService, JobViewTrackingService>();

// Register Advanced Security Services (Phase 3)
builder.Services.AddSingleton<ISecurityLoggingService, SecurityLoggingService>();
builder.Services.AddScoped<ITokenRevocationService, TokenRevocationService>();
builder.Services.AddScoped<IAdvancedAuthenticationService, AdvancedAuthenticationService>();
builder.Services.AddScoped<ISecureExternalApiService, SecureExternalApiService>();

// Register Gmail service
builder.Services.AddScoped<IGmailService, ai_hr.Services.GmailApiService>();

// Register Google Calendar service
builder.Services.AddScoped<IGoogleCalendarService, GoogleCalendarService>();


//Enable session support for user tracking
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(24); // Session timeout
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    //options.Cookie.SameSite = SameSiteMode.Lax;
});

// Add HttpContextAccessor for session support
builder.Services.AddHttpContextAccessor();


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.EnableAnnotations();
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AI HR Platform API",
        Version = "v1",
        Description = "A comprehensive HR platform API with job management, candidate tracking, and recruitment features"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Define tags for grouping endpoints
    c.TagActionsBy(api => new[] { api.GroupName ?? api.ActionDescriptor.EndpointMetadata.OfType<TagsAttribute>().SelectMany(t => t.Tags).FirstOrDefault() ?? "Default" });
    c.DocInclusionPredicate((name, api) => true);
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',')
            ?? new[] { "http://localhost:3000", "https://localhost:3000" };

        policy.WithOrigins(allowedOrigins)
              .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS") // ✅ Restrict to needed methods
              .WithHeaders("Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With", "X-Session-ID") // ✅ Allow session ID header
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(30)); // ✅ Cache preflight requests
    });
});

// Configure Supabase client
builder.Services.AddScoped<Supabase.Client>(_ => new Supabase.Client(
    Environment.GetEnvironmentVariable("SUPABASE_URL") ?? builder.Configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase URL not configured"),
    Environment.GetEnvironmentVariable("SUPABASE_KEY") ?? builder.Configuration["Supabase:Key"] ?? throw new InvalidOperationException("Supabase Key not configured"),
    new SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true
    }
));

var app = builder.Build();

// ✅ Add security middleware first
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<CandidateSecurityMiddleware>();

// ✅ Add rate limiting
app.UseIpRateLimiting();

// ✅ Add JWT validation middleware (Phase 3)
app.UseMiddleware<JwtValidationMiddleware>();

// ✅ Add custom error handling middleware
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        // Get logger for security events
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

        // Log the full exception for debugging (server-side only)
        logger.LogError(exception, "Unhandled exception occurred at path: {Path}", context.Request.Path);

        // Return sanitized error response to client
        var isDevelopment = app.Environment.IsDevelopment();
        var response = new
        {
            message = "An internal server error occurred. Please try again later.",
            traceId = System.Diagnostics.Activity.Current?.Id ?? context.TraceIdentifier,
            // ✅ Only include details in development
            details = isDevelopment ? exception?.Message : null,
            stackTrace = isDevelopment ? exception?.StackTrace : null
        };

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Security headers are now handled by SecurityHeadersMiddleware

// Use CORS after security headers
app.UseCors("AllowNextJs");

// Add HTTPS redirection in the correct position (early in the pipeline)
// Only enable HTTPS redirection if both HTTP and HTTPS ports are configured
var urls = builder.Configuration["urls"] ?? Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "";
if (urls.Contains("https://") && !app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRouting();


// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();
// Temporarily disable session to debug logging issue
// app.UseSession();


// Map endpoints by resource type
app.MapUserEndpoints();
app.MapApplicationDetailEndpoints();
app.MapJobEndpoints();
app.MapCandidateEndpoints();
app.MapCandidateRankingEndpoints();
app.MapCompanyEndpoints();
app.MapHiringUserProfileEndpoints();
app.MapHiringUserProfileAuthenticationEndpoints();
app.MapAuthenticationEndpoints();
app.MapNotesEndpoints();
app.MapLanggraphEndpoints();
app.MapInterviewEndpoints();
app.MapRoundConfigurationEndpoints();
app.MapStorageBucketEndpoints();
app.MapSavedJobsEndpoints();
app.MapEmailEndpoints();
app.MapEmailTemplateEndpoints();
app.MapGmailAuthEndpoints();
app.MapAssessmentEndpoints();
app.Run();
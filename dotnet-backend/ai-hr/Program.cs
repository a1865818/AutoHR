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

// Configure JWT settings for legacy auth
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
            Limit = 100
        },
        new RateLimitRule
        {
            Endpoint = "POST:/auth/*",
            Period = "1m",
            Limit = 20 // Increased for hybrid auth
        },
        new RateLimitRule
        {
            Endpoint = "*:/public/jobs/*",
            Period = "1m",
            Limit = 200
        },
        new RateLimitRule
        {
            Endpoint = "*:/applicant/jobs/*",
            Period = "1m",
            Limit = 150
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

// HYBRID AUTHENTICATION CONFIGURATION
// Support both legacy JWT and Supabase Auth JWT tokens

var legacyJwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? builder.Configuration["Jwt:SecretKey"];
var supabaseJwtSecret = Environment.GetEnvironmentVariable("SUPABASE_JWT_SECRET") ?? builder.Configuration["Supabase:JwtSecret"];
var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL") ?? builder.Configuration["Supabase:Url"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "Hybrid";
    options.DefaultChallengeScheme = "Hybrid";
})
.AddJwtBearer("Legacy", options =>
{
    if (!string.IsNullOrEmpty(legacyJwtSecret))
    {
        var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
        var key = Encoding.UTF8.GetBytes(legacyJwtSecret);
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings?.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings?.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    }
})
.AddJwtBearer("Supabase", options =>
{
    if (!string.IsNullOrEmpty(supabaseJwtSecret) && !string.IsNullOrEmpty(supabaseUrl))
    {
        var key = Encoding.UTF8.GetBytes(supabaseJwtSecret);
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = new Uri(supabaseUrl).GetLeftPart(UriPartial.Authority) + "/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    }
})
.AddPolicyScheme("Hybrid", "Hybrid", options =>
{
    options.ForwardDefaultSelector = context =>
    {
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ") == true)
        {
            var token = authHeader["Bearer ".Length..];
            
            // Simple heuristic to determine token type
            // Supabase JWTs typically have different structure/claims
            try
            {
                var tokenParts = token.Split('.');
                if (tokenParts.Length == 3)
                {
                    var payload = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
                        Convert.FromBase64String(AddPadding(tokenParts[1])));
                    
                    // Supabase tokens typically have 'aud' claim set to 'authenticated'
                    if (payload.ContainsKey("aud") && payload["aud"].ToString() == "authenticated")
                    {
                        return "Supabase";
                    }
                }
            }
            catch
            {
                // If we can't parse the token, try legacy first
            }
        }
        
        return "Legacy";
    };
});

// Add authorization
builder.Services.AddAuthorization();

// Register ALL authentication services (legacy + Supabase + hybrid)
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IHiringUserProfileAuthenticationService, HiringUserProfileAuthenticationService>();
builder.Services.AddScoped<ISupabaseAuthService, SupabaseAuthService>();
builder.Services.AddScoped<IHybridAuthenticationService, HybridAuthenticationService>();

builder.Services.AddScoped<ISavedJobsService, SavedJobsService>();
builder.Services.AddScoped<IJobViewTrackingService, JobViewTrackingService>();

// Register Advanced Security Services
builder.Services.AddSingleton<ISecurityLoggingService, SecurityLoggingService>();
builder.Services.AddScoped<ITokenRevocationService, TokenRevocationService>();
builder.Services.AddScoped<IAdvancedAuthenticationService, AdvancedAuthenticationService>();
builder.Services.AddScoped<ISecureExternalApiService, SecureExternalApiService>();

// Register Refresh Token Cleanup Service (for legacy auth)
builder.Services.AddScoped<IRefreshTokenCleanupService>(provider =>
    new RefreshTokenCleanupService(
        provider.GetRequiredService<IServiceScopeFactory>(),
        provider.GetRequiredService<ILogger<RefreshTokenCleanupService>>(),
        provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<JwtSettings>>()));

builder.Services.AddHostedService<RefreshTokenCleanupService>();

// Register Gmail service
builder.Services.AddScoped<IGmailService, ai_hr.Services.GmailApiService>();

// Register Google Calendar service
builder.Services.AddScoped<IGoogleCalendarService, GoogleCalendarService>();


// Enable session support for user tracking
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(24);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.AddHttpContextAccessor();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.EnableAnnotations();
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AI HR Platform API - Hybrid Auth",
        Version = "v1",
        Description = "A comprehensive HR platform API supporting both legacy JWT and Supabase Auth"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Supports both legacy and Supabase Auth tokens. Example: \"Authorization: Bearer {token}\"",
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
              .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
              .WithHeaders("Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With", "X-Session-ID")
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(30));
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

// Add security middleware first
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<CandidateSecurityMiddleware>();

// Add rate limiting
app.UseIpRateLimiting();

// Add JWT validation middleware (handles both token types)
app.UseMiddleware<JwtValidationMiddleware>();

// Add custom error handling middleware
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(exception, "Unhandled exception occurred at path: {Path}", context.Request.Path);

        var isDevelopment = app.Environment.IsDevelopment();
        var response = new
        {
            message = "An internal server error occurred. Please try again later.",
            traceId = System.Diagnostics.Activity.Current?.Id ?? context.TraceIdentifier,
            details = isDevelopment ? exception?.Message : null,
            stackTrace = isDevelopment ? exception?.StackTrace : null
        };

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
    });
});

app.UseCors("AllowNextJs");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AI HR Platform API - Hybrid Auth v1");
        c.RoutePrefix = "swagger";
    });
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AI HR Platform API - Hybrid Auth v1");
        c.RoutePrefix = "swagger";
    });
}

var urls = builder.Configuration["urls"] ?? Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "";
if (urls.Contains("https://") && !app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRouting();

// Use the hybrid authentication scheme
app.UseAuthentication();
app.UseAuthorization();

// Map all existing endpoints
app.MapUserEndpoints();
app.MapApplicationDetailEndpoints();
app.MapJobEndpoints();
app.MapCandidateEndpoints();
app.MapCandidateRankingEndpoints();
app.MapCompanyEndpoints();
app.MapHiringUserProfileEndpoints();

// Map BOTH legacy and new Supabase Auth endpoints
app.MapAuthenticationEndpoints(); // Legacy endpoints
app.MapHiringUserProfileAuthenticationEndpoints(); // Legacy hiring endpoints
app.MapSupabaseAuthEndpoints(); // New Supabase endpoints
app.MapSupabaseHiringAuthEndpoints(); // New Supabase hiring endpoints

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

// Helper function for base64 padding
static string AddPadding(string base64)
{
    var length = base64.Length;
    var remainder = length % 4;
    
    return remainder switch
    {
        2 => base64 + "==",
        3 => base64 + "=",
        _ => base64
    };
}
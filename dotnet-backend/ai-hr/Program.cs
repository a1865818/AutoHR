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

// Load environment variables from .env file
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Configure JWT settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

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
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS
app.UseCors("AllowNextJs");

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Map endpoints by resource type
app.MapUserEndpoints();
app.MapApplicationDetailEndpoints();
app.MapJobEndpoints();
app.MapCompanyEndpoints();
app.MapHiringUserProfileEndpoints();
app.MapHiringUserProfileAuthenticationEndpoints();
app.MapAuthenticationEndpoints();

app.UseHttpsRedirection();

app.Run();
using Supabase;
using ai_hr.Models;
using DotNetEnv;

// Load environment variables from .env file
Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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


app.MapPost("/users/create", async (CreateUserRequest request, Supabase.Client client) =>
{
    try
    {
        Console.WriteLine($"Creating user with email: {request.Email}");

        var user = new ApplicationUser
        {
            Email = request.Email,
            Password = request.Password,
            FirstName = request.FirstName,
            LastName = request.LastName
        };

        Console.WriteLine($"User object created - Email: {user.Email}, Name: {user.FirstName} {user.LastName}");

        var response = await client.From<ApplicationUser>().Insert(user);
        var newUser = response.Models.First();

        Console.WriteLine($"Insert successful - User ID: {newUser.Id}");

        // Create a clean response object
        var userResponse = new UserResponse
        {
            Id = newUser.Id,
            Email = newUser.Email,
            FirstName = newUser.FirstName,
            LastName = newUser.LastName,
            created_at = newUser.CreatedAt
        };

        return Results.Ok(userResponse);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating user: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
    }
});

app.MapGet("/users/{id}", async (int id, Supabase.Client client) =>
{
    var response = await client.From<ApplicationUser>().Where(n => n.Id == id).Get();
    var user = response.Models.FirstOrDefault();
    // log the user
    if (user is null)
    { return Results.NotFound(); }
    var user_response = new UserResponse
    {
        Id = user.Id,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        created_at = user.CreatedAt
    };
    return Results.Ok(user_response);
});

app.MapDelete("/users/{id}", async (int id, Supabase.Client client) =>
{
    await client.From<ApplicationUser>().Where(n => n.Id == id).Delete();
    return Results.NoContent();
});

app.UseHttpsRedirection();

app.Run();

using ai_hr.Models;
using ai_hr.Contracts.Interview;
using Supabase;
using System.Security.Claims;
using System.Text.Json;

namespace ai_hr.Endpoints;

public static class RoundConfigurationEndpoints
{
    public static void MapRoundConfigurationEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api").WithTags("Round Configuration");

        // GET /api/jobs/{jobId}/rounds/{roundId}/configuration
        group.MapGet("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration", GetRoundConfiguration)
            .WithName("GetRoundConfiguration")
            .WithSummary("Get configuration for a specific round in a job")
            .RequireAuthorization();

        // PUT /api/jobs/{jobId}/rounds/{roundId}/configuration
        group.MapPut("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration", SaveRoundConfiguration)
            .WithName("SaveRoundConfiguration")
            .WithSummary("Save or update configuration for a specific round")
            .RequireAuthorization();

        // GET /api/interview-templates/rounds/{roundType}/defaults
        group.MapGet("/interview-templates/rounds/{roundType}/defaults", GetDefaultConfiguration)
            .WithName("GetDefaultConfiguration")
            .WithSummary("Get default configuration for a round type")
            .RequireAuthorization();

        // POST /api/jobs/{jobId}/rounds/{roundId}/questions
        group.MapPost("/jobs/{jobId:guid}/rounds/{roundId:guid}/questions", SaveRoundQuestions)
            .WithName("SaveRoundQuestions")
            .WithSummary("Save questions for a round configuration")
            .RequireAuthorization();

        // GET /api/jobs/{jobId}/rounds/configurations
        group.MapGet("/jobs/{jobId:guid}/rounds/configurations", GetJobRoundConfigurations)
            .WithName("GetJobRoundConfigurations")
            .WithSummary("Get all round configurations for a job")
            .RequireAuthorization();

        // POST /api/jobs/{jobId}/rounds/{roundId}/configuration/validate
        group.MapPost("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration/validate", ValidateConfiguration)
            .WithName("ValidateConfiguration")
            .WithSummary("Validate a round configuration")
            .RequireAuthorization();

        // POST /api/jobs/{jobId}/rounds/{roundId}/configuration/clone
        group.MapPost("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration/clone", CloneConfiguration)
            .WithName("CloneConfiguration")
            .WithSummary("Clone configuration from another job/round")
            .RequireAuthorization();
    }

    private static async Task<IResult> GetRoundConfiguration(
        Guid jobId,
        Guid roundId,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = await GetUserCompanyId(client, userId.Value);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, jobId, companyId.Value))
                return Results.StatusCode(403);

            // Get round configuration
            var configResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == jobId && rc.RoundId == roundId)
                .Get();

            var config = configResponse.Models.FirstOrDefault();
            if (config == null)
            {
                // Create default configuration if none exists
                var roundResponse = await client.From<InterviewRound>()
                    .Where(r => r.Id == roundId)
                    .Get();

                var round = roundResponse.Models.FirstOrDefault();
                if (round == null) return Results.NotFound("Round not found");

                config = await CreateDefaultRoundConfiguration(client, jobId, roundId, round.Type, userId.Value);
            }

            // Get associated questions and scoring criteria
            var questionsResponse = await client.From<RoundQuestion>()
                .Where(q => q.RoundConfigId == config.Id)
                .Order(x => x.OrderIndex, Supabase.Postgrest.Constants.Ordering.Ascending)
                .Get();

            var criteriaResponse = await client.From<RoundScoringCriteria>()
                .Where(c => c.RoundConfigId == config.Id)
                .Order(x => x.OrderIndex, Supabase.Postgrest.Constants.Ordering.Ascending)
                .Get();

            var response = MapToResponseDto(config, questionsResponse.Models, criteriaResponse.Models);
            return Results.Ok(new { success = true, data = response });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving round configuration: {ex.Message}");
        }
    }

    private static async Task<IResult> SaveRoundConfiguration(
        Guid jobId,
        Guid roundId,
        RoundConfigurationRequest request,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = await GetUserCompanyId(client, userId.Value);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, jobId, companyId.Value))
                return Results.StatusCode(403);

            // Check if configuration exists
            var existingResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == jobId && rc.RoundId == roundId)
                .Get();

            var existing = existingResponse.Models.FirstOrDefault();

            RoundConfiguration config;
            if (existing != null)
            {
                // Update existing configuration
                existing.Name = request.Name;
                existing.Description = request.Description;
                existing.Duration = request.Duration;
                existing.Status = request.Status;
                existing.ConfigurationData = JsonSerializer.SerializeToElement(request.ConfigurationData);
                existing.UpdatedAt = DateTime.UtcNow;
                existing.LastModifiedBy = userId.Value;
                existing.Version += 1;

                var updateResponse = await client.From<RoundConfiguration>().Update(existing);
                config = updateResponse.Models.FirstOrDefault()!;
            }
            else
            {
                // Create new configuration
                var roundResponse = await client.From<InterviewRound>()
                    .Where(r => r.Id == roundId)
                    .Get();

                var round = roundResponse.Models.FirstOrDefault();
                if (round == null) return Results.NotFound("Round not found");

                config = new RoundConfiguration
                {
                    JobId = jobId,
                    RoundId = roundId,
                    RoundType = round.Type,
                    Name = request.Name,
                    Description = request.Description,
                    Duration = request.Duration,
                    Status = request.Status,
                    ConfigurationData = JsonSerializer.SerializeToElement(request.ConfigurationData),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = userId.Value,
                    LastModifiedBy = userId.Value
                };

                var insertResponse = await client.From<RoundConfiguration>().Insert(config);
                config = insertResponse.Models.FirstOrDefault()!;
            }

            var response = MapToResponseDto(config, new List<RoundQuestion>(), new List<RoundScoringCriteria>());
            return Results.Ok(new { success = true, data = response });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error saving round configuration: {ex.Message}");
        }
    }

    private static async Task<IResult> GetDefaultConfiguration(
        string roundType,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            // Get default configuration for round type
            var defaultResponse = await client.From<DefaultRoundConfiguration>()
                .Where(dc => dc.RoundType == roundType && dc.IsActive)
                .Get();

            var defaultConfig = defaultResponse.Models.FirstOrDefault();
            if (defaultConfig == null)
            {
                // Return basic default if no specific default exists
                var basicDefault = GetBasicDefaultConfiguration(roundType);
                return Results.Ok(new { success = true, data = basicDefault, message = "Using basic default configuration" });
            }

            return Results.Ok(new { success = true, data = defaultConfig.DefaultConfiguration });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving default configuration: {ex.Message}");
        }
    }

    private static async Task<IResult> SaveRoundQuestions(
        Guid jobId,
        Guid roundId,
        BulkQuestionsRequest request,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = await GetUserCompanyId(client, userId.Value);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, jobId, companyId.Value))
                return Results.StatusCode(403);

            // Get round configuration
            var configResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == jobId && rc.RoundId == roundId)
                .Get();

            var config = configResponse.Models.FirstOrDefault();
            if (config == null) return Results.NotFound("Round configuration not found");

            // Delete existing questions
            var existingQuestionsResponse = await client.From<RoundQuestion>()
                .Where(q => q.RoundConfigId == config.Id)
                .Get();

            if (existingQuestionsResponse.Models.Any())
            {
                foreach (var existingQuestion in existingQuestionsResponse.Models)
                {
                    await client.From<RoundQuestion>().Where(q => q.Id == existingQuestion.Id).Delete();
                }
            }

            // Insert new questions
            var questions = new List<RoundQuestion>();
            for (int i = 0; i < request.Questions.Count; i++)
            {
                var questionRequest = request.Questions[i];
                var question = new RoundQuestion
                {
                    RoundConfigId = config.Id,
                    QuestionText = questionRequest.QuestionText,
                    QuestionType = questionRequest.QuestionType,
                    Category = questionRequest.Category,
                    IsRequired = questionRequest.IsRequired,
                    OrderIndex = questionRequest.OrderIndex > 0 ? questionRequest.OrderIndex : i + 1,
                    Metadata = questionRequest.Metadata != null ? JsonSerializer.SerializeToElement(questionRequest.Metadata) : null
                };

                var insertResponse = await client.From<RoundQuestion>().Insert(question);
                var insertedQuestion = insertResponse.Models.FirstOrDefault();
                if (insertedQuestion != null)
                    questions.Add(insertedQuestion);
            }

            var questionDtos = questions.Select(MapQuestionToDto).ToList();
            return Results.Ok(new { success = true, data = questionDtos });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error saving round questions: {ex.Message}");
        }
    }

    // Helper methods
    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : null;
    }

    private static async Task<Guid?> GetUserCompanyId(Supabase.Client client, Guid userId)
    {
        var hiringUserResponse = await client.From<HiringUserProfile>().Get();
        var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userId);
        return hiringUser?.CompanyId;
    }

    private static async Task<bool> VerifyJobAccess(Supabase.Client client, Guid jobId, Guid companyId)
    {
        var jobResponse = await client.From<Job>().Where(j => j.Id == jobId).Get();
        var job = jobResponse.Models.FirstOrDefault();
        return job?.CompanyId == companyId;
    }

    private static async Task<RoundConfiguration> CreateDefaultRoundConfiguration(
        Supabase.Client client,
        Guid jobId,
        Guid roundId,
        string roundType,
        Guid userId)
    {
        var defaultConfig = GetBasicDefaultConfiguration(roundType);

        var config = new RoundConfiguration
        {
            JobId = jobId,
            RoundId = roundId,
            RoundType = roundType,
            Name = $"{roundType.Replace("_", " ").Title()} Configuration",
            Description = $"Default configuration for {roundType}",
            Duration = 30,
            Status = "draft",
            ConfigurationData = JsonSerializer.SerializeToElement(defaultConfig),
            CreatedBy = userId,
            LastModifiedBy = userId
        };

        var insertResponse = await client.From<RoundConfiguration>().Insert(config);
        return insertResponse.Models.First();
    }

    private static object GetBasicDefaultConfiguration(string roundType)
    {
        return roundType switch
        {
            "phone_screening" => new { duration = 30, recordCall = false, requirePhone = true },
            "video_interview" => new { duration = 45, platform = "zoom", recordMeeting = true },
            "technical_assessment" => new { duration = 90, gradingSystem = new { passingScore = 70 } },
            "coding_challenge" => new { duration = 120, maxSubmissions = 3 },
            "behavioral_interview" => new { duration = 60, structuredInterview = true },
            "panel_interview" => new { duration = 90, minInterviewers = 2, maxInterviewers = 4 },
            "final_interview" => new { duration = 60, executiveInvolvement = true },
            "culture_fit" => new { duration = 45, focusAreas = new[] { "values", "team_fit" } },
            _ => new { duration = 30 }
        };
    }

    private static RoundConfigurationResponse MapToResponseDto(
        RoundConfiguration config,
        List<RoundQuestion> questions,
        List<RoundScoringCriteria> criteria)
    {
        // Convert JsonElement to object for serialization
        object configurationData;
        try
        {
            if (config.ConfigurationData.ValueKind == JsonValueKind.Undefined)
            {
                configurationData = new { };
            }
            else
            {
                configurationData = JsonSerializer.Deserialize<object>(config.ConfigurationData.GetRawText()) ?? new { };
            }
        }
        catch
        {
            configurationData = new { };
        }

        return new RoundConfigurationResponse
        {
            Id = config.Id,
            JobId = config.JobId,
            RoundId = config.RoundId,
            RoundType = config.RoundType,
            Name = config.Name,
            Description = config.Description,
            Duration = config.Duration,
            Status = config.Status,
            ConfigurationData = configurationData,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt,
            CreatedBy = config.CreatedBy,
            LastModifiedBy = config.LastModifiedBy,
            Version = config.Version,
            Questions = questions.Select(MapQuestionToDto).ToList(),
            ScoringCriteria = criteria.Select(MapCriteriaToDto).ToList()
        };
    }

    private static QuestionDto MapQuestionToDto(RoundQuestion question)
    {
        // Convert JsonElement to object for serialization
        object? metadata = null;
        if (question.Metadata.HasValue)
        {
            try
            {
                if (question.Metadata.Value.ValueKind != JsonValueKind.Undefined)
                {
                    metadata = JsonSerializer.Deserialize<object>(question.Metadata.Value.GetRawText());
                }
            }
            catch
            {
                metadata = null;
            }
        }

        return new QuestionDto
        {
            Id = question.Id,
            QuestionText = question.QuestionText,
            QuestionType = question.QuestionType,
            Category = question.Category,
            IsRequired = question.IsRequired,
            OrderIndex = question.OrderIndex,
            Metadata = metadata
        };
    }

    private static ScoringCriteriaDto MapCriteriaToDto(RoundScoringCriteria criteria)
    {
        return new ScoringCriteriaDto
        {
            Id = criteria.Id,
            Name = criteria.Name,
            Description = criteria.Description,
            Weight = criteria.Weight,
            MaxScore = criteria.MaxScore,
            ScoringType = criteria.ScoringType,
            IsRequired = criteria.IsRequired,
            OrderIndex = criteria.OrderIndex
        };
    }

    // Additional helper methods for remaining endpoints would go here...
    private static async Task<IResult> GetJobRoundConfigurations(
        Guid jobId,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = await GetUserCompanyId(client, userId.Value);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, jobId, companyId.Value))
                return Results.StatusCode(403);

            // Get all configurations for the job
            var configResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == jobId)
                .Get();

            var configs = configResponse.Models.ToList();
            var response = new ConfigurationListResponse
            {
                Success = true,
                Data = configs.Select(c => MapToResponseDto(c, new List<RoundQuestion>(), new List<RoundScoringCriteria>())).ToList(),
                Total = configs.Count,
                Page = 1,
                Limit = configs.Count
            };

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving job configurations: {ex.Message}");
        }
    }

    private static async Task<IResult> ValidateConfiguration(
        Guid jobId,
        Guid roundId,
        RoundConfigurationRequest request,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var errors = new List<string>();

            // Basic validation
            if (string.IsNullOrWhiteSpace(request.Name))
                errors.Add("Configuration name is required");

            if (request.Duration < 15 || request.Duration > 480)
                errors.Add("Duration must be between 15 and 480 minutes");

            // Additional validation logic can be added here

            return Results.Ok(new ConfigurationValidationResponse
            {
                Valid = errors.Count == 0,
                Errors = errors
            });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error validating configuration: {ex.Message}");
        }
    }

    private static async Task<IResult> CloneConfiguration(
        Guid jobId,
        Guid roundId,
        CloneConfigurationRequest request,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = await GetUserCompanyId(client, userId.Value);
            if (companyId == null) return Results.Unauthorized();

            // Verify both jobs belong to user's company
            if (!await VerifyJobAccess(client, jobId, companyId.Value) ||
                !await VerifyJobAccess(client, request.SourceJobId, companyId.Value))
                return Results.StatusCode(403);

            // Get source configuration
            var sourceResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == request.SourceJobId && rc.RoundId == request.SourceRoundId)
                .Get();

            var sourceConfig = sourceResponse.Models.FirstOrDefault();
            if (sourceConfig == null)
                return Results.NotFound("Source configuration not found");

            // Clone the configuration
            var clonedConfig = new RoundConfiguration
            {
                JobId = jobId,
                RoundId = roundId,
                RoundType = sourceConfig.RoundType,
                Name = sourceConfig.Name,
                Description = sourceConfig.Description,
                Duration = sourceConfig.Duration,
                Status = "draft",
                ConfigurationData = sourceConfig.ConfigurationData,
                CreatedBy = userId.Value,
                LastModifiedBy = userId.Value
            };

            var insertResponse = await client.From<RoundConfiguration>().Insert(clonedConfig);
            var insertedConfig = insertResponse.Models.FirstOrDefault();

            if (insertedConfig == null)
                return Results.Problem("Failed to clone configuration");

            var response = MapToResponseDto(insertedConfig, new List<RoundQuestion>(), new List<RoundScoringCriteria>());
            return Results.Ok(new { success = true, data = response });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error cloning configuration: {ex.Message}");
        }
    }
}

// Extension method for string title case
public static class StringExtensions
{
    public static string Title(this string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        return char.ToUpper(input[0]) + input.Substring(1).ToLower();
    }
}
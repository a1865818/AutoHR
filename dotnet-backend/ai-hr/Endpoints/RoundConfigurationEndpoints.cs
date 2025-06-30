using ai_hr.Models;
using ai_hr.Contracts.Interview;
using Supabase;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using System.Collections;

namespace ai_hr.Endpoints;

public static class RoundConfigurationEndpoints
{
    public static void MapRoundConfigurationEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api").WithTags("Round Configuration");

        // GET /api/jobs/{jobId}/rounds/{roundId}/configuration
        group.MapGet("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration",
            (Guid jobId, Guid roundId, Supabase.Client client, ClaimsPrincipal user, ILogger<Program> logger) =>
                GetRoundConfiguration(jobId, roundId, client, user, logger))
            .WithName("GetRoundConfiguration")
            .WithSummary("Get configuration for a specific round in a job")
            .RequireAuthorization();

        // PUT /api/jobs/{jobId}/rounds/{roundId}/configuration
        group.MapPut("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration", SaveRoundConfiguration)
            .WithName("SaveRoundConfiguration")
            .WithSummary("Save or update configuration for a specific round")
            .RequireAuthorization();

        // GET /api/jobs/{jobId}/rounds/{roundId}/configuration/debug
        group.MapGet("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration/debug", GetRawConfiguration)
            .WithName("GetRawConfiguration")
            .WithSummary("Get raw configuration data for debugging purposes")
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
        ClaimsPrincipal user,
        ILogger<Program> logger)
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

            // Log the configuration data before processing
            logger.LogInformation("Retrieved configuration ID: {Id} for job: {JobId}, round: {RoundId}",
                config.Id, jobId, roundId);

            if (config.ConfigurationData != null)
            {
                logger.LogInformation("Raw ConfigurationData has {Count} keys: {Keys}",
                    config.ConfigurationData.Count,
                    string.Join(", ", config.ConfigurationData.Keys));

                // Log details about questions and interviewers before processing
                if (config.ConfigurationData.TryGetValue("questions", out var rawQuestionsObj))
                {
                    logger.LogInformation("Raw Questions type: {Type}, Value preview: {Value}",
                        rawQuestionsObj?.GetType().Name,
                        rawQuestionsObj?.ToString()?.Substring(0, Math.Min(100, rawQuestionsObj.ToString()?.Length ?? 0)));
                }
                if (config.ConfigurationData.TryGetValue("interviewers", out var rawInterviewersObj))
                {
                    logger.LogInformation("Raw Interviewers type: {Type}, Value preview: {Value}",
                        rawInterviewersObj?.GetType().Name,
                        rawInterviewersObj?.ToString()?.Substring(0, Math.Min(100, rawInterviewersObj.ToString()?.Length ?? 0)));
                }
            }

            var response = MapToResponseDto(config, questionsResponse.Models, criteriaResponse.Models);

            // Log the final response data
            logger.LogInformation("Final response ConfigurationData type: {Type}",
                response.ConfigurationData?.GetType().Name);

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
        ClaimsPrincipal user,
        ILogger<Program> logger)
    {
        try
        {
            // Log the incoming request for debugging
            logger.LogInformation("SaveRoundConfiguration request received for jobId: {JobId}, roundId: {RoundId}", jobId, roundId);
            logger.LogInformation("Request data: Name: {Name}, Description: {Description}, Duration: {Duration}",
                request.Name, request.Description, request.Duration);

            // Process the configuration data if available
            Dictionary<string, object>? processedConfigData = null;
            if (request.ConfigurationData != null)
            {
                // We need to convert the incoming data to ensure we're not storing JsonElement objects
                processedConfigData = new Dictionary<string, object>();

                // Process each key in the dictionary
                foreach (var key in request.ConfigurationData.Keys)
                {
                    // Get the value and convert any JsonElement objects to their .NET equivalents
                    var value = request.ConfigurationData[key];
                    processedConfigData[key] = ConvertFromJsonElement(value);
                }

                logger.LogInformation("Processed ConfigurationData: {Count} keys", processedConfigData.Count);
                logger.LogInformation("ConfigurationData keys: {Keys}",
                    string.Join(", ", processedConfigData.Keys));
            }
            else
            {
                logger.LogWarning("ConfigurationData is null");
            }

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
                existing.ConfigurationData = processedConfigData;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.LastModifiedBy = userId.Value;
                existing.Version += 1;

                logger.LogInformation("Updating configuration with processed ConfigurationData");

                var updateResponse = await client.From<RoundConfiguration>().Update(existing);
                config = updateResponse.Models.FirstOrDefault()!;

                // Log the result after update
                logger.LogInformation("Configuration updated successfully. Config ID: {ConfigId}", config.Id);
                if (config.ConfigurationData != null)
                {
                    logger.LogInformation("Updated ConfigurationData: {Count} keys",
                        config.ConfigurationData.Count);
                }
            }
            else
            {
                // Create new configuration
                var roundResponse = await client.From<InterviewRound>()
                    .Where(r => r.Id == roundId)
                    .Get();

                var round = roundResponse.Models.FirstOrDefault();
                if (round == null) return Results.NotFound("Round not found");

                logger.LogInformation("Creating new config with processed ConfigurationData");

                config = new RoundConfiguration
                {
                    JobId = jobId,
                    RoundId = roundId,
                    RoundType = round.Type,
                    Name = request.Name,
                    Description = request.Description,
                    Duration = request.Duration,
                    Status = request.Status,
                    ConfigurationData = processedConfigData ?? new Dictionary<string, object>(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = userId.Value,
                    LastModifiedBy = userId.Value
                };

                var insertResponse = await client.From<RoundConfiguration>().Insert(config);
                config = insertResponse.Models.FirstOrDefault()!;
            }

            // Log the saved configuration
            logger.LogInformation("Configuration saved successfully with ID: {Id}", config.Id);
            if (config.ConfigurationData != null)
            {
                logger.LogInformation("Final ConfigurationData has {Count} keys: {Keys}",
                    config.ConfigurationData.Count,
                    string.Join(", ", config.ConfigurationData.Keys));

                // Log details about questions and interviewers if they exist
                if (config.ConfigurationData.TryGetValue("questions", out var questionsObj))
                {
                    logger.LogInformation("Questions found in ConfigurationData: {Type}, {Value}",
                        questionsObj?.GetType().Name,
                        questionsObj?.ToString()?.Substring(0, Math.Min(200, questionsObj.ToString()?.Length ?? 0)));
                }
                if (config.ConfigurationData.TryGetValue("interviewers", out var interviewersObj))
                {
                    logger.LogInformation("Interviewers found in ConfigurationData: {Type}, {Value}",
                        interviewersObj?.GetType().Name,
                        interviewersObj?.ToString()?.Substring(0, Math.Min(200, interviewersObj.ToString()?.Length ?? 0)));
                }
            }

            var response = MapToResponseDto(config, new List<RoundQuestion>(), new List<RoundScoringCriteria>());
            return Results.Ok(new { success = true, data = response });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error saving round configuration");
            return Results.Problem($"Error saving round configuration: {ex.Message}");
        }
    }

    // Helper method to convert JsonElement objects to .NET types
    private static object ConvertFromJsonElement(object value)
    {
        if (value is JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                JsonValueKind.Object => ConvertJsonElementObject(jsonElement),
                JsonValueKind.Array => ConvertJsonElementArray(jsonElement),
                JsonValueKind.String => jsonElement.GetString() ?? string.Empty,
                JsonValueKind.Number => jsonElement.TryGetInt64(out long l) ? l : jsonElement.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null => null,
                _ => null
            };
        }
        else if (value is Dictionary<string, JsonElement> jsonElementDict)
        {
            // Convert dictionary with JsonElement values
            var result = new Dictionary<string, object>();
            foreach (var kvp in jsonElementDict)
            {
                result[kvp.Key] = ConvertFromJsonElement(kvp.Value);
            }
            return result;
        }
        else if (value is IList list && list.Count > 0 && list[0] is JsonElement)
        {
            // Convert list of JsonElement values
            var result = new List<object>();
            foreach (var item in list)
            {
                result.Add(ConvertFromJsonElement(item));
            }
            return result;
        }

        return value; // Not a JsonElement, return as is
    }

    // NEW METHOD: Process configuration data retrieved from database
    private static Dictionary<string, object> ProcessRetrievedConfigurationData(Dictionary<string, object>? configData)
    {
        if (configData == null)
            return new Dictionary<string, object>();

        var processedData = new Dictionary<string, object>();

        foreach (var kvp in configData)
        {
            processedData[kvp.Key] = ConvertFromJsonElement(kvp.Value);
        }

        return processedData;
    }

    // TEST METHOD: Validate configuration data processing (for debugging)
    private static Dictionary<string, object> TestConfigurationDataProcessing(Dictionary<string, object> testData, ILogger logger)
    {
        logger.LogInformation("Testing configuration data processing with {Count} keys", testData.Count);

        foreach (var kvp in testData)
        {
            logger.LogInformation("Before processing - Key: {Key}, Type: {Type}, Value: {Value}",
                kvp.Key,
                kvp.Value?.GetType().Name ?? "null",
                kvp.Value?.ToString()?.Substring(0, Math.Min(50, kvp.Value?.ToString()?.Length ?? 0)) ?? "null");
        }

        var processed = ProcessRetrievedConfigurationData(testData);

        foreach (var kvp in processed)
        {
            logger.LogInformation("After processing - Key: {Key}, Type: {Type}, Value: {Value}",
                kvp.Key,
                kvp.Value?.GetType().Name ?? "null",
                kvp.Value?.ToString()?.Substring(0, Math.Min(50, kvp.Value?.ToString()?.Length ?? 0)) ?? "null");
        }

        return processed;
    }

    private static Dictionary<string, object> ConvertJsonElementObject(JsonElement element)
    {
        var result = new Dictionary<string, object>();
        foreach (var property in element.EnumerateObject())
        {
            result[property.Name] = ConvertFromJsonElement(property.Value);
        }
        return result;
    }

    private static List<object> ConvertJsonElementArray(JsonElement element)
    {
        var result = new List<object>();
        foreach (var item in element.EnumerateArray())
        {
            result.Add(ConvertFromJsonElement(item));
        }
        return result;
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
        var configDict = GetBasicDefaultConfiguration(roundType);

        var config = new RoundConfiguration
        {
            JobId = jobId,
            RoundId = roundId,
            RoundType = roundType,
            Name = $"{roundType.Replace("_", " ").Title()} Configuration",
            Description = $"Default configuration for {roundType}",
            Duration = 30,
            Status = "draft",
            ConfigurationData = configDict,
            CreatedBy = userId,
            LastModifiedBy = userId
        };

        var insertResponse = await client.From<RoundConfiguration>().Insert(config);
        return insertResponse.Models.First();
    }

    private static Dictionary<string, object> GetBasicDefaultConfiguration(string roundType)
    {
        // First create the anonymous object
        object defaultConfig = roundType switch
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

        // Convert it to Dictionary<string, object> using our helper methods
        var jsonString = System.Text.Json.JsonSerializer.Serialize(defaultConfig);
        var jsonDoc = JsonDocument.Parse(jsonString);
        return ConvertJsonElementObject(jsonDoc.RootElement);
    }

    private static RoundConfigurationResponse MapToResponseDto(
        RoundConfiguration config,
        List<RoundQuestion> questions,
        List<RoundScoringCriteria> criteria)
    {
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
            ConfigurationData = ProcessRetrievedConfigurationData(config.ConfigurationData),
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

    private static async Task<IResult> GetRawConfiguration(
        Guid jobId,
        Guid roundId,
        Supabase.Client client,
        ClaimsPrincipal user,
        ILogger<Program> logger)
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
                return Results.NotFound("Configuration not found");
            }

            // Return both raw and processed configuration data for comparison
            var processedConfigData = ProcessRetrievedConfigurationData(config.ConfigurationData);

            return Results.Ok(new
            {
                id = config.Id,
                jobId = config.JobId,
                roundId = config.RoundId,
                rawConfigurationData = config.ConfigurationData,
                processedConfigurationData = processedConfigData,
                comparison = new
                {
                    rawKeys = config.ConfigurationData?.Keys.ToList() ?? new List<string>(),
                    processedKeys = processedConfigData.Keys.ToList(),
                    rawQuestionsType = config.ConfigurationData?.TryGetValue("questions", out var rawQ) == true ? rawQ?.GetType().Name : "Not Found",
                    processedQuestionsType = processedConfigData.TryGetValue("questions", out var procQ) ? procQ?.GetType().Name : "Not Found",
                    rawInterviewersType = config.ConfigurationData?.TryGetValue("interviewers", out var rawI) == true ? rawI?.GetType().Name : "Not Found",
                    processedInterviewersType = processedConfigData.TryGetValue("interviewers", out var procI) ? procI?.GetType().Name : "Not Found"
                }
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving raw configuration data");
            return Results.Problem($"Error retrieving raw configuration data: {ex.Message}");
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
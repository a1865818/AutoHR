using ai_hr.Models;
using ai_hr.Contracts.Interview;
using ai_hr.Utils;
using Microsoft.AspNetCore.Mvc;
using Supabase;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using System.Collections;
using Newtonsoft.Json.Linq;
using ai_hr.Services;

namespace ai_hr.Endpoints;

public static class RoundConfigurationEndpoints
{
    public static void MapRoundConfigurationEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api").WithTags("Round Configuration");

        // GET /api/jobs/{jobId}/rounds/{roundId}/configuration
        group.MapGet("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration",
            (Guid jobId, Guid roundId, Supabase.Client client, ClaimsPrincipal user, [FromServices] ILogger logger) =>
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

        // POST /api/jobs/{jobId}/rounds/{roundId}/configuration/generate-meet-link
        group.MapPost("/jobs/{jobId:guid}/rounds/{roundId:guid}/configuration/generate-meet-link", GenerateMeetLink)
            .WithName("GenerateMeetLink")
            .WithSummary("Generate Google Meet link for video interview")
            .RequireAuthorization();

        // GET /api/google-calendar/auth-url
        group.MapGet("/google-calendar/auth-url",
            ([FromQuery] string redirectUri, Supabase.Client client, ClaimsPrincipal user, IGoogleCalendarService googleCalendarService, [FromServices] ILogger logger) =>
                GetGoogleCalendarAuthUrl(client, user, googleCalendarService, logger, redirectUri))
            .WithName("GetGoogleCalendarAuthUrl")
            .WithSummary("Get Google Calendar authorization URL")
            .RequireAuthorization();

        // POST /api/google-calendar/callback
        group.MapPost("/google-calendar/callback",
            ([FromBody] GoogleCalendarCallbackRequest request, Supabase.Client client, IGoogleCalendarService googleCalendarService, [FromServices] ILogger logger) =>
                HandleGoogleCalendarCallback(client, googleCalendarService, logger, request.Code, request.State, request.RedirectUri))
            .WithName("HandleGoogleCalendarCallback")
            .WithSummary("Handle Google Calendar OAuth callback");

        // GET /api/google-calendar/is-authorized
        group.MapGet("/google-calendar/is-authorized",
            (Supabase.Client client, ClaimsPrincipal user, IGoogleCalendarService googleCalendarService, [FromServices] ILogger logger) =>
                CheckGoogleCalendarAuthorization(client, user, googleCalendarService, logger))
            .WithName("CheckGoogleCalendarAuthorization")
            .WithSummary("Check if user is authorized for Google Calendar")
            .RequireAuthorization();

        // POST /api/google-calendar/revoke
        group.MapPost("/google-calendar/revoke",
            (Supabase.Client client, ClaimsPrincipal user, IGoogleCalendarService googleCalendarService, [FromServices] ILogger logger) =>
                RevokeGoogleCalendarAuthorization(client, user, googleCalendarService, logger))
            .WithName("RevokeGoogleCalendarAuthorization")
            .WithSummary("Revoke Google Calendar authorization")
            .RequireAuthorization();

        // POST /api/google-calendar/create-event
        group.MapPost("/google-calendar/create-event",
            ([FromBody] CreateEventRequest request, Supabase.Client client, ClaimsPrincipal user, IGoogleCalendarService googleCalendarService, [FromServices] ILogger logger) =>
                CreateGoogleCalendarEvent(client, user, googleCalendarService, logger, request))
            .WithName("CreateGoogleCalendarEvent")
            .WithSummary("Create a Google Calendar event with meeting details")
            .RequireAuthorization();

        // PUT /api/google-calendar/update-event
        group.MapPut("/google-calendar/update-event",
            ([FromBody] UpdateEventRequest request, Supabase.Client client, ClaimsPrincipal user, IGoogleCalendarService googleCalendarService, [FromServices] ILogger logger) =>
                UpdateGoogleCalendarEvent(client, user, googleCalendarService, logger, request))
            .WithName("UpdateGoogleCalendarEvent")
            .WithSummary("Update an existing Google Calendar event")
            .RequireAuthorization();

        // GET /api/jobs/{jobId}/rounds/{roundId}/candidates/{applicationId}/meeting-status
        group.MapGet("/jobs/{jobId:guid}/rounds/{roundId:guid}/candidates/{applicationId:guid}/meeting-status",
            (Guid jobId, Guid roundId, Guid applicationId, Supabase.Client client, ClaimsPrincipal user, [FromServices] ILogger logger) =>
                GetCandidateMeetingStatus(jobId, roundId, applicationId, client, user, logger))
            .WithName("GetCandidateMeetingStatus")
            .WithSummary("Check if a candidate has a scheduled meeting for a specific round")
            .RequireAuthorization();

        // GET /api/jobs/{jobId}/rounds/{roundId}/candidates/{applicationId}/meeting-details
        group.MapGet("/jobs/{jobId:guid}/rounds/{roundId:guid}/candidates/{applicationId:guid}/meeting-details",
            (Guid jobId, Guid roundId, Guid applicationId, Supabase.Client client, ClaimsPrincipal user, [FromServices] ILogger logger) =>
                GetCandidateMeetingDetails(jobId, roundId, applicationId, client, user, logger))
            .WithName("GetCandidateMeetingDetails")
            .WithSummary("Get detailed meeting information for a specific candidate and round")
            .RequireAuthorization();
    }

    private static async Task<IResult> GetRoundConfiguration(
        Guid jobId,
        Guid roundId,
        Supabase.Client client,
        ClaimsPrincipal user,
        [FromServices] ILogger logger)
    {
        try
        {
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            logger.LogInformation("GetRoundConfiguration: UserId={UserId}, JobId={JobId}, RoundId={RoundId}", 
                userId.Value, jobId, roundId);

            // Check if user is a hiring user (has company access)
            var companyId = GetUserCompanyId(user, logger);
            
            logger.LogInformation("GetRoundConfiguration: CompanyId={CompanyId} for UserId={UserId}", 
                companyId, userId.Value);

            if (companyId != null)
            {
                // Hiring user - verify job belongs to user's company
                if (!await VerifyJobAccess(client, jobId, companyId.Value))
                    return Results.StatusCode(403);
            }
            else
            {
                // Check if user is the job creator (fallback for hiring users without proper profile)
                var jobResponse = await client.From<Job>().Where(j => j.Id == jobId).Get();
                var job = jobResponse.Models.FirstOrDefault();
                
                if (job?.CreatedBy == userId.Value)
                {
                    // User created this job, allow access
                    logger.LogInformation("Access granted to job creator: {UserId} for job: {JobId}", userId.Value, jobId);
                }
                else
                {
                    // Applicant user - verify they have applied to this job
                    if (!await VerifyApplicantJobAccess(client, jobId, userId.Value))
                    {
                        logger.LogWarning("Access denied: User {UserId} is not a hiring user for job {JobId} and has not applied", userId.Value, jobId);
                        return Results.StatusCode(403);
                    }
                }
            }

            // Get round configuration
            var configResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == jobId && rc.RoundId == roundId)
                .Get();

            // BUG: configuration_data returns as nested emoty array for some reasons 

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

            // Get Google Calendar event information if available
            GoogleCalendarEvent? calendarEvent = null;
            if (config.GoogleCalendarEventId.HasValue)
            {
                var calendarEventResponse = await client.From<GoogleCalendarEvent>()
                    .Where(e => e.Id == config.GoogleCalendarEventId.Value)
                    .Get();
                calendarEvent = calendarEventResponse.Models.FirstOrDefault();
            }

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

            var response = MapToResponseDto(config, questionsResponse.Models, criteriaResponse.Models, calendarEvent);

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
        [FromServices] ILogger logger)
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

            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
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
        if (value is JArray jArray)
        {
            var list = new List<object>();
            foreach (var item in jArray)
            {
                list.Add(ConvertFromJsonElement(item));
            }
            return list;
        }
        else if (value is JObject jObject)
        {
            var dict = new Dictionary<string, object>();
            foreach (var prop in jObject.Properties())
            {
                dict[prop.Name] = ConvertFromJsonElement(prop.Value);
            }
            return dict;
        }
        else if (value is JValue jValue)
        {
            return jValue.Value;
        }
        else if (value is JsonElement jsonElement)
        {
            switch (jsonElement.ValueKind)
            {
                case JsonValueKind.Object:
                    return ConvertJsonElementObject(jsonElement);
                case JsonValueKind.Array:
                    return ConvertJsonElementArray(jsonElement);
                case JsonValueKind.String:
                    return jsonElement.GetString() ?? string.Empty;
                case JsonValueKind.Number:
                    return jsonElement.TryGetInt64(out long l) ? l : jsonElement.GetDouble();
                case JsonValueKind.True:
                    return true;
                case JsonValueKind.False:
                    return false;
                case JsonValueKind.Null:
                    return null;
                default:
                    return null;
            }
        }
        else if (value is Dictionary<string, object> dict)
        {
            var result = new Dictionary<string, object>();
            foreach (var kvp in dict)
            {
                result[kvp.Key] = ConvertFromJsonElement(kvp.Value);
            }
            return result;
        }
        else if (value is IList list)
        {
            var result = new List<object>();
            foreach (var item in list)
            {
                result.Add(ConvertFromJsonElement(item));
            }
            return result;
        }
        return value;
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
            var userId = GetMigratedUserId(user);
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
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
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

    private static Guid? GetUserCompanyId(ClaimsPrincipal user, ILogger logger = null)
    {
        // Check JWT claims for company_id in user_metadata first
        var userMetadataClaim = user.FindFirst("user_metadata")?.Value;
        if (!string.IsNullOrEmpty(userMetadataClaim))
        {
            try
            {
                var userMetadata = JsonDocument.Parse(userMetadataClaim);
                if (userMetadata.RootElement.TryGetProperty("company_id", out var companyIdElement))
                {
                    var companyIdStr = companyIdElement.GetString();
                    if (companyIdStr != null && Guid.TryParse(companyIdStr, out var companyId))
                    {
                        logger?.LogInformation("Found company_id in user_metadata: {CompanyId}", companyId);
                        return companyId;
                    }
                }
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "Error parsing user_metadata JSON: {UserMetadata}", userMetadataClaim);
            }
        }

        // Fallback: Check for direct company_id claim
        var companyIdClaim = user.FindFirst("company_id")?.Value;
        if (companyIdClaim != null && Guid.TryParse(companyIdClaim, out var companyIdFromJwt))
        {
            logger?.LogInformation("Found company_id in direct claims: {CompanyId}", companyIdFromJwt);
            return companyIdFromJwt;
        }

        logger?.LogWarning("No company_id found in claims");
        return null;
    }

    private static Guid? GetMigratedUserId(ClaimsPrincipal user)
    {
        // Use UserIdExtractor to get database user ID from JWT metadata
        var userId = UserIdExtractor.ExtractUserId(user);
        if (userId != null && Guid.TryParse(userId, out var userGuid))
        {
            return userGuid;
        }

        return null;
    }

    private static async Task<bool> VerifyJobAccess(Supabase.Client client, Guid jobId, Guid companyId)
    {
        var jobResponse = await client.From<Job>().Where(j => j.Id == jobId).Get();
        var job = jobResponse.Models.FirstOrDefault();
        return job?.CompanyId == companyId;
    }

    private static async Task<bool> VerifyApplicantJobAccess(Supabase.Client client, Guid jobId, Guid userId)
    {
        // Check if the applicant has applied to this job
        var applicationResponse = await client.From<ApplicationDetail>()
            .Where(ad => ad.JobId == jobId && ad.CandidateUserId == userId)
            .Get();

        return applicationResponse.Models.Any();
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
            "video_interview" => new { duration = 45, platform = "meet", recordMeeting = true },
            "technical_assessment" => new { duration = 90, gradingSystem = new { passingScore = 70 } },
            "coding_challenge" => new { duration = 120, maxSubmissions = 3 },
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
        List<RoundScoringCriteria> criteria,
        GoogleCalendarEvent? calendarEvent = null)
    {
        var response = new RoundConfigurationResponse
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

        // Add meeting information if available
        if (calendarEvent != null)
        {
            response.MeetingScheduled = true;
            response.MeetingData = new MeetingData
            {
                MeetLink = calendarEvent.MeetLink,
                EventId = calendarEvent.EventId,
                CalendarEventId = calendarEvent.Id,
                ApplicationId = calendarEvent.ApplicationId,
                Summary = calendarEvent.Summary,
                StartTime = calendarEvent.StartTime,
                EndTime = calendarEvent.EndTime,
                Timezone = calendarEvent.Timezone,
                Attendees = calendarEvent.Attendees,
                Status = calendarEvent.Status
            };
        }
        else if (config.ConfigurationData != null &&
                 config.ConfigurationData.TryGetValue("meetingScheduled", out var meetingScheduled) &&
                 meetingScheduled is bool isScheduled && isScheduled)
        {
            // Fallback to configuration data if calendar event not found
            response.MeetingScheduled = true;
            response.MeetingData = new MeetingData
            {
                MeetLink = config.ConfigurationData.TryGetValue("meetLink", out var meetLink) ? meetLink?.ToString() : null,
                EventId = config.ConfigurationData.TryGetValue("eventId", out var eventId) ? eventId?.ToString() : null,
                CalendarEventId = config.GoogleCalendarEventId,
                ApplicationId = config.ConfigurationData.TryGetValue("applicationId", out var applicationId) && applicationId is Guid aId ? aId : null,
                Summary = config.ConfigurationData.TryGetValue("meetingTitle", out var title) ? title?.ToString() : null,
                StartTime = config.ConfigurationData.TryGetValue("scheduledAt", out var scheduledAt) && scheduledAt is DateTime startTime ? startTime : DateTime.UtcNow,
                EndTime = config.ConfigurationData.TryGetValue("scheduledAt", out var endTime) && endTime is DateTime end ? end : DateTime.UtcNow,
                Timezone = "UTC",
                Attendees = config.ConfigurationData.TryGetValue("attendeeEmail", out var attendee) && attendee is string email ? new string[] { email } : null,
                Status = "confirmed"
            };
        }

        return response;
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
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
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
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
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
        [FromServices] ILogger logger)
    {
        try
        {
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
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

            // Log the raw data immediately after fetching
            logger.LogInformation("Raw ConfigurationData: {Raw}", JsonSerializer.Serialize(config.ConfigurationData));
            logger.LogInformation("Type of ConfigurationData: {Type}", config.ConfigurationData?.GetType().FullName);
            if (config.ConfigurationData != null && config.ConfigurationData.ContainsKey("questions"))
            {
                logger.LogInformation("Type of questions: {Type}", config.ConfigurationData["questions"]?.GetType().FullName);
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

    private static async Task<IResult> GenerateMeetLink(
        Guid jobId,
        Guid roundId,
        Supabase.Client client,
        ClaimsPrincipal user,
        IGoogleCalendarService googleCalendarService,
        [FromServices] ILogger logger)
    {
        try
        {
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, jobId, companyId.Value))
                return Results.StatusCode(403);

            // Get round configuration
            var configResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == jobId && rc.RoundId == roundId)
                .Get();

            var config = configResponse.Models.FirstOrDefault();
            if (config == null) return Results.NotFound("Configuration not found");

            // Debug: Log the configuration data
            logger.LogInformation("GenerateMeetLink - Configuration data: {ConfigData}",
                config.ConfigurationData != null ? string.Join(", ", config.ConfigurationData.Select(kv => $"{kv.Key}={kv.Value}")) : "null");

            // Check if this is a video interview configuration with "meet" platform
            if (config.ConfigurationData == null)
            {
                logger.LogWarning("GenerateMeetLink - Configuration data is null");
                return Results.BadRequest("Configuration data is missing. Please save the video interview configuration first before generating a Meet link.");
            }

            if (!config.ConfigurationData.TryGetValue("platform", out var platformObj))
            {
                logger.LogWarning("GenerateMeetLink - Platform not found in configuration data");
                return Results.BadRequest("Platform not configured. Please save the video interview configuration first, then set the platform to 'Google Meet' and save again before generating a Meet link.");
            }

            var platform = platformObj?.ToString()?.ToLower();
            logger.LogInformation("GenerateMeetLink - Platform value: {Platform}", platform);

            // Track if migration occurred for the response message
            var migrationOccurred = false;

            // Handle migration from "zoom" to "meet" for existing configurations
            if (platform == "zoom")
            {
                logger.LogInformation("GenerateMeetLink - Migrating platform from 'zoom' to 'meet' for existing configuration");

                // Update the configuration to use "meet" platform
                config.ConfigurationData["platform"] = "meet";
                config.UpdatedAt = DateTime.UtcNow;
                config.LastModifiedBy = userId.Value;

                // Save the updated configuration
                var migrationResponse = await client.From<RoundConfiguration>().Update(config);
                var migratedConfig = migrationResponse.Models.FirstOrDefault();

                if (migratedConfig != null)
                {
                    logger.LogInformation("GenerateMeetLink - Successfully migrated platform to 'meet' and saved configuration");
                }
                else
                {
                    logger.LogWarning("GenerateMeetLink - Failed to save migrated configuration, but continuing with 'meet' platform");
                }

                platform = "meet";
                migrationOccurred = true;
                logger.LogInformation("GenerateMeetLink - Successfully migrated platform to 'meet'");
            }

            // Check if the platform supports Google Meet link generation
            var supportedPlatforms = new[] { "meet", "google meet", "google-meet" };
            if (!supportedPlatforms.Contains(platform))
            {
                logger.LogWarning("GenerateMeetLink - Platform '{Platform}' does not support Google Meet link generation", platform);
                return Results.BadRequest($"This configuration is not set to use Google Meet. Current platform: '{platform}'. Supported platforms for Meet link generation: Google Meet. Please go to the video interview configuration and change the platform to 'Google Meet', then save the configuration before generating a Meet link.");
            }

            // Get user email for impersonation
            var userResponse = await client.From<HiringUserProfile>()
                .Where(u => u.Id == userId.Value)
                .Get();

            var hiringUser = userResponse.Models.FirstOrDefault();
            if (hiringUser == null) return Results.NotFound("User not found");

            // Get job details for event title
            var jobResponse = await client.From<Job>()
                .Where(j => j.Id == jobId)
                .Get();

            var job = jobResponse.Models.FirstOrDefault();
            if (job == null) return Results.NotFound("Job not found");

            // Get round details for event title
            var roundResponse = await client.From<InterviewRound>()
                .Where(r => r.Id == roundId)
                .Get();

            var round = roundResponse.Models.FirstOrDefault();
            if (round == null) return Results.NotFound("Round not found");

            // Get scheduling information from configuration
            DateTime startTime = DateTime.UtcNow.AddDays(1); // Default to tomorrow
            DateTime endTime = startTime.AddMinutes(config.Duration);
            string timezone = "UTC";
            string[]? attendees = null;

            // Extract scheduling details from configuration
            if (config.ConfigurationData.TryGetValue("schedule", out var scheduleObj) &&
                scheduleObj is Dictionary<string, object> scheduleData)
            {
                // Try to get timezone
                if (scheduleData.TryGetValue("timezone", out var tzObj))
                {
                    timezone = tzObj?.ToString() ?? "UTC";
                }

                // Try to get time slots
                if (scheduleData.TryGetValue("timeSlots", out var slotsObj) &&
                    slotsObj is List<object> slots && slots.Count > 0)
                {
                    // Use first time slot for the event
                    if (slots[0] is Dictionary<string, object> firstSlot)
                    {
                        if (firstSlot.TryGetValue("startTime", out var startObj))
                        {
                            // For simplicity, we'll use tomorrow at the specified time
                            var timeStr = startObj?.ToString();
                            if (!string.IsNullOrEmpty(timeStr))
                            {
                                if (TimeSpan.TryParse(timeStr, out var time))
                                {
                                    startTime = DateTime.Today.AddDays(1).Add(time);
                                    endTime = startTime.AddMinutes(config.Duration);
                                }
                            }
                        }
                    }
                }
            }

            // Generate event title
            var eventTitle = $"{job.Title} - {round.Name} Interview";

            // Check if user is authorized for Google Calendar
            var isAuthorized = await googleCalendarService.IsUserAuthorizedAsync(userId.Value.ToString());
            if (!isAuthorized)
            {
                logger.LogWarning("GenerateMeetLink - User {UserId} is not authorized for Google Calendar", userId.Value);
                return Results.BadRequest("User is not authorized for Google Calendar access. Please authorize Google Calendar first.");
            }

            logger.LogInformation("GenerateMeetLink - Creating Google Calendar event for user {UserId}", userId.Value);

            // Create Google Calendar event with Meet link
            var googleEvent = await googleCalendarService.CreateMeetEventAsync(
                eventTitle,
                $"Google Meet interview for {job.Title} - {round.Name}",
                startTime,
                endTime,
                timezone,
                attendees,
                userId.Value.ToString());

            // Save the Google Calendar event reference in the round configuration
            config.GoogleCalendarEventId = googleEvent.Id;
            config.UpdatedAt = DateTime.UtcNow;
            config.LastModifiedBy = userId.Value;

            var updateResponse = await client.From<RoundConfiguration>().Update(config);
            var updatedConfig = updateResponse.Models.FirstOrDefault()!;

            logger.LogInformation("GenerateMeetLink - Successfully created Google Calendar event with Meet link: {MeetLink}", googleEvent.MeetLink);

            // Return the Meet link
            return Results.Ok(new
            {
                success = true,
                data = new
                {
                    meetLink = googleEvent.MeetLink,
                    eventId = googleEvent.EventId,
                    calendarEventId = googleEvent.Id
                },
                message = migrationOccurred
                    ? "Google Meet link generated successfully. Your platform configuration was automatically migrated from Zoom to Google Meet."
                    : "Google Meet link generated successfully"
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error generating Google Meet link");
            return Results.Problem($"Error generating Google Meet link: {ex.Message}");
        }
    }

    /// <summary>
    /// Gets the Google Calendar authorization URL for the current user
    /// </summary>
    public static async Task<IResult> GetGoogleCalendarAuthUrl(
        Supabase.Client client,
        ClaimsPrincipal user,
        IGoogleCalendarService googleCalendarService,
        [FromServices] ILogger logger,
        string redirectUri)
    {
        try
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            var authUrl = await googleCalendarService.GetAuthorizationUrlAsync(userId, redirectUri);

            return Results.Ok(new
            {
                success = true,
                data = new
                {
                    authorizationUrl = authUrl
                }
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting Google Calendar authorization URL");
            return Results.Problem($"Error getting authorization URL: {ex.Message}");
        }
    }

    /// <summary>
    /// Handles the Google Calendar OAuth callback
    /// </summary>
    public static async Task<IResult> HandleGoogleCalendarCallback(
        Supabase.Client client,
        IGoogleCalendarService googleCalendarService,
        [FromServices] ILogger logger,
        string code,
        string state,
        string redirectUri)
    {
        try
        {
            logger.LogInformation("Google Calendar callback received - Code: {CodeLength}, State: {State}",
                code?.Length ?? 0, state);

            if (string.IsNullOrEmpty(state))
            {
                logger.LogWarning("No state parameter provided");
                return Results.BadRequest("Invalid state parameter");
            }

            // The state parameter should contain the user ID
            var userId = state;
            logger.LogInformation("Processing Google Calendar callback for user: {UserId}", userId);

            var success = await googleCalendarService.HandleAuthCallbackAsync(userId, code, redirectUri);

            if (success)
            {
                logger.LogInformation("Google Calendar authorization successful for user: {UserId}", userId);
                return Results.Ok(new
                {
                    success = true,
                    message = "Google Calendar authorization successful"
                });
            }
            else
            {
                logger.LogWarning("Google Calendar authorization failed for user: {UserId}", userId);
                return Results.BadRequest(new
                {
                    success = false,
                    message = "Failed to authorize Google Calendar access"
                });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error handling Google Calendar callback");
            return Results.Problem($"Error handling callback: {ex.Message}");
        }
    }

    /// <summary>
    /// Checks if the current user is authorized for Google Calendar access
    /// </summary>
    public static async Task<IResult> CheckGoogleCalendarAuthorization(
        Supabase.Client client,
        ClaimsPrincipal user,
        IGoogleCalendarService googleCalendarService,
        [FromServices] ILogger logger)
    {
        try
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            var isAuthorized = await googleCalendarService.IsUserAuthorizedAsync(userId);

            return Results.Ok(new
            {
                success = true,
                data = new
                {
                    isAuthorized = isAuthorized
                }
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error checking Google Calendar authorization");
            return Results.Problem($"Error checking authorization: {ex.Message}");
        }
    }

    /// <summary>
    /// Revokes Google Calendar authorization for the current user
    /// </summary>
    public static async Task<IResult> RevokeGoogleCalendarAuthorization(
        Supabase.Client client,
        ClaimsPrincipal user,
        IGoogleCalendarService googleCalendarService,
        [FromServices] ILogger logger)
    {
        try
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            await googleCalendarService.RevokeAuthorizationAsync(userId);

            return Results.Ok(new
            {
                success = true,
                message = "Google Calendar authorization revoked successfully"
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error revoking Google Calendar authorization");
            return Results.Problem($"Error revoking authorization: {ex.Message}");
        }
    }

    /// <summary>
    /// Creates a new Google Calendar event with meeting details.
    /// </summary>
    public static async Task<IResult> CreateGoogleCalendarEvent(
        Supabase.Client client,
        ClaimsPrincipal user,
        IGoogleCalendarService googleCalendarService,
        [FromServices] ILogger logger,
        CreateEventRequest request)
    {
        try
        {
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, request.JobId, companyId.Value))
                return Results.StatusCode(403);

            // Get round configuration
            var configResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == request.JobId && rc.RoundId == request.RoundId)
                .Get();

            var config = configResponse.Models.FirstOrDefault();
            if (config == null) return Results.NotFound("Round configuration not found");

            // Check if user is authorized for Google Calendar
            var isAuthorized = await googleCalendarService.IsUserAuthorizedAsync(userId.Value.ToString());
            if (!isAuthorized)
            {
                logger.LogWarning("CreateGoogleCalendarEvent - User {UserId} is not authorized for Google Calendar", userId.Value);
                return Results.BadRequest("User is not authorized for Google Calendar access. Please authorize Google Calendar first.");
            }

            // Generate event title
            var jobResponse = await client.From<Job>()
                .Where(j => j.Id == request.JobId)
                .Get();
            var job = jobResponse.Models.FirstOrDefault();
            if (job == null) return Results.NotFound("Job not found");

            var roundResponse = await client.From<InterviewRound>()
                .Where(r => r.Id == request.RoundId)
                .Get();
            var round = roundResponse.Models.FirstOrDefault();
            if (round == null) return Results.NotFound("Round not found");

            var eventTitle = $"{job.Title} - {round.Name} Interview";

            // Get scheduling information from request
            DateTime startTime = DateTime.UtcNow.AddDays(1); // Default fallback
            DateTime endTime = startTime.AddMinutes(config.Duration);
            string timezone = "UTC";

            // Parse the date and time from the request
            if (!string.IsNullOrEmpty(request.Date) && !string.IsNullOrEmpty(request.Time))
            {
                try
                {
                    // Parse the date (YYYY-MM-DD format)
                    if (DateTime.TryParse(request.Date, out var parsedDate))
                    {
                        // Parse the time (HH:MM format)
                        if (TimeSpan.TryParse(request.Time, out var parsedTime))
                        {
                            // Combine date and time
                            startTime = parsedDate.Add(parsedTime);

                            // Use the duration from the request, or fall back to config duration
                            var meetingDuration = request.Duration > 0 ? request.Duration : config.Duration;
                            endTime = startTime.AddMinutes(meetingDuration);

                            logger.LogInformation("CreateGoogleCalendarEvent - Parsed meeting time: {StartTime} to {EndTime} (duration: {Duration} minutes)",
                                startTime, endTime, meetingDuration);
                        }
                        else
                        {
                            logger.LogWarning("CreateGoogleCalendarEvent - Failed to parse time: {Time}", request.Time);
                        }
                    }
                    else
                    {
                        logger.LogWarning("CreateGoogleCalendarEvent - Failed to parse date: {Date}", request.Date);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "CreateGoogleCalendarEvent - Error parsing date/time: Date={Date}, Time={Time}", request.Date, request.Time);
                }
            }
            else
            {
                logger.LogWarning("CreateGoogleCalendarEvent - Missing date or time in request: Date={Date}, Time={Time}", request.Date, request.Time);
            }

            // Use the title from the request, or generate a default one
            var finalEventTitle = !string.IsNullOrEmpty(request.Title) ? request.Title : eventTitle;

            // Prepare attendees list
            string[]? attendees = null;
            if (!string.IsNullOrEmpty(request.AttendeeEmail))
            {
                attendees = new string[] { request.AttendeeEmail };
                logger.LogInformation("CreateGoogleCalendarEvent - Adding attendee: {AttendeeEmail}", request.AttendeeEmail);
            }

            // Create Google Calendar event with Meet link
            var googleEvent = await googleCalendarService.CreateMeetEventAsync(
                finalEventTitle,
                $"Google Meet interview for {job.Title} - {round.Name}",
                startTime,
                endTime,
                timezone,
                attendees,
                userId.Value.ToString());

            // Create GoogleCalendarEvent record in database
            var calendarEventRecord = new GoogleCalendarEvent
            {
                RoundConfigurationId = config.Id,
                ApplicationId = request.ApplicationId,
                EventId = googleEvent.EventId,
                Summary = finalEventTitle,
                Description = $"Google Meet interview for {job.Title} - {round.Name}",
                StartTime = startTime,
                EndTime = endTime,
                Timezone = timezone,
                MeetLink = googleEvent.MeetLink,
                ConferenceId = googleEvent.ConferenceId,
                EntryPoints = googleEvent.EntryPoints,
                Attendees = attendees,
                Status = "confirmed",
                CreatedBy = userId.Value,
                LastModifiedBy = userId.Value
            };

            var calendarEventResponse = await client.From<GoogleCalendarEvent>().Insert(calendarEventRecord);
            var savedCalendarEvent = calendarEventResponse.Models.FirstOrDefault();

            if (savedCalendarEvent == null)
            {
                logger.LogError("CreateGoogleCalendarEvent - Failed to save GoogleCalendarEvent record to database");
                return Results.Problem("Failed to save meeting record to database");
            }

            // Update round configuration with meeting information
            config.GoogleCalendarEventId = savedCalendarEvent.Id;
            config.UpdatedAt = DateTime.UtcNow;
            config.LastModifiedBy = userId.Value;

            // Update configuration data to include meeting information
            var configData = config.ConfigurationData ?? new Dictionary<string, object>();
            configData["meetingScheduled"] = true;
            configData["meetingTitle"] = finalEventTitle;
            configData["meetingDate"] = request.Date;
            configData["meetingTime"] = request.Time;
            configData["meetingDuration"] = request.Duration > 0 ? request.Duration : config.Duration;
            configData["meetLink"] = googleEvent.MeetLink;
            configData["eventId"] = googleEvent.EventId;
            configData["calendarEventId"] = savedCalendarEvent.Id;
            configData["applicationId"] = request.ApplicationId;
            configData["scheduledAt"] = DateTime.UtcNow;

            config.ConfigurationData = configData;

            var updateResponse = await client.From<RoundConfiguration>().Update(config);
            var updatedConfig = updateResponse.Models.FirstOrDefault()!;

            logger.LogInformation("CreateGoogleCalendarEvent - Successfully created Google Calendar event with Meet link: {MeetLink}", googleEvent.MeetLink);

            return Results.Ok(new
            {
                success = true,
                data = new
                {
                    meetLink = googleEvent.MeetLink,
                    eventId = googleEvent.EventId,
                    calendarEventId = savedCalendarEvent.Id,
                    meetingTitle = finalEventTitle,
                    meetingDate = request.Date,
                    meetingTime = request.Time,
                    meetingDuration = request.Duration > 0 ? request.Duration : config.Duration,
                    startTime = startTime,
                    endTime = endTime,
                    timezone = timezone,
                    attendeeEmail = request.AttendeeEmail,
                    applicationId = request.ApplicationId,
                    scheduledAt = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating Google Calendar event");
            return Results.Problem($"Error creating Google Calendar event: {ex.Message}");
        }
    }

    /// <summary>
    /// Updates an existing Google Calendar event.
    /// </summary>
    public static async Task<IResult> UpdateGoogleCalendarEvent(
        Supabase.Client client,
        ClaimsPrincipal user,
        IGoogleCalendarService googleCalendarService,
        [FromServices] ILogger logger,
        UpdateEventRequest request)
    {
        try
        {
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, request.JobId, companyId.Value))
                return Results.StatusCode(403);

            // Get round configuration
            var configResponse = await client.From<RoundConfiguration>()
                .Where(rc => rc.JobId == request.JobId && rc.RoundId == request.RoundId)
                .Get();

            var config = configResponse.Models.FirstOrDefault();
            if (config == null) return Results.NotFound("Round configuration not found");

            // Check if user is authorized for Google Calendar
            var isAuthorized = await googleCalendarService.IsUserAuthorizedAsync(userId.Value.ToString());
            if (!isAuthorized)
            {
                logger.LogWarning("UpdateGoogleCalendarEvent - User {UserId} is not authorized for Google Calendar", userId.Value);
                return Results.BadRequest("User is not authorized for Google Calendar access. Please authorize Google Calendar first.");
            }

            // Get the existing Google Calendar event ID
            var existingEventId = config.GoogleCalendarEventId?.ToString();
            if (string.IsNullOrEmpty(existingEventId))
            {
                logger.LogWarning("UpdateGoogleCalendarEvent - No existing Google Calendar event ID found for configuration ID: {ConfigId}", config.Id);
                return Results.BadRequest("No existing Google Calendar event found for this configuration. Please create a new one first.");
            }

            // Get scheduling information from request
            DateTime startTime = DateTime.UtcNow.AddDays(1); // Default fallback
            DateTime endTime = startTime.AddMinutes(config.Duration);
            string timezone = "UTC";

            // Parse the date and time from the request
            if (!string.IsNullOrEmpty(request.Date) && !string.IsNullOrEmpty(request.Time))
            {
                try
                {
                    // Parse the date (YYYY-MM-DD format)
                    if (DateTime.TryParse(request.Date, out var parsedDate))
                    {
                        // Parse the time (HH:MM format)
                        if (TimeSpan.TryParse(request.Time, out var parsedTime))
                        {
                            // Combine date and time
                            startTime = parsedDate.Add(parsedTime);

                            // Use the duration from the request, or fall back to config duration
                            var meetingDuration = request.Duration > 0 ? request.Duration : config.Duration;
                            endTime = startTime.AddMinutes(meetingDuration);

                            logger.LogInformation("UpdateGoogleCalendarEvent - Parsed meeting time: {StartTime} to {EndTime} (duration: {Duration} minutes)",
                                startTime, endTime, meetingDuration);
                        }
                        else
                        {
                            logger.LogWarning("UpdateGoogleCalendarEvent - Failed to parse time: {Time}", request.Time);
                        }
                    }
                    else
                    {
                        logger.LogWarning("UpdateGoogleCalendarEvent - Failed to parse date: {Date}", request.Date);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "UpdateGoogleCalendarEvent - Error parsing date/time: Date={Date}, Time={Time}", request.Date, request.Time);
                }
            }
            else
            {
                logger.LogWarning("UpdateGoogleCalendarEvent - Missing date or time in request: Date={Date}, Time={Time}", request.Date, request.Time);
            }

            // Use the title from the request, or generate a default one
            var eventTitle = !string.IsNullOrEmpty(request.Title) ? request.Title : $"Updated meeting for {request.JobId}";

            // Prepare attendees list
            string[]? attendees = null;
            if (!string.IsNullOrEmpty(request.AttendeeEmail))
            {
                attendees = new string[] { request.AttendeeEmail };
                logger.LogInformation("UpdateGoogleCalendarEvent - Adding attendee: {AttendeeEmail}", request.AttendeeEmail);
            }

            // Update Google Calendar event with Meet link
            var googleEvent = await googleCalendarService.UpdateMeetEventAsync(
                existingEventId,
                "primary", // Use primary calendar
                eventTitle,
                request.Description,
                startTime,
                endTime,
                timezone,
                attendees,
                userId.Value.ToString());

            // Save the Google Calendar event reference in the round configuration
            config.GoogleCalendarEventId = googleEvent.Id;
            config.UpdatedAt = DateTime.UtcNow;
            config.LastModifiedBy = userId.Value;

            var updateResponse = await client.From<RoundConfiguration>().Update(config);
            var updatedConfig = updateResponse.Models.FirstOrDefault()!;

            logger.LogInformation("UpdateGoogleCalendarEvent - Successfully updated Google Calendar event with Meet link: {MeetLink}", googleEvent.MeetLink);

            return Results.Ok(new
            {
                success = true,
                data = new
                {
                    meetLink = googleEvent.MeetLink,
                    eventId = googleEvent.EventId,
                    calendarEventId = googleEvent.Id
                }
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating Google Calendar event");
            return Results.Problem($"Error updating Google Calendar event: {ex.Message}");
        }
    }

    private static async Task<IResult> GetCandidateMeetingStatus(
        Guid jobId,
        Guid roundId,
        Guid applicationId,
        Supabase.Client client,
        ClaimsPrincipal user,
        [FromServices] ILogger logger)
    {
        try
        {
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, jobId, companyId.Value))
                return Results.StatusCode(403);

            // Get the Google Calendar event for the candidate
            try
            {
                var calendarEventResponse = await client.From<GoogleCalendarEvent>()
                    .Where(e => e.ApplicationId == applicationId)
                    .Get();

                var calendarEvent = calendarEventResponse.Models.FirstOrDefault();

                if (calendarEvent == null)
                {
                    return Results.Ok(new { success = true, data = new { hasMeeting = false } });
                }

                // Check if the event is in the past
                if (calendarEvent.StartTime < DateTime.UtcNow)
                {
                    return Results.Ok(new { success = true, data = new { hasMeeting = false } });
                }

                return Results.Ok(new
                {
                    success = true,
                    data = new
                    {
                        hasMeeting = true,
                        meetLink = calendarEvent.MeetLink,
                        startTime = calendarEvent.StartTime,
                        endTime = calendarEvent.EndTime,
                        summary = calendarEvent.Summary
                    }
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting candidate meeting status");
                return Results.Problem($"Error getting candidate meeting status: {ex.Message}");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting candidate meeting status");
            return Results.Problem($"Error getting candidate meeting status: {ex.Message}");
        }
    }

    private static async Task<IResult> GetCandidateMeetingDetails(
        Guid jobId,
        Guid roundId,
        Guid applicationId,
        Supabase.Client client,
        ClaimsPrincipal user,
        [FromServices] ILogger logger)
    {
        try
        {
            var userId = GetMigratedUserId(user);
            if (userId == null) return Results.Unauthorized();

            var companyId = GetUserCompanyId(user);
            if (companyId == null) return Results.Unauthorized();

            // Verify job belongs to user's company
            if (!await VerifyJobAccess(client, jobId, companyId.Value))
                return Results.StatusCode(403);

            // Get the Google Calendar event for the candidate
            try
            {
                var calendarEventResponse = await client.From<GoogleCalendarEvent>()
                    .Where(e => e.ApplicationId == applicationId)
                    .Get();

                var calendarEvent = calendarEventResponse.Models.FirstOrDefault();

                if (calendarEvent == null)
                {
                    return Results.NotFound("Meeting details not found for this application.");
                }

                // Create a DTO to avoid JSON serialization issues with Supabase attributes
                var meetingDetailsDto = new
                {
                    id = calendarEvent.Id,
                    roundConfigurationId = calendarEvent.RoundConfigurationId,
                    applicationId = calendarEvent.ApplicationId,
                    eventId = calendarEvent.EventId ?? string.Empty,
                    calendarId = calendarEvent.CalendarId ?? "primary",
                    summary = calendarEvent.Summary ?? string.Empty,
                    description = calendarEvent.Description,
                    startTime = calendarEvent.StartTime,
                    endTime = calendarEvent.EndTime,
                    timezone = calendarEvent.Timezone ?? "UTC",
                    meetLink = calendarEvent.MeetLink,
                    conferenceId = calendarEvent.ConferenceId,
                    entryPoints = calendarEvent.EntryPoints != null ?
                        calendarEvent.EntryPoints.ToDictionary(kvp => kvp.Key, kvp => kvp.Value) :
                        null,
                    attendees = calendarEvent.Attendees,
                    status = calendarEvent.Status ?? "pending",
                    createdAt = calendarEvent.CreatedAt,
                    updatedAt = calendarEvent.UpdatedAt,
                    createdBy = calendarEvent.CreatedBy,
                    lastModifiedBy = calendarEvent.LastModifiedBy
                };

                return Results.Ok(new { success = true, data = meetingDetailsDto });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting candidate meeting details");
                return Results.Problem($"Error getting candidate meeting details: {ex.Message}");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting candidate meeting details");
            return Results.Problem($"Error getting candidate meeting details: {ex.Message}");
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

public class GoogleCalendarCallbackRequest
{
    public string Code { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
}

public class CreateEventRequest
{
    public Guid JobId { get; set; }
    public Guid RoundId { get; set; }
    public Guid? ApplicationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? MeetLink { get; set; }
    public string? AttendeeEmail { get; set; }
}

public class UpdateEventRequest
{
    public Guid JobId { get; set; }
    public Guid RoundId { get; set; }
    public string EventId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? MeetLink { get; set; }
    public string? AttendeeEmail { get; set; }
}
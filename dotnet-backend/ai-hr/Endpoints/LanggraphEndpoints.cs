using System.Net.Http.Headers;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;
using ai_hr.Contracts.Langgraph;

namespace ai_hr.Endpoints;

public static class LanggraphEndpoints
{
    public static void MapLanggraphEndpoints(this WebApplication app)
    {
        app.MapPost("/langgraph/search", SearchAssistants)
            .WithTags("Langgraph")
            .WithName("SearchAssistants")
            .WithSummary("Search Langgraph assistants")
            .WithDescription("Search for assistants using the Langgraph API");

        app.MapGet("/langgraph/assistants/{assistantId}", GetAssistantById)
            .WithTags("Langgraph")
            .WithName("GetAssistantById")
            .WithSummary("Get assistant by ID")
            .WithDescription("Get a specific assistant by its ID using the Langgraph API");

        app.MapPost("/langgraph/threads", CreateThread)
            .WithTags("Langgraph")
            .WithName("CreateThread")
            .WithSummary("Create a new thread")
            .WithDescription("Create a new thread using the Langgraph API");

        app.MapPost("/langgraph/threads/{threadId}/runs/wait", CreateRunWaitForOutput)
            .WithTags("Langgraph")
            .WithName("CreateRunWaitForOutput")
            .WithSummary("Create Run, Wait for Output")
            .WithDescription("Create a run in existing thread. Wait for the final output and then return it.");

        app.MapPost("/langgraph/jd-generator", RunJdGenerator)
            .WithTags("Langgraph")
            .WithName("RunJdGenerator")
            .WithSummary("Run JD Generator")
            .WithDescription("Generate a new thread and run the JD Generator agent with a specific input string");
    }

    private static async Task<IResult> SearchAssistants()
    {
        try
        {
            var langGraphUrl = Environment.GetEnvironmentVariable("LANGGRAPH_URL");
            Console.WriteLine(langGraphUrl);
            if (string.IsNullOrEmpty(langGraphUrl))
            {
                return Results.BadRequest(new { error = "LANGGRAPH_URL environment variable not configured" });
            }

            using var client = new HttpClient();

            // Create default search parameters
            var requestBody = System.Text.Json.JsonSerializer.Serialize(new
            {
                limit = 25,
                offset = 0,
                sort_by = "assistant_id",
                sort_order = "asc"
            });

            var httpRequest = new HttpRequestMessage
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri($"{langGraphUrl}/assistants/search"),
                Content = new StringContent(requestBody)
                {
                    Headers =
                    {
                        ContentType = new MediaTypeHeaderValue("application/json")
                    }
                }
            };

            using var response = await client.SendAsync(httpRequest);
            response.EnsureSuccessStatusCode();

            var body = await response.Content.ReadAsStringAsync();

            return Results.Ok(new { data = body, success = true });
        }
        catch (HttpRequestException ex)
        {
            return Results.BadRequest(new { error = "Failed to connect to Langgraph API", details = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: ex.Message,
                title: "Internal server error",
                statusCode: 500
            );
        }
    }

    private static async Task<IResult> GetAssistantById(string assistantId)
    {
        try
        {
            var langGraphUrl = Environment.GetEnvironmentVariable("LANGGRAPH_URL");
            Console.WriteLine(langGraphUrl);

            if (string.IsNullOrEmpty(langGraphUrl))
            {
                return Results.BadRequest(new { error = "LANGGRAPH_URL environment variable not configured" });
            }

            if (string.IsNullOrEmpty(assistantId))
            {
                return Results.BadRequest(new { error = "Assistant ID is required" });
            }

            using var client = new HttpClient();

            var httpRequest = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri($"{langGraphUrl}/assistants/{assistantId}"),
            };

            using var response = await client.SendAsync(httpRequest);
            response.EnsureSuccessStatusCode();

            var body = await response.Content.ReadAsStringAsync();

            return Results.Ok(new { data = body, success = true });
        }
        catch (HttpRequestException ex)
        {
            return Results.BadRequest(new { error = "Failed to connect to Langgraph API", details = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: ex.Message,
                title: "Internal server error",
                statusCode: 500
            );
        }
    }

    private static async Task<IResult> CreateThread()
    {
        try
        {
            var langGraphUrl = Environment.GetEnvironmentVariable("LANGGRAPH_URL");
            Console.WriteLine($"Langgraph URL at CreateThread: {langGraphUrl}");

            if (string.IsNullOrEmpty(langGraphUrl))
            {
                return Results.BadRequest(new { error = "LANGGRAPH_URL environment variable not configured" });
            }

            using var client = new HttpClient();

            var _jsonSerializerSettings = new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore,
                Converters = { new StringEnumConverter() }
            };

            // Create default values for thread creation
            var options = new
            {
                metadata = new { },
                if_exists = "raise",
                ttl = new { strategy = "delete", ttl = 1 }
            };

            var requestBody = JsonConvert.SerializeObject(options, _jsonSerializerSettings);

            var httpRequest = new HttpRequestMessage
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri($"{langGraphUrl}/threads"),
                Content = new StringContent(requestBody)
                {
                    Headers =
                    {
                        ContentType = new MediaTypeHeaderValue("application/json")
                    }
                }
            };

            using var response = await client.SendAsync(httpRequest);

            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Error response body: {body}");
                return Results.BadRequest(new
                {
                    error = "Failed to connect to Langgraph API",
                    details = $"Response status code does not indicate success: {(int)response.StatusCode} ({response.StatusCode}). Response body: {body}"
                });
            }

            // Parse the response and extract thread_id for easy access
            var threadData = JsonConvert.DeserializeObject<dynamic>(body);
            var threadId = threadData?.thread_id?.ToString();

            return Results.Ok(new { thread_id = threadId, data = body, success = true });
        }
        catch (HttpRequestException ex)
        {
            return Results.BadRequest(new { error = "Failed to connect to Langgraph API", details = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: ex.Message,
                title: "Internal server error",
                statusCode: 500
            );
        }
    }

    private static async Task<string> CreateThreadAndGetId()
    {
        var langGraphUrl = Environment.GetEnvironmentVariable("LANGGRAPH_URL");
        using var client = new HttpClient();

        var _jsonSerializerSettings = new JsonSerializerSettings
        {
            NullValueHandling = NullValueHandling.Ignore,
            Converters = { new StringEnumConverter() }
        };

        var options = new
        {
            metadata = new { },
            ttl = new { strategy = "delete", ttl = 1 }
        };

        var requestBody = JsonConvert.SerializeObject(options, _jsonSerializerSettings);

        var httpRequest = new HttpRequestMessage
        {
            Method = HttpMethod.Post,
            RequestUri = new Uri($"{langGraphUrl}/threads"),
            Content = new StringContent(requestBody)
            {
                Headers =
                {
                    ContentType = new MediaTypeHeaderValue("application/json")
                }
            }
        };

        using var response = await client.SendAsync(httpRequest);
        var body = await response.Content.ReadAsStringAsync();

        var threadData = JsonConvert.DeserializeObject<dynamic>(body);
        return threadData?.thread_id?.ToString() ?? "";
    }

    private static async Task<dynamic> CreateRunWaitForOutput(string threadId, string? assistantId = null, int? recursionLimit = null, object? input = null)
    {
        try
        {
            var langGraphUrl = Environment.GetEnvironmentVariable("LANGGRAPH_URL");
            Console.WriteLine($"Langgraph URL at CreateRunWaitForOutput: {langGraphUrl}");

            if (string.IsNullOrEmpty(langGraphUrl))
            {
                return Results.BadRequest(new { error = "LANGGRAPH_URL environment variable not configured" });
            }

            if (string.IsNullOrEmpty(threadId))
            {
                return Results.BadRequest(new { error = "Thread ID is required" });
            }

            var _jsonSerializerSettings = new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore,
                Converters = { new StringEnumConverter() }
            };

            using var client = new HttpClient();

            // Create run configuration with provided parameters and default values
            var options = new
            {
                assistant_id = assistantId ?? "",
                checkpoint = new
                {
                    thread_id = threadId,
                    checkpoint_ns = "",
                    checkpoint_id = "",
                    checkpoint_map = new { }
                },
                input = input ?? new { },
                metadata = new { },
                config = new
                {
                    tags = new[] { "" },
                    recursion_limit = recursionLimit ?? 200,
                    configurable = new { }
                }
            };

            var requestBody = JsonConvert.SerializeObject(options, _jsonSerializerSettings);

            var httpRequest = new HttpRequestMessage
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri($"{langGraphUrl}/threads/{threadId}/runs/wait"),
                Content = new StringContent(requestBody)
                {
                    Headers =
                    {
                        ContentType = new MediaTypeHeaderValue("application/json")
                    }
                }
            };

            using var response = await client.SendAsync(httpRequest);

            var body = await response.Content.ReadAsStringAsync();
            var jsonObject = JsonConvert.DeserializeObject<dynamic>(body);
            return jsonObject;

        }
        catch (HttpRequestException ex)
        {
            return Results.BadRequest(new { error = "Failed to connect to Langgraph API", details = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: ex.Message,
                title: "Internal server error",
                statusCode: 500
            );
        }
    }

    private static async Task<IResult> RunJdGenerator(string inputString, int recursionLimit = 200)
    {
        try
        {
            const string selectedAgent = "33f5bbdc-e7a1-562f-b4e5-b620117e1da5";

            // Create a new thread and get the thread ID directly
            var threadId = await CreateThreadAndGetId();
            Console.WriteLine($"Thread ID: {threadId}");

            var input = new JObject
            {
                ["messages"] = new JArray()
                {
                    new JObject()
                    {
                        ["role"] = "user",
                        ["content"] = inputString
                    }
                }
            };

            // Call the existing CreateRunWaitForOutput method with the new thread ID
            var result = await CreateRunWaitForOutput(threadId, selectedAgent, recursionLimit, input);
            Console.WriteLine($"Result from CreateRunWaitForOutput: {result}");
            // Parse the JSON string result
            var jd_content = result.formatted_job_description.content;

            // Convert to string explicitly to ensure proper serialization
            string jd_content_string = jd_content?.ToString() ?? "";

            return Results.Ok(new { data = jd_content_string, success = true });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: ex.Message,
                title: "Error in JD Generator",
                statusCode: 500
            );
        }
    }
}
using System.Net.Http.Headers;
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
    }

    private static async Task<IResult> SearchAssistants(SearchAssistantsRequest? request)
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

            // Use request data if provided, otherwise use default values
            var requestBody = request != null ?
                System.Text.Json.JsonSerializer.Serialize(new
                {
                    metadata = request.Metadata ?? new object(),
                    graph_id = request.GraphId ?? "",
                    limit = request.Limit ?? 10,
                    offset = request.Offset ?? 0,
                    sort_by = request.SortBy ?? "assistant_id",
                    sort_order = request.SortOrder ?? "asc"
                }) :
                "{\"metadata\": {}, \"graph_id\": \"\", \"limit\": 10, \"offset\": 0, \"sort_by\": \"assistant_id\", \"sort_order\": \"asc\"}";

            var httpRequest = new HttpRequestMessage
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri($"{langGraphUrl}/search"),
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
}
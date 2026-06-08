using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using ai_hr.Contracts.Langgraph;
using ai_hr.Services;

namespace ai_hr.Endpoints;

public static class LanggraphEndpoints
{
    public static void MapLanggraphEndpoints(this WebApplication app)
    {
        // ---- Low-level LangGraph Platform proxies ----
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
            .WithDescription("Create a run in an existing thread, wait for the final output and return it.");

        // ---- Per-graph feature endpoints (all 6 graphs in langgraph.json) ----
        app.MapPost("/langgraph/jd-generator", RunJdGenerator)
            .WithTags("Langgraph")
            .WithName("RunJdGenerator")
            .WithSummary("Run JD Generator")
            .WithDescription("Run the job_description_generator graph with an input string and return the formatted job description.");

        app.MapPost("/langgraph/business-context", RunBusinessContext)
            .WithTags("Langgraph")
            .WithName("RunBusinessContext")
            .WithSummary("Run Business Context Analyzer")
            .WithDescription("Run the business_context_analyzer graph and return the final company research report (markdown).");

        app.MapPost("/langgraph/resume-ranker", RunResumeRanker)
            .WithTags("Langgraph")
            .WithName("RunResumeRanker")
            .WithSummary("Run Resume Ranker")
            .WithDescription("Run the resume_ranker graph over a set of resumes in a Supabase bucket and return per-resume 0-100 scores.");

        app.MapPost("/langgraph/criteria-discovery", RunCriteriaDiscovery)
            .WithTags("Langgraph")
            .WithName("RunCriteriaDiscovery")
            .WithSummary("Run Criteria Discovery")
            .WithDescription("Run the criteria_discovery_agent graph to derive weighted evaluation criteria from a job description.");

        app.MapPost("/langgraph/resume-analysis", RunResumeAnalysis)
            .WithTags("Langgraph")
            .WithName("RunResumeAnalysis")
            .WithSummary("Run Resume Analysis")
            .WithDescription("Run the resume_analysis_agent graph to score a single resume across four dimensions.");

        app.MapPost("/langgraph/cultural-fit", RunCulturalFit)
            .WithTags("Langgraph")
            .WithName("RunCulturalFit")
            .WithSummary("Run Cultural Fit")
            .WithDescription("Run the cultural_fit_agent graph to score a single resume's cultural fit.");
    }

    private static async Task<IResult> SearchAssistants([FromServices] ILangGraphService langGraph)
    {
        try
        {
            var body = await langGraph.SearchAssistantsAsync();
            return Results.Ok(new { data = body, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.BadRequest(new { error = "Failed to connect to Langgraph API", details = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Internal server error", statusCode: 500);
        }
    }

    private static async Task<IResult> GetAssistantById(string assistantId, [FromServices] ILangGraphService langGraph)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(assistantId))
                return Results.BadRequest(new { error = "Assistant ID is required" });

            var body = await langGraph.GetAssistantByIdAsync(assistantId);
            return Results.Ok(new { data = body, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.BadRequest(new { error = "Failed to connect to Langgraph API", details = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Internal server error", statusCode: 500);
        }
    }

    private static async Task<IResult> CreateThread([FromServices] ILangGraphService langGraph)
    {
        try
        {
            var body = await langGraph.CreateThreadAsync();
            var threadId = JObject.Parse(body)["thread_id"]?.ToString();
            return Results.Ok(new { thread_id = threadId, data = body, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.BadRequest(new { error = "Failed to connect to Langgraph API", details = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Internal server error", statusCode: 500);
        }
    }

    private static async Task<IResult> CreateRunWaitForOutput(
        string threadId,
        [FromBody] RunWaitRequest request,
        [FromServices] ILangGraphService langGraph)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(threadId))
                return Results.BadRequest(new { error = "threadId is required" });
            if (string.IsNullOrWhiteSpace(request?.AssistantId))
                return Results.BadRequest(new { error = "assistantId is required" });

            // Run against the thread named in the route so its checkpoints / conversation
            // state are preserved, honouring the stateful run/wait API contract.
            object? input = request.Input.HasValue
                ? JToken.Parse(request.Input.Value.GetRawText())
                : null;

            var result = await langGraph.CreateRunAndWaitOnThreadAsync(
                threadId, request.AssistantId!, input ?? new JObject(), request.RecursionLimit);

            return Results.Ok(result);
        }
        catch (LangGraphException ex)
        {
            return Results.BadRequest(new { error = "Failed to connect to Langgraph API", details = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Internal server error", statusCode: 500);
        }
    }

    private static async Task<IResult> RunJdGenerator(
        [FromQuery] string inputString,
        [FromServices] ILangGraphService langGraph,
        [FromQuery] int recursionLimit = 200)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(inputString))
                return Results.BadRequest(new { error = "inputString is required" });

            var jd = await langGraph.GenerateJobDescriptionAsync(inputString, recursionLimit);
            return Results.Ok(new { data = jd, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in JD Generator", statusCode: 502);
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in JD Generator", statusCode: 500);
        }
    }

    private static async Task<IResult> RunBusinessContext(
        [FromBody] BusinessContextRequest request,
        [FromServices] ILangGraphService langGraph)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CompanyName))
                return Results.BadRequest(new { error = "companyName is required" });

            var report = await langGraph.AnalyzeBusinessContextAsync(request);
            return Results.Ok(new { data = report, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Business Context Analyzer", statusCode: 502);
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Business Context Analyzer", statusCode: 500);
        }
    }

    private static async Task<IResult> RunResumeRanker(
        [FromBody] ResumeRankerRequest request,
        [FromServices] ILangGraphService langGraph)
    {
        try
        {
            if (request == null)
                return Results.BadRequest(new { error = "Request body is required" });

            var result = await langGraph.RankResumesAsync(request);
            return Results.Ok(new { data = result, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Resume Ranker", statusCode: 502);
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Resume Ranker", statusCode: 500);
        }
    }

    private static async Task<IResult> RunCriteriaDiscovery(
        [FromBody] CriteriaDiscoveryRequest request,
        [FromServices] ILangGraphService langGraph)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.JobDescription))
                return Results.BadRequest(new { error = "jobDescription is required" });

            var result = await langGraph.DiscoverCriteriaAsync(request);
            return Results.Ok(new { data = result, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Criteria Discovery", statusCode: 502);
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Criteria Discovery", statusCode: 500);
        }
    }

    private static async Task<IResult> RunResumeAnalysis(
        [FromBody] JsonElement body,
        [FromServices] ILangGraphService langGraph)
    {
        try
        {
            // resume-analysis takes arbitrary nested JSON (the resume object + criteria), so bind the
            // raw body and forward it directly to preserve structure exactly as the graph expects.
            var input = BuildSubgraphInput(body, includeJobDescription: true);
            var recursionLimit = GetRecursionLimit(body);

            var result = await langGraph.CreateRunAndWaitAsync(
                langGraph.ResolveAssistant(LangGraphService.ResumeAnalysisAgent), input, recursionLimit);

            return Results.Ok(new { data = result, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Resume Analysis", statusCode: 502);
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Resume Analysis", statusCode: 500);
        }
    }

    private static async Task<IResult> RunCulturalFit(
        [FromBody] JsonElement body,
        [FromServices] ILangGraphService langGraph)
    {
        try
        {
            var input = BuildSubgraphInput(body, includeJobDescription: false);
            var recursionLimit = GetRecursionLimit(body);

            var result = await langGraph.CreateRunAndWaitAsync(
                langGraph.ResolveAssistant(LangGraphService.CulturalFitAgent), input, recursionLimit);

            return Results.Ok(new { data = result, success = true });
        }
        catch (LangGraphException ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Cultural Fit", statusCode: 502);
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, title: "Error in Cultural Fit", statusCode: 500);
        }
    }

    // ----- helpers for the arbitrary-JSON subgraph endpoints -----

    private static JObject BuildSubgraphInput(JsonElement body, bool includeJobDescription)
    {
        var input = new JObject
        {
            ["current_resume"] = ExtractJson(body, "currentResume", "current_resume") ?? new JObject(),
            ["company_info"] = ExtractString(body, "companyInfo", "company_info"),
            ["evaluation_criteria"] = ExtractJson(body, "evaluationCriteria", "evaluation_criteria") ?? new JArray()
        };
        if (includeJobDescription)
            input["job_description"] = ExtractString(body, "jobDescription", "job_description");
        return input;
    }

    private static JToken? ExtractJson(JsonElement body, params string[] names)
    {
        if (body.ValueKind != JsonValueKind.Object) return null;
        foreach (var name in names)
        {
            if (body.TryGetProperty(name, out var prop))
                return JToken.Parse(prop.GetRawText());
        }
        return null;
    }

    private static string ExtractString(JsonElement body, params string[] names)
    {
        if (body.ValueKind != JsonValueKind.Object) return string.Empty;
        foreach (var name in names)
        {
            if (body.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String)
                return prop.GetString() ?? string.Empty;
        }
        return string.Empty;
    }

    private static int GetRecursionLimit(JsonElement body)
    {
        if (body.ValueKind == JsonValueKind.Object
            && body.TryGetProperty("recursionLimit", out var prop)
            && prop.ValueKind == JsonValueKind.Number
            && prop.TryGetInt32(out var limit))
            return limit;
        return 200;
    }
}

/// <summary>Body for the generic <c>/langgraph/threads/{threadId}/runs/wait</c> proxy.</summary>
public class RunWaitRequest
{
    public string? AssistantId { get; set; }
    public int RecursionLimit { get; set; } = 200;
    public JsonElement? Input { get; set; }
}

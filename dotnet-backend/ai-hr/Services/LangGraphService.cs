using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;
using ai_hr.Contracts.Langgraph;

namespace ai_hr.Services;

/// <summary>Raised when a call to the LangGraph Platform fails or returns a graph-level error.</summary>
public class LangGraphException : Exception
{
    public LangGraphException(string message) : base(message) { }
    public LangGraphException(string message, Exception inner) : base(message, inner) { }
}

/// <summary>
/// Typed client for the LangGraph Platform REST API. Wires every graph registered in
/// <c>langgraph_server/langgraph.json</c> into the .NET backend:
/// job_description_generator, business_context_analyzer, resume_ranker, criteria_discovery_agent,
/// resume_analysis_agent and cultural_fit_agent.
/// </summary>
public interface ILangGraphService
{
    // ---- Low-level Platform primitives (used by the proxy endpoints) ----
    Task<string> SearchAssistantsAsync(int limit = 25, int offset = 0, CancellationToken ct = default);
    Task<string> GetAssistantByIdAsync(string assistantId, CancellationToken ct = default);
    Task<string> CreateThreadAsync(CancellationToken ct = default);

    /// <summary>Create a thread, start a run for <paramref name="assistantId"/> (graph name or UUID),
    /// block until it finishes and return the final state as JSON.</summary>
    Task<JObject> CreateRunAndWaitAsync(string assistantId, object input, int recursionLimit = 200, CancellationToken ct = default);

    /// <summary>Start a run for <paramref name="assistantId"/> on the supplied <paramref name="threadId"/>,
    /// preserving that thread's checkpoints/conversation state, block until it finishes and return the
    /// final state as JSON.</summary>
    Task<JObject> CreateRunAndWaitOnThreadAsync(string threadId, string assistantId, object input, int recursionLimit = 200, CancellationToken ct = default);

    // ---- Per-graph feature methods ----
    Task<string> GenerateJobDescriptionAsync(string inputString, int recursionLimit = 200, CancellationToken ct = default);
    Task<string> AnalyzeBusinessContextAsync(BusinessContextRequest request, CancellationToken ct = default);
    Task<ResumeRankerResult> RankResumesAsync(ResumeRankerRequest request, CancellationToken ct = default);
    Task<JObject> DiscoverCriteriaAsync(CriteriaDiscoveryRequest request, CancellationToken ct = default);
    Task<JObject> AnalyzeResumeAsync(ResumeAnalysisRequest request, CancellationToken ct = default);
    Task<JObject> AssessCulturalFitAsync(CulturalFitRequest request, CancellationToken ct = default);

    /// <summary>Resolve the assistant id for a graph (graph name by default, overridable via config).</summary>
    string ResolveAssistant(string graphName);
}

public class LangGraphService : ILangGraphService
{
    // Graph ids exactly as registered in langgraph.json.
    public const string JobDescriptionGenerator = "job_description_generator";
    public const string BusinessContextAnalyzer = "business_context_analyzer";
    public const string ResumeRanker = "resume_ranker";
    public const string CriteriaDiscoveryAgent = "criteria_discovery_agent";
    public const string ResumeAnalysisAgent = "resume_analysis_agent";
    public const string CulturalFitAgent = "cultural_fit_agent";

    private readonly HttpClient _httpClient;
    private readonly ILogger<LangGraphService> _logger;
    private readonly IConfiguration _config;

    private static readonly JsonSerializerSettings SerializerSettings = new()
    {
        NullValueHandling = NullValueHandling.Ignore,
        Converters = { new StringEnumConverter() }
    };

    public LangGraphService(HttpClient httpClient, ILogger<LangGraphService> logger, IConfiguration config)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _config = config ?? throw new ArgumentNullException(nameof(config));
    }

    // -----------------------------------------------------------------------
    // Configuration helpers
    // -----------------------------------------------------------------------

    private string GetBaseUrl()
    {
        var url = Environment.GetEnvironmentVariable("LANGGRAPH_URL") ?? _config["LangGraph:Url"];
        if (string.IsNullOrWhiteSpace(url))
            throw new LangGraphException("LANGGRAPH_URL is not configured");
        return url.TrimEnd('/');
    }

    /// <summary>
    /// The LangGraph Platform accepts the graph name directly as <c>assistant_id</c> (it resolves to
    /// the default assistant for that graph). An explicit UUID can still be supplied per graph via
    /// the env var <c>LANGGRAPH_{GRAPH}_ASSISTANT_ID</c> or config key <c>LangGraph:Assistants:{graph}</c>.
    /// </summary>
    public string ResolveAssistant(string graphName)
    {
        var envKey = $"LANGGRAPH_{graphName.ToUpperInvariant()}_ASSISTANT_ID";
        var fromEnv = Environment.GetEnvironmentVariable(envKey);
        if (!string.IsNullOrWhiteSpace(fromEnv)) return fromEnv;

        var fromConfig = _config[$"LangGraph:Assistants:{graphName}"];
        if (!string.IsNullOrWhiteSpace(fromConfig)) return fromConfig;

        return graphName;
    }

    // -----------------------------------------------------------------------
    // Low-level Platform primitives
    // -----------------------------------------------------------------------

    public async Task<string> SearchAssistantsAsync(int limit = 25, int offset = 0, CancellationToken ct = default)
    {
        var baseUrl = GetBaseUrl();
        var body = JsonConvert.SerializeObject(new
        {
            limit,
            offset,
            sort_by = "assistant_id",
            sort_order = "asc"
        }, SerializerSettings);

        return await SendAsync(HttpMethod.Post, $"{baseUrl}/assistants/search", body, ct);
    }

    public async Task<string> GetAssistantByIdAsync(string assistantId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(assistantId))
            throw new LangGraphException("Assistant ID is required");

        var baseUrl = GetBaseUrl();
        return await SendAsync(HttpMethod.Get, $"{baseUrl}/assistants/{assistantId}", null, ct);
    }

    public async Task<string> CreateThreadAsync(CancellationToken ct = default)
    {
        var baseUrl = GetBaseUrl();
        // Return the full thread JSON (including thread_id) so the endpoint can parse it.
        return await PostThreadAsync(baseUrl, ct);
    }

    public async Task<JObject> CreateRunAndWaitAsync(string assistantId, object input, int recursionLimit = 200, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(assistantId))
            throw new LangGraphException("Assistant ID is required");

        var baseUrl = GetBaseUrl();
        var threadId = await CreateThreadIdAsync(baseUrl, ct);
        return await RunOnThreadAsync(baseUrl, threadId, assistantId, input, recursionLimit, ct);
    }

    public async Task<JObject> CreateRunAndWaitOnThreadAsync(string threadId, string assistantId, object input, int recursionLimit = 200, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(threadId))
            throw new LangGraphException("Thread ID is required");
        if (string.IsNullOrWhiteSpace(assistantId))
            throw new LangGraphException("Assistant ID is required");

        var baseUrl = GetBaseUrl();
        return await RunOnThreadAsync(baseUrl, threadId, assistantId, input, recursionLimit, ct);
    }

    /// <summary>Start a run for <paramref name="assistantId"/> on an existing thread, block until it
    /// finishes and return the final state, surfacing graph-level errors as <see cref="LangGraphException"/>.</summary>
    private async Task<JObject> RunOnThreadAsync(string baseUrl, string threadId, string assistantId, object input, int recursionLimit, CancellationToken ct)
    {
        var options = new
        {
            assistant_id = assistantId,
            input = input ?? new { },
            config = new
            {
                recursion_limit = recursionLimit,
                configurable = new { }
            },
            metadata = new { }
        };
        var body = JsonConvert.SerializeObject(options, SerializerSettings);

        _logger.LogInformation("Starting LangGraph run: assistant={Assistant} thread={Thread} recursionLimit={Limit}",
            assistantId, threadId, recursionLimit);

        var responseBody = await SendAsync(HttpMethod.Post, $"{baseUrl}/threads/{threadId}/runs/wait", body, ct);

        var json = string.IsNullOrWhiteSpace(responseBody) ? new JObject() : JObject.Parse(responseBody);

        // run/wait surfaces graph errors in the body rather than via HTTP status.
        if (json["__error__"] != null)
        {
            var err = json["__error__"]?.ToString();
            _logger.LogError("LangGraph graph '{Assistant}' returned an error: {Error}", assistantId, err);
            throw new LangGraphException($"LangGraph graph '{assistantId}' error: {err}");
        }

        return json;
    }

    /// <summary>POST /threads and return the raw thread JSON response body.</summary>
    private async Task<string> PostThreadAsync(string baseUrl, CancellationToken ct)
    {
        // Generous TTL so long-running graphs (resume_ranker) are never swept mid-run.
        var options = new
        {
            metadata = new { },
            ttl = new { strategy = "delete", ttl = 120 }
        };
        var body = JsonConvert.SerializeObject(options, SerializerSettings);
        return await SendAsync(HttpMethod.Post, $"{baseUrl}/threads", body, ct);
    }

    /// <summary>Create a thread and return its parsed thread_id.</summary>
    private async Task<string> CreateThreadIdAsync(string baseUrl, CancellationToken ct)
    {
        var responseBody = await PostThreadAsync(baseUrl, ct);
        var threadId = JObject.Parse(responseBody)["thread_id"]?.ToString();
        if (string.IsNullOrWhiteSpace(threadId))
            throw new LangGraphException("LangGraph did not return a thread_id");
        return threadId;
    }

    /// <summary>Send a request through the pooled HttpClient and return the body, throwing on non-success.</summary>
    private async Task<string> SendAsync(HttpMethod method, string url, string? jsonBody, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(method, url);
        if (jsonBody != null)
            request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseContentRead, ct);
        }
        catch (HttpRequestException ex)
        {
            throw new LangGraphException($"Failed to connect to LangGraph at {url}: {ex.Message}", ex);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            throw new LangGraphException($"LangGraph request to {url} timed out", ex);
        }

        using (response)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("LangGraph request {Method} {Url} failed ({Status}): {Body}",
                    method, url, (int)response.StatusCode, Truncate(body, 1000));
                throw new LangGraphException(
                    $"LangGraph request failed ({(int)response.StatusCode} {response.StatusCode}): {Truncate(body, 500)}");
            }
            return body;
        }
    }

    // -----------------------------------------------------------------------
    // Per-graph feature methods
    // -----------------------------------------------------------------------

    public async Task<string> GenerateJobDescriptionAsync(string inputString, int recursionLimit = 200, CancellationToken ct = default)
    {
        var input = new JObject
        {
            ["messages"] = new JArray
            {
                new JObject
                {
                    ["role"] = "user",
                    ["content"] = inputString
                }
            }
        };

        var result = await CreateRunAndWaitAsync(ResolveAssistant(JobDescriptionGenerator), input, recursionLimit, ct);

        // formatted_job_description is serialized as a message object ({ content, type, ... }) but
        // may also come back as a plain string — handle both.
        var jd = result["formatted_job_description"];
        return jd?["content"]?.ToString() ?? jd?.ToString() ?? string.Empty;
    }

    public async Task<string> AnalyzeBusinessContextAsync(BusinessContextRequest request, CancellationToken ct = default)
    {
        var input = new
        {
            company_name = request.CompanyName,
            company_url = request.CompanyUrl,
            locale = string.IsNullOrWhiteSpace(request.Locale) ? "en-US" : request.Locale
        };

        var result = await CreateRunAndWaitAsync(ResolveAssistant(BusinessContextAnalyzer), input, request.RecursionLimit, ct);
        return result["final_report"]?.ToString() ?? string.Empty;
    }

    public async Task<ResumeRankerResult> RankResumesAsync(ResumeRankerRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.JobDescription))
            throw new LangGraphException("Job description is required for resume ranking");
        if (string.IsNullOrWhiteSpace(request.ResumeBucketName))
            throw new LangGraphException("Resume bucket name is required for resume ranking");
        if (request.ResumeFileNames == null || request.ResumeFileNames.Count == 0)
            throw new LangGraphException("At least one resume file name is required for resume ranking");

        var input = new
        {
            job_description = request.JobDescription,
            company_info = request.CompanyInfo ?? string.Empty,
            resume_bucket_name = request.ResumeBucketName,
            resume_file_names = request.ResumeFileNames
        };

        var result = await CreateRunAndWaitAsync(ResolveAssistant(ResumeRanker), input, request.RecursionLimit, ct);
        return ParseResumeRankerResult(result);
    }

    public async Task<JObject> DiscoverCriteriaAsync(CriteriaDiscoveryRequest request, CancellationToken ct = default)
    {
        var input = new
        {
            job_description = request.JobDescription,
            company_info = request.CompanyInfo ?? string.Empty
        };
        return await CreateRunAndWaitAsync(ResolveAssistant(CriteriaDiscoveryAgent), input, request.RecursionLimit, ct);
    }

    public async Task<JObject> AnalyzeResumeAsync(ResumeAnalysisRequest request, CancellationToken ct = default)
    {
        var input = new
        {
            current_resume = request.CurrentResume ?? new Dictionary<string, object>(),
            job_description = request.JobDescription,
            company_info = request.CompanyInfo ?? string.Empty,
            evaluation_criteria = request.EvaluationCriteria ?? new List<object>()
        };
        return await CreateRunAndWaitAsync(ResolveAssistant(ResumeAnalysisAgent), input, request.RecursionLimit, ct);
    }

    public async Task<JObject> AssessCulturalFitAsync(CulturalFitRequest request, CancellationToken ct = default)
    {
        var input = new
        {
            current_resume = request.CurrentResume ?? new Dictionary<string, object>(),
            company_info = request.CompanyInfo ?? string.Empty,
            evaluation_criteria = request.EvaluationCriteria ?? new List<object>()
        };
        return await CreateRunAndWaitAsync(ResolveAssistant(CulturalFitAgent), input, request.RecursionLimit, ct);
    }

    // -----------------------------------------------------------------------
    // Parsing helpers
    // -----------------------------------------------------------------------

    private static ResumeRankerResult ParseResumeRankerResult(JObject json)
    {
        var result = new ResumeRankerResult();

        if (json["final_rankings"] is JArray rankings)
        {
            foreach (var r in rankings)
            {
                result.FinalRankings.Add(new ResumeRankingEntry
                {
                    Rank = r["rank"]?.Type == JTokenType.Integer ? r["rank"]!.Value<int>() : 0,
                    ResumeId = r["resume_id"]?.ToString() ?? string.Empty,
                    OverallScore = ToDecimal(r["overall_score"])
                });
            }
        }

        // final_resume_output is a list of single-key objects: [{ "<resume_id>": { ...scores } }]
        if (json["final_resume_output"] is JArray outputs)
        {
            foreach (var item in outputs)
            {
                if (item is not JObject obj) continue;
                foreach (var prop in obj.Properties())
                {
                    var v = prop.Value;
                    result.ResumeScores[prop.Name] = new ResumeDimensionScores
                    {
                        OverallScore = ToDecimal(v["overall_score"]),
                        CulturalFitScore = ToDecimal(v["cultural_fit_score"]),
                        SkillsAssessmentScore = ToDecimal(v["skills_assessment_score"]),
                        ProfessionalExperienceScore = ToDecimal(v["professional_experience_score"]),
                        EducationGrowthScore = ToDecimal(v["education_growth_score"]),
                        DetailedFeedback = v["detailed_feedback"]?.ToString() ?? string.Empty
                    };
                }
            }
        }

        return result;
    }

    /// <summary>Coerce a JSON token to a decimal, tolerating strings and non-numeric placeholders (→ 0).</summary>
    private static decimal ToDecimal(JToken? token)
    {
        if (token == null) return 0m;
        switch (token.Type)
        {
            case JTokenType.Float:
            case JTokenType.Integer:
                return token.Value<decimal>();
            case JTokenType.String:
                return decimal.TryParse(token.ToString(), out var d) ? d : 0m;
            default:
                return 0m;
        }
    }

    private static string Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        return value.Length <= max ? value : value.Substring(0, max) + "…";
    }
}

namespace ai_hr.Contracts.Langgraph;

// ---------------------------------------------------------------------------
// Request contracts (one per LangGraph graph registered in langgraph.json)
// Field names here are C#-friendly; the LangGraphService maps them to the
// exact snake_case keys each graph expects on the run `input`.
// ---------------------------------------------------------------------------

/// <summary>Input for the <c>business_context_analyzer</c> graph.</summary>
public class BusinessContextRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string CompanyUrl { get; set; } = string.Empty;
    public string Locale { get; set; } = "en-US";
    public int RecursionLimit { get; set; } = 200;
}

/// <summary>Input for the <c>resume_ranker</c> master orchestrator graph.</summary>
public class ResumeRankerRequest
{
    public string JobDescription { get; set; } = string.Empty;
    public string CompanyInfo { get; set; } = string.Empty;
    public string ResumeBucketName { get; set; } = string.Empty;
    public List<string> ResumeFileNames { get; set; } = new();
    public int RecursionLimit { get; set; } = 200;
}

/// <summary>Input for the standalone <c>criteria_discovery_agent</c> graph.</summary>
public class CriteriaDiscoveryRequest
{
    public string JobDescription { get; set; } = string.Empty;
    public string CompanyInfo { get; set; } = string.Empty;
    public int RecursionLimit { get; set; } = 200;
}

/// <summary>Input for the standalone <c>resume_analysis_agent</c> graph (single resume).</summary>
public class ResumeAnalysisRequest
{
    /// <summary>The resume object as the graph expects it: { id, filename, content, file_path }.</summary>
    public Dictionary<string, object> CurrentResume { get; set; } = new();
    public string JobDescription { get; set; } = string.Empty;
    public string CompanyInfo { get; set; } = string.Empty;
    /// <summary>Optional weighted evaluation criteria (list of { name, description, weight }).</summary>
    public object? EvaluationCriteria { get; set; }
    public int RecursionLimit { get; set; } = 200;
}

/// <summary>Input for the standalone <c>cultural_fit_agent</c> graph (single resume).</summary>
public class CulturalFitRequest
{
    public Dictionary<string, object> CurrentResume { get; set; } = new();
    public string CompanyInfo { get; set; } = string.Empty;
    public object? EvaluationCriteria { get; set; }
    public int RecursionLimit { get; set; } = 200;
}

// ---------------------------------------------------------------------------
// Parsed output contracts for the strongly-typed graphs.
// ---------------------------------------------------------------------------

/// <summary>Parsed result of a <c>resume_ranker</c> run.</summary>
public class ResumeRankerResult
{
    /// <summary>Ranked entries (rank, resume id, overall score) sorted best-first.</summary>
    public List<ResumeRankingEntry> FinalRankings { get; set; } = new();

    /// <summary>Per-resume dimension scores, keyed by resume id (the file name without extension).</summary>
    public Dictionary<string, ResumeDimensionScores> ResumeScores { get; set; } = new();
}

public class ResumeRankingEntry
{
    public int Rank { get; set; }
    public string ResumeId { get; set; } = string.Empty;
    public decimal OverallScore { get; set; }
}

/// <summary>Per-resume score breakdown. All scores are on a 0-100 scale.</summary>
public class ResumeDimensionScores
{
    public decimal OverallScore { get; set; }
    public decimal CulturalFitScore { get; set; }
    public decimal SkillsAssessmentScore { get; set; }
    public decimal ProfessionalExperienceScore { get; set; }
    public decimal EducationGrowthScore { get; set; }
    public string DetailedFeedback { get; set; } = string.Empty;
}

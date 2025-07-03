using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace ai_hr.Contracts.Interview;

// Base configuration request/response
public class RoundConfigurationRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int Duration { get; set; } = 30;

    public string Status { get; set; } = "draft";

    public Dictionary<string, object>? ConfigurationData { get; set; }
}

public class RoundConfigurationResponse
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public Guid RoundId { get; set; }
    public string RoundType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Duration { get; set; }
    public string Status { get; set; } = string.Empty;
    public object ConfigurationData { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? LastModifiedBy { get; set; }
    public int Version { get; set; }
    public List<QuestionDto> Questions { get; set; } = new();
    public List<ScoringCriteriaDto> ScoringCriteria { get; set; } = new();
}

// Default configuration DTOs
public class DefaultConfigurationResponse
{
    public bool Success { get; set; }
    public object Data { get; set; } = new();
    public string? Message { get; set; }
}

// Question DTOs
public class QuestionDto
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string? Category { get; set; }
    public bool IsRequired { get; set; }
    public int OrderIndex { get; set; }
    public object? Metadata { get; set; }
}

public class QuestionCreateRequest
{
    [Required]
    public string QuestionText { get; set; } = string.Empty;

    [Required]
    public string QuestionType { get; set; } = string.Empty;

    public string? Category { get; set; }
    public bool IsRequired { get; set; } = false;
    public int OrderIndex { get; set; }
    public object? Metadata { get; set; }
}

public class BulkQuestionsRequest
{
    public List<QuestionCreateRequest> Questions { get; set; } = new();
}

// Scoring criteria DTOs
public class ScoringCriteriaDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Weight { get; set; }
    public int MaxScore { get; set; }
    public string ScoringType { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int OrderIndex { get; set; }
}

// Validation response
public class ConfigurationValidationResponse
{
    public bool Valid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

// Clone configuration request
public class CloneConfigurationRequest
{
    [Required]
    public Guid SourceJobId { get; set; }

    [Required]
    public Guid SourceRoundId { get; set; }
}

// Configuration list response
public class ConfigurationListResponse
{
    public bool Success { get; set; }
    public List<RoundConfigurationResponse> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}
using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts.Interview;

public class InterviewTemplateCreateDto
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public bool IsDefault { get; set; } = false;
}

public class InterviewTemplateUpdateDto
{
    [MaxLength(255)]
    public string? Name { get; set; }

    public string? Description { get; set; }

    public bool? IsDefault { get; set; }
}

public class InterviewTemplateResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public Guid? CompanyId { get; set; }
    public int UsageCount { get; set; }
    public decimal SuccessRate { get; set; }
    public decimal AverageRating { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public List<InterviewRoundResponseDto> Rounds { get; set; } = new();
}

public class InterviewStatsDto
{
    public int TotalTemplates { get; set; }
    public int ActiveInterviews { get; set; }
    public decimal SuccessRate { get; set; }
    public int AverageDuration { get; set; }
}

public class CloneTemplateRequest
{
    public string Name { get; set; } = string.Empty;
}
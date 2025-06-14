using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts.Interview;

public class InterviewRoundCreateDto
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Type { get; set; } = string.Empty;

    [Range(15, 300)]
    public int Duration { get; set; } = 30;

    [Range(1, int.MaxValue)]
    public int RoundOrder { get; set; }

    public List<string> Requirements { get; set; } = new();

    public List<string> Interviewers { get; set; } = new();

    public bool IsOptional { get; set; } = false;

    [Range(0, 100)]
    public int PassingCriteria { get; set; } = 70;

    public string? Description { get; set; }
}

public class InterviewRoundUpdateDto
{
    [MaxLength(255)]
    public string? Name { get; set; }

    public string? Type { get; set; }

    [Range(15, 300)]
    public int? Duration { get; set; }

    [Range(1, int.MaxValue)]
    public int? RoundOrder { get; set; }

    public List<string>? Requirements { get; set; }

    public List<string>? Interviewers { get; set; }

    public bool? IsOptional { get; set; }

    [Range(0, 100)]
    public int? PassingCriteria { get; set; }

    public string? Description { get; set; }
}

public class InterviewRoundResponseDto
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int RoundOrder { get; set; }
    public List<string> Requirements { get; set; } = new();
    public List<string> Interviewers { get; set; } = new();
    public bool IsOptional { get; set; }
    public int PassingCriteria { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
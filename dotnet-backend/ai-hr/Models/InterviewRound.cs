using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models;

[Table("interview_rounds")]
public class InterviewRound : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("template_id")]
    public Guid TemplateId { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = string.Empty;

    [Column("duration")]
    public int Duration { get; set; } = 30;

    [Column("round_order")]
    public int RoundOrder { get; set; }

    [Column("requirements")]
    public string[]? Requirements { get; set; }

    [Column("interviewers")]
    public string[]? Interviewers { get; set; }

    [Column("is_optional")]
    public bool IsOptional { get; set; } = false;

    [Column("passing_criteria")]
    public int PassingCriteria { get; set; } = 70;

    [Column("description")]
    public string? Description { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

}
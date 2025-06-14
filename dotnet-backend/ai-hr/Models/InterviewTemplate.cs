using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models;

[Table("interview_templates")]
public class InterviewTemplate : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("is_default")]
    public bool IsDefault { get; set; } = false;

    [Column("company_id")]
    public Guid? CompanyId { get; set; }

    [Column("usage_count")]
    public int UsageCount { get; set; } = 0;

    [Column("success_rate")]
    public decimal SuccessRate { get; set; } = 0.0m;

    [Column("average_rating")]
    public decimal AverageRating { get; set; } = 0.0m;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public Guid? CreatedBy { get; set; }
}
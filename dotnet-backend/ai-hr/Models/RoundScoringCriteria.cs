using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models;

[Table("round_scoring_criteria")]
public class RoundScoringCriteria : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("round_config_id")]
    public Guid RoundConfigId { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("weight")]
    public int Weight { get; set; } = 1;

    [Column("max_score")]
    public int MaxScore { get; set; } = 100;

    [Column("scoring_type")]
    public string ScoringType { get; set; } = string.Empty; // numeric, rating, boolean

    [Column("is_required")]
    public bool IsRequired { get; set; } = true;

    [Column("order_index")]
    public int OrderIndex { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
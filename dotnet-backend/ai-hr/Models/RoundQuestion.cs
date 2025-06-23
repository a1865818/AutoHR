using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json;

namespace ai_hr.Models;

[Table("round_questions")]
public class RoundQuestion : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("round_config_id")]
    public Guid RoundConfigId { get; set; }

    [Column("question_text")]
    public string QuestionText { get; set; } = string.Empty;

    [Column("question_type")]
    public string QuestionType { get; set; } = string.Empty; // open, multiple_choice, rating, yes_no

    [Column("category")]
    public string? Category { get; set; }

    [Column("is_required")]
    public bool IsRequired { get; set; } = false;

    [Column("order_index")]
    public int OrderIndex { get; set; }

    [Column("metadata")]
    public JsonElement? Metadata { get; set; } // Store question-specific data (options, weights, etc.)

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
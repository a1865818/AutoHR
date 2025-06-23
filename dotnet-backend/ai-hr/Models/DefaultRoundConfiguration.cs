using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json;

namespace ai_hr.Models;

[Table("default_round_configurations")]
public class DefaultRoundConfiguration : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("round_type")]
    public string RoundType { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("default_duration")]
    public int DefaultDuration { get; set; } = 30;

    [Column("default_configuration")]
    public JsonElement DefaultConfiguration { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
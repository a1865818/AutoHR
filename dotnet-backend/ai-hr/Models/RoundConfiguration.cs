using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json;

namespace ai_hr.Models;

[Table("round_configurations")]
public class RoundConfiguration : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("job_id")]
    public Guid JobId { get; set; }

    [Column("round_id")]
    public Guid RoundId { get; set; }

    [Column("round_type")]
    public string RoundType { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("duration")]
    public int Duration { get; set; } = 30;

    [Column("status")]
    public string Status { get; set; } = "draft"; // draft, configured, active, archived

    [Column("configuration_data")]
    public JsonElement ConfigurationData { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public Guid? CreatedBy { get; set; }

    [Column("last_modified_by")]
    public Guid? LastModifiedBy { get; set; }

    [Column("version")]
    public int Version { get; set; } = 1;
}
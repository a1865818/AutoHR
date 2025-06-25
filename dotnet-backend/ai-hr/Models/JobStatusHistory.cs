
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("job_status_history")]
    public class JobStatusHistory : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("job_id")]
        public Guid JobId { get; set; }

        [Column("from_status")]
        public string FromStatus { get; set; } = string.Empty;

        [Column("to_status")]
        public string ToStatus { get; set; } = string.Empty;

        [Column("changed_by")]
        public Guid ChangedBy { get; set; }

        [Column("changed_at")]
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        [Column("reason")]
        public string? Reason { get; set; }
    }
}
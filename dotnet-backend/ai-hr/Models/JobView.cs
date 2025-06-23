using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("job_views")]
    public class JobView : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("job_id")]
        public Guid JobId { get; set; }

        [Column("user_id")]
        public Guid? UserId { get; set; } // Nullable for anonymous users

        [Column("session_id")]
        public string? SessionId { get; set; } // For tracking anonymous users

        [Column("user_type")]
        public string UserType { get; set; } = string.Empty; // "HiringUser", "ApplicationUser", "Anonymous"

        [Column("ip_address")]
        public string? IpAddress { get; set; }

        [Column("user_agent")]
        public string? UserAgent { get; set; }

        [Column("viewed_at")]
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

        [Column("referrer")]
        public string? Referrer { get; set; }
    }
}
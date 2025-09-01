using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("ApplicationUser")]
    public class ApplicationUser : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; }
        [Column("Email")]
        public string Email { get; set; }
        
        // Supabase Auth integration (optional for hybrid auth)
        [Column("SupabaseAuthId")]
        public string? SupabaseAuthId { get; set; }

        // Legacy authentication fields (kept for backward compatibility)
        // Password field removed - authentication handled by Supabase
        
        [Column("FirstName")]
        public string FirstName { get; set; }
        [Column("LastName")]
        public string LastName { get; set; }
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }
        
        // Legacy refresh token fields removed - Supabase handles token lifecycle
        [Column("IsActive")]
        public bool IsActive { get; set; } = true;
        [Column("Roles")]
        public string Roles { get; set; } = "User";

        // Indicates if this is a public/guest user (applied without registration)
        [Column("isPublic")]
        public bool IsPublic { get; set; } = false;

        // Profile data stored as JSONB
        [Column("Education")]
        public List<Dictionary<string, object>>? Education { get; set; }

        [Column("Experiences")]
        public List<Dictionary<string, object>>? Experiences { get; set; }

        [Column("SocialLink")]
        public Dictionary<string, object>? SocialLink { get; set; }

        [Column("PhoneNumber")]
        public string? PhoneNumber { get; set; }

        // Location information - storing city and country
        [Column("Location")]
        public Dictionary<string, object>? Location { get; set; }

        // Resume management - storing multiple resume URLs
        [Column("ResumeList")]
        public List<Dictionary<string, object>>? ResumeList { get; set; }

        // Saved jobs - storing array of job IDs that user has saved as favorites
        [Column("SavedJobs")]
        public List<string>? SavedJobs { get; set; }
    }
}
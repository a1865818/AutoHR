using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("ApplicationDetails")]
    public class ApplicationDetail : BaseModel
    {
        [PrimaryKey("id", true)] // true means we provide the ID value on insert
        public Guid Id { get; set; }

        [Column("job_id")]
        public Guid JobId { get; set; }

        [Column("candidate_user_id")]
        public Guid CandidateUserId { get; set; }

        [Column("resume_url")]
        public string? ResumeUrl { get; set; }

        [Column("cover_letter_text")]
        public string? CoverLetterText { get; set; }

        [Column("expected_salary")]
        public decimal? ExpectedSalary { get; set; }

        [Column("availability_date")]
        public DateTime? AvailabilityDate { get; set; }

        [Column("status")]
        public string Status { get; set; } = "applied"; // Remove nullable and set default

        [Column("stage")]
        public string Stage { get; set; } = "initial_review"; // Remove nullable and set default

        [Column("job_source")]
        public string? JobSource { get; set; }

        [Column("overall_ai_score")]
        public decimal? OverallAiScore { get; set; }

        [Column("ai_analysis")]
        public Dictionary<string, object>? AiAnalysis { get; set; }

        [Column("applied_at")]
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        [Column("status_changed_at")]
        public DateTime StatusChangedAt { get; set; } = DateTime.UtcNow;

        // NEW: Add hiring notes column
        [Column("hiring_notes")]
        public string? HiringNotes { get; set; }

        [Column("notes_created_at")]
        public DateTime? NotesCreatedAt { get; set; }

        [Column("notes_updated_at")]
        public DateTime? NotesUpdatedAt { get; set; }

        // Constructor to ensure ID is always set
        public ApplicationDetail()
        {
            Id = Guid.NewGuid();
            AppliedAt = DateTime.UtcNow;
            StatusChangedAt = DateTime.UtcNow;
            Status = "applied";
            Stage = "initial_review";
        }
    }
}
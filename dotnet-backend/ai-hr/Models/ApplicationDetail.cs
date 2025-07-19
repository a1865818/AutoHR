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
        public string Status { get; set; } = "In Progress"; // Changed default from "applied" to match pipeline

        [Column("stage")]
        public string Stage { get; set; } = "Applied"; // Updated default to match new system

        [Column("current_round_id")]
        public string? CurrentRoundId { get; set; } = "new"; // Default to "new" stage

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

        // NEW: Add rejection tracking fields
        [Column("rejection_reason")]
        public string? RejectionReason { get; set; }

        [Column("rejection_notes")]
        public string? RejectionNotes { get; set; }

        [Column("rejected_at")]
        public DateTime? RejectedAt { get; set; }

        [Column("isSendRejectEmail")]
        public bool IsSendRejectEmail { get; set; } = false;

        // Valid stages for the new granular system
        public static readonly string[] ValidStages = {
            "Applied", "Phone Screening", "Video Interview", "Technical Assessment",
            "Coding Challenge", "Panel Interview",
            "Final Interview", "Culture Fit", "Offer"
        };

        // Valid statuses
        public static readonly string[] ValidStatuses = {
            "applied", "In Progress", "Hired", "Rejected", "Offered"
        };

        // Stage validation method
        public bool IsValidStage(string stage) => ValidStages.Contains(stage);

        // Status validation method  
        public bool IsValidStatus(string status) => ValidStatuses.Contains(status);

        // Constructor to ensure ID is always set
        public ApplicationDetail()
        {
            Id = Guid.NewGuid();
            AppliedAt = DateTime.UtcNow;
            StatusChangedAt = DateTime.UtcNow;
            Status = "In Progress";
            Stage = "Applied";
            CurrentRoundId = "new";
        }
    }
}
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
// using System;
// using System.Collections.Generic;

namespace ai_hr.Models
{
    [Table("ApplicationDetails")]
    public class ApplicationDetail : BaseModel
    {
        [PrimaryKey("id", false)]
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
        public string? Status { get; set; } = "applied";

        [Column("stage")]
        public string? Stage { get; set; } = "initial_review";

        [Column("job_source")]
        public string? JobSource { get; set; }

        [Column("overall_ai_score")]
        public decimal? OverallAiScore { get; set; }

        [Column("ai_analysis")]
        public Dictionary<string, object>? AiAnalysis { get; set; } // Representing JSONB as Dictionary

        [Column("applied_at")]
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        [Column("status_changed_at")]
        public DateTime StatusChangedAt { get; set; } = DateTime.UtcNow;
    }
}
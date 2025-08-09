using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("assessment_submissions")]
    public class AssessmentSubmission : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("candidate_id")]
        public Guid CandidateId { get; set; }

        [Column("round_id")]
        public Guid RoundId { get; set; }

        [Column("job_id")]
        public Guid JobId { get; set; }

        [Column("submitted_at")]
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        [Column("pdf_url")]
        public string PdfUrl { get; set; } = string.Empty;

        [Column("github_url")]
        public string? GithubUrl { get; set; }

        [Column("status")]
        public string Status { get; set; } = "submitted"; // "submitted", "graded", "pending"

        [Column("submission_data")]
        public object? SubmissionData { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Constructor to ensure ID is always set
        public AssessmentSubmission()
        {
            Id = Guid.NewGuid();
            SubmittedAt = DateTime.UtcNow;
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            Status = "submitted";
            SubmissionData = new Dictionary<string, object>();
            PdfUrl = string.Empty;
            GithubUrl = null;
        }
    }
}
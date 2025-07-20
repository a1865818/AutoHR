using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("assessment_grades")]
    public class AssessmentGrade : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("submission_id")]
        public Guid SubmissionId { get; set; }

        [Column("candidate_id")]
        public Guid CandidateId { get; set; }

        [Column("round_id")]
        public Guid RoundId { get; set; }

        [Column("job_id")]
        public Guid JobId { get; set; }

        [Column("total_score")]
        public decimal TotalScore { get; set; }

        [Column("max_score")]
        public decimal MaxScore { get; set; }

        [Column("percentage")]
        public decimal Percentage { get; set; }

        [Column("overall_notes")]
        public string OverallNotes { get; set; } = string.Empty;

        [Column("question_scores")]
        public object QuestionScores { get; set; }

        [Column("graded_at")]
        public DateTime GradedAt { get; set; } = DateTime.UtcNow;

        [Column("graded_by")]
        public Guid GradedBy { get; set; }

        [Column("status")]
        public string Status { get; set; } = "draft"; // "draft", "final"

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Constructor to ensure ID is always set
        public AssessmentGrade()
        {
            Id = Guid.NewGuid();
            GradedAt = DateTime.UtcNow;
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            Status = "draft";
            QuestionScores = new List<object>();
        }
    }
} 
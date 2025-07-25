using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts
{
    public class AssessmentSubmissionResponse
    {
        public Guid Id { get; set; }
        public Guid CandidateId { get; set; }
        public Guid RoundId { get; set; }
        public Guid JobId { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string PdfUrl { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public object? SubmissionData { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public CandidateInfo? Candidate { get; set; }
    }

    public class CandidateInfo
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Photo { get; set; }
    }

    public class AssessmentGradeRequest
    {
        [Required]
        public Guid SubmissionId { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal TotalScore { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal MaxScore { get; set; }

        public string OverallNotes { get; set; } = string.Empty;

        [Required]
        public List<QuestionScoreRequest> QuestionScores { get; set; } = new();
    }

    public class QuestionScoreRequest
    {
        [Required]
        public string QuestionId { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Score { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal MaxScore { get; set; }

        public string Notes { get; set; } = string.Empty;
    }

    public class AssessmentGradeResponse
    {
        public Guid Id { get; set; }
        public Guid SubmissionId { get; set; }
        public Guid CandidateId { get; set; }
        public Guid RoundId { get; set; }
        public Guid JobId { get; set; }
        public decimal TotalScore { get; set; }
        public decimal MaxScore { get; set; }
        public decimal Percentage { get; set; }
        public string OverallNotes { get; set; } = string.Empty;
        public List<QuestionScoreResponse> QuestionScores { get; set; } = new();
        public DateTime GradedAt { get; set; }
        public Guid GradedBy { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class QuestionScoreResponse
    {
        public string QuestionId { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public decimal MaxScore { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class AssessmentGradeUpdateRequest
    {
        public decimal? TotalScore { get; set; }
        public decimal? MaxScore { get; set; }
        public string? OverallNotes { get; set; }
        public List<QuestionScoreRequest>? QuestionScores { get; set; }
        public string? Status { get; set; }
    }

    public class AssessmentSubmissionCreateRequest
    {
        [Required]
        public Guid CandidateId { get; set; }

        [Required]
        public Guid RoundId { get; set; }

        [Required]
        public Guid JobId { get; set; }

        [Required]
        public string PdfUrl { get; set; } = string.Empty;

        public object? SubmissionData { get; set; }
    }

    public class AssessmentSubmissionUpdateRequest
    {
        public string? PdfUrl { get; set; }
        public string? Status { get; set; }
        public object? SubmissionData { get; set; }
    }
} 
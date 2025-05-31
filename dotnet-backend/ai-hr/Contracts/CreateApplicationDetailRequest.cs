// using System;
// using System.Collections.Generic;
// using System.ComponentModel.DataAnnotations;



namespace ai_hr.Contracts
{
    public class CreateApplicationDetailRequest
    {
        // [Required]
        public Guid JobId { get; set; }

        // [Required]
        public Guid CandidateUserId { get; set; }

        public string? ResumeUrl { get; set; }
        public string? CoverLetterText { get; set; }
        public decimal? ExpectedSalary { get; set; }
        public DateTime? AvailabilityDate { get; set; }
        public string? JobSource { get; set; }
        public Dictionary<string, object>? AiAnalysis { get; set; }
    }
}
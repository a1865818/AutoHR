// using System;
// using System.Collections.Generic;


public class UpdateApplicationDetailRequest
{
    public string? ResumeUrl { get; set; }
    public string? CoverLetterText { get; set; }
    public decimal? ExpectedSalary { get; set; }
    public DateTime? AvailabilityDate { get; set; }
    public string? Status { get; set; }
    public string? Stage { get; set; }
    public string? JobSource { get; set; }
    public decimal? OverallAiScore { get; set; }
    public Dictionary<string, object>? AiAnalysis { get; set; }
}

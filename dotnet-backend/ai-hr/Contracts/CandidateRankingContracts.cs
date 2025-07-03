namespace ai_hr.Contracts
{
    public class AddCandidatesToRankingRequest
    {
        public Guid CompanyId { get; set; }
        public Guid JobId { get; set; }
        public List<Guid> ApplicationIds { get; set; } = new List<Guid>();
        public Guid RankedBy { get; set; }
    }

    public class RemoveCandidateFromRankingRequest
    {
        public Guid CompanyId { get; set; }
        public Guid JobId { get; set; }
        public Guid ApplicationId { get; set; }
    }

    public class UpdateRankingPositionRequest
    {
        public Guid CompanyId { get; set; }
        public Guid JobId { get; set; }
        public Guid ApplicationId { get; set; }
        public int NewPosition { get; set; }
        public decimal? NewScore { get; set; }
        public Dictionary<string, object>? AiAnalysisData { get; set; }
        public string? RankingNotes { get; set; }
    }

    public class GetRankingsByJobRequest
    {
        public Guid CompanyId { get; set; }
        public Guid JobId { get; set; }
    }

    public class CandidateRankingResponse
    {
        public Guid Id { get; set; }
        public Guid CompanyId { get; set; }
        public Guid JobId { get; set; }
        public Guid ApplicationId { get; set; }
        public Guid CandidateUserId { get; set; }
        public decimal RankingScore { get; set; }
        public int RankingPosition { get; set; }
        public Dictionary<string, object>? AiAnalysisData { get; set; }
        public string? RankingNotes { get; set; }
        public bool IsRanked { get; set; }
        public Guid RankedBy { get; set; }
        public DateTime RankedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Additional candidate information
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateEmail { get; set; } = string.Empty;
        public string? CandidatePhoto { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public decimal AssessmentScore { get; set; }
        public string Stage { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class RankingsByJobResponse
    {
        public Guid JobId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public List<CandidateRankingResponse> Rankings { get; set; } = new List<CandidateRankingResponse>();
        public int TotalRanked { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class BulkRankingResponse
    {
        public bool Success { get; set; }
        public int AddedCount { get; set; }
        public int SkippedCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public string Message { get; set; } = string.Empty;
    }
} 
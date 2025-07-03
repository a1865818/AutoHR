using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("CandidateRankings")]
    public class CandidateRanking : BaseModel
    {
        [PrimaryKey("id", true)]
        public Guid Id { get; set; }

        [Column("company_id")]
        public Guid CompanyId { get; set; }

        [Column("job_id")]
        public Guid JobId { get; set; }

        [Column("application_id")]
        public Guid ApplicationId { get; set; }

        [Column("candidate_user_id")]
        public Guid CandidateUserId { get; set; }

        [Column("ranking_score")]
        public decimal RankingScore { get; set; }

        [Column("ranking_position")]
        public int RankingPosition { get; set; }

        [Column("ai_analysis_data")]
        public Dictionary<string, object>? AiAnalysisData { get; set; }

        [Column("is_ranked")]
        public bool IsRanked { get; set; } = true;

        [Column("ranked_by")]
        public Guid RankedBy { get; set; }

        [Column("ranked_at")]
        public DateTime RankedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Constructor to ensure ID is always set
        public CandidateRanking()
        {
            Id = Guid.NewGuid();
            RankedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            IsRanked = true;
        }
    }
} 
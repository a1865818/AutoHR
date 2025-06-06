// Models/Job.cs - Updated to include missing fields
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models
{
    [Table("jobs")]
    public class Job : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("company_id")]
        public Guid CompanyId { get; set; }

        [Column("created_by")]
        public Guid CreatedBy { get; set; }

        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [Column("responsibilities")]
        public List<string> Responsibilities { get; set; } = new();

        [Column("requirements")]
        public List<string> Requirements { get; set; } = new();

        [Column("qualifications")]
        public List<string> Qualifications { get; set; } = new();

        [Column("benefits")]
        public List<string> Benefits { get; set; } = new();

        [Column("employment_type")]
        public string EmploymentType { get; set; } = string.Empty; // "Full-Time", "Part-Time", etc.

        [Column("seniority_level")]
        public string? SeniorityLevel { get; set; }

        [Column("experience_years_min")]
        public int? ExperienceYearsMin { get; set; }

        [Column("location_type")]
        public string LocationType { get; set; } = string.Empty; // "On-site", "Remote", "Hybrid"

        [Column("locations")]
        public Dictionary<string, object> Locations { get; set; } = new();

        [Column("salary_min")]
        public decimal? SalaryMin { get; set; }

        [Column("salary_max")]
        public decimal? SalaryMax { get; set; }

        [Column("salary_currency")]
        public string SalaryCurrency { get; set; } = "USD";

        [Column("application_deadline")]
        public DateTime? ApplicationDeadline { get; set; }

        [Column("status")]
        public string Status { get; set; } = "Open";

        [Column("applicant_count")]
        public int ApplicantCount { get; set; } = 0;

        [Column("view_count")]
        public int ViewCount { get; set; } = 0;

        [Column("ai_generated_description")]
        public bool AiGeneratedDescription { get; set; } = false;

        [Column("skill_match_threshold")]
        public decimal SkillMatchThreshold { get; set; } = 0.70m;

        [Column("posted_date")]
        public DateTime? PostedDate { get; set; }

        [Column("closed_date")]
        public DateTime? ClosedDate { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Additional fields for the frontend
        [Column("company_name")]
        public string? CompanyName { get; set; }

        [Column("department")]
        public string? Department { get; set; }

        public Job()
        {
            Id = Guid.NewGuid();
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
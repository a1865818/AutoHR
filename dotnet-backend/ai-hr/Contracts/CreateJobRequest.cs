// using System;
// using System.Collections.Generic;
// using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts
{
    public class CreateJobRequest
    {
        public string Title { get; set; }
        
        public Guid CompanyId { get; set; }
        
        public Guid CreatedBy { get; set; }
        
        public string Description { get; set; }
        
        public List<string> Responsibilities { get; set; }
        public List<string> Requirements { get; set; }
        public List<string> Qualifications { get; set; }
        public List<string> Benefits { get; set; }
        
        public string EmploymentType { get; set; }
        
        public string SeniorityLevel { get; set; }
        public int? ExperienceYearsMin { get; set; }
        
        public string LocationType { get; set; }
        
        public List<Dictionary<string, object>> Locations { get; set; }
        
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string SalaryCurrency { get; set; } = "USD";
        
        public DateTime? ApplicationDeadline { get; set; }
        public string Status { get; set; } = "draft";
        public bool AiGeneratedDescription { get; set; } = false;
        public decimal SkillMatchThreshold { get; set; } = 0.70m;
    }
}
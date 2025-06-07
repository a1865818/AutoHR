// using System;
// using System.Collections.Generic;

namespace ai_hr.Contracts
{
    public class UpdateJobRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public List<string> Responsibilities { get; set; }
        public List<string> Requirements { get; set; }
        public List<string> Qualifications { get; set; }
        public List<string> Benefits { get; set; }
        public string EmploymentType { get; set; }
        public string SeniorityLevel { get; set; }
        public int? ExperienceYearsMin { get; set; }
        public string LocationType { get; set; }
        public Dictionary<string, object> Locations { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string SalaryCurrency { get; set; }
        public DateTime? ApplicationDeadline { get; set; }
        public string Status { get; set; }
        public bool? AiGeneratedDescription { get; set; }
        public decimal? SkillMatchThreshold { get; set; }
        public DateTime? PostedDate { get; set; }
        public DateTime? ClosedDate { get; set; }
        public Guid? InterviewTemplateId { get; set; }
    }
}
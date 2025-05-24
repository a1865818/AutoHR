namespace WebApplication1.Entities
{
    public class Jobs
    {
        public Guid Id { get; set; } = Guid.NewGuid(); // Initialize with new GUID
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Experience { get; set; }
        public string? Salary { get; set; }
        public string? Description { get; set; }
        public string? Requirements { get; set; }
        public DateTime PostedDate { get; set; } = DateTime.Now;
        public int Applicants { get; set; } = 0;
        public string Status { get; set; } = "Active";
        public string? Urgency { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
    }

}

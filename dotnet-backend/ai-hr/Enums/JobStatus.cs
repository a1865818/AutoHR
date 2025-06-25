namespace ai_hr.Enums
{
    public enum JobStatus
    {
        Draft,      // Job saved but not published
        Active,     // Active job accepting applications (Backend: Open)
        Paused,     // Temporarily stopped accepting applications  
        Closed,     // No longer accepting applications
        Expired,    // Past application deadline
        Cancelled   // Job cancelled/removed from posting
    }

    public static class JobStatusExtensions
    {
        public static string ToDisplayString(this JobStatus status)
        {
            return status switch
            {
                JobStatus.Draft => "Draft",
                JobStatus.Active => "Active",
                JobStatus.Paused => "Paused",
                JobStatus.Closed => "Closed",
                JobStatus.Expired => "Expired",
                JobStatus.Cancelled => "Cancelled",
                _ => status.ToString()
            };
        }

        // Convert from database/API string to enum (handles both "Open" and "Active")
        public static JobStatus FromString(string status)
        {
            return status?.Trim() switch
            {
                "Draft" => JobStatus.Draft,
                "Open" or "Active" => JobStatus.Active,
                "Paused" => JobStatus.Paused,
                "Closed" => JobStatus.Closed,
                "Expired" => JobStatus.Expired,
                "Cancelled" => JobStatus.Cancelled,
                _ => JobStatus.Draft
            };
        }

        // Convert to database string (Open for backend compatibility)
        public static string ToDatabaseString(this JobStatus status)
        {
            return status switch
            {
                JobStatus.Draft => "Draft",
                JobStatus.Active => "Open",  // Store as "Open" in database
                JobStatus.Paused => "Paused",
                JobStatus.Closed => "Closed",
                JobStatus.Expired => "Expired",
                JobStatus.Cancelled => "Cancelled",
                _ => "Draft"
            };
        }

        public static bool IsActive(this JobStatus status)
        {
            return status == JobStatus.Active;
        }

        public static bool AcceptsApplications(this JobStatus status)
        {
            return status == JobStatus.Active;
        }
    }
}

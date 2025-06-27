namespace ai_hr.Enums
{
    public enum JobStatus
    {
        Draft,      // Job is in draft mode, not yet posted
        Open,       // Job is active and accepting applications
        Paused,     // Job is temporarily paused
        Closed,     // Job is closed, no longer accepting applications
        Expired     // Job posting has expired
    }

    public static class JobStatusExtensions
    {
        public static string ToDisplayString(this JobStatus status)
        {
            return status switch
            {
                JobStatus.Draft => "Draft",
                JobStatus.Open => "Active",
                JobStatus.Paused => "Paused",
                JobStatus.Closed => "Closed",
                JobStatus.Expired => "Expired",
                _ => "Unknown"
            };
        }

        public static JobStatus FromString(string statusString)
        {
            return statusString.ToLower() switch
            {
                "draft" => JobStatus.Draft,
                "open" or "active" => JobStatus.Open,
                "paused" => JobStatus.Paused,
                "closed" => JobStatus.Closed,
                "expired" => JobStatus.Expired,
                _ => JobStatus.Draft
            };
        }

        public static string ToBackendString(this JobStatus status)
        {
            return status switch
            {
                JobStatus.Draft => "Draft",
                JobStatus.Open => "Open",
                JobStatus.Paused => "Paused",
                JobStatus.Closed => "Closed",
                JobStatus.Expired => "Expired",
                _ => "Draft"
            };
        }

        public static bool IsActive(this JobStatus status)
        {
            return status == JobStatus.Open;
        }

        public static bool AcceptsApplications(this JobStatus status)
        {
            return status == JobStatus.Open;
        }
    }
}

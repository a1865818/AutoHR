
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Contracts
{
    public class JobStatusChangeRequest
    {
        public string Status { get; set; } = string.Empty; // "Active", "Paused", etc.
        public string? Reason { get; set; } // Optional reason for status change
        public DateTime? EffectiveDate { get; set; } // When status change takes effect
    }

    public class BulkJobStatusChangeRequest
    {
        public List<Guid> JobIds { get; set; } = new();
        public string Status { get; set; } = string.Empty; // "Active", "Paused", etc.
        public string? Reason { get; set; }
    }

    public class JobDuplicateRequest
    {
        public string? NewTitle { get; set; } // Optional new title
        public bool CopyApplications { get; set; } = false; // Whether to copy existing applications
        public string Status { get; set; } = "Draft"; // Status for duplicated job
    }
}

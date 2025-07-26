using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts
{
    public class UpdateApplicationDetailRequest
    {
        public string? Status { get; set; }
        public string? Stage { get; set; }
        public string? CurrentRoundId { get; set; }
        public string? Notes { get; set; }

        // Rejection tracking fields
        public string? RejectionReason { get; set; }
        public string? RejectionNotes { get; set; }
        public bool? IsSendRejectEmail { get; set; }

        // Notification tracking fields for each round type
        public bool? IsSendPhoneScreening { get; set; }
        public bool? IsSendVideoInterview { get; set; }
        public bool? IsSendTechAssessment { get; set; }
        public bool? IsSendCodeChallenge { get; set; }
        public bool? IsSendCultureFit { get; set; }
        public bool? IsSendFinalInterview { get; set; }

        // Validation method for stage
        public bool IsValidStage()
        {
            if (string.IsNullOrEmpty(Stage)) return true; // Allow null/empty

            var validStages = new[] {
                "Applied", "Phone Screening", "Video Interview", "Technical Assessment",
                "Coding Challenge", "Final Interview", "Culture Fit", "Offer"
            };

            return validStages.Contains(Stage);
        }

        // Validation method for status
        public bool IsValidStatus()
        {
            if (string.IsNullOrEmpty(Status)) return true; // Allow null/empty

            var validStatuses = new[] {
                "applied", "In Progress", "Hired", "Rejected", "Offered"
            };

            return validStatuses.Contains(Status);
        }
    }
}

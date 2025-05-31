using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts
{
    public class UnifiedRegisterRequest
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        [MinLength(6)]
        public required string Password { get; set; }

        [Required]
        [MinLength(2)]
        public required string FirstName { get; set; }

        [Required]
        [MinLength(2)]
        public required string LastName { get; set; }

        [Required]
        public required string UserCategory { get; set; } // "ApplicationUser" or "HiringUserProfile"

        // HiringUserProfile specific fields (optional)
        public string? UserType { get; set; } // recruiter, hiring_manager, admin, candidate
        public Guid? CompanyId { get; set; }
        public string? Bio { get; set; }
        public string? LinkedinUrl { get; set; }
        public Dictionary<string, object>? Location { get; set; }
        public Dictionary<string, object>? Preferences { get; set; }
    }
}
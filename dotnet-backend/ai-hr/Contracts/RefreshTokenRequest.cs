using System.ComponentModel.DataAnnotations;

namespace ai_hr.Contracts
{
    public class RefreshTokenRequest
    {
        [Required]
        public required string RefreshToken { get; set; }
    }
}
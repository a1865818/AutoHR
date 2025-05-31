namespace ai_hr.Contracts
{
    public class UnifiedLoginResponse
    {
        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
        public required string UserId { get; set; }
        public required string Email { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string UserCategory { get; set; } // "ApplicationUser" or "HiringUserProfile"
        public DateTime TokenExpiresAt { get; set; }

        // HiringUserProfile specific fields (optional)
        public string? UserType { get; set; }
        public Guid? CompanyId { get; set; }
    }
}
namespace ai_hr.Contracts
{
    public class LoginResponse
    {
        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
        public required string UserId { get; set; }
        public required string Email { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public DateTime TokenExpiresAt { get; set; }
        public bool IsSupabaseAuth { get; set; } = false; // Indicates if this is Supabase Auth or legacy
    }
}
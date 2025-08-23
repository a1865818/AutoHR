using Supabase.Gotrue;
using ai_hr.Contracts;

namespace ai_hr.Services
{
    public interface ISupabaseAuthService
    {
        /// <summary>
        /// Sign up a new user with email and password
        /// </summary>
        Task<SupabaseAuthResponse?> SignUpAsync(SupabaseSignUpRequest request);

        /// <summary>
        /// Sign in an existing user with email and password
        /// </summary>
        Task<SupabaseAuthResponse?> SignInAsync(SupabaseSignInRequest request);

        /// <summary>
        /// Sign out the current user
        /// </summary>
        Task<bool> SignOutAsync();

        /// <summary>
        /// Send password reset email
        /// </summary>
        Task<bool> SendPasswordResetAsync(string email);

        /// <summary>
        /// Verify email with token
        /// </summary>
        Task<bool> VerifyEmailAsync(string token);

        /// <summary>
        /// Get current user from session
        /// </summary>
        Task<User?> GetCurrentUserAsync();

        /// <summary>
        /// Get user by ID
        /// </summary>
        Task<User?> GetUserByIdAsync(string userId);

        /// <summary>
        /// Update user email
        /// </summary>
        Task<bool> UpdateUserEmailAsync(string newEmail);

        /// <summary>
        /// Update user password
        /// </summary>
        Task<bool> UpdateUserPasswordAsync(string newPassword);

        /// <summary>
        /// Refresh the current session
        /// </summary>
        Task<Session?> RefreshSessionAsync();

        /// <summary>
        /// Validate JWT token and get user claims
        /// </summary>
        Task<User?> ValidateTokenAsync(string accessToken);

        /// <summary>
        /// Create user programmatically (for migration)
        /// </summary>
        Task<User?> CreateUserAsync(string email, string password, string firstName, string lastName);

        /// <summary>
        /// Get user session from access token
        /// </summary>
        Task<Session?> GetSessionFromTokenAsync(string accessToken);
    }
}
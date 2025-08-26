using ai_hr.Contracts;

namespace ai_hr.Services
{
    public interface IUnifiedAuthService
    {
        Task<LoginResponse?> LoginAsync(LoginRequest request);
        Task<LoginResponse?> RegisterAsync(RegisterRequest request);
        Task<LoginResponse?> RegisterHiringUserAsync(RegisterHiringUserRequest request);
        Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request);
        Task<bool> LogoutAsync(string userId);
        Task<bool> ForgotPasswordAsync(string email);
        Task<dynamic?> GetCurrentUserAsync(string supabaseUserId);
    }
}
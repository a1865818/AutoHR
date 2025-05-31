using ai_hr.Contracts;

namespace ai_hr.Services
{
    public interface IHiringUserProfileAuthenticationService
    {
        Task<UnifiedLoginResponse?> LoginAsync(LoginRequest request);
        Task<UnifiedLoginResponse?> RegisterAsync(UnifiedRegisterRequest request);
        Task<UnifiedLoginResponse?> RefreshTokenAsync(RefreshTokenRequest request);
        Task<bool> LogoutAsync(string userId);
    }
}
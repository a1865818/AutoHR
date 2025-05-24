using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
        public interface IAuthService
        {
            Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
            Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
            Task<AuthResponseDto> RefreshTokenAsync(string token);
            Task<bool> LogoutAsync(string userId);
        }
    
}

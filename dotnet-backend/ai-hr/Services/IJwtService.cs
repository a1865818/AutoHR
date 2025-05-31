using ai_hr.Models;
using System.Security.Claims;

namespace ai_hr.Services
{
    public interface IJwtService
    {
        string GenerateAccessToken(ApplicationUser user);
        string GenerateAccessToken(HiringUserProfile user);
        string GenerateRefreshToken();
        ClaimsPrincipal? ValidateToken(string token);
        string? GetUserIdFromToken(string token);
    }
}
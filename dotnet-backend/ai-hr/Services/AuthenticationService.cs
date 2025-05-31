using ai_hr.Contracts;
using ai_hr.Models;
using BCrypt.Net;
using Microsoft.Extensions.Options;

namespace ai_hr.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly Supabase.Client _supabaseClient;
        private readonly IJwtService _jwtService;
        private readonly JwtSettings _jwtSettings;

        public AuthenticationService(
            Supabase.Client supabaseClient,
            IJwtService jwtService,
            IOptions<JwtSettings> jwtSettings)
        {
            _supabaseClient = supabaseClient;
            _jwtService = jwtService;
            _jwtSettings = jwtSettings.Value;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            try
            {
                // Find user by email
                var userResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Email == request.Email && u.IsActive == true)
                    .Get();

                var user = userResponse.Models.FirstOrDefault();
                if (user == null)
                {
                    return null; // User not found
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                {
                    return null; // Invalid password
                }

                // Generate tokens
                var accessToken = _jwtService.GenerateAccessToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                // Update user with refresh token
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

                await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == user.Id)
                    .Update(user);

                return new LoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    UserId = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                return null;
            }
        }

        public async Task<LoginResponse?> RegisterAsync(RegisterRequest request)
        {
            try
            {
                // Check if user already exists
                var existingUserResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Email == request.Email)
                    .Get();

                if (existingUserResponse.Models.Any())
                {
                    return null; // User already exists
                }

                // Hash password
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

                // Create new user
                var newUser = new ApplicationUser
                {
                    Email = request.Email,
                    Password = hashedPassword,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    CreatedAt = DateTime.UtcNow.AddHours(7),
                    IsActive = true,
                    Roles = "User"
                };

                var response = await _supabaseClient
                    .From<ApplicationUser>()
                    .Insert(newUser);

                var createdUser = response.Models.FirstOrDefault();
                if (createdUser == null)
                {
                    return null; // Registration failed
                }

                // Generate tokens for immediate login
                var accessToken = _jwtService.GenerateAccessToken(createdUser);
                var refreshToken = _jwtService.GenerateRefreshToken();

                // Update user with refresh token
                createdUser.RefreshToken = refreshToken;
                createdUser.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

                await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == createdUser.Id)
                    .Update(createdUser);

                return new LoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    UserId = createdUser.Id,
                    Email = createdUser.Email,
                    FirstName = createdUser.FirstName,
                    LastName = createdUser.LastName,
                    TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Registration error: {ex.Message}");
                return null;
            }
        }

        public async Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request)
        {
            try
            {
                // Find user by refresh token
                var userResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.RefreshToken == request.RefreshToken && u.IsActive == true)
                    .Get();

                var user = userResponse.Models.FirstOrDefault();
                if (user == null || user.RefreshTokenExpiry <= DateTime.UtcNow)
                {
                    return null; // Invalid or expired refresh token
                }

                // Generate new tokens
                var accessToken = _jwtService.GenerateAccessToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                // Update user with new refresh token
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

                await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == user.Id)
                    .Update(user);

                return new LoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    UserId = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Refresh token error: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> LogoutAsync(string userId)
        {
            try
            {
                // Clear refresh token
                var userResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == userId)
                    .Get();

                var user = userResponse.Models.FirstOrDefault();
                if (user == null)
                {
                    return false;
                }

                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;

                await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == userId)
                    .Update(user);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Logout error: {ex.Message}");
                return false;
            }
        }
    }
}
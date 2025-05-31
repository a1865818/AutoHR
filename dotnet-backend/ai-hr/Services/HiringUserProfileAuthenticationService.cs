using ai_hr.Contracts;
using ai_hr.Models;
using BCrypt.Net;
using Microsoft.Extensions.Options;

namespace ai_hr.Services
{
    public class HiringUserProfileAuthenticationService : IHiringUserProfileAuthenticationService
    {
        private readonly Supabase.Client _supabaseClient;
        private readonly IJwtService _jwtService;
        private readonly JwtSettings _jwtSettings;

        public HiringUserProfileAuthenticationService(
            Supabase.Client supabaseClient,
            IJwtService jwtService,
            IOptions<JwtSettings> jwtSettings)
        {
            _supabaseClient = supabaseClient;
            _jwtService = jwtService;
            _jwtSettings = jwtSettings.Value;
        }

        public async Task<UnifiedLoginResponse?> LoginAsync(LoginRequest request)
        {
            try
            {
                var userResponse = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.Email == request.Email && u.IsActive == true)
                    .Get();

                var user = userResponse.Models.FirstOrDefault();
                if (user == null)
                {
                    return null; // User not found or no password set
                }

                if (string.IsNullOrEmpty(user.Password))
                {
                    return null; // User not found or no password set
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                {
                    Console.WriteLine("[DEBUG] Login failed: Password verification failed");
                    return null; // Invalid password
                }


                // Generate tokens
                var accessToken = _jwtService.GenerateAccessToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                // Update user with refresh token
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

                await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.Id == user.Id)
                    .Update(user);

                return new UnifiedLoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    UserId = user.Id.ToString(),
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    UserCategory = "HiringUserProfile",
                    UserType = user.UserType,
                    CompanyId = user.CompanyId,
                    TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"HiringUserProfile login error: {ex.Message}");
                Console.WriteLine($"[DEBUG] Full login exception: {ex}");
                return null;
            }
        }

        public async Task<UnifiedLoginResponse?> RegisterAsync(UnifiedRegisterRequest request)
        {
            try
            {
                Console.WriteLine($"[DEBUG] Starting registration for email: {request.Email}");
                Console.WriteLine($"[DEBUG] UserType: {request.UserType ?? "NULL"}");
                Console.WriteLine($"[DEBUG] UserCategory: {request.UserCategory ?? "NULL"}");

                // Validate HiringUserProfile specific requirements
                if (string.IsNullOrEmpty(request.UserType))
                {
                    Console.WriteLine("[DEBUG] Registration failed: UserType is null or empty");
                    return null; // UserType is required for HiringUserProfile
                }



                // Check if user already exists in either table
                Console.WriteLine("[DEBUG] Checking for existing ApplicationUser...");
                var existingAppUserResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Email == request.Email)
                    .Get();

                Console.WriteLine("[DEBUG] Checking for existing HiringUserProfile...");
                var existingHiringUserResponse = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.Email == request.Email)
                    .Get();

                Console.WriteLine($"[DEBUG] Existing ApplicationUser count: {existingAppUserResponse.Models.Count()}");
                Console.WriteLine($"[DEBUG] Existing HiringUserProfile count: {existingHiringUserResponse.Models.Count()}");

                if (existingAppUserResponse.Models.Any() || existingHiringUserResponse.Models.Any())
                {
                    Console.WriteLine("[DEBUG] Registration failed: User already exists");
                    return null; // User already exists
                }

                Console.WriteLine("[DEBUG] No existing user found, proceeding with registration");

                // Hash password
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
                Console.WriteLine("[DEBUG] Password hashed successfully");

                // Create HiringUserProfile
                var newProfile = new HiringUserProfile
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    Password = hashedPassword,
                    UserType = request.UserType,
                    CompanyId = request.CompanyId,
                    Bio = request.Bio ?? "",
                    LinkedinUrl = request.LinkedinUrl ?? "",
                    Location = request.Location ?? new Dictionary<string, object>(),
                    Preferences = request.Preferences ?? new Dictionary<string, object>(),
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true,
                    Roles = "HiringUser"
                };

                Console.WriteLine("[DEBUG] HiringUserProfile object created, attempting database insert...");

                var response = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Insert(newProfile);

                Console.WriteLine($"[DEBUG] Database insert response received. Models count: {response.Models?.Count() ?? 0}");

                var createdProfile = response.Models.FirstOrDefault();
                if (createdProfile == null)
                {
                    Console.WriteLine("[DEBUG] Registration failed: Database insert returned null");
                    return null; // Registration failed
                }

                Console.WriteLine($"[DEBUG] User created successfully with ID: {createdProfile.Id}");

                // Generate tokens for immediate login
                var accessToken = _jwtService.GenerateAccessToken(createdProfile);
                var refreshToken = _jwtService.GenerateRefreshToken();

                Console.WriteLine("[DEBUG] Tokens generated, updating user with refresh token...");

                // Update profile with refresh token
                createdProfile.RefreshToken = refreshToken;
                createdProfile.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

                await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.Id == createdProfile.Id)
                    .Update(createdProfile);

                Console.WriteLine("[DEBUG] Registration completed successfully");

                return new UnifiedLoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    UserId = createdProfile.Id.ToString(),
                    Email = createdProfile.Email,
                    FirstName = createdProfile.FirstName,
                    LastName = createdProfile.LastName,
                    UserCategory = "HiringUserProfile",
                    UserType = createdProfile.UserType,
                    CompanyId = createdProfile.CompanyId,
                    TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"HiringUserProfile registration error: {ex.Message}");
                Console.WriteLine($"[DEBUG] Full exception: {ex}");
                return null;
            }
        }

        public async Task<UnifiedLoginResponse?> RefreshTokenAsync(RefreshTokenRequest request)
        {
            try
            {
                // Find user by refresh token
                var userResponse = await _supabaseClient
                    .From<HiringUserProfile>()
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
                    .From<HiringUserProfile>()
                    .Where(u => u.Id == user.Id)
                    .Update(user);

                return new UnifiedLoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    UserId = user.Id.ToString(),
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    UserCategory = "HiringUserProfile",
                    UserType = user.UserType,
                    CompanyId = user.CompanyId,
                    TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"HiringUserProfile refresh token error: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> LogoutAsync(string userId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] LogoutAsync called for userId: {userId}");

                // Parse the GUID outside the Where clause to avoid Supabase expression issues
                var userIdGuid = Guid.Parse(userId);
                Console.WriteLine($"[DEBUG] Parsed GUID: {userIdGuid}");

                // Get the user first to ensure they exist
                var userResponse = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.Id == userIdGuid)
                    .Get();

                var user = userResponse.Models?.FirstOrDefault();
                if (user == null)
                {
                    Console.WriteLine("[DEBUG] User not found for logout");
                    return false;
                }

                Console.WriteLine("[DEBUG] User found, clearing refresh token...");

                // Clear the refresh token by setting to empty strings instead of null to avoid Supabase issues
                user.RefreshToken = "";
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(-1); // Set to past date instead of null

                Console.WriteLine("[DEBUG] Attempting to update user with cleared refresh token...");

                // Update the user in the database using the user's ID directly
                var updateResponse = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.Id == userIdGuid)
                    .Update(user);

                Console.WriteLine($"[DEBUG] Update completed. Response models count: {updateResponse.Models?.Count() ?? 0}");
                Console.WriteLine("[DEBUG] Refresh token cleared successfully");

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"HiringUserProfile logout error: {ex.Message}");
                Console.WriteLine($"[DEBUG] Full logout exception: {ex}");
                return false;
            }
        }
    }
}
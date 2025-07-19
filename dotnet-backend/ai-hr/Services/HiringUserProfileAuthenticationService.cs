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
                    Roles = user.Roles,
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
                // Validate HiringUserProfile specific requirements
                if (string.IsNullOrEmpty(request.UserType))
                {
                    return null; // UserType is required for HiringUserProfile
                }



                // Check if user already exists in either table
                var existingAppUserResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Email == request.Email)
                    .Get();

                var existingHiringUserResponse = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.Email == request.Email)
                    .Get();

                if (existingAppUserResponse.Models.Any() || existingHiringUserResponse.Models.Any())
                {
                    return null; // User already exists
                }

                // Hash password
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

                // Check if this user should be assigned Admin role (company creator)
                string assignedRole = "HiringUser"; // Default role

                if (request.CompanyId.HasValue)
                {
                    // Get the company to check if this user is the creator
                    var companyResponse = await _supabaseClient
                        .From<Company>()
                        .Where(c => c.Id == request.CompanyId.Value)
                        .Get();

                    var company = companyResponse.Models.FirstOrDefault();

                    if (company != null)
                    {
                        if (!string.IsNullOrEmpty(company.CreatorEmail))
                        {
                            bool emailMatch = string.Equals(company.CreatorEmail, request.Email, StringComparison.OrdinalIgnoreCase);
                            Console.WriteLine($"[DEBUG] Email match result: {emailMatch}");

                            if (emailMatch)
                            {
                                assignedRole = "Admin";
                                Console.WriteLine($"[DEBUG] User {request.Email} is the creator of company {company.Name}, assigning Admin role");
                            }
                            else
                            {
                                Console.WriteLine($"[DEBUG] User {request.Email} is not the creator of company {company.Name} (creator: {company.CreatorEmail}), assigning HiringUser role");
                            }
                        }
                        else
                        {
                            // TEMPORARY: Fallback to company email if creator_email column doesn't exist yet
                            bool emailMatch = string.Equals(company.email, request.Email, StringComparison.OrdinalIgnoreCase);

                            if (emailMatch)
                            {
                                assignedRole = "Admin";
                                Console.WriteLine($"[DEBUG] User {request.Email} matches company email, assigning Admin role (fallback)");
                            }
                            else
                            {
                                Console.WriteLine($"[DEBUG] User {request.Email} does not match company email ({company.email}), assigning HiringUser role");
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[DEBUG] Company not found for ID: {request.CompanyId}, assigning default HiringUser role");
                    }
                }
                else
                {
                    Console.WriteLine($"[DEBUG] No CompanyId provided, assigning default HiringUser role");
                }

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
                    Roles = assignedRole // Use determined role instead of hardcoded "HiringUser"
                };

                Console.WriteLine($"[DEBUG] HiringUserProfile object created with role: {assignedRole}, attempting database insert...");

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

                Console.WriteLine($"[DEBUG] User created successfully with ID: {createdProfile.Id} and role: {createdProfile.Roles}");

                // If this user is the company creator, update the company's CreatedBy field
                if (assignedRole == "Admin" && request.CompanyId.HasValue)
                {
                    try
                    {
                        Console.WriteLine($"[DEBUG] Updating company {request.CompanyId} to link creator {createdProfile.Id}");

                        var companyUpdateResponse = await _supabaseClient
                            .From<Company>()
                            .Where(c => c.Id == request.CompanyId.Value)
                            .Get();

                        var companyToUpdate = companyUpdateResponse.Models.FirstOrDefault();
                        if (companyToUpdate != null)
                        {
                            companyToUpdate.CreatedBy = createdProfile.Id;
                            companyToUpdate.UpdatedAt = DateTime.UtcNow;

                            await _supabaseClient
                                .From<Company>()
                                .Where(c => c.Id == request.CompanyId.Value)
                                .Update(companyToUpdate);

                            Console.WriteLine($"[DEBUG] Company {request.CompanyId} successfully linked to creator {createdProfile.Id}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DEBUG] Warning: Failed to update company CreatedBy field: {ex.Message}");
                        // Don't fail registration if this update fails
                    }
                }

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
                    Roles = createdProfile.Roles,
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
                    Roles = user.Roles,
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
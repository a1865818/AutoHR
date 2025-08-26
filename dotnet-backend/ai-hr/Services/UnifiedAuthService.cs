using ai_hr.Contracts;
using ai_hr.Models;

namespace ai_hr.Services
{
    public class UnifiedAuthService : IUnifiedAuthService
    {
        private readonly ISupabaseAuthService _supabaseAuthService;
        private readonly Supabase.Client _supabaseClient;
        private readonly ILogger<UnifiedAuthService> _logger;

        public UnifiedAuthService(
            ISupabaseAuthService supabaseAuthService,
            Supabase.Client supabaseClient,
            ILogger<UnifiedAuthService> logger)
        {
            _supabaseAuthService = supabaseAuthService ?? throw new ArgumentNullException(nameof(supabaseAuthService));
            _supabaseClient = supabaseClient ?? throw new ArgumentNullException(nameof(supabaseClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            try
            {
                _logger.LogInformation("Unified login attempt for email: {Email}", request.Email);

                // Authenticate with Supabase (works for both user types)
                var supabaseSignInRequest = new SupabaseSignInRequest
                {
                    Email = request.Email,
                    Password = request.Password
                };

                var supabaseResult = await _supabaseAuthService.SignInAsync(supabaseSignInRequest);
                if (supabaseResult == null)
                {
                    _logger.LogWarning("Supabase authentication failed for email: {Email}", request.Email);
                    return null;
                }

                // User type is determined by Supabase metadata + local profile
                var userType = supabaseResult.UserType;
                _logger.LogInformation("User {Email} authenticated as {UserType}", request.Email, userType);

                // Get local user data based on type
                if (userType == "ApplicationUser")
                {
                    var appUserResponse = await _supabaseClient.From<ApplicationUser>()
                        .Where(u => u.SupabaseAuthId == supabaseResult.UserId)
                        .Get();

                    var appUser = appUserResponse.Models.FirstOrDefault();
                    if (appUser == null)
                    {
                        _logger.LogError("ApplicationUser not found in local database for Supabase ID: {UserId}", supabaseResult.UserId);
                        return null;
                    }

                    return new LoginResponse
                    {
                        AccessToken = supabaseResult.AccessToken,
                        RefreshToken = supabaseResult.RefreshToken,
                        UserId = appUser.Id,
                        Email = supabaseResult.Email,
                        FirstName = supabaseResult.FirstName,
                        LastName = supabaseResult.LastName,
                        TokenExpiresAt = supabaseResult.ExpiresAt,
                        IsSupabaseAuth = true,
                        UserType = "ApplicationUser"
                    };
                }
                else if (userType == "HiringUser")
                {
                    var hiringUserResponse = await _supabaseClient.From<HiringUserProfile>()
                        .Where(u => u.SupabaseAuthId == supabaseResult.UserId)
                        .Get();

                    var hiringUser = hiringUserResponse.Models.FirstOrDefault();
                    if (hiringUser == null)
                    {
                        _logger.LogError("HiringUser not found in local database for Supabase ID: {UserId}", supabaseResult.UserId);
                        return null;
                    }

                    return new LoginResponse
                    {
                        AccessToken = supabaseResult.AccessToken,
                        RefreshToken = supabaseResult.RefreshToken,
                        UserId = hiringUser.Id.ToString(),
                        Email = supabaseResult.Email,
                        FirstName = supabaseResult.FirstName,
                        LastName = supabaseResult.LastName,
                        TokenExpiresAt = supabaseResult.ExpiresAt,
                        IsSupabaseAuth = true,
                        UserType = "HiringUser",
                        CompanyId = hiringUser.CompanyId
                    };
                }

                _logger.LogError("Unknown user type: {UserType}", userType);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during unified login for email: {Email}", request.Email);
                return null;
            }
        }

        public async Task<LoginResponse?> RegisterAsync(RegisterRequest request)
        {
            try
            {
                _logger.LogInformation("Unified registration for ApplicationUser: {Email}", request.Email);

                var supabaseSignUpRequest = new SupabaseSignUpRequest
                {
                    Email = request.Email,
                    Password = request.Password,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    UserType = "ApplicationUser"
                };

                var supabaseResult = await _supabaseAuthService.SignUpAsync(supabaseSignUpRequest);
                if (supabaseResult == null)
                {
                    _logger.LogError("Supabase registration failed for email: {Email}", request.Email);
                    return null;
                }

                // Get the local user that was created
                var userResponse = await _supabaseClient.From<ApplicationUser>()
                    .Where(u => u.SupabaseAuthId == supabaseResult.UserId)
                    .Get();

                var user = userResponse.Models.FirstOrDefault();

                return new LoginResponse
                {
                    AccessToken = supabaseResult.AccessToken,
                    RefreshToken = supabaseResult.RefreshToken,
                    UserId = user?.Id.ToString() ?? supabaseResult.UserId,
                    Email = supabaseResult.Email,
                    FirstName = supabaseResult.FirstName,
                    LastName = supabaseResult.LastName,
                    TokenExpiresAt = supabaseResult.ExpiresAt,
                    IsSupabaseAuth = true,
                    UserType = "ApplicationUser"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during unified registration for email: {Email}", request.Email);
                return null;
            }
        }

        public async Task<LoginResponse?> RegisterHiringUserAsync(RegisterHiringUserRequest request)
        {
            try
            {
                _logger.LogInformation("Unified registration for HiringUser: {Email}", request.Email);

                var supabaseSignUpRequest = new SupabaseSignUpRequest
                {
                    Email = request.Email,
                    Password = request.Password,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    UserType = "HiringUser",
                    CompanyId = request.CompanyId
                };

                var supabaseResult = await _supabaseAuthService.SignUpAsync(supabaseSignUpRequest);
                if (supabaseResult == null)
                {
                    _logger.LogError("Supabase hiring user registration failed for email: {Email}", request.Email);
                    return null;
                }

                // Get the local user that was created
                var userResponse = await _supabaseClient.From<HiringUserProfile>()
                    .Where(u => u.SupabaseAuthId == supabaseResult.UserId)
                    .Get();

                var user = userResponse.Models.FirstOrDefault();

                return new LoginResponse
                {
                    AccessToken = supabaseResult.AccessToken,
                    RefreshToken = supabaseResult.RefreshToken,
                    UserId = user?.Id.ToString() ?? supabaseResult.UserId,
                    Email = supabaseResult.Email,
                    FirstName = supabaseResult.FirstName,
                    LastName = supabaseResult.LastName,
                    TokenExpiresAt = supabaseResult.ExpiresAt,
                    IsSupabaseAuth = true,
                    UserType = "HiringUser",
                    CompanyId = request.CompanyId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during unified hiring user registration for email: {Email}", request.Email);
                return null;
            }
        }

        public async Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request)
        {
            try
            {
                _logger.LogInformation("Refreshing Supabase Auth token");

                var session = await _supabaseAuthService.RefreshSessionAsync();
                if (session == null)
                {
                    _logger.LogWarning("Supabase session refresh failed");
                    return null;
                }

                // Get user info from current session
                var currentUser = await _supabaseAuthService.GetCurrentUserAsync();
                if (currentUser == null)
                {
                    _logger.LogError("Cannot get current user after token refresh");
                    return null;
                }

                // Get user type from metadata
                var userType = currentUser.UserMetadata?["user_type"]?.ToString() ?? "ApplicationUser";
                
                if (userType == "ApplicationUser")
                {
                    var userResponse = await _supabaseClient.From<ApplicationUser>()
                        .Where(u => u.SupabaseAuthId == currentUser.Id)
                        .Get();

                    var user = userResponse.Models.FirstOrDefault();
                    if (user != null)
                    {
                        return new LoginResponse
                        {
                            AccessToken = session.AccessToken ?? string.Empty,
                            RefreshToken = session.RefreshToken ?? string.Empty,
                            UserId = user.Id.ToString(),
                            Email = user.Email,
                            FirstName = user.FirstName,
                            LastName = user.LastName,
                            TokenExpiresAt = session.ExpiresAt(),
                            IsSupabaseAuth = true,
                            UserType = "ApplicationUser"
                        };
                    }
                }
                else if (userType == "HiringUser")
                {
                    var userResponse = await _supabaseClient.From<HiringUserProfile>()
                        .Where(u => u.SupabaseAuthId == currentUser.Id)
                        .Get();

                    var user = userResponse.Models.FirstOrDefault();
                    if (user != null)
                    {
                        return new LoginResponse
                        {
                            AccessToken = session.AccessToken ?? string.Empty,
                            RefreshToken = session.RefreshToken ?? string.Empty,
                            UserId = user.Id.ToString(),
                            Email = user.Email,
                            FirstName = user.FirstName,
                            LastName = user.LastName,
                            TokenExpiresAt = session.ExpiresAt(),
                            IsSupabaseAuth = true,
                            UserType = "HiringUser",
                            CompanyId = user.CompanyId
                        };
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during unified token refresh");
                return null;
            }
        }

        public async Task<bool> LogoutAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Unified logout for user: {UserId}", userId);
                return await _supabaseAuthService.SignOutAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during unified logout for user: {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> ForgotPasswordAsync(string email)
        {
            try
            {
                _logger.LogInformation("Unified forgot password for email: {Email}", email);
                return await _supabaseAuthService.SendPasswordResetAsync(email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during unified forgot password for email: {Email}", email);
                return false;
            }
        }

        public async Task<dynamic?> GetCurrentUserAsync(string supabaseUserId)
        {
            try
            {
                // Try to get ApplicationUser first
                var appUserResponse = await _supabaseClient.From<ApplicationUser>()
                    .Where(u => u.SupabaseAuthId == supabaseUserId && u.IsActive == true)
                    .Get();

                var appUser = appUserResponse.Models.FirstOrDefault();
                if (appUser != null)
                {
                    return new
                    {
                        Id = appUser.Id,
                        SupabaseAuthId = appUser.SupabaseAuthId,
                        Email = appUser.Email,
                        FirstName = appUser.FirstName,
                        LastName = appUser.LastName,
                        Roles = appUser.Roles,
                        IsActive = appUser.IsActive,
                        CreatedAt = appUser.CreatedAt,
                        UserCategory = "ApplicationUser",
                        Education = appUser.Education,
                        Experiences = appUser.Experiences,
                        SocialLink = appUser.SocialLink,
                        PhoneNumber = appUser.PhoneNumber,
                        Location = appUser.Location,
                        ResumeList = appUser.ResumeList,
                        SavedJobs = appUser.SavedJobs
                    };
                }

                // Try to get HiringUserProfile
                var hiringUserResponse = await _supabaseClient.From<HiringUserProfile>()
                    .Where(u => u.SupabaseAuthId == supabaseUserId && u.IsActive == true)
                    .Get();

                var hiringUser = hiringUserResponse.Models.FirstOrDefault();
                if (hiringUser != null)
                {
                    return new
                    {
                        Id = hiringUser.Id,
                        SupabaseAuthId = hiringUser.SupabaseAuthId,
                        Email = hiringUser.Email,
                        FirstName = hiringUser.FirstName,
                        LastName = hiringUser.LastName,
                        UserType = hiringUser.UserType,
                        CompanyId = hiringUser.CompanyId,
                        Roles = hiringUser.Roles,
                        IsActive = hiringUser.IsActive,
                        CreatedAt = hiringUser.CreatedAt,
                        UserCategory = "HiringUser",
                        Bio = hiringUser.Bio,
                        LinkedinUrl = hiringUser.LinkedinUrl,
                        Location = hiringUser.Location,
                        Preferences = hiringUser.Preferences
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user for Supabase ID: {UserId}", supabaseUserId);
                return null;
            }
        }
    }
}
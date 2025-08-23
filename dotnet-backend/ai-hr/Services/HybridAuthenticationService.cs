using ai_hr.Contracts;
using ai_hr.Models;
using Microsoft.Extensions.Options;

namespace ai_hr.Services
{
    public interface IHybridAuthenticationService
    {
        Task<LoginResponse?> LoginAsync(LoginRequest request);
        Task<LoginResponse?> RegisterAsync(RegisterRequest request);
        Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request);
        Task<bool> LogoutAsync(string userId);
        Task<bool> IsSupabaseUserAsync(string userId);
    }

    public class HybridAuthenticationService : IHybridAuthenticationService
    {
        private readonly IAuthenticationService _legacyAuthService;
        private readonly ISupabaseAuthService _supabaseAuthService;
        private readonly Supabase.Client _supabaseClient;
        private readonly ILogger<HybridAuthenticationService> _logger;

        public HybridAuthenticationService(
            IAuthenticationService legacyAuthService,
            ISupabaseAuthService supabaseAuthService,
            Supabase.Client supabaseClient,
            ILogger<HybridAuthenticationService> logger)
        {
            _legacyAuthService = legacyAuthService ?? throw new ArgumentNullException(nameof(legacyAuthService));
            _supabaseAuthService = supabaseAuthService ?? throw new ArgumentNullException(nameof(supabaseAuthService));
            _supabaseClient = supabaseClient ?? throw new ArgumentNullException(nameof(supabaseClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            try
            {
                _logger.LogInformation("Hybrid login attempt for email: {Email}", request.Email);

                // First, check if user has been migrated to Supabase Auth
                var userResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Email == request.Email && u.IsActive == true)
                    .Get();

                var user = userResponse.Models.FirstOrDefault();
                
                if (user != null && !string.IsNullOrEmpty(user.SupabaseAuthId))
                {
                    _logger.LogInformation("User {Email} is migrated to Supabase Auth, using Supabase authentication", request.Email);
                    
                    // User is migrated - use Supabase Auth
                    var supabaseSignInRequest = new SupabaseSignInRequest
                    {
                        Email = request.Email,
                        Password = request.Password
                    };

                    var supabaseResult = await _supabaseAuthService.SignInAsync(supabaseSignInRequest);
                    if (supabaseResult != null)
                    {
                        return new LoginResponse
                        {
                            AccessToken = supabaseResult.AccessToken,
                            RefreshToken = supabaseResult.RefreshToken,
                            UserId = user.Id, // Use local user ID for compatibility
                            Email = supabaseResult.Email,
                            FirstName = supabaseResult.FirstName,
                            LastName = supabaseResult.LastName,
                            TokenExpiresAt = supabaseResult.ExpiresAt,
                            IsSupabaseAuth = true
                        };
                    }
                    
                    _logger.LogWarning("Supabase authentication failed for migrated user: {Email}", request.Email);
                    return null;
                }
                else
                {
                    _logger.LogInformation("User {Email} not migrated, using legacy authentication", request.Email);
                    
                    // User not migrated - use legacy authentication
                    var legacyResult = await _legacyAuthService.LoginAsync(request);
                    if (legacyResult != null)
                    {
                        legacyResult.IsSupabaseAuth = false;
                    }
                    return legacyResult;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during hybrid login for email: {Email}", request.Email);
                return null;
            }
        }

        public async Task<LoginResponse?> RegisterAsync(RegisterRequest request)
        {
            try
            {
                _logger.LogInformation("Hybrid registration for email: {Email}", request.Email);

                // For new registrations, always use Supabase Auth
                var supabaseSignUpRequest = new SupabaseSignUpRequest
                {
                    Email = request.Email,
                    Password = request.Password,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    UserType = "ApplicationUser"
                };

                var supabaseResult = await _supabaseAuthService.SignUpAsync(supabaseSignUpRequest);
                if (supabaseResult != null)
                {
                    // Get the local user that was created
                    var userResponse = await _supabaseClient
                        .From<ApplicationUser>()
                        .Where(u => u.SupabaseAuthId == supabaseResult.UserId)
                        .Get();

                    var user = userResponse.Models.FirstOrDefault();
                    
                    return new LoginResponse
                    {
                        AccessToken = supabaseResult.AccessToken,
                        RefreshToken = supabaseResult.RefreshToken,
                        UserId = user?.Id ?? supabaseResult.UserId,
                        Email = supabaseResult.Email,
                        FirstName = supabaseResult.FirstName,
                        LastName = supabaseResult.LastName,
                        TokenExpiresAt = supabaseResult.ExpiresAt,
                        IsSupabaseAuth = true
                    };
                }

                _logger.LogWarning("Supabase registration failed for email: {Email}, falling back to legacy", request.Email);
                
                // Fallback to legacy registration if Supabase fails
                var legacyResult = await _legacyAuthService.RegisterAsync(request);
                if (legacyResult != null)
                {
                    legacyResult.IsSupabaseAuth = false;
                }
                return legacyResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during hybrid registration for email: {Email}", request.Email);
                return null;
            }
        }

        public async Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request)
        {
            try
            {
                // Try to determine if this is a Supabase token or legacy token
                // Supabase refresh tokens are typically longer and base64-encoded differently
                if (IsSupabaseRefreshToken(request.RefreshToken))
                {
                    _logger.LogInformation("Refreshing Supabase Auth token");
                    
                    // For Supabase, we need to use the session refresh mechanism
                    var session = await _supabaseAuthService.RefreshSessionAsync();
                    if (session != null)
                    {
                        // Get user info from local database using Supabase ID
                        var userId = _supabaseClient.Auth.CurrentUser?.Id;
                        if (!string.IsNullOrEmpty(userId))
                        {
                            var userResponse = await _supabaseClient
                                .From<ApplicationUser>()
                                .Where(u => u.SupabaseAuthId == userId)
                                .Get();

                            var user = userResponse.Models.FirstOrDefault();
                            if (user != null)
                            {
                                return new LoginResponse
                                {
                                    AccessToken = session.AccessToken ?? string.Empty,
                                    RefreshToken = session.RefreshToken ?? string.Empty,
                                    UserId = user.Id,
                                    Email = user.Email,
                                    FirstName = user.FirstName,
                                    LastName = user.LastName,
                                    TokenExpiresAt = session.ExpiresAt(),
                                    IsSupabaseAuth = true
                                };
                            }
                        }
                    }
                }
                else
                {
                    _logger.LogInformation("Refreshing legacy token");
                    
                    // Use legacy token refresh
                    var legacyResult = await _legacyAuthService.RefreshTokenAsync(request);
                    if (legacyResult != null)
                    {
                        legacyResult.IsSupabaseAuth = false;
                    }
                    return legacyResult;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during hybrid token refresh");
                return null;
            }
        }

        public async Task<bool> LogoutAsync(string userId)
        {
            try
            {
                if (await IsSupabaseUserAsync(userId))
                {
                    _logger.LogInformation("Logging out Supabase user: {UserId}", userId);
                    return await _supabaseAuthService.SignOutAsync();
                }
                else
                {
                    _logger.LogInformation("Logging out legacy user: {UserId}", userId);
                    return await _legacyAuthService.LogoutAsync(userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during hybrid logout for user: {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> IsSupabaseUserAsync(string userId)
        {
            try
            {
                var userResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.Id == userId)
                    .Get();

                var user = userResponse.Models.FirstOrDefault();
                return user != null && !string.IsNullOrEmpty(user.SupabaseAuthId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user is Supabase user: {UserId}", userId);
                return false;
            }
        }

        private static bool IsSupabaseRefreshToken(string refreshToken)
        {
            // Supabase refresh tokens are typically JWT tokens or have specific characteristics
            // For now, we'll use a simple heuristic - Supabase tokens are usually longer than 100 characters
            // and contain dots (JWT format) or are base64 encoded with specific patterns
            return refreshToken.Length > 100 && (refreshToken.Contains('.') || refreshToken.Contains('_'));
        }
    }
}
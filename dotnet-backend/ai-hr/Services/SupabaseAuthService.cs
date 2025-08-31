using Supabase.Gotrue;
using Supabase.Gotrue.Exceptions;
using ai_hr.Contracts;
using ai_hr.Models;
using System.Security.Claims;
using Supabase;

namespace ai_hr.Services
{
    public class SupabaseAuthService : ISupabaseAuthService
    {
        private readonly Supabase.Client _supabaseClient;
        private readonly ILogger<SupabaseAuthService> _logger;

        public SupabaseAuthService(
            Supabase.Client supabaseClient, 
            ILogger<SupabaseAuthService> logger)
        {
            _supabaseClient = supabaseClient ?? throw new ArgumentNullException(nameof(supabaseClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<SupabaseAuthResponse?> SignUpAsync(SupabaseSignUpRequest request)
        {
            try
            {
                _logger.LogInformation("Attempting to sign up user with email: {Email}", request.Email);

                // Create user metadata for additional fields
                var userMetadata = new Dictionary<string, object>
                {
                    { "first_name", request.FirstName },
                    { "last_name", request.LastName },
                    { "user_type", request.UserType ?? "ApplicationUser" }
                };

                if (request.CompanyId.HasValue)
                {
                    userMetadata.Add("company_id", request.CompanyId.Value.ToString());
                }

                var options = new SignUpOptions
                {
                    Data = userMetadata
                };

                var session = await _supabaseClient.Auth.SignUp(request.Email, request.Password, options);

                if (session?.User == null)
                {
                    _logger.LogError("SignUp failed: No user returned from Supabase");
                    return null;
                }

                _logger.LogInformation("User signed up successfully with ID: {UserId}", session.User.Id);

                // Create local user profile after successful Supabase signup
                await CreateLocalUserProfile(session.User, request);

                return new SupabaseAuthResponse
                {
                    AccessToken = session.AccessToken ?? string.Empty,
                    RefreshToken = session.RefreshToken ?? string.Empty,
                    ExpiresAt = session.ExpiresAt(),
                    UserId = session.User.Id,
                    Email = session.User.Email ?? request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    UserType = request.UserType ?? "ApplicationUser",
                    CompanyId = request.CompanyId,
                    EmailConfirmed = session.User.EmailConfirmedAt.HasValue
                };
            }
            catch (GotrueException ex)
            {
                _logger.LogError(ex, "Supabase auth error during signup for email: {Email}", request.Email);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during signup for email: {Email}", request.Email);
                return null;
            }
        }

        public async Task<SupabaseAuthResponse?> SignInAsync(SupabaseSignInRequest request)
        {
            try
            {
                _logger.LogInformation("Attempting to sign in user with email: {Email}", request.Email);

                var session = await _supabaseClient.Auth.SignIn(request.Email, request.Password);

                if (session?.User == null)
                {
                    _logger.LogError("SignIn failed: No user returned from Supabase");
                    return null;
                }

                _logger.LogInformation("User signed in successfully with ID: {UserId}", session.User.Id);

                // Get local user profile data
                var userProfile = await GetLocalUserProfile(session.User.Id);

                return new SupabaseAuthResponse
                {
                    AccessToken = session.AccessToken ?? string.Empty,
                    RefreshToken = session.RefreshToken ?? string.Empty,
                    ExpiresAt = session.ExpiresAt(),
                    UserId = session.User.Id,
                    Email = session.User.Email ?? request.Email,
                    FirstName = userProfile?.FirstName ?? session.User.UserMetadata?["first_name"]?.ToString() ?? string.Empty,
                    LastName = userProfile?.LastName ?? session.User.UserMetadata?["last_name"]?.ToString() ?? string.Empty,
                    UserType = userProfile?.UserType ?? session.User.UserMetadata?["user_type"]?.ToString() ?? "ApplicationUser",
                    CompanyId = userProfile?.CompanyId,
                    EmailConfirmed = session.User.EmailConfirmedAt.HasValue
                };
            }
            catch (GotrueException ex)
            {
                _logger.LogError(ex, "Supabase auth error during signin for email: {Email}", request.Email);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during signin for email: {Email}", request.Email);
                return null;
            }
        }

        public async Task<bool> SignOutAsync()
        {
            try
            {
                await _supabaseClient.Auth.SignOut();
                _logger.LogInformation("User signed out successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during signout");
                return false;
            }
        }

        public async Task<bool> SendPasswordResetAsync(string email)
        {
            try
            {
                await _supabaseClient.Auth.ResetPasswordForEmail(email);
                _logger.LogInformation("Password reset email sent to: {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending password reset email to: {Email}", email);
                return false;
            }
        }

        public async Task<bool> VerifyEmailAsync(string token)
        {
            try
            {
                // Email verification is handled by Supabase automatically
                // This method could be used for custom verification flows
                _logger.LogInformation("Email verification requested for token");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during email verification");
                return false;
            }
        }

        public async Task<User?> GetCurrentUserAsync()
        {
            try
            {
                return _supabaseClient.Auth.CurrentUser;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                return null;
            }
        }

        public async Task<User?> GetUserByIdAsync(string userId)
        {
            try
            {
                // Note: This requires service key permissions
                var adminClient = _supabaseClient.Auth;
                return await Task.FromResult(_supabaseClient.Auth.CurrentUser?.Id == userId ? _supabaseClient.Auth.CurrentUser : null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by ID: {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> UpdateUserEmailAsync(string newEmail)
        {
            try
            {
                var attributes = new UserAttributes { Email = newEmail };
                var user = await _supabaseClient.Auth.Update(attributes);
                _logger.LogInformation("User email updated to: {Email}", newEmail);
                return user != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user email to: {Email}", newEmail);
                return false;
            }
        }

        public async Task<bool> UpdateUserPasswordAsync(string newPassword)
        {
            try
            {
                var attributes = new UserAttributes { Password = newPassword };
                var user = await _supabaseClient.Auth.Update(attributes);
                _logger.LogInformation("User password updated successfully");
                return user != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user password");
                return false;
            }
        }

        public async Task<Session?> RefreshSessionAsync()
        {
            try
            {
                var session = await _supabaseClient.Auth.RefreshSession();
                _logger.LogInformation("Session refreshed successfully");
                return session;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing session");
                return null;
            }
        }

        public async Task<User?> ValidateTokenAsync(string accessToken)
        {
            try
            {
                var user = await _supabaseClient.Auth.GetUser(accessToken);
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating token");
                return null;
            }
        }

        public async Task<User?> CreateUserAsync(string email, string password, string firstName, string lastName)
        {
            try
            {
                var userMetadata = new Dictionary<string, object>
                {
                    { "first_name", firstName },
                    { "last_name", lastName }
                };

                var options = new SignUpOptions
                {
                    Data = userMetadata
                };

                var session = await _supabaseClient.Auth.SignUp(email, password, options);
                _logger.LogInformation("User created programmatically with ID: {UserId}", session?.User?.Id);
                return session?.User;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user programmatically for email: {Email}", email);
                return null;
            }
        }

        public async Task<Session?> GetSessionFromTokenAsync(string accessToken)
        {
            try
            {
                var user = await ValidateTokenAsync(accessToken);
                if (user != null)
                {
                    return _supabaseClient.Auth.CurrentSession;
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting session from token");
                return null;
            }
        }

        private async Task CreateLocalUserProfile(User supabaseUser, SupabaseSignUpRequest request)
        {
            try
            {
                if (request.UserType == "HiringUser")
                {
                    var hiringUser = new HiringUserProfile
                    {
                        SupabaseAuthId = supabaseUser.Id,
                        Email = supabaseUser.Email ?? request.Email,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        CompanyId = request.CompanyId,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true,
                        Roles = "HiringManager",
                        UserType = "HiringManager"
                    };

                    var insertedUserResponse = await _supabaseClient.From<HiringUserProfile>().Insert(hiringUser);
                    var insertedUser = insertedUserResponse.Models.FirstOrDefault();

                    if (insertedUser != null)
                    {
                        // Update Supabase user metadata with the database ID
                        await UpdateUserMetadataWithDatabaseId(supabaseUser.Id, insertedUser.Id.ToString(), request.CompanyId?.ToString());
                    }
                }
                else
                {
                    var appUser = new ApplicationUser
                    {
                        SupabaseAuthId = supabaseUser.Id,
                        Email = supabaseUser.Email ?? request.Email,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true,
                        Roles = "User",
                        Education = new List<Dictionary<string, object>>(),
                        Experiences = new List<Dictionary<string, object>>(),
                        SocialLink = new Dictionary<string, object>(),
                        Location = new Dictionary<string, object>(),
                        ResumeList = new List<Dictionary<string, object>>()
                    };

                    var insertedAppUserResponse = await _supabaseClient.From<ApplicationUser>().Insert(appUser);
                    var insertedAppUser = insertedAppUserResponse.Models.FirstOrDefault();

                    if (insertedAppUser != null)
                    {
                        // Update Supabase user metadata with the database ID
                        await UpdateUserMetadataWithDatabaseId(supabaseUser.Id, insertedAppUser.Id.ToString(), null);
                    }
                }

                _logger.LogInformation("Local user profile created for Supabase user: {UserId}", supabaseUser.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating local user profile for Supabase user: {UserId}", supabaseUser.Id);
            }
        }

        private async Task<dynamic?> GetLocalUserProfile(string supabaseUserId)
        {
            try
            {
                // Try to get HiringUserProfile first
                var hiringUserResponse = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.SupabaseAuthId == supabaseUserId)
                    .Get();

                var hiringUser = hiringUserResponse.Models.FirstOrDefault();
                if (hiringUser != null)
                {
                    return new
                    {
                        FirstName = hiringUser.FirstName,
                        LastName = hiringUser.LastName,
                        UserType = "HiringUser",
                        CompanyId = hiringUser.CompanyId
                    };
                }

                // Try to get ApplicationUser
                var appUserResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.SupabaseAuthId == supabaseUserId)
                    .Get();

                var appUser = appUserResponse.Models.FirstOrDefault();
                if (appUser != null)
                {
                    return new
                    {
                        FirstName = appUser.FirstName,
                        LastName = appUser.LastName,
                        UserType = "ApplicationUser",
                        CompanyId = (Guid?)null
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting local user profile for Supabase user: {UserId}", supabaseUserId);
                return null;
            }
        }

        private async Task UpdateUserMetadataWithDatabaseId(string supabaseUserId, string databaseId, string? companyId)
        {
            try
            {
                _logger.LogInformation("Updating user metadata with database ID for Supabase user: {SupabaseUserId}, DatabaseId: {DatabaseId}", 
                    supabaseUserId, databaseId);

                // Add a small delay to ensure user is fully provisioned
                await Task.Delay(500);

                // First get the current user to preserve existing metadata
                var currentUser = _supabaseClient.Auth.CurrentUser;
                var existingMetadata = currentUser?.UserMetadata ?? new Dictionary<string, object>();

                _logger.LogInformation("Current user metadata before update: {Metadata}", 
                    string.Join(", ", existingMetadata.Select(kv => $"{kv.Key}: {kv.Value}")));

                // Create updated metadata by preserving existing fields and adding new ones
                var updatedMetadata = new Dictionary<string, object>(existingMetadata)
                {
                    ["database_user_id"] = databaseId
                };

                if (!string.IsNullOrEmpty(companyId))
                {
                    updatedMetadata["company_id"] = companyId;
                }

                _logger.LogInformation("Metadata to be sent to AdminClient: {Metadata}", 
                    string.Join(", ", updatedMetadata.Select(kv => $"{kv.Key}: {kv.Value}")));

                // Use AdminClient with correct URL configuration
                var options = new ClientOptions
                {
                    Url = $"{Environment.GetEnvironmentVariable("SUPABASE_URL")}/auth/v1",
                    Headers = new Dictionary<string, string>
                    {
                        { "apikey", Environment.GetEnvironmentVariable("SUPABASE_SERVICE_KEY")! }
                    }
                };

                var adminClient = new AdminClient(
                    serviceKey: Environment.GetEnvironmentVariable("SUPABASE_SERVICE_KEY")!,
                    options: options
                );


                var adminUserAttributes = new AdminUserAttributes
                {
                    UserMetadata = updatedMetadata
                };

                // Capture the response to validate success
                var updatedUser = await adminClient.UpdateUserById(supabaseUserId, adminUserAttributes);

                if (updatedUser != null)
                {
                    _logger.LogInformation("AdminClient returned updated user: {UserId}, Metadata: {Metadata}", 
                        updatedUser.Id, 
                        string.Join(", ", (updatedUser.UserMetadata ?? new Dictionary<string, object>()).Select(kv => $"{kv.Key}: {kv.Value}")));

                    // Verify the metadata was actually updated
                    if (updatedUser.UserMetadata?.ContainsKey("database_user_id") == true)
                    {
                        _logger.LogInformation("Successfully verified database_user_id in updated user metadata: {DatabaseUserId}", 
                            updatedUser.UserMetadata["database_user_id"]);
                    }
                    else
                    {
                        _logger.LogWarning("database_user_id not found in updated user metadata - update may have failed");
                    }
                }
                else
                {
                    _logger.LogError("AdminClient.UpdateUserById returned null - update failed");
                }

                _logger.LogInformation("Metadata update operation completed for Supabase user: {SupabaseUserId}", supabaseUserId);
            }
            catch (GotrueException gotrueEx)
            {
                _logger.LogError(gotrueEx, "Gotrue-specific error updating user metadata for Supabase user: {SupabaseUserId}. Status: {Status}, Message: {ErrorMessage}", 
                    supabaseUserId, gotrueEx.StatusCode, gotrueEx.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating user metadata for Supabase user: {SupabaseUserId}. Type: {ExceptionType}, Message: {ErrorMessage}", 
                    supabaseUserId, ex.GetType().Name, ex.Message);
                
                // Log inner exception details if available
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner exception: {InnerExceptionType}: {InnerMessage}", 
                        ex.InnerException.GetType().Name, ex.InnerException.Message);
                }
            }
        }
    }
}
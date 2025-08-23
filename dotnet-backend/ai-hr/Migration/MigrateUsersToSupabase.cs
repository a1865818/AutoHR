using DotNetEnv;
using Supabase.Gotrue;
using ai_hr.Models;
using System.Security.Cryptography;
using Supabase;

namespace ai_hr.Migration
{
    public class UserMigrationService
    {
        private readonly Supabase.Client _supabaseClient;
        private readonly ILogger<UserMigrationService> _logger;
        private readonly string _serviceRoleKey;

        public UserMigrationService(Supabase.Client supabaseClient, ILogger<UserMigrationService> logger)
        {
            _supabaseClient = supabaseClient ?? throw new ArgumentNullException(nameof(supabaseClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_KEY") ?? throw new InvalidOperationException("SUPABASE_SERVICE_KEY not configured");
        }

        /// <summary>
        /// Migrate all existing ApplicationUsers to Supabase Auth
        /// </summary>
        public async Task<MigrationResult> MigrateApplicationUsersAsync()
        {
            var result = new MigrationResult();
            
            try
            {
                _logger.LogInformation("Starting ApplicationUser migration to Supabase Auth");

                // Get all active ApplicationUsers
                var usersResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.IsActive == true)
                    .Get();

                var users = usersResponse.Models;
                result.TotalUsers = users.Count;

                _logger.LogInformation("Found {UserCount} ApplicationUsers to migrate", users.Count);

                foreach (var user in users)
                {
                    try
                    {
                        // Skip if already migrated
                        if (!string.IsNullOrEmpty(user.SupabaseAuthId))
                        {
                            _logger.LogInformation("User {Email} already migrated, skipping", user.Email);
                            result.SkippedUsers++;
                            continue;
                        }

                        // Generate temporary password for migration
                        var tempPassword = GenerateTemporaryPassword();

                        // Create user metadata
                        var userMetadata = new Dictionary<string, object>
                        {
                            { "first_name", user.FirstName },
                            { "last_name", user.LastName },
                            { "user_type", "ApplicationUser" },
                            { "migrated_user_id", user.Id },
                            { "migration_date", DateTime.UtcNow.ToString("O") }
                        };

                        var signUpOptions = new SignUpOptions
                        {
                            Data = userMetadata
                        };

                        // Create user in Supabase Auth using service key
                        var adminClient = new Supabase.Client(
                            Environment.GetEnvironmentVariable("SUPABASE_URL")!,
                            _serviceRoleKey,
                            new SupabaseOptions
                            {
                                AutoConnectRealtime = false,
                                AutoRefreshToken = false
                            }
                        );

                        // Use admin client to create user
                        var session = await adminClient.Auth.SignUp(user.Email, tempPassword, signUpOptions);

                        if (session?.User != null)
                        {
                            // Update local user record with Supabase Auth ID
                            user.SupabaseAuthId = session.User.Id;
                            
                            await _supabaseClient
                                .From<ApplicationUser>()
                                .Where(u => u.Id == user.Id)
                                .Update(user);

                            result.MigratedUsers++;
                            result.TemporaryPasswords.Add(user.Email, tempPassword);

                            _logger.LogInformation("Successfully migrated ApplicationUser {Email} with ID {SupabaseId}", 
                                user.Email, session.User.Id);
                        }
                        else
                        {
                            result.FailedUsers++;
                            result.FailedMigrations.Add(user.Email, "Failed to create user in Supabase Auth");
                            _logger.LogError("Failed to migrate ApplicationUser {Email}: No user returned from Supabase", user.Email);
                        }

                        // Add delay to avoid rate limiting
                        await Task.Delay(100);
                    }
                    catch (Exception ex)
                    {
                        result.FailedUsers++;
                        result.FailedMigrations.Add(user.Email, ex.Message);
                        _logger.LogError(ex, "Error migrating ApplicationUser {Email}", user.Email);
                    }
                }

                result.Success = result.FailedUsers == 0;
                _logger.LogInformation("ApplicationUser migration completed. Success: {Success}, Migrated: {Migrated}, Failed: {Failed}, Skipped: {Skipped}", 
                    result.Success, result.MigratedUsers, result.FailedUsers, result.SkippedUsers);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical error during ApplicationUser migration");
                result.Success = false;
                return result;
            }
        }

        /// <summary>
        /// Migrate all existing HiringUserProfiles to Supabase Auth
        /// </summary>
        public async Task<MigrationResult> MigrateHiringUsersAsync()
        {
            var result = new MigrationResult();
            
            try
            {
                _logger.LogInformation("Starting HiringUserProfile migration to Supabase Auth");

                // Get all active HiringUserProfiles
                var usersResponse = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.IsActive == true)
                    .Get();

                var users = usersResponse.Models;
                result.TotalUsers = users.Count;

                _logger.LogInformation("Found {UserCount} HiringUserProfiles to migrate", users.Count);

                foreach (var user in users)
                {
                    try
                    {
                        // Skip if already migrated
                        if (!string.IsNullOrEmpty(user.SupabaseAuthId))
                        {
                            _logger.LogInformation("Hiring user {Email} already migrated, skipping", user.Email);
                            result.SkippedUsers++;
                            continue;
                        }

                        // Generate temporary password for migration
                        var tempPassword = GenerateTemporaryPassword();

                        // Create user metadata
                        var userMetadata = new Dictionary<string, object>
                        {
                            { "first_name", user.FirstName },
                            { "last_name", user.LastName },
                            { "user_type", "HiringUser" },
                            { "company_id", user.CompanyId?.ToString() ?? "" },
                            { "migrated_user_id", user.Id.ToString() },
                            { "migration_date", DateTime.UtcNow.ToString("O") }
                        };

                        var signUpOptions = new SignUpOptions
                        {
                            Data = userMetadata
                        };

                        // Create user in Supabase Auth using service key
                        var adminClient = new Supabase.Client(
                            Environment.GetEnvironmentVariable("SUPABASE_URL")!,
                            _serviceRoleKey,
                            new SupabaseOptions
                            {
                                AutoConnectRealtime = false,
                                AutoRefreshToken = false
                            }
                        );

                        // Use admin client to create user
                        var session = await adminClient.Auth.SignUp(user.Email, tempPassword, signUpOptions);

                        if (session?.User != null)
                        {
                            // Update local user record with Supabase Auth ID
                            user.SupabaseAuthId = session.User.Id;
                            
                            await _supabaseClient
                                .From<HiringUserProfile>()
                                .Where(u => u.Id == user.Id)
                                .Update(user);

                            result.MigratedUsers++;
                            result.TemporaryPasswords.Add(user.Email, tempPassword);

                            _logger.LogInformation("Successfully migrated HiringUserProfile {Email} with ID {SupabaseId}", 
                                user.Email, session.User.Id);
                        }
                        else
                        {
                            result.FailedUsers++;
                            result.FailedMigrations.Add(user.Email, "Failed to create user in Supabase Auth");
                            _logger.LogError("Failed to migrate HiringUserProfile {Email}: No user returned from Supabase", user.Email);
                        }

                        // Add delay to avoid rate limiting
                        await Task.Delay(100);
                    }
                    catch (Exception ex)
                    {
                        result.FailedUsers++;
                        result.FailedMigrations.Add(user.Email, ex.Message);
                        _logger.LogError(ex, "Error migrating HiringUserProfile {Email}", user.Email);
                    }
                }

                result.Success = result.FailedUsers == 0;
                _logger.LogInformation("HiringUserProfile migration completed. Success: {Success}, Migrated: {Migrated}, Failed: {Failed}, Skipped: {Skipped}", 
                    result.Success, result.MigratedUsers, result.FailedUsers, result.SkippedUsers);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical error during HiringUserProfile migration");
                result.Success = false;
                return result;
            }
        }

        /// <summary>
        /// Send password reset emails to all migrated users
        /// </summary>
        public async Task<bool> SendPasswordResetEmailsAsync(List<string> emailAddresses)
        {
            try
            {
                _logger.LogInformation("Sending password reset emails to {Count} users", emailAddresses.Count);

                var adminClient = new Supabase.Client(
                    Environment.GetEnvironmentVariable("SUPABASE_URL")!,
                    _serviceRoleKey,
                    new SupabaseOptions
                    {
                        AutoConnectRealtime = false,
                        AutoRefreshToken = false
                    }
                );

                foreach (var email in emailAddresses)
                {
                    try
                    {
                        await adminClient.Auth.ResetPasswordForEmail(email);
                        _logger.LogInformation("Password reset email sent to {Email}", email);
                        
                        // Add delay to avoid rate limiting
                        await Task.Delay(200);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending password reset emails");
                return false;
            }
        }

        /// <summary>
        /// Generate a static temporary password for migration testing
        /// </summary>
        private static string GenerateTemporaryPassword()
        {
            // Using static password for testing purposes
            return "test123";
        }

        /// <summary>
        /// Verify migration was successful by checking all users have SupabaseAuthId
        /// </summary>
        public async Task<MigrationVerificationResult> VerifyMigrationAsync()
        {
            var result = new MigrationVerificationResult();
            
            try
            {
                // Check ApplicationUsers
                var appUsersResponse = await _supabaseClient
                    .From<ApplicationUser>()
                    .Where(u => u.IsActive == true)
                    .Get();

                var appUsers = appUsersResponse.Models;
                result.TotalApplicationUsers = appUsers.Count;
                result.MigratedApplicationUsers = appUsers.Count(u => !string.IsNullOrEmpty(u.SupabaseAuthId));

                // Check HiringUserProfiles
                var hiringUsersResponse = await _supabaseClient
                    .From<HiringUserProfile>()
                    .Where(u => u.IsActive == true)
                    .Get();

                var hiringUsers = hiringUsersResponse.Models;
                result.TotalHiringUsers = hiringUsers.Count;
                result.MigratedHiringUsers = hiringUsers.Count(u => !string.IsNullOrEmpty(u.SupabaseAuthId));

                result.Success = (result.MigratedApplicationUsers == result.TotalApplicationUsers) && 
                               (result.MigratedHiringUsers == result.TotalHiringUsers);

                _logger.LogInformation("Migration verification completed. ApplicationUsers: {AppMigrated}/{AppTotal}, HiringUsers: {HiringMigrated}/{HiringTotal}", 
                    result.MigratedApplicationUsers, result.TotalApplicationUsers,
                    result.MigratedHiringUsers, result.TotalHiringUsers);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during migration verification");
                result.Success = false;
                return result;
            }
        }
    }

    public class MigrationResult
    {
        public bool Success { get; set; }
        public int TotalUsers { get; set; }
        public int MigratedUsers { get; set; }
        public int FailedUsers { get; set; }
        public int SkippedUsers { get; set; }
        public Dictionary<string, string> TemporaryPasswords { get; set; } = new();
        public Dictionary<string, string> FailedMigrations { get; set; } = new();
    }

    public class MigrationVerificationResult
    {
        public bool Success { get; set; }
        public int TotalApplicationUsers { get; set; }
        public int MigratedApplicationUsers { get; set; }
        public int TotalHiringUsers { get; set; }
        public int MigratedHiringUsers { get; set; }
    }
}
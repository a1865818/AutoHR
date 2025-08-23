using DotNetEnv;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ai_hr.Migration;

namespace ai_hr.Migration
{
    public class MigrationRunner
    {
        public static async Task Main(string[] args)
        {
            Console.WriteLine("=== Supabase Auth Migration Tool ===");
            Console.WriteLine("This tool will migrate all existing users to Supabase Auth.");
            Console.WriteLine();

            // Load environment variables
            Env.Load();

            // Verify required environment variables
            var requiredVars = new[] { "SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_SERVICE_KEY" };
            var missingVars = requiredVars.Where(var => string.IsNullOrEmpty(Environment.GetEnvironmentVariable(var))).ToList();

            if (missingVars.Any())
            {
                Console.WriteLine("❌ Missing required environment variables:");
                foreach (var var in missingVars)
                {
                    Console.WriteLine($"   - {var}");
                }
                Console.WriteLine();
                Console.WriteLine("Please ensure all required environment variables are set in your .env file.");
                return;
            }

            // Build service provider
            var serviceProvider = BuildServiceProvider();

            try
            {
                var migrationService = serviceProvider.GetRequiredService<UserMigrationService>();
                var logger = serviceProvider.GetRequiredService<ILogger<MigrationRunner>>();

                Console.WriteLine("🚀 Starting user migration process...");
                Console.WriteLine();

                // Step 1: Verify current state
                Console.WriteLine("📊 Verifying current migration state...");
                var verificationResult = await migrationService.VerifyMigrationAsync();
                
                Console.WriteLine($"   ApplicationUsers: {verificationResult.MigratedApplicationUsers}/{verificationResult.TotalApplicationUsers} migrated");
                Console.WriteLine($"   HiringUsers: {verificationResult.MigratedHiringUsers}/{verificationResult.TotalHiringUsers} migrated");
                Console.WriteLine();

                if (verificationResult.Success)
                {
                    Console.WriteLine("✅ All users are already migrated!");
                    return;
                }

                // Confirm before proceeding
                Console.Write("⚠️  Do you want to proceed with the migration? (y/N): ");
                var confirmation = Console.ReadLine()?.ToLower();
                if (confirmation != "y" && confirmation != "yes")
                {
                    Console.WriteLine("Migration cancelled.");
                    return;
                }
                Console.WriteLine();

                // Step 2: Migrate ApplicationUsers
                if (verificationResult.MigratedApplicationUsers < verificationResult.TotalApplicationUsers)
                {
                    Console.WriteLine("👤 Migrating ApplicationUsers...");
                    var appUserResult = await migrationService.MigrateApplicationUsersAsync();
                    
                    Console.WriteLine($"   ✅ Migrated: {appUserResult.MigratedUsers}");
                    Console.WriteLine($"   ⏭️  Skipped: {appUserResult.SkippedUsers}");
                    Console.WriteLine($"   ❌ Failed: {appUserResult.FailedUsers}");
                    
                    if (appUserResult.FailedUsers > 0)
                    {
                        Console.WriteLine("   Failed migrations:");
                        foreach (var failure in appUserResult.FailedMigrations)
                        {
                            Console.WriteLine($"     - {failure.Key}: {failure.Value}");
                        }
                    }
                    Console.WriteLine();
                }

                // Step 3: Migrate HiringUsers
                if (verificationResult.MigratedHiringUsers < verificationResult.TotalHiringUsers)
                {
                    Console.WriteLine("👔 Migrating HiringUsers...");
                    var hiringUserResult = await migrationService.MigrateHiringUsersAsync();
                    
                    Console.WriteLine($"   ✅ Migrated: {hiringUserResult.MigratedUsers}");
                    Console.WriteLine($"   ⏭️  Skipped: {hiringUserResult.SkippedUsers}");
                    Console.WriteLine($"   ❌ Failed: {hiringUserResult.FailedUsers}");
                    
                    if (hiringUserResult.FailedUsers > 0)
                    {
                        Console.WriteLine("   Failed migrations:");
                        foreach (var failure in hiringUserResult.FailedMigrations)
                        {
                            Console.WriteLine($"     - {failure.Key}: {failure.Value}");
                        }
                    }
                    Console.WriteLine();
                }

                // Step 4: Final verification
                Console.WriteLine("🔍 Performing final verification...");
                var finalVerification = await migrationService.VerifyMigrationAsync();
                
                Console.WriteLine($"   ApplicationUsers: {finalVerification.MigratedApplicationUsers}/{finalVerification.TotalApplicationUsers} migrated");
                Console.WriteLine($"   HiringUsers: {finalVerification.MigratedHiringUsers}/{finalVerification.TotalHiringUsers} migrated");
                Console.WriteLine();

                if (finalVerification.Success)
                {
                    Console.WriteLine("🎉 Migration completed successfully!");
                    Console.WriteLine();
                    Console.WriteLine("📧 IMPORTANT: Users will need to reset their passwords.");
                    Console.WriteLine("   Consider sending password reset emails to all users:");
                    Console.WriteLine("   - Use Supabase Dashboard > Authentication > Users");
                    Console.WriteLine("   - Or implement a bulk password reset email feature");
                    Console.WriteLine();
                    Console.WriteLine("🗄️  Database cleanup:");
                    Console.WriteLine("   - You can now remove Password, RefreshToken, and RefreshTokenExpiry columns");
                    Console.WriteLine("   - Update your application code to use Supabase Auth exclusively");
                }
                else
                {
                    Console.WriteLine("❌ Migration completed with errors. Please review the logs and retry for failed users.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 Critical error during migration: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
            finally
            {
                serviceProvider.Dispose();
            }

            Console.WriteLine();
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }

        private static ServiceProvider BuildServiceProvider()
        {
            var services = new ServiceCollection();

            // Add logging
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Information);
            });

            // Add Supabase client
            services.AddScoped<Supabase.Client>(_ => new Supabase.Client(
                Environment.GetEnvironmentVariable("SUPABASE_URL") ?? throw new InvalidOperationException("SUPABASE_URL not configured"),
                Environment.GetEnvironmentVariable("SUPABASE_KEY") ?? throw new InvalidOperationException("SUPABASE_KEY not configured"),
                new Supabase.SupabaseOptions
                {
                    AutoRefreshToken = false,
                    AutoConnectRealtime = false
                }
            ));

            // Add migration service
            services.AddScoped<UserMigrationService>();

            return services.BuildServiceProvider();
        }
    }
}
using ai_hr.Migration;
using Microsoft.AspNetCore.Authorization;

namespace ai_hr.Endpoints
{
    public static class MigrationEndpoints
    {
        public static void MapMigrationEndpoints(this WebApplication app)
        {
            var migrationGroup = app.MapGroup("/api/migration")
                .WithTags("User Migration");
                // NOTE: Authorization temporarily removed for initial migration
                // .RequireAuthorization(); // TODO: Re-enable for production

            // POST /api/migration/application-users - Migrate ApplicationUsers to Supabase Auth
            migrationGroup.MapPost("/application-users", async (UserMigrationService migrationService) =>
            {
                try
                {
                    Console.WriteLine("🚀 Starting ApplicationUser migration to Supabase Auth...");
                    
                    var result = await migrationService.MigrateApplicationUsersAsync();
                    
                    var response = new
                    {
                        success = result.Success,
                        message = result.Success ? 
                            "ApplicationUser migration completed successfully" : 
                            "ApplicationUser migration completed with errors",
                        totalUsers = result.TotalUsers,
                        migratedUsers = result.MigratedUsers,
                        failedUsers = result.FailedUsers,
                        skippedUsers = result.SkippedUsers,
                        failedMigrations = result.FailedMigrations,
                        // Don't return temporary passwords in API response for security
                        temporaryPasswordsGenerated = result.TemporaryPasswords.Count
                    };

                    if (result.Success)
                    {
                        Console.WriteLine($"✅ ApplicationUser migration successful: {result.MigratedUsers} users migrated");
                        return Results.Ok(response);
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ ApplicationUser migration completed with errors: {result.FailedUsers} failed");
                        return Results.BadRequest(response);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ ApplicationUser migration failed: {ex.Message}");
                    return Results.Problem($"Migration failed: {ex.Message}");
                }
            })
            .WithName("MigrateApplicationUsers")
            .WithSummary("Migrate ApplicationUsers to Supabase Auth")
            .WithDescription("Migrates all existing ApplicationUsers to Supabase Auth system");

            // POST /api/migration/hiring-users - Migrate HiringUsers to Supabase Auth
            migrationGroup.MapPost("/hiring-users", async (UserMigrationService migrationService) =>
            {
                try
                {
                    Console.WriteLine("🚀 Starting HiringUser migration to Supabase Auth...");
                    
                    var result = await migrationService.MigrateHiringUsersAsync();
                    
                    var response = new
                    {
                        success = result.Success,
                        message = result.Success ? 
                            "HiringUser migration completed successfully" : 
                            "HiringUser migration completed with errors",
                        totalUsers = result.TotalUsers,
                        migratedUsers = result.MigratedUsers,
                        failedUsers = result.FailedUsers,
                        skippedUsers = result.SkippedUsers,
                        failedMigrations = result.FailedMigrations,
                        temporaryPasswordsGenerated = result.TemporaryPasswords.Count
                    };

                    if (result.Success)
                    {
                        Console.WriteLine($"✅ HiringUser migration successful: {result.MigratedUsers} users migrated");
                        return Results.Ok(response);
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ HiringUser migration completed with errors: {result.FailedUsers} failed");
                        return Results.BadRequest(response);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ HiringUser migration failed: {ex.Message}");
                    return Results.Problem($"Migration failed: {ex.Message}");
                }
            })
            .WithName("MigrateHiringUsers")
            .WithSummary("Migrate HiringUsers to Supabase Auth")
            .WithDescription("Migrates all existing HiringUsers to Supabase Auth system");

            // POST /api/migration/all - Migrate all users
            migrationGroup.MapPost("/all", async (UserMigrationService migrationService) =>
            {
                try
                {
                    Console.WriteLine("🚀 Starting full migration to Supabase Auth...");
                    
                    // Migrate ApplicationUsers first
                    var appUserResult = await migrationService.MigrateApplicationUsersAsync();
                    
                    // Migrate HiringUsers
                    var hiringUserResult = await migrationService.MigrateHiringUsersAsync();
                    
                    var response = new
                    {
                        success = appUserResult.Success && hiringUserResult.Success,
                        message = (appUserResult.Success && hiringUserResult.Success) ? 
                            "Full migration completed successfully" : 
                            "Migration completed with some errors",
                        applicationUsers = new
                        {
                            totalUsers = appUserResult.TotalUsers,
                            migratedUsers = appUserResult.MigratedUsers,
                            failedUsers = appUserResult.FailedUsers,
                            skippedUsers = appUserResult.SkippedUsers
                        },
                        hiringUsers = new
                        {
                            totalUsers = hiringUserResult.TotalUsers,
                            migratedUsers = hiringUserResult.MigratedUsers,
                            failedUsers = hiringUserResult.FailedUsers,
                            skippedUsers = hiringUserResult.SkippedUsers
                        },
                        totalMigrated = appUserResult.MigratedUsers + hiringUserResult.MigratedUsers,
                        totalFailed = appUserResult.FailedUsers + hiringUserResult.FailedUsers
                    };

                    if (response.success)
                    {
                        Console.WriteLine($"✅ Full migration successful: {response.totalMigrated} users migrated");
                        return Results.Ok(response);
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ Migration completed with errors: {response.totalFailed} failed");
                        return Results.BadRequest(response);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Full migration failed: {ex.Message}");
                    return Results.Problem($"Migration failed: {ex.Message}");
                }
            })
            .WithName("MigrateAllUsers")
            .WithSummary("Migrate all users to Supabase Auth")
            .WithDescription("Migrates both ApplicationUsers and HiringUsers to Supabase Auth system");

            // GET /api/migration/verify - Verify migration status
            migrationGroup.MapGet("/verify", async (UserMigrationService migrationService) =>
            {
                try
                {
                    Console.WriteLine("🔍 Verifying migration status...");
                    
                    var result = await migrationService.VerifyMigrationAsync();
                    
                    var response = new
                    {
                        success = result.Success,
                        message = result.Success ? 
                            "All users have been successfully migrated" : 
                            "Some users still need to be migrated",
                        applicationUsers = new
                        {
                            total = result.TotalApplicationUsers,
                            migrated = result.MigratedApplicationUsers,
                            remaining = result.TotalApplicationUsers - result.MigratedApplicationUsers
                        },
                        hiringUsers = new
                        {
                            total = result.TotalHiringUsers,
                            migrated = result.MigratedHiringUsers,
                            remaining = result.TotalHiringUsers - result.MigratedHiringUsers
                        },
                        overallProgress = new
                        {
                            totalUsers = result.TotalApplicationUsers + result.TotalHiringUsers,
                            totalMigrated = result.MigratedApplicationUsers + result.MigratedHiringUsers,
                            completionPercentage = Math.Round(
                                ((double)(result.MigratedApplicationUsers + result.MigratedHiringUsers) / 
                                 (result.TotalApplicationUsers + result.TotalHiringUsers)) * 100, 2)
                        }
                    };

                    Console.WriteLine($"📊 Migration Status: {response.overallProgress.completionPercentage}% complete");
                    return Results.Ok(response);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Migration verification failed: {ex.Message}");
                    return Results.Problem($"Verification failed: {ex.Message}");
                }
            })
            .WithName("VerifyMigration")
            .WithSummary("Verify migration status")
            .WithDescription("Check the current status of user migration to Supabase Auth");

            // POST /api/migration/reset - Reset migration status to allow re-migration
            migrationGroup.MapPost("/reset", async (Supabase.Client client) =>
            {
                try
                {
                    Console.WriteLine("🔄 Resetting migration status...");

                    // Reset ApplicationUsers
                    var appUsersResponse = await client.From<ai_hr.Models.ApplicationUser>()
                        .Where(u => u.SupabaseAuthId != null && u.SupabaseAuthId != "")
                        .Get();

                    foreach (var user in appUsersResponse.Models)
                    {
                        user.SupabaseAuthId = null;
                        await client.From<ai_hr.Models.ApplicationUser>().Update(user);
                    }

                    // Reset HiringUserProfiles
                    var hiringUsersResponse = await client.From<ai_hr.Models.HiringUserProfile>()
                        .Where(u => u.SupabaseAuthId != null && u.SupabaseAuthId != "")
                        .Get();

                    foreach (var user in hiringUsersResponse.Models)
                    {
                        user.SupabaseAuthId = null;
                        await client.From<ai_hr.Models.HiringUserProfile>().Update(user);
                    }

                    var totalReset = appUsersResponse.Models.Count + hiringUsersResponse.Models.Count;
                    
                    Console.WriteLine($"✅ Migration status reset for {totalReset} users");
                    return Results.Ok(new { 
                        message = "Migration status reset successfully", 
                        resetUsers = totalReset,
                        applicationUsers = appUsersResponse.Models.Count,
                        hiringUsers = hiringUsersResponse.Models.Count
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Failed to reset migration status: {ex.Message}");
                    return Results.Problem($"Reset failed: {ex.Message}");
                }
            })
            .WithName("ResetMigration")
            .WithSummary("Reset migration status")
            .WithDescription("Clear SupabaseAuthId fields to allow re-migration with new passwords");

            // POST /api/migration/send-reset-emails - Send password reset emails to migrated users
            migrationGroup.MapPost("/send-reset-emails", async (UserMigrationService migrationService, Supabase.Client client) =>
            {
                try
                {
                    Console.WriteLine("📧 Sending password reset emails to migrated users...");

                    // Get all migrated users
                    var appUsers = await client.From<ai_hr.Models.ApplicationUser>()
                        .Where(u => u.SupabaseAuthId != null && u.SupabaseAuthId != "" && u.IsActive == true)
                        .Get();

                    var hiringUsers = await client.From<ai_hr.Models.HiringUserProfile>()
                        .Where(u => u.SupabaseAuthId != null && u.SupabaseAuthId != "" && u.IsActive == true)
                        .Get();

                    var allEmails = new List<string>();
                    allEmails.AddRange(appUsers.Models.Select(u => u.Email));
                    allEmails.AddRange(hiringUsers.Models.Select(u => u.Email));

                    var result = await migrationService.SendPasswordResetEmailsAsync(allEmails);

                    var response = new
                    {
                        success = result,
                        message = result ? 
                            "Password reset emails sent successfully" : 
                            "Some password reset emails failed to send",
                        emailsSent = allEmails.Count,
                        applicationUsers = appUsers.Models.Count,
                        hiringUsers = hiringUsers.Models.Count
                    };

                    if (result)
                    {
                        Console.WriteLine($"✅ Password reset emails sent to {allEmails.Count} users");
                        return Results.Ok(response);
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ Some password reset emails failed to send");
                        return Results.BadRequest(response);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Failed to send password reset emails: {ex.Message}");
                    return Results.Problem($"Failed to send emails: {ex.Message}");
                }
            })
            .WithName("SendPasswordResetEmails")
            .WithSummary("Send password reset emails to migrated users")
            .WithDescription("Sends password reset emails to all users who have been migrated to Supabase Auth");
        }
    }
}
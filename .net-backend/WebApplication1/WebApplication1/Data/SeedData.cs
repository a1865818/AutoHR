using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Entities;

namespace WebApplication1.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            // Ensure database is created
            await context.Database.MigrateAsync();

            // Seed Roles
            string[] roleNames = { "Admin", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // Seed Admin User
            const string adminEmail = "admin@example.com";
            const string adminPassword = "Admin123!";

            if (await userManager.FindByEmailAsync(adminEmail) == null)
            {
                var adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FirstName = "System",
                    LastName = "Administrator",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
            // Seed Regular User for testing
            const string userEmail = "user@example.com";
            const string userPassword = "User123!";

            if (await userManager.FindByEmailAsync(userEmail) == null)
            {
                var regularUser = new ApplicationUser
                {
                    UserName = userEmail,
                    Email = userEmail,
                    FirstName = "Test",
                    LastName = "User",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(regularUser, userPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(regularUser, "User");
                }
            }

            // Seed some sample jobs (created by admin)
            if (!context.Jobs.Any())
            {
                var adminUser = await userManager.FindByEmailAsync(adminEmail);
                if (adminUser != null)
                {
                    var sampleJobs = new List<Jobs>
                    {
                        new Jobs
                        {
                            Id = Guid.NewGuid(),
                            Title = "Software Developer",
                            Company = "Tech Corp",
                            Location = "San Francisco, CA",
                            Type = "Full-time",
                            Experience = "2-4 years",
                            Salary = "$80,000 - $120,000",
                            Description = "Join our dynamic development team working on cutting-edge web applications.",
                            Requirements = "C#, ASP.NET Core, Entity Framework, SQL Server",
                            PostedDate = DateTime.Now.AddDays(-5),
                            Applicants = 12,
                            Status = "Active",
                            Urgency = "High",
                            CreatedBy = adminUser.Id
                        },
                        new Jobs
                        {
                            Id = Guid.NewGuid(),
                            Title = "Frontend Developer",
                            Company = "Design Studio",
                            Location = "New York, NY",
                            Type = "Part-time",
                            Experience = "1-3 years",
                            Salary = "$50,000 - $70,000",
                            Description = "Create beautiful user interfaces using modern frontend technologies.",
                            Requirements = "React, TypeScript, CSS, HTML",
                            PostedDate = DateTime.Now.AddDays(-3),
                            Applicants = 8,
                            Status = "Active",
                            Urgency = "Medium",
                            CreatedBy = adminUser.Id
                        },
                        new Jobs
                        {
                            Id = Guid.NewGuid(),
                            Title = "Data Analyst",
                            Company = "Analytics Inc",
                            Location = "Remote",
                            Type = "Contract",
                            Experience = "3-5 years",
                            Salary = "$60,000 - $90,000",
                            Description = "Analyze large datasets to provide business insights and recommendations.",
                            Requirements = "SQL, Python, Tableau, Statistics",
                            PostedDate = DateTime.Now.AddDays(-7),
                            Applicants = 15,
                            Status = "Active",
                            Urgency = "Low",
                            CreatedBy = adminUser.Id
                        }
                    };

                    context.Jobs.AddRange(sampleJobs);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}

using ai_hr.Models;
using ai_hr.Contracts.Interview;
using Supabase;
using System.Security.Claims;
using System.Text.Json;

namespace ai_hr.Endpoints;

public static class InterviewEndpoints
{
    public static void MapInterviewEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/interviews").WithTags("Interviews");

        // Interview Templates Endpoints
        group.MapGet("/templates", (Supabase.Client client, ClaimsPrincipal user, ILogger logger) => 
            GetInterviewTemplates(client, user, logger))
            .WithName("GetInterviewTemplates")
            .WithSummary("Get all interview templates for the user's company")
            .RequireAuthorization();

        group.MapGet("/templates/{id:guid}", GetInterviewTemplate)
            .WithName("GetInterviewTemplate")
            .WithSummary("Get a specific interview template by ID")
            .RequireAuthorization();

        group.MapGet("/templates/{id:guid}/applicant", GetApplicantInterviewTemplate)
            .WithName("GetApplicantInterviewTemplate")
            .WithSummary("Get a specific interview template by ID for applicants")
            .RequireAuthorization();

        group.MapPost("/templates", CreateInterviewTemplate)
            .WithName("CreateInterviewTemplate")
            .WithSummary("Create a new interview template")
            .RequireAuthorization();

        group.MapPut("/templates/{id:guid}", UpdateInterviewTemplate)
            .WithName("UpdateInterviewTemplate")
            .WithSummary("Update an existing interview template")
            .RequireAuthorization();

        group.MapDelete("/templates/{id:guid}", DeleteInterviewTemplate)
            .WithName("DeleteInterviewTemplate")
            .WithSummary("Delete an interview template")
            .RequireAuthorization();

        group.MapPost("/templates/{id:guid}/clone", CloneInterviewTemplate)
            .WithName("CloneInterviewTemplate")
            .WithSummary("Clone an existing interview template")
            .RequireAuthorization();

        group.MapPost("/templates/{id:guid}/set-default", SetDefaultInterviewTemplate)
            .WithName("SetDefaultInterviewTemplate")
            .WithSummary("Set a template as the default template")
            .RequireAuthorization();

        group.MapGet("/stats", GetInterviewStats)
            .WithName("GetInterviewStats")
            .WithSummary("Get interview statistics")
            .RequireAuthorization();

        // Interview Rounds Endpoints
        group.MapGet("/templates/{templateId:guid}/rounds", GetInterviewRounds)
            .WithName("GetInterviewRounds")
            .WithSummary("Get all rounds for a template")
            .RequireAuthorization();

        group.MapPost("/templates/{templateId:guid}/rounds", CreateInterviewRound)
            .WithName("CreateInterviewRound")
            .WithSummary("Create a new interview round")
            .RequireAuthorization();

        group.MapPut("/rounds/{id:guid}", UpdateInterviewRound)
            .WithName("UpdateInterviewRound")
            .WithSummary("Update an existing interview round")
            .RequireAuthorization();

        group.MapDelete("/rounds/{id:guid}", DeleteInterviewRound)
            .WithName("DeleteInterviewRound")
            .WithSummary("Delete an interview round")
            .RequireAuthorization();
    }

    private static async Task<IResult> GetInterviewTemplates(
        Supabase.Client client,
        ClaimsPrincipal user,
        ILogger logger = null)
    {
        try
        {
            // Extract user ID from both possible claim types (Supabase uses "sub", custom uses NameIdentifier)
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                         user.FindFirst("sub")?.Value;
            
            logger?.LogInformation("🔍 GetInterviewTemplates: UserId={UserId}, AllClaims={Claims}", 
                userId, string.Join(", ", user.Claims.Select(c => $"{c.Type}:{c.Value}")));
            
            if (string.IsNullOrEmpty(userId))
            {
                logger?.LogWarning("❌ No user ID found in token claims");
                return Results.Unauthorized();
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                logger?.LogWarning("❌ Invalid user ID format: {UserId}", userId);
                return Results.BadRequest(new { error = "Invalid user ID format" });
            }

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            var templatesResponse = await client.From<InterviewTemplate>().Get();
            var templates = templatesResponse.Models
                .Where(t => t.CompanyId == companyId.Value || t.CompanyId == null)
                .OrderByDescending(t => t.CreatedAt)
                .ToList();

            // Get rounds for each template
            var roundsResponse = await client.From<InterviewRound>().Get();
            var allRounds = roundsResponse.Models;

            var response = templates.Select(t => MapToResponseDto(t, allRounds.Where(r => r.TemplateId == t.Id).OrderBy(r => r.RoundOrder).ToList())).ToList();
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving interview templates: {ex.Message}");
        }
    }

    private static async Task<IResult> GetInterviewTemplate(
        Guid id,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            // Extract user ID from both possible claim types (Supabase uses "sub", custom uses NameIdentifier)
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                         user.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            if (!Guid.TryParse(userId, out var userGuid))
                return Results.BadRequest(new { error = "Invalid user ID format" });

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == id &&
                (t.CompanyId == companyId.Value || t.CompanyId == null));

            if (template == null)
                return Results.NotFound();

            // Get rounds for the template
            var roundsResponse = await client.From<InterviewRound>().Get();
            var rounds = roundsResponse.Models.Where(r => r.TemplateId == id).OrderBy(r => r.RoundOrder).ToList();

            var response = MapToResponseDto(template, rounds);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving interview template: {ex.Message}");
        }
    }

    private static async Task<IResult> GetApplicantInterviewTemplate(
        Guid id,
        Guid? companyId,
        Supabase.Client client)
    {
        try
        {
            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == id &&
                (t.CompanyId == companyId || t.CompanyId == null));

            if (template == null)
                return Results.NotFound();

            // Get rounds for the template
            var roundsResponse = await client.From<InterviewRound>().Get();
            var rounds = roundsResponse.Models.Where(r => r.TemplateId == id).OrderBy(r => r.RoundOrder).ToList();

            var response = MapToResponseDto(template, rounds);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving public interview template: {ex.Message}");
        }
    }

    private static async Task<IResult> CreateInterviewTemplate(
        InterviewTemplateCreateDto dto,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            // Get migrated user ID from JWT metadata
            var migratedUserId = GetMigratedUserId(user);
            Console.WriteLine($"🔍 CreateInterviewTemplate - MigratedUserId: {migratedUserId}");
            if (migratedUserId == null)
                return Results.Unauthorized();

            var template = new InterviewTemplate
            {
                Name = dto.Name,
                Description = dto.Description,
                IsDefault = dto.IsDefault,
                CompanyId = companyId.Value,
                CreatedBy = migratedUserId.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var insertedTemplateResponse = await client.From<InterviewTemplate>().Insert(template);
            var createdTemplate = insertedTemplateResponse.Models.FirstOrDefault();

            if (createdTemplate == null)
                return Results.Problem("Failed to create interview template");

            var response = MapToResponseDto(createdTemplate, new List<InterviewRound>());
            return Results.Created($"/interviews/templates/{createdTemplate.Id}", response);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating interview template: {ex.Message}");
        }
    }

    private static async Task<IResult> UpdateInterviewTemplate(
        Guid id,
        InterviewTemplateUpdateDto dto,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            if (!Guid.TryParse(userId, out var userGuid))
                return Results.BadRequest(new { error = "Invalid user ID format" });

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == id && t.CompanyId == companyId.Value);

            if (template == null)
                return Results.NotFound();

            // Update template properties
            if (!string.IsNullOrEmpty(dto.Name))
                template.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Description))
                template.Description = dto.Description;
            if (dto.IsDefault.HasValue)
                template.IsDefault = dto.IsDefault.Value;

            template.UpdatedAt = DateTime.UtcNow;

            await client.From<InterviewTemplate>().Update(template);

            // Get current rounds for the response
            var roundsResponse = await client.From<InterviewRound>().Get();
            var currentRounds = roundsResponse.Models.Where(r => r.TemplateId == id).OrderBy(r => r.RoundOrder).ToList();

            var response = MapToResponseDto(template, currentRounds);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error updating interview template: {ex.Message}");
        }
    }

    private static async Task<IResult> DeleteInterviewTemplate(
        Guid id,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            if (!Guid.TryParse(userId, out var userGuid))
                return Results.BadRequest(new { error = "Invalid user ID format" });

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == id && t.CompanyId == companyId.Value);

            if (template == null)
                return Results.NotFound();

            await client.From<InterviewTemplate>().Delete(template);

            return Results.NoContent();
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting interview template: {ex.Message}");
        }
    }

    private static async Task<IResult> CloneInterviewTemplate(
        Guid id,
        CloneTemplateRequest request,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
            {
                Console.WriteLine("❌ Company ID not found in JWT");
                return Results.Unauthorized();
            }

            // Get migrated user ID from JWT metadata
            var migratedUserId = GetMigratedUserId(user);
            if (migratedUserId == null)
            {
                Console.WriteLine("❌ Migrated user ID not found in JWT");
                return Results.Unauthorized();
            }

            var templateResponse = await client.From<InterviewTemplate>().Get();
            var originalTemplate = templateResponse.Models.FirstOrDefault(t => t.Id == id &&
                (t.CompanyId == companyId.Value || t.CompanyId == null));

            if (originalTemplate == null)
            {
                Console.WriteLine("❌ Original template not found");
                return Results.NotFound();
            }

            var clonedTemplate = new InterviewTemplate
            {
                Name = request.Name,
                Description = originalTemplate.Description,
                IsDefault = false,
                CompanyId = companyId.Value,
                CreatedBy = migratedUserId.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            Console.WriteLine($"➕ Inserting cloned template: {request.Name}");
            var insertedTemplateResponse = await client.From<InterviewTemplate>().Insert(clonedTemplate);
            var insertedTemplate = insertedTemplateResponse.Models.FirstOrDefault();

            if (insertedTemplate == null)
            {
                Console.WriteLine("❌ Failed to insert cloned template");
                return Results.Problem("Failed to create cloned template");
            }

            Console.WriteLine($"✅ Template cloned successfully: {insertedTemplate.Id}");

            // Clone rounds
            Console.WriteLine($"🔍 Getting original rounds for template: {id}");
            var roundsResponse = await client.From<InterviewRound>().Get();
            var originalRounds = roundsResponse.Models.Where(r => r.TemplateId == id).ToList();
            Console.WriteLine($"🔍 Found {originalRounds.Count} rounds to clone");

            var clonedRounds = new List<InterviewRound>();

            // Insert rounds one by one to avoid bulk insert issues
            for (int i = 0; i < originalRounds.Count; i++)
            {
                var originalRound = originalRounds[i];
                Console.WriteLine($"🔄 Cloning round {i + 1}/{originalRounds.Count}: {originalRound.Name}");

                var clonedRound = new InterviewRound
                {
                    TemplateId = insertedTemplate.Id, // Use the actual inserted template ID
                    Name = originalRound.Name,
                    Type = originalRound.Type,
                    Duration = originalRound.Duration,
                    RoundOrder = originalRound.RoundOrder,
                    Requirements = originalRound.Requirements ?? new string[0],
                    Interviewers = originalRound.Interviewers ?? new string[0],
                    IsOptional = originalRound.IsOptional,
                    PassingCriteria = originalRound.PassingCriteria,
                    Description = originalRound.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                try
                {
                    await client.From<InterviewRound>().Insert(clonedRound);
                    clonedRounds.Add(clonedRound);
                    Console.WriteLine($"✅ Round cloned successfully: {clonedRound.Name} ({clonedRound.Id})");
                }
                catch (Exception roundEx)
                {
                    Console.WriteLine($"❌ Error cloning round {originalRound.Name}: {roundEx.Message}");
                    throw new Exception($"Failed to clone round '{originalRound.Name}': {roundEx.Message}", roundEx);
                }
            }

            Console.WriteLine($"✅ All {clonedRounds.Count} rounds cloned successfully");

            // Reload template for response
            Console.WriteLine($"🔍 Reloading cloned template for response: {insertedTemplate.Id}");
            var resultResponse = await client.From<InterviewTemplate>().Get();
            var result = resultResponse.Models.FirstOrDefault(t => t.Id == insertedTemplate.Id);

            if (result == null)
            {
                Console.WriteLine("❌ Failed to reload cloned template");
                return Results.Problem("Failed to reload cloned template");
            }

            var response = MapToResponseDto(result, clonedRounds);
            Console.WriteLine($"🎉 Clone completed successfully: {insertedTemplate.Id}");
            return Results.Created($"/interviews/templates/{insertedTemplate.Id}", response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in CloneInterviewTemplate: {ex.Message}");
            Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
            return Results.Problem($"Error cloning interview template: {ex.Message}");
        }
    }

    private static async Task<IResult> SetDefaultInterviewTemplate(
        Guid id,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"🔍 Setting template as default: {id}");

            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("❌ No user ID found");
                return Results.Unauthorized();
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                Console.WriteLine("❌ Invalid user ID format");
                return Results.BadRequest(new { error = "Invalid user ID format" });
            }

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
            {
                Console.WriteLine("❌ Company ID not found in JWT");
                return Results.Unauthorized();
            }

            // Get fresh template data to avoid stale references
            Console.WriteLine($"🔍 Getting fresh template data for: {id}");
            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == id && t.CompanyId == companyId.Value);

            if (template == null)
            {
                Console.WriteLine("❌ Template not found or access denied");
                Console.WriteLine($"🔍 Available templates for company {companyId.Value}:");
                var availableTemplates = templateResponse.Models.Where(t => t.CompanyId == companyId.Value).ToList();
                foreach (var t in availableTemplates)
                {
                    Console.WriteLine($"   - {t.Id}: {t.Name} (IsDefault: {t.IsDefault})");
                }
                return Results.NotFound();
            }

            Console.WriteLine($"🔍 Found template: {template.Name} (IsDefault: {template.IsDefault})");

            // If this template is already default, no need to do anything
            if (template.IsDefault)
            {
                Console.WriteLine($"✅ Template {template.Name} is already default");
                var roundsResponse = await client.From<InterviewRound>().Get();
                var currentRounds = roundsResponse.Models.Where(r => r.TemplateId == id).OrderBy(r => r.RoundOrder).ToList();
                var response = MapToResponseDto(template, currentRounds);
                return Results.Ok(response);
            }

            // First, unset all other templates as default for this company using UPDATE
            var companyTemplates = templateResponse.Models.Where(t => t.CompanyId == companyId.Value && t.IsDefault && t.Id != id).ToList();
            Console.WriteLine($"🔍 Found {companyTemplates.Count} current default templates to unset");

            foreach (var existingDefault in companyTemplates)
            {
                Console.WriteLine($"⚙️ Unsetting default for: {existingDefault.Name}");

                // Use proper update instead of delete+insert
                var updatedExistingTemplate = new InterviewTemplate
                {
                    Id = existingDefault.Id,
                    Name = existingDefault.Name,
                    Description = existingDefault.Description,
                    IsDefault = false, // Unset default
                    CompanyId = existingDefault.CompanyId,
                    UsageCount = existingDefault.UsageCount,
                    SuccessRate = existingDefault.SuccessRate,
                    AverageRating = existingDefault.AverageRating,
                    CreatedAt = existingDefault.CreatedAt,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = existingDefault.CreatedBy
                };

                try
                {
                    await client.From<InterviewTemplate>().Update(updatedExistingTemplate);
                    Console.WriteLine($"✅ Unset default for: {existingDefault.Name}");
                }
                catch (Exception updateEx)
                {
                    Console.WriteLine($"⚠️ Failed to update template {existingDefault.Name}, trying delete+insert: {updateEx.Message}");
                    // Fallback to delete+insert if update fails
                    await client.From<InterviewTemplate>().Delete(existingDefault);
                    await client.From<InterviewTemplate>().Insert(updatedExistingTemplate);
                    Console.WriteLine($"✅ Unset default for: {existingDefault.Name} (via delete+insert)");
                }
            }

            // Now set the target template as default using UPDATE
            Console.WriteLine($"⚙️ Setting {template.Name} as default");

            var updatedTemplate = new InterviewTemplate
            {
                Id = template.Id,
                Name = template.Name,
                Description = template.Description,
                IsDefault = true, // Set as default
                CompanyId = template.CompanyId,
                UsageCount = template.UsageCount,
                SuccessRate = template.SuccessRate,
                AverageRating = template.AverageRating,
                CreatedAt = template.CreatedAt,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = template.CreatedBy
            };

            try
            {
                await client.From<InterviewTemplate>().Update(updatedTemplate);
                Console.WriteLine($"✅ Set {template.Name} as default (via update)");
            }
            catch (Exception updateEx)
            {
                Console.WriteLine($"⚠️ Failed to update template {template.Name}, trying delete+insert: {updateEx.Message}");
                // Fallback to delete+insert if update fails
                await client.From<InterviewTemplate>().Delete(template);
                await client.From<InterviewTemplate>().Insert(updatedTemplate);
                Console.WriteLine($"✅ Set {template.Name} as default (via delete+insert)");
            }

            // Get current rounds for the response
            var finalRoundsResponse = await client.From<InterviewRound>().Get();
            var finalCurrentRounds = finalRoundsResponse.Models.Where(r => r.TemplateId == id).OrderBy(r => r.RoundOrder).ToList();

            var finalResponse = MapToResponseDto(updatedTemplate, finalCurrentRounds);
            Console.WriteLine($"🎉 Default template updated successfully: {id}");
            return Results.Ok(finalResponse);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in SetDefaultInterviewTemplate: {ex.Message}");
            Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
            return Results.Problem($"Error setting default interview template: {ex.Message}");
        }
    }

    private static async Task<IResult> GetInterviewStats(
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            // Extract user ID from both possible claim types (Supabase uses "sub", custom uses NameIdentifier)
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                         user.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            if (!Guid.TryParse(userId, out var userGuid))
                return Results.BadRequest(new { error = "Invalid user ID format" });

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            var templatesResponse = await client.From<InterviewTemplate>().Get();
            var templates = templatesResponse.Models
                .Where(t => t.CompanyId == companyId.Value || t.CompanyId == null)
                .ToList();

            var totalTemplates = templates.Count;

            // Get all rounds to calculate average duration
            var roundsResponse = await client.From<InterviewRound>().Get();
            var allRounds = roundsResponse.Models;

            var averageDuration = templates.Any()
                ? (int)templates.Average(t => allRounds.Where(r => r.TemplateId == t.Id).Sum(r => r.Duration))
                : 0;

            var averageSuccessRate = templates.Any()
                ? templates.Average(t => t.SuccessRate)
                : 0;

            var stats = new InterviewStatsDto
            {
                TotalTemplates = totalTemplates,
                ActiveInterviews = 0, // This would come from actual interview records
                SuccessRate = averageSuccessRate,
                AverageDuration = averageDuration
            };

            return Results.Ok(stats);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving interview stats: {ex.Message}");
        }
    }

    private static async Task<IResult> GetInterviewRounds(
        Guid templateId,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            if (!Guid.TryParse(userId, out var userGuid))
                return Results.BadRequest(new { error = "Invalid user ID format" });

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == templateId &&
                (t.CompanyId == companyId.Value || t.CompanyId == null));

            if (template == null)
                return Results.NotFound();

            var roundsResponse = await client.From<InterviewRound>().Get();
            var rounds = roundsResponse.Models.Where(r => r.TemplateId == templateId).OrderBy(r => r.RoundOrder).ToList();

            var response = rounds.Select(MapRoundToResponseDto).ToList();
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving interview rounds: {ex.Message}");
        }
    }

    private static async Task<IResult> CreateInterviewRound(
        Guid templateId,
        InterviewRoundCreateDto dto,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            if (!Guid.TryParse(userId, out var userGuid))
                return Results.BadRequest(new { error = "Invalid user ID format" });

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == templateId && t.CompanyId == companyId.Value);

            if (template == null)
                return Results.NotFound();

            var round = new InterviewRound
            {
                TemplateId = templateId,
                Name = dto.Name,
                Type = dto.Type,
                Duration = dto.Duration,
                RoundOrder = dto.RoundOrder,
                Requirements = dto.Requirements.ToArray(),
                Interviewers = dto.Interviewers.ToArray(),
                IsOptional = dto.IsOptional,
                PassingCriteria = dto.PassingCriteria,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await client.From<InterviewRound>().Insert(round);

            var response = MapRoundToResponseDto(round);
            return Results.Created($"/interviews/rounds/{round.Id}", response);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating interview round: {ex.Message}");
        }
    }

    private static async Task<IResult> UpdateInterviewRound(
        Guid id,
        InterviewRoundUpdateDto dto,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"🔍 Starting update for round: {id}");

            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("❌ No user ID found");
                return Results.Unauthorized();
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                Console.WriteLine("❌ Invalid user ID format");
                return Results.BadRequest(new { error = "Invalid user ID format" });
            }

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
            {
                Console.WriteLine("❌ Company ID not found in JWT");
                return Results.Unauthorized();
            }

            Console.WriteLine($"🔍 Getting round: {id}");
            var roundResponse = await client.From<InterviewRound>().Get();
            var round = roundResponse.Models.FirstOrDefault(r => r.Id == id);

            if (round == null)
            {
                Console.WriteLine("❌ Round not found");
                return Results.NotFound();
            }

            Console.WriteLine($"🔍 Found round: {round.Name} (Template: {round.TemplateId})");

            // Get the template to check company ownership
            Console.WriteLine($"🔍 Checking template ownership for: {round.TemplateId}");
            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == round.TemplateId && t.CompanyId == companyId.Value);

            if (template == null)
            {
                Console.WriteLine("❌ Template not found or access denied");
                return Results.NotFound();
            }

            // Check if round_order is being changed and if it conflicts
            var newRoundOrder = dto.RoundOrder ?? round.RoundOrder;
            if (newRoundOrder != round.RoundOrder)
            {
                // Check if the new round order already exists for this template
                var allRounds = roundResponse.Models.Where(r => r.TemplateId == round.TemplateId && r.Id != id).ToList();
                var conflictingRound = allRounds.FirstOrDefault(r => r.RoundOrder == newRoundOrder);

                if (conflictingRound != null)
                {
                    Console.WriteLine($"⚠️ Round order {newRoundOrder} already exists, will swap with round {conflictingRound.Id}");

                    // Temporarily set the conflicting round to a high number to avoid constraint violation
                    var tempRoundOrder = allRounds.Max(r => r.RoundOrder) + 1000;
                    var tempRound = new InterviewRound
                    {
                        Id = conflictingRound.Id,
                        TemplateId = conflictingRound.TemplateId,
                        Name = conflictingRound.Name,
                        Type = conflictingRound.Type,
                        Duration = conflictingRound.Duration,
                        RoundOrder = tempRoundOrder, // Temporary high value
                        Requirements = conflictingRound.Requirements,
                        Interviewers = conflictingRound.Interviewers,
                        IsOptional = conflictingRound.IsOptional,
                        PassingCriteria = conflictingRound.PassingCriteria,
                        Description = conflictingRound.Description,
                        CreatedAt = conflictingRound.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await client.From<InterviewRound>().Delete(conflictingRound);
                    await client.From<InterviewRound>().Insert(tempRound);
                    Console.WriteLine($"✅ Temporarily moved conflicting round to order {tempRoundOrder}");
                }
            }

            Console.WriteLine($"🔄 Updating round: {id}");
            // Create updated round object with new values
            var updatedRound = new InterviewRound
            {
                Id = id,
                TemplateId = round.TemplateId,
                Name = !string.IsNullOrEmpty(dto.Name) ? dto.Name : round.Name,
                Type = !string.IsNullOrEmpty(dto.Type) ? dto.Type : round.Type,
                Duration = dto.Duration ?? round.Duration,
                RoundOrder = newRoundOrder,
                Requirements = dto.Requirements?.ToArray() ?? round.Requirements ?? new string[0],
                Interviewers = dto.Interviewers?.ToArray() ?? round.Interviewers ?? new string[0],
                IsOptional = dto.IsOptional ?? round.IsOptional,
                PassingCriteria = dto.PassingCriteria ?? round.PassingCriteria,
                Description = dto.Description ?? round.Description,
                CreatedAt = round.CreatedAt,
                UpdatedAt = DateTime.UtcNow
            };

            Console.WriteLine($"   - Template ID: {updatedRound.TemplateId}");
            Console.WriteLine($"   - Round Order: {updatedRound.RoundOrder}");
            Console.WriteLine($"   - Type: {updatedRound.Type}");

            // Delete and insert the updated round
            await client.From<InterviewRound>().Delete(round);
            await client.From<InterviewRound>().Insert(updatedRound);
            Console.WriteLine($"✅ Round updated successfully: {id}");

            // If we had a conflicting round, now move it to the old position
            if (newRoundOrder != round.RoundOrder)
            {
                var tempRoundOrder = newRoundOrder + 1000;
                var tempRoundCheck = await client.From<InterviewRound>().Get();
                var tempRoundExists = tempRoundCheck.Models.FirstOrDefault(r => r.RoundOrder == tempRoundOrder && r.TemplateId == round.TemplateId);

                if (tempRoundExists != null)
                {
                    Console.WriteLine($"🔄 Moving temporary round back to order {round.RoundOrder}");
                    var finalRound = new InterviewRound
                    {
                        Id = tempRoundExists.Id,
                        TemplateId = tempRoundExists.TemplateId,
                        Name = tempRoundExists.Name,
                        Type = tempRoundExists.Type,
                        Duration = tempRoundExists.Duration,
                        RoundOrder = round.RoundOrder, // Move to the old position
                        Requirements = tempRoundExists.Requirements,
                        Interviewers = tempRoundExists.Interviewers,
                        IsOptional = tempRoundExists.IsOptional,
                        PassingCriteria = tempRoundExists.PassingCriteria,
                        Description = tempRoundExists.Description,
                        CreatedAt = tempRoundExists.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await client.From<InterviewRound>().Delete(tempRoundExists);
                    await client.From<InterviewRound>().Insert(finalRound);
                    Console.WriteLine($"✅ Swapped round positions successfully");
                }
            }

            var response = MapRoundToResponseDto(updatedRound);
            Console.WriteLine($"🎉 Update completed for round: {id}");
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in UpdateInterviewRound for {id}: {ex.Message}");
            Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
            return Results.Problem($"Error updating interview round: {ex.Message}");
        }
    }

    private static async Task<IResult> DeleteInterviewRound(
        Guid id,
        Supabase.Client client,
        ClaimsPrincipal user)
    {
        try
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            if (!Guid.TryParse(userId, out var userGuid))
                return Results.BadRequest(new { error = "Invalid user ID format" });

            // Get company ID from JWT metadata
            var companyId = GetUserCompanyId(user);
            if (companyId == null)
                return Results.Unauthorized();

            var roundResponse = await client.From<InterviewRound>().Get();
            var round = roundResponse.Models.FirstOrDefault(r => r.Id == id);

            if (round == null)
                return Results.NotFound();

            // Get the template to check company ownership
            var templateResponse = await client.From<InterviewTemplate>().Get();
            var template = templateResponse.Models.FirstOrDefault(t => t.Id == round.TemplateId && t.CompanyId == companyId.Value);

            if (template == null)
                return Results.NotFound();

            await client.From<InterviewRound>().Delete(round);

            return Results.NoContent();
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting interview round: {ex.Message}");
        }
    }

    // Helper methods for mapping
    private static InterviewTemplateResponseDto MapToResponseDto(InterviewTemplate template, List<InterviewRound> rounds)
    {
        return new InterviewTemplateResponseDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            IsDefault = template.IsDefault,
            CompanyId = template.CompanyId,
            UsageCount = template.UsageCount,
            SuccessRate = template.SuccessRate,
            AverageRating = template.AverageRating,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt,
            CreatedBy = template.CreatedBy,
            Rounds = rounds.Select(MapRoundToResponseDto).ToList()
        };
    }

    private static InterviewRoundResponseDto MapRoundToResponseDto(InterviewRound round)
    {
        return new InterviewRoundResponseDto
        {
            Id = round.Id,
            TemplateId = round.TemplateId,
            Name = round.Name,
            Type = round.Type,
            Duration = round.Duration,
            RoundOrder = round.RoundOrder,
            Requirements = round.Requirements?.ToList() ?? new List<string>(),
            Interviewers = round.Interviewers?.ToList() ?? new List<string>(),
            IsOptional = round.IsOptional,
            PassingCriteria = round.PassingCriteria,
            Description = round.Description,
            CreatedAt = round.CreatedAt,
            UpdatedAt = round.UpdatedAt
        };
    }

    private static Guid? GetUserCompanyId(ClaimsPrincipal user)
    {
        // Check JWT claims for company_id in user_metadata first
        var userMetadataClaim = user.FindFirst("user_metadata")?.Value;
        if (!string.IsNullOrEmpty(userMetadataClaim))
        {
            try
            {
                var userMetadata = JsonDocument.Parse(userMetadataClaim);
                if (userMetadata.RootElement.TryGetProperty("company_id", out var companyIdElement))
                {
                    var companyIdStr = companyIdElement.GetString();
                    if (companyIdStr != null && Guid.TryParse(companyIdStr, out var companyId))
                    {
                        return companyId;
                    }
                }
            }
            catch
            {
                // If parsing fails, continue to fallback
            }
        }

        // Fallback: Check for direct company_id claim
        var companyIdClaim = user.FindFirst("company_id")?.Value;
        if (companyIdClaim != null && Guid.TryParse(companyIdClaim, out var companyIdFromJwt))
        {
            return companyIdFromJwt;
        }

        return null;
    }

    private static Guid? GetMigratedUserId(ClaimsPrincipal user)
    {
        // Check JWT claims for database user ID in user_metadata
        var userMetadataClaim = user.FindFirst("user_metadata")?.Value;
        if (!string.IsNullOrEmpty(userMetadataClaim))
        {
            try
            {
                var userMetadata = JsonDocument.Parse(userMetadataClaim);
                
                // First try database_user_id (for new users)
                if (userMetadata.RootElement.TryGetProperty("database_user_id", out var databaseUserIdElement))
                {
                    var databaseUserIdStr = databaseUserIdElement.GetString();
                    if (databaseUserIdStr != null && Guid.TryParse(databaseUserIdStr, out var databaseUserId))
                    {
                        return databaseUserId;
                    }
                }
                
                // Fallback to migrated_user_id (for migrated users)
                if (userMetadata.RootElement.TryGetProperty("migrated_user_id", out var migratedUserIdElement))
                {
                    var migratedUserIdStr = migratedUserIdElement.GetString();
                    if (migratedUserIdStr != null && Guid.TryParse(migratedUserIdStr, out var migratedUserId))
                    {
                        return migratedUserId;
                    }
                }
            }
            catch
            {
                // If parsing fails, continue to fallback
            }
        }

        // Final fallback: Use the current user ID from NameIdentifier claim
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null && Guid.TryParse(userId, out var userGuid))
        {
            return userGuid;
        }

        return null;
    }
}

// Request DTOs
public class CloneTemplateRequest
{
    public string Name { get; set; } = string.Empty;
}
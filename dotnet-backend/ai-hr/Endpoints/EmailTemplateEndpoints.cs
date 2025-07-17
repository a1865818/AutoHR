using ai_hr.Models;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ai_hr.Endpoints
{
    public static class EmailTemplateEndpoints
    {
        public static void MapEmailTemplateEndpoints(this WebApplication app)
        {
            app.MapGet("/api/email-templates", GetTemplates)
                .WithTags("Email Templates")
                .WithName("GetEmailTemplates")
                .WithSummary("Get email templates for company")
                .RequireAuthorization();

            app.MapPost("/api/email-templates", CreateTemplate)
                .WithTags("Email Templates")
                .WithName("CreateEmailTemplate")
                .WithSummary("Create new email template")
                .RequireAuthorization();

            app.MapPut("/api/email-templates/{id}", UpdateTemplate)
                .WithTags("Email Templates")
                .WithName("UpdateEmailTemplate")
                .WithSummary("Update email template")
                .RequireAuthorization();

            app.MapDelete("/api/email-templates/{id}", DeleteTemplate)
                .WithTags("Email Templates")
                .WithName("DeleteEmailTemplate")
                .WithSummary("Delete email template")
                .RequireAuthorization();
        }

        private static async Task<IResult> GetTemplates(
            [FromServices] Supabase.Client client,
            ClaimsPrincipal user,
            [FromQuery] string? emailType = null)
        {
            try
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userId, out var userGuid))
                    return Results.Unauthorized();

                Console.WriteLine($"🔍 GetTemplates called for user: {userGuid}");

                // Get user's company ID
                var hiringUserResponse = await client.From<HiringUserProfile>().Get();
                var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

                if (hiringUser == null)
                {
                    Console.WriteLine($"❌ Hiring user not found for ID: {userGuid}");
                    return Results.Unauthorized();
                }

                Console.WriteLine($"✅ Found hiring user with company ID: {hiringUser.CompanyId}");

                // Get ALL templates first, then filter by company ID
                var templatesResponse = await client.From<EmailTemplate>().Get();
                var allTemplates = templatesResponse.Models ?? new List<EmailTemplate>();

                Console.WriteLine($"📊 Total templates in database: {allTemplates.Count}");

                // Filter templates for the company
                var companyTemplates = allTemplates
                    .Where(t => t.CompanyId == hiringUser.CompanyId)
                    .OrderByDescending(t => t.CreatedAt)
                    .ToList();

                // Apply email type filter if specified
                if (!string.IsNullOrEmpty(emailType))
                {
                    companyTemplates = companyTemplates
                        .Where(t => t.EmailType == emailType)
                        .ToList();
                    Console.WriteLine($"🔍 Filtered templates by email type '{emailType}': {companyTemplates.Count}");
                }

                Console.WriteLine($"🏢 Templates for company {hiringUser.CompanyId}: {companyTemplates.Count}");

                // Convert to DTOs to avoid serialization issues with Supabase BaseModel
                var templateDtos = companyTemplates.Select(template => new
                {
                    id = template.Id.ToString(),
                    name = template.Name,
                    subject = template.Subject,
                    body = template.Body,
                    emailType = template.EmailType,
                    isDefault = template.IsDefault,
                    createdAt = template.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    updatedAt = template.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }).ToList();

                Console.WriteLine($"✅ Returning {templateDtos.Count} template DTOs");
                return Results.Ok(templateDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 ERROR in GetTemplates: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return Results.BadRequest(new { error = ex.Message });
            }
        }

        private static async Task<IResult> CreateTemplate(
            [FromBody] CreateTemplateRequest request,
            [FromServices] Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userId, out var userGuid))
                    return Results.Unauthorized();

                // Get user's company ID
                var hiringUserResponse = await client.From<HiringUserProfile>().Get();
                var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

                if (hiringUser == null)
                    return Results.Unauthorized();

                var template = new EmailTemplate
                {
                    CompanyId = hiringUser.CompanyId.Value,
                    Name = request.Name,
                    Subject = request.Subject,
                    Body = request.Body,
                    EmailType = request.EmailType,
                    IsDefault = request.IsDefault,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var response = await client.From<EmailTemplate>().Insert(template);
                var createdTemplate = response.Models.FirstOrDefault();

                if (createdTemplate != null)
                {
                    // Return DTO to avoid serialization issues
                    var templateDto = new
                    {
                        id = createdTemplate.Id.ToString(),
                        name = createdTemplate.Name,
                        subject = createdTemplate.Subject,
                        body = createdTemplate.Body,
                        emailType = createdTemplate.EmailType,
                        isDefault = createdTemplate.IsDefault,
                        createdAt = createdTemplate.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                        updatedAt = createdTemplate.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    };
                    return Results.Ok(templateDto);
                }

                return Results.BadRequest(new { error = "Failed to create template" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 ERROR in CreateTemplate: {ex.Message}");
                return Results.BadRequest(new { error = ex.Message });
            }
        }

        private static async Task<IResult> UpdateTemplate(
            string id,
            [FromBody] UpdateTemplateRequest request,
            [FromServices] Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userId, out var userGuid))
                    return Results.Unauthorized();

                if (!Guid.TryParse(id, out var templateId))
                    return Results.BadRequest(new { error = "Invalid template ID" });

                // Get user's company ID
                var hiringUserResponse = await client.From<HiringUserProfile>().Get();
                var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

                if (hiringUser == null)
                    return Results.Unauthorized();

                // Get existing template
                var existingTemplateResponse = await client.From<EmailTemplate>()
                    .Where(t => t.Id == templateId && t.CompanyId == hiringUser.CompanyId)
                    .Get();

                var existingTemplate = existingTemplateResponse.Models.FirstOrDefault();
                if (existingTemplate == null)
                    return Results.NotFound(new { error = "Template not found" });

                // Update template
                existingTemplate.Name = request.Name ?? existingTemplate.Name;
                existingTemplate.Subject = request.Subject ?? existingTemplate.Subject;
                existingTemplate.Body = request.Body ?? existingTemplate.Body;
                existingTemplate.EmailType = request.EmailType ?? existingTemplate.EmailType;
                existingTemplate.IsDefault = request.IsDefault ?? existingTemplate.IsDefault;
                existingTemplate.UpdatedAt = DateTime.UtcNow;

                var updateResponse = await client.From<EmailTemplate>().Update(existingTemplate);
                var updatedTemplate = updateResponse.Models.FirstOrDefault();

                if (updatedTemplate != null)
                {
                    // Return DTO to avoid serialization issues
                    var templateDto = new
                    {
                        id = updatedTemplate.Id.ToString(),
                        name = updatedTemplate.Name,
                        subject = updatedTemplate.Subject,
                        body = updatedTemplate.Body,
                        emailType = updatedTemplate.EmailType,
                        isDefault = updatedTemplate.IsDefault,
                        createdAt = updatedTemplate.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                        updatedAt = updatedTemplate.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    };
                    return Results.Ok(templateDto);
                }

                return Results.BadRequest(new { error = "Failed to update template" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 ERROR in UpdateTemplate: {ex.Message}");
                return Results.BadRequest(new { error = ex.Message });
            }
        }

        private static async Task<IResult> DeleteTemplate(
            string id,
            [FromServices] Supabase.Client client,
            ClaimsPrincipal user)
        {
            try
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userId, out var userGuid))
                    return Results.Unauthorized();

                if (!Guid.TryParse(id, out var templateId))
                    return Results.BadRequest(new { error = "Invalid template ID" });

                // Get user's company ID
                var hiringUserResponse = await client.From<HiringUserProfile>().Get();
                var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

                if (hiringUser == null)
                    return Results.Unauthorized();

                // Delete template
                await client.From<EmailTemplate>()
                    .Where(t => t.Id == templateId && t.CompanyId == hiringUser.CompanyId)
                    .Delete();

                return Results.Ok(new { message = "Template deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 ERROR in DeleteTemplate: {ex.Message}");
                return Results.BadRequest(new { error = ex.Message });
            }
        }
    }

    public class CreateTemplateRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string EmailType { get; set; } = "Reject"; // "Reject" or "Success"
        public bool IsDefault { get; set; } = false;
    }

    public class UpdateTemplateRequest
    {
        public string? Name { get; set; }
        public string? Subject { get; set; }
        public string? Body { get; set; }
        public string? EmailType { get; set; }
        public bool? IsDefault { get; set; }
    }
}
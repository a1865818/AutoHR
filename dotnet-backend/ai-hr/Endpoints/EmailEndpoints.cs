using ai_hr.Models;
using ai_hr.Services;
using Supabase;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ai_hr.Endpoints;

public static class EmailEndpoints
{
    public static void MapEmailEndpoints(this WebApplication app)
    {
        app.MapPost("/api/emails/bulk-rejection", SendBulkRejectionEmails)
            .WithTags("Emails")
            .WithName("SendBulkRejectionEmails")
            .WithSummary("Send bulk rejection emails via Gmail")
            .WithDescription("Sends personalized rejection emails to multiple candidates using Gmail API")
            .RequireAuthorization();

        app.MapPost("/api/emails/bulk-success", SendBulkSuccessEmails)
            .WithTags("Emails")
            .WithName("SendBulkSuccessEmails")
            .WithSummary("Send bulk success notification emails via Gmail")
            .WithDescription("Sends personalized success/advancement emails to multiple candidates using Gmail API")
            .RequireAuthorization();

        app.MapPost("/api/emails/team-invitation", SendTeamInvitationEmail)
            .WithTags("Emails")
            .WithName("SendTeamInvitationEmail")
            .WithSummary("Send team invitation email via Gmail")
            .WithDescription("Sends team invitation email to a potential team member using Gmail API")
            .RequireAuthorization();
    }

    private static async Task<IResult> SendTeamInvitationEmail(
        [FromBody] TeamInvitationEmailRequest request,
        [FromServices] Supabase.Client client,
        [FromServices] IGmailService gmailService,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"📧 Processing team invitation email request for {request.Email}");

            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            // Get hiring user and company info
            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null)
            {
                return Results.Unauthorized();
            }

            var companyResponse = await client.From<Company>().Get();
            var company = companyResponse.Models.FirstOrDefault(c => c.Id == hiringUser.CompanyId);

            if (company == null)
            {
                return Results.BadRequest(new { error = "Company not found" });
            }

            // Validate request
            if (string.IsNullOrEmpty(request.Email))
            {
                return Results.BadRequest(new { error = "Email address is required" });
            }

            if (string.IsNullOrEmpty(request.Subject) || string.IsNullOrEmpty(request.Body))
            {
                return Results.BadRequest(new { error = "Subject and body are required" });
            }

            // Send the email using Gmail service
            var emailResult = await gmailService.SendEmailAsync(
                userId,
                request.Email,
                request.Email, // Use email as name for team invitations
                request.Subject,
                request.Body
            );

            if (emailResult.Success)
            {
                Console.WriteLine($"✅ Team invitation email sent successfully to {request.Email}");
                return Results.Ok(new
                {
                    success = true,
                    messageId = emailResult.MessageId,
                    sentAt = emailResult.SentAt
                });
            }
            else
            {
                Console.WriteLine($"❌ Failed to send team invitation email to {request.Email}: {emailResult.ErrorMessage}");
                return Results.BadRequest(new
                {
                    success = false,
                    error = emailResult.ErrorMessage
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error sending team invitation email: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message });
        }
    }

    private static async Task<IResult> SendBulkRejectionEmails(
        [FromBody] BulkEmailRequest request,
        [FromServices] Supabase.Client client,
        [FromServices] IGmailService gmailService,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"📧 Processing bulk email request for {request.CandidateIds.Count} candidates");

            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            // Get hiring user and company info
            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null)
            {
                return Results.Unauthorized();
            }

            var companyResponse = await client.From<Company>().Get();
            var company = companyResponse.Models.FirstOrDefault(c => c.Id == hiringUser.CompanyId);

            if (company == null)
            {
                return Results.BadRequest(new { error = "Company not found" });
            }

            // Parse candidate IDs
            var candidateIds = request.CandidateIds
                .Where(id => Guid.TryParse(id, out _))
                .Select(Guid.Parse)
                .ToList();

            if (candidateIds.Count == 0)
            {
                return Results.BadRequest(new { error = "No valid candidate IDs provided" });
            }

            // Get candidate applications
            var applicationsResponse = await client.From<ApplicationDetail>().Get();
            var candidateApplications = applicationsResponse.Models
                .Where(app => candidateIds.Contains(app.Id))
                .ToList();

            if (candidateApplications.Count == 0)
            {
                return Results.BadRequest(new { error = "No applications found for provided candidate IDs" });
            }

            // Get unique user IDs and job IDs
            var userIds = candidateApplications.Select(app => app.CandidateUserId).Distinct().ToList();
            var jobIds = candidateApplications.Select(app => app.JobId).Distinct().ToList();

            // Fetch users and jobs
            var usersResponse = await client.From<ApplicationUser>().Get();
            var users = usersResponse.Models.Where(u => userIds.Contains(Guid.Parse(u.Id))).ToDictionary(u => Guid.Parse(u.Id), u => u);

            var jobsResponse = await client.From<Job>().Get();
            var jobs = jobsResponse.Models.Where(j => jobIds.Contains(j.Id)).ToDictionary(j => j.Id, j => j);

            // Get email template if specified
            EmailTemplate? template = null;
            if (!string.IsNullOrEmpty(request.TemplateId) && Guid.TryParse(request.TemplateId, out var templateId))
            {
                var templateResponse = await client.From<EmailTemplate>()
                    .Where(t => t.Id == templateId && t.CompanyId == hiringUser.CompanyId.Value)
                    .Get();
                template = templateResponse.Models.FirstOrDefault();
            }

            // Prepare email recipients
            var recipients = new List<EmailRecipient>();
            var candidateMap = new Dictionary<string, ApplicationDetail>();

            foreach (var application in candidateApplications)
            {
                if (users.TryGetValue(application.CandidateUserId, out var candidateUser) &&
                    jobs.TryGetValue(application.JobId, out var job))
                {
                    var variables = new Dictionary<string, string>
                    {
                        { "candidateName", candidateUser.FirstName + " " + candidateUser.LastName },
                        { "jobTitle", job.Title },
                        { "companyName", company.Name }
                    };

                    var recipient = new EmailRecipient
                    {
                        Email = candidateUser.Email,
                        Name = candidateUser.FirstName + " " + candidateUser.LastName,
                        Variables = variables
                    };

                    recipients.Add(recipient);
                    candidateMap[candidateUser.Email] = application;
                }
            }

            if (recipients.Count == 0)
            {
                return Results.BadRequest(new { error = "No valid candidates found for email sending" });
            }

            // Determine subject and body
            var subject = template?.Subject ?? request.CustomSubject ?? "Thank you for your interest in {{jobTitle}}";
            var body = template?.Body ?? request.CustomBody ?? GetDefaultEmailTemplate();

            // Send bulk emails using Gmail service
            var gmailResult = await gmailService.SendBulkEmailsAsync(userId, recipients, subject, body);

            // Save email history
            var emailHistoryRecords = new List<EmailHistory>();
            for (int i = 0; i < recipients.Count; i++)
            {
                var recipient = recipients[i];
                var gmailSendResult = i < gmailResult.Results.Count ? gmailResult.Results[i] : null;
                var application = candidateMap.ContainsKey(recipient.Email) ? candidateMap[recipient.Email] : null;

                if (application != null)
                {
                    var emailHistory = new EmailHistory
                    {
                        Id = Guid.NewGuid(),
                        ApplicationId = application.Id,
                        TemplateId = template?.Id,
                        Subject = ReplaceVariables(subject, recipient.Variables),
                        Body = ReplaceVariables(body, recipient.Variables),
                        SentAt = DateTime.UtcNow,
                        Status = gmailSendResult?.Success == true ? "sent" : "failed"
                    };

                    emailHistoryRecords.Add(emailHistory);
                }
            }

            // Insert email history records
            if (emailHistoryRecords.Any())
            {
                await client.From<EmailHistory>().Insert(emailHistoryRecords);
            }

            return Results.Ok(new BulkEmailResponse
            {
                Success = gmailResult.Success,
                TotalSent = gmailResult.TotalSent,
                TotalFailed = gmailResult.TotalFailed,
                Results = recipients.Select((recipient, index) =>
                {
                    var gmailSendResult = index < gmailResult.Results.Count ? gmailResult.Results[index] : null;
                    var application = candidateMap.ContainsKey(recipient.Email) ? candidateMap[recipient.Email] : null;

                    return new EmailSendResult
                    {
                        CandidateId = application?.Id.ToString() ?? "",
                        CandidateName = recipient.Name,
                        Email = recipient.Email,
                        Status = gmailSendResult?.Success == true ? "sent" : "failed",
                        SentAt = gmailSendResult?.Success == true ? gmailSendResult.SentAt.ToString("yyyy-MM-ddTHH:mm:ssZ") : null,
                        Error = gmailSendResult?.ErrorMessage
                    };
                }).ToList()
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"💥 ERROR in SendBulkRejectionEmails: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message });
        }
    }

    private static async Task<IResult> SendBulkSuccessEmails(
        [FromBody] BulkEmailRequest request,
        [FromServices] Supabase.Client client,
        [FromServices] IGmailService gmailService,
        ClaimsPrincipal user)
    {
        try
        {
            Console.WriteLine($"📧 Processing bulk success email request for {request.CandidateIds.Count} candidates");

            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Results.Unauthorized();
            }

            // Get hiring user and company info
            var hiringUserResponse = await client.From<HiringUserProfile>().Get();
            var hiringUser = hiringUserResponse.Models.FirstOrDefault(hu => hu.Id == userGuid);

            if (hiringUser == null)
            {
                return Results.Unauthorized();
            }

            var companyResponse = await client.From<Company>().Get();
            var company = companyResponse.Models.FirstOrDefault(c => c.Id == hiringUser.CompanyId);

            if (company == null)
            {
                return Results.BadRequest(new { error = "Company not found" });
            }

            // Parse candidate IDs
            var candidateIds = request.CandidateIds
                .Where(id => Guid.TryParse(id, out _))
                .Select(Guid.Parse)
                .ToList();

            if (candidateIds.Count == 0)
            {
                return Results.BadRequest(new { error = "No valid candidate IDs provided" });
            }

            // Get candidate applications
            var applicationsResponse = await client.From<ApplicationDetail>().Get();
            var candidateApplications = applicationsResponse.Models
                .Where(app => candidateIds.Contains(app.Id))
                .ToList();

            if (candidateApplications.Count == 0)
            {
                return Results.BadRequest(new { error = "No applications found for provided candidate IDs" });
            }

            // Get unique user IDs and job IDs
            var userIds = candidateApplications.Select(app => app.CandidateUserId).Distinct().ToList();
            var jobIds = candidateApplications.Select(app => app.JobId).Distinct().ToList();

            // Fetch users and jobs
            var usersResponse = await client.From<ApplicationUser>().Get();
            var users = usersResponse.Models.Where(u => userIds.Contains(Guid.Parse(u.Id))).ToDictionary(u => Guid.Parse(u.Id), u => u);

            var jobsResponse = await client.From<Job>().Get();
            var jobs = jobsResponse.Models.Where(j => jobIds.Contains(j.Id)).ToDictionary(j => j.Id, j => j);

            // Get email template if specified
            EmailTemplate? template = null;
            if (!string.IsNullOrEmpty(request.TemplateId) && Guid.TryParse(request.TemplateId, out var templateId))
            {
                var templateResponse = await client.From<EmailTemplate>()
                    .Where(t => t.Id == templateId && t.CompanyId == hiringUser.CompanyId.Value)
                    .Get();
                template = templateResponse.Models.FirstOrDefault();
            }

            // Prepare email recipients
            var recipients = new List<EmailRecipient>();
            var candidateMap = new Dictionary<string, ApplicationDetail>();

            foreach (var application in candidateApplications)
            {
                if (users.TryGetValue(application.CandidateUserId, out var candidateUser) &&
                    jobs.TryGetValue(application.JobId, out var job))
                {
                    var variables = new Dictionary<string, string>
                    {
                        { "candidateName", candidateUser.FirstName + " " + candidateUser.LastName },
                        { "jobTitle", job.Title },
                        { "companyName", company.Name }
                    };

                    recipients.Add(new EmailRecipient
                    {
                        Email = candidateUser.Email,
                        Name = candidateUser.FirstName + " " + candidateUser.LastName,
                        Variables = variables
                    });

                    candidateMap[application.Id.ToString()] = application;
                }
            }

            if (!recipients.Any())
            {
                return Results.BadRequest(new { error = "No valid candidates found for email sending" });
            }

            // Determine subject and body
            var subject = !string.IsNullOrEmpty(request.CustomSubject)
                ? request.CustomSubject
                : template?.Subject ?? "Congratulations on your application progress!";

            var body = !string.IsNullOrEmpty(request.CustomBody)
                ? request.CustomBody
                : template?.Body ?? GetDefaultSuccessTemplate();

            // Send emails one by one to track individual results
            var emailResults = new List<EmailSendResult>();
            int sentCount = 0;
            int failedCount = 0;

            foreach (var recipient in recipients)
            {
                try
                {
                    var personalizedSubject = ReplaceVariables(subject, recipient.Variables);
                    var personalizedBody = ReplaceVariables(body, recipient.Variables);

                    // Send individual email
                    var emailResult = await gmailService.SendEmailAsync(userId, recipient.Email, recipient.Name, personalizedSubject, personalizedBody);
                    bool isEmailSent = emailResult.Success;

                    // Save email history
                    var application = candidateMap.Values.FirstOrDefault(c => users[c.CandidateUserId].Email == recipient.Email);
                    if (application != null)
                    {
                        var emailHistory = new EmailHistory
                        {
                            Id = Guid.NewGuid(),
                            ApplicationId = application.Id,
                            TemplateId = template?.Id,
                            Subject = personalizedSubject,
                            Body = personalizedBody,
                            SentAt = DateTime.UtcNow,
                            Status = isEmailSent ? "sent" : "failed"
                        };

                        await client.From<EmailHistory>().Insert(emailHistory);
                    }

                    if (isEmailSent)
                    {
                        sentCount++;
                        emailResults.Add(new EmailSendResult
                        {
                            CandidateId = candidateMap.Values.FirstOrDefault(c => users[c.CandidateUserId].Email == recipient.Email)?.Id.ToString() ?? "",
                            CandidateName = recipient.Name,
                            Email = recipient.Email,
                            Status = "sent",
                            SentAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                        });
                    }
                    else
                    {
                        failedCount++;
                        emailResults.Add(new EmailSendResult
                        {
                            CandidateId = candidateMap.Values.FirstOrDefault(c => users[c.CandidateUserId].Email == recipient.Email)?.Id.ToString() ?? "",
                            CandidateName = recipient.Name,
                            Email = recipient.Email,
                            Status = "failed",
                            Error = "Failed to send email"
                        });
                    }

                    // Small delay between emails to avoid rate limiting
                    await Task.Delay(100);
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"💥 ERROR sending email to {recipient.Email}: {emailEx.Message}");
                    failedCount++;
                    emailResults.Add(new EmailSendResult
                    {
                        CandidateId = candidateMap.Values.FirstOrDefault(c => users[c.CandidateUserId].Email == recipient.Email)?.Id.ToString() ?? "",
                        CandidateName = recipient.Name,
                        Email = recipient.Email,
                        Status = "failed",
                        Error = emailEx.Message
                    });
                }
            }

            Console.WriteLine($"✅ Success email sending completed. Sent: {sentCount}, Failed: {failedCount}");

            return Results.Ok(new BulkEmailResponse
            {
                Success = sentCount > 0,
                TotalSent = sentCount,
                TotalFailed = failedCount,
                Results = emailResults
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"💥 ERROR in SendBulkSuccessEmails: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message });
        }
    }

    // Helper methods
    private static string GetDefaultEmailTemplate()
    {
        return @"Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at {{companyName}}.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate the time you invested in the application process and encourage you to apply for future opportunities that may be a better fit.

We wish you the best in your job search.

Best regards,
{{companyName}} Hiring Team";
    }

    private static string GetDefaultSuccessTemplate()
    {
        return @"Dear {{candidateName}},

Congratulations! We are pleased to inform you that your application for the {{jobTitle}} position at {{companyName}} has been successful in advancing to the next stage of our hiring process.

We were impressed with your qualifications and experience, and we would like to continue the conversation about this opportunity.

We will be in touch soon with details about the next steps in the process.

Thank you for your continued interest in joining our team.

Best regards,
{{companyName}} Hiring Team";
    }

    private static string ReplaceVariables(string text, Dictionary<string, string> variables)
    {
        if (string.IsNullOrEmpty(text) || variables == null)
            return text;

        var result = text;
        foreach (var variable in variables)
        {
            result = result.Replace($"{{{{{variable.Key}}}}}", variable.Value);
        }
        return result;
    }
}

// Request/Response models
public class TeamInvitationEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

public class BulkEmailRequest
{
    public List<string> CandidateIds { get; set; } = new();
    public string? TemplateId { get; set; }
    public string? CustomSubject { get; set; }
    public string? CustomBody { get; set; }
    public bool SendImmediately { get; set; } = true;
    public string? ScheduledAt { get; set; }
}

public class EmailSendResult
{
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "sent", "failed", "pending"
    public string? SentAt { get; set; }
    public string? Error { get; set; }
}

public class BulkEmailResponse
{
    public bool Success { get; set; }
    public int TotalSent { get; set; }
    public int TotalFailed { get; set; }
    public List<EmailSendResult> Results { get; set; } = new();
}

public class EmailTemplateResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}
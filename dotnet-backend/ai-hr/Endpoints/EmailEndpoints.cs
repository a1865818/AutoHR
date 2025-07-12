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

            // Get candidate applications
            var applicationsResponse = await client.From<ApplicationDetail>().Get();

            // Convert candidateIds to Guids for filtering
            var candidateGuids = new List<Guid>();
            foreach (var candidateId in request.CandidateIds)
            {
                if (Guid.TryParse(candidateId, out var guid))
                {
                    candidateGuids.Add(guid);
                }
            }

            var candidateApplications = applicationsResponse.Models
                .Where(a => candidateGuids.Contains(a.Id))
                .ToList();

            // Get candidate user details
            var usersResponse = await client.From<ApplicationUser>().Get();
            var users = usersResponse.Models.ToDictionary(u => u.Id, u => u);

            // Get job details
            var jobsResponse = await client.From<Job>().Get();
            var jobs = jobsResponse.Models.ToDictionary(j => j.Id, j => j);

            // Check if user has Gmail authorization
            var isAuthorized = await gmailService.IsUserAuthorizedAsync(userId);
            if (!isAuthorized)
            {
                return Results.BadRequest(new { error = "Gmail authorization required. Please authorize Gmail access first." });
            }

            // Get email template if specified
            EmailTemplate? template = null;
            if (!string.IsNullOrEmpty(request.TemplateId))
            {
                if (Guid.TryParse(request.TemplateId, out var templateGuid))
                {
                    var templateResponse = await client.From<EmailTemplate>()
                        .Where(t => t.CompanyId == hiringUser.CompanyId)
                        .Get();
                    template = templateResponse.Models.FirstOrDefault(t => t.Id == templateGuid);
                }
            }

            // Prepare email recipients
            var recipients = new List<EmailRecipient>();
            var candidateMap = new Dictionary<string, ApplicationDetail>();

            foreach (var application in candidateApplications)
            {
                var candidateUser = users.ContainsKey(application.CandidateUserId.ToString())
                    ? users[application.CandidateUserId.ToString()]
                    : null;

                var job = jobs.ContainsKey(application.JobId)
                    ? jobs[application.JobId]
                    : null;

                if (candidateUser != null && job != null)
                {
                    var recipient = new EmailRecipient
                    {
                        Email = candidateUser.Email,
                        Name = $"{candidateUser.FirstName} {candidateUser.LastName}",
                        Variables = new Dictionary<string, string>
                        {
                            ["candidateName"] = $"{candidateUser.FirstName} {candidateUser.LastName}",
                            ["jobTitle"] = job.Title,
                            ["companyName"] = company.Name,
                            ["rejectionReason"] = application.RejectionReason ?? "Not specified"
                        }
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
                    var historyRecord = new EmailHistory
                    {
                        ApplicationId = application.Id,
                        TemplateId = template?.Id,
                        SentAt = DateTime.UtcNow,
                        Status = gmailSendResult?.Success == true ? "sent" : "failed",
                        Subject = ReplaceVariables(subject, recipient.Variables),
                        Body = ReplaceVariables(body, recipient.Variables)
                    };
                    emailHistoryRecords.Add(historyRecord);
                }
            }

            // Insert email history records
            if (emailHistoryRecords.Any())
            {
                await client.From<EmailHistory>().Insert(emailHistoryRecords);
            }

            // Convert Gmail results to API response format
            var results = new List<EmailSendResult>();
            for (int i = 0; i < recipients.Count; i++)
            {
                var recipient = recipients[i];
                var gmailSendResult = i < gmailResult.Results.Count ? gmailResult.Results[i] : null;
                var application = candidateMap.ContainsKey(recipient.Email) ? candidateMap[recipient.Email] : null;

                results.Add(new EmailSendResult
                {
                    CandidateId = application?.Id.ToString() ?? "",
                    CandidateName = recipient.Name,
                    Email = recipient.Email,
                    Status = gmailSendResult?.Success == true ? "sent" : "failed",
                    SentAt = gmailSendResult?.SentAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    Error = gmailSendResult?.ErrorMessage
                });
            }

            var response = new BulkEmailResponse
            {
                Success = results.All(r => r.Status == "sent"),
                TotalSent = results.Count(r => r.Status == "sent"),
                TotalFailed = results.Count(r => r.Status == "failed"),
                Results = results
            };

            Console.WriteLine($"📧 Bulk email completed: {response.TotalSent} sent, {response.TotalFailed} failed");

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"💥 ERROR in SendBulkRejectionEmails: {ex.Message}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }
    private static async Task<List<EmailTemplate>> CreateDefaultTemplates(Supabase.Client client, Guid companyId)
    {
        var defaultTemplates = new List<EmailTemplate>
        {
            new EmailTemplate
            {
                CompanyId = companyId,
                Name = "Professional Rejection",
                Subject = "Thank you for your interest in {{jobTitle}}",
                Body = GetDefaultEmailTemplate(),
                IsDefault = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EmailTemplate
            {
                CompanyId = companyId,
                Name = "Skills-Based Rejection",
                Subject = "Update on your {{jobTitle}} application",
                Body = @"Dear {{candidateName}},

Thank you for applying for the {{jobTitle}} position at {{companyName}}. While we were impressed with your background, we have decided to move forward with candidates whose skills more closely match our specific requirements for this role.

We encourage you to apply for future opportunities that may be a better fit for your qualifications.

Best regards,
{{companyName}} Hiring Team",
                IsDefault = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        var response = await client.From<EmailTemplate>().Insert(defaultTemplates);
        return response.Models.ToList();
    }

    private static string ReplaceVariables(string content, Dictionary<string, string> variables)
    {
        foreach (var variable in variables)
        {
            content = content.Replace($"{{{{{variable.Key}}}}}", variable.Value);
        }
        return content;
    }

    private static async Task SimulateEmailSending(string email, string subject, string body)
    {
        // Simulate email sending delay
        await Task.Delay(100);

        // In a real implementation, you would integrate with an email service like:
        // - SendGrid
        // - Amazon SES
        // - Mailgun
        // - Azure Communication Services

        Console.WriteLine($"📧 [SIMULATED] Email sent to: {email}");
        Console.WriteLine($"📧 [SIMULATED] Subject: {subject}");
        Console.WriteLine($"📧 [SIMULATED] Body preview: {body.Substring(0, Math.Min(100, body.Length))}...");
    }

    private static string GetDefaultEmailTemplate()
    {
        return @"Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at {{companyName}}. After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs.

We appreciate the time you took to apply and wish you the best in your job search.

Best regards,
{{companyName}} Hiring Team";
    }
}

// Request/Response models
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
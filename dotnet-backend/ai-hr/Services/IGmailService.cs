using ai_hr.Models;

namespace ai_hr.Services
{
    public interface IGmailService
    {
        Task<string> GetAuthorizationUrlAsync(string userId, string redirectUri);
        Task<bool> HandleAuthCallbackAsync(string userId, string code, string redirectUri);
        Task<GmailSendResult> SendEmailAsync(string userId, string to, string toName, string subject, string body);
        Task<GmailBulkSendResult> SendBulkEmailsAsync(string userId, List<EmailRecipient> recipients, string subject, string body);
        Task<bool> IsUserAuthorizedAsync(string userId);
        Task RevokeAuthorizationAsync(string userId);
    }

    public class EmailRecipient
    {
        public string Email { get; set; }
        public string Name { get; set; }
        public Dictionary<string, string> Variables { get; set; } = new();
    }

    public class GmailSendResult
    {
        public bool Success { get; set; }
        public string? MessageId { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime SentAt { get; set; }
    }

    public class GmailBulkSendResult
    {
        public bool Success { get; set; }
        public int TotalSent { get; set; }
        public int TotalFailed { get; set; }
        public List<GmailSendResult> Results { get; set; } = new();
        public TimeSpan TotalTime { get; set; }
    }
}
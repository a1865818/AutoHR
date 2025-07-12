using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Gmail.v1;
using Google.Apis.Gmail.v1.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using System.Text;
using System.Net.Mime;
using ai_hr.Models;

namespace ai_hr.Services
{
    public class GmailApiService : IGmailService
    {
        private readonly ILogger<GmailApiService> _logger;
        private readonly IConfiguration _configuration;
        private readonly GoogleAuthorizationCodeFlow _authFlow;
        private readonly string _clientId;
        private readonly string _clientSecret;

        // Gmail API rate limits
        private const int MAX_EMAILS_PER_MINUTE = 150; // 15,000 quota units ÷ 100 units per email
        private const int BATCH_SIZE = 50; // Process in batches of 50
        private const int BATCH_DELAY_MS = 2000; // 2 seconds between batches

        public GmailApiService(ILogger<GmailApiService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? throw new InvalidOperationException("GOOGLE_CLIENT_ID environment variable not configured");
            _clientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET") ?? throw new InvalidOperationException("GOOGLE_CLIENT_SECRET environment variable not configured");
            
            _logger.LogInformation("Gmail service initialized with ClientId: {ClientId}", _clientId?.Substring(0, 10) + "...");

            _authFlow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = _clientId,
                    ClientSecret = _clientSecret
                },
                Scopes = new[] { GmailService.Scope.GmailSend, GmailService.Scope.GmailCompose },
                DataStore = new FileDataStore("GmailAuth", true)
            });
        }

        public async Task<string> GetAuthorizationUrlAsync(string userId, string redirectUri)
        {
            try
            {
                var authorizationUrl = _authFlow.CreateAuthorizationCodeRequest(redirectUri);
                authorizationUrl.State = userId; // Store user ID in state parameter

                return authorizationUrl.Build().ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create authorization URL for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> HandleAuthCallbackAsync(string userId, string code, string redirectUri)
        {
            try
            {
                var token = await _authFlow.ExchangeCodeForTokenAsync(userId, code, redirectUri, CancellationToken.None);

                // Test the token by creating a service and getting user profile
                var credential = new UserCredential(_authFlow, userId, token);
                var service = new GmailService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "AutoHR"
                });

                var profile = await service.Users.GetProfile("me").ExecuteAsync();

                _logger.LogInformation("Successfully authorized Gmail access for user {UserId}, email: {Email}",
                    userId, profile.EmailAddress);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to handle auth callback for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> IsUserAuthorizedAsync(string userId)
        {
            try
            {
                var token = await _authFlow.LoadTokenAsync(userId, CancellationToken.None);
                return token != null;
            }
            catch
            {
                return false;
            }
        }

        public async Task RevokeAuthorizationAsync(string userId)
        {
            try
            {
                await _authFlow.DeleteTokenAsync(userId, CancellationToken.None);
                _logger.LogInformation("Revoked Gmail authorization for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to revoke authorization for user {UserId}", userId);
                throw;
            }
        }

        public async Task<GmailSendResult> SendEmailAsync(string userId, string to, string toName, string subject, string body)
        {
            try
            {
                var service = await CreateGmailServiceAsync(userId);
                if (service == null)
                {
                    return new GmailSendResult
                    {
                        Success = false,
                        ErrorMessage = "User not authorized for Gmail access"
                    };
                }

                var message = CreateEmailMessage(to, toName, subject, body);
                var result = await service.Users.Messages.Send(message, "me").ExecuteAsync();

                return new GmailSendResult
                {
                    Success = true,
                    MessageId = result.Id,
                    SentAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To} for user {UserId}", to, userId);
                return new GmailSendResult
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    SentAt = DateTime.UtcNow
                };
            }
        }

        public async Task<GmailBulkSendResult> SendBulkEmailsAsync(string userId, List<EmailRecipient> recipients, string subject, string body)
        {
            var startTime = DateTime.UtcNow;
            var results = new List<GmailSendResult>();

            try
            {
                var service = await CreateGmailServiceAsync(userId);
                if (service == null)
                {
                    return new GmailBulkSendResult
                    {
                        Success = false,
                        TotalFailed = recipients.Count,
                        Results = recipients.Select(r => new GmailSendResult
                        {
                            Success = false,
                            ErrorMessage = "User not authorized for Gmail access"
                        }).ToList()
                    };
                }

                _logger.LogInformation("Starting bulk email send for {Count} recipients for user {UserId}",
                    recipients.Count, userId);

                // Process recipients in batches to respect rate limits
                var batches = recipients.Chunk(BATCH_SIZE).ToList();

                for (int batchIndex = 0; batchIndex < batches.Count; batchIndex++)
                {
                    var batch = batches[batchIndex];
                    var batchResults = await ProcessBatchAsync(service, batch, subject, body);
                    results.AddRange(batchResults);

                    _logger.LogInformation("Processed batch {BatchIndex}/{TotalBatches} - {Sent} sent, {Failed} failed",
                        batchIndex + 1, batches.Count,
                        batchResults.Count(r => r.Success),
                        batchResults.Count(r => !r.Success));

                    // Add delay between batches to avoid rate limiting (except for the last batch)
                    if (batchIndex < batches.Count - 1)
                    {
                        await Task.Delay(BATCH_DELAY_MS);
                    }
                }

                var totalTime = DateTime.UtcNow - startTime;
                var successCount = results.Count(r => r.Success);
                var failureCount = results.Count(r => !r.Success);

                _logger.LogInformation("Bulk email send completed for user {UserId} - {Sent} sent, {Failed} failed in {TotalTime}ms",
                    userId, successCount, failureCount, totalTime.TotalMilliseconds);

                return new GmailBulkSendResult
                {
                    Success = successCount > 0,
                    TotalSent = successCount,
                    TotalFailed = failureCount,
                    Results = results,
                    TotalTime = totalTime
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send bulk emails for user {UserId}", userId);

                // Return partial results if any were successful
                var successCount = results.Count(r => r.Success);
                var remainingCount = recipients.Count - results.Count;

                // Add failed results for remaining recipients
                for (int i = 0; i < remainingCount; i++)
                {
                    results.Add(new GmailSendResult
                    {
                        Success = false,
                        ErrorMessage = ex.Message,
                        SentAt = DateTime.UtcNow
                    });
                }

                return new GmailBulkSendResult
                {
                    Success = successCount > 0,
                    TotalSent = successCount,
                    TotalFailed = recipients.Count - successCount,
                    Results = results,
                    TotalTime = DateTime.UtcNow - startTime
                };
            }
        }

        private async Task<List<GmailSendResult>> ProcessBatchAsync(GmailService service, EmailRecipient[] batch, string subject, string body)
        {
            var results = new List<GmailSendResult>();

            // Process each email in the batch with a small delay to avoid overwhelming the API
            foreach (var recipient in batch)
            {
                try
                {
                    // Replace variables in subject and body
                    var personalizedSubject = ReplaceVariables(subject, recipient.Variables);
                    var personalizedBody = ReplaceVariables(body, recipient.Variables);

                    var message = CreateEmailMessage(recipient.Email, recipient.Name, personalizedSubject, personalizedBody);
                    var result = await service.Users.Messages.Send(message, "me").ExecuteAsync();

                    results.Add(new GmailSendResult
                    {
                        Success = true,
                        MessageId = result.Id,
                        SentAt = DateTime.UtcNow
                    });

                    // Small delay between individual emails within a batch
                    await Task.Delay(100);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send email to {Email} in batch", recipient.Email);
                    results.Add(new GmailSendResult
                    {
                        Success = false,
                        ErrorMessage = ex.Message,
                        SentAt = DateTime.UtcNow
                    });
                }
            }

            return results;
        }

        private async Task<GmailService?> CreateGmailServiceAsync(string userId)
        {
            try
            {
                var token = await _authFlow.LoadTokenAsync(userId, CancellationToken.None);
                if (token == null)
                {
                    return null;
                }

                var credential = new UserCredential(_authFlow, userId, token);

                return new GmailService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "AutoHR"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create Gmail service for user {UserId}", userId);
                return null;
            }
        }

        private Message CreateEmailMessage(string to, string toName, string subject, string body)
        {
            var message = new MimeKit.MimeMessage();
            message.From.Add(new MimeKit.MailboxAddress("HR Team", "me")); // Gmail API uses "me" as sender
            message.To.Add(new MimeKit.MailboxAddress(toName, to));
            message.Subject = subject;
            message.Body = new MimeKit.TextPart("html") { Text = body };

            using var stream = new MemoryStream();
            message.WriteTo(stream);

            return new Message
            {
                Raw = Convert.ToBase64String(stream.ToArray())
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .Replace("=", "")
            };
        }

        private string ReplaceVariables(string content, Dictionary<string, string> variables)
        {
            foreach (var variable in variables)
            {
                content = content.Replace($"{{{{{variable.Key}}}}}", variable.Value);
            }
            return content;
        }
    }
}
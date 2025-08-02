using ai_hr.Models;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ai_hr.Services;

public class GoogleCalendarService : IGoogleCalendarService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleCalendarService> _logger;
    private readonly GoogleAuthorizationCodeFlow _authFlow;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string[] _scopes = { CalendarService.Scope.Calendar, CalendarService.Scope.CalendarEvents };

    public GoogleCalendarService(IConfiguration configuration, ILogger<GoogleCalendarService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? throw new InvalidOperationException("GOOGLE_CLIENT_ID environment variable not configured");
        _clientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET") ?? throw new InvalidOperationException("GOOGLE_CLIENT_SECRET environment variable not configured");

        _logger.LogInformation("Google Calendar service initialized with ClientId: {ClientId}", _clientId?.Substring(0, 10) + "...");

        _authFlow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = _clientId,
                ClientSecret = _clientSecret
            },
            Scopes = _scopes,
            DataStore = new FileDataStore("GoogleCalendarAuth", true)
        });
    }

    /// <summary>
    /// Gets the authorization URL for Google Calendar OAuth
    /// </summary>
    public async Task<string> GetAuthorizationUrlAsync(string userId, string redirectUri)
    {
        try
        {
            _logger.LogInformation("Creating authorization URL for user {UserId} with redirect URI: {RedirectUri}", userId, redirectUri);

            var authorizationUrl = _authFlow.CreateAuthorizationCodeRequest(redirectUri);
            authorizationUrl.State = userId; // Store user ID in state parameter

            var finalUrl = authorizationUrl.Build().ToString();
            _logger.LogInformation("Generated authorization URL: {Url}", finalUrl);

            return finalUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create authorization URL for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Handles the OAuth callback and exchanges the code for tokens
    /// </summary>
    public async Task<bool> HandleAuthCallbackAsync(string userId, string code, string redirectUri)
    {
        try
        {
            _logger.LogInformation("Starting Google Calendar auth callback for user {UserId} with code length {CodeLength} and redirect URI: {RedirectUri}",
                userId, code?.Length ?? 0, redirectUri);

            var token = await _authFlow.ExchangeCodeForTokenAsync(userId, code, redirectUri, CancellationToken.None);

            _logger.LogInformation("Successfully exchanged code for token for user {UserId}", userId);

            // Test the token by creating a service and getting user profile
            var credential = new UserCredential(_authFlow, userId, token);
            var service = new CalendarService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "AutoHR"
            });

            // Get user's calendar list to verify access
            var calendarList = await service.CalendarList.List().ExecuteAsync();
            var primaryCalendar = calendarList.Items.FirstOrDefault(c => c.Id == "primary");

            _logger.LogInformation("Successfully authorized Google Calendar access for user {UserId}, primary calendar: {Calendar}",
                userId, primaryCalendar?.Summary);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle auth callback for user {UserId}. Error: {ErrorMessage}",
                userId, ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Checks if a user is authorized for Google Calendar access
    /// </summary>
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

    /// <summary>
    /// Revokes authorization for a user
    /// </summary>
    public async Task RevokeAuthorizationAsync(string userId)
    {
        try
        {
            await _authFlow.DeleteTokenAsync(userId, CancellationToken.None);
            _logger.LogInformation("Revoked Google Calendar authorization for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to revoke authorization for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Creates a Google Calendar event with a Google Meet conference
    /// </summary>
    public async Task<GoogleCalendarEvent> CreateMeetEventAsync(
        string summary,
        string? description,
        DateTime startTime,
        DateTime endTime,
        string timezone,
        string[]? attendees,
        string userId)
    {
        try
        {
            var service = await CreateCalendarServiceAsync(userId);
            if (service == null)
            {
                throw new InvalidOperationException("User not authorized for Google Calendar access");
            }

            // Create the event
            var calendarEvent = new Event
            {
                Summary = summary,
                Description = description,
                Start = new EventDateTime
                {
                    DateTime = startTime,
                    TimeZone = timezone
                },
                End = new EventDateTime
                {
                    DateTime = endTime,
                    TimeZone = timezone
                },
                Attendees = attendees?.Select(email => new EventAttendee { Email = email }).ToList(),
                Reminders = new Event.RemindersData
                {
                    UseDefault = false,
                    Overrides = new List<EventReminder>
                    {
                        new EventReminder { Method = "email", Minutes = 24 * 60 }, // 1 day before
                        new EventReminder { Method = "popup", Minutes = 30 } // 30 minutes before
                    }
                },
                ConferenceData = new ConferenceData
                {
                    CreateRequest = new CreateConferenceRequest
                    {
                        RequestId = Guid.NewGuid().ToString(),
                        ConferenceSolutionKey = new ConferenceSolutionKey
                        {
                            Type = "hangoutsMeet"
                        }
                    }
                }
            };

            // Insert the event
            var request = service.Events.Insert(calendarEvent, "primary");
            request.ConferenceDataVersion = 1; // Required to create conference data
            var createdEvent = await request.ExecuteAsync();

            // Extract Meet link from conference data
            var meetLink = createdEvent.ConferenceData?.EntryPoints?
                .FirstOrDefault(ep => ep.EntryPointType == "video")?.Uri;

            return new GoogleCalendarEvent
            {
                Id = Guid.NewGuid(), // Google Calendar event ID is string, but our model uses Guid
                EventId = createdEvent.Id ?? string.Empty,
                MeetLink = meetLink,
                Summary = createdEvent.Summary ?? string.Empty,
                Description = createdEvent.Description,
                StartTime = createdEvent.Start?.DateTime ?? createdEvent.Start?.DateTimeDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                EndTime = createdEvent.End?.DateTime ?? createdEvent.End?.DateTimeDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                CreatedAt = createdEvent.Created ?? createdEvent.CreatedDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                UpdatedAt = createdEvent.Updated ?? createdEvent.UpdatedDateTimeOffset?.DateTime ?? DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Google Calendar event");
            throw new ApplicationException($"Failed to create Google Calendar event: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Updates an existing Google Calendar event
    /// </summary>
    public async Task<GoogleCalendarEvent> UpdateMeetEventAsync(
        string eventId,
        string calendarId,
        string summary,
        string? description,
        DateTime startTime,
        DateTime endTime,
        string timezone,
        string[]? attendees,
        string userId)
    {
        try
        {
            var service = await CreateCalendarServiceAsync(userId);
            if (service == null)
            {
                throw new InvalidOperationException("User not authorized for Google Calendar access");
            }

            // Get existing event
            var existingEvent = await service.Events.Get(calendarId, eventId).ExecuteAsync();

            // Update event properties
            existingEvent.Summary = summary;
            existingEvent.Description = description;
            existingEvent.Start = new EventDateTime
            {
                DateTime = startTime,
                TimeZone = timezone
            };
            existingEvent.End = new EventDateTime
            {
                DateTime = endTime,
                TimeZone = timezone
            };
            existingEvent.Attendees = attendees?.Select(email => new EventAttendee { Email = email }).ToList();

            // Update the event
            var request = service.Events.Update(existingEvent, calendarId, eventId);
            var updatedEvent = await request.ExecuteAsync();

            // Extract Meet link from conference data
            var meetLink = updatedEvent.ConferenceData?.EntryPoints?
                .FirstOrDefault(ep => ep.EntryPointType == "video")?.Uri;

            return new GoogleCalendarEvent
            {
                Id = Guid.NewGuid(), // Google Calendar event ID is string, but our model uses Guid
                EventId = updatedEvent.Id ?? string.Empty,
                MeetLink = meetLink,
                Summary = updatedEvent.Summary ?? string.Empty,
                Description = updatedEvent.Description,
                StartTime = updatedEvent.Start?.DateTime ?? updatedEvent.Start?.DateTimeDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                EndTime = updatedEvent.End?.DateTime ?? updatedEvent.End?.DateTimeDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                CreatedAt = updatedEvent.Created ?? updatedEvent.CreatedDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                UpdatedAt = updatedEvent.Updated ?? updatedEvent.UpdatedDateTimeOffset?.DateTime ?? DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Google Calendar event {EventId}", eventId);
            throw new ApplicationException($"Failed to update Google Calendar event: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Deletes a Google Calendar event
    /// </summary>
    public async Task DeleteMeetEventAsync(
        string eventId,
        string calendarId,
        string userId)
    {
        try
        {
            var service = await CreateCalendarServiceAsync(userId);
            if (service == null)
            {
                throw new InvalidOperationException("User not authorized for Google Calendar access");
            }

            await service.Events.Delete(calendarId, eventId).ExecuteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Google Calendar event {EventId}", eventId);
            throw new ApplicationException($"Failed to delete Google Calendar event: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Gets details of a Google Calendar event
    /// </summary>
    public async Task<GoogleCalendarEvent> GetMeetEventAsync(
        string eventId,
        string calendarId,
        string userId)
    {
        try
        {
            var service = await CreateCalendarServiceAsync(userId);
            if (service == null)
            {
                throw new InvalidOperationException("User not authorized for Google Calendar access");
            }

            var eventItem = await service.Events.Get(calendarId, eventId).ExecuteAsync();

            // Extract Meet link from conference data
            var meetLink = eventItem.ConferenceData?.EntryPoints?
                .FirstOrDefault(ep => ep.EntryPointType == "video")?.Uri;

            return new GoogleCalendarEvent
            {
                Id = Guid.NewGuid(), // Google Calendar event ID is string, but our model uses Guid
                EventId = eventItem.Id ?? string.Empty,
                MeetLink = meetLink,
                Summary = eventItem.Summary ?? string.Empty,
                Description = eventItem.Description,
                StartTime = eventItem.Start?.DateTime ?? eventItem.Start?.DateTimeDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                EndTime = eventItem.End?.DateTime ?? eventItem.End?.DateTimeDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                CreatedAt = eventItem.Created ?? eventItem.CreatedDateTimeOffset?.DateTime ?? DateTime.UtcNow,
                UpdatedAt = eventItem.Updated ?? eventItem.UpdatedDateTimeOffset?.DateTime ?? DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Google Calendar event {EventId}", eventId);
            throw new ApplicationException($"Failed to get Google Calendar event: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Creates a Google Calendar service for a specific user
    /// </summary>
    private async Task<CalendarService?> CreateCalendarServiceAsync(string userId)
    {
        try
        {
            var token = await _authFlow.LoadTokenAsync(userId, CancellationToken.None);
            if (token == null)
            {
                return null;
            }

            var credential = new UserCredential(_authFlow, userId, token);

            return new CalendarService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "AutoHR"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Calendar service for user {UserId}", userId);
            return null;
        }
    }
}

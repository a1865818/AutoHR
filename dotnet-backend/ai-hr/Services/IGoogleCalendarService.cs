using ai_hr.Models;
using Google.Apis.Calendar.v3.Data;

namespace ai_hr.Services;

public interface IGoogleCalendarService
{
    /// <summary>
    /// Gets the authorization URL for Google Calendar OAuth
    /// </summary>
    /// <param name="userId">ID of the user requesting authorization</param>
    /// <param name="redirectUri">URI to redirect to after authorization</param>
    /// <returns>Google OAuth authorization URL</returns>
    Task<string> GetAuthorizationUrlAsync(string userId, string redirectUri);

    /// <summary>
    /// Handles the OAuth callback and exchanges the code for tokens
    /// </summary>
    /// <param name="userId">ID of the user</param>
    /// <param name="code">Authorization code from Google</param>
    /// <param name="redirectUri">URI that was used for the initial request</param>
    /// <returns>True if authorization was successful</returns>
    Task<bool> HandleAuthCallbackAsync(string userId, string code, string redirectUri);

    /// <summary>
    /// Checks if a user is authorized for Google Calendar access
    /// </summary>
    /// <param name="userId">ID of the user</param>
    /// <returns>True if user is authorized</returns>
    Task<bool> IsUserAuthorizedAsync(string userId);

    /// <summary>
    /// Revokes authorization for a user
    /// </summary>
    /// <param name="userId">ID of the user</param>
    Task RevokeAuthorizationAsync(string userId);

    /// <summary>
    /// Creates a Google Calendar event with a Google Meet conference
    /// </summary>
    /// <param name="summary">Event title</param>
    /// <param name="description">Event description</param>
    /// <param name="startTime">Event start time</param>
    /// <param name="endTime">Event end time</param>
    /// <param name="timezone">Timezone for the event</param>
    /// <param name="attendees">List of attendee email addresses</param>
    /// <param name="userId">ID of the user creating the event</param>
    /// <returns>Created GoogleCalendarEvent with Meet link</returns>
    Task<GoogleCalendarEvent> CreateMeetEventAsync(
        string summary,
        string? description,
        DateTime startTime,
        DateTime endTime,
        string timezone,
        string[]? attendees,
        string userId);

    /// <summary>
    /// Updates an existing Google Calendar event
    /// </summary>
    /// <param name="eventId">ID of the event to update</param>
    /// <param name="calendarId">ID of the calendar (default is "primary")</param>
    /// <param name="summary">Event title</param>
    /// <param name="description">Event description</param>
    /// <param name="startTime">Event start time</param>
    /// <param name="endTime">Event end time</param>
    /// <param name="timezone">Timezone for the event</param>
    /// <param name="attendees">List of attendee email addresses</param>
    /// <param name="userId">ID of the user updating the event</param>
    /// <returns>Updated GoogleCalendarEvent</returns>
    Task<GoogleCalendarEvent> UpdateMeetEventAsync(
        string eventId,
        string calendarId,
        string summary,
        string? description,
        DateTime startTime,
        DateTime endTime,
        string timezone,
        string[]? attendees,
        string userId);

    /// <summary>
    /// Deletes a Google Calendar event
    /// </summary>
    /// <param name="eventId">ID of the event to delete</param>
    /// <param name="calendarId">ID of the calendar (default is "primary")</param>
    /// <param name="userId">ID of the user deleting the event</param>
    Task DeleteMeetEventAsync(
        string eventId,
        string calendarId,
        string userId);

    /// <summary>
    /// Gets details of a Google Calendar event
    /// </summary>
    /// <param name="eventId">ID of the event to retrieve</param>
    /// <param name="calendarId">ID of the calendar (default is "primary")</param>
    /// <param name="userId">ID of the user requesting the event</param>
    /// <returns>GoogleCalendarEvent with current details</returns>
    Task<GoogleCalendarEvent> GetMeetEventAsync(
        string eventId,
        string calendarId,
        string userId);
}

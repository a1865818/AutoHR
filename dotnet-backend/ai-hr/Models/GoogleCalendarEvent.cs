using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ai_hr.Models;

[Table("google_calendar_events")]
public class GoogleCalendarEvent : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("round_configuration_id")]
    public Guid RoundConfigurationId { get; set; }

    [Column("application_id")]
    public Guid? ApplicationId { get; set; }

    [Column("event_id")]
    public string EventId { get; set; } = string.Empty;

    [Column("calendar_id")]
    public string CalendarId { get; set; } = "primary";

    [Column("summary")]
    public string Summary { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("start_time")]
    public DateTime StartTime { get; set; }

    [Column("end_time")]
    public DateTime EndTime { get; set; }

    [Column("timezone")]
    public string Timezone { get; set; } = "UTC";

    [Column("meet_link")]
    public string? MeetLink { get; set; }

    [Column("conference_id")]
    public string? ConferenceId { get; set; }

    [Column("entry_points")]
    public Dictionary<string, string>? EntryPoints { get; set; }

    [Column("attendees")]
    public string[]? Attendees { get; set; }

    [Column("status")]
    public string Status { get; set; } = "pending"; // pending, confirmed, cancelled

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public Guid? CreatedBy { get; set; }

    [Column("last_modified_by")]
    public Guid? LastModifiedBy { get; set; }

    // Constructor to ensure ID is always set
    public GoogleCalendarEvent()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        Status = "pending";
        Timezone = "UTC";
        CalendarId = "primary";
    }
}

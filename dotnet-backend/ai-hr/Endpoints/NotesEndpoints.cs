


using ai_hr.Models;
using Supabase;

namespace ai_hr.Endpoints;

public static class NotesEndpoints
{
    public static void MapNotesEndpoints(this WebApplication app)
    {
        app.MapPut("/candidates/{applicationId}/notes", SaveCandidateNote)
            .WithTags("Candidates")
            .WithName("SaveCandidateNote")
            .WithSummary("Save or update candidate notes")
            .WithDescription("Save hiring notes for a candidate application")
            .RequireAuthorization();

        app.MapDelete("/candidates/{applicationId}/notes", DeleteCandidateNote)
            .WithTags("Candidates")
            .WithName("DeleteCandidateNote")
            .WithSummary("Delete candidate notes")
            .WithDescription("Delete hiring notes for a candidate application")
            .RequireAuthorization();
    }

    private static async Task<IResult> SaveCandidateNote(Guid applicationId, SaveCandidateNoteRequest request, Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"💾 Saving note for application: {applicationId}");

            // First, get the current application detail
            var getResponse = await client.From<ApplicationDetail>()
                .Where(ad => ad.Id == applicationId)
                .Get();

            var applicationDetail = getResponse.Models.FirstOrDefault();
            if (applicationDetail == null)
            {
                return Results.NotFound(new { message = $"Application not found: {applicationId}" });
            }

            // FIXED: Ensure we get TRUE UTC time
            var utcNow = DateTime.UtcNow;

            // Additional check to ensure it's really UTC
            if (utcNow.Kind != DateTimeKind.Utc)
            {
                // Force convert to UTC if somehow it's not
                utcNow = utcNow.ToUniversalTime();
            }

            Console.WriteLine($"🕐 Server UTC time: {utcNow:yyyy-MM-ddTHH:mm:ssZ}");
            Console.WriteLine($"🕐 Server timezone: {TimeZoneInfo.Local.Id}");
            Console.WriteLine($"🕐 DateTime kind: {utcNow.Kind}");

            // Check if this is creating a new note or updating existing one
            var isNewNote = string.IsNullOrEmpty(applicationDetail.HiringNotes);

            // Update the notes and timestamps
            applicationDetail.HiringNotes = request.Notes;

            if (isNewNote)
            {
                // First time creating a note
                applicationDetail.NotesCreatedAt = utcNow;
                applicationDetail.NotesUpdatedAt = utcNow;
                Console.WriteLine($"✨ Creating new note at UTC: {utcNow:yyyy-MM-ddTHH:mm:ssZ}");
            }
            else
            {
                // Updating existing note - keep created time, update modified time
                applicationDetail.NotesUpdatedAt = utcNow;
                Console.WriteLine($"✏️ Updating existing note at UTC: {utcNow:yyyy-MM-ddTHH:mm:ssZ}");
                Console.WriteLine($"📅 Original created time: {applicationDetail.NotesCreatedAt:yyyy-MM-ddTHH:mm:ssZ}");
            }

            // Save to database
            var response = await client.From<ApplicationDetail>().Update(applicationDetail);

            Console.WriteLine($"✅ Note saved successfully for application: {applicationId}");

            return Results.Ok(new
            {
                success = true,
                message = isNewNote ? "Note created successfully" : "Note updated successfully",
                notesCreatedAt = applicationDetail.NotesCreatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                notesUpdatedAt = applicationDetail.NotesUpdatedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                isNewNote = isNewNote,
                // DEBUG: Add server time info
                debug = new
                {
                    serverUtcNow = utcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    serverTimezone = TimeZoneInfo.Local.Id,
                    dateTimeKind = utcNow.Kind.ToString()
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error saving candidate note: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> DeleteCandidateNote(Guid applicationId, Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"🗑️ Deleting note for application: {applicationId}");

            // First, get the current application detail
            var getResponse = await client.From<ApplicationDetail>()
                .Where(ad => ad.Id == applicationId)
                .Get();

            var applicationDetail = getResponse.Models.FirstOrDefault();
            if (applicationDetail == null)
            {
                return Results.NotFound(new { message = $"Application not found: {applicationId}" });
            }

            // Clear the notes and timestamps
            applicationDetail.HiringNotes = null;
            applicationDetail.NotesCreatedAt = null;
            applicationDetail.NotesUpdatedAt = null;

            // Save to database
            var response = await client.From<ApplicationDetail>().Update(applicationDetail);

            Console.WriteLine($"✅ Note deleted successfully for application: {applicationId}");

            return Results.Ok(new
            {
                success = true,
                message = "Note deleted successfully"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error deleting candidate note: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }
}

// Request model for saving notes
public class SaveCandidateNoteRequest
{
    public string Notes { get; set; } = string.Empty;
}
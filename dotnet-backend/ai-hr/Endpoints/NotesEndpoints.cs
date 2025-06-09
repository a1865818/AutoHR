using ai_hr.Models;

namespace ai_hr.Endpoints
{

    public static class NotesEndpoints
    {
        public static void MapNotesEndpoints(this WebApplication app)
        {
            app.MapPut("/candidates/{applicationId}/notes", SaveCandidateNote)
                .WithTags("Candidate Notes")
                .WithName("SaveCandidateNote")
                .WithSummary("Save or update hiring notes for a candidate")
                .WithDescription("Saves hiring manager notes for a specific candidate application")
                .RequireAuthorization();

            app.MapDelete("/candidates/{applicationId}/notes", DeleteCandidateNote)
                .WithTags("Candidate Notes")
                .WithName("DeleteCandidateNote")
                .WithSummary("Delete hiring notes for a candidate")
                .WithDescription("Removes hiring manager notes for a specific candidate application")
                .RequireAuthorization();
        }

        public class SaveNoteRequest
        {
            public string Notes { get; set; } = string.Empty;
        }

        private static async Task<IResult> SaveCandidateNote(
            Guid applicationId,
            SaveNoteRequest request,
            Supabase.Client client)
        {
            try
            {
                Console.WriteLine($"Saving note for application: {applicationId}");

                // Get the current application
                var appResponse = await client.From<ApplicationDetail>()
                    .Where(ad => ad.Id == applicationId)
                    .Get();

                var application = appResponse.Models?.FirstOrDefault();
                if (application == null)
                {
                    Console.WriteLine($"Application not found: {applicationId}");
                    return Results.NotFound(new { error = "Application not found" });
                }

                // Update the hiring notes
                application.HiringNotes = request.Notes;
                application.StatusChangedAt = DateTime.UtcNow.AddHours(7); // Update timestamp

                // Save to database
                var updateResponse = await client.From<ApplicationDetail>()
                    .Update(application);

                Console.WriteLine($"✅ Note saved successfully for application {applicationId}");

                return Results.Ok(new
                {
                    message = "Note saved successfully",
                    applicationId = applicationId.ToString(),
                    notes = request.Notes,
                    updatedAt = application.StatusChangedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error saving note: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return Results.BadRequest(new
                {
                    error = ex.Message,
                    details = ex.ToString()
                });
            }
        }

        private static async Task<IResult> DeleteCandidateNote(
            Guid applicationId,
            Supabase.Client client)
        {
            try
            {
                Console.WriteLine($"Deleting note for application: {applicationId}");

                // Get the current application
                var appResponse = await client.From<ApplicationDetail>()
                    .Where(ad => ad.Id == applicationId)
                    .Get();

                var application = appResponse.Models?.FirstOrDefault();
                if (application == null)
                {
                    Console.WriteLine($"Application not found: {applicationId}");
                    return Results.NotFound(new { error = "Application not found" });
                }

                // Clear the hiring notes
                application.HiringNotes = null;
                application.StatusChangedAt = DateTime.UtcNow.AddHours(7);

                // Save to database
                var updateResponse = await client.From<ApplicationDetail>()
                    .Update(application);

                Console.WriteLine($"✅ Note deleted successfully for application {applicationId}");

                return Results.Ok(new
                {
                    message = "Note deleted successfully",
                    applicationId = applicationId.ToString(),
                    updatedAt = application.StatusChangedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error deleting note: {ex.Message}");
                return Results.BadRequest(new
                {
                    error = ex.Message,
                    details = ex.ToString()
                });
            }
        }
    }
}

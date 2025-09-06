using System.Security.Claims;
using System.Text.Json;

namespace ai_hr.Utils;

public static class UserIdExtractor
{
    public static string? ExtractUserId(ClaimsPrincipal user)
    {
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // Extract real database user ID from JWT metadata if available
        var userMetadataClaim = user.FindFirst("user_metadata")?.Value;
        if (!string.IsNullOrEmpty(userMetadataClaim))
        {
            try
            {
                var userMetadata = JsonDocument.Parse(userMetadataClaim);
                if (userMetadata.RootElement.TryGetProperty("database_user_id", out var databaseUserIdElement))
                {
                    userId = databaseUserIdElement.GetString();
                }
                else if (userMetadata.RootElement.TryGetProperty("migrated_user_id", out var migratedUserIdElement))
                {
                    userId = migratedUserIdElement.GetString();
                }
            }
            catch 
            { 
                // If parsing fails, fall back to the original userId
            }
        }
        
        return userId;
    }
}
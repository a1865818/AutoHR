using ai_hr.Models;
using ai_hr.Contracts;
using Supabase;

namespace ai_hr.Endpoints;

public static class StorageBucketEndpoints
{
    public static void MapStorageBucketEndpoints(this WebApplication app)
    {
        app.MapPost("/create-bucket", CreateStorageBucket)
            .WithTags("Storage Bucket")
            .WithName("CreateStorageBucket")
            .WithSummary("Create new storage bucket")
            .WithDescription("Create a new storage bucket for a job application")
            .DisableAntiforgery();


        app.MapPost("/upload-file", UploadFile)
            .WithTags("Storage Bucket")
            .WithName("UploadFile")
            .WithSummary("Upload a file to the storage bucket")
            .WithDescription("Upload a file to the storage bucket for a job application")
            .DisableAntiforgery();

        app.MapGet("/get-file-url", GetFileUrl)
            .WithTags("Storage Bucket")
            .WithName("GetFileUrl")
            .WithSummary("Get a file URL from the storage bucket")
            .WithDescription("Get a file URL from the storage bucket for a job application");

        app.MapGet("/list-files", ListFiles)
            .WithTags("Storage Bucket")
            .WithName("ListFiles")
            .WithSummary("List all files in the storage bucket")
            .WithDescription("List all files in the storage bucket for a job application");

        app.MapGet("/download-file", DownloadFile)
            .WithTags("Storage Bucket")
            .WithName("DownloadFile")
            .WithSummary("Download a file from the storage bucket")
            .WithDescription("Download a file from the storage bucket for a job application");
        app.MapGet("/delete-file", DeleteFile)
            .WithTags("Storage Bucket")
            .WithName("DeleteFile")
            .WithSummary("Delete a file from the storage bucket")
            .WithDescription("Delete a file from the storage bucket for a job application");
    }

    public static async Task<IResult> CreateStorageBucket(Supabase.Client client, string bucketName)
    {
        var bucket = await client.Storage.CreateBucket(bucketName);
        return Results.Ok(bucket);
    }

    public static async Task<IResult> UploadFile(Supabase.Client client, string bucketName, string fileName, IFormFile fileContent)
    {
        var storage = client.Storage;
        var bucket = storage.From(bucketName);

        // Convert the stream to byte array
        using var memoryStream = new MemoryStream();
        await fileContent.OpenReadStream().CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();

        Console.WriteLine($"📁 Uploading file: {fileName}, size: {fileBytes.Length} bytes to bucket: {bucketName}");
        var file = await bucket.Upload(fileBytes, fileName);
        Console.WriteLine($"✅ Upload completed for: {fileName}");
        return Results.Ok(file);
    }

    private static async Task<IResult> GetFileUrl(Supabase.Client client, string bucketName, string fileName)
    {
        var storage = client.Storage;
        var bucket = storage.From(bucketName);
        var file = await bucket.CreateSignedUrl(fileName, 60 * 60 * 24 * 365 * 60); // 60 years
        return Results.Ok(new { url = file });
    }

    public static async Task<string> get_file_url_backend(Supabase.Client client, string bucketName, string fileName)
    {
        try
        {
            var storage = client.Storage;
            var bucket = storage.From(bucketName);

            var signedUrl = await bucket.CreateSignedUrl(fileName, 60 * 60 * 24 * 3); // 3 days
            return signedUrl;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error creating signed URL: {ex.Message}");
            throw;
        }
    }

    public static async Task<IResult> DownloadFile(Supabase.Client client, string bucketName, string fileName)
    {
        var storage = client.Storage;
        var bucket = storage.From(bucketName);
        var file = await bucket.Download(fileName, (EventHandler<float>?)null);
        return Results.Ok(file);
    }

    public static async Task<IResult> ListFiles(Supabase.Client client, string bucketName)
    {
        var storage = client.Storage;
        var bucket = storage.From(bucketName);
        var files = await bucket.List();
        return Results.Ok(files);
    }

    public static async Task<IResult> DeleteFile(Supabase.Client client, string bucketName, string fileName)
    {
        var storage = client.Storage;
        var bucket = storage.From(bucketName);
        var file = await bucket.Remove(new List<string> { fileName });
        return Results.Ok(file);
    }
}

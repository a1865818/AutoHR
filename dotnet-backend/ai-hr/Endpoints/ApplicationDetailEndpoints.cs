using ai_hr.Models;
using ai_hr.Contracts;
using Supabase;

namespace ai_hr.Endpoints;

public static class ApplicationDetailEndpoints
{
    public static void MapApplicationDetailEndpoints(this WebApplication app)
    {
        app.MapPost("/applicationdetails", CreateApplicationDetail)
            .WithTags("Application Details")
            .WithName("CreateApplicationDetail")
            .WithSummary("Create new application")
            .WithDescription("Submit a new job application with candidate details and optional documents");

        app.MapGet("/applicationdetails/{id}", GetApplicationDetailById)
            .WithTags("Application Details")
            .WithName("GetApplicationDetailById")
            .WithSummary("Get application by ID")
            .WithDescription("Retrieves details of a specific job application by its unique identifier");

        app.MapGet("/applicationdetails/job/{jobId}", GetApplicationDetailsByJob)
            .WithTags("Application Details")
            .WithName("GetApplicationDetailsByJob")
            .WithSummary("Get applications by job")
            .WithDescription("Retrieves all applications for a specific job posting");

        app.MapGet("/applicationdetails/candidate/{candidateUserId}", GetApplicationDetailsByCandidate)
            .WithTags("Application Details")
            .WithName("GetApplicationDetailsByCandidate")
            .WithSummary("Get applications by candidate")
            .WithDescription("Retrieves all applications submitted by a specific candidate");

        app.MapPut("/applicationdetails/{id}", UpdateApplicationDetail)
            .WithTags("Application Details")
            .WithName("UpdateApplicationDetail")
            .WithSummary("Update application")
            .WithDescription("Update an existing job application's details, documents, or status");

        app.MapDelete("/applicationdetails/{id}", DeleteApplicationDetail)
            .WithTags("Application Details")
            .WithName("DeleteApplicationDetail")
            .WithSummary("Delete application")
            .WithDescription("Permanently removes a job application from the system");

        // Public endpoint for guest applications (no authentication required)
        app.MapPost("/public/jobs/{jobId}/apply", SubmitGuestApplication)
            .WithTags("Public Applications")
            .WithName("SubmitGuestApplication")
            .WithSummary("Submit guest application")
            .WithDescription("Submit a job application as a guest user without requiring authentication");
    }

    private static async Task<IResult> CreateApplicationDetail(CreateApplicationDetailRequest request, Supabase.Client client)
    {
        try
        {
            // Generate the ID first
            var applicationId = Guid.NewGuid();

            var applicationDetail = new ApplicationDetail
            {
                Id = applicationId,
                JobId = request.JobId,
                CandidateUserId = request.CandidateUserId,
                ResumeUrl = request.ResumeUrl,
                CoverLetterText = request.CoverLetterText,
                ExpectedSalary = request.ExpectedSalary,
                AvailabilityDate = request.AvailabilityDate,
                JobSource = request.JobSource,
                AiAnalysis = request.AiAnalysis,
                Status = "applied", // Explicitly set default status
                Stage = "Applied", // Updated to new stage system
                AppliedAt = DateTime.UtcNow,
                StatusChangedAt = DateTime.UtcNow
            };

            Console.WriteLine($"Creating application detail with ID: {applicationId}");
            Console.WriteLine($"JobId: {request.JobId}, CandidateUserId: {request.CandidateUserId}");

            var response = await client.From<ApplicationDetail>()
         .Upsert(applicationDetail);

            var newApplicationDetail = response.Models.FirstOrDefault();

            if (newApplicationDetail == null)
            {
                Console.WriteLine("Failed to create application detail - no model returned");
                return Results.BadRequest(new { error = "Failed to create application detail." });
            }

            Console.WriteLine($"Application detail created successfully with ID: {newApplicationDetail.Id}");

            // Update job applicant count
            try
            {
                await ai_hr.Endpoints.JobEndpoints.UpdateJobApplicantCount(request.JobId, client);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to update applicant count for job {request.JobId}: {ex.Message}");
                // Don't fail the application creation if count update fails
            }

            // Return the created application with relevant details
            return Results.Ok(new
            {
                applicationId = newApplicationDetail.Id,
                status = newApplicationDetail.Status,
                submittedAt = newApplicationDetail.AppliedAt,
                message = "Application submitted successfully"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating application detail: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");

            // Log the inner exception if it exists
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }

            return Results.BadRequest(new
            {
                error = ex.Message,
                details = ex.ToString(),
                innerException = ex.InnerException?.Message
            });
        }
    }

    private static async Task<IResult> GetApplicationDetailById(Guid id, Supabase.Client client)
    {
        try
        {
            var response = await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Get();
            var applicationDetail = response.Models.FirstOrDefault();

            if (applicationDetail is null)
            {
                return Results.NotFound();
            }

            // Create a simple anonymous object with just the properties we want to return
            // This avoids serialization issues with attributes
            var detailDto = new
            {
                Id = applicationDetail.Id,
                JobId = applicationDetail.JobId,
                CandidateUserId = applicationDetail.CandidateUserId,
                ResumeUrl = applicationDetail.ResumeUrl,
                CoverLetterText = applicationDetail.CoverLetterText,
                ExpectedSalary = applicationDetail.ExpectedSalary,
                AvailabilityDate = applicationDetail.AvailabilityDate,
                Status = applicationDetail.Status,
                Stage = applicationDetail.Stage,
                JobSource = applicationDetail.JobSource,
                OverallAiScore = applicationDetail.OverallAiScore,
                AppliedAt = applicationDetail.AppliedAt,
                StatusChangedAt = applicationDetail.StatusChangedAt
            };

            return Results.Ok(detailDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving application detail: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetApplicationDetailsByJob(Guid jobId, Supabase.Client client)
    {
        try
        {
            var response = await client.From<ApplicationDetail>().Where(ad => ad.JobId == jobId).Get();
            var applicationDetails = response.Models;

            if (applicationDetails == null || !applicationDetails.Any())
            {
                return Results.NotFound(new { message = $"No applications found for job ID: {jobId}" });
            }

            // Create a list of simple DTOs to avoid serialization issues with attributes
            var detailDtos = applicationDetails.Select(ad => new
            {
                Id = ad.Id,
                JobId = ad.JobId,
                CandidateUserId = ad.CandidateUserId,
                ResumeUrl = ad.ResumeUrl,
                CoverLetterText = ad.CoverLetterText,
                ExpectedSalary = ad.ExpectedSalary,
                AvailabilityDate = ad.AvailabilityDate,
                Status = ad.Status,
                Stage = ad.Stage,
                JobSource = ad.JobSource,
                OverallAiScore = ad.OverallAiScore,
                AppliedAt = ad.AppliedAt,
                StatusChangedAt = ad.StatusChangedAt
            }).ToList();

            return Results.Ok(detailDtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving application details by job: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> GetApplicationDetailsByCandidate(Guid candidateUserId, Supabase.Client client)
    {
        try
        {
            var response = await client.From<ApplicationDetail>().Where(ad => ad.CandidateUserId == candidateUserId).Get();
            var applicationDetails = response.Models;

            if (applicationDetails == null || !applicationDetails.Any())
            {
                return Results.NotFound(new { message = $"No applications found for candidate ID: {candidateUserId}" });
            }

            // Create a list of simple DTOs to avoid serialization issues with attributes
            var detailDtos = applicationDetails.Select(ad => new
            {
                Id = ad.Id,
                JobId = ad.JobId,
                CandidateUserId = ad.CandidateUserId,
                ResumeUrl = ad.ResumeUrl,
                CoverLetterText = ad.CoverLetterText,
                ExpectedSalary = ad.ExpectedSalary,
                AvailabilityDate = ad.AvailabilityDate,
                Status = ad.Status,
                Stage = ad.Stage,
                JobSource = ad.JobSource,
                OverallAiScore = ad.OverallAiScore,
                AppliedAt = ad.AppliedAt,
                StatusChangedAt = ad.StatusChangedAt
            }).ToList();

            return Results.Ok(detailDtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving application details by candidate: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> UpdateApplicationDetail(Guid id, UpdateApplicationDetailRequest request, Supabase.Client client)
    {
        try
        {
            // Validate request first
            if (!request.IsValidStage())
            {
                return Results.BadRequest(new { error = "Invalid stage value" });
            }

            if (!request.IsValidStatus())
            {
                return Results.BadRequest(new { error = "Invalid status value" });
            }

            // First, get the current application detail
            var getResponse = await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Get();
            var applicationDetail = getResponse.Models.FirstOrDefault();

            if (applicationDetail == null)
            {
                return Results.NotFound();
            }

            // Update the properties if provided in the request
            if (request.Status != null) applicationDetail.Status = request.Status;
            if (request.Stage != null) applicationDetail.Stage = request.Stage;
            if (request.CurrentRoundId != null) applicationDetail.CurrentRoundId = request.CurrentRoundId;
            if (request.Notes != null)
            {
                applicationDetail.HiringNotes = request.Notes;
                applicationDetail.NotesUpdatedAt = DateTime.UtcNow;
                if (applicationDetail.NotesCreatedAt == null)
                {
                    applicationDetail.NotesCreatedAt = DateTime.UtcNow;
                }
            }

            // Handle rejection fields
            if (request.RejectionReason != null)
            {
                applicationDetail.RejectionReason = request.RejectionReason;
            }
            if (request.RejectionNotes != null)
            {
                applicationDetail.RejectionNotes = request.RejectionNotes;
            }
            if (request.IsSendRejectEmail.HasValue)
            {
                applicationDetail.IsSendRejectEmail = request.IsSendRejectEmail.Value;
            }

            // Set rejected timestamp when status is changed to Rejected
            if (request.Status == "Rejected" && applicationDetail.RejectedAt == null)
            {
                applicationDetail.RejectedAt = DateTime.UtcNow;
            }

            // Always update the status changed timestamp
            applicationDetail.StatusChangedAt = DateTime.UtcNow;

            // Update the record
            var response = await client.From<ApplicationDetail>().Update(applicationDetail);
            var updatedApplicationDetail = response.Models.FirstOrDefault();

            if (updatedApplicationDetail == null)
            {
                Console.WriteLine("Failed to update application detail - no model returned");
                return Results.BadRequest(new { error = "Failed to update application detail." });
            }

            Console.WriteLine($"Application detail updated successfully: Status={updatedApplicationDetail.Status}, Stage={updatedApplicationDetail.Stage}");

            // Return the updated application with relevant details
            return Results.Ok(new
            {
                id = updatedApplicationDetail.Id,
                status = updatedApplicationDetail.Status,
                stage = updatedApplicationDetail.Stage,
                currentRoundId = updatedApplicationDetail.CurrentRoundId,
                statusChangedAt = updatedApplicationDetail.StatusChangedAt,
                message = "Application updated successfully"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating application detail: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    private static async Task<IResult> DeleteApplicationDetail(Guid id, Supabase.Client client)
    {
        try
        {
            // First, get the application detail to retrieve the job ID
            var getResponse = await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Get();
            var applicationDetail = getResponse.Models.FirstOrDefault();

            if (applicationDetail == null)
            {
                return Results.NotFound(new { message = $"Application with ID {id} not found" });
            }

            var jobId = applicationDetail.JobId;

            // Delete the application
            await client.From<ApplicationDetail>().Where(ad => ad.Id == id).Delete();

            // Update job applicant count
            try
            {
                await ai_hr.Endpoints.JobEndpoints.UpdateJobApplicantCount(jobId, client);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to update applicant count for job {jobId} after deletion: {ex.Message}");
                // Don't fail the deletion if count update fails
            }

            return Results.NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting application detail: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = ex.Message, details = ex.ToString() });
        }
    }

    // Public endpoint for guest applications
    private static async Task<IResult> SubmitGuestApplication(
        Guid jobId,
        HttpRequest request,
        Supabase.Client client)
    {
        try
        {
            Console.WriteLine($"🌍 Processing guest application for job: {jobId}");

            // Parse form data from the request
            var form = await request.ReadFormAsync();

            // Extract required fields
            var firstName = form["firstName"].ToString();
            var lastName = form["lastName"].ToString();
            var email = form["email"].ToString();
            var phoneNumber = form["phoneNumber"].ToString();
            var city = form["city"].ToString();
            var country = form["country"].ToString();
            var countryCode = form["countryCode"].ToString();
            var coverLetter = form["coverLetter"].ToString();

            // Extract optional experience and education data
            var experienceJson = form["experience"].ToString();
            var educationJson = form["education"].ToString();

            // Extract resume file
            var resumeFile = form.Files["resume"];

            // Basic validation
            if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName) ||
                string.IsNullOrEmpty(email) || string.IsNullOrEmpty(city) ||
                string.IsNullOrEmpty(country) || resumeFile == null)
            {
                return Results.BadRequest(new { message = "First name, last name, email, city, country, and resume are required" });
            }

            // Validate email format
            if (!IsValidEmail(email))
            {
                return Results.BadRequest(new { message = "Invalid email format" });
            }

            // Validate file type and size
            var allowedTypes = new[] { "application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
            if (!allowedTypes.Contains(resumeFile.ContentType))
            {
                return Results.BadRequest(new { message = "Only PDF and Word documents are allowed" });
            }

            if (resumeFile.Length > 10 * 1024 * 1024) // 10MB
            {
                return Results.BadRequest(new { message = "File size must be less than 10MB" });
            }

            // For guest applications, create or get existing guest user record
            var guestUserId = GenerateGuestUserId(email);
            await EnsureGuestUserExists(guestUserId, firstName, lastName, email, phoneNumber, city, country, experienceJson, educationJson, client);

            // Handle file upload and create resume entry
            var resumeId = Guid.NewGuid().ToString();
            var resumeFileName = $"{guestUserId}_{DateTime.UtcNow:yyyyMMddHHmmss}_{resumeFile.FileName}";
            var bucketName = Environment.GetEnvironmentVariable("BUCKET_NAME") ?? "resume-storage";
            await ai_hr.Endpoints.StorageBucketEndpoints.UploadFile(client, bucketName, resumeFileName, resumeFile);
            var resumeUrl = bucketName + "/" + resumeFileName;

            var resumeEntry = new Dictionary<string, object>
            {
                ["id"] = resumeId,
                ["fileName"] = resumeFileName,
                ["originalName"] = resumeFile.FileName,
                ["fileSize"] = resumeFile.Length,
                ["uploadedAt"] = DateTime.UtcNow
            };

            // Add resume to guest user's ResumeList
            await AddResumeToGuestUser(guestUserId, resumeEntry, client);

            // Create the application
            var applicationId = Guid.NewGuid();
            var applicationDetail = new ApplicationDetail
            {
                Id = applicationId,
                JobId = jobId,
                CandidateUserId = Guid.Parse(guestUserId), // Guest user ID
                ResumeUrl = resumeUrl,
                CoverLetterText = BuildGuestCoverLetter(firstName, lastName, email, phoneNumber, city, country, coverLetter),
                JobSource = "guest_application",
                Status = "applied",
                Stage = "Applied",
                AppliedAt = DateTime.UtcNow,
                StatusChangedAt = DateTime.UtcNow,
            };

            // Save to database
            var response = await client.From<ApplicationDetail>().Upsert(applicationDetail);

            Console.WriteLine($"✅ Guest application created with ID: {applicationId}");

            // Update job applicant count
            try
            {
                await ai_hr.Endpoints.JobEndpoints.UpdateJobApplicantCount(jobId, client);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to update applicant count: {ex.Message}");
                // Don't fail the application if count update fails
            }

            // Return success response
            return Results.Ok(new
            {
                applicationId = applicationId.ToString(),
                message = "Application submitted successfully! You will receive an email confirmation shortly.",
                submittedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error processing guest application: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return Results.BadRequest(new { error = "Failed to submit application", details = ex.Message });
        }
    }

    // Helper methods for guest applications
    private static string GenerateGuestUserId(string email)
    {
        // Create a deterministic GUID based on email for guest users
        // This allows us to potentially link future applications from the same email
        var emailBytes = System.Text.Encoding.UTF8.GetBytes($"guest_{email}");
        var hash = System.Security.Cryptography.MD5.HashData(emailBytes);
        var guid = new Guid(hash);
        return guid.ToString();
    }

    private static async Task EnsureGuestUserExists(string guestUserId, string firstName, string lastName,
        string email, string phoneNumber, string city, string country, string experienceJson, string educationJson, Supabase.Client client)
    {
        try
        {
            // Check if guest user already exists
            var existingUser = await client.From<ApplicationUser>()
                .Where(u => u.Id == guestUserId)
                .Single();

            if (existingUser != null)
            {
                Console.WriteLine($"✅ Guest user already exists: {guestUserId}");

                // Update existing user with new experience and education data if provided
                bool needsUpdate = false;

                if (!string.IsNullOrEmpty(experienceJson))
                {
                    try
                    {
                        var experienceElements = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(experienceJson);
                        if (experienceElements != null && experienceElements.Count > 0)
                        {
                            existingUser.Experiences = experienceElements.Select(JsonElementToDictionary).ToList();
                            needsUpdate = true;
                            Console.WriteLine($"📝 Updating guest user experience data with {existingUser.Experiences.Count} entries");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Failed to parse experience JSON for existing user: {ex.Message}");
                    }
                }

                if (!string.IsNullOrEmpty(educationJson))
                {
                    try
                    {
                        var educationElements = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(educationJson);
                        if (educationElements != null && educationElements.Count > 0)
                        {
                            existingUser.Education = educationElements.Select(JsonElementToDictionary).ToList();
                            needsUpdate = true;
                            Console.WriteLine($"🎓 Updating guest user education data with {existingUser.Education.Count} entries");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Failed to parse education JSON for existing user: {ex.Message}");
                    }
                }

                if (needsUpdate)
                {
                    await client.From<ApplicationUser>().Update(existingUser);
                    Console.WriteLine($"✅ Updated existing guest user with new data");
                }

                return;
            }
        }
        catch
        {
            // User doesn't exist, we'll create it
        }

        // Parse experience and education data
        var experienceData = new List<Dictionary<string, object>>();
        var educationData = new List<Dictionary<string, object>>();

        if (!string.IsNullOrEmpty(experienceJson))
        {
            try
            {
                var experienceElements = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(experienceJson);
                if (experienceElements != null)
                {
                    experienceData = experienceElements.Select(JsonElementToDictionary).ToList();
                    Console.WriteLine($"✅ Parsed {experienceData.Count} experience entries");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to parse experience JSON: {ex.Message}");
            }
        }

        if (!string.IsNullOrEmpty(educationJson))
        {
            try
            {
                var educationElements = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(educationJson);
                if (educationElements != null)
                {
                    educationData = educationElements.Select(JsonElementToDictionary).ToList();
                    Console.WriteLine($"✅ Parsed {educationData.Count} education entries");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to parse education JSON: {ex.Message}");
            }
        }

        // Create guest user record
        var guestUser = new ApplicationUser
        {
            Id = guestUserId,
            Email = email,
            Password = "guest_user_no_password", // Guest users don't have passwords
            FirstName = firstName,
            LastName = lastName,
            CreatedAt = DateTime.UtcNow,
            IsActive = false, // Guest users are inactive (can't log in)
            IsPublic = true, // Mark as public/guest user
            Roles = "Guest",
            PhoneNumber = phoneNumber,
            Location = new Dictionary<string, object>
            {
                ["city"] = city,
                ["country"] = country
            },
            // Initialize optional fields with parsed data
            ResumeList = new List<Dictionary<string, object>>(),
            Education = educationData,
            Experiences = experienceData,
            SocialLink = new Dictionary<string, object>()
        };

        await client.From<ApplicationUser>().Upsert(guestUser);
        Console.WriteLine($"✅ Created guest user record: {guestUserId}");
        Console.WriteLine($"📊 Guest user created with {guestUser.Experiences?.Count ?? 0} experience entries and {guestUser.Education?.Count ?? 0} education entries");
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private static async Task AddResumeToGuestUser(string guestUserId, Dictionary<string, object> resumeEntry, Supabase.Client client)
    {
        try
        {
            // Get current user data
            var userResponse = await client.From<ApplicationUser>()
                .Where(u => u.Id == guestUserId)
                .Single();

            if (userResponse != null)
            {
                // Get current resume list or create new one
                var currentResumeList = userResponse.ResumeList ?? new List<Dictionary<string, object>>();

                // Add new resume entry
                currentResumeList.Add(resumeEntry);

                // Update user's resume list
                var updateResponse = await client.From<ApplicationUser>()
                    .Where(u => u.Id == guestUserId)
                    .Set(u => u.ResumeList, currentResumeList)
                    .Update();

                Console.WriteLine($"✅ Added resume to guest user {guestUserId} ResumeList");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Failed to add resume to guest user ResumeList: {ex.Message}");
            // Don't fail the application if resume list update fails
        }
    }

    private static string BuildGuestCoverLetter(string firstName, string lastName, string email,
    string phoneNumber, string city, string country, string coverLetter)
    {
        var guestInfo = $"Guest Application from {firstName} {lastName}\n";
        guestInfo += $"Email: {email}\n";
        guestInfo += $"Phone: {phoneNumber}\n";
        guestInfo += $"Location: {city}, {country}\n\n";

        if (!string.IsNullOrEmpty(coverLetter))
        {
            guestInfo += "Cover Letter:\n" + coverLetter;
        }

        return guestInfo;
    }

    // Helper method to convert JsonElement to Dictionary (same as in AuthenticationEndpoints)
    private static Dictionary<string, object> JsonElementToDictionary(System.Text.Json.JsonElement element)
    {
        var dict = new Dictionary<string, object>();

        if (element.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                dict[property.Name] = JsonElementToObject(property.Value);
            }
        }

        return dict;
    }

    // Helper method to convert JsonElement to proper object (same as in AuthenticationEndpoints)
    private static object JsonElementToObject(System.Text.Json.JsonElement element)
    {
        switch (element.ValueKind)
        {
            case System.Text.Json.JsonValueKind.String:
                return element.GetString() ?? "";
            case System.Text.Json.JsonValueKind.Number:
                if (element.TryGetInt32(out int intValue))
                    return intValue;
                if (element.TryGetDouble(out double doubleValue))
                    return doubleValue;
                return element.GetDecimal();
            case System.Text.Json.JsonValueKind.True:
                return true;
            case System.Text.Json.JsonValueKind.False:
                return false;
            case System.Text.Json.JsonValueKind.Null:
                return null;
            case System.Text.Json.JsonValueKind.Object:
                var dict = new Dictionary<string, object>();
                foreach (var property in element.EnumerateObject())
                {
                    dict[property.Name] = JsonElementToObject(property.Value);
                }
                return dict;
            case System.Text.Json.JsonValueKind.Array:
                return element.EnumerateArray().Select(JsonElementToObject).ToList();
            default:
                return element.ToString();
        }
    }
}
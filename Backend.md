AI-HR Platform: Dotnet Backend Summary

  This document provides a detailed overview of the ASP.NET Core web API backend for the AI-HR platform.
  Built with .NET 9.0, it uses a minimal API architecture to provide a robust and scalable foundation for
  the application's features.


  Core Architecture

  The backend is responsible for handling all business logic, data storage, and communication with external
  services. It's designed to be a stateless service that interacts with a Supabase instance for data
  persistence and a frontend application (presumably Next.js, based on the CORS configuration).


   * `Program.cs`: The application's entry point. It configures all services, middleware, and dependencies.
     This includes setting up JWT authentication, Supabase client, CORS policy for the frontend, session
     management, and Swagger for API documentation. It then maps all the API endpoints.
   * `ai-hr.csproj`: The project file defines the application's framework (net9.0) and its NuGet package
     dependencies. Key dependencies include:
       * Supabase: For database interactions with Supabase (Postgres).
       * Microsoft.AspNetCore.Authentication.JwtBearer: For handling JWT-based authentication.
       * Swashbuckle.AspNetCore: For generating the Swagger/OpenAPI documentation.
       * BCrypt.Net-Next: For securely hashing user passwords.
       * DotNetEnv: For loading environment variables from a .env file.
   * `Services/`: This directory contains the core business logic, abstracted into injectable services. This
     promotes separation of concerns and testability. Examples include AuthenticationService, JwtService, and
     JobViewTrackingService.
   * `Contracts/`: This directory holds the Data Transfer Objects (DTOs). These classes define the "shape" of
     the data sent to and from the API, creating a clear contract and decoupling the API's public interface
     from the internal database models.
   * `Properties/launchSettings.json`: Contains development environment configuration, such as port numbers
     and environment variables for local debugging.

  ---


  Endpoints (API Routes)

  The API is organized into a series of endpoint groups, each corresponding to a specific resource. This is
  done using the Minimal API MapGroup feature, with each file extending IEndpointRouteBuilder.


   * `AuthenticationEndpoints.cs`: Handles registration and login for standard users (candidates).
   * `HiringUserProfileAuthenticationEndpoints.cs`: Provides separate authentication routes for hiring
     managers and recruiters.
   * `UserEndpoints.cs`: Manages user profile data for candidates.
   * `HiringUserProfileEndpoints.cs`: Manages profile data for hiring users.
   * `CompanyEndpoints.cs`: Exposes CRUD (Create, Read, Update, Delete) operations for company profiles.
   * `JobEndpoints.cs`: Manages job postings, including creating new jobs, updating existing ones, and
     retrieving job details.
   * `ApplicationDetailEndpoints.cs`: Handles the submission and management of job applications.
   * `CandidateEndpoints.cs`: Provides routes for fetching candidate information, likely for recruiters to
     view applicants.
   * `CandidateRankingEndpoints.cs`: An AI-related endpoint used to rank candidates for a specific job,
     probably based on resume content and job description matching.
   * `InterviewEndpoints.cs`: Manages the interview process, including scheduling interviews and defining
     interview stages.
   * `RoundConfigurationEndpoints.cs`: Allows for the configuration of specific interview rounds (e.g.,
     technical screen, HR interview).
   * `NotesEndpoints.cs`: Enables hiring managers to add and view notes associated with candidates or
     applications.
   * `SavedJobsEndpoints.cs`: Allows users to save jobs they are interested in and view their saved list.
   * `StorageBucketEndpoints.cs`: Manages file uploads and retrievals, likely for resumes and other documents,
     interfacing with Supabase Storage.
   * `LanggraphEndpoints.cs`: Suggests an integration with a service named "LangGraph," likely a framework or
     platform for building AI agents or chains, used here for features like the "Search Assistant."

  ---

  Data Models

  The Models/ directory contains the C# classes that map directly to the tables in the Supabase Postgres
  database. These classes represent the core entities of the application.


   * `ApplicationUser.cs`: Represents a standard user of the platform, typically a job seeker or candidate.
     Contains properties like Id, Email, FirstName, LastName, and a hashed password.
   * `HiringUser.cs`: Represents a user with recruitment privileges (e.g., a recruiter or hiring manager).
     Linked to a Company.
   * `Company.cs`: Represents a company that posts jobs. Contains details like CompanyName, CompanyWebsite,
     and CompanyDescription.
   * `Job.cs`: The central model for a job posting. Includes fields like JobTitle, Description, Location,
     Salary, Status (using the JobStatus enum), and a link to the hiring Company.
   * `ApplicationDetail.cs`: Represents a single job application, linking a Job to an ApplicationUser. It
     likely stores the application date, status, and references to submitted documents.
   * `CandidateRanking.cs`: Stores the output of the AI ranking feature. It links a candidate
     (ApplicationUser) to a Job and includes a Score and potentially an Explanation for the ranking.
   * `JobStatusHistory.cs`: A log table that tracks all changes to a job's status (e.g., from Draft to Open
     to Closed), providing an audit trail.
   * `JobView.cs`: Tracks when a job posting is viewed, helping to gather analytics on job visibility.
   * Interview-Related Models:
       * `InterviewTemplate.cs`: A reusable template for a multi-stage interview process.
       * `InterviewRound.cs`: Defines a specific round within an interview (e.g., "Phone Screen").
       * `RoundConfiguration.cs`: The specific configuration of a round for a particular job's interview
         process.
       * `DefaultRoundConfiguration.cs`: Provides default settings for new interview rounds.
       * `RoundQuestion.cs`: A specific question to be asked during an interview round.
       * `RoundScoringCriteria.cs`: The criteria used to score a candidate's performance in a round.
   * `JwtSettings.cs`: A configuration model used to load JWT settings (secret key, issuer, audience) from
     appsettings.json.
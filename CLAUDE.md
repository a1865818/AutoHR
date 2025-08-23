# AI-HR Platform - Claude Development Guide

## Project Overview

This is a comprehensive AI-powered HR recruitment platform built with:
- **Frontend**: Next.js 15+ with React 19, TypeScript, Tailwind CSS 4
- **Backend**: .NET 9.0 Web API with minimal API architecture
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: JWT-based authentication with refresh tokens
- **External Integrations**: Google Calendar, Gmail, LangGraph AI

## Architecture Summary

### Frontend (React/Next.js)
The frontend uses Next.js App Router with a sophisticated folder structure supporting multiple user types and workflows.

**Key Technologies:**
- Next.js 15.1.8 with App Router
- React 19.1.0 with modern features
- TypeScript for type safety
- Tailwind CSS 4 for styling
- Lucide React for icons

### Backend (.NET)
The backend follows minimal API architecture with dependency injection, JWT authentication, and clean separation of concerns.

**Key Technologies:**
- .NET 9.0 Web API
- Supabase client for database operations
- JWT Bearer authentication
- BCrypt for password hashing
- Google APIs for Calendar and Gmail
- Swagger/OpenAPI documentation

### Database (Supabase/PostgreSQL)
Comprehensive schema supporting all HR workflows with proper relationships and constraints.

## Project Structure

### Frontend Structure (`react-frontEnd/ai-hr/src/`)

```
├── app/                          # Next.js App Router pages
│   ├── (authorize)/             # Auth routes (login, signup, forgot-password)
│   ├── (main)/                  # Hiring manager/recruiter routes
│   ├── applicant/               # Job seeker routes
│   └── public/                  # Public job board
├── components/                   # Reusable UI components
│   ├── auth/                    # Authentication components
│   ├── candidates/              # Candidate management UI
│   ├── jobs/                    # Job posting and management
│   ├── interview_pipeline/      # Interview process management
│   ├── profile/                 # User profile components
│   └── settings/                # Application settings
├── services/                    # API service layer
├── hooks/                       # Custom React hooks
├── contexts/                    # React context providers
├── interfaces/                  # TypeScript type definitions
└── utils/                       # Utility functions
```

### Backend Structure (`dotnet-backend/ai-hr/`)

```
├── Program.cs                   # Application entry point & configuration
├── Models/                      # Database entity models
├── Services/                    # Business logic services
├── Endpoints/                   # API endpoint definitions
├── Contracts/                   # DTOs and request/response models
└── Enums/                      # Enumeration types
```

## Development Standards & Coding Rules

### Frontend (React/Next.js) Standards

#### Component Design Patterns
```typescript
// ✅ GOOD: Consistent component structure
interface ComponentProps {
  id: string;
  title: string;
  onAction: (data: any) => void;
}

const Component: React.FC<ComponentProps> = ({ id, title, onAction }) => {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
};

export default Component;
```

#### Button Component Standards
Use the existing button patterns consistently across the application:

```typescript
// ✅ Primary Action Button
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
  Primary Action
</button>

// ✅ Secondary Button
<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border transition-colors">
  Secondary Action
</button>

// ✅ Danger/Delete Button
<button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
  Delete
</button>

// ✅ Loading State
<button disabled className="bg-blue-600 opacity-50 cursor-not-allowed text-white px-4 py-2 rounded-lg">
  <Loader2 className="w-4 h-4 animate-spin mr-2" />
  Loading...
</button>
```

#### Toast Notification Standards
Always use the centralized toast utility:

```typescript
// ✅ Import the toast utility
import { showToast } from '@/utils/toast';

// ✅ Success toast
showToast.success('Operation completed successfully');

// ✅ Error toast
showToast.error('An error occurred while processing your request');

// ✅ Warning toast
showToast.warning('Please review your input');

// ✅ Info toast
showToast.info('Additional information available');
```

#### Form Validation Standards
```typescript
// ✅ Consistent form validation pattern
interface FormData {
  email: string;
  password: string;
}

const validateForm = (data: FormData): string[] => {
  const errors: string[] = [];
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please enter a valid email address');
  }
  
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  return errors;
};
```

#### Loading State Standards
```typescript
// ✅ Use LoadingState component consistently
import { LoadingState } from '@/components/ui/LoadingState';

const Component = () => {
  if (loading) {
    return <LoadingState message="Loading candidates..." />;
  }
  
  return <div>{/* Component content */}</div>;
};
```

#### Error Handling Standards
```typescript
// ✅ Consistent error handling pattern
const handleApiCall = async () => {
  try {
    setLoading(true);
    const result = await apiService.fetchData();
    setData(result);
    showToast.success('Data loaded successfully');
  } catch (error) {
    console.error('API Error:', error);
    showToast.error(error.message || 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};
```

#### TypeScript Standards
```typescript
// ✅ Always use proper typing
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ✅ Use enums for constants
enum UserRole {
  ADMIN = 'admin',
  HIRING_MANAGER = 'hiring_manager',
  RECRUITER = 'recruiter',
  APPLICANT = 'applicant'
}

// ✅ Type API responses
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

### Backend (.NET) Standards

#### API Endpoint Standards
```csharp
// ✅ Consistent endpoint structure
public static void MapJobEndpoints(this IEndpointRouteBuilder app)
{
    var group = app.MapGroup("/api/jobs")
        .WithTags("Jobs")
        .RequireAuthorization();

    group.MapGet("/", GetJobs)
        .WithSummary("Get all jobs")
        .WithDescription("Retrieves paginated list of jobs with optional filtering");
        
    group.MapPost("/", CreateJob)
        .WithSummary("Create new job")
        .WithDescription("Creates a new job posting");
}

// ✅ Input validation
private static async Task<IResult> CreateJob(
    CreateJobRequest request, 
    Supabase.Client supabase,
    ILogger logger)
{
    // Validate input
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { message = "Job title is required" });
    }

    try 
    {
        // Business logic
        var job = new Job { /* ... */ };
        await supabase.From<Job>().Insert(job);
        
        logger.LogInformation("Job created with ID: {JobId}", job.Id);
        return Results.Created($"/api/jobs/{job.Id}", job);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error creating job");
        return Results.Problem("An error occurred while creating the job");
    }
}
```

#### Service Layer Standards
```csharp
// ✅ Interface-based services
public interface IJobService
{
    Task<Job> CreateJobAsync(CreateJobRequest request);
    Task<PagedResult<Job>> GetJobsAsync(JobFilter filter, int page, int pageSize);
    Task<Job?> GetJobByIdAsync(Guid id);
    Task UpdateJobAsync(Guid id, UpdateJobRequest request);
    Task DeleteJobAsync(Guid id);
}

// ✅ Service implementation with proper error handling
public class JobService : IJobService
{
    private readonly Supabase.Client _supabase;
    private readonly ILogger<JobService> _logger;

    public JobService(Supabase.Client supabase, ILogger<JobService> logger)
    {
        _supabase = supabase ?? throw new ArgumentNullException(nameof(supabase));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Job> CreateJobAsync(CreateJobRequest request)
    {
        ValidateCreateJobRequest(request);
        
        var job = MapToJob(request);
        
        try
        {
            await _supabase.From<Job>().Insert(job);
            _logger.LogInformation("Job created with ID: {JobId}", job.Id);
            return job;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating job with title: {Title}", request.Title);
            throw new JobCreationException("Failed to create job", ex);
        }
    }
}
```

#### Model Validation Standards
```csharp
// ✅ Use data annotations for validation
public class CreateJobRequest
{
    [Required(ErrorMessage = "Job title is required")]
    [StringLength(200, ErrorMessage = "Job title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Job description is required")]
    [StringLength(5000, MinimumLength = 100, ErrorMessage = "Job description must be between 100 and 5000 characters")]
    public string Description { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "Salary must be a positive value")]
    public decimal? SalaryMin { get; set; }

    [EmailAddress(ErrorMessage = "Please provide a valid email address")]
    public string? ContactEmail { get; set; }
}
```

#### Error Handling Standards
```csharp
// ✅ Custom exceptions for domain-specific errors
public class JobNotFoundException : Exception
{
    public JobNotFoundException(Guid jobId) 
        : base($"Job with ID {jobId} was not found")
    {
        JobId = jobId;
    }
    
    public Guid JobId { get; }
}

// ✅ Global error handling middleware
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            JobNotFoundException => new { message = exception.Message, statusCode = 404 },
            UnauthorizedAccessException => new { message = "Access denied", statusCode = 401 },
            ValidationException => new { message = exception.Message, statusCode = 400 },
            _ => new { message = "An internal server error occurred", statusCode = 500 }
        };

        context.Response.StatusCode = response.statusCode;
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
```

## Security Standards (CRITICAL)

### Frontend Security Rules

#### Authentication & Authorization
```typescript
// ✅ Always check authentication status
const useAuth = () => {
  const { user, isLoading } = useContext(AuthContext);
  
  if (isLoading) return { user: null, isLoading: true };
  if (!user) throw new Error('Authentication required');
  
  return { user, isLoading: false };
};

// ✅ Protected route pattern
const ProtectedPage = () => {
  const { user } = useAuth();
  
  if (!user) {
    redirect('/login');
    return null;
  }
  
  return <div>{/* Protected content */}</div>;
};
```

#### Input Sanitization
```typescript
// ✅ Always sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim());
};

// ✅ Validate all form inputs
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};
```

#### Secure API Calls
```typescript
// ✅ Always include authentication headers
const apiClient = {
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle token expiration
        await refreshToken();
        throw new Error('Authentication required');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
};
```

### Backend Security Rules

#### Authentication & Authorization
```csharp
// ✅ Always validate JWT tokens
[Authorize]
public static async Task<IResult> GetJobs(
    HttpContext context,
    Supabase.Client supabase,
    ILogger logger)
{
    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
    {
        return Results.Unauthorized();
    }

    // Continue with authorized logic
}

// ✅ Role-based authorization
[Authorize(Roles = "HiringManager,Recruiter")]
public static async Task<IResult> CreateJob(/* parameters */)
{
    // Only hiring managers and recruiters can create jobs
}
```

#### Input Validation & Sanitization
```csharp
// ✅ Always validate and sanitize inputs
public class InputValidator
{
    public static string SanitizeString(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;
            
        // Remove potentially dangerous characters
        return Regex.Replace(input.Trim(), @"[<>""'%;()&+]", "");
    }

    public static bool IsValidEmail(string email)
    {
        if (string.IsNullOrEmpty(email) || email.Length > 254)
            return false;
            
        return Regex.IsMatch(email, @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
    }

    public static bool IsValidGuid(string guid)
    {
        return Guid.TryParse(guid, out _);
    }
}
```

#### SQL Injection Prevention
```csharp
// ✅ Always use parameterized queries (Supabase handles this)
public async Task<List<Job>> GetJobsByTitle(string title)
{
    // Supabase automatically parameterizes queries
    var jobs = await _supabase
        .From<Job>()
        .Where(j => j.Title.Contains(title))  // Safe with Supabase
        .Get();
    
    return jobs.Models;
}

// ✅ Additional validation for complex queries
public async Task<List<Job>> SearchJobs(string searchTerm)
{
    if (string.IsNullOrWhiteSpace(searchTerm))
        return new List<Job>();
        
    // Sanitize search term
    searchTerm = InputValidator.SanitizeString(searchTerm);
    
    if (searchTerm.Length > 100)
        throw new ArgumentException("Search term too long");
        
    return await GetJobsByTitle(searchTerm);
}
```

#### Sensitive Data Protection
```csharp
// ✅ Never expose sensitive data
public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    // ❌ NEVER include password, refresh tokens, or other sensitive data
    // public string Password { get; set; }  // NEVER!
}

// ✅ Log securely
_logger.LogInformation("User {UserId} accessed job {JobId}", userId, jobId);
// ❌ NEVER log sensitive data
// _logger.LogInformation("User {Email} with password {Password}", email, password);  // NEVER!
```

#### Rate Limiting & Security Headers
```csharp
// ✅ Implement rate limiting
app.Use(async (context, next) =>
{
    // Add security headers
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    
    await next();
});

// ✅ CORS configuration
app.UseCors(policy =>
{
    policy.WithOrigins(allowedOrigins)  // Never use "*" in production
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials();
});
```

### Database Security Rules

#### Access Control
```sql
-- ✅ Always use Row Level Security (RLS) in Supabase
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- ✅ Create policies for data access
CREATE POLICY "Users can view published jobs" ON jobs
    FOR SELECT USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Hiring users can manage their company's jobs" ON jobs
    FOR ALL USING (
        created_by = auth.uid() OR 
        company_id IN (
            SELECT company_id FROM hiring_user_profiles 
            WHERE id = auth.uid()
        )
    );
```

#### Data Encryption
```csharp
// ✅ Always hash passwords
public static string HashPassword(string password)
{
    return BCrypt.Net.BCrypt.HashPassword(password, 12); // High work factor
}

public static bool VerifyPassword(string password, string hash)
{
    return BCrypt.Net.BCrypt.Verify(password, hash);
}

// ✅ Encrypt sensitive data before storing
public static string EncryptSensitiveData(string data, string key)
{
    // Use proper encryption for sensitive data like SSNs, etc.
    using var aes = Aes.Create();
    // Implementation details...
}
```

### Security Checklist

#### Before Every Deployment
- [ ] All user inputs validated and sanitized
- [ ] Authentication required for all protected endpoints
- [ ] Authorization checks implemented for role-based access
- [ ] No sensitive data in logs or error messages
- [ ] CORS properly configured (no wildcards in production)
- [ ] Rate limiting implemented
- [ ] Security headers added
- [ ] Database Row Level Security enabled
- [ ] All secrets stored in environment variables
- [ ] HTTPS enforced in production
- [ ] Input length limits enforced
- [ ] SQL injection protection verified
- [ ] XSS protection implemented
- [ ] CSRF protection for state-changing operations

## Key Features & Workflows

### 1. User Management & Authentication
- **Dual User Types**: Application users (job seekers) and hiring users (recruiters/managers)
- **Company Association**: Hiring users belong to companies
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Role-based Access**: Different permissions for different user types

### 2. Job Management
- **Job Posting**: Create, edit, publish jobs with rich descriptions
- **Job Templates**: Reusable templates for consistent posting
- **Application Tracking**: Track all applications and their status
- **Job Analytics**: View counts, application rates, etc.

### 3. Candidate Management
- **Application Processing**: Handle incoming job applications
- **Candidate Ranking**: AI-powered candidate ranking and matching
- **Interview Pipeline**: Multi-stage interview process management
- **Communication**: Email templates and bulk communication

### 4. Interview System
- **Template-based**: Reusable interview templates
- **Multi-round Support**: Phone screening, technical assessment, video interviews, etc.
- **Assessment Management**: Coding challenges, technical assessments with scoring
- **Calendar Integration**: Google Calendar integration for scheduling

### 5. AI Features
- **Candidate Ranking**: AI scoring based on job-resume matching
- **LangGraph Integration**: Search assistant and AI-powered features
- **Resume Parsing**: Automated resume analysis
- **Skill Matching**: Match candidate skills to job requirements

## Database Schema Overview

### Core Entities

#### Users & Authentication
- `ApplicationUser`: Job seekers/candidates
- `HiringUser`: Recruiters and hiring managers
- `Companies`: Company profiles and information

#### Job Management
- `Jobs`: Job postings with comprehensive details
- `ApplicationDetails`: Job applications with status tracking
- `JobStatusHistory`: Audit trail for job status changes
- `JobViews`: Analytics for job viewing

#### Interview System
- `InterviewTemplates`: Reusable interview processes
- `InterviewRounds`: Individual interview stages
- `RoundConfigurations`: Job-specific round configurations
- `RoundQuestions`: Interview questions
- `RoundScoringCriteria`: Scoring matrices

#### Assessment System
- `AssessmentSubmissions`: Candidate assessment submissions
- `AssessmentGrades`: Grading and scoring results

#### Communication
- `EmailTemplates`: Customizable email templates
- `EmailQueue`: Email sending queue
- `EmailHistory`: Email sending history

#### AI & Analytics
- `CandidateRankings`: AI-powered candidate scores
- `GoogleCalendarEvents`: Calendar integration data

## Development Guidelines

### Frontend Development

#### Page Routes
- **Hiring Users**: Routes under `(main)/` require hiring authentication
- **Applicants**: Routes under `applicant/` for job seekers
- **Public**: Routes under `public/` for unauthenticated users

#### Component Organization
- **Feature-based**: Components grouped by functionality
- **Shared Components**: Reusable UI elements in root `components/`
- **Page-specific**: Components specific to certain pages

#### State Management
- **Context API**: For global state (auth, saved jobs)
- **Local State**: React hooks for component-specific state
- **API Layer**: Centralized API calls in `services/`

### Backend Development

#### API Design
- **Minimal APIs**: Using .NET minimal API pattern
- **Resource-based**: Endpoints grouped by resource type
- **RESTful**: Following REST conventions where applicable

#### Service Layer
- **Interface-based**: All services implement interfaces
- **Dependency Injection**: Services registered in `Program.cs`
- **Business Logic**: Kept separate from API endpoints

#### Database Access
- **Supabase Client**: Direct integration with Supabase
- **Real-time**: Leveraging Supabase real-time capabilities
- **Migrations**: Schema managed through Supabase dashboard

### Common Development Patterns

#### Authentication Flow
1. User logs in through frontend
2. Backend validates credentials
3. JWT token issued with refresh token
4. Frontend stores tokens securely
5. API requests include Bearer token

#### Data Flow
1. Frontend makes API request through service layer
2. Backend endpoint validates request
3. Service layer processes business logic
4. Database operations through Supabase client
5. Response formatted and returned

## API Endpoints Overview

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login  
- `POST /hiring-auth/*` - Hiring user authentication

### Job Management
- `GET /jobs` - List jobs
- `POST /jobs` - Create job
- `PUT /jobs/{id}` - Update job
- `GET /jobs/{id}/applications` - Get applications

### Candidate Management
- `GET /candidates` - List candidates
- `POST /candidates/rank` - AI ranking
- `PUT /applications/{id}` - Update application status

### Interview Management
- `GET /interview-templates` - List templates
- `POST /round-configurations` - Configure rounds
- `POST /assessments` - Submit assessments

## Key Integrations

### Google Services
- **Gmail API**: For sending recruitment emails
- **Calendar API**: For interview scheduling
- **OAuth 2.0**: For secure authentication

### AI Services
- **LangGraph**: For AI-powered search and recommendations
- **Resume Parsing**: Automated extraction of candidate information
- **Skill Matching**: AI-based job-candidate matching

## Environment Configuration

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5189
# Other frontend env vars
```

### Backend (.env)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET_KEY=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000
```

## Development Commands

### Frontend
```bash
cd react-frontEnd/ai-hr
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run linting
```

### Backend
```bash
cd dotnet-backend/ai-hr
dotnet run       # Start development server
dotnet build     # Build project
```

## Testing Strategy

### Frontend Testing
- Component testing with React Testing Library
- Integration testing for critical user flows
- E2E testing for complete workflows

### Backend Testing
- Unit tests for service layer
- Integration tests for API endpoints
- Database tests with test fixtures

## Performance Optimizations

### Frontend
- React virtualization for long lists
- Lazy loading of components
- Image optimization
- Code splitting

### Backend
- Database indexing on frequently queried fields
- Efficient pagination
- Caching strategies
- Connection pooling

## Deployment Architecture

### Frontend
- Vercel or similar hosting platform
- Environment-specific configurations
- CDN for static assets

### Backend
- Azure App Service or similar
- Environment variables for configuration
- Health checks and monitoring

### Database
- Supabase managed PostgreSQL
- Automated backups
- Connection pooling
- Real-time subscriptions

## Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Mobile app support
- More AI integrations
- Enhanced reporting
- Bulk operations
- Advanced search and filtering

### Technical Improvements
- Microservices architecture
- Event-driven architecture
- Enhanced caching
- Performance monitoring
- Automated testing pipeline

## Troubleshooting Common Issues

### Authentication Issues
- Check JWT secret configuration
- Verify token expiration
- Confirm CORS settings

### Database Connection
- Verify Supabase credentials
- Check connection string format
- Confirm network accessibility

### API Integration
- Check endpoint URLs
- Verify request/response formats
- Monitor rate limits

This guide provides a comprehensive understanding of the AI-HR platform architecture, helping developers navigate and contribute to the codebase effectively.
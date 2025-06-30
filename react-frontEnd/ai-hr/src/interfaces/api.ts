// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Login/Auth related interfaces (existing)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userCategory: string;
  userType?: string;
  companyId?: string;
  bio?: string;
  linkedinUrl?: string;
  location?: any;
  preferences?: any;
}

export interface ApplicationUserRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userCategory: string;
  userType?: string;
  companyId?: string;
  tokenExpiresAt: string;
}

export interface ApplicationUserLoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  tokenExpiresAt: string;
}

export interface CompanyRegisterRequest {
  name: string;
  industry: string;
  companySize: string;
  website: string;
  headquarters: {
    city: string;
    state: string;
    country: string;
  };
  email: string;
  description: string;
  logoUrl?: string;
}

export interface CompanyRegisterResponse {
  id: string;
  name: string;
  industry: string;
  companySize: string;
  website: string;
  headquarters: {
    city: string;
    state: string;
    country: string;
  };
  email: string;
  description: string;
  logoUrl?: string;
  createdAt: string;
}

// Enhanced user registration for hiring users with company data
export interface HiringUserRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  userType: "hiring";
  companyId?: string | number;
  companyData?: CompanyRegisterRequest;
}

// Application user registration (enhanced)
export interface ApplicationUserRegisterRequestEnhanced {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "application";
}
//Job API interfaces

// API Response types based on your backend models
export interface InterviewRound {
  id: string;
  type: string;
  name: string;
  roundOrder: number;
  isRequired: boolean;
  estimatedDuration?: number;
  description?: string;
}

export interface InterviewTemplate {
  id: string;
  name: string;
  rounds: InterviewRound[];
}

export interface ApiJob {
  id: string;
  title: string;
  companyId: string;
  createdBy: string;
  description: string;
  department?: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  employmentType: string;
  seniorityLevel: string;
  experienceYearsMin?: number;
  locationType: string;
  locations: Record<string, any>;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  applicationDeadline?: string;
  status: string;
  applicantCount: number;
  viewCount?: number;
  aiGeneratedDescription: boolean;
  skillMatchThreshold: number;
  postedDate?: string;
  closedDate?: string;
  createdAt: string;
  interviewTemplateId?: string;
  interviewTemplate?: InterviewTemplate;
}

// Add new interfaces for view tracking API responses
export interface JobViewTrackingResponse {
  success: boolean;
  message: string;
  viewRecorded: boolean;
  totalViews: number;
}

export interface JobAnalyticsResponse {
  jobId: string;
  jobTitle: string;
  totalViews: number;
  uniqueViewers: number;
  viewsByUserType: {
    HiringUser: number;
    ApplicationUser: number;
    Anonymous: number;
  };
  viewsByDate: Record<string, number>;
  recentViews: Array<{
    viewedAt: string;
    userType: string;
    ipAddress: string;
    userAgent: string;
  }>;
  applicantCount: number;
  applicationRate: number;
  postedDate: string;
}

export interface FixViewCountsResponse {
  message: string;
  totalJobs: number;
  updatedJobs: number;
  errors: number;
  success: boolean;
}

export interface ApiCompany {
  id: string;
  name: string;
  description: string;
  website: string;
  logoUrl: string;
  industry: string;
  companySize: string;
  headquarters: Record<string, string>;
  foundedYear?: number;
  isVerified: boolean;
  createdAt: string;
}

export interface CreateJobRequest {
  title: string;
  companyId: string;
  createdBy: string;
  description: string;
  department: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  employmentType: string;
  seniorityLevel: string;
  experienceYearsMin?: number;
  locationType: string;
  locations: Record<string, any>;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  applicationDeadline?: string;
  status: string;
  aiGeneratedDescription: boolean;
  skillMatchThreshold: number;
  interviewTemplateId?: string;
}

export interface UpdateJobRequest {
  title?: string;
  department?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  qualifications?: string[];
  benefits?: string[];
  employmentType?: string;
  seniorityLevel?: string;
  experienceYearsMin?: number;
  locationType?: string;
  locations?: Record<string, any>;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applicationDeadline?: string;
  status?: string;
  aiGeneratedDescription?: boolean;
  skillMatchThreshold?: number;
  postedDate?: string;
  closedDate?: string;
  interviewTemplateId?: string;
}

//Apply api

// Application API interfaces - matching your ApplicationDetail model
export interface CreateApplicationDetailRequest {
  jobId: string; // Guid as string
  candidateUserId: string; // Guid as string
  resumeUrl?: string;
  coverLetterText?: string;
  expectedSalary?: number; // decimal? in C#
  availabilityDate?: string; // DateTime? as ISO string
  jobSource?: string;
  aiAnalysis?: Record<string, any>; // Dictionary<string, object>
}

export interface UpdateApplicationDetailRequest {
  resumeUrl?: string;
  coverLetterText?: string;
  expectedSalary?: number;
  availabilityDate?: string;
  status?: string;
  stage?: string;
  jobSource?: string;
  overallAiScore?: number;
  aiAnalysis?: Record<string, any>;
}

export interface ApplicationDetailResponse {
  id: string;
  jobId: string;
  candidateUserId: string;
  resumeUrl?: string;
  coverLetterText?: string;
  expectedSalary?: number;
  availabilityDate?: string;
  status?: string; // Default: "applied"
  stage?: string; // Default: "initial_review"
  jobSource?: string;
  overallAiScore?: number;
  appliedAt: string; // DateTime as ISO string
  statusChangedAt: string; // DateTime as ISO string
}

// ApplicationUser interfaces
export interface ApplicationUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  refreshToken?: string;
  refreshTokenExpiry?: string;
  isActive: boolean;
  roles: string; // Default: "User"
}

// Additional types for frontend use
export interface ApplicationWithJobDetails extends ApplicationDetailResponse {
  job?: {
    title: string;
    company: string;
    location: string;
    employmentType: string;
    status: string;
    department?: string;
    salary?: {
      min: number;
      max: number;
      currency: string;
      period: string;
    };
  };
}

export interface ApplicationSummary {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  applicationsByStage: Record<string, number>;
  recentApplications: ApplicationDetailResponse[];
}

export interface ApplicationFilters {
  status: string[];
  stage: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
  company: string[];
  jobTitle: string;
}

// Error response format
export interface ApiErrorResponse {
  error: string;
  details?: string;
}

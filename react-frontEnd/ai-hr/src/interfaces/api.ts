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

//Job API interfaces

// API Response types based on your backend models
export interface ApiJob {
  id: string;
  title: string;
  companyId: string;
  createdBy: string;
  description: string;
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
  viewCount: number;
  aiGeneratedDescription: boolean;
  skillMatchThreshold: number;
  postedDate?: string;
  closedDate?: string;
  createdAt: string;
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
}

export interface UpdateJobRequest {
  title?: string;
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
  };
}

export interface ApplicationSummary {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  applicationsByStage: Record<string, number>;
  recentApplications: ApplicationDetailResponse[];
}

// Error response format
export interface ApiErrorResponse {
  error: string;
  details?: string;
}

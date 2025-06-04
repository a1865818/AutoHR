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

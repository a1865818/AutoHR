export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: "On-site" | "Remote" | "Hybrid";
  type: "Full-Time" | "Part-Time" | "Contract" | "Internship";
  department: string;
  experience: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: "per hour" | "per month" | "per year";
  };
  description: string;
  requirements: string[];
  qualifications: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  applicationSettings: {
    deadline: string;
    questionsRequired: boolean;
    resumeRequired: boolean;
    coverLetterRequired: boolean;
    portfolioRequired: boolean;
  };
  postedDate: string;
  status: "Draft" | "Active" | "Paused" | "Closed" | "Expired";
  applicants: number;
  viewCount: number;
  createdBy: string;
  updatedAt: string;
}

export interface JobFormData {
  title: string;
  company?: string;
  department?: string;
  description: string;
  city: string;
  country: string;
  locationType: "On-site" | "Remote" | "Hybrid";
  type: string;
  experience: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  skills?: string[];
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period?: string;
  };
  applicationSettings: {
    deadline?: string;
    questionsRequired?: boolean;
    resumeRequired?: boolean;
    coverLetterRequired?: boolean;
    portfolioRequired?: boolean;
  };
  interviewTemplateId?: string;
  viewCount?: number;
}

export interface JobFormErrors {
  title?: string;
  company?: string;
  description?: string;
  salary?: string;
  city?: string;
  country?: string;
  general?: string;
}

export interface JobCreationStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface CreateJobRequest {
  title: string;
  companyId: string; // GUID as string
  createdBy: string; // GUID as string
  description: string;
  department: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  employmentType: string;
  seniorityLevel?: string;
  experienceYearsMin?: number;
  locationType: string;
  locations: Record<string, unknown>; // Dictionary<string, object>
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  applicationDeadline?: string; // ISO date string
  status: string;
  aiGeneratedDescription?: boolean;
  skillMatchThreshold?: number;
  interviewTemplateId?: string;
}

export interface CreateJobResponse {
  id?: string;
  message?: string;
}

export interface JobData {
  [key: string]: unknown;
  viewCount?: number;
}

// Add new interfaces for view tracking
export interface JobViewStats {
  totalViews: number;
  viewsByUserType: Record<string, number>;
  applicationRate: number;
  recentViews: JobViewRecord[];
  dailyViews: Record<string, number>;
}

export interface JobViewRecord {
  viewedAt: string;
  userType: "HiringUser" | "ApplicationUser" | "Anonymous";
  ipAddress?: string;
  userAgent?: string;
}

export interface JobAnalytics {
  jobId: string;
  jobTitle: string;
  totalViews: number;
  uniqueViewers: number;
  viewsByUserType: Record<string, number>;
  viewsByDate: Record<string, number>;
  recentViews: JobViewRecord[];
  applicantCount: number;
  applicationRate: number;
  postedDate: string;
}

// Job status type with all available statuses
export type JobStatus = "Draft" | "Active" | "Paused" | "Closed" | "Expired";

// Request interface for changing job status
export interface JobStatusChangeRequest {
  status: string; // "Active", "Paused", etc. - always capitalized
  reason?: string; // Optional reason for the status change
  effectiveDate?: string; // When the status change should take effect (ISO date string)
}

// Request interface for bulk status changes
export interface BulkJobStatusChangeRequest {
  jobIds: string[]; // Array of job IDs to update
  status: string; // "Active", "Paused", etc. - always capitalized
  reason?: string; // Optional reason for bulk status change
}

// Request interface for job duplication
export interface JobDuplicateRequest {
  newTitle?: string; // Optional new title for the duplicated job
  copyApplications?: boolean; // Whether to copy existing applications (usually false)
  status?: string; // Initial status for the duplicated job ("Active", "Draft", etc.)
}

// Job status history record
export interface JobStatusHistory {
  id: string;
  jobId: string;
  fromStatus: string; // Previous status (frontend format: "Active", "Draft", etc.)
  toStatus: string; // New status (frontend format: "Active", "Draft", etc.)
  changedBy: string; // User ID who made the change
  changedAt: string; // ISO date string of when the change occurred
  reason?: string; // Optional reason for the status change
}

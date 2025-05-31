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
  status: "Draft" | "Active" | "Paused" | "Closed";
  applicants: number;
  urgency?: "Urgent" | "High Priority";
  createdBy: string;
  updatedAt: string;
}

export interface JobFormData {
  title: string;
  company?: string;
  department?: string;
  description: string;
  location: string;
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
}

export interface CreateJobResponse {
  id?: string;
  message?: string;
}

export interface JobData {
  [key: string]: unknown;
} 
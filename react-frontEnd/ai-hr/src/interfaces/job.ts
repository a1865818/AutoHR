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
  company: string;
  location: string;
  locationType: "On-site" | "Remote" | "Hybrid";
  type: "Full-Time" | "Part-Time" | "Contract" | "Internship";
  department: string;
  experience: string;
  salary: {
    min: number | null;
    max: number | null;
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
  urgency?: "Urgent" | "High Priority" | null;
}

export interface JobCreationStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
} 
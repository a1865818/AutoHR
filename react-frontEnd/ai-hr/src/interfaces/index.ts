export type CandidateStage = 
  | "Applied" 
  | "Phone Screening" 
  | "Video Interview" 
  | "Technical Assessment" 
  | "Coding Challenge" 
  | "Behavioral Interview" 
  | "Panel Interview" 
  | "Final Interview" 
  | "Culture Fit"
  | "Offer";

export interface Candidate {
  id: string;
  applicationId: string; // Link to ApplicationDetail
  candidateUserId: string;
  jobId: string;
  name: string;
  email: string;
  photo?: string;
  role?: string;
  company: string;
  companyLogo?: string;
  assessment: number;
  stage: CandidateStage;
  status: "In Progress" | "Hired" | "Rejected" | "Offered";
  appliedAt: string;
  resumeUrl?: string;
  coverLetterText?: string;
  expectedSalary?: number;
  availabilityDate?: string;
  jobSource?: string;
  overallAiScore?: number;
  hiringNotes?: string;
  notesCreatedAt?: string;
  notesUpdatedAt?: string;
  currentRoundId?: string; // Keep for backward compatibility
}
export interface SaveNoteRequest {
  notes: string;
}

export interface CandidateWithJobDetails extends Candidate {
  jobTitle: string;
  jobDepartment?: string;
  jobLocationType: string;
  jobEmploymentType: string;
  // Ranking-specific fields
  rankingScore?: number;
  rankingPosition?: number;
  aiAnalysisData?: Record<string, unknown>;
  isRanked?: boolean;
}

export interface CandidatesResponse {
  candidates: CandidateWithJobDetails[];
  totalCount: number;
  companyName: string;
}

export interface FilterOption {
  id: string;
  label: string;
  count: number;
  active?: boolean;
}

export interface FilterOptionJobs {
  id: string;
  label: string;
  count: number;
  active?: boolean;
}

// Export settings interfaces
export * from "./settings";

// Export profile interfaces
export * from "./profile";

// Export job interfaces (excluding CreateJobRequest to avoid conflict)
export * from "./job";

// Export API interfaces (including CreateJobRequest)
export * from "./api";
export type { CreateJobRequest } from "./api";

// Export notification interfaces
export * from "./notifications";

// Export apply form interfaces
export * from "./apply";

// Export interview interfaces
export * from "./interview";

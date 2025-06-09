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
  stage: "Applied" | "Interview" | "Offer";
  status: "In Progress" | "Hired" | "Disqualified";
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
}
export interface SaveNoteRequest {
  notes: string;
}

export interface CandidateWithJobDetails extends Candidate {
  jobTitle: string;
  jobDepartment?: string;
  jobLocationType: string;
  jobEmploymentType: string;
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

// Export job interfaces
export * from "./job";

// Export API interfaces
export * from "./api";

// Export notification interfaces
export * from "./notifications";

// Export apply form interfaces
export * from "./apply";

export type CandidateStage = 
  | "Applied" 
  | "Phone Screening" 
  | "Video Interview" 
  | "Technical Assessment" 
  | "Coding Challenge" 
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
  
  // Rejection tracking fields
  rejectionReason?: string;
  rejectionNotes?: string;
  rejectedAt?: string;
  isSendRejectEmail?: boolean;
  currentRoundId?: string; // Keep for backward compatibility
}
export interface SaveNoteRequest {
  notes: string;
}

export interface CandidateWithJobDetails extends Candidate {
  jobTitle: string;
  jobDepartment?: string;
  jobCompany: string;
  jobId: string;
  isRanked?: boolean;
  rankingPosition?: number;
  rankingScore?: number;
  aiAnalysisData?: any;
}

// Rejected candidates interfaces
export interface RejectedCandidate extends CandidateWithJobDetails {
  rejectionReason: string;
  rejectionNotes?: string;
  rejectedAt: string;
}

export interface RejectedCandidatesResponse {
  candidates: RejectedCandidate[];
  totalCount: number;
  companyName: string;
  summary: {
    totalRejected: number;
    rejectionReasons: Record<string, number>;
    jobBreakdown: Record<string, number>;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  emailType: string; // "Reject", "Success", or "TeamInvitation"
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BulkEmailRequest {
  candidateIds: string[];
  templateId?: string;
  customSubject?: string;
  customBody?: string;
  sendImmediately: boolean;
  scheduledAt?: string;
}

export interface EmailSendResult {
  candidateId: string;
  candidateName: string;
  email: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: string;
  error?: string;
}

export interface BulkEmailResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: EmailSendResult[];
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

// Export interview interfaces (explicitly to avoid conflicts)
export type { InterviewRound, InterviewTemplate } from "./interview";

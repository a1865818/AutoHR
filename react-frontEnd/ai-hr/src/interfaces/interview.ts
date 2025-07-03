import { CandidateStage } from './index';

export type InterviewType = 
  | 'phone_screening'
  | 'video_interview'
  | 'technical_assessment'
  | 'coding_challenge'
  | 'behavioral_interview'
  | 'panel_interview'
  | 'final_interview'
  | 'culture_fit';

export const INTERVIEW_TYPE_TO_STAGE_MAP: Record<InterviewType, CandidateStage> = {
  'phone_screening': 'Phone Screening',
  'video_interview': 'Video Interview',
  'technical_assessment': 'Technical Assessment',
  'coding_challenge': 'Coding Challenge',
  'behavioral_interview': 'Behavioral Interview',
  'panel_interview': 'Panel Interview',
  'final_interview': 'Final Interview',
  'culture_fit': 'Culture Fit'
};

export const STAGE_TO_INTERVIEW_TYPE_MAP: Record<CandidateStage, InterviewType | null> = {
  'Applied': null,
  'Phone Screening': 'phone_screening',
  'Video Interview': 'video_interview',
  'Technical Assessment': 'technical_assessment',
  'Coding Challenge': 'coding_challenge',
  'Behavioral Interview': 'behavioral_interview',
  'Panel Interview': 'panel_interview',
  'Final Interview': 'final_interview',
  'Culture Fit': 'culture_fit',
  'Offer': null
};

export interface InterviewRound {
  id: string;
  name: string;
  type: InterviewType;
  duration: number; // in minutes
  roundOrder: number;
  requirements: string[];
  interviewers: string[];
  isOptional: boolean;
  passingCriteria: number; // score threshold (0-100)
  description?: string;
}

export interface InterviewTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  rounds: InterviewRound[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  successRate: number;
  averageRating: number;
  companyId?: string;
}

export interface InterviewStats {
  totalTemplates: number;
  activeInterviews: number;
  successRate: number;
  averageDuration: number;
} 
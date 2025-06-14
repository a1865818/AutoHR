export type InterviewType = 
  | 'phone_screening'
  | 'video_interview'
  | 'technical_assessment'
  | 'coding_challenge'
  | 'behavioral_interview'
  | 'panel_interview'
  | 'final_interview'
  | 'culture_fit';

export interface InterviewRound {
  id: string;
  name: string;
  type: InterviewType;
  duration: number; // in minutes
  order: number;
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
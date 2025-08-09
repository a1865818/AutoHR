import { useState } from 'react';
import { apiService } from '@/services/api';

interface SubmissionData {
  githubUrl?: string;
  additionalNotes?: string;
  submittedAt: string;
  submissionType: 'online' | 'offline';
  externalPlatformData?: any;
}

interface CreateSubmissionRequest {
  candidateId: string;
  roundId: string;
  jobId: string;
  pdfUrl: string | null;
  githubUrl?: string | null;
  submissionData: SubmissionData;
}

export function useAssessmentSubmission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAssessment = async (request: CreateSubmissionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.makeRequest('/assessments/submissions', {
        method: 'POST',
        body: JSON.stringify({
          candidateId: request.candidateId,
          roundId: request.roundId,
          jobId: request.jobId,
          pdfUrl: request.pdfUrl, // may be null for coding submission
          githubUrl: request.githubUrl ?? null,
          submissionData: request.submissionData,
        }),
      });

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to submit assessment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = async (submissionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.makeRequest(`/api/assessments/submissions/${submissionId}`, {
        method: 'GET',
      });
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch submission';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionsByRound = async (roundId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.makeRequest(`/api/assessments/rounds/${roundId}/submissions`, {
        method: 'GET',
      });
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch submissions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    submitAssessment,
    getSubmission,
    getSubmissionsByRound,
    loading,
    error,
  };
}

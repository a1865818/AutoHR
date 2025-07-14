import { apiService } from './api';
import { RejectedCandidate, EmailTemplate, BulkEmailRequest, BulkEmailResponse } from '@/interfaces';

export class RejectedCandidatesService {
  // Get rejected candidates for a specific job
  async getRejectedCandidatesByJob(jobId: string): Promise<RejectedCandidate[]> {
    return await apiService.makeRequest<RejectedCandidate[]>(`/api/candidates/job/${jobId}/rejected`, { method: 'GET' });
  }

  // Update candidate with rejection details
  async rejectCandidate(
    applicationId: string,
    rejectionReason: string,
    rejectionNotes?: string
  ): Promise<void> {
    await apiService.makeRequest(`/applicationdetails/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Rejected',
        rejectionReason,
        rejectionNotes,
      }),
    });
  }

  // Get available email templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await apiService.makeRequest<EmailTemplate[]>('/api/email-templates', { method: 'GET' });
  }

  // Send bulk emails to rejected candidates
  async sendBulkEmails(request: BulkEmailRequest): Promise<BulkEmailResponse> {
    return await apiService.makeRequest<BulkEmailResponse>('/api/emails/bulk-rejection', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Update the email sent status for a candidate
  async updateEmailSentStatus(applicationId: string, isSendRejectEmail: boolean): Promise<void> {
    await apiService.makeRequest(`/applicationdetails/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        isSendRejectEmail,
      }),
    });
  }

  // Get common rejection reasons
  getCommonRejectionReasons(): string[] {
    return [
      'Skills mismatch',
      'Insufficient experience',
      'Overqualified',
      'Culture fit concerns',
      'Position filled',
      'Budget constraints',
      'Location requirements',
      'Timeline mismatch',
      'Other',
    ];
  }
}

export const rejectedCandidatesService = new RejectedCandidatesService(); 
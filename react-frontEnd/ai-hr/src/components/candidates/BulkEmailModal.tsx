import { RejectedCandidate, EmailTemplate } from "@/interfaces";
import { rejectedCandidatesService } from "@/services/rejectedCandidatesService";
import { X, Mail, Eye, Send, Clock, Users, CheckCircle } from "lucide-react";
import { useState } from "react";

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidates: string[];
  candidates: RejectedCandidate[];
  emailTemplates: EmailTemplate[];
  onEmailSent: () => void;
}

export function BulkEmailModal({
  isOpen,
  onClose,
  selectedCandidates,
  candidates,
  emailTemplates,
  onEmailSent,
}: BulkEmailModalProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(
      emailTemplates.find((t) => t.isDefault) || emailTemplates[0] || null
    );
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [previewCandidate, setPreviewCandidate] =
    useState<RejectedCandidate | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const selectedCandidateData = candidates.filter((c) =>
    selectedCandidates.includes(c.id)
  );

  const getEmailContent = (candidate: RejectedCandidate) => {
    const template = useCustomTemplate
      ? { subject: customSubject, body: customBody }
      : selectedTemplate;

    if (!template) return { subject: "", body: "" };

    const variables = {
      candidateName: candidate.name,
      jobTitle: candidate.jobTitle,
      companyName: candidate.company,
    };

    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, "g"), value);
      body = body.replace(new RegExp(placeholder, "g"), value);
    });

    return { subject, body };
  };

  const handleSendEmails = async () => {
    if (selectedCandidateData.length === 0) return;

    setSending(true);
    try {
      const emailRequest = {
        candidateIds: selectedCandidates,
        templateId: selectedTemplate?.id || "custom",
        customSubject: useCustomTemplate ? customSubject : undefined,
        customBody: useCustomTemplate ? customBody : undefined,
        sendImmediately,
        scheduledAt: !sendImmediately
          ? `${scheduledDate}T${scheduledTime}`
          : undefined,
      };

      await rejectedCandidatesService.sendBulkEmails(emailRequest);
      setSent(true);

      setTimeout(() => {
        onEmailSent();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to send emails:", error);
      const { toast } = await import("@/utils/toast");
      toast.error("Failed to send emails. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop with blur */}
        <div
          className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm transition-opacity duration-300 cursor-pointer hover:bg-gray-900/15"
          onClick={onClose}
        />

        {/* Modal content */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-300 ease-in-out animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Emails Sent Successfully!
              </h3>
              <p className="text-gray-600">
                {selectedCandidateData.length} rejection emails have been sent
                to candidates.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm transition-opacity duration-300 cursor-pointer hover:bg-gray-900/15"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-in-out animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center">
              <Mail className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Bulk Rejection Emails
                </h3>
                <p className="text-sm text-gray-600">
                  Send personalized rejection emails to{" "}
                  {selectedCandidateData.length} candidates
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Recipients */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Recipients ({selectedCandidateData.length})
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {selectedCandidateData.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium">{candidate.name}</span>
                        <span className="text-gray-500">{candidate.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Email Template
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!useCustomTemplate}
                        onChange={() => setUseCustomTemplate(false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Use template
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={useCustomTemplate}
                        onChange={() => setUseCustomTemplate(true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Custom email
                      </span>
                    </label>
                  </div>

                  {!useCustomTemplate && (
                    <select
                      value={selectedTemplate?.id || ""}
                      onChange={(e) => {
                        const template = emailTemplates.find(
                          (t) => t.id === e.target.value
                        );
                        setSelectedTemplate(template || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {emailTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} {template.isDefault && "(Default)"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Custom Template Fields */}
              {useCustomTemplate && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="e.g., Thank you for your interest in {{jobTitle}}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Body
                    </label>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      placeholder="Dear {{candidateName}},&#10;&#10;Thank you for your interest in the {{jobTitle}} position at {{companyName}}..."
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Variables Help */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-blue-900 mb-2">
                  Available Variables:
                </h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>
                    <code>{"{{candidateName}}"}</code> - Candidate's full name
                  </div>
                  <div>
                    <code>{"{{jobTitle}}"}</code> - Job position title
                  </div>
                  <div>
                    <code>{"{{companyName}}"}</code> - Company name
                  </div>
                </div>
              </div>

              {/* Send Options */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Send Options
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={sendImmediately}
                      onChange={() => setSendImmediately(true)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Send immediately
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!sendImmediately}
                      onChange={() => setSendImmediately(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Schedule for later
                    </span>
                  </label>

                  {!sendImmediately && (
                    <div className="ml-6 flex space-x-3">
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              {selectedCandidateData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Email Preview
                    </h4>
                    <select
                      value={
                        previewCandidate?.id || selectedCandidateData[0]?.id
                      }
                      onChange={(e) => {
                        const candidate = selectedCandidateData.find(
                          (c) => c.id === e.target.value
                        );
                        setPreviewCandidate(candidate || null);
                      }}
                      className="text-sm px-2 py-1 border border-gray-300 rounded"
                    >
                      {selectedCandidateData.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          Preview for {candidate.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const candidate =
                      previewCandidate || selectedCandidateData[0];
                    if (!candidate) return null;

                    const { subject, body } = getEmailContent(candidate);

                    return (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">
                            Subject:
                          </div>
                          <div className="font-medium">{subject}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Body:
                          </div>
                          <div className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">
                            {body}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedCandidateData.length} candidates will receive this email
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmails}
                disabled={
                  sending ||
                  (!selectedTemplate && !useCustomTemplate) ||
                  (useCustomTemplate && (!customSubject || !customBody))
                }
                className="inline-flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {sendImmediately ? "Send Now" : "Schedule Email"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

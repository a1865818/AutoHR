import { CandidateWithJobDetails } from "@/interfaces";
import { Mail, X, Eye, EyeOff, Send, User, Building } from "lucide-react";
import { useState, useEffect } from "react";

interface JobSpecificEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateIds: string[];
  candidates: CandidateWithJobDetails[];
  jobTitle: string;
  companyName: string;
  onEmailSent: () => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  emailType: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "professional",
    name: "Professional Rejection",
    subject: "Thank you for your application to {jobTitle}",
    body: `Dear {candidateName},

Thank you for taking the time to apply for the {jobTitle} position at {companyName}. We appreciate your interest in joining our team.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs. This decision was not easy, as we received many strong applications.

We encourage you to apply for future opportunities with {companyName} that align with your skills and experience. We will keep your resume on file for potential future openings.

Thank you again for your interest in {companyName}. We wish you the best of luck in your job search.

Best regards,
The {companyName} Team`,
    emailType: "Reject",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "friendly",
    name: "Friendly Rejection",
    subject: "Your application for {jobTitle} at {companyName}",
    body: `Hi {candidateName},

Thank you so much for your application for the {jobTitle} position at {companyName}. We truly appreciate the time you invested in applying and getting to know our company.

While we were impressed with your background and experience, we've decided to move forward with a candidate whose skills more closely align with our specific requirements for this role.

We really value the effort you put into your application and would love to stay in touch. Please don't hesitate to apply for future positions that match your expertise.

We wish you all the best in your job search and hope our paths cross again soon!

Warm regards,
The {companyName} Team`,
    emailType: "Reject",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "concise",
    name: "Concise Rejection",
    subject: "Update on your {jobTitle} application",
    body: `Dear {candidateName},

Thank you for your application for the {jobTitle} position at {companyName}.

After reviewing all applications, we have decided to proceed with other candidates. This decision reflects our specific needs for this role and is not a reflection of your qualifications.

We appreciate your interest in {companyName} and encourage you to apply for future opportunities that match your skills.

Best regards,
The {companyName} Team`,
    emailType: "Reject",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function JobSpecificEmailModal({
  isOpen,
  onClose,
  candidateIds,
  candidates,
  jobTitle,
  companyName,
  onEmailSent,
}: JobSpecificEmailModalProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("professional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewCandidate, setPreviewCandidate] =
    useState<CandidateWithJobDetails | null>(null);

  // Get selected candidates
  const selectedCandidates = candidates.filter((c) =>
    candidateIds.includes(c.id)
  );

  // Set preview candidate to first selected candidate
  useEffect(() => {
    if (selectedCandidates.length > 0) {
      setPreviewCandidate(selectedCandidates[0]);
    }
  }, [selectedCandidates]);

  // Update email content when template changes
  useEffect(() => {
    const template = DEFAULT_EMAIL_TEMPLATES.find(
      (t) => t.id === selectedTemplate
    );
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [selectedTemplate]);

  // Replace placeholders in text
  const replacePlaceholders = (
    text: string,
    candidate: CandidateWithJobDetails
  ) => {
    return text
      .replace(/\{\{candidateName\}\}/g, candidate.name)
      .replace(/\{\{jobTitle\}\}/g, jobTitle)
      .replace(/\{\{companyName\}\}/g, companyName);
  };

  const handleSendEmails = async () => {
    if (!subject.trim() || !body.trim()) {
      const { toast } = await import("@/utils/toast");
      toast.error("Please fill in both subject and body.");
      return;
    }

    setIsSending(true);

    try {
      // Simulate API call to send emails
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(
        "Sending emails to:",
        selectedCandidates.map((c) => c.name)
      );
      console.log("Subject:", subject);
      console.log("Body:", body);

      // TODO: Implement actual email sending API call
      // await emailService.sendBulkRejectionEmails({
      //   candidateIds,
      //   subject,
      //   body,
      //   jobTitle,
      //   companyName
      // });

      const { toast } = await import("@/utils/toast");
      toast.success(
        `Successfully sent emails to ${selectedCandidates.length} candidates!`
      );
      onEmailSent();
      onClose();
    } catch (error) {
      console.error("Error sending emails:", error);
      const { toast } = await import("@/utils/toast");
      toast.error("Failed to send emails. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity backdrop-blur-sm bg-white/30"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Mail className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Rejection Emails
                </h3>
                <p className="text-sm text-gray-600">
                  Sending to {selectedCandidates.length} candidate
                  {selectedCandidates.length !== 1 ? "s" : ""}
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

          <div className="flex h-96">
            {/* Left side - Recipients */}
            <div className="w-80 border-r border-gray-200 bg-gray-50">
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Recipients</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        previewCandidate?.id === candidate.id
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setPreviewCandidate(candidate)}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            candidate.photo ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              candidate.name
                            )}&size=32&background=e5e7eb&color=374151&rounded=true`
                          }
                          alt={candidate.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {candidate.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {candidate.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Email content */}
            <div className="flex-1 p-6">
              {/* Template selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {DEFAULT_EMAIL_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview toggle */}
              <div className="mb-4">
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {isPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </>
                  )}
                </button>
                {isPreview && previewCandidate && (
                  <span className="ml-2 text-sm text-gray-600">
                    Previewing for {previewCandidate.name}
                  </span>
                )}
              </div>

              {/* Subject field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                {isPreview && previewCandidate ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    {replacePlaceholders(subject, previewCandidate)}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email subject"
                  />
                )}
              </div>

              {/* Body field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                {isPreview && previewCandidate ? (
                  <div className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto whitespace-pre-wrap">
                    {replacePlaceholders(body, previewCandidate)}
                  </div>
                ) : (
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email message"
                  />
                )}
              </div>

              {/* Placeholder info */}
              {!isPreview && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Available placeholders:</strong> {"{candidateName}"}
                    , {"{jobTitle}"}, {"{companyName}"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedCandidates.length} recipient
                {selectedCandidates.length !== 1 ? "s" : ""}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmails}
                  disabled={isSending || !subject.trim() || !body.trim()}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Emails
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

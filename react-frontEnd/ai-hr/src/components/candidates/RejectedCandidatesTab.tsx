import { CandidateWithJobDetails } from "@/interfaces";
import {
  Mail,
  Search,
  UserX,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  CheckCircle,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { GmailAuthModal } from "./GmailAuthModal";
import { EmailTemplateSelector } from "./EmailTemplateSelector";
import { sessionCookies } from "@/utils/cookieUtils";
import { formatTimestampDetailed } from "@/utils/timezoneUtils";
import { apiService } from "@/services/api";

interface RejectedCandidatesTabProps {
  candidates: CandidateWithJobDetails[];
  searchQuery: string;
  onCandidateSelect: (candidateId: string) => void;
  onBulkEmail: (candidateIds: string[]) => void;
  onEmailSent?: (sentCount: number, candidateIds: string[]) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function RejectedCandidatesTab({
  candidates,
  searchQuery,
  onCandidateSelect,
  onBulkEmail,
  onEmailSent,
  onRefresh,
  loading = false,
}: RejectedCandidatesTabProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<{
    field: "name" | "rejectedAt" | "rejectionReason";
    direction: "asc" | "desc";
  }>({ field: "rejectedAt", direction: "desc" });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showGmailAuthModal, setShowGmailAuthModal] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pollingCandidates, setPollingCandidates] = useState<string[]>([]);

  // Polling effect to check for email status updates
  useEffect(() => {
    if (pollingCandidates.length === 0) return;

    const pollInterval = setInterval(async () => {
      try {
        // Refresh the candidate data to get latest status
        onRefresh?.();

        // Check if any of the polling candidates have been updated
        const updatedCandidates = candidates.filter(
          (c) => pollingCandidates.includes(c.id) && c.isSendRejectEmail
        );

        if (updatedCandidates.length > 0) {
          // Remove updated candidates from polling list
          setPollingCandidates((prev) =>
            prev.filter((id) => !updatedCandidates.some((c) => c.id === id))
          );

          console.log(
            `✅ Email status updated for ${updatedCandidates.length} candidates`
          );
        }
      } catch (error) {
        console.error("Error polling for email status updates:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [pollingCandidates, candidates, onRefresh]);

  // Filter candidates based on search query
  const filteredCandidates = useMemo(() => {
    let filtered = candidates.filter((c) => c.status === "Rejected");

    if (searchQuery) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (candidate.rejectionReason &&
            candidate.rejectionReason
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
    }

    // Sort candidates
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy.field) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "rejectedAt":
          aValue = new Date(a.rejectedAt || "");
          bValue = new Date(b.rejectedAt || "");
          break;
        case "rejectionReason":
          aValue = a.rejectionReason || "";
          bValue = b.rejectionReason || "";
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      let comparison = 0;
      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      }

      return sortBy.direction === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [candidates, searchQuery, sortBy]);

  // Handle individual candidate selection
  const handleCandidateSelect = (candidateId: string, selected: boolean) => {
    // Don't allow selection of candidates who have already been sent emails
    const candidate = filteredCandidates.find((c) => c.id === candidateId);
    if (candidate?.isSendRejectEmail) {
      return; // Prevent selection of candidates who have already been sent emails
    }

    if (selected) {
      setSelectedCandidates((prev) => [...prev, candidateId]);
    } else {
      setSelectedCandidates((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  // Calculate select all state based on selectable candidates only
  const selectableCandidates = filteredCandidates.filter(
    (c) => !c.isSendRejectEmail
  );
  const selectAllChecked =
    selectableCandidates.length > 0 &&
    selectedCandidates.length === selectableCandidates.length;
  const selectAllIndeterminate =
    selectedCandidates.length > 0 &&
    selectedCandidates.length < selectableCandidates.length;

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    setSelectedCandidates(
      selected ? selectableCandidates.map((c) => c.id) : []
    );
  };

  // Handle bulk email
  const handleBulkEmailClick = async () => {
    if (selectedCandidates.length === 0) {
      alert("Please select candidates to send emails to.");
      return;
    }

    // Check Gmail authorization first
    try {
      const data = await apiService.makeRequest<any>("/api/gmail/auth/status", {
        method: "GET",
      });

      if (data.isAuthorized) {
        setShowEmailModal(true);
      } else {
        setShowGmailAuthModal(true);
      }
    } catch (error) {
      console.error("Failed to check Gmail authorization:", error);
      setShowGmailAuthModal(true);
    }
  };

  const handleGmailAuthComplete = () => {
    setShowGmailAuthModal(false);
    setShowEmailModal(true);
  };

  const handleSendEmails = async (emailData: any) => {
    setEmailLoading(true);

    // Immediate redirect and UI update
    setShowEmailModal(false);
    const sentCandidateIds = selectedCandidates.slice(); // Copy the array before clearing
    setSelectedCandidates([]);

    // Optimistically update the UI and redirect immediately
    onEmailSent?.(selectedCandidates.length, sentCandidateIds);

    // Start polling for these candidates to check for real-time updates
    setPollingCandidates(sentCandidateIds);

    try {
      // Use camelCase properties (default for .NET minimal APIs)
      const requestData = {
        candidateIds: sentCandidateIds,
        templateId: emailData.templateId,
        customSubject: emailData.customSubject,
        customBody: emailData.customBody,
        sendImmediately: true,
      };

      // Send emails in background - don't wait for response
      apiService
        .makeRequest<any>("/api/emails/bulk-rejection", {
          method: "POST",
          body: JSON.stringify(requestData),
        })
        .then((result) => {
          if (result.success) {
            console.log(`✅ Successfully sent ${result.totalSent} emails!`);
            // The UI is already updated, no need to do anything else
          } else {
            console.error("Failed to send emails:", result.error);
            // In a real app, you might want to show a notification or revert the UI state
            if (result.error?.includes("Gmail authorization required")) {
              setShowGmailAuthModal(true);
            }
          }
        })
        .catch((error) => {
          console.error("Failed to send emails:", error);
          // In a real app, you might want to show a notification or revert the UI state
        })
        .finally(() => {
          setEmailLoading(false);
        });
    } catch (error) {
      console.error("Failed to send emails:", error);
      setEmailLoading(false);
    }
  };

  // Handle sort
  const handleSort = (field: "name" | "rejectedAt" | "rejectionReason") => {
    setSortBy((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    return formatTimestampDetailed(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rejected candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 w-full flex-1 flex flex-col h-full">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Rejected Candidates
          </h3>
          <span className="text-sm text-gray-500">
            {filteredCandidates.length} candidates
            {selectableCandidates.length < filteredCandidates.length && (
              <span className="text-gray-400">
                {" "}
                ({selectableCandidates.length} available for email)
              </span>
            )}
          </span>
        </div>

        {selectedCandidates.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedCandidates.length} selected
            </span>
            <button
              onClick={handleBulkEmailClick}
              className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
            >
              <Mail className="h-4 w-4 mr-1" />
              Send Emails
            </button>
          </div>
        )}
      </div>

      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center">
        <div className="w-10 flex items-center">
          <input
            type="checkbox"
            checked={selectAllChecked}
            ref={(input) => {
              if (input) input.indeterminate = selectAllIndeterminate;
            }}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 grid grid-cols-4 gap-4 text-sm font-medium text-gray-600">
          <button
            onClick={() => handleSort("name")}
            className="text-left flex items-center space-x-1 hover:text-gray-900"
          >
            <span>Candidate</span>
            {sortBy.field === "name" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              ))}
          </button>
          <button
            onClick={() => handleSort("rejectionReason")}
            className="text-left flex items-center space-x-1 hover:text-gray-900"
          >
            <span>Rejection Reason</span>
            {sortBy.field === "rejectionReason" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              ))}
          </button>
          <button
            onClick={() => handleSort("rejectedAt")}
            className="text-left flex items-center space-x-1 hover:text-gray-900"
          >
            <span>Rejected Date</span>
            {sortBy.field === "rejectedAt" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              ))}
          </button>
          <span>Actions</span>
        </div>
      </div>

      {/* Candidates List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCandidates.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Rejected Candidates
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "No candidates match your search."
                  : "No candidates have been rejected yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => onCandidateSelect(candidate.id)}
              >
                <div className="flex items-center">
                  <div className="w-10 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.id)}
                      disabled={candidate.isSendRejectEmail}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCandidateSelect(candidate.id, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                        candidate.isSendRejectEmail
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    {/* Candidate Info */}
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
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 truncate">
                            {candidate.name}
                          </p>
                          {candidate.isSendRejectEmail}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {candidate.email}
                        </p>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    <div className="text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {candidate.rejectionReason || "Not specified"}
                      </span>
                    </div>

                    {/* Rejected Date */}
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(candidate.rejectedAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {candidate.isSendRejectEmail ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Email Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded cursor-pointer">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </span>
                      )}
                      {candidate.rejectionNotes && (
                        <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded">
                          <FileText className="h-3 w-3 mr-1" />
                          Notes
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gmail Authorization Modal */}
      <GmailAuthModal
        isOpen={showGmailAuthModal}
        onClose={() => setShowGmailAuthModal(false)}
        onAuthComplete={handleGmailAuthComplete}
      />

      {/* Enhanced Email Modal */}
      {showEmailModal && (
        <EnhancedBulkEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSend={handleSendEmails}
          candidateCount={selectedCandidates.length}
          selectedCandidates={filteredCandidates.filter((c) =>
            selectedCandidates.includes(c.id)
          )}
          loading={emailLoading}
        />
      )}
    </div>
  );
}

// Enhanced Bulk Email Modal Component
interface EnhancedBulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: BulkEmailData) => void;
  candidateCount: number;
  selectedCandidates: CandidateWithJobDetails[];
  loading?: boolean;
}

interface BulkEmailData {
  templateId?: string;
  customSubject?: string;
  customBody?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

function EnhancedBulkEmailModal({
  isOpen,
  onClose,
  onSend,
  candidateCount,
  selectedCandidates,
  loading = false,
}: EnhancedBulkEmailModalProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleTemplateSelect = (template: EmailTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setCustomSubject(template.subject);
      setCustomBody(template.body);
    } else {
      setCustomSubject("");
      setCustomBody("");
    }
  };

  const handleSend = () => {
    const emailData: BulkEmailData = {
      templateId: selectedTemplate?.id,
      customSubject,
      customBody,
    };
    onSend(emailData);
  };

  const getPreviewContent = () => {
    // Get the first selected candidate for preview
    const previewCandidate = selectedCandidates[0];

    if (!previewCandidate) {
      return { subject: customSubject, body: customBody };
    }

    const sampleSubject = customSubject
      .replace(/\{\{candidateName\}\}/g, previewCandidate.name)
      .replace(
        /\{\{jobTitle\}\}/g,
        previewCandidate.jobTitle || "Software Engineer"
      )
      .replace(
        /\{\{companyName\}\}/g,
        previewCandidate.company || "Your Company"
      );

    const sampleBody = customBody
      .replace(/\{\{candidateName\}\}/g, previewCandidate.name)
      .replace(
        /\{\{jobTitle\}\}/g,
        previewCandidate.jobTitle || "Software Engineer"
      )
      .replace(
        /\{\{companyName\}\}/g,
        previewCandidate.company || "Your Company"
      );

    return { subject: sampleSubject, body: sampleBody };
  };

  if (!isOpen) return null;

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
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Send Email to {candidateCount} Candidates
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Template Selection */}
            <EmailTemplateSelector
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?.id}
            />

            {/* Email Customization */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {"{{candidateName}}"}, {"{{jobTitle}}"},{" "}
                  {"{{companyName}}"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content
                </label>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email content"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {"{{candidateName}}"}, {"{{jobTitle}}"},{" "}
                  {"{{companyName}}"}
                </p>
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3">
                  Email Preview
                  {selectedCandidates[0] && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      (Previewing for {selectedCandidates[0].name})
                    </span>
                  )}
                </h3>
                <div className="bg-white border rounded p-4">
                  <div className="mb-3">
                    <strong>Subject:</strong> {getPreviewContent().subject}
                  </div>
                  <div>
                    <strong>Body:</strong>
                    <div
                      className="mt-2 prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: getPreviewContent().body,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !customSubject || !customBody}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Emails
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

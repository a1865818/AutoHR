import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Check,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { apiService } from "@/services/api";
import { EmailTemplateSelector } from "../candidates/EmailTemplateSelector";
import { GmailAuthModal } from "../candidates/GmailAuthModal";

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

interface PendingNotification {
  candidateId: string;
  candidateName: string;
  fromColumn: string;
  toColumn: string;
  movedAt: Date;
  emailSent: boolean;
}

interface RoundInfo {
  displayName: string;
  templateType: string;
  description: string;
}

interface BulkNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingNotifications: PendingNotification[];
  jobTitle: string;
  companyName: string;
  onNotificationsSent: (sentNotifications: PendingNotification[]) => void;
  roundInfo: RoundInfo;
}

export function BulkNotificationModal({
  isOpen,
  onClose,
  pendingNotifications,
  jobTitle,
  companyName,
  onNotificationsSent,
  roundInfo,
}: BulkNotificationModalProps) {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailsSent, setEmailsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email template and customization states
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showGmailAuthModal, setShowGmailAuthModal] = useState(false);

  // Filter out already sent notifications
  const unsentNotifications = pendingNotifications.filter((n) => !n.emailSent);

  // Initialize with all unsent notifications selected
  useEffect(() => {
    if (isOpen && selectedNotifications.length === 0) {
      setSelectedNotifications(unsentNotifications.map((n) => n.candidateId));
    }
  }, [isOpen, unsentNotifications.length]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      setCustomSubject("");
      setCustomBody("");
      setShowPreview(false);
      setError(null);
    }
  }, [isOpen]);

  // Update subject and body when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setCustomSubject(selectedTemplate.subject);
      setCustomBody(selectedTemplate.body);
    }
  }, [selectedTemplate]);

  const handleSelectAll = () => {
    if (selectedNotifications.length === unsentNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(unsentNotifications.map((n) => n.candidateId));
    }
  };

  const handleSelectNotification = (candidateId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleTemplateSelect = (template: EmailTemplate | null) => {
    setSelectedTemplate(template);
  };

  const getColumnDisplayName = (columnId: string) => {
    switch (columnId) {
      case "new":
        return "New Applications";
      case "applied":
        return "Applied";
      case "hired":
        return "Hired";
      case "rejected":
        return "Rejected";
      case "offered":
        return "Offered";
      default:
        return columnId; // For custom interview rounds
    }
  };

  const replacePlaceholders = (text: string, candidateName: string) => {
    return text
      .replace(/\{\{candidateName\}\}/g, candidateName)
      .replace(/\{\{jobTitle\}\}/g, jobTitle)
      .replace(/\{\{companyName\}\}/g, companyName);
  };

  const getPreviewContent = (candidateName: string) => {
    return {
      subject: replacePlaceholders(customSubject, candidateName),
      body: replacePlaceholders(customBody, candidateName),
    };
  };

  const handleSendNotifications = async () => {
    if (selectedNotifications.length === 0) return;

    // Validate template and content
    if (!selectedTemplate || !customSubject.trim() || !customBody.trim()) {
      setError(
        "Please select an email template and ensure both subject and body are filled."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check Gmail authorization first
      const authData = await apiService.makeRequest<{
        isAuthorized: boolean;
        error?: string;
      }>("/api/gmail/auth/status", {
        method: "GET",
      });

      if (!authData.isAuthorized) {
        setShowGmailAuthModal(true);
        setIsSubmitting(false);
        return;
      }

      // Get the selected notifications
      const notificationsToSend = unsentNotifications.filter((n) =>
        selectedNotifications.includes(n.candidateId)
      );

      // Send bulk success emails using the custom template
      const emailRequestData = {
        candidateIds: selectedNotifications,
        templateId: selectedTemplate.id,
        customSubject: customSubject,
        customBody: customBody,
        sendImmediately: true,
      };

      console.log("📧 Sending bulk notifications:", emailRequestData);

      const emailResult = await apiService.makeRequest<{
        success: boolean;
        error?: string;
      }>("/api/emails/bulk-success", {
        method: "POST",
        body: JSON.stringify(emailRequestData),
      });

      if (emailResult.success) {
        console.log(
          `✅ Successfully sent notifications to ${selectedNotifications.length} candidates`
        );
        setEmailsSent(true);
        onNotificationsSent(notificationsToSend);

        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
          setEmailsSent(false);
          setSelectedNotifications([]);
        }, 2000);
      } else {
        console.error("Failed to send emails:", emailResult.error);
        setError(
          `Failed to send emails: ${emailResult.error || "Unknown error"}`
        );
        if (emailResult.error?.includes("Gmail authorization required")) {
          setShowGmailAuthModal(true);
        }
      }
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      setError("Failed to send notifications. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGmailAuthComplete = () => {
    setShowGmailAuthModal(false);
    // Retry sending after auth
    handleSendNotifications();
  };

  if (!isOpen) return null;

  if (emailsSent) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-all duration-200" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Notifications Sent Successfully!
              </h3>
              <p className="text-gray-600">
                {selectedNotifications.length} candidate
                {selectedNotifications.length !== 1 ? "s" : ""}{" "}
                {selectedNotifications.length !== 1 ? "have" : "has"} been
                notified of their progress.
              </p>
            </div>
          </div>
        </div>

        {/* Gmail Authorization Modal */}
        <GmailAuthModal
          isOpen={showGmailAuthModal}
          onClose={() => setShowGmailAuthModal(false)}
          onAuthComplete={handleGmailAuthComplete}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-all duration-200"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Send {roundInfo.displayName} Notifications
                </h2>
                <p className="text-sm text-gray-500">
                  {roundInfo.description} • {pendingNotifications.length}{" "}
                  candidate{pendingNotifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {unsentNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No pending notifications to send.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Email Template Selection */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Choose Email Template for {roundInfo.displayName}
                  </h4>
                  <EmailTemplateSelector
                    onTemplateSelect={handleTemplateSelect}
                    selectedTemplateId={selectedTemplate?.id}
                    emailType={roundInfo.templateType}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {roundInfo.templateType === "Success" ? (
                      <>
                        Showing <strong>Success</strong> templates - these work
                        for all forward progress notifications
                      </>
                    ) : roundInfo.templateType === "Reject" ? (
                      <>
                        Showing <strong>Rejection</strong> templates - for
                        candidates being rejected
                      </>
                    ) : (
                      <>Showing templates for: {roundInfo.templateType}</>
                    )}
                  </p>
                </div>

                {/* Email Customization */}
                {selectedTemplate && (
                  <div className="space-y-4">
                    <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        🎯{" "}
                        <strong>{roundInfo.displayName} Notifications:</strong>{" "}
                        {roundInfo.description}
                      </p>
                      {roundInfo.templateType === "Success" && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 <strong>Tip:</strong> You can customize the email
                          content below to be specific to this round (e.g.,
                          mention technical preparation, coding challenges,
                          etc.)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Enter email subject"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Available variables: {"{{candidateName}}"},{" "}
                        {"{{jobTitle}}"}, {"{{companyName}}"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Content
                      </label>
                      <textarea
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Enter email content"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Available variables: {"{{candidateName}}"},{" "}
                        {"{{jobTitle}}"}, {"{{companyName}}"}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {showPreview ? (
                          <EyeOff className="h-4 w-4 mr-1" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        {showPreview ? "Hide Preview" : "Show Preview"}
                      </button>
                    </div>

                    {/* Email Preview */}
                    {showPreview && selectedNotifications.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">
                          Email Preview (using first selected candidate):
                        </h5>
                        {(() => {
                          const firstSelectedNotification =
                            unsentNotifications.find((n) =>
                              selectedNotifications.includes(n.candidateId)
                            );
                          if (!firstSelectedNotification) return null;

                          const preview = getPreviewContent(
                            firstSelectedNotification.candidateName
                          );
                          return (
                            <div className="space-y-2">
                              <p className="text-sm">
                                <strong>To:</strong>{" "}
                                {firstSelectedNotification.candidateName}
                              </p>
                              <p className="text-sm">
                                <strong>Subject:</strong> {preview.subject}
                              </p>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm whitespace-pre-wrap">
                                  {preview.body}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Candidate Selection */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Select Recipients
                  </h4>

                  {/* Select All */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedNotifications.length ===
                          unsentNotifications.length
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select All ({unsentNotifications.length} candidates)
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {selectedNotifications.length} selected
                    </span>
                  </div>

                  {/* Candidate List */}
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {unsentNotifications.map((notification) => (
                      <div
                        key={notification.candidateId}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(
                            notification.candidateId
                          )}
                          onChange={() =>
                            handleSelectNotification(notification.candidateId)
                          }
                          className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                        />

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {notification.candidateName}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                            <span>
                              {getColumnDisplayName(notification.fromColumn)}
                            </span>
                            <ArrowRight className="h-3 w-3" />
                            <span>
                              {getColumnDisplayName(notification.toColumn)}
                            </span>
                            <span className="ml-2">
                              ({new Date(notification.movedAt).toLocaleString()}
                              )
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {roundInfo.displayName} notification emails will be sent to
                selected candidates
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNotifications}
                  disabled={
                    selectedNotifications.length === 0 ||
                    isSubmitting ||
                    !selectedTemplate ||
                    !customSubject.trim() ||
                    !customBody.trim()
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-[#066046] hover:bg-[#267a54] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center space-x-2 transition-colors shadow-sm hover:shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>
                        Send {selectedNotifications.length} Notification
                        {selectedNotifications.length !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gmail Authorization Modal */}
      <GmailAuthModal
        isOpen={showGmailAuthModal}
        onClose={() => setShowGmailAuthModal(false)}
        onAuthComplete={handleGmailAuthComplete}
      />
    </div>
  );
}

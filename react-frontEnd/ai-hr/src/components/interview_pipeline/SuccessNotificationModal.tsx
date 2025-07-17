import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Eye,
  EyeOff,
  Send,
  Loader2,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Candidate } from "@/interfaces";
import { EmailTemplateSelector } from "../candidates/EmailTemplateSelector";
import { GmailAuthModal } from "../candidates/GmailAuthModal";
import { apiService } from "@/services/api";

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

interface SuccessNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  jobTitle: string;
  companyName: string;
  onSuccess: (
    candidateId: string,
    emailData: {
      templateId?: string;
      subject: string;
      body: string;
    }
  ) => Promise<void>;
}

export function SuccessNotificationModal({
  isOpen,
  onClose,
  candidate,
  jobTitle,
  companyName,
  onSuccess,
}: SuccessNotificationModalProps) {
  const [currentStep, setCurrentStep] = useState<"email" | "preview">("email");
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGmailAuthModal, setShowGmailAuthModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Only one step now, so no need to set currentStep
      setSelectedTemplate(null);
      setCustomSubject("");
      setCustomBody("");
      setSubmitting(false);
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

  if (!isOpen) return null;

  const handleTemplateSelect = (template: EmailTemplate | null) => {
    setSelectedTemplate(template);
  };

  const handleSendEmail = async () => {
    if (!customSubject.trim() || !customBody.trim()) {
      setError("Please provide both email subject and body.");
      return;
    }

    // Check Gmail authorization first
    try {
      const authData = await apiService.makeRequest<any>(
        "/api/gmail/auth/status",
        {
          method: "GET",
        }
      );

      if (!authData.isAuthorized) {
        setShowGmailAuthModal(true);
        return;
      }

      await sendSuccessEmail();
    } catch (error) {
      console.error("Failed to check Gmail authorization:", error);
      setShowGmailAuthModal(true);
    }
  };

  const handleGmailAuthComplete = async () => {
    setShowGmailAuthModal(false);
    await sendSuccessEmail();
  };

  const sendSuccessEmail = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // First update the candidate success status via the original onSuccess callback
      await onSuccess(candidate.id, {
        templateId: selectedTemplate?.id,
        subject: customSubject,
        body: customBody,
      });

      // Then send the email via the bulk success email API (with single candidate)
      const emailRequestData = {
        candidateIds: [candidate.id],
        templateId: selectedTemplate?.id,
        customSubject: customSubject,
        customBody: customBody,
        sendImmediately: true,
      };

      console.log(
        "📧 Sending success email via bulk success API:",
        emailRequestData
      );

      const emailResult = await apiService.makeRequest<any>(
        "/api/emails/bulk-success",
        {
          method: "POST",
          body: JSON.stringify(emailRequestData),
        }
      );

      if (emailResult.success) {
        console.log(`✅ Successfully sent success email to ${candidate.name}!`);
        onClose();
      } else {
        console.error("Failed to send email:", emailResult.error);
        setError(
          `Failed to send email: ${emailResult.error || "Unknown error"}`
        );
        if (emailResult.error?.includes("Gmail authorization required")) {
          setShowGmailAuthModal(true);
        }
      }
    } catch (error) {
      console.error("Error sending success email:", error);
      setError("Failed to send email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const replacePlaceholders = (text: string) => {
    return text
      .replace(/\{\{candidateName\}\}/g, candidate.name)
      .replace(/\{\{jobTitle\}\}/g, jobTitle)
      .replace(/\{\{companyName\}\}/g, companyName);
  };

  const getPreviewContent = () => {
    return {
      subject: replacePlaceholders(customSubject),
      body: replacePlaceholders(customBody),
    };
  };

  return (
    <>
      <div className="fixed inset-0 z-50">
        {/* Blurred background */}
        <div
          className="absolute inset-0 bg-white/30 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Modal content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Send Success Notification
                  </h3>
                  <p className="text-sm text-gray-600">
                    Congratulate {candidate.name} on their progress
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

            {/* Progress Steps */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-100 text-blue-600">
                  1
                </div>
                <span className="text-sm font-medium">Email Template</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Choose Email Template
                  </h4>
                  <EmailTemplateSelector
                    onTemplateSelect={handleTemplateSelect}
                    selectedTemplateId={selectedTemplate?.id}
                    emailType="Success"
                  />
                </div>

                {selectedTemplate && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

                    {showPreview && (
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">
                          Email Preview:
                        </h5>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong>To:</strong> {candidate.name} (
                            {candidate.email})
                          </p>
                          <p className="text-sm">
                            <strong>Subject:</strong>{" "}
                            {getPreviewContent().subject}
                          </p>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-sm whitespace-pre-wrap">
                              {getPreviewContent().body}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSendEmail}
                  disabled={
                    submitting ||
                    !selectedTemplate ||
                    !customSubject.trim() ||
                    !customBody.trim()
                  }
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Success Email
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
    </>
  );
}

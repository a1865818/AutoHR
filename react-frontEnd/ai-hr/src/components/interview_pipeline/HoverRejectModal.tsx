import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Eye,
  EyeOff,
  Send,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Candidate } from "@/interfaces";
import { EmailTemplateSelector } from "../candidates/EmailTemplateSelector";
import { GmailAuthModal } from "../candidates/GmailAuthModal";
import { rejectedCandidatesService } from "@/services/rejectedCandidatesService";
import { apiService } from "@/services/api";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HoverRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  jobTitle: string;
  companyName: string;
  onReject: (
    candidateId: string,
    emailData: {
      reason: string;
      notes?: string;
      templateId?: string;
      subject: string;
      body: string;
    }
  ) => Promise<void>;
}

export function HoverRejectModal({
  isOpen,
  onClose,
  candidate,
  jobTitle,
  companyName,
  onReject,
}: HoverRejectModalProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState<"reason" | "email">("reason");

  // Step 1: Rejection reason
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  // Step 2: Email template
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gmail auth states
  const [showGmailAuthModal, setShowGmailAuthModal] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log("🚀 HoverRejectModal opened for candidate:", candidate.name);
      setCurrentStep("reason");
      setSelectedReason("");
      setCustomReason("");
      setRejectionNotes("");
      setSelectedTemplate(null);
      setCustomSubject("");
      setCustomBody("");
      setShowPreview(false);
      setSubmitting(false);
      setError(null);
      setShowGmailAuthModal(false);
    }
  }, [isOpen, candidate.name]);

  // Update email content when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setCustomSubject(selectedTemplate.subject);
      setCustomBody(selectedTemplate.body);
    }
  }, [selectedTemplate]);

  if (!isOpen) return null;

  const commonReasons = rejectedCandidatesService.getCommonRejectionReasons();

  const handleReasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reason = selectedReason === "Other" ? customReason : selectedReason;
    if (!reason.trim()) {
      setError("Please select or enter a rejection reason.");
      return;
    }

    setError(null);

    // Set default email content if none exists when moving to email step
    if (!customSubject && !customBody) {
      setCustomSubject(`Thank you for your application to {{jobTitle}}`);
      setCustomBody(
        `Dear {{candidateName}},\n\nThank you for your interest in the {{jobTitle}} position at {{companyName}}.\n\nAfter careful consideration, we have decided to move forward with other candidates at this time.\n\nWe appreciate the time you invested in applying and wish you the best in your job search.\n\nBest regards,\nThe {{companyName}} Team`
      );
    }

    setCurrentStep("email");
  };

  const handleTemplateSelect = (template: EmailTemplate | null) => {
    setSelectedTemplate(template);

    // If a template is selected, use its content
    if (template) {
      setCustomSubject(template.subject);
      setCustomBody(template.body);
    } else {
      // If no template is selected (custom email), provide default content if fields are empty
      if (!customSubject) {
        setCustomSubject(`Thank you for your application to ${jobTitle}`);
      }
      if (!customBody) {
        setCustomBody(
          `Dear {{candidateName}},\n\nThank you for your interest in the {{jobTitle}} position at {{companyName}}.\n\nAfter careful consideration, we have decided to move forward with other candidates at this time.\n\nWe appreciate the time you invested in applying and wish you the best in your job search.\n\nBest regards,\nThe {{companyName}} Team`
        );
      }
    }
  };

  const getPreviewContent = () => {
    const sampleSubject = customSubject
      .replace(/\{\{candidateName\}\}/g, candidate.name)
      .replace(/\{\{jobTitle\}\}/g, jobTitle)
      .replace(/\{\{companyName\}\}/g, companyName);

    const sampleBody = customBody
      .replace(/\{\{candidateName\}\}/g, candidate.name)
      .replace(/\{\{jobTitle\}\}/g, jobTitle)
      .replace(/\{\{companyName\}\}/g, companyName);

    return { subject: sampleSubject, body: sampleBody };
  };

  const handleFinalSubmit = async () => {
    if (!customSubject.trim() || !customBody.trim()) {
      setError("Please fill in both subject and body.");
      return;
    }

    const reason = selectedReason === "Other" ? customReason : selectedReason;

    console.log("📧 Preparing to send rejection email with data:", {
      candidateName: candidate.name,
      jobTitle,
      companyName,
      reason,
      originalSubject: customSubject,
      originalBody: customBody,
    });

    // Check Gmail authorization first
    try {
      const authData = await apiService.makeRequest<any>(
        "/api/gmail/auth/status",
        {
          method: "GET",
        }
      );

      if (authData.isAuthorized) {
        await sendRejectionEmail(reason);
      } else {
        console.log("📧 Gmail not authorized, showing auth modal");
        setShowGmailAuthModal(true);
      }
    } catch (error) {
      console.error("Failed to check Gmail authorization:", error);
      setShowGmailAuthModal(true);
    }
  };

  const handleGmailAuthComplete = async () => {
    setShowGmailAuthModal(false);
    const reason = selectedReason === "Other" ? customReason : selectedReason;
    await sendRejectionEmail(reason);
  };

  const sendRejectionEmail = async (reason: string) => {
    setSubmitting(true);
    setError(null);

    try {
      // First update the candidate rejection status via the original onReject callback
      await onReject(candidate.id, {
        reason,
        notes: rejectionNotes,
        templateId: selectedTemplate?.id,
        subject: customSubject,
        body: customBody,
      });

      // Then send the email via the bulk email API (with single candidate)
      const emailRequestData = {
        candidateIds: [candidate.id],
        templateId: selectedTemplate?.id,
        customSubject: customSubject,
        customBody: customBody,
        sendImmediately: true,
      };

      console.log("📧 Sending email via bulk rejection API:", emailRequestData);

      const emailResult = await apiService.makeRequest<any>(
        "/api/emails/bulk-rejection",
        {
          method: "POST",
          body: JSON.stringify(emailRequestData),
        }
      );

      if (emailResult.success) {
        console.log(`✅ Successfully sent email to ${candidate.name}!`);
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
      console.error("Error sending rejection email:", error);
      setError("Failed to send rejection email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const { subject: previewSubject, body: previewBody } = getPreviewContent();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-in-out animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-red-50">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStep === "reason"
                    ? "Reject Candidate"
                    : "Send Rejection Email"}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentStep === "reason"
                    ? `Rejecting ${candidate.name}`
                    : `Choose email template for ${candidate.name}`}
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

          {/* Step Indicator */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center ${
                  currentStep === "reason" ? "text-red-600" : "text-green-600"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === "reason" ? "bg-red-100" : "bg-green-100"
                  }`}
                >
                  {currentStep === "reason" ? "1" : "✓"}
                </div>
                <span className="ml-2 text-sm font-medium">
                  Rejection Reason
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <div
                className={`flex items-center ${
                  currentStep === "email" ? "text-red-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === "email" ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Email Template</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-200px)]">
            {currentStep === "reason" && (
              <div className="p-6">
                <form onSubmit={handleReasonSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Reason for rejection *
                    </label>
                    <div className="space-y-2">
                      {commonReasons.map((reason) => (
                        <label key={reason} className="flex items-center">
                          <input
                            type="radio"
                            name="rejectionReason"
                            value={reason}
                            checked={selectedReason === reason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {reason}
                          </span>
                        </label>
                      ))}
                    </div>

                    {selectedReason === "Other" && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Please specify the reason..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional notes (optional)
                    </label>
                    <textarea
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Add any additional context or feedback for the candidate..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      These notes will be stored internally and can be
                      referenced later.
                    </p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">
                          Before rejecting this candidate:
                        </h4>
                        <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                          <li>
                            • Make sure you've thoroughly reviewed their
                            application
                          </li>
                          <li>
                            • Consider if they might be suitable for other
                            positions
                          </li>
                          <li>• This action cannot be easily undone</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !selectedReason ||
                        (selectedReason === "Other" && !customReason.trim())
                      }
                      className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Continue to Email Template
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentStep === "email" && (
              <div className="p-6 space-y-6">
                {/* Back button */}
                <div className="flex items-center">
                  <button
                    onClick={() => setCurrentStep("reason")}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Rejection Reason
                  </button>
                </div>

                {/* Template Selection */}
                <EmailTemplateSelector
                  onTemplateSelect={handleTemplateSelect}
                  selectedTemplateId={selectedTemplate?.id}
                  emailType="Reject"
                />

                {/* Status indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        {selectedTemplate
                          ? `Using template: ${selectedTemplate.name}`
                          : "Using custom email template"}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        Email will be sent via Gmail.{" "}
                        {customSubject.trim() && customBody.trim()
                          ? "Ready to send!"
                          : "Subject and body are required."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Customization - Always show when on email step */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter email content"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: {"{{candidateName}}"},{" "}
                      {"{{jobTitle}}"}, {"{{companyName}}"}
                    </p>
                  </div>

                  {/* Preview Toggle */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center text-sm text-secondary hover:text-accent transition-colors"
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Show Preview
                        </>
                      )}
                    </button>
                  </div>

                  {/* Preview */}
                  {showPreview && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Email Preview for {candidate.name}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-gray-500 font-medium">
                            Subject:
                          </span>
                          <p className="text-sm text-gray-900 mt-1 font-medium">
                            {previewSubject}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 font-medium">
                            Body:
                          </span>
                          <div className="text-sm text-gray-900 mt-1 bg-white border rounded p-3 font-mono leading-relaxed whitespace-pre-wrap">
                            {previewBody}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer for Email Step Action Buttons */}
          {currentStep === "email" && (
            <div className="border-t bg-white p-6">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={
                    submitting || !customSubject.trim() || !customBody.trim()
                  }
                  className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title={
                    !customSubject.trim() || !customBody.trim()
                      ? "Please fill in email subject and body"
                      : "Reject candidate and send email notification"
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Reject & Send Email
                    </>
                  )}
                </button>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
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

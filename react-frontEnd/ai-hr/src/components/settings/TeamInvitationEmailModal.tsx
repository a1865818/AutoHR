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
  Edit,
} from "lucide-react";
import { EmailTemplate } from "@/interfaces";
import { GmailAuthModal } from "../candidates/GmailAuthModal";
import { apiService } from "@/services/api";
import { teamService } from "@/services/teamService";
import { TEAM_INVITATION_TEMPLATES } from "@/data/teamInvitationTemplates";

interface TeamInvitationEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteeEmail: string;
  role: string;
  companyId: string;
  inviterName: string;
  companyName: string;
  onSuccess: () => void;
}

export function TeamInvitationEmailModal({
  isOpen,
  onClose,
  inviteeEmail,
  role,
  companyId,
  inviterName,
  companyName,
  onSuccess,
}: TeamInvitationEmailModalProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGmailAuthModal, setShowGmailAuthModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Set default template
      const defaultTemplate =
        TEAM_INVITATION_TEMPLATES.find((t) => t.isDefault) ||
        TEAM_INVITATION_TEMPLATES[0];
      setSelectedTemplate(defaultTemplate);
      setCustomSubject(defaultTemplate?.subject || "");
      setCustomBody(defaultTemplate?.body || "");
      setSubmitting(false);
      setError(null);
      setEmailSent(false);
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

      await sendTeamInvitationEmail();
    } catch (error) {
      console.error("Failed to check Gmail authorization:", error);
      setShowGmailAuthModal(true);
    }
  };

  const handleGmailAuthComplete = async () => {
    setShowGmailAuthModal(false);
    await sendTeamInvitationEmail();
  };

  const sendTeamInvitationEmail = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Use the team service to send the invitation email
      const emailResult = await teamService.sendTeamInvitationEmail({
        email: inviteeEmail,
        role: role,
        companyId: companyId,
        inviterName: inviterName,
        companyName: companyName,
        templateId: selectedTemplate?.id,
        customSubject: customSubject,
        customBody: customBody,
      });

      if (emailResult.success) {
        console.log(
          `✅ Successfully sent team invitation email to ${inviteeEmail}!`
        );
        setEmailSent(true);
        // Don't close immediately - let user see success message
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
      console.error("Error sending team invitation email:", error);
      setError("Failed to send email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const replacePlaceholders = (text: string) => {
    const invitationUrl = `http://localhost:3000/signup/hiring/existing-company/${companyId}`;

    return text
      .replace(/\{\{inviteeEmail\}\}/g, inviteeEmail)
      .replace(/\{\{inviterName\}\}/g, inviterName)
      .replace(/\{\{companyName\}\}/g, companyName)
      .replace(/\{\{role\}\}/g, role)
      .replace(/\{\{invitationUrl\}\}/g, invitationUrl);
  };

  const getPreviewContent = () => {
    const sampleSubject = replacePlaceholders(customSubject);
    const sampleBody = replacePlaceholders(customBody);

    return { subject: sampleSubject, body: sampleBody };
  };

  const { subject: previewSubject, body: previewBody } = getPreviewContent();

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Send Team Invitation Email
                </h2>
                <p className="text-sm text-gray-600">
                  Invite {inviteeEmail} to join {companyName} as {role}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {emailSent ? (
              // Success State
              <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Invitation Sent Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Your team invitation has been sent to{" "}
                    <span className="font-medium text-gray-900">
                      {inviteeEmail}
                    </span>
                    . They will receive an email with instructions to join{" "}
                    <span className="font-medium text-gray-900">
                      {companyName}
                    </span>{" "}
                    as a {role}.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                          What happens next?
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>
                            • The invited user will receive an email with a
                            signup link
                          </li>
                          <li>
                            • They can create a new account or use an existing
                            one
                          </li>
                          <li>
                            • Once they sign up, they'll be added to your team
                          </li>
                          <li>• You'll be notified when they join</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        onSuccess();
                        onClose();
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Done
                    </button>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setCustomSubject("");
                        setCustomBody("");
                        setSelectedTemplate(null);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Send Another Invitation
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Email Form State
              <div className="p-6 space-y-6">
                {/* Template Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Email Template
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Choose Email Template
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTemplateSelect(null)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Custom Email
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {TEAM_INVITATION_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedTemplate?.id === template.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Mail className="h-5 w-5 text-gray-400" />
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {template.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {replacePlaceholders(template.subject)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {template.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

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
                      <p className="text-xs text-blue-600 mt-1">
                        Email will be sent via Gmail.{" "}
                        {customSubject.trim() && customBody.trim()
                          ? "Ready to send!"
                          : "Subject and body are required."}
                      </p>
                    </div>
                  </div>
                </div>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Body
                    </label>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter email body..."
                    />
                  </div>
                </div>

                {/* Preview Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Email Preview
                    </h3>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
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

                  {showPreview && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Subject:
                        </h4>
                        <p className="text-sm text-gray-900">
                          {previewSubject}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Body:
                        </h4>
                        <div className="text-sm text-gray-900 whitespace-pre-wrap">
                          {previewBody}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!emailSent && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t flex-shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <button
                onClick={handleSendEmail}
                disabled={
                  submitting ||
                  !selectedTemplate ||
                  !customSubject.trim() ||
                  !customBody.trim()
                }
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation Email
                  </>
                )}
              </button>
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
    </>
  );
}

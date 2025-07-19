"use client";

import { useState } from "react";
import { X, Send, Mail, ArrowLeft } from "lucide-react";
import { TeamInvitationEmailModal } from "./TeamInvitationEmailModal";

interface InviteUserData {
  email: string;
  role: string;
  message?: string;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (userData: InviteUserData) => void;
  isLoading?: boolean;
  companyId?: string;
  companyName?: string;
  inviterName?: string;
}

export function InviteUserModal({
  isOpen,
  onClose,
  onInvite,
  isLoading = false,
  companyId,
  companyName,
  inviterName,
}: InviteUserModalProps) {
  const [currentStep, setCurrentStep] = useState<"basic" | "email">("basic");
  const [formData, setFormData] = useState<InviteUserData>({
    email: "",
    role: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<InviteUserData>>({});
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleChange = (field: keyof InviteUserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<InviteUserData> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.role.trim()) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Move to email step if we have company info, otherwise proceed with original flow
      if (companyId && companyName && inviterName) {
        setCurrentStep("email");
      } else {
        onInvite(formData);
      }
    }
  };

  const handleEmailSuccess = () => {
    // Call the original onInvite callback after email is sent
    onInvite(formData);
    setCurrentStep("basic");
    setShowEmailModal(false);
  };

  const handleBackToBasic = () => {
    setCurrentStep("basic");
  };

  const handleClose = () => {
    setFormData({
      email: "",
      role: "",
      message: "",
    });
    setErrors({});
    setCurrentStep("basic");
    setShowEmailModal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Background overlay with blur effect */}
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Invite Team Member
                </h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {currentStep === "basic" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.role ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="hr">HR</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Add a personal message to the invitation..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex">
                    <Mail className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        What happens next?
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        The invited user will receive an email with instructions
                        to join your team. They can either create a new account
                        or use an existing one.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? "Sending..." : "Next"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <button
                    onClick={handleBackToBasic}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Basic Info
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Invitation Summary
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Email:</strong> {formData.email}
                    </p>
                    <p>
                      <strong>Role:</strong> {formData.role}
                    </p>
                    {formData.message && (
                      <p>
                        <strong>Message:</strong> {formData.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex">
                    <Mail className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        Customize Email
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        You can now customize the invitation email that will be
                        sent to {formData.email}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Customize & Send Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Invitation Email Modal */}
      {showEmailModal && companyId && companyName && inviterName && (
        <TeamInvitationEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          inviteeEmail={formData.email}
          role={formData.role}
          companyId={companyId}
          inviterName={inviterName}
          companyName={companyName}
          onSuccess={handleEmailSuccess}
        />
      )}
    </div>
  );
}

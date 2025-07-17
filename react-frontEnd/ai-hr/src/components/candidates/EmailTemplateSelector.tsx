import React, { useState, useEffect } from "react";
import { Mail, Edit, Eye, Plus, Trash2 } from "lucide-react";
import { sessionCookies } from "@/utils/cookieUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  emailType: string; // "Reject" or "Success"
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplateSelectorProps {
  onTemplateSelect: (template: EmailTemplate | null) => void;
  selectedTemplateId?: string;
  emailType?: string; // Filter templates by type
}

export function EmailTemplateSelector({
  onTemplateSelect,
  selectedTemplateId,
  emailType,
}: EmailTemplateSelectorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [emailType]);

  const fetchTemplates = async () => {
    try {
      console.log(
        "🔍 Fetching email templates from:",
        `${API_BASE_URL}/api/email-templates`
      );

      // Get token from cookies first, then fallback to localStorage
      const sessionData = sessionCookies.getSessionData();
      let token = sessionData.authToken;

      if (!token) {
        token = localStorage.getItem("authToken");
      }

      console.log("🔍 EmailTemplateSelector: Token sources", {
        fromCookie: !!sessionData.authToken,
        fromStorage: !!token && !sessionData.authToken,
        hasToken: !!token,
      });

      // Build URL with email type filter if provided
      const url = emailType
        ? `${API_BASE_URL}/api/email-templates?emailType=${encodeURIComponent(
            emailType
          )}`
        : `${API_BASE_URL}/api/email-templates`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Email templates fetched successfully:", data);
        setTemplates(data);
      } else {
        console.error(
          "❌ Failed to fetch templates - Status:",
          response.status
        );
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
      }
    } catch (error) {
      console.error("❌ Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: EmailTemplate | null) => {
    onTemplateSelect(template);
  };

  const previewTemplate = (template: EmailTemplate) => {
    setShowPreview(template.id);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      // Get token from cookies first, then fallback to localStorage
      const sessionData = sessionCookies.getSessionData();
      let token = sessionData.authToken;

      if (!token) {
        token = localStorage.getItem("authToken");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/email-templates/${templateId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== templateId));
        if (selectedTemplateId === templateId) {
          onTemplateSelect(null);
        }
      } else {
        console.error(
          "❌ Failed to delete template - Status:",
          response.status
        );
      }
    } catch (error) {
      console.error("❌ Failed to delete template:", error);
    }
  };

  if (loading) {
    return (
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Choose Email Template
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </button>
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
        {templates.map((template) => (
          <div
            key={template.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedTemplateId === template.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-500">{template.subject}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    previewTemplate(template);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Preview template"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {!template.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(template.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
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

      {templates.length === 0 && (
        <div className="text-center py-8">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Templates Found
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first email template to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Template Preview</h3>
              <button
                onClick={() => setShowPreview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="border rounded-lg p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject:
                </label>
                <p className="text-sm text-gray-900">
                  {templates.find((t) => t.id === showPreview)?.subject}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content:
                </label>
                <div
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{
                    __html:
                      templates.find((t) => t.id === showPreview)?.body || "",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTemplateCreated={(newTemplate) => {
            setTemplates([...templates, newTemplate]);
            setShowCreateModal(false);
          }}
          emailType={emailType}
        />
      )}
    </div>
  );
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: (template: EmailTemplate) => void;
}

function CreateTemplateModal({
  isOpen,
  onClose,
  onTemplateCreated,
  emailType = "Reject",
}: CreateTemplateModalProps & { emailType?: string }) {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get token from cookies first, then fallback to localStorage
      const sessionData = sessionCookies.getSessionData();
      let token = sessionData.authToken;

      if (!token) {
        token = localStorage.getItem("authToken");
      }

      const response = await fetch(`${API_BASE_URL}/api/email-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          emailType: emailType || "Reject", // Default to Reject if no type specified
        }),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        onTemplateCreated(newTemplate);
        setFormData({ name: "", subject: "", body: "", isDefault: false });
      } else {
        console.error(
          "❌ Failed to create template - Status:",
          response.status
        );
      }
    } catch (error) {
      console.error("❌ Failed to create template:", error);
    } finally {
      setLoading(false);
    }
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
          className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto transform transition-all duration-300 ease-in-out animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Create Email Template</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Use {{candidateName}}, {{jobTitle}}, {{companyName}} for dynamic content"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Body
              </label>
              <textarea
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Use {{candidateName}}, {{jobTitle}}, {{companyName}} for dynamic content"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Set as default template
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

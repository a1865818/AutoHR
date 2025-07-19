import { JobFormData } from "@/interfaces";
import {
  Calendar,
  FileText,
  HelpCircle,
  Image,
  Users,
  Plus,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
import { jobService } from "@/services/jobService";
import { interviewService } from "@/services/interviewService";
import { useRouter } from "next/navigation";

interface InterviewTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  companyId: string;
}

interface ApplicationSettingsSectionProps {
  formData: JobFormData;
  updateNestedFormData: (
    parentField: string,
    childField: string,
    value: any
  ) => void;
  updateFormData: (data: Partial<JobFormData>) => void;
}

export function ApplicationSettingsSection({
  formData,
  updateNestedFormData,
  updateFormData,
}: ApplicationSettingsSectionProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [interviewTemplates, setInterviewTemplates] = useState<
    InterviewTemplate[]
  >([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Load interview templates on component mount
  useEffect(() => {
    const loadInterviewTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const templates = await jobService.getInterviewTemplatesForJobs();
        setInterviewTemplates(templates);

        // Auto-select default template if no template is selected
        if (!formData.interviewTemplateId && templates.length > 0) {
          const defaultTemplate = templates.find(
            (t: InterviewTemplate) => t.isDefault
          );
          if (defaultTemplate) {
            updateFormData({ interviewTemplateId: defaultTemplate.id });
          }
        }
      } catch (error) {
        console.error("Failed to load interview templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadInterviewTemplates();
  }, []);

  const handleCreateTemplate = () => {
    router.push("/interview-templates/create");
  };

  const handleCreateTemplateWithId = (templateId?: string) => {
    if (templateId) {
      router.push(`/interview-templates/edit?id=${templateId}`);
    } else {
      router.push("/interview-templates/create");
    }
  };

  const handleCreateCustomTemplate = async () => {
    setIsSavingDraft(true);
    try {
      // Create a placeholder template since template_id can't be null
      const placeholderTemplate = {
        name: "Custom Template (Edit Required)",
        description:
          "This is a custom template created during job editing. Please edit and configure the interview rounds.",
        isDefault: false,
      };

      const createdTemplate = await interviewService.createInterviewTemplate(
        placeholderTemplate
      );

      // Update form data with the placeholder template ID
      updateFormData({ interviewTemplateId: createdTemplate.id });

      // Redirect to edit the template
      handleCreateTemplateWithId(createdTemplate.id);
    } catch (error) {
      console.error("Failed to create custom template:", error);
      // Fallback to regular template creation
      handleCreateTemplateWithId(undefined);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const applicationRequirements = [
    {
      id: "resumeRequired",
      label: "Resume/CV Required",
      description: "Candidates must upload their resume",
      icon: FileText,
      checked: formData.applicationSettings.resumeRequired || false,
    },
    {
      id: "coverLetterRequired",
      label: "Cover Letter Required",
      description: "Candidates must submit a cover letter",
      icon: FileText,
      checked: formData.applicationSettings.coverLetterRequired || false,
    },
    {
      id: "portfolioRequired",
      label: "Portfolio Required",
      description: "Candidates must provide work samples/portfolio",
      icon: Image,
      checked: formData.applicationSettings.portfolioRequired || false,
    },
    {
      id: "questionsRequired",
      label: "Screening Questions Required",
      description: "Candidates must answer pre-screening questions",
      icon: HelpCircle,
      checked: formData.applicationSettings.questionsRequired || false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Application Settings
        </h2>

        {/* Application Deadline */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Deadline
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={formData.applicationSettings.deadline || ""}
              onChange={(e) =>
                updateNestedFormData(
                  "applicationSettings",
                  "deadline",
                  e.target.value
                )
              }
              min={today}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Leave blank for no deadline. Applications will close when you pause
            or close the job.
          </p>
        </div>

        {/* Interview Template Selection */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">
            Interview Process
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select the interview template that will be used for candidates
            applying to this position.
          </p>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Interview Template *
            </label>

            {loadingTemplates ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Loading interview templates...</span>
              </div>
            ) : (
              <select
                value={formData.interviewTemplateId || ""}
                onChange={(e) =>
                  updateFormData({
                    interviewTemplateId: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select an interview template</option>
                {interviewTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            )}

            {formData.interviewTemplateId && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                {(() => {
                  const selectedTemplate = interviewTemplates.find(
                    (t) => t.id === formData.interviewTemplateId
                  );
                  return selectedTemplate ? (
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {selectedTemplate.name}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedTemplate.description}
                      </p>
                      {selectedTemplate.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-2">
                          <Users className="w-3 h-3 mr-1" />
                          Default Template
                        </span>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Template Management Options */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCreateTemplate}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Template
              </button>

              <button
                type="button"
                onClick={handleCreateCustomTemplate}
                disabled={isSavingDraft}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingDraft
                  ? "Creating..."
                  : "Create Custom Template for This Job"}
              </button>
            </div>

            {interviewTemplates.length === 0 && !loadingTemplates && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="font-medium mb-2">
                  No interview templates available
                </p>
                <p className="mb-4">
                  You need to create an interview template to complete your job
                  setup. Templates define the interview process candidates will
                  go through.
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomTemplate}
                    disabled={isSavingDraft}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingDraft ? "Creating..." : "Create Custom Template"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Application Requirements */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">
            Application Requirements
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select what candidates need to submit with their application
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applicationRequirements.map((requirement) => {
              const Icon = requirement.icon;
              return (
                <div
                  key={requirement.id}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    requirement.checked
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() =>
                    updateNestedFormData(
                      "applicationSettings",
                      requirement.id,
                      !requirement.checked
                    )
                  }
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 p-2 rounded-md ${
                        requirement.checked ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          requirement.checked
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-sm font-medium ${
                            requirement.checked
                              ? "text-blue-900"
                              : "text-gray-900"
                          }`}
                        >
                          {requirement.label}
                        </h4>
                        <input
                          type="checkbox"
                          checked={requirement.checked}
                          onChange={(e) =>
                            updateNestedFormData(
                              "applicationSettings",
                              requirement.id,
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          requirement.checked
                            ? "text-blue-700"
                            : "text-gray-600"
                        }`}
                      >
                        {requirement.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Application Summary */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Application Summary
          </h4>
          <div className="text-sm text-gray-700 space-y-1">
            {formData.applicationSettings.deadline && (
              <p>
                • Applications due:{" "}
                {new Date(
                  formData.applicationSettings.deadline
                ).toLocaleDateString()}
              </p>
            )}

            <p>
              • Interview Template:{" "}
              {formData.interviewTemplateId
                ? (() => {
                    const selectedTemplate = interviewTemplates.find(
                      (t) => t.id === formData.interviewTemplateId
                    );
                    return selectedTemplate
                      ? selectedTemplate.name
                      : "Selected";
                  })()
                : "Not selected"}
            </p>

            {Object.values(formData.applicationSettings).some(
              (val) => val === true
            ) ? (
              <div>
                <p>• Required submissions:</p>
                <ul className="ml-4 space-y-1">
                  {formData.applicationSettings.resumeRequired && (
                    <li>- Resume/CV</li>
                  )}
                  {formData.applicationSettings.coverLetterRequired && (
                    <li>- Cover Letter</li>
                  )}
                  {formData.applicationSettings.portfolioRequired && (
                    <li>- Portfolio/Work Samples</li>
                  )}
                  {formData.applicationSettings.questionsRequired && (
                    <li>- Screening Questions</li>
                  )}
                </ul>
              </div>
            ) : (
              <p>
                • No specific requirements - candidates can apply with basic
                information
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-md">
          <h4 className="text-sm font-medium text-amber-900 mb-2">
            ⚠️ Application Requirements Tips
          </h4>
          <ul className="text-xs text-amber-800 space-y-1">
            <li>• Too many requirements may discourage applications</li>
            <li>• Consider your role is seniority when setting requirements</li>
            <li>
              • Portfolio is typically important for design/creative roles
            </li>
            <li>• Screening questions help filter candidates early</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

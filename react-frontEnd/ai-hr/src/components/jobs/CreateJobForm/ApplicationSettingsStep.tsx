import { JobFormData } from "@/interfaces";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Mail,
  Briefcase,
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

interface ApplicationSettingsStepProps {
  formData: JobFormData;
  updateFormData: (data: Partial<JobFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  onSaveDraft?: () => Promise<void>;
  onSaveDraftWithoutRedirect?: () => Promise<void>;
}

export function ApplicationSettingsStep({
  formData,
  updateFormData,
  onNext,
  onPrev,
  onSaveDraft,
  onSaveDraftWithoutRedirect,
}: ApplicationSettingsStepProps) {
  const router = useRouter();
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

  const handleApplicationSettingChange = (
    field: keyof JobFormData["applicationSettings"],
    value: string | boolean
  ) => {
    updateFormData({
      applicationSettings: {
        ...formData.applicationSettings,
        [field]: value,
      },
    });
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Get suggested date (30 days from now)
  const getSuggestedDate = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return thirtyDaysFromNow.toISOString().split("T")[0];
  };

  const isFormValid = () => {
    return (
      !!formData.applicationSettings.deadline && !!formData.interviewTemplateId
    );
  };

  const handleCreateTemplate = () => {
    router.push("/interview-templates/create");
  };

  const handleCreateTemplateWithId = (templateId?: string) => {
    if (templateId) {
      // If we have a template ID (placeholder), redirect to edit it
      router.push(`/interview-templates/edit?id=${templateId}`);
    } else {
      // Otherwise, create a new template
      router.push("/interview-templates/create");
    }
  };

  const handleSaveDraftAndRedirect = async () => {
    if (!onSaveDraftWithoutRedirect) return;

    setIsSavingDraft(true);
    try {
      // First create a placeholder template since template_id can't be null
      console.log("Creating placeholder template for draft...");

      const placeholderTemplate = {
        name: "Placeholder Template (Edit Required)",
        description:
          "This is a temporary template created during job draft. Please edit and configure the interview rounds.",
        isDefault: false,
      };

      const createdTemplate = await interviewService.createInterviewTemplate(
        placeholderTemplate
      );
      console.log("Placeholder template created:", createdTemplate);

      // Update form data with the placeholder template ID
      updateFormData({ interviewTemplateId: createdTemplate.id });

      // Wait a moment for the form data to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now save the draft with the template ID (without redirect)
      await onSaveDraftWithoutRedirect();

      // Redirect to create template page with the placeholder template ID for editing
      handleCreateTemplateWithId(createdTemplate.id);
    } catch (error) {
      console.error("Failed to save draft:", error);
      // If template creation fails, still try to save draft if deadline is set
      if (formData.applicationSettings.deadline && onSaveDraftWithoutRedirect) {
        try {
          await onSaveDraftWithoutRedirect();
          handleCreateTemplateWithId(undefined);
        } catch (draftError) {
          console.error("Failed to save draft without template:", draftError);
        }
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Application Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Application Deadline *
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Set when applications will close for this position.
        </p>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="date"
            value={formatDateForInput(formData.applicationSettings.deadline)}
            onChange={(e) =>
              handleApplicationSettingChange("deadline", e.target.value)
            }
            min={getMinDate()}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              handleApplicationSettingChange("deadline", getSuggestedDate())
            }
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Set to 30 days from now
          </button>
        </div>
      </div>

      {/* Interview Template Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Interview Process
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Select the interview template that will be used for candidates
          applying to this position.
        </p>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Interview Template *
          </label>

          {loadingTemplates ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

          {/* Alternative option to create new template */}
          {interviewTemplates.length > 0 &&
            !loadingTemplates &&
            onSaveDraft && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Need a custom template for this job?
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  You can save your job progress and create a new interview
                  template specifically for this position.
                </p>
                <button
                  type="button"
                  onClick={handleSaveDraftAndRedirect}
                  disabled={
                    isSavingDraft || !formData.applicationSettings.deadline
                  }
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingDraft
                    ? "Saving draft..."
                    : "Save Draft & Create Custom Template"}
                </button>
                {!formData.applicationSettings.deadline && (
                  <p className="text-xs text-gray-500 mt-2">
                    * Set an application deadline to enable draft saving
                  </p>
                )}
              </div>
            )}

          {interviewTemplates.length === 0 && !loadingTemplates && (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="font-medium mb-2">
                No interview templates available
              </p>
              <p className="mb-4">
                To save your job draft, you need to select an interview
                template. You can create one now or save your progress and
                create a template later.
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
                {onSaveDraft && (
                  <button
                    type="button"
                    onClick={handleSaveDraftAndRedirect}
                    disabled={
                      isSavingDraft || !formData.applicationSettings.deadline
                    }
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingDraft
                      ? "Saving draft..."
                      : "Save Draft & Create Template"}
                  </button>
                )}
              </div>
              {!formData.applicationSettings.deadline && (
                <p className="text-xs text-amber-500 mt-2">
                  * Set an application deadline to enable draft saving
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Application Requirements */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Application Requirements
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Select what candidates need to submit with their application.
        </p>

        <div className="space-y-4">
          {/* Resume */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="resumeRequired"
                type="checkbox"
                checked={formData.applicationSettings.resumeRequired}
                onChange={(e) =>
                  handleApplicationSettingChange(
                    "resumeRequired",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="resumeRequired"
                className="flex items-center cursor-pointer"
              >
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Resume/CV Required
                  </p>
                  <p className="text-sm text-gray-500">
                    Candidates must upload their resume or CV
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="coverLetterRequired"
                type="checkbox"
                checked={formData.applicationSettings.coverLetterRequired}
                onChange={(e) =>
                  handleApplicationSettingChange(
                    "coverLetterRequired",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="coverLetterRequired"
                className="flex items-center cursor-pointer"
              >
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Cover Letter Required
                  </p>
                  <p className="text-sm text-gray-500">
                    Candidates must write a cover letter
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Portfolio */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="portfolioRequired"
                type="checkbox"
                checked={formData.applicationSettings.portfolioRequired}
                onChange={(e) =>
                  handleApplicationSettingChange(
                    "portfolioRequired",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="portfolioRequired"
                className="flex items-center cursor-pointer"
              >
                <Image className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Portfolio Required
                  </p>
                  <p className="text-sm text-gray-500">
                    Candidates must provide a portfolio or work samples
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Questions */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="questionsRequired"
                type="checkbox"
                checked={formData.applicationSettings.questionsRequired}
                onChange={(e) =>
                  handleApplicationSettingChange(
                    "questionsRequired",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="questionsRequired"
                className="flex items-center cursor-pointer"
              >
                <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Screening Questions Required
                  </p>
                  <p className="text-sm text-gray-500">
                    Candidates must answer additional screening questions
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Application Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Application Summary
        </h4>
        <div className="text-sm text-blue-800">
          <p className="mb-1">
            <strong>Deadline:</strong>{" "}
            {formData.applicationSettings.deadline
              ? new Date(
                  formData.applicationSettings.deadline
                ).toLocaleDateString()
              : "Not set"}
          </p>
          <p className="mb-1">
            <strong>Interview Template:</strong>{" "}
            {formData.interviewTemplateId
              ? (() => {
                  const selectedTemplate = interviewTemplates.find(
                    (t) => t.id === formData.interviewTemplateId
                  );
                  return selectedTemplate ? selectedTemplate.name : "Selected";
                })()
              : "Not selected"}
          </p>
          <p className="mb-1">
            <strong>Required documents:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            {formData.applicationSettings.resumeRequired && <li>Resume/CV</li>}
            {formData.applicationSettings.coverLetterRequired && (
              <li>Cover Letter</li>
            )}
            {formData.applicationSettings.portfolioRequired && (
              <li>Portfolio</li>
            )}
            {formData.applicationSettings.questionsRequired && (
              <li>Screening Questions</li>
            )}
            {!formData.applicationSettings.resumeRequired &&
              !formData.applicationSettings.coverLetterRequired &&
              !formData.applicationSettings.portfolioRequired &&
              !formData.applicationSettings.questionsRequired && (
                <li className="text-blue-600">Basic application only</li>
              )}
          </ul>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">
          💡 Tips for Better Applications
        </h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Requiring a resume is recommended for most positions</li>
          <li>
            • Cover letters help assess communication skills and motivation
          </li>
          <li>• Portfolios are essential for creative and technical roles</li>
          <li>
            • Screening questions can help filter unqualified candidates early
          </li>
          <li>• Consider a 2-4 week application window for best results</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onPrev}
          className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!isFormValid()}
          className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

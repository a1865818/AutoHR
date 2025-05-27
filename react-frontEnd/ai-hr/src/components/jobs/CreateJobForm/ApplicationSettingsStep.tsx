import { JobFormData } from "@/interfaces";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Mail,
  Briefcase,
  Image,
} from "lucide-react";

interface ApplicationSettingsStepProps {
  formData: JobFormData;
  updateFormData: (data: Partial<JobFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ApplicationSettingsStep({
  formData,
  updateFormData,
  onNext,
  onPrev,
}: ApplicationSettingsStepProps) {
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
  const formatDateForInput = (dateString: string) => {
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
    return !!formData.applicationSettings.deadline;
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

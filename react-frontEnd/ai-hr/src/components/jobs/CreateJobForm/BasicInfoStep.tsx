import { JobFormData } from "@/interfaces";
import { ChevronRight } from "lucide-react";

interface BasicInfoStepProps {
  formData: JobFormData;
  updateFormData: (data: Partial<JobFormData>) => void;
  onNext: () => void;
}

export function BasicInfoStep({
  formData,
  updateFormData,
  onNext,
}: BasicInfoStepProps) {
  const handleInputChange = (field: keyof JobFormData, value: string) => {
    updateFormData({ [field]: value });
  };

  const handleSalaryChange = (
    field: keyof JobFormData["salary"],
    value: string | number
  ) => {
    updateFormData({
      salary: { ...formData.salary, [field]: value },
    });
  };

  const isFormValid = () => {
    return (
      formData.title &&
      formData.company &&
      formData.location &&
      formData.department
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Title */}
        <div className="md:col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Job Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Company *
          </label>
          <input
            type="text"
            id="company"
            value={formData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            placeholder="Loading company..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 focus:outline-none cursor-not-allowed"
            readOnly
            disabled
          />
          <p className="mt-1 text-xs text-gray-500">
            Automatically filled with your company information
          </p>
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Department *
          </label>
          <input
            type="text"
            id="department"
            value={formData.department}
            onChange={(e) => handleInputChange("department", e.target.value)}
            placeholder="e.g. Engineering"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Location *
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder="e.g. San Francisco, CA"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Location Type */}
        <div>
          <label
            htmlFor="locationType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Work Type
          </label>
          <select
            id="locationType"
            value={formData.locationType}
            onChange={(e) =>
              handleInputChange(
                "locationType",
                e.target.value as JobFormData["locationType"]
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="On-site">On-site</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Employment Type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) =>
              handleInputChange("type", e.target.value as JobFormData["type"])
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label
            htmlFor="experience"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Experience Level
          </label>
          <select
            id="experience"
            value={formData.experience}
            onChange={(e) => handleInputChange("experience", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select experience level</option>
            <option value="Entry Level">Entry Level (0-2 years)</option>
            <option value="Mid Level">Mid Level (2-5 years)</option>
            <option value="Senior Level">Senior Level (5-8 years)</option>
            <option value="Lead">Lead (8+ years)</option>
            <option value="Executive">Executive</option>
          </select>
        </div>
      </div>

      {/* Salary Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Salary Information (Optional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="salaryMin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Min Salary
            </label>
            <input
              type="number"
              id="salaryMin"
              value={formData.salary.min || ""}
              onChange={(e) =>
                handleSalaryChange(
                  "min",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              placeholder="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="salaryMax"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Max Salary
            </label>
            <input
              type="number"
              id="salaryMax"
              value={formData.salary.max || ""}
              onChange={(e) =>
                handleSalaryChange(
                  "max",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              placeholder="80000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Currency
            </label>
            <select
              id="currency"
              value={formData.salary.currency}
              onChange={(e) => handleSalaryChange("currency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="period"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Period
            </label>
            <select
              id="period"
              value={formData.salary.period || "per year"}
              onChange={(e) => handleSalaryChange("period", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="per hour">Per Hour</option>
              <option value="per month">Per Month</option>
              <option value="per year">Per Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t">
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

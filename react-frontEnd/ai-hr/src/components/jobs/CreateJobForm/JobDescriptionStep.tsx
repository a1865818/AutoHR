import { useState } from "react";
import { JobFormData } from "@/interfaces";
import { ChevronLeft, ChevronRight, Sparkles, Plus, X } from "lucide-react";

interface JobDescriptionStepProps {
  formData: JobFormData;
  updateFormData: (data: Partial<JobFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  onGenerateDescription: () => void;
  isGenerating: boolean;
}

export function JobDescriptionStep({
  formData,
  updateFormData,
  onNext,
  onPrev,
  onGenerateDescription,
  isGenerating,
}: JobDescriptionStepProps) {
  const [newResponsibility, setNewResponsibility] = useState("");

  const handleDescriptionChange = (value: string) => {
    updateFormData({ description: value });
  };

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      updateFormData({
        responsibilities: [
          ...formData.responsibilities,
          newResponsibility.trim(),
        ],
      });
      setNewResponsibility("");
    }
  };

  const removeResponsibility = (index: number) => {
    const updated = formData.responsibilities.filter((_, i) => i !== index);
    updateFormData({ responsibilities: updated });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addResponsibility();
    }
  };

  const isFormValid = () => {
    return formData.description && formData.responsibilities.length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Job Description */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Job Description *
          </label>
          <button
            onClick={onGenerateDescription}
            disabled={isGenerating || !formData.title}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate with AI"}
          </button>
        </div>

        {!formData.title && (
          <p className="text-sm text-gray-500 mb-2">
            Complete the job title in the previous step to enable AI generation
          </p>
        )}

        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Describe the role, company culture, and what makes this position exciting..."
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="mt-2 text-sm text-gray-500">
          Provide a compelling overview of the role and your company. This will
          be the first thing candidates see.
        </p>
      </div>

      {/* Responsibilities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Key Responsibilities *
        </label>

        {/* Add New Responsibility */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a key responsibility..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={addResponsibility}
              disabled={!newResponsibility.trim()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Press Enter or click + to add each responsibility
          </p>
        </div>

        {/* Responsibilities List */}
        {formData.responsibilities.length > 0 && (
          <div className="space-y-2">
            {formData.responsibilities.map((responsibility, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
              >
                <span className="text-sm text-gray-900">
                  • {responsibility}
                </span>
                <button
                  onClick={() => removeResponsibility(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {formData.responsibilities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No responsibilities added yet</p>
            <p className="text-xs mt-1">
              Add at least one responsibility to continue
            </p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Benefits & Perks (Optional)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Health Insurance",
            "Dental Insurance",
            "Vision Insurance",
            "401(k) Matching",
            "Flexible Schedule",
            "Remote Work Options",
            "Professional Development",
            "Gym Membership",
            "Free Meals",
            "Stock Options",
            "Paid Time Off",
            "Parental Leave",
          ].map((benefit) => (
            <label key={benefit} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.benefits.includes(benefit)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...formData.benefits, benefit]
                    : formData.benefits.filter((b) => b !== benefit);
                  updateFormData({ benefits: updated });
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{benefit}</span>
            </label>
          ))}
        </div>
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

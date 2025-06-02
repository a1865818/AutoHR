// components/apply/EducationForm.tsx
import { Education } from "@/interfaces";
import { Calendar, GraduationCap, Search } from "lucide-react";
import { useState } from "react";

interface EducationFormProps {
  education: Education | null;
  onSave: (edu: Education | Omit<Education, "id">) => void;
  onCancel: () => void;
}

export function EducationForm({
  education,
  onSave,
  onCancel,
}: EducationFormProps) {
  const [formData, setFormData] = useState<Omit<Education, "id">>({
    institution: education?.institution || "",
    major: education?.major || "",
    degree: education?.degree || "",
    location: education?.location || "",
    description: education?.description || "",
    startDate: education?.startDate || "",
    endDate: education?.endDate || "",
    isCurrentlyAttending: education?.isCurrentlyAttending || false,
  });

  // Track which fields have been touched by the user
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
  };

  const handleSave = () => {
    // Mark all required fields as touched when saving
    setTouchedFields(new Set(["institution"]));

    // Only save if required fields are filled
    if (formData.institution) {
      if (education) {
        onSave({ ...formData, id: education.id });
      } else {
        onSave(formData);
      }
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <div className="flex items-center mb-4">
        <GraduationCap className="h-6 w-6 text-gray-400 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          {education ? "Edit Education" : "Add Education"}
        </h3>
      </div>

      <p className="text-gray-600 mb-6">Fields marked with * are required.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institution* <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.institution}
              onChange={(e) =>
                setFormData({ ...formData, institution: e.target.value })
              }
              onBlur={() => handleFieldTouch("institution")}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {touchedFields.has("institution") && !formData.institution && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                !
              </span>
              Please provide institution
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Major
            </label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) =>
                setFormData({ ...formData, major: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Degree
            </label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) =>
                setFormData({ ...formData, degree: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Bachelor of Science"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School location
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe your studies, achievements, or relevant coursework"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <div className="relative">
              <input
                type="month"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <div className="relative">
              <input
                type="month"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={formData.isCurrentlyAttending}
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="currently-attending"
            checked={formData.isCurrentlyAttending}
            onChange={(e) =>
              setFormData({
                ...formData,
                isCurrentlyAttending: e.target.checked,
                endDate: e.target.checked ? "" : formData.endDate,
              })
            }
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="currently-attending"
            className="ml-2 text-sm text-gray-700"
          >
            I currently attend
          </label>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

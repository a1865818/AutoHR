// components/apply/ExperienceForm.tsx
import { Experience } from "@/interfaces";
import { Building, Calendar, Search } from "lucide-react";
import { useState, useEffect } from "react";

interface ExperienceFormProps {
  experience: Experience | null;
  onSave: (exp: Experience | Omit<Experience, "id">) => void;
  onCancel: () => void;
}

export function ExperienceForm({
  experience,
  onSave,
  onCancel,
}: ExperienceFormProps) {
  // Initialize form data from the experience prop
  const [formData, setFormData] = useState<Omit<Experience, "id">>({
    title: experience?.title || "",
    company: experience?.company || "",
    location: experience?.location || "",
    description: experience?.description || "",
    startDate: experience?.startDate || "",
    endDate: experience?.endDate || "",
    isCurrent: experience?.isCurrent || false,
  });

  // Update form data when experience prop changes (e.g., when editing a different experience entry)
  useEffect(() => {
    if (experience) {
      console.log("💼 Populating experience form with:", experience);
      setFormData({
        title: experience.title || "",
        company: experience.company || "",
        location: experience.location || "",
        description: experience.description || "",
        startDate: experience.startDate || "",
        endDate: experience.endDate || "",
        isCurrent: experience.isCurrent || false,
      });
    } else {
      // Reset form when adding new experience
      setFormData({
        title: "",
        company: "",
        location: "",
        description: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
      });
    }
  }, [experience]);

  // Track which fields have been touched by the user
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
  };

  const handleSave = () => {
    // Mark all required fields as touched when saving
    setTouchedFields(new Set(["title", "startDate"]));

    // Only save if required fields are filled
    if (
      formData.title &&
      formData.startDate &&
      (formData.isCurrent || formData.endDate)
    ) {
      if (experience) {
        onSave({ ...formData, id: experience.id });
      } else {
        onSave(formData);
      }
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <div className="flex items-center mb-4">
        <Building className="h-6 w-6 text-gray-400 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          {experience ? "Edit Experience" : "Add Experience"}
        </h3>
      </div>

      <p className="text-gray-600 mb-6">Fields marked with * are required.</p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title* <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                onBlur={() => handleFieldTouch("title")}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {touchedFields.has("title") && !formData.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                  !
                </span>
                Please provide title
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Office location
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
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From* <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="month"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                onBlur={() => handleFieldTouch("startDate")}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {touchedFields.has("startDate") && !formData.startDate && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                  !
                </span>
                Please provide start date
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To* <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="month"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                onBlur={() => handleFieldTouch("endDate")}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={formData.isCurrent}
                required={!formData.isCurrent}
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {touchedFields.has("endDate") &&
              !formData.endDate &&
              !formData.isCurrent && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                    !
                  </span>
                  Please provide end date
                </p>
              )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="current-work"
            checked={formData.isCurrent}
            onChange={(e) =>
              setFormData({
                ...formData,
                isCurrent: e.target.checked,
                endDate: e.target.checked ? "" : formData.endDate,
              })
            }
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="current-work" className="ml-2 text-sm text-gray-700">
            I currently work here
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

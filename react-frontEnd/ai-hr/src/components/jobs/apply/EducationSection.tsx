// components/apply/EducationSection.tsx
import { Education } from "@/interfaces";
import { Plus, X } from "lucide-react";
import { EducationForm } from "./EducationForm";

interface EducationSectionProps {
  education: Education[];
  showEducationForm: boolean;
  editingEducation: Education | null;
  setShowEducationForm: (show: boolean) => void;
  setEditingEducation: (edu: Education | null) => void;
  addEducation: (edu: Omit<Education, "id">) => void;
  updateEducation: (edu: Education) => void;
  removeEducation: (id: string) => void;
}

export function EducationSection({
  education,
  showEducationForm,
  editingEducation,
  setShowEducationForm,
  setEditingEducation,
  addEducation,
  updateEducation,
  removeEducation,
}: EducationSectionProps) {
  // Create a unified handler that can handle both add and update
  const handleSaveEducation = (edu: Education | Omit<Education, "id">) => {
    if ("id" in edu) {
      // It's an existing education entry (has id)
      updateEducation(edu);
    } else {
      // It's a new education entry (no id)
      addEducation(edu);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Education</h2>
        <button
          type="button"
          onClick={() => {
            setEditingEducation(null);
            setShowEducationForm(true);
          }}
          className="flex items-center px-4 py-2 text-purple-600 border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </button>
      </div>

      {education.map((edu) => (
        <div key={edu.id} className="border rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
              <p className="text-gray-600">
                {edu.degree} in {edu.major}
              </p>
              <p className="text-sm text-gray-500">{edu.location}</p>
              <p className="text-sm text-gray-500">
                {edu.startDate} -{" "}
                {edu.isCurrentlyAttending ? "Present" : edu.endDate}
              </p>
              {edu.description && (
                <p className="text-sm text-gray-700 mt-2">{edu.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditingEducation(edu);
                  setShowEducationForm(true);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => removeEducation(edu.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {showEducationForm && (
        <EducationForm
          education={editingEducation}
          onSave={handleSaveEducation}
          onCancel={() => {
            setShowEducationForm(false);
            setEditingEducation(null);
          }}
        />
      )}
    </div>
  );
}

// components/apply/ExperienceSection.tsx
import { Experience } from "@/interfaces";
import { Plus, X } from "lucide-react";
import { ExperienceForm } from "./ExperienceForm";

interface ExperienceSectionProps {
  experiences: Experience[];
  showExperienceForm: boolean;
  editingExperience: Experience | null;
  setShowExperienceForm: (show: boolean) => void;
  setEditingExperience: (exp: Experience | null) => void;
  addExperience: (exp: Omit<Experience, "id">) => void;
  updateExperience: (exp: Experience) => void;
  removeExperience: (id: string) => void;
}

export function ExperienceSection({
  experiences,
  showExperienceForm,
  editingExperience,
  setShowExperienceForm,
  setEditingExperience,
  addExperience,
  updateExperience,
  removeExperience,
}: ExperienceSectionProps) {
  // Create a unified handler that can handle both add and update
  const handleSaveExperience = (exp: Experience | Omit<Experience, "id">) => {
    if ("id" in exp) {
      // It's an existing experience entry (has id)
      updateExperience(exp);
    } else {
      // It's a new experience entry (no id)
      addExperience(exp);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
        <button
          type="button"
          onClick={() => {
            setEditingExperience(null);
            setShowExperienceForm(true);
          }}
          className="flex items-center px-4 py-2 text-purple-600 border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </button>
      </div>

      {experiences.map((exp) => (
        <div key={exp.id} className="border rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{exp.title}</h3>
              <p className="text-gray-600">
                {exp.company} • {exp.location}
              </p>
              <p className="text-sm text-gray-500">
                {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
              </p>
              <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditingExperience(exp);
                  setShowExperienceForm(true);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => removeExperience(exp.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {showExperienceForm && (
        <ExperienceForm
          experience={editingExperience}
          onSave={handleSaveExperience}
          onCancel={() => {
            setShowExperienceForm(false);
            setEditingExperience(null);
          }}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { JobFormData } from "@/interfaces";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

interface RequirementsStepProps {
  formData: JobFormData;
  updateFormData: (data: Partial<JobFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function RequirementsStep({
  formData,
  updateFormData,
  onNext,
  onPrev,
}: RequirementsStepProps) {
  const [newRequirement, setNewRequirement] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const addRequirement = () => {
    if (newRequirement.trim()) {
      updateFormData({
        requirements: [...formData.requirements, newRequirement.trim()],
      });
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    const updated = formData.requirements.filter((_, i) => i !== index);
    updateFormData({ requirements: updated });
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      updateFormData({
        qualifications: [...formData.qualifications, newQualification.trim()],
      });
      setNewQualification("");
    }
  };

  const removeQualification = (index: number) => {
    const updated = formData.qualifications.filter((_, i) => i !== index);
    updateFormData({ qualifications: updated });
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      updateFormData({
        skills: [...(formData.skills ?? []), newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    const updated = (formData.skills ?? []).filter((_, i) => i !== index);
    updateFormData({ skills: updated });
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    type: "requirement" | "qualification" | "skill"
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      switch (type) {
        case "requirement":
          addRequirement();
          break;
        case "qualification":
          addQualification();
          break;
        case "skill":
          addSkill();
          break;
      }
    }
  };

  const commonSkills = [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "TypeScript",
    "SQL",
    "AWS",
    "Docker",
    "Git",
    "Figma",
    "Project Management",
    "Communication",
    "Problem Solving",
    "Teamwork",
    "Leadership",
  ];

  const isFormValid = () => {
    return (
      formData.requirements.length > 0 && formData.qualifications.length > 0
    );
  };

  return (
    <div className="space-y-8">
      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Must-Have Requirements *
        </label>
        <p className="text-sm text-gray-500 mb-4">
          List the essential requirements that candidates must meet to be
          considered for this role.
        </p>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "requirement")}
              placeholder="e.g., Bachelor's degree in Computer Science"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            <button
              onClick={addRequirement}
              disabled={!newRequirement.trim()}
              className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{backgroundColor: '#066046'}}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {formData.requirements.length > 0 && (
          <div className="space-y-2">
            {formData.requirements.map((requirement, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-accent/10 px-3 py-2 rounded-md border border-accent/20"
              >
                <span className="text-sm text-gray-900">• {requirement}</span>
                <button
                  onClick={() => removeRequirement(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {formData.requirements.length === 0 && (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
            <p className="text-sm">No requirements added yet</p>
          </div>
        )}
      </div>

      {/* Qualifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Preferred Qualifications *
        </label>
        <p className="text-sm text-gray-500 mb-4">
          List preferred qualifications that would make a candidate stand out.
        </p>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newQualification}
              onChange={(e) => setNewQualification(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "qualification")}
              placeholder="e.g., Experience with cloud platforms"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            <button
              onClick={addQualification}
              disabled={!newQualification.trim()}
              className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{backgroundColor: '#066046'}}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {formData.qualifications.length > 0 && (
          <div className="space-y-2">
            {formData.qualifications.map((qualification, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-accent/10 px-3 py-2 rounded-md border border-accent/20"
              >
                <span className="text-sm text-gray-900">• {qualification}</span>
                <button
                  onClick={() => removeQualification(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {formData.qualifications.length === 0 && (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
            <p className="text-sm">No qualifications added yet</p>
          </div>
        )}
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Key Skills (Optional)
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Add specific skills that candidates should possess. These will help
          with matching.
        </p>

        {/* Quick Add Common Skills */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Add:</p>
          <div className="flex flex-wrap gap-2">
            {commonSkills
              .filter((skill) => !(formData.skills ?? []).includes(skill))
              .map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    updateFormData({
                      skills: [...(formData.skills ?? []), skill],
                    });
                  }}
                  className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {skill}
                </button>
              ))}
          </div>
        </div>

        {/* Custom Skill Input */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "skill")}
              placeholder="Add a custom skill..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            <button
              onClick={addSkill}
              disabled={!newSkill.trim()}
              className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{backgroundColor: '#066046'}}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(formData.skills ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(formData.skills ?? []).map((skill, index) => (
              <div
                key={index}
                className="inline-flex items-center bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm border border-secondary/20"
              >
                {skill}
                <button
                  onClick={() => removeSkill(index)}
                  className="ml-2 text-secondary hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
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
          className="inline-flex items-center px-6 py-2 text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{backgroundColor: '#066046'}}
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

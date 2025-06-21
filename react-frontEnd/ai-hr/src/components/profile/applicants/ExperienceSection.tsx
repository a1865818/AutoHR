"use client";

import { Briefcase, Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  location?: string;
  description?: string;
  achievements?: string[];
  skills?: string[];
}

interface ExperienceSectionProps {
  experience: Experience[];
  onUpdate: (experience: Experience[]) => void;
  isLoading?: boolean;
}

export function ExperienceSection({
  experience,
  onUpdate,
  isLoading = false,
}: ExperienceSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempExperience, setTempExperience] =
    useState<Experience[]>(experience);
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddExperience = () => {
    const newExperience: Experience = {
      id: `temp-${Date.now()}`,
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      location: "",
      description: "",
      achievements: [],
      skills: [],
    };
    setTempExperience([...tempExperience, newExperience]);
    setEditingId(newExperience.id);
    setIsEditing(true);
    setHasChanges(true);
  };

  const handleEditExperience = (id: string) => {
    setEditingId(id);
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleSaveExperience = () => {
    onUpdate(tempExperience);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setTempExperience(experience);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleDeleteExperience = (id: string) => {
    const updatedExperience = tempExperience.filter((exp) => exp.id !== id);
    setTempExperience(updatedExperience);
    setHasChanges(true);
  };

  const handleExperienceChange = (
    id: string,
    field: keyof Experience,
    value: string | string[]
  ) => {
    setTempExperience((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
    setHasChanges(true);
  };

  const handleAddAchievement = (id: string) => {
    setTempExperience((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? { ...exp, achievements: [...(exp.achievements || []), ""] }
          : exp
      )
    );
    setHasChanges(true);
  };

  const handleAchievementChange = (
    expId: string,
    index: number,
    value: string
  ) => {
    setTempExperience((prev) =>
      prev.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              achievements:
                exp.achievements?.map((achievement, i) =>
                  i === index ? value : achievement
                ) || [],
            }
          : exp
      )
    );
    setHasChanges(true);
  };

  const handleRemoveAchievement = (expId: string, index: number) => {
    setTempExperience((prev) =>
      prev.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              achievements:
                exp.achievements?.filter((_, i) => i !== index) || [],
            }
          : exp
      )
    );
    setHasChanges(true);
  };

  const handleAddSkill = (id: string) => {
    setTempExperience((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, skills: [...(exp.skills || []), ""] } : exp
      )
    );
    setHasChanges(true);
  };

  const handleSkillChange = (expId: string, index: number, value: string) => {
    setTempExperience((prev) =>
      prev.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              skills:
                exp.skills?.map((skill, i) => (i === index ? value : skill)) ||
                [],
            }
          : exp
      )
    );
    setHasChanges(true);
  };

  const handleRemoveSkill = (expId: string, index: number) => {
    setTempExperience((prev) =>
      prev.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              skills: exp.skills?.filter((_, i) => i !== index) || [],
            }
          : exp
      )
    );
    setHasChanges(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Briefcase className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
          <p className="text-sm text-gray-600">
            Add your professional work history and achievements
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Experience List */}
        <div className="space-y-4">
          {tempExperience.map((exp) => (
            <div
              key={exp.id}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {exp.position || "Position Title"}
                  </h4>
                  <p className="text-gray-600 font-medium">
                    {exp.company || "Company Name"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {exp.startDate} - {exp.endDate || "Present"}
                  </p>
                  {exp.location && (
                    <p className="text-sm text-gray-500">{exp.location}</p>
                  )}
                  {exp.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {exp.description}
                    </p>
                  )}

                  {/* Achievements */}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Key Achievements:
                      </h5>
                      <ul className="list-disc list-inside space-y-1">
                        {exp.achievements.map((achievement, index) => (
                          <li
                            key={`achievement-${exp.id}-${index}`}
                            className="text-sm text-gray-600"
                          >
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills */}
                  {exp.skills && exp.skills.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Skills Used:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {exp.skills.map((skill, index) => (
                          <span
                            key={`skill-${exp.id}-${index}`}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditExperience(exp.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingId === exp.id && (
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company *
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "company",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position *
                      </label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "position",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Job title"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "startDate",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="month"
                        value={exp.endDate || ""}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "endDate",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={exp.location || ""}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "location",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description
                    </label>
                    <textarea
                      value={exp.description || ""}
                      onChange={(e) =>
                        handleExperienceChange(
                          exp.id,
                          "description",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Describe your role, responsibilities, and key contributions..."
                    />
                  </div>

                  {/* Achievements */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Key Achievements
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddAchievement(exp.id)}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        + Add Achievement
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exp.achievements?.map((achievement, index) => (
                        <div
                          key={`achievement-edit-${exp.id}-${index}`}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={achievement}
                            onChange={(e) =>
                              handleAchievementChange(
                                exp.id,
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Describe a key achievement..."
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveAchievement(exp.id, index)
                            }
                            className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Skills Used
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddSkill(exp.id)}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        + Add Skill
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exp.skills?.map((skill, index) => (
                        <div
                          key={`skill-edit-${exp.id}-${index}`}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) =>
                              handleSkillChange(exp.id, index, e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="e.g., JavaScript, Project Management"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(exp.id, index)}
                            className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Experience Button */}
        <button
          onClick={handleAddExperience}
          disabled={isLoading}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600 font-medium">
              Add Work Experience
            </span>
          </div>
        </button>

        {/* Edit Mode Controls */}
        {isEditing && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Unsaved changes
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveExperience}
                  disabled={!hasChanges || isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

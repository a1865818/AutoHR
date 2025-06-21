"use client";

import { useState } from "react";
import { Target, Plus, Edit3, Trash2, Save, X, Star } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience?: number;
  description?: string;
}

interface SkillsSectionProps {
  skills: Skill[];
  onUpdate: (skills: Skill[]) => void;
  isLoading?: boolean;
}

export function SkillsSection({
  skills,
  onUpdate,
  isLoading = false,
}: SkillsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempSkills, setTempSkills] = useState<Skill[]>(skills);
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddSkill = () => {
    const newSkill: Skill = {
      id: `temp-${Date.now()}`,
      name: "",
      category: "Technical",
      proficiency: "intermediate",
      yearsOfExperience: 0,
      description: "",
    };
    setTempSkills([...tempSkills, newSkill]);
    setEditingId(newSkill.id);
    setIsEditing(true);
    setHasChanges(true);
  };

  const handleEditSkill = (id: string) => {
    setEditingId(id);
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleSaveSkills = () => {
    onUpdate(tempSkills);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setTempSkills(skills);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleDeleteSkill = (id: string) => {
    const updatedSkills = tempSkills.filter(skill => skill.id !== id);
    setTempSkills(updatedSkills);
    setHasChanges(true);
  };

  const handleSkillChange = (id: string, field: keyof Skill, value: any) => {
    setTempSkills(prev =>
      prev.map(skill =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    );
    setHasChanges(true);
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case "beginner":
        return "bg-gray-100 text-gray-800";
      case "intermediate":
        return "bg-blue-100 text-blue-800";
      case "advanced":
        return "bg-green-100 text-green-800";
      case "expert":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProficiencyStars = (proficiency: string) => {
    const stars = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };
    return stars[proficiency as keyof typeof stars] || 1;
  };

  const categories = [
    "Technical",
    "Programming Languages",
    "Frameworks & Libraries",
    "Databases",
    "Cloud & DevOps",
    "Design & Creative",
    "Business & Management",
    "Soft Skills",
    "Languages",
    "Other"
  ];

  const proficiencyLevels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" },
  ];

  // Group skills by category
  const groupedSkills = tempSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Target className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Skills & Expertise</h3>
          <p className="text-sm text-gray-600">
            Showcase your technical and soft skills to potential employers
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Skills by Category */}
        {Object.keys(groupedSkills).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorySkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{skill.name}</h5>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditSkill(skill.id)}
                            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(4)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < getProficiencyStars(skill.proficiency)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getProficiencyColor(
                            skill.proficiency
                          )}`}
                        >
                          {skill.proficiency.charAt(0).toUpperCase() + skill.proficiency.slice(1)}
                        </span>
                      </div>
                      
                      {skill.yearsOfExperience && skill.yearsOfExperience > 0 && (
                        <p className="text-xs text-gray-500 mb-2">
                          {skill.yearsOfExperience} year{skill.yearsOfExperience !== 1 ? 's' : ''} experience
                        </p>
                      )}
                      
                      {skill.description && (
                        <p className="text-xs text-gray-600">{skill.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No skills added yet</h3>
            <p className="text-gray-600 mb-4">
              Add your skills to showcase your expertise to potential employers
            </p>
          </div>
        )}

        {/* Add Skill Button */}
        <button
          onClick={handleAddSkill}
          disabled={isLoading}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600 font-medium">Add Skill</span>
          </div>
        </button>

        {/* Edit Form */}
        {editingId && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {tempSkills.find(s => s.id === editingId)?.id.startsWith('temp-') ? 'Add New Skill' : 'Edit Skill'}
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    value={tempSkills.find(s => s.id === editingId)?.name || ""}
                    onChange={(e) => handleSkillChange(editingId, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="e.g., JavaScript, Project Management"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={tempSkills.find(s => s.id === editingId)?.category || "Technical"}
                    onChange={(e) => handleSkillChange(editingId, "category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proficiency Level *
                  </label>
                  <select
                    value={tempSkills.find(s => s.id === editingId)?.proficiency || "intermediate"}
                    onChange={(e) => handleSkillChange(editingId, "proficiency", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {proficiencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={tempSkills.find(s => s.id === editingId)?.yearsOfExperience || ""}
                    onChange={(e) => handleSkillChange(editingId, "yearsOfExperience", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={tempSkills.find(s => s.id === editingId)?.description || ""}
                  onChange={(e) => handleSkillChange(editingId, "description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Describe your experience with this skill, certifications, or notable projects..."
                />
              </div>
            </div>
          </div>
        )}

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
                  onClick={handleSaveSkills}
                  disabled={!hasChanges || isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
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
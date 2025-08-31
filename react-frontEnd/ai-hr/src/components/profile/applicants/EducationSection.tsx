"use client";

import { Edit3, GraduationCap, Plus, Save, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  description?: string;
  location?: string;
}

interface EducationSectionProps {
  education: Education[];
  onUpdate: (education: Education[]) => void;
  isLoading?: boolean;
}

export function EducationSection({
  education,
  onUpdate,
  isLoading = false,
}: EducationSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempEducation, setTempEducation] = useState<Education[]>(
    education.map((edu, index) => ({
      ...edu,
      id: edu.id || `education-${index}-${Date.now()}`
    }))
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Update tempEducation when education prop changes
  useEffect(() => {
    setTempEducation(
      education.map((edu, index) => ({
        ...edu,
        id: edu.id || `education-${index}-${Date.now()}`
      }))
    );
  }, [education]);

  const handleAddEducation = () => {
    const newEducation: Education = {
      id: `temp-${Date.now()}`,
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
      location: "",
    };
    setTempEducation([...tempEducation, newEducation]);
    setEditingId(newEducation.id);
    setIsEditing(true);
    setHasChanges(true);
  };

  const handleEditEducation = (id: string) => {
    setEditingId(id);
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleSaveEducation = () => {
    onUpdate(tempEducation);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setTempEducation(education);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleDeleteEducation = (id: string) => {
    const updatedEducation = tempEducation.filter((edu) => edu.id !== id);
    setTempEducation(updatedEducation);
    setHasChanges(true);
  };

  const handleEducationChange = (
    id: string,
    field: keyof Education,
    value: string
  ) => {
    setTempEducation((prev) =>
      prev.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
    setHasChanges(true);
  };

  const degrees = [
    "High School Diploma",
    "Associate's Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate",
    "Certificate",
    "Other",
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <GraduationCap className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Education</h3>
          <p className="text-sm text-gray-600">
            Add your educational background and qualifications
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Education List */}
        <div className="space-y-4">
          {tempEducation.map((edu) => (
            <div
              key={edu.id}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {edu.institution || "Institution Name"}
                  </h4>
                  <p className="text-gray-600">
                    {edu.degree}{edu.degree && edu.fieldOfStudy && " in "}{edu.fieldOfStudy}
                  </p>
                  <p className="text-sm text-gray-500">
                    {edu.startDate} - {edu.endDate || "Present"}
                  </p>
                  {edu.location && (
                    <p className="text-sm text-gray-500">{edu.location}</p>
                  )}
                  {edu.gpa && (
                    <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                  )}
                  {edu.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {edu.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditEducation(edu.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEducation(edu.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingId === edu.id && (
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution *
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) =>
                          handleEducationChange(
                            edu.id,
                            "institution",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="University name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree *
                      </label>
                      <select
                        value={edu.degree}
                        onChange={(e) =>
                          handleEducationChange(
                            edu.id,
                            "degree",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select degree</option>
                        {degrees.map((degree) => (
                          <option key={degree} value={degree}>
                            {degree}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field of Study *
                      </label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) =>
                          handleEducationChange(
                            edu.id,
                            "fieldOfStudy",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={edu.location || ""}
                        onChange={(e) =>
                          handleEducationChange(
                            edu.id,
                            "location",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="City, Country"
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
                        value={edu.startDate}
                        onChange={(e) =>
                          handleEducationChange(
                            edu.id,
                            "startDate",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="month"
                        value={edu.endDate || ""}
                        onChange={(e) =>
                          handleEducationChange(
                            edu.id,
                            "endDate",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GPA
                      </label>
                      <input
                        type="text"
                        value={edu.gpa || ""}
                        onChange={(e) =>
                          handleEducationChange(edu.id, "gpa", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., 3.8/4.0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={edu.description || ""}
                      onChange={(e) =>
                        handleEducationChange(
                          edu.id,
                          "description",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Describe your academic achievements, relevant coursework, or honors..."
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Education Button */}
        <button
          onClick={handleAddEducation}
          disabled={isLoading}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600 font-medium">Add Education</span>
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
                  onClick={handleSaveEducation}
                  disabled={!hasChanges || isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
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

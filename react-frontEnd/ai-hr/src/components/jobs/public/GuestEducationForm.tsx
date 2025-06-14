"use client";

import { useState } from "react";
import { GraduationCap, Calendar, Plus, X, Edit2 } from "lucide-react";

export interface GuestEducation {
  institution: string;
  degree: string;
  major: string;
  location: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrentlyAttending: boolean;
}

interface GuestEducationFormProps {
  education: GuestEducation[];
  onEducationChange: (education: GuestEducation[]) => void;
}

export function GuestEducationForm({
  education,
  onEducationChange,
}: GuestEducationFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<GuestEducation>({
    institution: "",
    degree: "",
    major: "",
    location: "",
    description: "",
    startDate: "",
    endDate: "",
    isCurrentlyAttending: false,
  });

  const resetForm = () => {
    setFormData({
      institution: "",
      degree: "",
      major: "",
      location: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrentlyAttending: false,
    });
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (index: number) => {
    setFormData({ ...education[index] });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.institution.trim()) {
      return; // Basic validation
    }

    const newEducation = [...education];
    if (editingIndex !== null) {
      newEducation[editingIndex] = formData;
    } else {
      newEducation.push(formData);
    }

    onEducationChange(newEducation);
    resetForm();
  };

  const handleRemove = (index: number) => {
    const newEducation = education.filter((_, i) => i !== index);
    onEducationChange(newEducation);
  };

  const formatDateRange = (
    startDate: string,
    endDate?: string,
    isCurrentlyAttending?: boolean
  ) => {
    const start = startDate
      ? new Date(startDate + "-01").toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })
      : "";
    if (isCurrentlyAttending) return `${start} - Present`;
    const end = endDate
      ? new Date(endDate + "-01").toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })
      : "";
    return end ? `${start} - ${end}` : start;
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <GraduationCap className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Education <span className="text-sm text-gray-500">(Optional)</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Education
        </button>
      </div>

      {/* Education List */}
      {education.length > 0 && (
        <div className="space-y-3 mb-4">
          {education.map((edu, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {edu.institution}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {edu.degree}
                    {edu.major && ` in ${edu.major}`}
                  </p>
                  {edu.location && (
                    <p className="text-xs text-gray-500">{edu.location}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateRange(
                      edu.startDate,
                      edu.endDate,
                      edu.isCurrentlyAttending
                    )}
                  </p>
                  {edu.description && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {edu.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(index)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingIndex !== null ? "Edit Education" : "Add Education"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) =>
                  setFormData({ ...formData, institution: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Stanford University"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree
                </label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) =>
                    setFormData({ ...formData, degree: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bachelor of Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Major/Field of Study
                </label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) =>
                    setFormData({ ...formData, major: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Stanford, CA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Relevant coursework, achievements, or activities..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.isCurrentlyAttending}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
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
                I'm currently attending here
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!formData.institution.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {editingIndex !== null ? "Update" : "Add"} Education
              </button>
            </div>
          </div>
        </div>
      )}

      {education.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-500">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No education added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add your education background to enhance your profile
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Building, Calendar, Plus, X, Edit2 } from "lucide-react";

export interface GuestExperience {
  title: string;
  company: string;
  location: string;
  description: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

interface GuestExperienceFormProps {
  experiences: GuestExperience[];
  onExperiencesChange: (experiences: GuestExperience[]) => void;
}

export function GuestExperienceForm({
  experiences,
  onExperiencesChange,
}: GuestExperienceFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<GuestExperience>({
    title: "",
    company: "",
    location: "",
    description: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    });
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (index: number) => {
    setFormData({ ...experiences[index] });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.startDate) {
      return; // Basic validation
    }

    const newExperiences = [...experiences];
    if (editingIndex !== null) {
      newExperiences[editingIndex] = formData;
    } else {
      newExperiences.push(formData);
    }

    onExperiencesChange(newExperiences);
    resetForm();
  };

  const handleRemove = (index: number) => {
    const newExperiences = experiences.filter((_, i) => i !== index);
    onExperiencesChange(newExperiences);
  };

  const formatDateRange = (
    startDate: string,
    endDate?: string,
    isCurrent?: boolean
  ) => {
    const start = startDate
      ? new Date(startDate + "-01").toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })
      : "";
    if (isCurrent) return `${start} - Present`;
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
          <Building className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Work Experience{" "}
            <span className="text-sm text-gray-500">(Optional)</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Experience
        </button>
      </div>

      {/* Experience List */}
      {experiences.length > 0 && (
        <div className="space-y-3 mb-4">
          {experiences.map((exp, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{exp.title}</h3>
                  <p className="text-gray-600 text-sm">
                    {exp.company}
                    {exp.location && ` • ${exp.location}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {exp.description}
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
            {editingIndex !== null ? "Edit Experience" : "Add Experience"}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Google"
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
                placeholder="e.g., San Francisco, CA"
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
                placeholder="Brief description of your role and achievements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
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
                    disabled={formData.isCurrent}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="current-job"
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
              <label
                htmlFor="current-job"
                className="ml-2 text-sm text-gray-700"
              >
                I currently work here
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
                disabled={!formData.title.trim() || !formData.startDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {editingIndex !== null ? "Update" : "Add"} Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {experiences.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-500">
          <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No work experience added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add your work experience to strengthen your application
          </p>
        </div>
      )}
    </div>
  );
}

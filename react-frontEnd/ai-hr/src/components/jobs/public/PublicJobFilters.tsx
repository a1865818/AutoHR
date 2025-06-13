"use client";

import { X } from "lucide-react";

interface Filters {
  type: string[];
  experience: string[];
  workType: string[];
}

interface PublicJobFiltersProps {
  activeFilters: Filters;
  updateFilter: (category: keyof Filters, value: string) => void;
  clearAllFilters: () => void;
  totalJobs: number;
}

export function PublicJobFilters({
  activeFilters,
  updateFilter,
  clearAllFilters,
  totalJobs,
}: PublicJobFiltersProps) {
  const jobTypes = [
    { value: "Full-time", label: "Full-time" },
    { value: "Part-time", label: "Part-time" },
    { value: "Contract", label: "Contract" },
    { value: "Temporary", label: "Temporary" },
    { value: "Internship", label: "Internship" },
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-1 years)" },
    { value: "mid", label: "Mid Level (2-5 years)" },
    { value: "senior", label: "Senior Level (6+ years)" },
  ];

  const workTypes = [
    { value: "Remote", label: "Remote" },
    { value: "On-site", label: "On-site" },
    { value: "Hybrid", label: "Hybrid" },
  ];

  const hasActiveFilters = Object.values(activeFilters).some(
    (arr) => arr.length > 0
  );

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600 mb-6">
        {totalJobs} job{totalJobs !== 1 ? "s" : ""} found
      </div>

      {/* Job Type Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Job Type</h4>
        <div className="space-y-2">
          {jobTypes.map((type) => (
            <label key={type.value} className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.type.includes(type.value)}
                onChange={() => updateFilter("type", type.value)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Level Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Experience Level
        </h4>
        <div className="space-y-2">
          {experienceLevels.map((level) => (
            <label key={level.value} className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.experience.includes(level.value)}
                onChange={() => updateFilter("experience", level.value)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Work Type Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Work Type</h4>
        <div className="space-y-2">
          {workTypes.map((workType) => (
            <label key={workType.value} className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.workType.includes(workType.value)}
                onChange={() => updateFilter("workType", workType.value)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {workType.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Active Filters
          </h4>
          <div className="flex flex-wrap gap-2">
            {activeFilters.type.map((type) => (
              <span
                key={type}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {type}
                <button
                  onClick={() => updateFilter("type", type)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {activeFilters.experience.map((exp) => (
              <span
                key={exp}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {
                  experienceLevels
                    .find((e) => e.value === exp)
                    ?.label.split(" (")[0]
                }
                <button
                  onClick={() => updateFilter("experience", exp)}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {activeFilters.workType.map((workType) => (
              <span
                key={workType}
                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
              >
                {workType}
                <button
                  onClick={() => updateFilter("workType", workType)}
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Call-to-Action */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">
            Create an account for more filters
          </h4>
          <p className="text-xs text-blue-700 mb-2">
            Save searches, get personalized recommendations, and track
            applications.
          </p>
          <div className="flex space-x-2">
            <a
              href="/signup"
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Sign Up Free
            </a>
            <a
              href="/login"
              className="text-xs text-blue-600 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

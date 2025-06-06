import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";

interface Filters {
  type: string[];
  experience: string[];
  location: string[];
  locationType: string[];
}

interface FilterCounts {
  type: Record<string, number>;
  experience: Record<string, number>;
  location: Record<string, number>;
  locationType: Record<string, number>;
}

interface ApplicantJobFilterSidebarProps {
  expandedFilters: {
    type: boolean;
    experience: boolean;
    location: boolean;
    locationType: boolean;
  };
  toggleFilter: (filterType: keyof Filters) => void;
  activeFilters: Filters;
  updateFilter: (
    category: keyof Filters,
    value: string,
    isActive: boolean
  ) => void;
  clearAllFilters: () => void;
  filterCounts: FilterCounts;
}

export function ApplicantJobFilterSidebar({
  expandedFilters,
  toggleFilter,
  activeFilters,
  updateFilter,
  clearAllFilters,
  filterCounts,
}: ApplicantJobFilterSidebarProps) {
  const hasActiveFilters = Object.values(activeFilters).some(
    (arr) => arr.length > 0
  );

  const FilterSection = ({
    title,
    filterKey,
    options,
  }: {
    title: string;
    filterKey: keyof Filters;
    options: Array<{ value: string; label: string; count: number }>;
  }) => (
    <div className="border-b border-gray-200 pb-4">
      <button
        className="flex items-center justify-between w-full py-2 text-left"
        onClick={() => toggleFilter(filterKey)}
      >
        <span className="font-medium text-gray-900">{title}</span>
        {expandedFilters[filterKey] ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {expandedFilters[filterKey] && (
        <div className="mt-3 space-y-2">
          {options.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={activeFilters[filterKey].includes(option.value)}
                onChange={(e) =>
                  updateFilter(filterKey, option.value, e.target.checked)
                }
              />
              <span className="ml-3 text-sm text-gray-700">{option.label}</span>
              <span className="ml-auto text-sm text-gray-500">
                ({option.count})
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  // Prepare filter options
  const employmentTypeOptions = Object.entries(filterCounts.type).map(
    ([value, count]) => ({
      value,
      label: value,
      count,
    })
  );

  const experienceOptions = Object.entries(filterCounts.experience).map(
    ([value, count]) => ({
      value,
      label: value,
      count,
    })
  );

  const locationTypeOptions = Object.entries(filterCounts.locationType).map(
    ([value, count]) => ({
      value,
      label: value,
      count,
    })
  );

  const locationOptions = Object.entries(filterCounts.location)
    .slice(0, 10) // Limit to top 10 locations
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }));

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <FilterSection
          title="Job Type"
          filterKey="type"
          options={employmentTypeOptions}
        />

        <FilterSection
          title="Experience Level"
          filterKey="experience"
          options={experienceOptions}
        />

        <FilterSection
          title="Work Style"
          filterKey="locationType"
          options={locationTypeOptions}
        />

        <FilterSection
          title="Location"
          filterKey="location"
          options={locationOptions}
        />
      </div>
    </div>
  );
}

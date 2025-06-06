import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  count: number;
}

interface Filters {
  status: string[];
  type: string[];
  experience: string[];
  location: string[];
}

interface JobFilterSidebarProps {
  expandedFilters: {
    status: boolean;
    type: boolean;
    experience: boolean;
    location: boolean;
  };
  toggleFilter: (
    filterType: "status" | "type" | "experience" | "location"
  ) => void;
  activeFilters: Filters;
  updateFilter: (
    category: keyof Filters,
    value: string,
    isActive: boolean
  ) => void;
  clearAllFilters: () => void;
  filterCounts: {
    status: Record<string, number>;
    type: Record<string, number>;
    experience: Record<string, number>;
    location: Record<string, number>;
  };
}

export function JobFilterSidebar({
  expandedFilters,
  toggleFilter,
  activeFilters,
  updateFilter,
  clearAllFilters,
  filterCounts,
}: JobFilterSidebarProps) {
  const statusFilters: Omit<FilterOption, "count">[] = [
    { id: "Active", label: "Active" },
    { id: "Paused", label: "Paused" },
    { id: "Closed", label: "Closed" },
  ];

  const typeFilters: Omit<FilterOption, "count">[] = [
    { id: "Full-Time", label: "Full-Time" },
    { id: "Part-Time", label: "Part-Time" },
    { id: "Contract", label: "Contract" },
    { id: "Internship", label: "Internship" },
  ];

  const experienceFilters: Omit<FilterOption, "count">[] = [
    { id: "Entry", label: "0-2 Years" },
    { id: "Mid", label: "2-5 Years" },
    { id: "Senior", label: "5+ Years" },
  ];

  const locationFilters: Omit<FilterOption, "count">[] = [
    { id: "Chicago", label: "Chicago, IL" },
    { id: "Remote", label: "Remote" },
    { id: "Hybrid", label: "Hybrid" },
  ];

  const handleFilterChange = (
    category: keyof Filters,
    filterId: string,
    checked: boolean
  ) => {
    updateFilter(category, filterId, checked);
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (arr) => arr.length > 0
  );

  const FilterSection = ({
    title,
    filterKey,
    filters,
    category,
  }: {
    title: string;
    filterKey: keyof typeof expandedFilters;
    filters: Omit<FilterOption, "count">[];
    category: keyof Filters;
  }) => (
    <div className="mb-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => toggleFilter(filterKey)}
      >
        <div className="flex items-center">
          {expandedFilters[filterKey] ? (
            <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
          )}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            // Clear this specific filter category
            activeFilters[category].forEach((value) => {
              updateFilter(category, value, false);
            });
          }}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {expandedFilters[filterKey] && (
        <ul className="ml-4 mt-1 space-y-1">
          {filters.map((item) => {
            const isChecked = activeFilters[category].includes(item.id);
            const count = filterCounts[category][item.id] || 0;

            return (
              <li key={item.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${category}-${item.id}`}
                  checked={isChecked}
                  onChange={(e) =>
                    handleFilterChange(category, item.id, e.target.checked)
                  }
                  className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`${category}-${item.id}`}
                  className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700 cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div className="w-52 bg-white border-r flex-shrink-0 flex flex-col">
      {/* Filters section */}
      <div className="px-4 py-3">
        <h3 className="text-xs font-medium text-gray-500 mb-2">Filters</h3>

        <FilterSection
          title="Status"
          filterKey="status"
          filters={statusFilters}
          category="status"
        />

        <FilterSection
          title="Job Type"
          filterKey="type"
          filters={typeFilters}
          category="type"
        />

        <FilterSection
          title="Experience"
          filterKey="experience"
          filters={experienceFilters}
          category="experience"
        />

        <FilterSection
          title="Location"
          filterKey="location"
          filters={locationFilters}
          category="location"
        />

        {/* Filter buttons */}
        <div className="flex space-x-2 mt-6">
          <button className="flex-1 bg-blue-500 text-white rounded-md py-1.5 text-xs font-medium hover:bg-blue-600 flex items-center justify-center transition-colors">
            <Plus className="h-3 w-3 mr-1" /> Add filter
          </button>
          <button
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              hasActiveFilters
                ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

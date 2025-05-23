// components/jobs/JobFilterSidebar.tsx
import { FilterOptionJobs } from "@/interfaces";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

// Define the filter data for jobs - Updated for Australian market
const favorites: FilterOptionJobs[] = [
  { id: "active", label: "Active", count: 18, active: true },
  { id: "urgent", label: "Urgent", count: 3 },
  { id: "high-priority", label: "High Priority", count: 5 },
  { id: "draft", label: "Draft", count: 4 },
];

const statusFilters: FilterOptionJobs[] = [
  { id: "active", label: "Active", count: 18, active: true },
  { id: "paused", label: "Paused", count: 2 },
  { id: "closed", label: "Closed", count: 6 },
];

const typeFilters: FilterOptionJobs[] = [
  { id: "full-time", label: "Full-Time", count: 14, active: true },
  { id: "part-time", label: "Part-Time", count: 3, active: true },
  { id: "contract", label: "Contract", count: 5 },
  { id: "casual", label: "Casual", count: 4 }, // Changed from Internship to Casual (more common in Australia)
];

const experienceFilters: FilterOptionJobs[] = [
  { id: "entry", label: "0-2 Years", count: 6 },
  { id: "mid", label: "2-5 Years", count: 8, active: true },
  { id: "senior", label: "5+ Years", count: 12, active: true },
];

const locationFilters: FilterOptionJobs[] = [
  { id: "sydney", label: "Sydney, NSW", count: 8, active: true },
  { id: "melbourne", label: "Melbourne, VIC", count: 7 },
  { id: "brisbane", label: "Brisbane, QLD", count: 4 },
  { id: "perth", label: "Perth, WA", count: 3 },
  { id: "adelaide", label: "Adelaide, SA", count: 2 },
  { id: "remote", label: "Remote", count: 6 },
];

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
}

// The rest of the component remains unchanged
export function JobFilterSidebar({
  expandedFilters,
  toggleFilter,
}: JobFilterSidebarProps) {
  return (
    <div className="w-52 bg-white border-r flex-shrink-0 flex flex-col">
      {/* Favorites section */}
      <div className="px-4 py-3">
        <h3 className="text-xs font-medium text-gray-500 mb-2">Favorites</h3>
        <ul className="space-y-1">
          {favorites.map((item) => (
            <li key={item.id}>
              <button
                className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-left ${
                  item.active
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-sm">{item.label}</span>
                <span className="text-xs text-gray-500">{item.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Filters section */}
      <div className="px-4 py-3 border-t">
        <h3 className="text-xs font-medium text-gray-500 mb-2">Filters</h3>

        {/* Status filter */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter("status")}
          >
            <div className="flex items-center">
              {expandedFilters.status ? (
                <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
              )}
              <span className="text-sm font-medium text-gray-700">Status</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="h-3 w-3" />
            </button>
          </div>

          {expandedFilters.status && (
            <ul className="ml-4 mt-1 space-y-1">
              {statusFilters.map((item) => (
                <li key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`status-${item.id}`}
                    checked={item.active}
                    readOnly
                    className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`status-${item.id}`}
                    className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-500">{item.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Job Type filter */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter("type")}
          >
            <div className="flex items-center">
              {expandedFilters.type ? (
                <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
              )}
              <span className="text-sm font-medium text-gray-700">
                Job Type
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="h-3 w-3" />
            </button>
          </div>

          {expandedFilters.type && (
            <ul className="ml-4 mt-1 space-y-1">
              {typeFilters.map((item) => (
                <li key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`type-${item.id}`}
                    checked={item.active}
                    readOnly
                    className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`type-${item.id}`}
                    className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-500">{item.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Experience filter */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter("experience")}
          >
            <div className="flex items-center">
              {expandedFilters.experience ? (
                <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
              )}
              <span className="text-sm font-medium text-gray-700">
                Experience
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="h-3 w-3" />
            </button>
          </div>

          {expandedFilters.experience && (
            <ul className="ml-4 mt-1 space-y-1">
              {experienceFilters.map((item) => (
                <li key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`experience-${item.id}`}
                    checked={item.active}
                    readOnly
                    className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`experience-${item.id}`}
                    className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-500">{item.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Location filter */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter("location")}
          >
            <div className="flex items-center">
              {expandedFilters.location ? (
                <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
              )}
              <span className="text-sm font-medium text-gray-700">
                Location
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="h-3 w-3" />
            </button>
          </div>

          {expandedFilters.location && (
            <ul className="ml-4 mt-1 space-y-1">
              {locationFilters.map((item) => (
                <li key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`location-${item.id}`}
                    checked={item.active}
                    readOnly
                    className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`location-${item.id}`}
                    className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-500">{item.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex space-x-2 mt-6">
          <button className="flex-1 bg-blue-500 text-white rounded-md py-1.5 text-xs font-medium hover:bg-blue-600 flex items-center justify-center">
            <Plus className="h-3 w-3 mr-1" /> Add filter
          </button>
          <button className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-md py-1.5 text-xs font-medium hover:bg-gray-50">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

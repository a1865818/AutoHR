import { FilterOption } from "@/interfaces";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

// Define the filter data
const favorites: FilterOption[] = [
  { id: "qualified", label: "Qualified", count: 32, active: true },
  { id: "new", label: "New", count: 8 },
  { id: "not-connected", label: "Not connected", count: 12 },
  { id: "followed", label: "Followed", count: 8 },
];

const statusFilters: FilterOption[] = [
  { id: "qualified", label: "Qualified", count: 26, active: true },
  { id: "new", label: "New", count: 0 },
  { id: "disqualified", label: "Disqualified", count: 0 },
];

const stageFilters: FilterOption[] = [
  { id: "hired", label: "Hired", count: 4, active: true },
  { id: "applied", label: "Applied", count: 12, active: true },
  { id: "interview", label: "Interview", count: 6, active: true },
  { id: "phone-interview", label: "Phone Interview", count: 2 },
  { id: "offer", label: "Offer", count: 2, active: true },
  { id: "evaluation", label: "Evaluation", count: 6 },
];

interface FilterSidebarProps {
  expandedFilters: {
    status: boolean;
    stage: boolean;
  };
  toggleFilter: (filterType: "status" | "stage") => void;
}

export function FilterSidebar({
  expandedFilters,
  toggleFilter,
}: FilterSidebarProps) {
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

        {/* Stage filter */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter("stage")}
          >
            <div className="flex items-center">
              {expandedFilters.stage ? (
                <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
              )}
              <span className="text-sm font-medium text-gray-700">Stage</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="h-3 w-3" />
            </button>
          </div>

          {expandedFilters.stage && (
            <ul className="ml-4 mt-1 space-y-1">
              {stageFilters.map((item) => (
                <li key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`stage-${item.id}`}
                    checked={item.active}
                    readOnly
                    className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`stage-${item.id}`}
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

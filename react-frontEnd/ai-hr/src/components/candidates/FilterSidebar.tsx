import { FilterOption } from "@/interfaces";
import { InterviewStageConfig } from "@/utils/dynamicInterviewStageConfig";
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";

// Status filters (static - same as original)
const statusFilters: Omit<FilterOption, "count">[] = [
  { id: "in-progress", label: "In Progress" },
  { id: "offered", label: "Offered" },
  { id: "hired", label: "Hired" },
  { id: "rejected", label: "Rejected" },
];

// Status color mapping
const getStatusColor = (statusId: string) => {
  const colorMap: Record<string, string> = {
    "in-progress": "text-blue-600",
    offered: "text-purple-600",
    hired: "text-green-600",
    rejected: "text-red-600",
  };
  return colorMap[statusId] || "text-gray-600";
};

interface JobFilter {
  id: string;
  title: string;
  department?: string;
}

interface StageConfig {
  id: string;
  label: string;
  color: string;
  icon: string;
  order: number;
  description: string;
}

// Tooltip component for job titles (same as original)
interface TooltipProps {
  content: string;
  department?: string;
  children: React.ReactNode;
}

function Tooltip({ content, department, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute left-0 top-full mt-1 z-[9999] bg-gray-900 text-white text-xs rounded-md py-2 px-3 shadow-xl max-w-36 w-max">
          <div className="font-medium break-words">{content}</div>
          {department && (
            <div className="text-gray-300 mt-1 break-words">{department}</div>
          )}
          <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
        </div>
      )}
    </div>
  );
}

interface FilterSidebarProps {
  expandedFilters: {
    status: boolean;
    stage: boolean;
    position: boolean;
  };
  toggleFilter: (filterType: "status" | "stage" | "position") => void;
  activeFilters: {
    status: string[];
    stage: string[];
    position: string[];
  };
  onFilterChange: (
    filterType: "status" | "stage" | "position",
    filterId: string,
    checked: boolean
  ) => void;
  onClearFilters: () => void;
  filterCounts: {
    status: Record<string, number>;
    stage: Record<string, number>;
    position: Record<string, number>;
  };
  availableJobs: JobFilter[];
  stageConfigs: StageConfig[];
}

export function FilterSidebar({
  expandedFilters,
  toggleFilter,
  activeFilters,
  onFilterChange,
  onClearFilters,
  filterCounts,
  availableJobs,
  stageConfigs,
}: FilterSidebarProps) {
  const handleCheckboxChange = (
    filterType: "status" | "stage" | "position",
    filterId: string,
    checked: boolean
  ) => {
    onFilterChange(filterType, filterId, checked);
  };

  return (
    <div className="w-52 bg-white border-r flex-shrink-0 flex flex-col">
      {/* Filters section */}
      <div className="px-4 py-3 border-t flex-1 overflow-y-auto">
        <h3 className="text-xs font-medium text-gray-500 mb-2">Filters</h3>

        {/* Position filter (SAME AS ORIGINAL) */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-1 py-1"
            onClick={() => toggleFilter("position")}
          >
            <div className="flex items-center">
              {expandedFilters.position ? (
                <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
              )}
              <Briefcase className="h-3 w-3 text-blue-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">
                Position
              </span>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={(e) => {
                e.stopPropagation();
                activeFilters.position.forEach((filterId) => {
                  onFilterChange("position", filterId, false);
                });
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {expandedFilters.position && (
            <ul className="ml-4 mt-1 space-y-1">
              {availableJobs.map((job) => {
                const isChecked = activeFilters.position.includes(job.id);
                return (
                  <li key={job.id} className="flex items-center relative">
                    <input
                      type="checkbox"
                      id={`position-${job.id}`}
                      checked={isChecked}
                      onChange={(e) =>
                        handleCheckboxChange(
                          "position",
                          job.id,
                          e.target.checked
                        )
                      }
                      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`position-${job.id}`}
                      className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700 cursor-pointer min-w-0"
                    >
                      <div className="min-w-0 flex-1">
                        <Tooltip
                          content={job.title}
                          department={job.department}
                        >
                          <span className="block truncate hover:text-blue-600 transition-colors">
                            {job.title}
                          </span>
                        </Tooltip>
                        {job.department && (
                          <Tooltip content={job.department}>
                            <span className="text-xs text-gray-500 truncate block hover:text-gray-700 transition-colors">
                              {job.department}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {filterCounts.position[job.id] || 0}
                      </span>
                    </label>
                  </li>
                );
              })}
              {availableJobs.length === 0 && (
                <li className="text-center py-2">
                  <p className="text-xs text-gray-400">No positions found</p>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Status filter (SAME AS ORIGINAL) */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-1 py-1"
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
            <button
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={(e) => {
                e.stopPropagation();
                activeFilters.status.forEach((filterId) => {
                  onFilterChange("status", filterId, false);
                });
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {expandedFilters.status && (
            <ul className="ml-4 mt-1 space-y-1">
              {statusFilters.map((item) => {
                const isChecked = activeFilters.status.includes(item.id);
                return (
                  <li key={item.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`status-${item.id}`}
                      checked={isChecked}
                      onChange={(e) =>
                        handleCheckboxChange(
                          "status",
                          item.id,
                          e.target.checked
                        )
                      }
                      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`status-${item.id}`}
                      className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span
                          className={`h-2 w-2 rounded-full mr-2 ${
                            item.id === "in-progress"
                              ? "bg-blue-500"
                              : item.id === "offered"
                              ? "bg-purple-500"
                              : item.id === "hired"
                              ? "bg-green-500"
                              : item.id === "rejected"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <span className={getStatusColor(item.id)}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {filterCounts.status[item.id] || 0}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* UPDATED: Dynamic Stage filter */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-1 py-1"
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
            <button
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={(e) => {
                e.stopPropagation();
                activeFilters.stage.forEach((filterId) => {
                  onFilterChange("stage", filterId, false);
                });
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {expandedFilters.stage && (
            <ul className="ml-4 mt-1 space-y-1">
              {stageConfigs.map((stageConfig) => {
                const isChecked = activeFilters.stage.includes(stageConfig.id);
                return (
                  <li key={stageConfig.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`stage-${stageConfig.id}`}
                      checked={isChecked}
                      onChange={(e) =>
                        onFilterChange(
                          "stage",
                          stageConfig.id,
                          e.target.checked
                        )
                      }
                      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`stage-${stageConfig.id}`}
                      className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700 cursor-pointer"
                    >
                      <div className="flex items-center">
                        {InterviewStageConfig.getStageIcon(stageConfig.id)}
                        <span className="ml-2" title={stageConfig.description}>
                          {stageConfig.label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {filterCounts.stage[stageConfig.id] || 0}
                      </span>
                    </label>
                  </li>
                );
              })}
              {stageConfigs.length === 0 && (
                <li className="text-center py-2">
                  <p className="text-xs text-gray-400">Loading stages...</p>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Filter buttons (SAME AS ORIGINAL) */}
        <div className="flex space-x-2 mt-6">
          <button
            onClick={() => {
              /* Add custom filter functionality */
            }}
            className="flex-1 bg-blue-500 text-white rounded-md py-1.5 text-xs font-medium hover:bg-blue-600 flex items-center justify-center transition-colors"
          >
            <Plus className="h-3 w-3 mr-1" /> Add filter
          </button>
          <button
            onClick={onClearFilters}
            className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-md py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;

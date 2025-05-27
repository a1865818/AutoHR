import { FilterOption } from "@/interfaces";
import { ChevronDown, ChevronRight, Plus, Settings, X } from "lucide-react";
import { useState } from "react";

// Available filters that can be added to favorites
const availableStatusFilters = [
  { id: "qualified", label: "Qualified" },
  { id: "new", label: "New" },
  { id: "disqualified", label: "Disqualified" },
];

const availableStageFilters = [
  { id: "hired", label: "Hired" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "phone-interview", label: "Phone Interview" },
  { id: "offer", label: "Offer" },
  { id: "evaluation", label: "Evaluation" },
];

const statusFilters: Omit<FilterOption, "count">[] = [
  { id: "qualified", label: "Qualified" },
  { id: "new", label: "New" },
  { id: "disqualified", label: "Disqualified" },
];

const stageFilters: Omit<FilterOption, "count">[] = [
  { id: "hired", label: "Hired" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "phone-interview", label: "Phone Interview" },
  { id: "offer", label: "Offer" },
  { id: "evaluation", label: "Evaluation" },
];

interface FavoriteFilter {
  id: string;
  label: string;
  type: "status" | "stage";
}

interface FilterSidebarProps {
  expandedFilters: {
    status: boolean;
    stage: boolean;
  };
  toggleFilter: (filterType: "status" | "stage") => void;
  activeFilters: {
    favorites: string[];
    status: string[];
    stage: string[];
  };
  onFilterChange: (
    filterType: "favorites" | "status" | "stage",
    filterId: string,
    checked: boolean
  ) => void;
  onFavoriteToggle: (filterId: string) => void;
  onAddFavorite: (
    filterId: string,
    label: string,
    type: "status" | "stage"
  ) => void;
  onRemoveFavorite: (filterId: string) => void;
  onClearFilters: () => void;
  filterCounts: {
    favorites: Record<string, number>;
    status: Record<string, number>;
    stage: Record<string, number>;
  };
  favoriteFilters: FavoriteFilter[];
}

export function FilterSidebar({
  expandedFilters,
  toggleFilter,
  activeFilters,
  onFilterChange,
  onFavoriteToggle,
  onAddFavorite,
  onRemoveFavorite,
  onClearFilters,
  filterCounts,
  favoriteFilters,
}: FilterSidebarProps) {
  const [showFavoriteDropdown, setShowFavoriteDropdown] = useState(false);

  const handleFavoriteClick = (favoriteId: string) => {
    onFavoriteToggle(favoriteId);
  };

  const isFavoriteActive = (
    favoriteId: string,
    favoriteType: "status" | "stage"
  ) => {
    if (favoriteType === "status") {
      return activeFilters.status.includes(favoriteId);
    } else {
      return activeFilters.stage.includes(favoriteId);
    }
  };

  const getAvailableFiltersToAdd = () => {
    const currentFavoriteIds = favoriteFilters.map((f) => f.id);
    const availableStatus = availableStatusFilters.filter(
      (f) => !currentFavoriteIds.includes(f.id)
    );
    const availableStage = availableStageFilters.filter(
      (f) => !currentFavoriteIds.includes(f.id)
    );

    return [
      ...availableStatus.map((f) => ({ ...f, type: "status" as const })),
      ...availableStage.map((f) => ({ ...f, type: "stage" as const })),
    ];
  };

  const handleCheckboxChange = (
    filterType: "status" | "stage",
    filterId: string,
    checked: boolean
  ) => {
    onFilterChange(filterType, filterId, checked);
  };

  const handleAddFilter = () => {
    // In a real app, this would open a modal or dropdown to add custom filters
    alert("Add filter functionality would open a modal here");
  };

  return (
    <div className="w-52 bg-white border-r flex-shrink-0 flex flex-col">
      {/* Favorites section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-gray-500">Favorites</h3>
          <div className="relative">
            <button
              onClick={() => setShowFavoriteDropdown(!showFavoriteDropdown)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Add favorite filter"
            >
              <Settings className="h-3 w-3" />
            </button>

            {showFavoriteDropdown && (
              <div className="absolute right-0 top-6 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="p-2">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">
                    Add to Favorites
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getAvailableFiltersToAdd().map((filter) => (
                      <button
                        key={`${filter.type}-${filter.id}`}
                        onClick={() => {
                          onAddFavorite(filter.id, filter.label, filter.type);
                          setShowFavoriteDropdown(false);
                        }}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded flex items-center justify-between"
                      >
                        <span>{filter.label}</span>
                        <span className="text-gray-400 text-xs capitalize">
                          {filter.type}
                        </span>
                      </button>
                    ))}
                    {getAvailableFiltersToAdd().length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        All filters added
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ul className="space-y-1">
          {favoriteFilters.map((item) => {
            const isActive = isFavoriteActive(item.id, item.type);
            return (
              <li key={item.id} className="group">
                <div className="flex items-center">
                  <button
                    onClick={() => handleFavoriteClick(item.id)}
                    className={`flex-1 flex items-center justify-between px-2 py-1 rounded-md text-left transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {filterCounts.favorites[item.id] || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(item.id)}
                    className="ml-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from favorites"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </li>
            );
          })}

          {favoriteFilters.length === 0 && (
            <li className="text-center py-4">
              <p className="text-xs text-gray-400">No favorites yet</p>
              <p className="text-xs text-gray-400">Click settings to add</p>
            </li>
          )}
        </ul>
      </div>

      {/* Filters section */}
      <div className="px-4 py-3 border-t">
        <h3 className="text-xs font-medium text-gray-500 mb-2">Filters</h3>

        {/* Status filter */}
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
                // Clear all status filters
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
                      <span>{item.label}</span>
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

        {/* Stage filter */}
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
                // Clear all stage filters
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
              {stageFilters.map((item) => {
                const isChecked = activeFilters.stage.includes(item.id);
                return (
                  <li key={item.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`stage-${item.id}`}
                      checked={isChecked}
                      onChange={(e) =>
                        handleCheckboxChange("stage", item.id, e.target.checked)
                      }
                      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`stage-${item.id}`}
                      className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700 cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-gray-500">
                        {filterCounts.stage[item.id] || 0}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex space-x-2 mt-6">
          <button
            onClick={handleAddFilter}
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

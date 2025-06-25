import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

interface BulkActionToolbarProps {
  selectedJobs: string[];
  onBulkStatusChange: (status: string) => void;
  onClearSelection: () => void;
  isLoading: boolean;
}

export function BulkActionToolbar({
  selectedJobs,
  onBulkStatusChange,
  onClearSelection,
  isLoading,
}: BulkActionToolbarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (selectedJobs.length === 0) return null;

  // All status options properly capitalized
  const statusOptions = [
    { value: "Active", label: "Mark as Active", icon: "✅" },
    { value: "Paused", label: "Pause Jobs", icon: "⏸️" },
    { value: "Closed", label: "Close Jobs", icon: "🔒" },
    { value: "Draft", label: "Move to Draft", icon: "📝" },
  ];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Check className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {selectedJobs.length} job{selectedJobs.length > 1 ? "s" : ""}{" "}
            selected
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              Change Status
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        onBulkStatusChange(option.value);
                        setShowStatusMenu(false);
                      }}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClearSelection}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}

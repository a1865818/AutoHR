import React from "react";
import { ApplicationFilters } from "@/interfaces/api";
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  FileText,
  Building2,
  Calendar,
} from "lucide-react";

interface FilterOptions {
  statuses: string[];
  stages: string[];
  companies: string[];
}

interface ApplicationFiltersPanelProps {
  filters: ApplicationFilters;
  filterOptions: FilterOptions;
  onFiltersChange: (filters: Partial<ApplicationFilters>) => void;
  onClearFilters: () => void;
}

export default function ApplicationFiltersPanel({
  filters,
  filterOptions,
  onFiltersChange,
  onClearFilters,
}: ApplicationFiltersPanelProps) {
  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ status: newStatuses });
  };

  const handleStageToggle = (stage: string) => {
    const newStages = filters.stage.includes(stage)
      ? filters.stage.filter((s) => s !== stage)
      : [...filters.stage, stage];
    onFiltersChange({ stage: newStages });
  };

  const handleCompanyToggle = (company: string) => {
    const newCompanies = filters.company.includes(company)
      ? filters.company.filter((c) => c !== company)
      : [...filters.company, company];
    onFiltersChange({ company: newCompanies });
  };

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    onFiltersChange({
      dateRange: {
        ...filters.dateRange,
        [field]: value || undefined,
      },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
      case "submitted":
        return <FileText className="h-4 w-4" />;
      case "initial_review":
      case "under_review":
        return <Clock className="h-4 w-4" />;
      case "interview":
      case "interviewing":
        return <Phone className="h-4 w-4" />;
      case "offer":
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
      case "declined":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
      case "submitted":
        return "text-blue-600";
      case "initial_review":
      case "under_review":
        return "text-yellow-600";
      case "interview":
      case "interviewing":
        return "text-purple-600";
      case "offer":
      case "accepted":
        return "text-green-600";
      case "rejected":
      case "declined":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return "Applied";
      case "initial_review":
        return "Under Review";
      case "interview":
        return "Interview";
      case "offer":
        return "Offer";
      case "rejected":
        return "Rejected";
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Unknown";
    }
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.stage.length > 0 ||
    filters.company.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Filter Applications
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status Filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Status
          </h4>
          <div className="space-y-2">
            {filterOptions.statuses.map((status) => (
              <label key={status} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => handleStatusToggle(status)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex items-center">
                  <span className={`mr-2 ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </span>
                  <span className="text-sm text-gray-700">
                    {formatStatusText(status)}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Stage Filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Stage
          </h4>
          <div className="space-y-2">
            {filterOptions.stages.map((stage) => (
              <label key={stage} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.stage.includes(stage)}
                  onChange={() => handleStageToggle(stage)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  {stage.charAt(0).toUpperCase() +
                    stage.slice(1).replace("_", " ")}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Company Filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Company
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filterOptions.companies.slice(0, 10).map((company) => (
              <label key={company} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.company.includes(company)}
                  onChange={() => handleCompanyToggle(company)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 line-clamp-1">
                  {company}
                </span>
              </label>
            ))}
            {filterOptions.companies.length > 10 && (
              <p className="text-xs text-gray-500 mt-2">
                +{filterOptions.companies.length - 10} more companies
              </p>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Application Date
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">From:</label>
              <input
                type="date"
                value={filters.dateRange.start || ""}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To:</label>
              <input
                type="date"
                value={filters.dateRange.end || ""}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-900 mb-2">
            Active Filters:
          </h5>
          <div className="flex flex-wrap gap-2">
            {filters.status.map((status) => (
              <span
                key={`status-${status}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Status: {formatStatusText(status)}
                <button
                  onClick={() => handleStatusToggle(status)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.stage.map((stage) => (
              <span
                key={`stage-${stage}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                Stage: {stage.replace("_", " ")}
                <button
                  onClick={() => handleStageToggle(stage)}
                  className="ml-1 hover:text-yellow-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.company.map((company) => (
              <span
                key={`company-${company}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {company}
                <button
                  onClick={() => handleCompanyToggle(company)}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Date: {filters.dateRange.start || "..."} to{" "}
                {filters.dateRange.end || "..."}
                <button
                  onClick={() => onFiltersChange({ dateRange: {} })}
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

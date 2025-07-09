"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { applicationService } from "@/services/applyService";
import {
  ApplicationWithJobDetails,
  ApplicationFilters,
} from "@/interfaces/api";
import {
  Search,
  Filter,
  FileText,
  Loader2,
  AlertCircle,
  SortAsc,
  SortDesc,
} from "lucide-react";
import Link from "next/link";
import ApplicationCard from "../applications/ApplicationCard";
import ApplicationStats from "../applications/ApplicationStats";
import ApplicationFiltersPanel from "../applications/ApplicationFiltersPanel";
import { Pagination } from "@/components/ui/Pagination";

type SortOption = "newest" | "oldest" | "company" | "status" | "jobTitle";
type SortOrder = "asc" | "desc";

export default function MyApplicationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [applications, setApplications] = useState<ApplicationWithJobDetails[]>(
    []
  );

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<ApplicationFilters>({
    status: [],
    stage: [],
    dateRange: {},
    company: [],
    jobTitle: "",
  });
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // UI states
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(4);

  // Load applications data
  useEffect(() => {
    // Wait for authentication to be fully loaded
    if (authLoading) {
      console.log("⏳ Waiting for authentication to load...");
      return;
    }

    if (isAuthenticated && user) {
      loadApplications();
    }
  }, [isAuthenticated, user, authLoading]);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const applicationsData =
        await applicationService.getUserApplicationsWithJobDetails();
      setApplications(applicationsData);
    } catch (err) {
      console.error("Failed to load applications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load applications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications;

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.job?.title.toLowerCase().includes(query) ||
          app.job?.company.toLowerCase().includes(query) ||
          app.job?.location.toLowerCase().includes(query)
      );
    }

    // Apply status filters
    if (selectedFilters.status.length > 0) {
      filtered = filtered.filter((app) =>
        selectedFilters.status.includes(app.status || "")
      );
    }

    // Apply stage filters
    if (selectedFilters.stage.length > 0) {
      filtered = filtered.filter((app) =>
        selectedFilters.stage.includes(app.stage || "")
      );
    }

    // Apply company filters
    if (selectedFilters.company.length > 0) {
      filtered = filtered.filter((app) =>
        selectedFilters.company.includes(app.job?.company || "")
      );
    }

    // Apply date range filters
    if (selectedFilters.dateRange.start || selectedFilters.dateRange.end) {
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.appliedAt);
        if (
          selectedFilters.dateRange.start &&
          appDate < new Date(selectedFilters.dateRange.start)
        ) {
          return false;
        }
        if (
          selectedFilters.dateRange.end &&
          appDate > new Date(selectedFilters.dateRange.end)
        ) {
          return false;
        }
        return true;
      });
    }

    // Sort applications
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "newest":
        case "oldest":
          comparison =
            new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
          if (sortBy === "newest") comparison = -comparison;
          break;
        case "company":
          comparison = (a.job?.company || "").localeCompare(
            b.job?.company || ""
          );
          break;
        case "jobTitle":
          comparison = (a.job?.title || "").localeCompare(b.job?.title || "");
          break;
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [applications, searchQuery, selectedFilters, sortBy, sortOrder]);

  // Calculate pagination
  const totalApplications = filteredAndSortedApplications.length;
  const totalPages = Math.ceil(totalApplications / applicationsPerPage);
  const startIndex = (currentPage - 1) * applicationsPerPage;
  const endIndex = startIndex + applicationsPerPage;
  const paginatedApplications = filteredAndSortedApplications.slice(
    startIndex,
    endIndex
  );

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const statuses = [
      ...new Set(
        applications
          .map((app) => app.status)
          .filter((s): s is string => Boolean(s))
      ),
    ];
    const stages = [
      ...new Set(
        applications
          .map((app) => app.stage)
          .filter((s): s is string => Boolean(s))
      ),
    ];
    const companies = [
      ...new Set(
        applications
          .map((app) => app.job?.company)
          .filter((c): c is string => Boolean(c))
      ),
    ];

    return { statuses, stages, companies };
  }, [applications]);

  const updateFilters = (newFilters: Partial<ApplicationFilters>) => {
    setSelectedFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      status: [],
      stage: [],
      dateRange: {},
      company: [],
      jobTitle: "",
    });
    setSearchQuery("");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the page smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-3xl font-semibold text-gray-800">
            Authentication Required
          </h2>
          <p className="mt-2 text-gray-600">
            Please log in to view your job applications
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Applications
            </h1>
            <p className="text-gray-600 mt-2">
              Track the status of your job applications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <ApplicationStats applications={applications} isLoading={isLoading} />
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0 w-full">
            {/* Search */}
            <div className="relative w-full md:w-auto flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by job title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort Options - Dropdown for mobile/tablet, button group for desktop */}
            {/* Mobile/Tablet Dropdown */}
            <div className="w-full md:hidden">
              <label htmlFor="sortBy" className="sr-only">Sort by</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={e => toggleSort(e.target.value as SortOption)}
                className="w-full mt-2 md:mt-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Date</option>
                <option value="company">Company</option>
                <option value="jobTitle">Job</option>
                <option value="status">Status</option>
              </select>
            </div>
            {/* Desktop Button Group */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Sort by:
              </span>
              <div className="flex space-x-1">
                {[
                  { key: "newest" as SortOption, label: "Date" },
                  { key: "company" as SortOption, label: "Company" },
                  { key: "jobTitle" as SortOption, label: "Job" },
                  { key: "status" as SortOption, label: "Status" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => toggleSort(option.key)}
                    className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
                      sortBy === option.key
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                    {sortBy === option.key &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="h-3 w-3 ml-1" />
                      ) : (
                        <SortDesc className="h-3 w-3 ml-1" />
                      ))}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <ApplicationFiltersPanel
            filters={selectedFilters}
            filterOptions={filterOptions}
            onFiltersChange={updateFilters}
            onClearFilters={clearAllFilters}
          />
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your applications...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Applications
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadApplications}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredAndSortedApplications.length === 0 ? (
        <div className="text-center py-12">
          {applications.length === 0 ? (
            <>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Applications Yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t applied to any jobs yet. Start browsing and applying
                to positions that interest you.
              </p>
              <Link
                href="/applicant/jobs"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="h-5 w-5 mr-2" />
                Browse Jobs
              </Link>
            </>
          ) : (
            <>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Applications Found
              </h3>
              <p className="text-gray-600 mb-6">
                No applications match your current search and filter criteria.
              </p>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Results count */}
          <div className="text-sm text-gray-600">
            {totalApplications > 0 && (
              <>
                Showing {startIndex + 1}-{Math.min(endIndex, totalApplications)}{" "}
                of {totalApplications} applications
              </>
            )}
          </div>

          {/* Applications Grid */}
          <div className="grid gap-6">
            {paginatedApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onRefresh={loadApplications}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalApplications}
                itemsPerPage={applicationsPerPage}
                showInfo={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

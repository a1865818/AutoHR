"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedJobs } from "@/contexts/SavedJobsContext";
import { jobService } from "@/services/jobService";
import { ApiJob, ApiCompany } from "@/interfaces";
import { ApplicantJobCard } from "@/components/jobs/ApplicantJobCard";
import { Pagination } from "@/components/ui/Pagination";
import {
  Heart,
  Loader2,
  Search,
  AlertCircle,
  Trash2,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";

type SortOption = "newest" | "oldest" | "salary" | "relevance";

interface Filters {
  type: string[];
  experience: string[];
  location: string[];
  locationType: string[];
}

// Complete .NET object sanitization function
const deepCleanNetObjects = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  // Handle primitives
  if (typeof obj !== "object") return obj;

  // Handle .NET DateTime objects with ValueKind
  if (
    obj.ValueKind !== undefined ||
    obj.value !== undefined ||
    obj.Value !== undefined
  ) {
    const dateStr = obj.value || obj.Value || obj.toString();
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepCleanNetObjects(item));
  }

  // Handle objects recursively
  const cleaned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cleaned[key] = deepCleanNetObjects(obj[key]);
    }
  }
  return cleaned;
};

// Helper function to safely render values
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);

  // For objects, convert to string representation
  if (Array.isArray(value)) {
    return value.map((item) => safeRender(item)).join(", ");
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[Object]";
  }
};

export function SavedJobsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { savedJobIds, isLoading, refreshSavedJobs, savedJobsCount } =
    useSavedJobs();

  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [companies, setCompanies] = useState<Map<string, ApiCompany>>(
    new Map()
  );
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    type: [],
    experience: [],
    location: [],
    locationType: [],
  });

  const loadSavedJobs = async () => {
    if (!savedJobIds.length) {
      setJobs([]);
      setIsLoadingJobs(false);
      return;
    }

    try {
      setIsLoadingJobs(true);
      setError(null);

      // Fetch all jobs to filter by saved IDs
      const allJobs = await jobService.getPublicJobs("Active");
      const allCompanies = await jobService.getAllCompanies();

      // Filter jobs to only include saved ones and clean the data
      const savedJobs = allJobs
        .filter((job) => savedJobIds.includes(job.id))
        .map((job) => deepCleanNetObjects(job));

      // Create companies map and clean the company data
      const companiesMap = new Map<string, ApiCompany>();
      allCompanies.forEach((company) => {
        const cleanedCompany = deepCleanNetObjects(company);
        companiesMap.set(cleanedCompany.id, cleanedCompany);
      });

      setJobs(savedJobs);
      setCompanies(companiesMap);
    } catch (err) {
      console.error("Failed to load saved jobs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load saved jobs"
      );
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Load saved jobs when savedJobIds change
  useEffect(() => {
    // Wait for authentication to be fully loaded
    if (authLoading) {
      console.log("⏳ Waiting for authentication to load...");
      return;
    }

    loadSavedJobs();
  }, [savedJobIds, authLoading]);

  // Get unique filter options from job data
  const filterOptions = useMemo(() => {
    const employmentTypes = [
      ...new Set(
        jobs.map((job) => safeRender(job.employmentType)).filter(Boolean)
      ),
    ];
    const locationTypes = [
      ...new Set(
        jobs.map((job) => safeRender(job.locationType)).filter(Boolean)
      ),
    ];

    // Generate experience levels based on job data
    const experienceLevels = new Set<string>();
    jobs.forEach((job) => {
      const seniorityLevel = safeRender(job.seniorityLevel).toLowerCase();
      const minYears = Number(safeRender(job.experienceYearsMin)) || 0;

      if (minYears <= 2 || seniorityLevel === "junior") {
        experienceLevels.add("Entry Level");
      } else if (minYears <= 5 || seniorityLevel === "mid") {
        experienceLevels.add("Mid Level");
      } else if (seniorityLevel === "senior" || minYears > 5) {
        experienceLevels.add("Senior Level");
      } else if (seniorityLevel === "executive" || seniorityLevel === "lead") {
        experienceLevels.add("Executive");
      } else {
        experienceLevels.add("Entry Level");
      }
    });

    const result = {
      employmentTypes: employmentTypes.sort(),
      locationTypes: locationTypes.sort(),
      experienceLevels: Array.from(experienceLevels).sort(),
    };

    // Debug: Log the available filter options safely
    if (jobs.length > 0) {
      console.log("🔍 Available filter options:", result);
      // Only log essential job data safely
      const sampleJob = jobs[0];
      console.log("📊 Sample job data for debugging:", {
        id: safeRender(sampleJob.id),
        title: safeRender(sampleJob.title),
        employmentType: safeRender(sampleJob.employmentType),
        locationType: safeRender(sampleJob.locationType),
        seniorityLevel: safeRender(sampleJob.seniorityLevel),
        experienceYearsMin: safeRender(sampleJob.experienceYearsMin),
      });
    }

    return result;
  }, [jobs]);

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job) => {
        const company = companies.get(job.companyId);
        return (
          safeRender(job.title).toLowerCase().includes(query) ||
          safeRender(company?.name).toLowerCase().includes(query) ||
          safeRender(job.description).toLowerCase().includes(query)
        );
      });
    }

    // Apply other filters
    if (filters.type.length > 0) {
      filtered = filtered.filter((job) =>
        filters.type.includes(safeRender(job.employmentType))
      );
    }

    if (filters.locationType.length > 0) {
      filtered = filtered.filter((job) =>
        filters.locationType.includes(safeRender(job.locationType))
      );
    }

    if (filters.experience.length > 0) {
      filtered = filtered.filter((job) => {
        // Map job seniority level to our experience categories
        const seniorityLevel = safeRender(job.seniorityLevel).toLowerCase();
        const minYears = Number(safeRender(job.experienceYearsMin)) || 0;

        let experienceCategory = "";
        if (minYears <= 2 || seniorityLevel === "junior") {
          experienceCategory = "Entry Level";
        } else if (minYears <= 5 || seniorityLevel === "mid") {
          experienceCategory = "Mid Level";
        } else if (seniorityLevel === "senior" || minYears > 5) {
          experienceCategory = "Senior Level";
        } else if (
          seniorityLevel === "executive" ||
          seniorityLevel === "lead"
        ) {
          experienceCategory = "Executive";
        } else {
          experienceCategory = "Entry Level"; // Default fallback
        }

        return filters.experience.includes(experienceCategory);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.postedDate || b.createdAt).getTime() -
            new Date(a.postedDate || a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.postedDate || a.createdAt).getTime() -
            new Date(b.postedDate || b.createdAt).getTime()
          );
        case "salary":
          const aSalary = Math.max(a.salaryMin || 0, a.salaryMax || 0);
          const bSalary = Math.max(b.salaryMin || 0, b.salaryMax || 0);
          return bSalary - aSalary;
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobs, companies, searchQuery, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredAndSortedJobs.slice(
    startIndex,
    startIndex + jobsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefresh = () => {
    refreshSavedJobs();
    loadSavedJobs();
  };

  const updateFilter = (
    category: keyof Filters,
    value: string,
    isActive: boolean
  ) => {
    setFilters((prev) => ({
      ...prev,
      [category]: isActive
        ? [...prev[category], value]
        : prev[category].filter((item) => item !== value),
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearAllFilters = () => {
    setFilters({
      type: [],
      experience: [],
      location: [],
      locationType: [],
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">
            Authentication Required
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Please log in to view your saved jobs.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
              <p className="text-gray-600">
                {savedJobsCount} job{savedJobsCount !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading || isLoadingJobs}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  isLoading || isLoadingJobs ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {savedJobsCount === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No saved jobs yet
          </h3>
          <p className="mt-2 text-gray-500">
            Start exploring jobs and save the ones you're interested in.
          </p>
          <Link
            href="/applicant/jobs"
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div
            className={`lg:col-span-1 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search saved jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="salary">Highest Salary</option>
                </select>
              </div>

              {/* Filter Options */}
              <div className="space-y-6">
                {/* Job Type Filter */}
                {filterOptions.employmentTypes.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Job Type</h4>
                    <div className="space-y-2">
                      {filterOptions.employmentTypes.map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={filters.type.includes(type)}
                            onChange={(e) =>
                              updateFilter("type", type, e.target.checked)
                            }
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Style Filter */}
                {filterOptions.locationTypes.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Work Style
                    </h4>
                    <div className="space-y-2">
                      {filterOptions.locationTypes.map((style) => (
                        <label key={style} className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={filters.locationType.includes(style)}
                            onChange={(e) =>
                              updateFilter(
                                "locationType",
                                style,
                                e.target.checked
                              )
                            }
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {style}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Level Filter */}
                {filterOptions.experienceLevels.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Experience Level
                    </h4>
                    <div className="space-y-2">
                      {filterOptions.experienceLevels.map((level) => (
                        <label key={level} className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={filters.experience.includes(level)}
                            onChange={(e) =>
                              updateFilter(
                                "experience",
                                level,
                                e.target.checked
                              )
                            }
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {level}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-3">
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">
                  Loading saved jobs...
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Error loading saved jobs
                </h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : filteredAndSortedJobs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No jobs match your filters
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Results Summary */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(
                      startIndex + jobsPerPage,
                      filteredAndSortedJobs.length
                    )}{" "}
                    of {filteredAndSortedJobs.length} saved jobs
                  </p>
                  {(searchQuery ||
                    Object.values(filters).some((f) => f.length > 0)) && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>

                {/* Jobs Grid */}
                <div className="space-y-6">
                  {paginatedJobs.map((job) => (
                    <ApplicantJobCard
                      key={job.id}
                      job={job}
                      company={companies.get(job.companyId)}
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
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

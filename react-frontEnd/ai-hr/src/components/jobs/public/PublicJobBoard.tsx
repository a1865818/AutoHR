"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ChevronDown,
  Filter,
  X,
} from "lucide-react";
import { ApiJob, ApiCompany } from "@/interfaces";
import { publicJobService } from "@/services/publicJobService";
import { PublicJobCard } from "@/components/jobs/public/PublicJobCard";
import { PublicJobFilters } from "@/components/jobs/public/PublicJobFilters";
import Link from "next/link";

type SortOption = "newest" | "oldest" | "salary" | "company";

interface Filters {
  type: string[];
  experience: string[];
  location: string[];
}

export function PublicJobBoard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<ApiJob[]>([]);
  const [companies, setCompanies] = useState<Map<string, ApiCompany>>(
    new Map()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [activeFilters, setActiveFilters] = useState<Filters>({
    type: [],
    experience: [],
    location: [],
  });

  useEffect(() => {
    loadPublicJobs();
  }, []);

  const loadPublicJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🌍 Loading public jobs...");

      // Load jobs from public API
      const jobs = await publicJobService.getPublicJobs();
      setAllJobs(jobs);

      // Load company data for each unique company
      const uniqueCompanyIds = [...new Set(jobs.map((job) => job.companyId))];
      const companyMap = new Map<string, ApiCompany>();

      await Promise.all(
        uniqueCompanyIds.map(async (companyId) => {
          try {
            const company = await publicJobService.getCompanyById(companyId);
            companyMap.set(companyId, company);
          } catch (error) {
            console.warn(`Failed to load company ${companyId}:`, error);
          }
        })
      );

      setCompanies(companyMap);
      console.log(
        `✅ Loaded ${jobs.length} public jobs and ${companyMap.size} companies`
      );
    } catch (error) {
      console.error("❌ Failed to load public jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = allJobs;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          companies.get(job.companyId)?.name.toLowerCase().includes(query) ||
          job.department?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter((job) =>
        activeFilters.type.includes(job.employmentType)
      );
    }

    // Experience filter
    if (activeFilters.experience.length > 0) {
      filtered = filtered.filter((job) => {
        const experience = job.experienceYearsMin || 0;
        return activeFilters.experience.some((exp) => {
          switch (exp) {
            case "entry":
              return experience <= 1;
            case "mid":
              return experience >= 2 && experience <= 5;
            case "senior":
              return experience >= 6;
            default:
              return false;
          }
        });
      });
    }

    // Location filter (simplified)
    if (activeFilters.location.length > 0) {
      filtered = filtered.filter((job) => {
        const jobLocations =
          typeof job.locations === "object"
            ? Object.values(job.locations).join(" ").toLowerCase()
            : String(job.locations || "").toLowerCase();
        return activeFilters.location.some((loc) =>
          jobLocations.includes(loc.toLowerCase())
        );
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
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
          const salaryA = a.salaryMax || a.salaryMin || 0;
          const salaryB = b.salaryMax || b.salaryMin || 0;
          return salaryB - salaryA;
        case "company":
          const companyA = companies.get(a.companyId)?.name || "";
          const companyB = companies.get(b.companyId)?.name || "";
          return companyA.localeCompare(companyB);
        default:
          return 0;
      }
    });

    return sorted;
  }, [allJobs, companies, searchQuery, sortBy, activeFilters]);

  const updateFilter = (category: keyof Filters, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      type: [],
      experience: [],
      location: [],
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    Object.values(activeFilters).some((arr) => arr.length > 0) ||
    searchQuery.trim() !== "";

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "newest":
        return "Newest First";
      case "oldest":
        return "Oldest First";
      case "salary":
        return "Highest Salary";
      case "company":
        return "Company A-Z";
      default:
        return option;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Unable to Load Jobs
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadPublicJobs}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Dream Job
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Discover opportunities at top companies. Apply instantly without
              creating an account.
            </p>

            {/* Quick Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <PublicJobFilters
              activeFilters={activeFilters}
              updateFilter={updateFilter}
              clearAllFilters={clearAllFilters}
              totalJobs={filteredAndSortedJobs.length}
            />
          </div>

          {/* Mobile Filters Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>

            {showFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div
                  className="fixed inset-0 bg-black bg-opacity-50"
                  onClick={() => setShowFilters(false)}
                />
                <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Filters</h2>
                      <button onClick={() => setShowFilters(false)}>
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <PublicJobFilters
                      activeFilters={activeFilters}
                      updateFilter={updateFilter}
                      clearAllFilters={clearAllFilters}
                      totalJobs={filteredAndSortedJobs.length}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedJobs.length} Job
                  {filteredAndSortedJobs.length !== 1 ? "s" : ""} Available
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Sort: {getSortLabel(sortBy)}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      {(
                        [
                          "newest",
                          "oldest",
                          "salary",
                          "company",
                        ] as SortOption[]
                      ).map((option) => (
                        <button
                          key={option}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            sortBy === option
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700"
                          }`}
                          onClick={() => {
                            setSortBy(option);
                            setShowSortDropdown(false);
                          }}
                        >
                          {getSortLabel(option)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Cards */}
            <div className="space-y-4">
              {filteredAndSortedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white rounded-lg shadow-sm border p-8">
                    <div className="text-6xl mb-4">💼</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Jobs Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {hasActiveFilters
                        ? "Try adjusting your search or filters"
                        : "No jobs are currently available"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                filteredAndSortedJobs.map((job) => (
                  <PublicJobCard
                    key={job.id}
                    job={job}
                    company={companies.get(job.companyId)}
                  />
                ))
              )}
            </div>

            {/* Load More / Pagination could go here */}
            {filteredAndSortedJobs.length > 0 && (
              <div className="mt-12 text-center">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Want to save jobs and track applications?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create an account to unlock additional features and
                    personalized job recommendations.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Link
                      href="/signup"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Sign Up Free
                    </Link>
                    <Link
                      href="/login"
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

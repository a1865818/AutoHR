"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { Pagination } from "@/components/ui/Pagination";
import Link from "next/link";

type SortOption = "newest" | "oldest" | "salary" | "company";

interface Filters {
  type: string[];
  experience: string[];
  workType: string[];
}

export function PublicJobBoard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<ApiJob[]>([]);
  const [companies, setCompanies] = useState<Map<string, ApiCompany>>(
    new Map()
  );

  const [searchQuery, setSearchQuery] = useState(""); // Jobs/companies/keywords
  const [locationQuery, setLocationQuery] = useState(""); // City/location
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Company filtering state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const searchParams = useSearchParams();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(8); // Show 8 jobs per page
  const [totalJobs, setTotalJobs] = useState(0); // Total jobs from backend
  const [totalPages, setTotalPages] = useState(1); // Total pages from backend

  const [activeFilters, setActiveFilters] = useState<Filters>({
    type: [],
    experience: [],
    workType: [],
  });

  // Read URL parameters
  useEffect(() => {
    const companyParam = searchParams.get("company");
    const pageParam = searchParams.get("page");
    const searchParam = searchParams.get("search");
    const locationParam = searchParams.get("location");

    if (companyParam) {
      setSelectedCompanyId(companyParam);
      console.log("🏢 Company filter applied from URL:", companyParam);
    } else {
      setSelectedCompanyId(null);
    }

    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (page > 0) {
        setCurrentPage(page);
      }
    } else {
      setCurrentPage(1);
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }

    if (locationParam) {
      setLocationQuery(locationParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadPublicJobs();
  }, [currentPage, jobsPerPage]);

  // Load jobs when company filter changes
  useEffect(() => {
    if (selectedCompanyId) {
      loadPublicJobs(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const loadPublicJobs = async (companyId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "🌍 Loading public jobs...",
        companyId ? `for company: ${companyId}` : "all"
      );

      // Load jobs from public API with optional company filter and pagination
      const response = await publicJobService.getPublicJobs(
        companyId ? { companyId } : undefined,
        currentPage,
        jobsPerPage
      );

      const jobs = response.jobs;
      setAllJobs(jobs);

      // Update pagination state from backend response
      setTotalJobs(response.pagination.totalCount);
      setTotalPages(response.pagination.totalPages);

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

      // Debug: Log unique employment types and location types
      const uniqueEmploymentTypes = [
        ...new Set(jobs.map((job) => job.employmentType).filter(Boolean)),
      ];
      const uniqueLocationTypes = [
        ...new Set(jobs.map((job) => job.locationType).filter(Boolean)),
      ];
      console.log("📊 Unique employment types in data:", uniqueEmploymentTypes);
      console.log("🏢 Unique location types in data:", uniqueLocationTypes);

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

    // Company filter (highest priority)
    if (selectedCompanyId) {
      filtered = filtered.filter((job) => job.companyId === selectedCompanyId);
      console.log(
        `🏢 Filtered to ${filtered.length} jobs for company ${selectedCompanyId}`
      );
    }

    // Search filter (jobs, companies, keywords)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          companies.get(job.companyId)?.name.toLowerCase().includes(query) ||
          job.department?.toLowerCase().includes(query)
      );
      console.log(`🔍 After keyword search: ${filtered.length} jobs`);
    }

    // Location filter (city/location search)
    if (locationQuery.trim()) {
      const locationSearch = locationQuery.toLowerCase();
      filtered = filtered.filter((job) => {
        // Extract location information from the locations object
        let locationText = "";
        if (job.locations && typeof job.locations === "object") {
          // Convert locations object to searchable text
          locationText = Object.values(job.locations)
            .filter(Boolean)
            .map((val) => String(val))
            .join(" ")
            .toLowerCase();
        }

        const isMatch = locationText.includes(locationSearch);
        if (!isMatch) {
          console.log(
            `❌ Job "${job.title}" location "${locationText}" doesn't match search "${locationSearch}"`
          );
        }
        return isMatch;
      });
      console.log(`📍 After location search: ${filtered.length} jobs`);
    }

    // Type filter (fixed with case-insensitive matching)
    if (activeFilters.type.length > 0) {
      console.log("🔍 Job type filter active:", activeFilters.type);
      filtered = filtered.filter((job) => {
        const jobEmploymentType = (job.employmentType || "").trim();
        const isMatch = activeFilters.type.some(
          (filterType) =>
            jobEmploymentType.toLowerCase() === filterType.toLowerCase()
        );
        if (!isMatch) {
          console.log(
            `❌ Job "${job.title}" employment type "${jobEmploymentType}" doesn't match filters:`,
            activeFilters.type
          );
        }
        return isMatch;
      });
      console.log(`✅ After employment type filter: ${filtered.length} jobs`);
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

    // Work Type filter (Remote, On-site, Hybrid)
    if (activeFilters.workType.length > 0) {
      console.log("🏢 Work type filter active:", activeFilters.workType);
      filtered = filtered.filter((job) => {
        const jobLocationType = (job.locationType || "").trim();
        const isMatch = activeFilters.workType.some(
          (filterWorkType) =>
            jobLocationType.toLowerCase() === filterWorkType.toLowerCase()
        );
        if (!isMatch) {
          console.log(
            `❌ Job "${job.title}" location type "${jobLocationType}" doesn't match filters:`,
            activeFilters.workType
          );
        }
        return isMatch;
      });
      console.log(`✅ After work type filter: ${filtered.length} jobs`);
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
  }, [
    allJobs,
    companies,
    searchQuery,
    locationQuery,
    sortBy,
    activeFilters,
    selectedCompanyId,
  ]);

  // Use the filtered and sorted jobs directly (backend already handles pagination)
  const paginatedJobs = filteredAndSortedJobs;

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
      workType: [],
    });
    setSearchQuery("");
    setLocationQuery("");
    setCurrentPage(1);
    // Clear company filter by navigating to the base URL
    if (selectedCompanyId) {
      window.history.pushState(null, "", "/public");
      setSelectedCompanyId(null);
    }
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Update URL with new page
    const url = new URL(window.location.href);
    if (page === 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", page.toString());
    }
    window.history.pushState(null, "", url.toString());

    // Scroll to top of job listings
    const jobListingsElement = document.getElementById("job-listings");
    if (jobListingsElement) {
      jobListingsElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      handlePageChange(1);
    }
  }, [searchQuery, locationQuery, activeFilters, selectedCompanyId]);

  const hasActiveFilters =
    Object.values(activeFilters).some((arr) => arr.length > 0) ||
    searchQuery.trim() !== "" ||
    locationQuery.trim() !== "" ||
    selectedCompanyId !== null;

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
              onClick={() => loadPublicJobs()}
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
              {selectedCompanyId && companies.get(selectedCompanyId)
                ? `Jobs at ${companies.get(selectedCompanyId)?.name}`
                : "Find Your Dream Job"}
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {selectedCompanyId && companies.get(selectedCompanyId)
                ? `Explore all available positions at ${
                    companies.get(selectedCompanyId)?.name
                  }. Apply instantly without creating an account.`
                : "Discover opportunities at top companies. Apply instantly without creating an account."}
            </p>

            {/* Dual Search */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Jobs/Companies Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>

                {/* Location Search */}
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Where: Enter city or location..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
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
              totalJobs={totalJobs}
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
                      totalJobs={totalJobs}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Job Listings */}
          <div className="flex-1" id="job-listings">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {totalJobs} Job
                  {totalJobs !== 1 ? "s" : ""} Available
                  {selectedCompanyId && companies.get(selectedCompanyId) && (
                    <span className="text-lg font-normal text-gray-600 ml-2">
                      at {companies.get(selectedCompanyId)?.name}
                    </span>
                  )}
                </h2>
                {selectedCompanyId && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {companies.get(selectedCompanyId)?.name}
                      <button
                        onClick={() => {
                          window.history.pushState(null, "", "/public");
                          setSelectedCompanyId(null);
                        }}
                        className="ml-2 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}
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
              {totalJobs === 0 ? (
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
                paginatedJobs.map((job) => (
                  <PublicJobCard
                    key={job.id}
                    job={job}
                    company={companies.get(job.companyId)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalJobs > 0 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalJobs}
                  itemsPerPage={jobsPerPage}
                />
              </div>
            )}

            {/* Call-to-action for non-registered users */}
            {totalJobs > 0 && (
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

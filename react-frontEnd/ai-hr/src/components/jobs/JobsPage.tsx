"use client";

import { ApiCompany, ApiJob } from "@/interfaces";
import { Job } from "@/interfaces/job";
import { jobService } from "@/services/jobService";
import { AlertCircle, ChevronDown, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { JobCard } from "./JobCard";
import { JobFilterSidebar } from "./JobFilterSidebar";

type SortOption = "newest" | "oldest" | "applicants" | "salary";
type ViewMode = "jobs" | "drafts";

interface Filters {
  status: string[];
  type: string[];
  experience: string[];
  location: string[];
}

// Helper functions moved outside component to avoid hoisting issues
const extractLocationString = (locations: Record<string, any>): string => {
  if (!locations) return "Location not specified";

  if (locations.city && locations.state) {
    return `${locations.city}, ${locations.state}`;
  }

  return locations.address || locations.description || "Location not specified";
};

const mapLocationTypeToJobFormat = (
  locationType: string
): "On-site" | "Remote" | "Hybrid" => {
  switch (locationType?.toLowerCase()) {
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    default:
      return "On-site";
  }
};

const mapEmploymentTypeToJobFormat = (
  employmentType: string
): "Full-Time" | "Part-Time" | "Contract" | "Internship" => {
  switch (employmentType?.toLowerCase()) {
    case "full-time":
      return "Full-Time";
    case "part-time":
      return "Part-Time";
    case "contract":
      return "Contract";
    case "internship":
      return "Internship";
    default:
      return "Full-Time";
  }
};

const mapExperienceToJobFormat = (
  seniorityLevel: string,
  minYears?: number
): string => {
  if (minYears !== undefined) {
    if (minYears === 0) return "0-2 Years";
    if (minYears <= 2) return "2-5 Years";
    if (minYears <= 5) return "5+ Years";
    return "5+ Years";
  }

  switch (seniorityLevel?.toLowerCase()) {
    case "junior":
      return "0-2 Years";
    case "mid":
      return "2-5 Years";
    case "senior":
      return "5+ Years";
    default:
      return "2-5 Years";
  }
};

const mapStatusToJobFormat = (
  status: string
): "Draft" | "Active" | "Paused" | "Closed" => {
  // Handle null/undefined/empty status
  if (!status || typeof status !== "string") {
    console.warn("🚨 Invalid status received:", status);
    return "Draft";
  }

  // Trim whitespace and convert to lowercase for comparison
  const normalizedStatus = status.trim().toLowerCase();

  console.log(
    `🔄 Mapping status: "${status}" -> normalized: "${normalizedStatus}"`
  );

  switch (normalizedStatus) {
    case "open": // Backend uses "Open" for active jobs
    case "active": // Also handle "Active" just in case
      console.log("✅ Mapped to Active");
      return "Active";
    case "draft": // Backend uses "Draft" for draft jobs
      console.log("✅ Mapped to Draft");
      return "Draft";
    case "paused": // Backend uses "Paused" for paused jobs
      console.log("✅ Mapped to Paused");
      return "Paused";
    case "closed": // Backend uses "Closed" for closed jobs
      console.log("✅ Mapped to Closed");
      return "Closed";
    default:
      console.warn("🚨 Unknown status received from backend:", status);
      console.warn(
        "🚨 Available values should be: Open, Draft, Paused, Closed"
      );
      return "Draft"; // Default fallback
  }
};

const formatPostedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

export function JobsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<ApiJob[]>([]);
  const [companies, setCompanies] = useState<Map<string, ApiCompany>>(
    new Map()
  );

  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    type: true,
    experience: false,
    location: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("jobs");

  const [activeFilters, setActiveFilters] = useState<Filters>({
    status: [],
    type: [],
    experience: [],
    location: [],
  });

  useEffect(() => {
    loadAllJobsData();
  }, []);

  const loadAllJobsData = async () => {
    console.log("🔄 Loading all jobs data...");
    setIsLoading(true);
    setError(null);

    try {
      if (!jobService.isAuthenticated()) {
        throw new Error("Please log in to view jobs");
      }

      // Load all jobs regardless of status
      console.log("📊 Loading all jobs...");
      const [activeJobs, draftJobs] = await Promise.all([
        jobService.getAllJobs("Open"),
        jobService.getAllJobs("Draft"),
      ]);

      const allJobsData = [...(activeJobs || []), ...(draftJobs || [])];

      console.log("📊 Raw API jobs data:", allJobsData);
      console.log("📊 Number of jobs received:", allJobsData?.length || 0);
      console.log("📊 Active jobs:", activeJobs?.length || 0);
      console.log("📊 Draft jobs:", draftJobs?.length || 0);

      // Log first job for structure analysis
      if (allJobsData && allJobsData.length > 0) {
        console.log(
          "🔍 First job structure:",
          JSON.stringify(allJobsData[0], null, 2)
        );
      }

      setAllJobs(allJobsData || []);

      // Load companies
      const companyIds = [
        ...new Set((allJobsData || []).map((job) => job.companyId)),
      ];
      console.log("🏢 Loading companies for IDs:", companyIds);

      const companiesMap = new Map<string, ApiCompany>();

      await Promise.all(
        companyIds.map(async (companyId) => {
          try {
            console.log(`🏢 Loading company ${companyId}...`);
            const company = await jobService.getCompanyById(companyId);
            console.log(`✅ Company loaded:`, company);
            companiesMap.set(companyId, company);
          } catch (error) {
            console.warn(`❌ Failed to load company ${companyId}:`, error);
          }
        })
      );

      console.log("🏢 Companies map:", companiesMap);
      setCompanies(companiesMap);
    } catch (error) {
      console.error("❌ Error loading jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  // Transform API jobs to your existing Job interface format
  const transformedJobs = useMemo(() => {
    console.log("🔄 Starting job transformation...");
    console.log("📊 Raw jobs to transform:", allJobs.length);

    const transformed = allJobs.map((apiJob, index): Job => {
      console.log(
        `🔄 Transforming job ${index + 1}/${allJobs.length}:`,
        apiJob.title
      );
      console.log(`📊 Original status: "${apiJob.status}"`);

      const company = companies.get(apiJob.companyId);

      const mappedStatus = mapStatusToJobFormat(apiJob.status);
      console.log(`📊 Mapped status: "${mappedStatus}"`);

      const transformedJob: Job = {
        id: apiJob.id,
        title: apiJob.title,
        company: company?.name || "Unknown Company",
        location: extractLocationString(apiJob.locations),
        locationType: mapLocationTypeToJobFormat(apiJob.locationType),
        type: mapEmploymentTypeToJobFormat(apiJob.employmentType),
        department: company?.industry || "Not specified",
        experience: mapExperienceToJobFormat(
          apiJob.seniorityLevel,
          apiJob.experienceYearsMin
        ),
        salary: {
          min: apiJob.salaryMin || 0,
          max: apiJob.salaryMax || 0,
          currency: apiJob.salaryCurrency || "USD",
          period: "per year" as const,
        },
        description: apiJob.description,
        requirements: apiJob.requirements || [],
        qualifications: apiJob.qualifications || [],
        responsibilities: apiJob.responsibilities || [],
        benefits: apiJob.benefits || [],
        skills: [],
        applicationSettings: {
          deadline: apiJob.applicationDeadline || "",
          questionsRequired: false,
          resumeRequired: true,
          coverLetterRequired: false,
          portfolioRequired: false,
        },
        postedDate: formatPostedDate(apiJob.postedDate || apiJob.createdAt),
        status: mappedStatus, // Use the mapped status
        applicants: apiJob.applicantCount || 0,
        createdBy: apiJob.createdBy,
        updatedAt: apiJob.createdAt,
      };

      console.log(
        `✅ Transformed job ${index + 1}: Status "${transformedJob.status}"`
      );
      return transformedJob;
    });

    // Count by status
    const statusCounts = {
      Active: transformed.filter((job) => job.status === "Active").length,
      Draft: transformed.filter((job) => job.status === "Draft").length,
      Paused: transformed.filter((job) => job.status === "Paused").length,
      Closed: transformed.filter((job) => job.status === "Closed").length,
    };

    console.log("📊 Status counts after transformation:", statusCounts);
    console.log("✅ Total transformed jobs:", transformed.length);

    return transformed;
  }, [allJobs, companies]);

  // Calculate tab counts - always show total counts regardless of current view
  const tabCounts = useMemo(() => {
    const activeJobsCount = transformedJobs.filter(
      (job) => job.status !== "Draft"
    ).length;
    const draftJobsCount = transformedJobs.filter(
      (job) => job.status === "Draft"
    ).length;

    console.log(
      "📊 Tab counts - Active:",
      activeJobsCount,
      "Draft:",
      draftJobsCount
    );

    return {
      activeJobs: activeJobsCount,
      draftJobs: draftJobsCount,
    };
  }, [transformedJobs]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    console.log("📊 Calculating filter counts for jobs:", transformedJobs);

    const counts = {
      status: {} as Record<string, number>,
      type: {} as Record<string, number>,
      experience: {} as Record<string, number>,
      location: {} as Record<string, number>,
    };

    transformedJobs.forEach((job) => {
      counts.status[job.status] = (counts.status[job.status] || 0) + 1;
      counts.type[job.type] = (counts.type[job.type] || 0) + 1;

      let expCategory = "Entry";
      if (job.experience.includes("5+")) {
        expCategory = "Senior";
      } else if (job.experience.includes("2-5")) {
        expCategory = "Mid";
      }
      counts.experience[expCategory] =
        (counts.experience[expCategory] || 0) + 1;
      counts.location[job.locationType] =
        (counts.location[job.locationType] || 0) + 1;
    });

    console.log("📊 Filter counts:", counts);
    return counts;
  }, [transformedJobs]);

  const toggleFilter = (filterType: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const updateFilter = (
    category: keyof Filters,
    value: string,
    isActive: boolean
  ) => {
    setActiveFilters((prev) => ({
      ...prev,
      [category]: isActive
        ? [...prev[category], value]
        : prev[category].filter((item) => item !== value),
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      status: [],
      type: [],
      experience: [],
      location: [],
    });
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "newest":
        return "Date Posted";
      case "oldest":
        return "Oldest First";
      case "applicants":
        return "Most Applicants";
      case "salary":
        return "Highest Salary";
      default:
        return "Date Posted";
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    console.log("🔍 Filtering and sorting jobs...");
    console.log("📊 Input jobs:", transformedJobs);
    console.log("🔍 Search query:", searchQuery);
    console.log("🔧 Active filters:", activeFilters);
    console.log("📈 Sort by:", sortBy);

    let filtered = transformedJobs;

    // Filter by view mode first
    if (viewMode === "jobs") {
      filtered = filtered.filter((job) => job.status !== "Draft");
    } else {
      filtered = filtered.filter((job) => job.status === "Draft");
    }

    // Search filter
    if (searchQuery) {
      console.log("🔍 Applying search filter:", searchQuery);
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.requirements.some((req) =>
            req.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      console.log("🔍 After search filter:", filtered.length, "jobs");
    }

    // Status filter
    const hasStatusFilters = activeFilters.status.length > 0;
    if (hasStatusFilters) {
      console.log("📊 Applying status filter:", activeFilters.status);
      filtered = filtered.filter((job) =>
        activeFilters.status.includes(job.status)
      );
      console.log("📊 After status filter:", filtered.length, "jobs");
    }

    // Type filter
    const hasTypeFilters = activeFilters.type.length > 0;
    if (hasTypeFilters) {
      console.log("💼 Applying type filter:", activeFilters.type);
      filtered = filtered.filter((job) =>
        activeFilters.type.includes(job.type)
      );
      console.log("💼 After type filter:", filtered.length, "jobs");
    }

    // Experience filter
    const hasExperienceFilters = activeFilters.experience.length > 0;
    if (hasExperienceFilters) {
      console.log("🎯 Applying experience filter:", activeFilters.experience);
      filtered = filtered.filter((job) => {
        if (
          activeFilters.experience.includes("Senior") &&
          job.experience.includes("5+")
        )
          return true;
        if (
          activeFilters.experience.includes("Mid") &&
          job.experience.includes("2-5")
        )
          return true;
        if (
          activeFilters.experience.includes("Entry") &&
          job.experience.includes("0-2")
        )
          return true;
        return false;
      });
      console.log("🎯 After experience filter:", filtered.length, "jobs");
    }

    // Location filter
    const hasLocationFilters = activeFilters.location.length > 0;
    if (hasLocationFilters) {
      console.log("📍 Applying location filter:", activeFilters.location);
      filtered = filtered.filter((job) => {
        return activeFilters.location.includes(job.locationType);
      });
      console.log("📍 After location filter:", filtered.length, "jobs");
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime()
          );
        case "applicants":
          return b.applicants - a.applicants;
        case "salary":
          return b.salary.max - a.salary.max;
        default:
          return 0;
      }
    });

    console.log("✅ Final filtered and sorted jobs:", sorted);
    return sorted;
  }, [transformedJobs, searchQuery, activeFilters, sortBy, viewMode]);

  console.log("🎯 Current state:");
  console.log("- isLoading:", isLoading);
  console.log("- error:", error);
  console.log("- allJobs.length:", allJobs.length);
  console.log("- transformedJobs.length:", transformedJobs.length);
  console.log("- filteredAndSortedJobs.length:", filteredAndSortedJobs.length);
  console.log("- viewMode:", viewMode);
  console.log("- tabCounts:", tabCounts);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Error Loading Jobs
              </h2>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={loadAllJobsData}
                  className="block w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
                {error.includes("log in") && (
                  <Link
                    href="/login"
                    className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go to Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <JobFilterSidebar
        expandedFilters={expandedFilters}
        toggleFilter={toggleFilter}
        activeFilters={activeFilters}
        updateFilter={updateFilter}
        clearAllFilters={clearAllFilters}
        filterCounts={filterCounts}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              {viewMode === "jobs" ? "Active jobs" : "Draft jobs"}
            </h1>
            <Link
              href="create-job"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create Job
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mb-4">
            <button
              className={`pb-2 px-1 ${
                viewMode === "jobs"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setViewMode("jobs")}
            >
              <span className="font-medium">Jobs</span>
              <span
                className={`ml-2 text-sm px-2 py-0.5 rounded-full ${
                  viewMode === "jobs"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tabCounts.activeJobs}
              </span>
            </button>
            <button
              className={`pb-2 px-1 ${
                viewMode === "drafts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setViewMode("drafts")}
            >
              <span>Drafts</span>
              <span
                className={`ml-2 text-sm px-2 py-0.5 rounded-full ${
                  viewMode === "drafts"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tabCounts.draftJobs}
              </span>
            </button>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative ml-4">
              <button
                className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <span>Sort By: {getSortLabel(sortBy)}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {(
                      [
                        "newest",
                        "oldest",
                        "applicants",
                        "salary",
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
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredAndSortedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}

            {filteredAndSortedJobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery
                    ? "No jobs found matching your search."
                    : viewMode === "drafts"
                    ? "No draft jobs found."
                    : "No active jobs found."}
                </p>
                {Object.values(activeFilters).some((arr) => arr.length > 0) && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                )}
                {viewMode === "drafts" &&
                  filteredAndSortedJobs.length === 0 &&
                  !searchQuery && (
                    <Link
                      href="create-job"
                      className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Create your first job
                    </Link>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ApiCompany, ApiJob } from "@/interfaces";
import { jobService } from "@/services/jobService";
import {
  AlertCircle,
  ChevronDown,
  Loader2,
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApplicantJobCard } from "@/components/jobs/ApplicantJobCard";
import { ApplicantJobFilterSidebar } from "@/components/jobs/ApplicantJobFilterSidebar";

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

// Helper functions
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

const extractLocationString = (locations: any): string => {
  if (!locations) return "Location not specified";
  if (typeof locations === "string") return locations;
  if (typeof locations === "object") {
    if (Array.isArray(locations)) {
      if (locations.length > 0) {
        const firstLocation = locations[0];
        if (typeof firstLocation === "string") return firstLocation;
        if (typeof firstLocation === "object") {
          return extractFromLocationObject(firstLocation);
        }
      }
    } else {
      return extractFromLocationObject(locations);
    }
  }
  return "Location not specified";
};

const extractFromLocationObject = (location: any): string => {
  if (!location) return "Location not specified";
  const city = location.city || "";
  const state = location.state || "";
  if (city && state) {
    return `${city}, ${state}`;
  }
  return (
    location.address ||
    location.description ||
    location.name ||
    location.location ||
    "Location not specified"
  );
};

const formatSalary = (job: ApiJob): string => {
  if (!job) return "Salary not specified";
  const salaryMin = Number(job.salaryMin) || 0;
  const salaryMax = Number(job.salaryMax) || 0;
  const currency = String(job.salaryCurrency || "USD");

  if (!salaryMin && !salaryMax) return "Salary not specified";
  const formatNumber = (num: number) => num.toLocaleString();

  if (salaryMin && salaryMax) {
    return `${currency} ${formatNumber(salaryMin)} - ${currency} ${formatNumber(
      salaryMax
    )}`;
  } else if (salaryMin) {
    return `${currency} ${formatNumber(salaryMin)}+`;
  } else if (salaryMax) {
    return `Up to ${currency} ${formatNumber(salaryMax)}`;
  }
  return "Salary not specified";
};

const formatPostedDate = (dateString: any): string => {
  try {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return "";
  }
};

const formatExperience = (
  seniorityLevel: string,
  minYears?: number
): string => {
  const minYearsNum = Number(minYears) || 0;
  if (minYearsNum > 0) {
    if (minYearsNum <= 2) return "0-2 Years";
    if (minYearsNum <= 5) return "2-5 Years";
    return "5+ Years";
  }
  const level = String(seniorityLevel || "").toLowerCase();
  switch (level) {
    case "junior":
      return "0-2 Years";
    case "mid":
      return "2-5 Years";
    case "senior":
      return "5+ Years";
    default:
      return "Experience not specified";
  }
};

export function ApplicantJobsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<ApiJob[]>([]);
  const [companies, setCompanies] = useState<Map<string, ApiCompany>>(
    new Map()
  );

  const [expandedFilters, setExpandedFilters] = useState({
    type: true,
    experience: true,
    location: false,
    locationType: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [activeFilters, setActiveFilters] = useState<Filters>({
    type: [],
    experience: [],
    location: [],
    locationType: [],
  });

  const { user } = useAuth();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    console.log("🌍 Loading jobs for applicants...");
    setIsLoading(true);
    setError(null);

    try {
      const activeJobs = await jobService.getPublicJobs("Open");
      console.log("✅ Loaded jobs:", activeJobs?.length || 0);

      if (activeJobs && activeJobs.length > 0) {
        // Completely sanitize all .NET objects
        const fullyCleanedJobs = activeJobs.map((job): ApiJob => {
          const cleaned = deepCleanNetObjects(job);
          return {
            id: String(cleaned.id || ""),
            title: String(cleaned.title || ""),
            description: String(cleaned.description || ""),
            employmentType: String(cleaned.employmentType || "Full-time"),
            locationType: String(cleaned.locationType || "On-site"),
            seniorityLevel: String(cleaned.seniorityLevel || ""),
            status: String(cleaned.status || ""),
            salaryCurrency: String(cleaned.salaryCurrency || "USD"),
            companyId: String(cleaned.companyId || ""),
            createdBy: String(cleaned.createdBy || ""),
            locations: cleaned.locations || {},
            requirements: Array.isArray(cleaned.requirements)
              ? cleaned.requirements.map(String)
              : [],
            qualifications: Array.isArray(cleaned.qualifications)
              ? cleaned.qualifications.map(String)
              : [],
            responsibilities: Array.isArray(cleaned.responsibilities)
              ? cleaned.responsibilities.map(String)
              : [],
            benefits: Array.isArray(cleaned.benefits)
              ? cleaned.benefits.map(String)
              : [],
            // Convert all dates to strings
            postedDate: cleaned.postedDate || undefined,
            createdAt: cleaned.createdAt || undefined,
            applicationDeadline: cleaned.applicationDeadline || undefined,
            // Convert all numbers
            salaryMin: Number(cleaned.salaryMin) || 0,
            salaryMax: Number(cleaned.salaryMax) || 0,
            experienceYearsMin: Number(cleaned.experienceYearsMin) || 0,
            applicantCount: Number(cleaned.applicantCount) || 0,
            viewCount: Number(cleaned.viewCount) || 0,
            // Add missing required properties
            aiGeneratedDescription:
              Boolean(cleaned.aiGeneratedDescription) || false,
            skillMatchThreshold: Number(cleaned.skillMatchThreshold) || 0,
          };
        });

        setAllJobs(fullyCleanedJobs);

        // Load and clean company data
        const companyMap = new Map<string, ApiCompany>();
        const companyPromises = fullyCleanedJobs
          .filter((job) => job.companyId)
          .map(async (job) => {
            try {
              const company = await jobService.getCompanyById(job.companyId);
              if (company) {
                const cleanedCompany = deepCleanNetObjects(company);
                companyMap.set(job.companyId, {
                  id: String(cleanedCompany.id || ""),
                  name: String(cleanedCompany.name || ""),
                  industry: String(cleanedCompany.industry || ""),
                  companySize: String(cleanedCompany.companySize || ""),
                  website: String(cleanedCompany.website || ""),
                  description: String(cleanedCompany.description || ""),
                  logoUrl: String(cleanedCompany.logoUrl || ""),
                  headquarters: cleanedCompany.headquarters || {},
                  foundedYear: Number(cleanedCompany.foundedYear) || undefined,
                  isVerified: Boolean(cleanedCompany.isVerified) || false,
                  createdAt: cleanedCompany.createdAt || undefined,
                });
              }
            } catch (error) {
              console.warn(`Failed to load company for job ${job.id}:`, error);
            }
          });

        await Promise.all(companyPromises);
        setCompanies(companyMap);
      } else {
        setAllJobs([]);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load jobs";

      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Authentication")
      ) {
        setError(
          "Unable to browse jobs. Please try refreshing the page or contact support if the issue persists."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      type: {} as Record<string, number>,
      experience: {} as Record<string, number>,
      location: {} as Record<string, number>,
      locationType: {} as Record<string, number>,
    };

    allJobs.forEach((job) => {
      const type = String(job.employmentType || "Full-time");
      counts.type[type] = (counts.type[type] || 0) + 1;

      const experience = formatExperience(
        String(job.seniorityLevel || ""),
        Number(job.experienceYearsMin) || 0
      );
      counts.experience[experience] = (counts.experience[experience] || 0) + 1;

      const locationType = String(job.locationType || "On-site");
      counts.locationType[locationType] =
        (counts.locationType[locationType] || 0) + 1;

      const location = extractLocationString(job.locations);
      counts.location[location] = (counts.location[location] || 0) + 1;
    });

    return counts;
  }, [allJobs]);

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
      type: [],
      experience: [],
      location: [],
      locationType: [],
    });
    setSearchQuery("");
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "newest":
        return "Newest First";
      case "oldest":
        return "Oldest First";
      case "salary":
        return "Highest Salary";
      case "relevance":
        return "Most Relevant";
      default:
        return "Newest First";
    }
  };

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = allJobs;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job) => {
        const title = String(job.title || "").toLowerCase();
        const description = String(job.description || "").toLowerCase();
        const company = String(
          companies.get(job.companyId)?.name || ""
        ).toLowerCase();
        return (
          title.includes(query) ||
          description.includes(query) ||
          company.includes(query)
        );
      });
    }

    // Employment type filter
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter((job) => {
        const jobType = String(job.employmentType || "Full-time");
        return activeFilters.type.includes(jobType);
      });
    }

    // Experience filter
    if (activeFilters.experience.length > 0) {
      filtered = filtered.filter((job) => {
        const experience = formatExperience(
          String(job.seniorityLevel || ""),
          Number(job.experienceYearsMin) || 0
        );
        return activeFilters.experience.includes(experience);
      });
    }

    // Location type filter
    if (activeFilters.locationType.length > 0) {
      filtered = filtered.filter((job) => {
        const locationType = String(job.locationType || "On-site");
        return activeFilters.locationType.includes(locationType);
      });
    }

    // Location filter
    if (activeFilters.location.length > 0) {
      filtered = filtered.filter((job) => {
        const location = extractLocationString(job.locations);
        return activeFilters.location.includes(location);
      });
    }

    // Sort jobs
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        case "oldest":
          const dateAOld = new Date(a.createdAt || 0);
          const dateBOld = new Date(b.createdAt || 0);
          return dateAOld.getTime() - dateBOld.getTime();
        case "salary":
          const salaryA = Number(a.salaryMax || a.salaryMin || 0);
          const salaryB = Number(b.salaryMax || b.salaryMin || 0);
          return salaryB - salaryA;
        case "relevance":
          return 0;
        default:
          return 0;
      }
    });

    return sorted;
  }, [allJobs, companies, searchQuery, sortBy, activeFilters]);

  const hasActiveFilters =
    Object.values(activeFilters).some((arr) => arr.length > 0) ||
    searchQuery.trim() !== "";

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Finding the perfect jobs for you...</p>
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
                Unable to Load Jobs
              </h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={loadJobs}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <ApplicantJobFilterSidebar
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Find Your Next Job
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredAndSortedJobs.length} job
                {filteredAndSortedJobs.length !== 1 ? "s" : ""} available
              </p>
            </div>
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
                placeholder="Search jobs, companies..."
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
                        "salary",
                        "relevance",
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

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchQuery}"
                </span>
              )}
              {Object.entries(activeFilters).map(([key, values]) =>
                values.map((value: string) => (
                  <span
                    key={`${key}-${value}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {value}
                  </span>
                ))
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-800 ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredAndSortedJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-sm border p-8">
                  <div className="h-12 w-12 text-gray-400 mx-auto mb-4">💼</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Jobs Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasActiveFilters
                      ? "Try adjusting your filters or search terms"
                      : "There are no active job postings at the moment"}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredAndSortedJobs.map((job) => (
                <ApplicantJobCard
                  key={job.id}
                  job={job}
                  company={companies.get(job.companyId)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

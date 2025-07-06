"use client";

import { BulkActionToolbar } from "@/components/jobs/BulkActionToolbar";
import { JobFilterSidebar } from "@/components/jobs/JobFilterSidebar";
import { ApiCompany, ApiJob } from "@/interfaces";
import { Job } from "@/interfaces/job";
import { jobService } from "@/services/jobService";
import {
  AlertCircle,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JobCard } from "./JobCard";

type SortOption = "newest" | "oldest" | "applicants" | "salary";
type ViewMode =
  | "All"
  | "Active"
  | "Paused"
  | "Closed"
  | "Draft"
  | "Expired";

interface Filters {
  status: string[];
  type: string[];
  experience: string[];
  workType: string[];
}

// Helper functions for data transformation
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
  status: any
): "Draft" | "Active" | "Paused" | "Closed" | "Expired" => {
  if (typeof status !== "string") {
    console.warn("Invalid status, defaulting to Draft:", status);
    return "Draft";
  }

  // Since jobService already converted to frontend format, just validate and return
  const validStatuses = [
    "Active",
    "Draft",
    "Paused",
    "Closed",
    "Expired",
  ];
  const titleCaseStatus =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  if (validStatuses.includes(titleCaseStatus as any)) {
    console.log(`✅ Valid frontend status: ${status} -> ${titleCaseStatus}`);
    return titleCaseStatus as
      | "Draft"
      | "Active"
      | "Paused"
      | "Closed"
      | "Expired";
  }

  console.warn(`⚠️ Unknown status "${status}", defaulting to Draft`);
  return "Draft";
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
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<ApiJob[]>([]);
  const [companies, setCompanies] = useState<Map<string, ApiCompany>>(
    new Map()
  );

  // Bulk selection state
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Filter and view state
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    type: true,
    experience: false,
    workType: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(6);

  const [activeFilters, setActiveFilters] = useState<Filters>({
    status: [],
    type: [],
    experience: [],
    workType: [],
  });

  const searchParams = useSearchParams();

  // Set initial view mode based on URL parameter
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "drafts") {
      setViewMode("Draft");
    } else {
      setViewMode("All");
    }
  }, [searchParams]);

  useEffect(() => {
    // Wait for authentication to be loaded before trying to load jobs data
    if (!authLoading) {
    loadAllJobsData();
    }
  }, [authLoading]);

  const loadAllJobsData = async () => {
    console.log("🔄 Loading jobs data for hiring user's company...");
    setIsLoading(true);
    setError(null);
    setSelectedJobs([]); // Clear selections when reloading

    try {
      if (!isAuthenticated) {
        throw new Error("Please log in to view jobs");
      }

      // Get the current user's company ID
      const authData = jobService.getCurrentUser();
      console.log("👤 Current user auth data:", authData);

      let userCompanyId: string | null = null;

      if (authData.companyId) {
        userCompanyId = authData.companyId;
        console.log("🏢 User's company ID from jobService:", userCompanyId);
      } else {
        // If no company ID in auth, try to get it from storage
        const currentUserStr =
          localStorage.getItem("currentUser") ||
          sessionStorage.getItem("currentUser");
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            userCompanyId = currentUser.companyId;
            console.log("🏢 Company ID from storage:", userCompanyId);
          } catch (error) {
            console.warn("Failed to parse currentUser from storage:", error);
          }
        }
        
        // Also try to get from cookies
        if (!userCompanyId) {
          const cookies = document.cookie.split(';');
          for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) === ' ') {
              cookie = cookie.substring(1, cookie.length);
            }
            if (cookie.indexOf('userData=') === 0) {
              try {
                const userData = JSON.parse(decodeURIComponent(cookie.substring('userData='.length, cookie.length)));
                userCompanyId = userData.companyId;
                console.log("🏢 Company ID from cookies:", userCompanyId);
              } catch (error) {
                console.warn("Failed to parse userData from cookie:", error);
              }
            }
          }
        }
      }

      if (!userCompanyId) {
        throw new Error(
          "No company associated with your account. Please contact your administrator."
        );
      }

      //   // Load ALL jobs for the company (all statuses)
      //   console.log("📊 Loading all jobs for company:", userCompanyId);
      //   const allJobsData = await jobService.getAllJobs(undefined, userCompanyId);

      //   console.log("📊 Company-filtered jobs data:", allJobsData);
      //   console.log("📊 Number of company jobs:", allJobsData?.length || 0);

      //   setAllJobs(allJobsData || []);
      console.log("🔍 DEBUGGING: Testing individual API calls...");

      try {
        console.log(
          "📞 Calling jobService.getAllJobs('Active', userCompanyId)..."
        );
        const activeJobs = await jobService.getAllJobs("Active", userCompanyId);
        console.log("📞 Response for Open jobs:", activeJobs);
        console.log("📞 Open jobs count:", activeJobs?.length || 0);
        if (activeJobs && activeJobs.length > 0) {
          console.log("📞 First Open job status:", activeJobs[0].status);
          console.log("📞 First Open job title:", activeJobs[0].title);
        }
      } catch (error) {
        console.error("❌ Error fetching Open jobs:", error);
      }

      try {
        console.log(
          "📞 Calling jobService.getAllJobs('Draft', userCompanyId)..."
        );
        const draftJobs = await jobService.getAllJobs("Draft", userCompanyId);
        console.log("📞 Response for Draft jobs:", draftJobs);
        console.log("📞 Draft jobs count:", draftJobs?.length || 0);
        if (draftJobs && draftJobs.length > 0) {
          console.log("📞 First Draft job status:", draftJobs[0].status);
          console.log("📞 First Draft job title:", draftJobs[0].title);
        }
      } catch (error) {
        console.error("❌ Error fetching Draft jobs:", error);
      }

      // ✅ Continue with the parallel loading approach
      const [
        activeJobs,
        draftJobs,
        pausedJobs,
        closedJobs,
        expiredJobs,
      ] = await Promise.all([
        jobService.getAllJobs("Active", userCompanyId),
        jobService.getAllJobs("Draft", userCompanyId),
        jobService.getAllJobs("Paused", userCompanyId),
        jobService.getAllJobs("Closed", userCompanyId),
        jobService.getAllJobs("Expired", userCompanyId),
      ]);

      // ✅ ADD MORE DEBUGGING: Check what we got back
      console.log("🔍 DEBUGGING: Results from parallel calls:");
      console.log(
        "- Active jobs from API:",
        activeJobs?.length || 0,
        activeJobs
      );
      console.log("- Draft jobs from API:", draftJobs?.length || 0, draftJobs);
      console.log("- Paused jobs from API:", pausedJobs?.length || 0);
      console.log("- Closed jobs from API:", closedJobs?.length || 0);
      console.log("- Expired jobs from API:", expiredJobs?.length || 0);

      // Check status values in the returned jobs
      if (activeJobs && activeJobs.length > 0) {
        console.log("🔍 DEBUGGING: Status values in activeJobs:");
        activeJobs.forEach((job, index) => {
          console.log(
            `  ${index + 1}. "${job.title}" - Status: "${
              job.status
            }" (${typeof job.status})`
          );
        });
      }

      if (draftJobs && draftJobs.length > 0) {
        console.log("🔍 DEBUGGING: Status values in draftJobs:");
        draftJobs.slice(0, 3).forEach((job, index) => {
          console.log(
            `  ${index + 1}. "${job.title}" - Status: "${
              job.status
            }" (${typeof job.status})`
          );
        });
      }

      // Combine all jobs
      const allJobsData = [
        ...(activeJobs || []),
        ...(draftJobs || []),
        ...(pausedJobs || []),
        ...(closedJobs || []),
        ...(expiredJobs || []),
      ];

      console.log("🔍 DEBUGGING: Combined allJobsData:");
      console.log("- Total combined jobs:", allJobsData.length);
      allJobsData.forEach((job, index) => {
        console.log(
          `  ${index + 1}. "${job.title}" - Status: "${
            job.status
          }" (${typeof job.status})`
        );
      });

      setAllJobs(allJobsData || []);

      // Load company data for the user's company
      console.log("🏢 Loading company data for:", userCompanyId);
      const companiesMap = new Map<string, ApiCompany>();

      try {
        console.log(`🏢 Loading company ${userCompanyId}...`);
        const company = await jobService.getCompanyById(userCompanyId);
        console.log(`✅ Company loaded:`, company);
        companiesMap.set(userCompanyId, company);
      } catch (error) {
        console.warn(`❌ Failed to load company ${userCompanyId}:`, error);
      }

      console.log("🏢 Companies map:", companiesMap);
      setCompanies(companiesMap);
    } catch (error) {
      console.error("❌ Error loading company jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  // Transform API jobs to your existing Job interface format
  const transformedJobs = useMemo(() => {
    console.log(
      "🔄 TRANSFORMATION START:",
      allJobs.length,
      "jobs to transform"
    );

    if (allJobs.length > 0) {
      console.log("🔍 Raw jobs from API (first 5):");
      allJobs.slice(0, 5).forEach((job, index) => {
        console.log(`  ${index + 1}. "${job.title}" - Status: "${job.status}"`);
      });
    }

    const transformed = allJobs.map((apiJob, index): Job => {
      console.log(`\n🔄 Transforming job ${index + 1}: "${apiJob.title}"`);
      console.log(`📊 Input status: "${apiJob.status}"`);

      const company = companies.get(apiJob.companyId);
      const mappedStatus = mapStatusToJobFormat(apiJob.status);

      console.log(`📊 Output status: "${mappedStatus}"`);

      const transformedJob: Job = {
        id: apiJob.id,
        title: apiJob.title,
        company: company?.name || "Unknown Company",
        location: extractLocationString(apiJob.locations),
        locationType: mapLocationTypeToJobFormat(apiJob.locationType),
        type: mapEmploymentTypeToJobFormat(apiJob.employmentType),
        department: apiJob.department || "Not specified",
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
        status: mappedStatus, // ← This is the key line
        applicants: apiJob.applicantCount || 0,
        viewCount: apiJob.viewCount || 0,
        createdBy: apiJob.createdBy,
        updatedAt: apiJob.createdAt,
      };

      return transformedJob;
    });

    // Count final statuses
    const statusCounts = {
      Active: transformed.filter((job) => job.status === "Active").length,
      Draft: transformed.filter((job) => job.status === "Draft").length,
      Paused: transformed.filter((job) => job.status === "Paused").length,
      Closed: transformed.filter((job) => job.status === "Closed").length,
      Expired: transformed.filter((job) => job.status === "Expired").length,
    };

    console.log("📊 FINAL STATUS COUNTS:", statusCounts);
    console.log("✅ TRANSFORMATION COMPLETE");

    return transformed;
  }, [allJobs, companies]);

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    console.log("🔄 Calculating tab counts...");

    let filtered = transformedJobs;

    // Apply the same filtering logic but count all statuses for tabs
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.requirements.some((req) =>
            req.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply filters except status (for accurate tab counts)
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter((job) =>
        activeFilters.type.includes(job.type)
      );
    }

    if (activeFilters.experience.length > 0) {
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
    }

    if (activeFilters.workType.length > 0) {
      filtered = filtered.filter((job) => {
        return activeFilters.workType.includes(job.locationType);
      });
    }

    const counts = {
      All: filtered.length,
      Active: filtered.filter((job) => job.status === "Active").length,
      Paused: filtered.filter((job) => job.status === "Paused").length,
      Closed: filtered.filter((job) => job.status === "Closed").length,
      Draft: filtered.filter((job) => job.status === "Draft").length,
      Expired: filtered.filter((job) => job.status === "Expired").length,
    };

    console.log("📊 Tab counts:", counts);
    return counts;
  }, [transformedJobs, searchQuery, activeFilters]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    console.log("📊 Calculating filter counts for jobs:", transformedJobs);

    const counts = {
      status: {} as Record<string, number>,
      type: {} as Record<string, number>,
      experience: {} as Record<string, number>,
      workType: {} as Record<string, number>,
    };

    // Count all jobs for status filter
    transformedJobs.forEach((job) => {
      counts.status[job.status] = (counts.status[job.status] || 0) + 1;
    });

    // Only count Active jobs for type, experience, and workType filters
    const activeJobs = transformedJobs.filter((job) => job.status === "Active");
    
    activeJobs.forEach((job) => {
      counts.type[job.type] = (counts.type[job.type] || 0) + 1;

      let expCategory = "Entry";
      if (job.experience.includes("5+")) {
        expCategory = "Senior";
      } else if (job.experience.includes("2-5")) {
        expCategory = "Mid";
      }
      counts.experience[expCategory] =
        (counts.experience[expCategory] || 0) + 1;
      counts.workType[job.locationType] =
        (counts.workType[job.locationType] || 0) + 1;
    });

    console.log("📊 Filter counts (Active jobs only for type/experience/workType):", counts);
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
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters({
      status: [],
      type: [],
      experience: [],
      workType: [],
    });
    setCurrentPage(1);
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
    let filtered = transformedJobs;

    // Filter by view mode first
    if (viewMode !== "All") {
      filtered = filtered.filter((job) => job.status === viewMode);
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
    }

    // Status filter
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter((job) =>
        activeFilters.status.includes(job.status)
      );
    }

    // Type filter
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter((job) =>
        activeFilters.type.includes(job.type)
      );
    }

    // Experience filter
    if (activeFilters.experience.length > 0) {
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
    }

    // Work Type filter
    if (activeFilters.workType.length > 0) {
      filtered = filtered.filter((job) => {
        return activeFilters.workType.includes(job.locationType);
      });
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

  // Reset to first page when view mode changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedJobs([]); // Clear selections when changing view
  }, [viewMode, searchQuery, activeFilters]);

  // Calculate pagination
  const totalJobs = filteredAndSortedJobs.length;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const paginatedJobs = filteredAndSortedJobs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedJobs([]); // Clear selections when changing page
    document
      .getElementById("job-list-container")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  //   // Bulk selection handlers
  //   const handleSelectJob = (jobId: string, isSelected: boolean) => {
  //     if (isSelected) {
  //       setSelectedJobs((prev) => [...prev, jobId]);
  //     } else {
  //       setSelectedJobs((prev) => prev.filter((id) => id !== jobId));
  //     }
  //   };

  const handleSelectAll = () => {
    if (isSelectAllMode) {
      setSelectedJobs([]);
      setIsSelectAllMode(false);
    } else {
      setSelectedJobs(paginatedJobs.map((job) => job.id));
      setIsSelectAllMode(true);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedJobs.length === 0) return;

    setIsBulkUpdating(true);
    try {
      // Convert frontend status to backend format if needed
      const backendStatus = status === "Active" ? "Active" : status; // JobService will handle conversion

      await jobService.bulkChangeJobStatus({
        jobIds: selectedJobs,
        status: backendStatus,
        reason: `Bulk status change to ${status}`,
      });

      console.log(
        `✅ Bulk status change completed: ${selectedJobs.length} jobs changed to ${status}`
      );

      // Refresh data
      await loadAllJobsData();

      // Clear selections
      setSelectedJobs([]);
      setIsSelectAllMode(false);
    } catch (error) {
      console.error("❌ Bulk status change failed:", error);
      // Show error notification here
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleJobUpdated = useCallback(() => {
    loadAllJobsData();
  }, []);

  // Tab configuration - all properly capitalized
  const tabs = [
    { id: "All" as ViewMode, label: "All Jobs", count: tabCounts.All },
    { id: "Active" as ViewMode, label: "Active", count: tabCounts.Active },
    { id: "Paused" as ViewMode, label: "Paused", count: tabCounts.Paused },
    { id: "Closed" as ViewMode, label: "Closed", count: tabCounts.Closed },
    { id: "Draft" as ViewMode, label: "Drafts", count: tabCounts.Draft },
    { id: "Expired" as ViewMode, label: "Expired", count: tabCounts.Expired },
  ];

  console.log("🎯 Current state:");
  console.log("- isLoading:", isLoading);
  console.log("- error:", error);
  console.log("- allJobs.length:", allJobs.length);
  console.log("- transformedJobs.length:", transformedJobs.length);
  console.log("- filteredAndSortedJobs.length:", filteredAndSortedJobs.length);
  console.log("- viewMode:", viewMode);
  console.log("- selectedJobs:", selectedJobs.length);

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
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Job Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your company&apos;s job postings and applications
              </p>
            </div>
            <Link
              href="/create-job"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Link>
          </div>

          {/* Enhanced Tabs */}
          <div className="flex space-x-1 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`whitespace-nowrap pb-2 px-3 ${
                  viewMode === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setViewMode(tab.id)}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-2 text-sm px-2 py-0.5 rounded-full ${
                    viewMode === tab.id
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
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

              {/* Select All Checkbox */}
              {paginatedJobs.length > 0 && (
                <div className="flex items-center">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {isSelectAllMode ? (
                      <CheckSquare className="h-4 w-4 mr-1 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 mr-1" />
                    )}
                    Select All
                  </button>
                </div>
              )}
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

        {/* Bulk Actions Toolbar */}
        <BulkActionToolbar
          selectedJobs={selectedJobs}
          onBulkStatusChange={handleBulkStatusChange}
          onClearSelection={() => {
            setSelectedJobs([]);
            setIsSelectAllMode(false);
          }}
          isLoading={isBulkUpdating}
        />

        {/* Job List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div id="job-list-container" className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {filteredAndSortedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white rounded-lg shadow-sm border p-8">
                    <div className="h-12 w-12 text-gray-400 mx-auto mb-4">
                      💼
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No{" "}
                      {viewMode === "All"
                        ? ""
                        : tabs.find((t) => t.id === viewMode)?.label}{" "}
                      Jobs Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {viewMode === "Draft"
                        ? "You haven't created any draft jobs yet"
                        : Object.values(activeFilters).some(
                            (arr) => arr.length > 0
                          ) || searchQuery
                        ? "Try adjusting your filters or search terms"
                        : `No ${
                            viewMode === "All" ? "" : viewMode.toLowerCase()
                          } jobs available`}
                    </p>
                    {Object.values(activeFilters).some(
                      (arr) => arr.length > 0
                    ) || searchQuery ? (
                      <button
                        onClick={() => {
                          clearAllFilters();
                          setSearchQuery("");
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Clear Filters
                      </button>
                    ) : viewMode === "Draft" ? (
                      <Link
                        href="/jobs/create"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Create Your First Job
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  {paginatedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      showAnalytics={true}
                      onJobUpdated={handleJobUpdated}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalJobs)} of{" "}
                  {totalJobs} jobs
                  {selectedJobs.length > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">
                      ({selectedJobs.length} selected)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 2
                        );
                      })
                      .map((page, index, filteredPages) => {
                        const showEllipsis =
                          index > 0 && page - filteredPages[index - 1] > 1;

                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

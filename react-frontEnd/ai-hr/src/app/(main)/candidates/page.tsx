"use client";

import { withHiringAuth } from "@/components/auth/WithHiringAuth";
import { JobGrid } from "@/components/candidates/JobGrid";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState } from "@/components/ui/LoadingState";
import { useHiringAuth } from "@/hooks/useHiringAuth";
import { Job } from "@/interfaces";
import { jobService } from "@/services/jobService";
import { Briefcase, FileText, Plus, Users, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// Empty State Component
interface EmptyStateProps {
  type: "no-jobs" | "no-applications";
  companyName?: string;
  onCreateJob?: () => void;
}

function EmptyState({
  type,
  companyName = "your company",
  onCreateJob,
}: EmptyStateProps) {
  const emptyStates = {
    "no-jobs": {
      icon: <Briefcase className="h-16 w-16 text-gray-300" />,
      title: "No Job Postings Yet",
      description: `${companyName} hasn't posted any jobs yet. Create your first job posting to start receiving applications.`,
      actionText: "Create First Job",
      actionIcon: <Plus className="h-4 w-4 mr-2" />,
      action: onCreateJob,
      tips: [
        "Post jobs to attract qualified candidates",
        "Use detailed job descriptions for better matches",
        "Include salary ranges to attract serious applicants",
      ],
    },
    "no-applications": {
      icon: <FileText className="h-16 w-16 text-gray-300" />,
      title: "No Applications Yet",
      description: `Your job postings haven't received any applications yet. This is normal for new postings.`,
      actionText: "View Job Postings",
      actionIcon: <Briefcase className="h-4 w-4 mr-2" />,
      action: () => (window.location.href = "/jobs"),
      tips: [
        "Share your job postings on social media",
        "Check job boards and career sites",
        "Applications typically start coming in within 24-48 hours",
      ],
    },
  };

  const state = emptyStates[type];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 py-12">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">{state.icon}</div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {state.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {state.description}
        </p>

        {/* Action Button */}
        {state.action && (
          <button
            onClick={state.action}
            className="inline-flex items-center px-4 py-2 bg-[#066046] text-white text-sm font-medium rounded-md hover:bg-[#267a54] transition-colors mb-8"
          >
            {state.actionIcon}
            {state.actionText}
          </button>
        )}

        {/* Tips */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            💡 Helpful Tips
          </h4>
          <ul className="text-sm text-gray-600 space-y-2">
            {state.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Main Candidates Page Component
function CandidatesPage() {
  const {
    isAuthorized,
    companyId,
    user,
    isLoading: authLoading,
  } = useHiringAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("your company");
  const [searchQuery, setSearchQuery] = useState("");
  const [allActiveJobs, setAllActiveJobs] = useState<Job[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(8); // Show 8 jobs per page (4 per row on large screens)
  const [totalJobs, setTotalJobs] = useState(0); // Total jobs from backend
  const [totalPages, setTotalPages] = useState(1); // Total pages from backend

  // Load jobs on component mount and when pagination changes
  useEffect(() => {
    const loadJobs = async () => {
      if (!companyId) {
        setJobs([]);
        setLoading(false);
        return;
      }

      // Wait for authentication to be fully loaded
      if (authLoading) {
        console.log("⏳ Waiting for authentication to load...");
        return;
      }

      if (!isAuthorized || !companyId) {
        console.log("❌ Not authorized or no company ID:", {
          isAuthorized,
          companyId,
        });
        return;
      }

      setLoading(true);
      try {
        // Use getAllJobs with pagination
        const response = await jobService.getAllJobs(
          "Active",
          companyId,
          currentPage,
          jobsPerPage
        );

        if (response.jobs && Array.isArray(response.jobs)) {
          const convertedJobs = response.jobs.map((apiJob: any) => {
            // Ensure the API job has the correct field names for conversion
            const normalizedApiJob = {
              ...apiJob,
              // Handle both camelCase and PascalCase field names from backend
              applicantCount:
                apiJob.applicantCount || apiJob.ApplicantCount || 0,
              viewCount: apiJob.viewCount || apiJob.ViewCount || 0,
            };
            const convertedJob =
              jobService.convertApiJobToJob(normalizedApiJob);
            return convertedJob;
          });
          setJobs(convertedJobs);

          // Update pagination state from backend response
          setTotalJobs(response.pagination.totalCount);
          setTotalPages(response.pagination.totalPages);
        } else {
          setJobs([]);
          setTotalJobs(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [companyId, isAuthorized, authLoading, currentPage, jobsPerPage]);

  // When searching, fetch a larger set of active jobs to search across
  useEffect(() => {
    const fetchAllActiveForSearch = async () => {
      if (!companyId || !isAuthorized || !searchQuery.trim()) return;
      try {
        const response = await jobService.getAllJobs(
          "Active",
          companyId,
          1,
          100
        );
        const convertedJobs = (response.jobs || []).map((apiJob: any) => {
          const normalizedApiJob = {
            ...apiJob,
            applicantCount: apiJob.applicantCount || apiJob.ApplicantCount || 0,
            viewCount: apiJob.viewCount || apiJob.ViewCount || 0,
          };
          return jobService.convertApiJobToJob(normalizedApiJob);
        });
        setAllActiveJobs(convertedJobs);
      } catch (e) {
        // Fail silently; fallback to current page jobs search
        console.warn("Failed to fetch all active jobs for search", e);
      }
    };

    fetchAllActiveForSearch();
  }, [searchQuery, companyId, isAuthorized]);

  // Compute displayed jobs (search filters across fetched allActiveJobs when available)
  const displayedJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return jobs;
    const source = allActiveJobs.length > 0 ? allActiveJobs : jobs;
    return source.filter((job) => {
      const title = String(job.title || "").toLowerCase();
      const dept = String(job.department || "").toLowerCase();
      const location = String(job.location || "").toLowerCase();
      const desc = String(job.description || "").toLowerCase();
      return (
        title.includes(query) ||
        dept.includes(query) ||
        location.includes(query) ||
        desc.includes(query)
      );
    });
  }, [searchQuery, jobs, allActiveJobs]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Return early if not authorized
  if (!isAuthorized) {
    return null;
  }

  // Handle loading state
  if (loading) {
    return (
      <LoadingState message="Loading jobs..." minHeightClass="min-h-screen" />
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Jobs
          </h2>
          <p className="text-gray-600 mb-4">
            {typeof error === "string" ? error : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#066046] text-white px-4 py-2 rounded hover:bg-[#267a54] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render - show job grid with pagination
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      <div className="bg-gradient-to-r from-[#066046]/5 to-[#267a54]/5 border border-[#066046]/10 rounded-xl p-8 mb-8 mx-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#066046]/10 rounded-lg">
              <svg
                className="w-8 h-8 text-[#066046]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Candidates by Job
              </h1>
              <p className="text-gray-600 text-base">
                Select a job to view and manage its candidates
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#066046] focus:border-[#066046]"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sm font-medium text-gray-600">
                {searchQuery.trim()
                  ? `${displayedJobs.length} result${
                      displayedJobs.length === 1 ? "" : "s"
                    }`
                  : `${totalJobs} Active Job${totalJobs !== 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          type="no-jobs"
          companyName={companyName}
          onCreateJob={() => (window.location.href = "/create-job")}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            <JobGrid jobs={displayedJobs} showStats={true} />
          </div>

          {/* Pagination Controls */}
          {!searchQuery.trim() && (
            <div className="px-6 py-3 border-t border-gray-200 bg-white">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalJobs}
                itemsPerPage={jobsPerPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default withHiringAuth(CandidatesPage);

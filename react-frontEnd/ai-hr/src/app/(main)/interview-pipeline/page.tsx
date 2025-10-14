"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  GitBranch,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { jobService } from "@/services/jobService";
import { useAuth } from "@/contexts/AuthContext";
import { ApiJob } from "@/interfaces/api";
import { InterviewTemplate } from "@/interfaces/interview";
import { Pagination } from "@/components/ui/Pagination";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/LoadingState";
const PipelineJobCard = dynamic(
  () =>
    import("@/components/interview_pipeline/PipelineJobCard").then(
      (m) => m.PipelineJobCard
    ),
  {
    loading: () => (
      <div className="h-40 bg-white border border-gray-200 rounded-lg animate-pulse" />
    ),
    ssr: false,
  }
);

interface JobWithTemplate extends Omit<ApiJob, "interviewTemplate"> {
  interviewTemplate?: InterviewTemplate;
  candidateCount?: number;
}

export default function InterviewPipelinePage() {
  const { isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<JobWithTemplate[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobWithTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(8); // Show 8 jobs per page (4 per row on large screens)
  const [totalJobs, setTotalJobs] = useState(0); // Total jobs from backend
  const [totalPages, setTotalPages] = useState(1); // Total pages from backend

  // Load jobs and their templates
  useEffect(() => {
    // Wait for authentication to be loaded before trying to load data
    if (!authLoading) {
      loadJobsWithTemplates();
    }
  }, [authLoading, currentPage]); // Reload when page changes

  // Filter jobs based on search and reset pagination
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.interviewTemplate?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
    // Reset to first page when search changes
    if (searchQuery.trim() !== "" && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [jobs, searchQuery, currentPage]);

  const loadJobsWithTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user's company ID
      const authData = jobService.getCurrentUser();
      console.log("👤 Interview pipeline - Current user auth data:", authData);

      let userCompanyId = authData.companyId;

      if (!userCompanyId) {
        // Try to get from storage
        const currentUserStr =
          localStorage.getItem("currentUser") ||
          sessionStorage.getItem("currentUser");
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            userCompanyId = currentUser.companyId;
            console.log(
              "🏢 Interview pipeline - Company ID from storage:",
              userCompanyId
            );
          } catch (error) {
            console.warn("Failed to parse currentUser from storage:", error);
          }
        }

        // Also try to get from cookies
        if (!userCompanyId) {
          const cookies = document.cookie.split(";");
          for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) === " ") {
              cookie = cookie.substring(1, cookie.length);
            }
            if (cookie.indexOf("userData=") === 0) {
              try {
                const userData = JSON.parse(
                  decodeURIComponent(
                    cookie.substring("userData=".length, cookie.length)
                  )
                );
                userCompanyId = userData.companyId;
                console.log(
                  "🏢 Interview pipeline - Company ID from cookies:",
                  userCompanyId
                );
              } catch (error) {
                console.warn("Failed to parse userData from cookie:", error);
              }
            }
          }
        }
      } else {
        console.log(
          "🏢 Interview pipeline - Company ID from jobService:",
          userCompanyId
        );
      }

      if (!userCompanyId) {
        throw new Error("No company associated with your account");
      }

      // Load active jobs for the company with pagination
      const response = await jobService.getAllJobs(
        "Active",
        userCompanyId,
        currentPage,
        jobsPerPage
      );

      if (!response || !response.jobs || response.jobs.length === 0) {
        setJobs([]);
        setTotalJobs(0);
        setTotalPages(1);
        return;
      }

      // Fast path: just set jobs; defer loading templates and candidate counts per card lazily
      const jobsWithMinimalData: JobWithTemplate[] = response.jobs.map(
        (job) => ({
          ...job,
          interviewTemplate: undefined,
          candidateCount: undefined,
        })
      );

      setJobs(jobsWithMinimalData);
      setFilteredJobs(jobsWithMinimalData); // Initially, filtered jobs are the same as loaded jobs

      // Update pagination state from backend response
      setTotalJobs(response.pagination.totalCount);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Error loading jobs with templates:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the jobs section
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <LoadingState
        message="Loading interview pipeline..."
        minHeightClass="min-h-screen"
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-800 font-medium">Error loading pipeline</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
          <button
            onClick={loadJobsWithTemplates}
            className="mt-4 px-4 py-2 bg-secondary text-white rounded-md hover:bg-accent transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#066046]/5 to-[#267a54]/5 border border-[#066046]/10 rounded-xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#066046]/10 rounded-lg">
              <GitBranch className="w-8 h-8 text-[#066046]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interview Pipeline
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your interview process for active job postings
              </p>
            </div>
          </div>
          <div className="bg-white px-6 py-3 rounded-lg border border-gray-200 shadow-lg">
            <span className="text-sm font-medium text-gray-600">
              {totalJobs} Active Job
              {totalJobs !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job title, department, or interview template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No jobs found" : "No active jobs"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Create job postings to start managing interview pipelines"}
          </p>
          {!searchQuery && (
            <Link
              href="/create-job"
              className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-accent transition-colors"
            >
              Create Job
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <PipelineJobCard
                key={job.id}
                job={job}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalJobs}
              itemsPerPage={jobsPerPage}
              showInfo={true}
            />
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { withHiringAuth } from "@/components/auth/WithHiringAuth";
import { JobGrid } from "@/components/candidates/JobGrid";
import { useHiringAuth } from "@/hooks/useHiringAuth";
import { Job } from "@/interfaces";
import { jobService } from "@/services/jobService";
import { Briefcase, FileText, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
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
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors mb-8"
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

  // Load jobs on component mount
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
        // Use getAllJobs with "Active" status and companyId to filter for active jobs only
        const jobsData = await jobService.getAllJobs("Active", companyId);
        if (jobsData && Array.isArray(jobsData)) {
          const convertedJobs = jobsData.map((apiJob: any) => {
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
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [companyId, isAuthorized, authLoading]);

  // Return early if not authorized
  if (!isAuthorized) {
    return null;
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
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
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render - show job grid
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Candidates by Job
            </h1>
            <p className="text-gray-600 text-sm">
              Select a job to view and manage its candidates
            </p>
          </div>
          <div className="flex items-center space-x-3">
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
        <div className="flex-1 p-6 overflow-y-auto">
          <JobGrid jobs={jobs} showStats={true} />
        </div>
      )}
    </div>
  );
}

export default withHiringAuth(CandidatesPage);

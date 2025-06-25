import { useAuth } from "@/contexts/AuthContext";
import {
  Job,
  JobDuplicateRequest,
  JobStatusChangeRequest,
} from "@/interfaces/job";
import { candidateService } from "@/services/candidateService";
import { jobService } from "@/services/jobService";
import {
  Briefcase,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  MoreHorizontal, // Add Eye icon for view count
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DuplicateJobModal } from "./DuplicateJobModal";

interface JobCardProps {
  job: Job;
  showAnalytics?: boolean; // Whether to show detailed analytics for hiring users
  onJobUpdated?: () => void;
}

export function JobCard({
  job,
  showAnalytics = false,
  onJobUpdated,
}: JobCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [actualApplicantCount, setActualApplicantCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const { user } = useAuth();

  // Add this effect to get the actual applicant count
  useEffect(() => {
    const fetchApplicantCount = async () => {
      if (job?.id && user?.userCategory === "HiringUserProfile") {
        try {
          const candidates = await candidateService.getCandidatesForJob(job.id);
          setActualApplicantCount(candidates.length);
        } catch (error) {
          console.error(
            `Failed to fetch applicant count for job ${job.id}:`,
            error
          );
          // Fallback to the count from job data
          setActualApplicantCount(safeRenderNumber(job.applicants));
        }
      } else {
        // For non-hiring users, use the count from job data
        setActualApplicantCount(safeRenderNumber(job?.applicants || 0));
      }
    };

    fetchApplicantCount();
  }, [job, user]);

  // Set view count from job data
  useEffect(() => {
    // Extract view count from job data - job might have viewCount property
    const jobViewCount = (job as any).viewCount || (job as any).ViewCount || 0;
    setViewCount(safeRenderNumber(jobViewCount));
  }, [job]);

  // Enhanced safe rendering functions to handle .NET objects
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return "";

    // Handle .NET DateTime objects that might have ValueKind property
    if (typeof value === "object") {
      if (
        value.ValueKind !== undefined ||
        value.value !== undefined ||
        value.Value !== undefined
      ) {
        const dateStr = value.value || value.Value || value.toString();
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        } catch (e) {
          return "";
        }
        return "";
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map((item) => safeRender(item)).join(", ");
      }

      // Handle other objects - avoid rendering complex objects directly
      try {
        const str = JSON.stringify(value);
        if (str.length < 100) {
          return str;
        }
        return "[Complex Object]";
      } catch (e) {
        return "[Object]";
      }
    }

    return String(value);
  };

  const safeRenderNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;

    // Handle .NET numeric objects
    if (
      typeof value === "object" &&
      (value.value !== undefined || value.Value !== undefined)
    ) {
      const numValue = value.value || value.Value;
      const num = Number(numValue);
      return isNaN(num) ? 0 : num;
    }

    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const safeRenderArray = (value: any): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((item) => item != null);
    }
    return [];
  };

  const getStatusColor = (status: string) => {
    const safeStatus = safeRender(status);
    switch (safeStatus) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Paused":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    const safeType = safeRender(type);
    switch (safeType) {
      case "Full-Time":
        return "bg-blue-100 text-blue-800";
      case "Part-Time":
        return "bg-purple-100 text-purple-800";
      case "Contract":
        return "bg-orange-100 text-orange-800";
      case "Internship":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatSalary = (salary: any): string => {
    if (!salary || typeof salary !== "object") {
      return "Salary not specified";
    }

    const min = safeRenderNumber(salary.min);
    const max = safeRenderNumber(salary.max);
    const currency = safeRender(salary.currency) || "USD";
    const period = safeRender(salary.period) || "per year";

    const hasMin = min > 0;
    const hasMax = max > 0;

    if (hasMin && hasMax) {
      return `${currency} ${min.toLocaleString()} - ${currency} ${max.toLocaleString()} ${period}`;
    } else if (hasMin) {
      return `${currency} ${min.toLocaleString()}+ ${period}`;
    } else if (hasMax) {
      return `Up to ${currency} ${max.toLocaleString()} ${period}`;
    }

    return "Salary not specified";
  };

  const formatViewCount = (count: number): string => {
    if (count === 0) return "No views yet";
    if (count === 1) return "1 view";
    if (count < 1000) return `${count} views`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k views`;
    return `${(count / 1000000).toFixed(1)}M views`;
  };

  const getApplicationRate = (): number => {
    if (viewCount === 0) return 0;
    return Math.round((actualApplicantCount / viewCount) * 100);
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const request: JobStatusChangeRequest = {
        status: newStatus,
        reason: reason,
      };

      await jobService.changeJobStatus(job.id, request);

      // Show success notification
      console.log(`✅ Job status changed to ${newStatus}`);

      // Refresh job list
      onJobUpdated?.();

      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to change job status:", error);
      // Show error notification
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    window.location.href = `/jobs/${job.id}/edit`;
  };

  const handleDuplicate = async (request: JobDuplicateRequest) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await jobService.duplicateJob(job.id, request);

      console.log("✅ Job duplicated successfully");
      onJobUpdated?.();
      setShowDuplicateModal(false);
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to duplicate job:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isUpdating) return;

    if (
      !confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsUpdating(true);
    try {
      await jobService.deleteJob(job.id);
      console.log("✅ Job deleted successfully");
      onJobUpdated?.();
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Safely extract values
  const jobTitle = safeRender(job.title);
  const companyName = safeRender(job.company);
  const jobStatus = safeRender(job.status);
  const jobType = safeRender(job.type);
  const location = safeRender(job.location);
  const experience = safeRender(job.experience);
  const department = safeRender(job.department);
  const postedDate = safeRender(job.postedDate);
  const description = safeRender(job.description);
  const applicantCount = actualApplicantCount;
  const requirements = safeRenderArray(job.requirements);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left side - Job info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/jobs/${job.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 cursor-pointer">
                    {jobTitle}
                  </h3>
                </Link>
              </div>
              <p className="text-sm text-gray-600 font-medium">{companyName}</p>
            </div>

            {/* Status badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                jobStatus
              )}`}
            >
              {jobStatus}
            </span>
          </div>

          {/* Job details */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {location}
            </div>
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              {experience}
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatSalary(job.salary)}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Posted {postedDate}
            </div>
          </div>

          {/* Job type, department and stats */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                jobType
              )}`}
            >
              {jobType}
            </span>
            {department && department !== "Not specified" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {department}
              </span>
            )}

            {/* Applicants count */}
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
            </div>

            {/* View count - always show for hiring users, conditionally for others */}
            {(user?.userCategory === "HiringUserProfile" || viewCount > 0) && (
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="h-4 w-4 mr-1" />
                {formatViewCount(viewCount)}
              </div>
            )}

            {/* Application rate - only for hiring users with views */}
            {user?.userCategory === "HiringUserProfile" &&
              viewCount > 0 &&
              showAnalytics && (
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {getApplicationRate()}% rate
                </div>
              )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {description}
          </p>

          {/* Requirements */}
          <div className="flex flex-wrap gap-1">
            {requirements
              .filter((req) => req && typeof req === "string" && req.trim())
              .slice(0, 3)
              .map((req, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {safeRender(req)}
                </span>
              ))}
            {requirements.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{requirements.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="ml-6 flex flex-col gap-2 relative">
          <button
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleEdit}
          >
            Edit Job
          </button>

          <div className="relative">
            <button
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <MoreHorizontal className="h-4 w-4 mr-1" />
              More
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {/* Status Change Section */}
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                    Change Status
                  </div>

                  {job.status !== "Active" && (
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => handleStatusChange("Active")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "✅ Mark as Active"}
                    </button>
                  )}

                  {job.status === "Active" && (
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => handleStatusChange("Paused")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "⏸️ Pause Job"}
                    </button>
                  )}

                  {/* {job.status === "Paused" && (
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => handleStatusChange("Active")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "▶️ Resume Job"}
                    </button>
                  )} */}

                  {(job.status === "Active" || job.status === "Paused") && (
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => handleStatusChange("Closed")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "🔒 Close Job"}
                    </button>
                  )}

                  <div className="border-t">
                    {/* Job Actions Section */}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => setShowDuplicateModal(true)}
                      disabled={isUpdating}
                    >
                      📋 Duplicate Job
                    </button>

                    <Link
                      href={`/jobs/${job.id}/edit`}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ✏️ Edit Job
                    </Link>

                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      onClick={handleDelete}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Deleting..." : "🗑️ Delete Job"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <DuplicateJobModal
              isOpen={showDuplicateModal}
              onClose={() => setShowDuplicateModal(false)}
              onDuplicate={handleDuplicate}
              originalTitle={job.title}
              isLoading={isUpdating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Job } from "@/interfaces/job";
import {
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Clock,
  Eye,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface JobGridProps {
  jobs: Job[];
  onJobSelect?: (jobId: string) => void; // Make optional for backward compatibility
  showStats?: boolean;
}

export function JobGrid({
  jobs,
  onJobSelect,
  showStats = false,
}: JobGridProps) {
  const router = useRouter();
  const [hoveredJob, setHoveredJob] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9;

  // Calculate pagination
  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = jobs.slice(startIndex, endIndex);

  // Helper functions to safely render job data
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    return String(value);
  };

  // Format date to relative time
  const formatRelativeDate = (dateString?: string): string => {
    if (!dateString) {
      return "a day ago"; // Default fallback
    }

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return "today";
      } else if (diffDays === 1) {
        return "a day ago";
      } else if (diffDays <= 7) {
        return `${diffDays} days ago`;
      } else if (diffDays <= 14) {
        return "a week ago";
      } else if (diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? "a week ago" : `${weeks} weeks ago`;
      } else if (diffDays <= 60) {
        return "a month ago";
      } else {
        const months = Math.floor(diffDays / 30);
        return `${months} months ago`;
      }
    } catch (error) {
      return "a day ago"; // Fallback for invalid dates
    }
  };

  const formatSalary = (salary: any): string | null => {
    if (!salary || typeof salary !== "object") {
      return null;
    }

    const min = salary.min || 0;
    const max = salary.max || 0;
    const currency = safeRender(salary.currency) || "USD";
    const period = safeRender(salary.period) || "per year";

    const hasMin = min > 0;
    const hasMax = max > 0;

    if (hasMin && hasMax) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} ${period}`;
    } else if (hasMin) {
      return `${currency} ${min.toLocaleString()}+ ${period}`;
    } else if (hasMax) {
      return `Up to ${currency} ${max.toLocaleString()} ${period}`;
    }

    return null;
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      {/* Job Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {currentJobs.map((job) => {
          const isHovered = hoveredJob === job.id;

          return (
            <div
              key={job.id}
              className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-all duration-200 cursor-pointer ${
                isHovered
                  ? "border-blue-300 shadow-md transform scale-[1.01]"
                  : "border-gray-200"
              }`}
              onMouseEnter={() => setHoveredJob(job.id)}
              onMouseLeave={() => setHoveredJob(null)}
              onClick={() => {
                if (onJobSelect) {
                  onJobSelect(job.id);
                } else {
                  router.push(`/candidates/${job.id}`);
                }
              }}
            >
              {/* Fixed height container to ensure consistent alignment */}
              <div className="p-6 h-full flex flex-col">
                {/* Job Status Badge - Fixed height section */}
                <div className="flex justify-between items-start mb-3 h-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      safeRender(job.status)
                    )}`}
                  >
                    {safeRender(job.status) || "Active"}
                  </span>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                      safeRender(job.type)
                    )}`}
                  >
                    {safeRender(job.type) || "Full-Time"}
                  </span>
                </div>

                {/* Job Title - Fixed height section */}
                <div className="mb-4 h-14 flex items-start">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {safeRender(job.title)}
                  </h3>
                </div>

                {/* Job Details - Flexible height section */}
                <div className="text-sm mb-4 flex-grow">
                  {/* Show location only if available */}
                  {job.location && safeRender(job.location) && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {safeRender(job.location)}
                      </span>
                    </div>
                  )}

                  {/* Show salary only if available */}
                  {formatSalary(job.salary) && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {formatSalary(job.salary)}
                      </span>
                    </div>
                  )}

                  {/* Always show posted date */}
                  <div className="flex items-center text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      Posted {formatRelativeDate(job.postedDate)}
                    </span>
                  </div>

                  {/* Always show department */}
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {job.department && job.department !== "Not specified"
                        ? safeRender(job.department)
                        : "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Stats Section - Fixed height when shown */}
                {showStats && (
                  <div className="mb-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        <div>
                          <div className="text-lg font-semibold">
                            {job.applicants}
                          </div>
                          <div className="text-xs text-gray-500">
                            Candidates
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-green-500" />
                        <div>
                          <div className="text-lg font-semibold">
                            {job.viewCount}
                          </div>
                          <div className="text-xs text-gray-500">Views</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button - Fixed at bottom */}
                <div className="mt-auto">
                  <button
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      isHovered
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    View Candidates
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {currentJobs.length === 0 && (
          <div className="col-span-full flex items-center justify-center p-12 text-center">
            <div>
              <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">
                No active jobs found
              </h3>
              <p className="mt-2 text-gray-600 max-w-md mx-auto">
                Create a job posting to start receiving applications and
                managing candidates.
              </p>
              <button
                onClick={() => (window.location.href = "/create-job")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create a Job
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, jobs.length)}
                </span>{" "}
                of <span className="font-medium">{jobs.length}</span> jobs
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    currentPage === 1 ? "cursor-not-allowed" : ""
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and 2 pages around current page
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 2
                    );
                  })
                  .map((page, index, filteredPages) => {
                    // Add ellipsis if there's a gap
                    const showEllipsis =
                      index > 0 && page - filteredPages[index - 1] > 1;

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                              : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    currentPage === totalPages ? "cursor-not-allowed" : ""
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

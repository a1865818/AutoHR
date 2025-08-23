"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
} from "lucide-react";

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedAt: string;
  status: "applied" | "in_review" | "interview" | "offer" | "rejected";
  stage: "initial_review" | "interview" | "offer" | "rejected";
  lastUpdated: string;
  resumeUrl?: string;
  coverLetterText?: string;
  expectedSalary?: number;
  overallAiScore?: number;
}

interface ApplicationsSectionProps {
  applications: Application[];
  isLoading?: boolean;
}

export function ApplicationsSection({
  applications,
  isLoading = false,
}: ApplicationsSectionProps) {
  const [filteredApplications, setFilteredApplications] =
    useState<Application[]>(applications);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("appliedAt");

  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "appliedAt":
          return (
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          );
        case "status":
          return a.status.localeCompare(b.status);
        case "company":
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  }, [applications, statusFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "in_review":
        return "bg-yellow-100 text-yellow-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
      case "offer":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied":
        return <FileText className="h-4 w-4" />;
      case "in_review":
        return <Clock className="h-4 w-4" />;
      case "interview":
        return <Calendar className="h-4 w-4" />;
      case "offer":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const statusOptions = [
    { value: "all", label: "All Applications" },
    { value: "applied", label: "Applied" },
    { value: "in_review", label: "In Review" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "rejected", label: "Rejected" },
  ];

  const sortOptions = [
    { value: "appliedAt", label: "Date Applied" },
    { value: "status", label: "Status" },
    { value: "company", label: "Company" },
  ];

  const stats = {
    total: applications.length,
    applied: applications.filter((app) => app.status === "applied").length,
    inReview: applications.filter((app) => app.status === "in_review").length,
    interview: applications.filter((app) => app.status === "interview").length,
    offer: applications.filter((app) => app.status === "offer").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <FileText className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">My Applications</h3>
          <p className="text-sm text-gray-600">
            Track your job applications and their current status
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <div className="text-2xl font-bold text-blue-900">
              {stats.applied}
            </div>
            <div className="text-sm text-blue-600">Applied</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
            <div className="text-2xl font-bold text-yellow-900">
              {stats.inReview}
            </div>
            <div className="text-sm text-yellow-600">In Review</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
            <div className="text-2xl font-bold text-purple-900">
              {stats.interview}
            </div>
            <div className="text-sm text-purple-600">Interview</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div className="text-2xl font-bold text-green-900">
              {stats.offer}
            </div>
            <div className="text-sm text-green-600">Offer</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
            <div className="text-2xl font-bold text-red-900">
              {stats.rejected}
            </div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((application) => (
              <div
                key={application.id}
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {application.jobTitle}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusIcon(application.status)}
                        {application.status
                          .replace("_", " ")
                          .charAt(0)
                          .toUpperCase() +
                          application.status.replace("_", " ").slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 font-medium mb-1">
                      {application.company}
                    </p>
                    <p className="text-sm text-gray-500">
                      Applied {formatDate(application.appliedAt)} • Last updated{" "}
                      {formatTimeAgo(application.lastUpdated)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        window.open(`/jobs/${application.jobId}`, "_blank")
                      }
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View job posting"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Application Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {application.expectedSalary && (
                    <div>
                      <span className="text-gray-500">Expected Salary:</span>
                      <span className="ml-2 font-medium">
                        ${application.expectedSalary.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {application.overallAiScore && (
                    <div>
                      <span className="text-gray-500">AI Score:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(application.overallAiScore)}%
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Stage:</span>
                    <span className="ml-2 font-medium capitalize">
                      {application.stage.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Application Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {application.resumeUrl && (
                      <button
                        onClick={() =>
                          window.open(application.resumeUrl, "_blank")
                        }
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        View Resume
                      </button>
                    )}
                    {application.coverLetterText && (
                      <button
                        onClick={async () => {
                          const { toast } = await import("@/utils/toast");
                          toast.success("Opening cover letter");
                          window.open(
                            `data:text/plain;charset=utf-8,${encodeURIComponent(
                              application.coverLetterText
                            )}`,
                            "_blank"
                          );
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        View Cover Letter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === "all"
                  ? "No applications yet"
                  : "No applications with this status"}
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === "all"
                  ? "Start applying to jobs to track your applications here"
                  : "Try changing the status filter to see more applications"}
              </p>
              {statusFilter === "all" && (
                <button
                  onClick={() => (window.location.href = "/applicant/jobs")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Browse Jobs
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="text-sm font-medium text-indigo-900 mb-2">
            💡 Application Tips
          </h4>
          <ul className="text-xs text-indigo-800 space-y-1">
            <li>
              • Follow up on applications that have been in review for more than
              a week
            </li>
            <li>
              • Keep your resume and cover letter updated for each application
            </li>
            <li>
              • Track your application status to stay organized in your job
              search
            </li>
            <li>
              • Use the AI score to understand how well your profile matches job
              requirements
            </li>
            <li>
              • Consider reaching out to hiring managers for applications that
              are in review
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { ApplicationWithJobDetails } from "@/interfaces/api";
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
} from "lucide-react";
import Link from "next/link";

interface ApplicationCardProps {
  application: ApplicationWithJobDetails;
  onRefresh?: () => void;
}

export default function ApplicationCard({
  application,
  onRefresh,
}: ApplicationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
      case "submitted":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-200",
        };
      case "initial_review":
      case "under_review":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-200",
        };
      case "interview":
      case "interviewing":
        return {
          bg: "bg-purple-100",
          text: "text-purple-800",
          border: "border-purple-200",
        };
      case "offer":
      case "accepted":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200",
        };
      case "rejected":
      case "declined":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-200",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
      case "submitted":
        return <FileText className="h-4 w-4" />;
      case "initial_review":
      case "under_review":
        return <Clock className="h-4 w-4" />;
      case "interview":
      case "interviewing":
        return <Phone className="h-4 w-4" />;
      case "offer":
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
      case "declined":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return "Application Submitted";
      case "initial_review":
        return "Under Review";
      case "interview":
        return "Interview Stage";
      case "offer":
        return "Offer Received";
      case "rejected":
        return "Not Selected";
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatSalary = (salary: any) => {
    if (!salary || (!salary.min && !salary.max)) return null;

    const min = salary.min || 0;
    const max = salary.max || 0;
    const currency = salary.currency || "USD";

    if (min && max && min !== max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    } else if (max) {
      return `${currency} ${max.toLocaleString()}`;
    } else if (min) {
      return `${currency} ${min.toLocaleString()}`;
    }

    return null;
  };

  const statusColors = getStatusColor(application.status || "");
  const salaryText = formatSalary(application.job?.salary);

  return (
    <div className="w-full max-w-none bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
      <div className="p-6 w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 break-words">
              {application.job?.title || "Unknown Position"}
            </h3>
            <div className="flex items-center text-gray-600 mb-2">
              <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="font-medium truncate">
                {application.job?.company || "Unknown Company"}
              </span>
            </div>
            <div className="flex items-center text-gray-500 text-sm flex-wrap gap-1">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {application.job?.location || "Unknown Location"}
                </span>
              </div>
              {application.job?.employmentType && (
                <div className="flex items-center">
                  <span className="mx-2">•</span>
                  <span className="whitespace-nowrap">
                    {application.job.employmentType}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
          >
            {getStatusIcon(application.status || "")}
            <span className="ml-2 whitespace-nowrap">
              {formatStatusText(application.status || "")}
            </span>
          </div>
        </div>

        {/* Details Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="whitespace-nowrap">
              Applied {formatDate(application.appliedAt)}
            </span>
          </div>
          {salaryText && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">{salaryText}</span>
            </div>
          )}
          {application.job?.status && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">
                Job {application.job.status}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {showDetails ? "Hide Details" : "View Details"}
            </span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4 ml-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0" />
            )}
          </button>

          <div className="flex items-center space-x-3">
            {application.jobId && (
              <Link
                href={`/applicant/jobs/${application.jobId}`}
                className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                View Job
              </Link>
            )}
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {/* Application Details */}
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Application Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">
                      Application ID:
                    </span>
                    <span className="font-mono text-xs break-all">
                      {application.id}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className="text-right">
                      {formatStatusText(application.status || "")}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">Stage:</span>
                    <span className="text-right">
                      {typeof application.stage === "object"
                        ? JSON.stringify(application.stage)
                        : application.stage || "Not specified"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">Applied:</span>
                    <span className="text-right">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {application.statusChangedAt &&
                    application.statusChangedAt !== application.appliedAt && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600 font-medium">
                          Last Update:
                        </span>
                        <span className="text-right">
                          {new Date(
                            application.statusChangedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  {application.expectedSalary && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-gray-600 font-medium">
                        Expected Salary:
                      </span>
                      <span className="text-right">
                        USD {application.expectedSalary.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {application.availabilityDate && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-gray-600 font-medium">
                        Available From:
                      </span>
                      <span className="text-right">
                        {new Date(
                          application.availabilityDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Details */}
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Job Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">Position:</span>
                    <span className="text-right break-words">
                      {application.job?.title || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">Company:</span>
                    <span className="text-right break-words">
                      {application.job?.company || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">Location:</span>
                    <span className="text-right break-words">
                      {application.job?.location || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">Type:</span>
                    <span className="text-right">
                      {application.job?.employmentType || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">
                      Department:
                    </span>
                    <span className="text-right">
                      {application.job?.department || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 font-medium">
                      Job Status:
                    </span>
                    <span className="text-right">
                      {typeof application.job?.status === "object"
                        ? JSON.stringify(application.job?.status)
                        : application.job?.status || "N/A"}
                    </span>
                  </div>
                  {salaryText && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-gray-600 font-medium">
                        Salary Range:
                      </span>
                      <span className="text-right">{salaryText}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Documents */}
            {application.resumeUrl && (
              <div className="mt-6 pt-6 border-t border-gray-200 w-full">
                <h4 className="font-semibold text-gray-900 mb-3">Documents</h4>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <a
                    href={application.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline break-all"
                  >
                    View Resume
                  </a>
                </div>
              </div>
            )}

            {/* Cover Letter */}
            {application.coverLetterText && (
              <div className="mt-6 pt-6 border-t border-gray-200 w-full">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Cover Letter
                </h4>
                {/* Detect and pretty-print metadata if present */}
                {(() => {
                  // Use a non-greedy match for metadata block (without 's' flag for compatibility)
                  const metaMatch = application.coverLetterText.match(/\[APPLICATION_METADATA\]([\s\S]*?)\[\/APPLICATION_METADATA\]/);
                  if (metaMatch) {
                    let metaObj = null;
                    try {
                      metaObj = JSON.parse(metaMatch[1]);
                    } catch {
                      // ignore JSON parse error
                    }
                    return (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">Application Metadata</div>
                        <pre className="bg-gray-100 rounded p-4 text-xs text-gray-800 overflow-x-auto max-h-60 whitespace-pre-wrap">
                          {metaObj
                            ? JSON.stringify(metaObj, null, 2)
                            : metaMatch[1]}
                        </pre>
                      </div>
                    );
                  }
                  // Otherwise, render as normal paragraphs
                  return (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-40 overflow-y-auto w-full break-words">
                      {application.coverLetterText
                        .split("\n")
                        .map((paragraph, index) => (
                          <p key={index} className="mb-2 last:mb-0 break-words">
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

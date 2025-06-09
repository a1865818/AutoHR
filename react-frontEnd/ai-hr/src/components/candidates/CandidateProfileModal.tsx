import { CandidateWithJobDetails } from "@/interfaces";
import {
  Calendar,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  X,
  ExternalLink,
  Briefcase,
  Clock,
  Star,
  Download,
} from "lucide-react";

interface CandidateProfileModalProps {
  isOpen: boolean;
  candidate: CandidateWithJobDetails | null;
  onClose: () => void;
}

export function CandidateProfileModal({
  isOpen,
  candidate,
  onClose,
}: CandidateProfileModalProps) {
  if (!isOpen || !candidate) return null;

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "interview":
        return "bg-yellow-100 text-yellow-800";
      case "offer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "hired":
        return "bg-green-100 text-green-800";
      case "disqualified":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return "Not specified";
    return `$${salary.toLocaleString()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getDaysAgo = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                <img
                  src={
                    candidate.photo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      candidate.name
                    )}&size=64&background=e5e7eb&color=374151&rounded=true`
                  }
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {candidate.name}
                </h2>
                <p className="text-gray-600">{candidate.email}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageColor(
                      candidate.stage
                    )}`}
                  >
                    {candidate.stage}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      candidate.status
                    )}`}
                  >
                    {candidate.status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ maxHeight: "calc(90vh - 140px)" }}
          >
            <div className="p-6 space-y-8">
              {/* Assessment Score */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    Assessment Score
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {candidate.assessment}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${candidate.assessment}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Based on qualifications, experience, and application quality
                </p>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Application Details
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Applied</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(candidate.appliedAt)} (
                          {getDaysAgo(candidate.appliedAt)})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Position</p>
                        <p className="font-medium text-gray-900">
                          {candidate.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <a
                          href={`mailto:${candidate.email}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {candidate.email}
                        </a>
                      </div>
                    </div>

                    {candidate.jobSource && (
                      <div className="flex items-center">
                        <ExternalLink className="h-5 w-5 mr-3 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Source</p>
                          <p className="font-medium text-gray-900 capitalize">
                            {candidate.jobSource.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Candidate Preferences
                  </h3>

                  <div className="space-y-3">
                    {candidate.expectedSalary && (
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-3 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">
                            Expected Salary
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatSalary(candidate.expectedSalary)}
                          </p>
                        </div>
                      </div>
                    )}

                    {candidate.availabilityDate && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">
                            Available From
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatDate(candidate.availabilityDate)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">
                          {candidate.jobLocationType || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Employment Type</p>
                        <p className="font-medium text-gray-900">
                          {candidate.jobEmploymentType || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              {candidate.coverLetterText && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                    Cover Letter
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {candidate.coverLetterText}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {candidate.overallAiScore && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                    AI Analysis
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        Overall Match Score
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {Math.round(candidate.overallAiScore)}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${candidate.overallAiScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Documents & Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  {candidate.resumeUrl && (
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Resume
                    </a>
                  )}
                  <a
                    href={`mailto:${candidate.email}`}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                  <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Export Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Application ID: {candidate.applicationId}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                Take Action
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

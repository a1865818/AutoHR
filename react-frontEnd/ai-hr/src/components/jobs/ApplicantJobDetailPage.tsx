"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useApplicantJob } from "@/hooks/useJobs";
import { ApiJob } from "@/interfaces";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Send,
  Share2,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface ApplicantJobDetailPageProps {
  jobId: string;
}

export function ApplicantJobDetailPage({ jobId }: ApplicantJobDetailPageProps) {
  const { job, company, isLoading, error, refreshJob } = useApplicantJob(jobId);
  const { user } = useAuth();

  // Enhanced safe rendering function to handle .NET objects with ValueKind
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

      if (Array.isArray(value)) {
        return value.map((item) => safeRender(item)).join(", ");
      }

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

  // Safe number rendering function
  const safeRenderNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;

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

  // Safe array rendering function
  const safeRenderArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .filter((item) => item != null)
        .map((item) => safeRender(item));
    }
    return [];
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "open":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "paused":
        return <XCircle className="h-4 w-4 text-yellow-600" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "open":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "full-time":
        return "bg-blue-100 text-blue-800";
      case "part-time":
        return "bg-purple-100 text-purple-800";
      case "contract":
        return "bg-orange-100 text-orange-800";
      case "internship":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "";

    try {
      let dateStr = dateValue;

      if (typeof dateValue === "object") {
        dateStr = dateValue.value || dateValue.Value || dateValue.toString();
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  const getDaysAgo = (dateValue: any): string => {
    if (!dateValue) return "";

    try {
      let dateStr = dateValue;

      if (typeof dateValue === "object") {
        dateStr = dateValue.value || dateValue.Value || dateValue.toString();
      }

      const posted = new Date(dateStr);
      if (isNaN(posted.getTime())) return "";

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - posted.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 14) return "1 week ago";
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch (e) {
      return "";
    }
  };

  const formatSalary = (job: ApiJob) => {
    if (!job) return "Salary not specified";

    const salaryMin = safeRenderNumber(job.salaryMin);
    const salaryMax = safeRenderNumber(job.salaryMax);
    const currency = safeRender(job.salaryCurrency) || "USD";

    if (!salaryMin && !salaryMax) return "Salary not specified";

    const formatNumber = (num: number) => num.toLocaleString();

    if (salaryMin && salaryMax) {
      return `${currency} ${formatNumber(
        salaryMin
      )} - ${currency} ${formatNumber(salaryMax)} per year`;
    } else if (salaryMin) {
      return `${currency} ${formatNumber(salaryMin)}+ per year`;
    } else if (salaryMax) {
      return `Up to ${currency} ${formatNumber(salaryMax)} per year`;
    }

    return "Salary not specified";
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
        return "Location not specified";
      } else {
        return extractFromLocationObject(locations);
      }
    }

    return "Location not specified";
  };

  const extractFromLocationObject = (location: any): string => {
    if (!location) return "Location not specified";

    const city = safeRender(location.city);
    const state = safeRender(location.state);

    if (city && state) {
      return `${city}, ${state}`;
    }

    return (
      safeRender(location.address) ||
      safeRender(location.description) ||
      safeRender(location.name) ||
      safeRender(location.location) ||
      "Location not specified"
    );
  };

  const formatExperience = (seniorityLevel: any, minYears?: any): string => {
    const minYearsNum = safeRenderNumber(minYears);

    if (minYearsNum > 0) {
      if (minYearsNum <= 2) return "0-2 Years";
      if (minYearsNum <= 5) return "2-5 Years";
      return "5+ Years";
    }

    const level = safeRender(seniorityLevel);
    if (!level) return "Experience level not specified";

    switch (level.toLowerCase()) {
      case "junior":
        return "0-2 Years";
      case "mid":
        return "2-5 Years";
      case "senior":
        return "5+ Years";
      default:
        return "Experience level not specified";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Unable to Load Job
            </h2>
            <p className="text-red-700 mb-4">
              {safeRender(error) || "Job not found or is no longer available"}
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={refreshJob}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/applicant/jobs"
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safely extract job data
  const jobTitle = safeRender(job.title);
  const jobStatus = safeRender(job.status);
  const jobEmploymentType = safeRender(job.employmentType);
  const jobDescription = safeRender(job.description);
  const jobResponsibilities = safeRenderArray(job.responsibilities);
  const jobRequirements = safeRenderArray(job.requirements);
  const jobQualifications = safeRenderArray(job.qualifications);
  const jobBenefits = safeRenderArray(job.benefits);
  const companyName = safeRender(company?.name) || "Company";
  const applicantCount = safeRenderNumber(job.applicantCount);
  const viewCount = safeRenderNumber(job.viewCount);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/applicant/jobs"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{jobTitle}</h1>
                <p className="text-lg text-gray-600">{companyName}</p>
              </div>
            </div>

            {/* Apply Button - Prominent for applicants */}
            {user?.userCategory === "ApplicationUser" && (
              <div className="flex space-x-3">
                <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                <Link
                  href={`/applicant/jobs/${jobId}/apply`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Apply for This Job
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Info Card */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(jobStatus)}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      jobStatus
                    )}`}
                  >
                    {jobStatus}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                      jobEmploymentType
                    )}`}
                  >
                    {jobEmploymentType}
                  </span>
                  {job.department && job.department !== "Not specified" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {safeRender(job.department)}
                    </span>
                  )}
                </div>
              </div>

              {/* Job Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{extractLocationString(job.locations)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>
                    {formatExperience(
                      job.seniorityLevel,
                      job.experienceYearsMin
                    )}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>{formatSalary(job)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Posted {getDaysAgo(job.postedDate || job.createdAt)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Job Description
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {jobDescription}
                </p>
              </div>

              {/* Responsibilities */}
              {jobResponsibilities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Key Responsibilities
                  </h3>
                  <ul className="space-y-2">
                    {jobResponsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {jobRequirements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {jobRequirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Qualifications */}
              {jobQualifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Preferred Qualifications
                  </h3>
                  <ul className="space-y-2">
                    {jobQualifications.map((qualification, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{qualification}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {jobBenefits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Benefits & Perks
                  </h3>
                  <ul className="space-y-2">
                    {jobBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Apply Card */}
            {user?.userCategory === "ApplicationUser" && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ready to Apply?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Join {applicantCount} other applicants who have already
                  applied for this position.
                </p>
                <Link
                  href={`/applicant/jobs/${jobId}/apply`}
                  className="block w-full text-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mb-3"
                >
                  Apply Now
                </Link>
                <button className="w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Save Job
                </button>
              </div>
            )}

            {/* Job Stats */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Job Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Applications</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {applicantCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {viewCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Days Active</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {job.postedDate || job.createdAt
                      ? (() => {
                          try {
                            const dateValue = job.postedDate || job.createdAt;
                            let dateStr: string;

                            if (
                              typeof dateValue === "object" &&
                              dateValue !== null
                            ) {
                              const objValue = dateValue as any;
                              dateStr =
                                objValue.value ||
                                objValue.Value ||
                                String(dateValue);
                            } else {
                              dateStr = String(dateValue);
                            }

                            const posted = new Date(dateStr);
                            if (isNaN(posted.getTime())) return 0;
                            return Math.ceil(
                              (new Date().getTime() - posted.getTime()) /
                                (1000 * 60 * 60 * 24)
                            );
                          } catch (e) {
                            return 0;
                          }
                        })()
                      : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Info */}
            {company && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  About {companyName}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Building2 className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Company: </span>
                      <span className="font-medium text-gray-900">
                        {safeRender(company.name)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Company Size: </span>
                      <span className="font-medium text-gray-900">
                        {safeRender(company.companySize)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Industry: </span>
                      <span className="font-medium text-gray-900">
                        {safeRender(company.industry)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Job Timing */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Important Dates
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Posted: </span>
                    <span className="font-medium text-gray-900">
                      {formatDate(job.postedDate || job.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Active for: </span>
                    <span className="font-medium text-gray-900">
                      {getDaysAgo(job.postedDate || job.createdAt)}
                    </span>
                  </div>
                </div>
                {job.applicationDeadline && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Deadline: </span>
                      <span className="font-medium text-gray-900">
                        {formatDate(job.applicationDeadline)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

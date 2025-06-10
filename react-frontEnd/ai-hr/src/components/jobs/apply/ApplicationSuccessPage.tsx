"use client";

import { ApplicationDetailResponse } from "@/interfaces";
import { applicationService } from "@/services/applyService";
import { jobService } from "@/services/jobService";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ApplicationSuccessPageProps {
  jobId: string;
  applicationId?: string;
}

export function ApplicationSuccessPage({
  jobId,
  applicationId: propApplicationId,
}: ApplicationSuccessPageProps) {
  const searchParams = useSearchParams();
  const applicationId = propApplicationId || searchParams.get("applicationId");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationDetailResponse | null>(null);
  const [jobData, setJobData] = useState<any>(null);

  useEffect(() => {
    loadApplicationData();
  }, [applicationId, jobId]);

  const loadApplicationData = async () => {
    try {
      // If we have applicationId, try to load the application details
      if (applicationId) {
        try {
          const appStatus = await applicationService.getApplicationStatus(
            applicationId
          );
          setApplicationStatus(appStatus);
        } catch (error) {
          console.warn("Could not load application status:", error);
          // Continue without application status - maybe it's a newly created application
        }
      }

      // Load job data
      const job = await jobService.getJobById(jobId);
      setJobData(job);
    } catch (error) {
      console.error("Error loading application data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load application data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "initial_review":
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
    switch (status?.toLowerCase()) {
      case "applied":
        return <FileText className="h-5 w-5" />;
      case "initial_review":
        return <Calendar className="h-5 w-5" />;
      case "interview":
        return <Phone className="h-5 w-5" />;
      case "offer":
        return <CheckCircle className="h-5 w-5" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return "Application Submitted";
      case "initial_review":
        return "Under Review";
      case "interview":
        return "Interview Scheduled";
      case "offer":
        return "Congratulations! You've received an offer";
      case "rejected":
        return "Application Not Selected";
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Application Submitted";
    }
  };

  const getNextSteps = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return [
          "We've received your application and will review it shortly",
          "You'll receive an email confirmation within 24 hours",
          "If selected, we'll contact you within 1-2 weeks for next steps",
        ];
      case "initial_review":
        return [
          "Your application is currently being reviewed by our team",
          "We'll update you on the status within 3-5 business days",
          "Make sure to check your email regularly for updates",
        ];
      case "interview":
        return [
          "Congratulations! We'd like to schedule an interview",
          "Check your email for interview details and scheduling links",
          "Prepare by researching our company and the role",
        ];
      case "offer":
        return [
          "Congratulations on your successful application!",
          "Check your email for next steps and onboarding information",
          "We're excited to have you join our team",
        ];
      case "rejected":
        return [
          "Thank you for your interest in this position",
          "While this role wasn't a match, we encourage you to apply for other positions",
          "We'll keep your profile on file for future opportunities",
        ];
      default:
        return [
          "We've received your application and will review it shortly",
          "You'll receive an email confirmation within 24 hours",
          "If selected, we'll contact you within 1-2 weeks for next steps",
        ];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error && !jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Application
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/applicant/jobs"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayStatus = applicationStatus?.status || "applied";
  const submittedDate =
    applicationStatus?.appliedAt || new Date().toISOString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formatStatusText(displayStatus)}
            </h1>
            <p className="text-gray-600">
              Application ID:{" "}
              <span className="font-mono text-sm">
                {applicationId || `app_${Date.now()}`}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Application Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Application Status
                </h2>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    displayStatus
                  )}`}
                >
                  {getStatusIcon(displayStatus)}
                  <span className="ml-2">
                    {formatStatusText(displayStatus)}
                  </span>
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Submitted on{" "}
                    {new Date(submittedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {applicationStatus?.statusChangedAt &&
                  applicationStatus.statusChangedAt !==
                    applicationStatus.appliedAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Last updated on{" "}
                        {new Date(
                          applicationStatus.statusChangedAt
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                {applicationStatus?.coverLetterText && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">
                      Your Cover Letter:
                    </h3>
                    <div className="text-blue-800 text-sm max-h-32 overflow-y-auto">
                      {
                        applicationStatus.coverLetterText.split(
                          "\n\n[APPLICATION_METADATA]"
                        )[0]
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                What is Next?
              </h2>
              <div className="space-y-3">
                {getNextSteps(displayStatus).map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Application Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-green-500 rounded-full w-3 h-3 mr-4"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Application Submitted
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {displayStatus !== "applied" && (
                  <div className="flex items-center">
                    <div className="bg-blue-500 rounded-full w-3 h-3 mr-4"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Application Under Review
                      </p>
                      <p className="text-sm text-gray-600">
                        {applicationStatus?.statusChangedAt
                          ? new Date(
                              applicationStatus.statusChangedAt
                            ).toLocaleDateString()
                          : "In progress"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <div className="bg-gray-300 rounded-full w-3 h-3 mr-4"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-500">
                      Interview Process
                    </p>
                    <p className="text-sm text-gray-400">Pending</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-gray-300 rounded-full w-3 h-3 mr-4"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-500">Final Decision</p>
                    <p className="text-sm text-gray-400">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details */}
            {jobData && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Job Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Building2 className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {jobData.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Company ID: {jobData.companyId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <p className="text-sm text-gray-600">
                      {typeof jobData.locations === "object"
                        ? `${jobData.locations.city || ""}, ${
                            jobData.locations.state || ""
                          }`.trim()
                        : "Location not specified"}
                    </p>
                  </div>

                  <div className="pt-3 border-t">
                    <Link
                      href={`/applicant/jobs/${jobId}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Job Details
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Email Support
                    </p>
                    <a
                      href="mailto:careers@company.com"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      careers@company.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Phone Support
                    </p>
                    <a
                      href="tel:+1-555-0123"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      +1 (555) 012-3456
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/applications"
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                >
                  View All Applications
                </Link>

                <Link
                  href="/applicant/jobs"
                  className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm font-medium"
                >
                  Browse More Jobs
                </Link>

                <Link
                  href="/profile"
                  className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm font-medium"
                >
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Thank You!
            </h3>
            <p className="text-blue-800">
              We appreciate your interest in joining our team. We will be in
              touch soon with updates about your application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

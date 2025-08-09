"use client";

import { ApplicationDetailResponse } from "@/interfaces";
import { applicationService } from "@/services/applyService";
import { jobService } from "@/services/jobService";
import { interviewService } from "@/services/interviewService";
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
  Upload,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TechnicalAssessmentUpload } from "./TechnicalAssessmentUpload";
import { CodingChallengeSubmission } from "./CodingChallengeSubmission";
import { InterviewPipelineTimeline } from "./InterviewPipelineTimeline";
import { InterviewRound as ApiInterviewRound } from "@/interfaces/api";
import { InterviewRound } from "@/interfaces/interview";
import { storageBucketService } from "@/services/storageBucketService";

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
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationDetailResponse | null>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>([]);
  const [technicalAssessment, setTechnicalAssessment] = useState<{
    url: string;
    fileName: string;
    uploadedAt: string;
  } | null>(null);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Helper function to convert API InterviewRound to component InterviewRound
  const mapApiRoundToComponentRound = (
    apiRound: ApiInterviewRound
  ): InterviewRound => {
    return {
      id: apiRound.id,
      name: apiRound.name,
      type: apiRound.type as any, // Cast to InterviewType
      duration: apiRound.estimatedDuration || 30,
      roundOrder: apiRound.roundOrder,
      requirements: [], // API doesn't provide this
      interviewers: [], // API doesn't provide this
      isOptional: !apiRound.isRequired,
      passingCriteria: 70, // Default value
      description: apiRound.description,
    };
  };

  // Function to refresh application data
  const refreshApplicationData = useCallback(async () => {
    console.log("🔄 Refreshing application data...");
    setLastRefreshTime(new Date());

    // Store previous status for comparison
    const previousStatus = applicationStatus?.status;
    const previousStage = applicationStatus?.stage;

    await loadApplicationData();

    // Check if status changed and show notification
    if (
      applicationStatus &&
      (previousStatus !== applicationStatus.status ||
        previousStage !== applicationStatus.stage)
    ) {
      console.log("✅ Application status updated:", {
        previousStatus,
        newStatus: applicationStatus.status,
        previousStage,
        newStage: applicationStatus.stage,
      });
    }
  }, [applicationStatus]);

  useEffect(() => {
    loadApplicationData();
  }, [applicationId, jobId]);

  // Auto-refresh every 30 seconds to keep timeline updated
  useEffect(() => {
    if (!applicationId) return;

    const interval = setInterval(() => {
      refreshApplicationData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [applicationId, refreshApplicationData]);

  const loadApplicationData = async () => {
    try {
      // Keep a local reference to the freshest status fetched in this call
      let latestStatus: ApplicationDetailResponse | null = applicationStatus;
      // If we have applicationId, try to load the application details
      if (applicationId) {
        try {
          const appStatus = await applicationService.getApplicationStatus(
            applicationId
          );
          setApplicationStatus(appStatus);
          latestStatus = appStatus;
        } catch (error) {
          console.warn("Could not load application status:", error);
          // Continue without application status - maybe it's a newly created application
        }
      }

      // Load job data
      const job = await jobService.getJobById(jobId);
      console.log("job:", job.interviewTemplateId);
      setJobData(job);

      // Load interview template and rounds if available
      let technicalRoundId = null;
      if (job.interviewTemplateId) {
        try {
          const template = job.interviewTemplate;
          console.log("template:", template);
          if (template && template.rounds) {
            const sortedRounds = template.rounds.sort(
              (a, b) => a.roundOrder - b.roundOrder
            );
            const mappedRounds = sortedRounds.map(mapApiRoundToComponentRound);
            setInterviewRounds(mappedRounds);

            // Set current round ID based on the LATEST fetched application stage
            let currentRound = null;

            // If we have application status (latest for this load), try to find the current round based on stage
            if (latestStatus?.stage) {
              const stageLower = latestStatus.stage.toLowerCase();
              if (
                stageLower.includes("technical") ||
                stageLower.includes("assessment")
              ) {
                currentRound = sortedRounds.find(
                  (round) => round.type === "technical_assessment"
                );
              } else if (
                stageLower.includes("coding") ||
                stageLower.includes("challenge")
              ) {
                currentRound = sortedRounds.find(
                  (round) => round.type === "coding_challenge"
                );
              }
            }

            // If no specific round found, find the first technical or coding round
            if (!currentRound) {
              currentRound = sortedRounds.find(
                (round) =>
                  round.type === "technical_assessment" ||
                  round.type === "coding_challenge"
              );
            }

            if (currentRound) {
              technicalRoundId = currentRound.id;
              setCurrentRoundId(currentRound.id);
            }
          }
        } catch (error) {
          console.warn("Could not load interview template:", error);
        }
      }

      // Load technical assessment if application exists and we have round info
      if (applicationId && technicalRoundId && user?.id) {
        try {
          const assessment = await applicationService.getTechnicalAssessment(
            user.id,
            technicalRoundId
          );
          if (assessment && assessment.url) {
            setTechnicalAssessment(assessment);
          } else {
            setTechnicalAssessment(null);
          }
        } catch (error) {
          console.warn("Could not load technical assessment:", error);
          setTechnicalAssessment(null);
        }
      }
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

  // Keep currentRoundId in sync when status or rounds change (e.g., after reloads)
  useEffect(() => {
    if (!interviewRounds || interviewRounds.length === 0) return;

    let resolvedCurrentRound: InterviewRound | undefined;
    const stageLower = applicationStatus?.stage?.toLowerCase() || "";

    if (stageLower) {
      if (stageLower.includes("coding") || stageLower.includes("challenge")) {
        resolvedCurrentRound = interviewRounds.find(
          (r) => r.type === "coding_challenge"
        );
      } else if (
        stageLower.includes("technical") ||
        stageLower.includes("assessment")
      ) {
        resolvedCurrentRound = interviewRounds.find(
          (r) => r.type === "technical_assessment"
        );
      }
    }

    if (!resolvedCurrentRound) {
      // Fallback: first technical/coding round if stage is not informative
      resolvedCurrentRound = interviewRounds.find(
        (r) =>
          r.type === "technical_assessment" || r.type === "coding_challenge"
      );
    }

    if (resolvedCurrentRound && resolvedCurrentRound.id !== currentRoundId) {
      setCurrentRoundId(resolvedCurrentRound.id);
    }
  }, [applicationStatus?.stage, interviewRounds]);

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

  // Show error banner but continue with page if we have basic data
  const showErrorBanner = error && jobData;

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

      {/* Error Banner */}
      {showErrorBanner && (
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">
                  Some data couldn't be loaded
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {error} - The timeline below shows available information.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Application Timeline */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Application Timeline
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </span>
                  <button
                    onClick={refreshApplicationData}
                    disabled={isLoading}
                    className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    <svg
                      className={`h-4 w-4 mr-1 ${
                        isLoading ? "animate-spin" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
              <InterviewPipelineTimeline
                rounds={interviewRounds}
                currentStage={applicationStatus?.stage}
                applicationStatus={displayStatus}
                appliedDate={submittedDate}
                statusChangedAt={applicationStatus?.statusChangedAt}
              />
            </div>

            {/* Technical Assessment Upload */}
            {currentRoundId &&
              user?.id &&
              (() => {
                const currentRound = interviewRounds.find(
                  (round) => round.id === currentRoundId
                );
                if (currentRound?.type === "technical_assessment") {
                  return (
                    <TechnicalAssessmentUpload
                      candidateId={user.id}
                      roundId={currentRoundId}
                      jobId={jobId}
                      existingAssessment={technicalAssessment || undefined}
                      onUploadSuccess={async (fileUrl, fileName) => {
                        // Refetch the latest assessment from backend after upload
                        try {
                          const assessment =
                            await applicationService.getTechnicalAssessment(
                              user.id,
                              currentRoundId
                            );
                          if (assessment) {
                            setTechnicalAssessment(assessment);
                          } else {
                            setTechnicalAssessment({
                              url: fileUrl,
                              fileName,
                              uploadedAt: new Date().toISOString(),
                            });
                          }
                        } catch (err) {
                          // fallback to local
                          setTechnicalAssessment({
                            url: fileUrl,
                            fileName,
                            uploadedAt: new Date().toISOString(),
                          });
                        }
                      }}
                      onUploadError={(error) => {
                        console.error("Assessment upload failed:", error);
                      }}
                    />
                  );
                }
                return null;
              })()}

            {/* Coding Challenge Submission */}
            {currentRoundId &&
              user?.id &&
              (() => {
                const currentRound = interviewRounds.find(
                  (round) => round.id === currentRoundId
                );
                if (currentRound?.type === "coding_challenge") {
                  return (
                    <CodingChallengeSubmission
                      candidateId={user.id}
                      roundId={currentRoundId}
                      jobId={jobId}
                      onSubmissionSuccess={(submissionData) => {
                        console.log(
                          "Coding challenge submitted successfully:",
                          submissionData
                        );
                        // You can add additional success handling here
                      }}
                      onSubmissionError={(error) => {
                        console.error(
                          "Coding challenge submission failed:",
                          error
                        );
                        // You can add additional error handling here
                      }}
                    />
                  );
                }
                return null;
              })()}
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

        {/* Footer Message removed as requested */}
      </div>
    </div>
  );
}

import React from "react";

interface DownloadTechnicalAssessmentButtonProps {
  fileUrl: string;
  fileName: string;
}

const BUCKET_NAME = process.env.NEXT_PUBLIC_BUCKET_NAME || "resume-storage";

function extractFileNameFromUrl(url: string): string {
  // Try to extract the file name from the URL (works for /bucket/file or signed URLs)
  try {
    const urlObj = new URL(url, window.location.origin);
    const pathParts = urlObj.pathname.split("/");
    return pathParts[pathParts.length - 1];
  } catch {
    // fallback: just return the input
    return url;
  }
}

export function DownloadTechnicalAssessmentButton({
  fileUrl,
  fileName,
}: DownloadTechnicalAssessmentButtonProps) {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Try to extract bucket and file name from the URL if possible
      // If not, fallback to defaults
      let bucket = BUCKET_NAME;
      let file = fileName;
      try {
        const urlObj = new URL(fileUrl, window.location.origin);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length >= 2) {
          bucket = pathParts[pathParts.length - 2];
          file = pathParts[pathParts.length - 1];
        } else {
          file = extractFileNameFromUrl(fileUrl);
        }
      } catch {
        // fallback to provided values
      }
      const blob = await storageBucketService.downloadFile(bucket, file);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60"
      onClick={handleDownload}
      disabled={downloading}
    >
      <Download className="h-4 w-4 mr-2" />
      {downloading ? "Downloading..." : `Download Assessment (${fileName})`}
    </button>
  );
}

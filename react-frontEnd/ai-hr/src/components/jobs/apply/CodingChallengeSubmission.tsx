"use client";

import React, { useState, useEffect } from "react";
import {
  Code,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Globe,
  Github,
  FileText,
  Upload,
} from "lucide-react";
import { OfflineCodingSubmission } from "@/components/interview_pipeline/submissions/OfflineCodingSubmission";
import { useAssessmentSubmission } from "@/hooks/useAssessmentSubmission";
import { assessmentService } from "@/services/assessmentService";
import { useRoundConfiguration } from "@/hooks/useRoundConfiguration";

interface CodingChallengeConfiguration {
  name: string;
  mode: "online" | "offline";
  externalPlatform?: {
    platform: string;
    testLink?: string;
    testId?: string;
    additionalInstructions?: string;
  };
  offlineChallenge?: {
    projectDescription: string;
    requirements: string[];
    deliverables: string[];
    evaluationCriteria: string | string[];
    allowedTechnologies?: string[];
    submissionInstructions: string | string[];
  };
  deadline: number;
  instructions: string;
}

interface CodingChallengeSubmissionProps {
  candidateId: string;
  roundId: string;
  jobId: string;
  onSubmissionSuccess?: (submissionData: any) => void;
  onSubmissionError?: (error: string) => void;
}

export function CodingChallengeSubmission({
  candidateId,
  roundId,
  jobId,
  onSubmissionSuccess,
  onSubmissionError,
}: CodingChallengeSubmissionProps) {
  const {
    config,
    loading: configLoading,
    error: configError,
  } = useRoundConfiguration(jobId, roundId);
  const { submitAssessment, loading: submitting } = useAssessmentSubmission();

  const [challengeConfig, setChallengeConfig] =
    useState<CodingChallengeConfiguration | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [existingSubmission, setExistingSubmission] = useState<{
    githubUrl: string;
    additionalNotes?: string;
    submittedAt: string;
  } | null>(null);

  useEffect(() => {
    if (config && config.configurationData) {
      const configData =
        config.configurationData as CodingChallengeConfiguration;
      setChallengeConfig(configData);

      // Calculate deadline based on when the round was assigned to the candidate
      // For now, we'll use the current time + deadline hours
      const deadlineDate = new Date();
      deadlineDate.setHours(
        deadlineDate.getHours() + (configData.deadline || 48)
      );
      setDeadline(deadlineDate);
    }
  }, [config]);

  // Load existing coding challenge submission if any
  useEffect(() => {
    const loadSubmission = async () => {
      if (!candidateId || !roundId) return;
      try {
        const submission = await assessmentService.getAssessmentSubmission(
          candidateId,
          roundId
        );
        if (submission && submission.githubUrl) {
          const data = (submission.submissionData || {}) as any;
          setExistingSubmission({
            githubUrl: submission.githubUrl,
            additionalNotes: data.additionalNotes,
            submittedAt: submission.submittedAt,
          });
        } else {
          setExistingSubmission(null);
        }
      } catch (e) {
        // 404 -> no submission
        setExistingSubmission(null);
      }
    };
    loadSubmission();
  }, [candidateId, roundId]);

  // Calculate time remaining
  useEffect(() => {
    if (!deadline) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Deadline passed");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(
          `${days} day${days > 1 ? "s" : ""} ${hours % 24} hours`
        );
      } else {
        setTimeRemaining(`${hours} hours ${minutes} minutes`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  const handleOfflineSubmit = async (submissionData: any) => {
    try {
      await submitAssessment({
        candidateId,
        roundId,
        jobId,
        pdfUrl: null, // No PDF for GitHub submissions
        githubUrl: submissionData.githubUrl,
        submissionData,
      });
      onSubmissionSuccess?.(submissionData);
    } catch (error) {
      onSubmissionError?.(
        error instanceof Error ? error.message : "Submission failed"
      );
    }
  };

  if (configLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <p className="text-gray-600">Loading coding challenge details...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-900">
              Error Loading Challenge
            </h3>
          </div>
          <p className="text-red-700 mt-2">{configError}</p>
        </div>
      </div>
    );
  }

  if (!challengeConfig || !deadline) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-900">
              No Challenge Found
            </h3>
          </div>
          <p className="text-yellow-700 mt-2">
            No coding challenge configuration found for this round.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg mr-3">
            <Code className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {challengeConfig.name || "Coding Challenge"}
            </h3>
            <p className="text-sm text-gray-600">
              Complete your coding challenge to proceed
            </p>
          </div>
        </div>
        <div className="flex items-center text-sm mt-2">
          <Clock className="h-4 w-4 mr-1 text-gray-500" />
          <span
            className={`font-medium ${
              timeRemaining.includes("passed")
                ? "text-red-600"
                : "text-gray-700"
            }`}
          >
            {timeRemaining}
          </span>
        </div>
      </div>

      {/* Instructions */}
      {challengeConfig.instructions && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Instructions
              </h4>
              <p className="mt-1 text-sm text-blue-700">
                {challengeConfig.instructions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Online Mode */}
      {challengeConfig.mode === "online" &&
        challengeConfig.externalPlatform && (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-blue-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">
                Online Coding Challenge
              </h4>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This coding challenge is hosted on an external platform. Please
                click the link below to access and complete the challenge.
              </p>

              {challengeConfig.externalPlatform.additionalInstructions && (
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <p className="text-blue-800">
                    {challengeConfig.externalPlatform.additionalInstructions}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600 mb-2">Platform:</p>
                <p className="font-medium text-gray-900 mb-3">
                  {challengeConfig.externalPlatform.platform
                    .charAt(0)
                    .toUpperCase() +
                    challengeConfig.externalPlatform.platform.slice(1)}
                </p>

                {challengeConfig.externalPlatform.testId && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">Test ID:</p>
                    <p className="font-medium text-gray-900 mb-3">
                      {challengeConfig.externalPlatform.testId}
                    </p>
                  </>
                )}

                {challengeConfig.externalPlatform.testLink && (
                  <a
                    href={challengeConfig.externalPlatform.testLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go to Challenge
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">
                <strong>Note:</strong> Your submission will be automatically
                tracked through the external platform. Make sure to complete the
                challenge before the deadline.
              </p>
            </div>
          </div>
        )}

      {/* Offline Mode */}
      {(challengeConfig.mode === "offline" ||
        !!challengeConfig.offlineChallenge) &&
        (() => {
          const offline = challengeConfig.offlineChallenge || {
            projectDescription: "",
            requirements: [] as string[],
            deliverables: [] as string[],
            allowedTechnologies: [] as string[],
            submissionInstructions: "",
            evaluationCriteria: [] as string[],
          };

          const topLevelCriteria: any = (challengeConfig as any)
            .evaluationCriteria;
          const mergedEvaluationCriteria =
            offline.evaluationCriteria !== undefined
              ? offline.evaluationCriteria
              : Array.isArray(topLevelCriteria)
              ? topLevelCriteria
              : typeof topLevelCriteria === "string"
              ? topLevelCriteria
              : [];

          const normalizedOffline = {
            ...offline,
            evaluationCriteria: mergedEvaluationCriteria,
          } as NonNullable<typeof challengeConfig.offlineChallenge>;

          return (
            <OfflineCodingSubmission
              jobId={jobId}
              roundId={roundId}
              candidateId={candidateId}
              challengeConfig={normalizedOffline as any}
              deadline={deadline}
              onSubmit={handleOfflineSubmit}
              existingSubmission={existingSubmission || undefined}
            />
          );
        })()}
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { assessmentService } from "@/services/assessmentService";
import { roundConfigurationAPI } from "@/services/roundConfigurationApi";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  FileText,
  Github,
  Loader2,
} from "lucide-react";

export default function CodingChallengeSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const roundId = params.roundId as string;
  const candidateUserId = params.candidateUserId as string;

  const [submission, setSubmission] = useState<any | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [sub, cfg] = await Promise.all([
          assessmentService.getSubmission(candidateUserId, roundId),
          roundConfigurationAPI
            .getConfiguration(jobId, roundId)
            .catch(() => ({ success: false })),
        ]);
        setSubmission(sub);
        if ((cfg as any)?.success) setConfig((cfg as any).data);
      } catch (e) {
        setError("Failed to load submission");
      } finally {
        setLoading(false);
      }
    };
    if (jobId && roundId && candidateUserId) load();
  }, [jobId, roundId, candidateUserId]);

  const githubUrl = useMemo(() => {
    if (!submission) return null;
    if (submission.githubUrl) return submission.githubUrl;
    const data = submission.submissionData || {};
    if (typeof data.githubUrl === "string" && data.githubUrl)
      return data.githubUrl;
    if (typeof data.repo === "string" && data.repo) return data.repo;
    return null;
  }, [submission]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            No Submission Found
          </h1>
          <p className="text-gray-600 mb-4">
            This candidate hasn't submitted yet.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            href={`/interview-pipeline/${jobId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pipeline
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Coding Challenge Submission
          </h3>
          {githubUrl ? (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <Github className="h-5 w-5 text-gray-700" />
                <div>
                  <div className="text-sm text-gray-600">GitHub Repository</div>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 break-all"
                  >
                    {githubUrl}
                  </a>
                </div>
              </div>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Open
              </a>
            </div>
          ) : (
            <div className="text-gray-600">
              No GitHub link found in submission.
            </div>
          )}

          {config?.configurationData?.submissionInstructions && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Submission Instructions
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {config.configurationData.submissionInstructions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

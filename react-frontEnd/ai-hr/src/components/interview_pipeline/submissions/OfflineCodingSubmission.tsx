"use client";

import React, { useState, useEffect } from "react";
import {
  Github,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileText,
  Code,
} from "lucide-react";

interface OfflineChallengeConfig {
  projectDescription: string;
  requirements: string[];
  deliverables: string[];
  evaluationCriteria: string | string[];
  allowedTechnologies?: string[];
  submissionInstructions: string | string[];
}

interface OfflineCodingSubmissionProps {
  jobId: string;
  roundId: string;
  candidateId: string;
  challengeConfig: OfflineChallengeConfig;
  deadline: Date;
  onSubmit: (data: SubmissionData) => Promise<void>;
  existingSubmission?: {
    githubUrl: string;
    additionalNotes?: string;
    submittedAt?: string;
  };
}

interface SubmissionData {
  githubUrl: string;
  additionalNotes?: string;
  submittedAt: string;
  submissionType: "offline";
}

export function OfflineCodingSubmission({
  jobId,
  roundId,
  candidateId,
  challengeConfig,
  deadline,
  onSubmit,
  existingSubmission,
}: OfflineCodingSubmissionProps) {
  const [githubUrl, setGithubUrl] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Initialize view from existing submission if provided
  useEffect(() => {
    if (existingSubmission) {
      setGithubUrl(existingSubmission.githubUrl || "");
      setAdditionalNotes(existingSubmission.additionalNotes || "");
      setSubmitted(true);
    }
  }, [existingSubmission]);

  // Calculate time remaining
  useEffect(() => {
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

  // Validate GitHub URL
  const validateGithubUrl = (url: string): boolean => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!githubUrl) {
      setError("Please provide a GitHub repository URL");
      return;
    }

    if (!validateGithubUrl(githubUrl)) {
      setError("Please provide a valid GitHub repository URL");
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData: SubmissionData = {
        githubUrl,
        additionalNotes: additionalNotes.trim() || undefined,
        submittedAt: new Date().toISOString(),
        submissionType: "offline",
      };

      await onSubmit(submissionData);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit. Please try again.");
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-green-900">
            Submission Received!
          </h3>
        </div>
        <p className="text-green-800 mb-4">
          Your coding challenge has been successfully submitted.
        </p>
        <div className="bg-white rounded-md p-4 border border-green-200">
          <p className="text-sm text-gray-600 mb-2">Submitted Repository:</p>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <Github className="h-4 w-4 mr-2" />
            {githubUrl}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
          {additionalNotes && (
            <>
              <p className="text-sm text-gray-600 mt-3 mb-1">
                Additional Notes:
              </p>
              <p className="text-gray-800">{additionalNotes}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Challenge Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Coding Challenge - Take Home Project
          </h2>
        </div>

        {/* Project Description */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Project Description
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {challengeConfig.projectDescription}
          </p>
        </div>

        {/* Requirements */}
        {challengeConfig.requirements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Requirements
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {challengeConfig.requirements
                .filter((r) => r)
                .map((req, index) => (
                  <li key={index} className="text-gray-700">
                    {req}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Deliverables */}
        {challengeConfig.deliverables.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Deliverables
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {challengeConfig.deliverables
                .filter((d) => d)
                .map((del, index) => (
                  <li key={index} className="text-gray-700">
                    {del}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Allowed Technologies */}
        {challengeConfig.allowedTechnologies &&
          challengeConfig.allowedTechnologies.filter((t) => t).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Allowed Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {challengeConfig.allowedTechnologies
                  .filter((t) => t)
                  .map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
              </div>
            </div>
          )}

        {/* Evaluation Criteria */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Evaluation Criteria
          </h3>
          {Array.isArray(challengeConfig.evaluationCriteria) ? (
            <ul className="list-disc list-inside space-y-1">
              {challengeConfig.evaluationCriteria
                .filter((c) => !!c)
                .map((criterion, index) => (
                  <li key={index} className="text-gray-700">
                    {criterion}
                  </li>
                ))}
            </ul>
          ) : (
            // Fallback: split by new lines if a single string is provided
            <ul className="list-disc list-inside space-y-1">
              {String(challengeConfig.evaluationCriteria)
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .map((line, index) => (
                  <li key={index} className="text-gray-700">
                    {line}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Submission Instructions */}
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Submission Instructions
              </h4>
              {Array.isArray(challengeConfig.submissionInstructions) ? (
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-blue-700">
                  {challengeConfig.submissionInstructions
                    .filter((s) => !!s)
                    .map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-blue-700">
                  {challengeConfig.submissionInstructions}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Github className="h-5 w-5 mr-2" />
          Submit Your Project
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Repository URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Make sure your repository is public or includes access
              instructions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
              placeholder="Any additional information about your submission..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || timeRemaining.includes("passed")}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

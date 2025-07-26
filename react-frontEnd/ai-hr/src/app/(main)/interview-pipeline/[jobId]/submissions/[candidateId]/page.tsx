"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Clock,
  User,
  Star,
  CheckCircle,
  AlertCircle,
  Eye,
  Code,
  Award,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { assessmentService } from "@/services/assessmentService";

interface SubmissionData {
  id: string;
  candidateId: string;
  roundId: string;
  jobId: string;
  submittedAt: string;
  pdfUrl: string;
  status: "submitted" | "graded" | "pending";
  submissionData: any;
  createdAt: string;
  updatedAt: string;
  candidate?: {
    name: string;
    email: string;
    photo?: string;
  };
  round?: {
    name: string;
    type: string;
  };
  job?: {
    title: string;
  };
  grade?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    overallNotes: string;
    questionScores: Array<{
      questionId: string;
      score: number;
      maxScore: number;
      notes: string;
    }>;
    gradedAt: string;
    gradedBy: string;
  };
}

export default function SubmissionViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const jobId = params.jobId as string;
  const candidateId = params.candidateId as string;
  const roundId = searchParams.get("roundId");
  
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId && candidateId && roundId) {
      loadSubmission();
    }
  }, [jobId, candidateId, roundId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch submission data from API
      const response = await assessmentService.getSubmission(candidateId, roundId);
      setSubmission(response);
      
    } catch (err) {
      console.error("Error loading submission:", err);
      setError("Failed to load submission data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "graded":
        return "text-green-700 bg-green-50 border-green-200";
      case "submitted":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "pending":
        return "text-orange-700 bg-orange-50 border-orange-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircle className="h-4 w-4" />;
      case "submitted":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

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
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Submission</h1>
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
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No Submission Found</h1>
          <p className="text-gray-600 mb-4">
            This candidate hasn't submitted their assessment yet.
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href={`/interview-pipeline/${jobId}`}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pipeline
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Assessment Submission
                </h1>
                <p className="text-sm text-gray-500">
                  {submission.job?.title} • {submission.round?.name || "Technical Round"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Submission Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                  {submission.candidate?.photo ? (
                    <img
                      src={submission.candidate.photo}
                      alt={submission.candidate.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {submission.candidate?.name || "Unknown Candidate"}
                  </h2>
                  <p className="text-gray-600">{submission.candidate?.email}</p>
                </div>
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.status)}`}>
                  {getStatusIcon(submission.status)}
                  <span className="capitalize">{submission.status}</span>
                </div>
              </div>

              {/* Submission Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium">{formatDate(submission.submittedAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Round Type:</span>
                  <span className="font-medium capitalize">{submission.round?.type || "Technical"}</span>
                </div>
              </div>
            </div>

            {/* Submission Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Submission Content</h3>
                {submission.pdfUrl && (
                  <a
                    href={submission.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </a>
                )}
              </div>

              {/* PDF Viewer or Submission Data */}
              {submission.pdfUrl ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    src={submission.pdfUrl}
                    className="w-full h-96"
                    title="Submission PDF"
                  />
                </div>
              ) : submission.submissionData ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {JSON.stringify(submission.submissionData, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No submission content available</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Grade Information */}
            {submission.grade && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Award className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">Assessment Grade</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Overall Score */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">
                      {submission.grade.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {submission.grade.totalScore} / {submission.grade.maxScore} points
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${submission.grade.percentage}%` }}
                    />
                  </div>

                  {/* Overall Notes */}
                  {submission.grade.overallNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Overall Notes</h4>
                      <p className="text-sm text-gray-600">{submission.grade.overallNotes}</p>
                    </div>
                  )}

                  {/* Question Scores */}
                  {submission.grade.questionScores && submission.grade.questionScores.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Question Breakdown</h4>
                      <div className="space-y-2">
                        {submission.grade.questionScores.map((question, index) => (
                          <div key={question.questionId} className="bg-gray-50 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                Question {index + 1}
                              </span>
                              <span className="text-sm text-gray-600">
                                {question.score} / {question.maxScore}
                              </span>
                            </div>
                            {question.notes && (
                              <p className="text-xs text-gray-600">{question.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Graded Info */}
                  <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                    Graded on {formatDate(submission.grade.gradedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {submission.status === "submitted" && (
                  <button
                    onClick={() => router.push(`/interview-pipeline/${jobId}/rounds/${roundId}/assessment/${candidateId}`)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Grade Assessment
                  </button>
                )}
                
                {submission.status === "graded" && (
                  <button
                    onClick={() => router.push(`/interview-pipeline/${jobId}/rounds/${roundId}/assessment/${candidateId}`)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review Grade
                  </button>
                )}

                <button
                  onClick={() => router.back()}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pipeline
                </button>
              </div>
            </div>

            {/* Submission Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submission Received</p>
                    <p className="text-xs text-gray-500">{formatDate(submission.submittedAt)}</p>
                  </div>
                </div>
                
                {submission.grade && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Assessment Graded</p>
                      <p className="text-xs text-gray-500">{formatDate(submission.grade.gradedAt)}</p>
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
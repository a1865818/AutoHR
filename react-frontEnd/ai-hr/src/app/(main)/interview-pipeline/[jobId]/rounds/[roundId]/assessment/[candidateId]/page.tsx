"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  FileText,
  XCircle,
  Save,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { assessmentService, AssessmentSubmission, QuestionScore } from "@/services/assessmentService";
import { Question } from "@/components/interview_pipeline/rounds/shared/QuestionBuilder";



export default function AssessmentMarkingPage() {
  const params = useParams();
  const router = useRouter();
  const { jobId, roundId, candidateId } = params;

  // Early validation - redirect if any required param is invalid
  useEffect(() => {
    if (!jobId || jobId === "undefined" || !roundId || roundId === "undefined" || !candidateId || candidateId === "undefined") {
      console.error("❌ Invalid URL parameters detected:", { jobId, roundId, candidateId });
      router.push("/interview-pipeline");
      return;
    }
  }, [jobId, roundId, candidateId, router]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [pdfZoom, setPdfZoom] = useState(1);
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [submissionCheckLoading, setSubmissionCheckLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false); // true = review existing grade, false = grade new submission

  useEffect(() => {
    loadAssessmentData();
  }, [jobId, roundId]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setSubmissionCheckLoading(true);
      setError(null);
      setIsReviewMode(false); // Reset to grading mode by default

      // Load questions from assessment service
      const roundQuestions = await assessmentService.getRoundQuestions();
      setQuestions(roundQuestions);

      // Initialize question scores
      const initialScores: QuestionScore[] = roundQuestions.map((question) => ({
        questionId: question.id,
        score: 0,
        maxScore: question.points || 10,
        notes: "",
      }));
      setQuestionScores(initialScores);

      // Check if candidate has submitted an assessment
      console.log("🔍 Checking if candidate has submitted assessment...");
      const candidateSubmitted = await assessmentService.hasSubmittedAssessment(
        candidateId as string,
        roundId as string
      );

      setHasSubmitted(candidateSubmitted);

      if (candidateSubmitted) {
        // Load the actual submission
        const existingSubmission = await assessmentService.getAssessmentSubmission(
          candidateId as string,
          roundId as string
        );

        if (existingSubmission) {
          setSubmission(existingSubmission);
          console.log("✅ Found candidate submission:", existingSubmission);

          // Only try to load existing grade if submission is already graded
          if (existingSubmission.status === "graded") {
            try {
              console.log("🔍 Submission is marked as graded, loading existing grade...");
              const existingGrade = await assessmentService.getAssessmentGrade(existingSubmission.id);
              if (existingGrade) {
                console.log("📊 Found existing grade:", existingGrade);
                setQuestionScores(existingGrade.questionScores);
                setOverallNotes(existingGrade.overallNotes);
                setIsReviewMode(true); // Set to review mode when existing grade is loaded
                console.log("🔍 Switched to review mode - form will be read-only");
              }
            } catch (error) {
              console.warn("Failed to load existing grade despite 'graded' status:", error);
            }
          } else {
            console.log(`📝 Submission status is '${existingSubmission.status}' - no existing grade to load`);
          }
        }
      } else {
        console.log("⚠️ Candidate has not submitted assessment yet");
        setSubmission(null);
      }
    } catch (error) {
      console.error("Error loading assessment data:", error);
      setError("Failed to load assessment data");
    } finally {
      setLoading(false);
      setSubmissionCheckLoading(false);
    }
  };

  const handleQuestionScoreChange = (questionId: string, score: number) => {
    setQuestionScores((prev) =>
      prev.map((qs) =>
        qs.questionId === questionId
          ? { ...qs, score: Math.max(0, Math.min(score, qs.maxScore)) }
          : qs
      )
    );
  };

  const handleQuestionNotesChange = (questionId: string, notes: string) => {
    setQuestionScores((prev) =>
      prev.map((qs) =>
        qs.questionId === questionId ? { ...qs, notes } : qs
      )
    );
  };

  const calculateTotalScore = () => {
    const total = questionScores.reduce((sum, qs) => sum + qs.score, 0);
    const maxTotal = questionScores.reduce((sum, qs) => sum + qs.maxScore, 0);
    return { total, maxTotal, percentage: maxTotal > 0 ? (total / maxTotal) * 100 : 0 };
  };

  const handleResetScores = () => {
    // Don't allow reset in review mode
    if (isReviewMode) {
      console.warn("⚠️ Cannot reset scores in review mode");
      return;
    }
    
    const initialScores: QuestionScore[] = questions.map((question) => ({
      questionId: question.id,
      score: 0,
      maxScore: question.points || 10,
      notes: "",
    }));
    setQuestionScores(initialScores);
    setOverallNotes("");
  };

  const handleSaveGrade = async () => {
    try {
      setSaving(true);
      setError(null);
      const { total, maxTotal } = calculateTotalScore();

      if (!submission) {
        throw new Error("No submission found");
      }

      console.log("🔍 Current submission:", submission);
      console.log("🔍 Question scores:", questionScores);
      console.log("🔍 Overall notes:", overallNotes);

      const gradeData = {
        submissionId: submission.id,
        totalScore: total,
        maxScore: maxTotal,
        overallNotes,
        questionScores,
      };

      console.log("💾 Saving assessment grade:", gradeData);
      console.log("💾 Submission ID type:", typeof submission.id);
      console.log("💾 Submission ID value:", submission.id);

      // Save grade (will handle mock submissions automatically)
      const savedGrade = await assessmentService.saveAssessmentGrade(gradeData);
      console.log("✅ Grade saved successfully:", savedGrade);

      // Reload submission data to get updated status
      const updatedSubmission = await assessmentService.getAssessmentSubmission(
        candidateId as string,
        roundId as string
      );
      if (updatedSubmission) {
        setSubmission(updatedSubmission);
        console.log("🔄 Updated submission status:", updatedSubmission.status);
      }

      // Show success message
      setSuccessMessage("Assessment grade saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Switch to review mode after saving the grade
      if (updatedSubmission?.status === "graded") {
        console.log("📝 Grade saved successfully - switching to review mode");
        setIsReviewMode(true);
      }
    } catch (error) {
      console.error("Error saving grade:", error);
      setError("Failed to save grade");
    } finally {
      setSaving(false);
    }
  };



  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (percentage: number) => {
    if (percentage >= 80) return "bg-green-50";
    if (percentage >= 60) return "bg-yellow-50";
    return "bg-red-50";
  };

  if (loading || submissionCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {submissionCheckLoading ? "Checking submission status..." : "Loading assessment..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show message when candidate hasn't submitted yet
  if (!hasSubmitted || !submission) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Pipeline</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Assessment Marking
                </h1>
                <p className="text-sm text-gray-500">
                  Round: Technical Assessment • Candidate: {candidateId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* No Submission Message */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Submission Yet
            </h2>
            <p className="text-gray-600 mb-4">
              This candidate has not submitted their assessment yet. You can mark the assessment once they submit their response.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Candidates must complete and submit their assessment before you can evaluate and grade their responses.
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Back to Pipeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { total, maxTotal, percentage } = calculateTotalScore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Pipeline</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isReviewMode ? "Assessment Review" : "Assessment Marking"}
              </h1>
              <p className="text-sm text-gray-500">
                Round: Technical Assessment • Candidate: {candidateId}
                {isReviewMode && <span className="ml-2 text-blue-600 font-medium">• Read-only view</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBackground(percentage)} ${getScoreColor(percentage)}`}>
              {percentage.toFixed(1)}% ({total}/{maxTotal})
            </div>
            
            {isReviewMode ? (
              // Review Mode - Read-only view
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Graded
                </div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Pipeline</span>
                </button>
              </div>
            ) : (
              // Grading Mode - Editable form
              <>
                <button
                  onClick={handleResetScores}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleSaveGrade}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Saving..." : "Save Grade"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* PDF Preview - Left Side */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Submission Preview</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPdfZoom(Math.max(0.5, pdfZoom - 0.1))}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(pdfZoom * 100)}%
              </span>
              <button
                onClick={() => setPdfZoom(Math.min(2, pdfZoom + 0.1))}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div
              className="bg-white shadow-lg mx-auto"
              style={{
                transform: `scale(${pdfZoom})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease",
              }}
            >
              <iframe
                src={submission?.pdfUrl}
                className="w-full h-[800px] border-0"
                title="Assessment Submission"
              />
            </div>
          </div>
        </div>

        {/* Marking Interface - Right Side */}
        <div className="w-1/2 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {isReviewMode ? "Assessment Review" : "Assessment Marking"}
            </h2>
            <p className="text-sm text-gray-600">
              {isReviewMode 
                ? "Review the graded assessment and scoring for this candidate"
                : "Review and grade the candidate's responses to each question"
              }
            </p>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* Questions */}
            {questions.map((question, index) => {
              const questionScore = questionScores.find(
                (qs) => qs.questionId === question.id
              );
              
              return (
                <div
                  key={question.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Question {index + 1}
                        </span>
                        {question.required && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Required
                          </span>
                        )}
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {question.points || 10} points
                        </span>
                      </div>
                      <p className="text-gray-900">{question.text}</p>
                    </div>
                  </div>

                  {/* Scoring */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <label className="text-sm font-medium text-gray-700 min-w-[60px]">
                        Score:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={questionScore?.maxScore || 10}
                        value={questionScore?.score || 0}
                        onChange={(e) =>
                          handleQuestionScoreChange(
                            question.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        readOnly={isReviewMode}
                        className={`w-20 px-2 py-1 border rounded text-center ${
                          isReviewMode 
                            ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed" 
                            : "border-gray-300 bg-white hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        }`}
                      />
                      <span className="text-sm text-gray-500">
                        / {questionScore?.maxScore || 10}
                      </span>
                      <div className="flex-1 ml-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${((questionScore?.score || 0) / (questionScore?.maxScore || 10)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional):
                      </label>
                      <textarea
                        value={questionScore?.notes || ""}
                        onChange={(e) =>
                          handleQuestionNotesChange(question.id, e.target.value)
                        }
                        placeholder={isReviewMode ? "Notes from grading..." : "Add feedback or notes for this question..."}
                        readOnly={isReviewMode}
                        className={`w-full px-3 py-2 border rounded-md resize-none ${
                          isReviewMode
                            ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                            : "border-gray-300 bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        }`}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Overall Notes */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Overall Assessment Notes
              </h3>
              <textarea
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder={isReviewMode ? "Overall notes from grading..." : "Add overall feedback, strengths, areas for improvement..."}
                readOnly={isReviewMode}
                className={`w-full px-3 py-2 border rounded-md resize-none ${
                  isReviewMode
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                }`}
                rows={4}
              />
            </div>

            {/* Summary */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">
                Assessment Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-indigo-700">Total Score</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {total} / {maxTotal}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-indigo-700">Percentage</p>
                  <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-indigo-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [pdfZoom, setPdfZoom] = useState(1);
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAssessmentData();
  }, [jobId, roundId]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test API connection first
      console.log("🔍 Testing API connection...");
      const apiWorking = await assessmentService.testApiConnection();
      console.log("API connection test result:", apiWorking);

      // Load questions from assessment service
      const roundQuestions = await assessmentService.getRoundQuestions(
        jobId as string,
        roundId as string
      );

      setQuestions(roundQuestions);

      // Initialize question scores
      const initialScores: QuestionScore[] = roundQuestions.map((question) => ({
        questionId: question.id,
        score: 0,
        maxScore: question.points || 10,
        notes: "",
      }));
      setQuestionScores(initialScores);

      if (apiWorking) {
        // Backend is available, try to get existing submission, create mock if not found
        let existingSubmission = await assessmentService.getAssessmentSubmission(
          candidateId as string,
          roundId as string
        );

        if (!existingSubmission) {
          // Create a mock submission for testing
          existingSubmission = await assessmentService.createMockSubmission(
            candidateId as string,
            roundId as string,
            jobId as string
          );
        }

        setSubmission(existingSubmission);

        // Try to load existing grade for this submission
        try {
          const existingGrade = await assessmentService.getAssessmentGrade(existingSubmission.id);
          if (existingGrade) {
            console.log("📊 Found existing grade:", existingGrade);
            setQuestionScores(existingGrade.questionScores);
            setOverallNotes(existingGrade.overallNotes);
          }
        } catch (error) {
          console.log("No existing grade found or error loading:", error);
        }
      } else {
        // Backend not available, use mock submission
        console.log("⚠️ Using mock submission data");
        const mockSubmission: AssessmentSubmission = {
          id: "mock_submission",
          candidateId: candidateId as string,
          roundId: roundId as string,
          jobId: jobId as string,
          submittedAt: new Date().toISOString(),
          pdfUrl: "/interview-faq.pdf",
          status: "submitted",
        };
        setSubmission(mockSubmission);
      }
    } catch (error) {
      console.error("Error loading assessment data:", error);
      setError("Failed to load assessment data");
    } finally {
      setLoading(false);
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

      // Show success message
      setSuccessMessage("Assessment grade saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setQuestionScores(
        questions.map((question) => ({
          questionId: question.id,
          score: 0,
          maxScore: question.points || 10,
          notes: "",
        }))
      );
      setOverallNotes("");
    } catch (error) {
      console.error("Error saving grade:", error);
      setError("Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const handleResetScores = () => {
    const resetScores: QuestionScore[] = questionScores.map((qs) => ({
      ...qs,
      score: 0,
      notes: "",
    }));
    setQuestionScores(resetScores);
    setOverallNotes("");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading assessment...</p>
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
                Assessment Marking
              </h1>
              <p className="text-sm text-gray-500">
                Round: Technical Assessment • Candidate: {candidateId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBackground(percentage)} ${getScoreColor(percentage)}`}>
              {percentage.toFixed(1)}% ({total}/{maxTotal})
            </div>
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
              Assessment Marking
            </h2>
                          <p className="text-sm text-gray-600">
                Review and grade the candidate&apos;s responses to each question
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
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
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
                        placeholder="Add feedback or notes for this question..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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
                placeholder="Add overall feedback, strengths, areas for improvement..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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
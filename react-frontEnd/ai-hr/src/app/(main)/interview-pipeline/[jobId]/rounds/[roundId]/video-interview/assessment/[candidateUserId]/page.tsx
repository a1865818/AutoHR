"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRoundConfiguration } from "@/hooks/useRoundConfiguration";
import { candidateService } from "@/services/candidateService";
import { assessmentService } from "@/services/assessmentService";
import { Toast } from "@/components/settings/Toast";

type QuestionEntry = {
  id: string;
  text: string;
  score: number | "";
  maxScore: number;
  notes: string;
};

export default function VideoInterviewAssessmentPage() {
  const params = useParams();
  const router = useRouter();

  const { jobId, roundId, candidateUserId } = params as unknown as {
    jobId: string;
    roundId: string;
    candidateUserId: string;
  };

  const {
    config: roundConfig,
    loading: configLoading,
    error: configError,
  } = useRoundConfiguration(jobId, roundId);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [candidateName, setCandidateName] = useState<string>("");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionEntry[]>([]);
  const [overallNotes, setOverallNotes] = useState<string>("");

  const configQuestions: Array<{ id?: string; text?: string }> = useMemo(() => {
    const cfg = roundConfig as any;
    const data = cfg?.configurationData ?? cfg ?? {};
    const qs = data?.questions ?? [];
    if (Array.isArray(qs)) {
      return qs
        .map((q: any) => ({ id: q.id, text: q.text }))
        .filter((q: any) => q && q.text);
    }
    return [];
  }, [roundConfig]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build initial questions from configuration
        const baseQuestions: QuestionEntry[] = configQuestions.map(
          (q, idx) => ({
            id:
              q.id ||
              `viq_${idx}_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            text: q.text || `Question ${idx + 1}`,
            score: 0,
            maxScore: 10,
            notes: "",
          })
        );
        setQuestions(baseQuestions);

        // Resolve candidate info
        try {
          const jobCandidates = await candidateService.getCandidatesForJob(
            jobId
          );
          const found = (jobCandidates || []).find(
            (c: any) =>
              c.candidateUserId === candidateUserId ||
              c.id === candidateUserId ||
              c.candidateId === candidateUserId
          );
          if (found?.name) setCandidateName(found.name);
          if (found?.applicationId) setApplicationId(found.applicationId);
        } catch {
          if (!candidateName) setCandidateName(String(candidateUserId));
        }

        // Load existing submission and grade (assessment endpoints)
        try {
          const existing = await assessmentService.getSubmission(
            candidateUserId,
            roundId
          );
          if (existing) {
            const subId = (existing as any).id || (existing as any).Id || null;
            if (subId) setSubmissionId(subId);
            const grade = (existing as any).grade;
            if (grade && Array.isArray(grade.questionScores)) {
              setOverallNotes(grade.overallNotes || grade.OverallNotes || "");
              const mapped = baseQuestions.map((c) => {
                const f = grade.questionScores.find(
                  (gq: any) => gq.questionId === c.id
                );
                return f
                  ? {
                      ...c,
                      score: Number((f as any).score) || 0,
                      maxScore: Number((f as any).maxScore) || c.maxScore,
                      notes: (f as any).notes || "",
                    }
                  : c;
              });
              setQuestions(mapped);
            }
          }
        } catch {}
      } catch (e) {
        console.error(e);
        setError("Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    if (jobId && roundId && candidateUserId && !configLoading) {
      initialize();
    }
  }, [jobId, roundId, candidateUserId, configLoading, configQuestions]);

  const totals = useMemo(() => {
    const total = questions.reduce(
      (acc, q) => acc + (typeof q.score === "number" ? q.score : 0),
      0
    );
    const max = questions.reduce((acc, q) => acc + (q.maxScore || 0), 0);
    const pct = max > 0 ? (total / max) * 100 : 0;
    return { total, max, pct };
  }, [questions]);

  const handleScoreChange = (idx: number, value: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const max = Number(next[idx].maxScore) || 10;
      const newScore =
        value === "" ? "" : Math.max(0, Math.min(Number(value), max));
      next[idx] = { ...next[idx], score: newScore };
      return next;
    });
  };

  const handleNotesChange = (idx: number, value: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], notes: value };
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setSaveError(null);

      // Ensure a submission exists
      let subId = submissionId;
      if (!subId) {
        const submission = await assessmentService.createSubmission(
          candidateUserId,
          roundId,
          jobId,
          null,
          { source: "video_interview_assessment_only" }
        );
        subId = submission.id;
        setSubmissionId(subId);
      }

      const questionScores = questions.map((q) => ({
        questionId: q.id,
        score: typeof q.score === "number" ? q.score : 0,
        maxScore: q.maxScore,
        notes: q.notes,
      }));

      await assessmentService.saveAssessmentGrade({
        submissionId: subId as string,
        totalScore: totals.total,
        maxScore: totals.max,
        overallNotes,
        questionScores,
      } as any);

      // Reload the latest grade to confirm
      try {
        const latest = await assessmentService.getAssessmentGrade(
          subId as string
        );
        if (latest && Array.isArray((latest as any).questionScores)) {
          setOverallNotes((latest as any).overallNotes || "");
          const mapped = questions.map((c) => {
            const f = (latest as any).questionScores.find(
              (gq: any) => gq.questionId === c.id
            );
            return f
              ? {
                  ...c,
                  score: Number((f as any).score) || 0,
                  maxScore: Number((f as any).maxScore) || c.maxScore,
                  notes: (f as any).notes || "",
                }
              : c;
          });
          setQuestions(mapped);
        }
      } catch {}

      setSuccess("Assessment saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveError("Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut: Esc to go back
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.back();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  if (configLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 text-red-700 rounded-md p-4">
          {String(configError)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <Toast
        message={success || ""}
        type="success"
        isVisible={!!success}
        onClose={() => setSuccess(null)}
        duration={3000}
      />
      <Toast
        message={saveError || ""}
        type="error"
        isVisible={!!saveError}
        onClose={() => setSaveError(null)}
        duration={3500}
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          title="Back to Pipeline (Esc)"
          aria-label="Back to Pipeline"
          className="group mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
          Back to Pipeline
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900 truncate">
                {candidateName || "Candidate"}
              </h1>
              <div className="text-sm text-gray-500 mt-1">
                Video Interview Assessment
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 whitespace-nowrap">
                {totals.pct.toFixed(1)}% ({totals.total}/{totals.max})
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? "Saving..." : "Save Assessment"}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-medium text-gray-700 mb-3">
                Questions
              </h2>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-gray-900 font-medium">
                        Q{idx + 1}: {q.text}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min={0}
                          max={q.maxScore}
                          step={1}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          onKeyDown={(e) => {
                            if (
                              ["e", "E", "+", "-", ".", ",", " "].includes(
                                e.key
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                          value={q.score === "" ? "" : String(q.score)}
                          onChange={(e) =>
                            handleScoreChange(idx, e.target.value)
                          }
                        />
                        <span className="text-sm text-gray-500">
                          / {q.maxScore}
                        </span>
                      </div>
                    </div>
                    <textarea
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Comments for this question"
                      value={q.notes}
                      onChange={(e) => handleNotesChange(idx, e.target.value)}
                    />
                  </div>
                ))}
                {questions.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No interview questions configured for this round.
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-medium text-gray-700 mb-3">
                Overall Notes
              </h2>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Overall comments and recommendation"
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

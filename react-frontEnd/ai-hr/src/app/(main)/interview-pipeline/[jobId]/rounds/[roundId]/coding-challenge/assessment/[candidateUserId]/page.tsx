"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2, Save } from "lucide-react";
import { useRoundConfiguration } from "@/hooks/useRoundConfiguration";
import { assessmentService } from "@/services/assessmentService";
import { candidateService } from "@/services/candidateService";
import { Toast } from "@/components/settings/Toast";

type CriterionEntry = {
  id: string;
  label: string;
  score: number | "";
  maxScore: number;
  comment: string;
};

export default function CodingChallengeAssessmentPage() {
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

  const [overallNotes, setOverallNotes] = useState<string>("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<CriterionEntry[]>([]);
  const [candidateName, setCandidateName] = useState<string>("");

  const evaluationCriteria: string[] = useMemo(() => {
    const data = (roundConfig as any)?.configurationData;
    const ec = data?.evaluationCriteria ?? [];
    if (Array.isArray(ec))
      return ec.filter((s) => !!s && typeof s === "string");
    if (typeof ec === "string")
      return ec
        .split(/\r?\n/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    return [];
  }, [roundConfig]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build initial criteria list from configuration
        const defaultMax = 10;
        const baseCriteria: CriterionEntry[] = evaluationCriteria.map(
          (label) => ({
            id: label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .slice(0, 64),
            label,
            score: 0,
            maxScore: defaultMax,
            comment: "",
          })
        );
        setCriteria(baseCriteria);

        // Try to load existing submission and grade
        const existing = await assessmentService.getSubmission(
          candidateUserId,
          roundId
        );

        if (existing) {
          setSubmissionId((existing as any).id || (existing as any).Id || null);
          const grade = (existing as any).grade;
          if (grade) {
            // Populate from saved grade
            setOverallNotes(grade.overallNotes || grade.OverallNotes || "");
            const qs: Array<{
              questionId: string;
              score: number;
              maxScore: number;
              notes: string;
            }> = grade.questionScores || grade.QuestionScores || [];

            if (qs.length) {
              const mapped = baseCriteria.map((c) => {
                const found = qs.find((q) => q.questionId === c.id);
                return found
                  ? {
                      ...c,
                      score: Number(found.score) || 0,
                      maxScore: Number(found.maxScore) || c.maxScore,
                      comment: found.notes || "",
                    }
                  : c;
              });
              setCriteria(mapped);
            }
          }
        }

        // Ensure we have candidate name for nicer title
        try {
          if (!candidateName) {
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
          }
        } catch (err) {
          // Fallback to masked candidate id if name not available
          if (!candidateName) setCandidateName(String(candidateUserId));
        }
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
  }, [jobId, roundId, candidateUserId, configLoading, evaluationCriteria]);

  const handleScoreChange = (idx: number, value: string) => {
    setCriteria((prev) => {
      const next = [...prev];
      const max = Number(next[idx].maxScore) || 10;
      const newScore =
        value === "" ? "" : Math.max(0, Math.min(Number(value), max));
      next[idx] = { ...next[idx], score: newScore };
      return next;
    });
  };

  const handleCommentChange = (idx: number, value: string) => {
    setCriteria((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], comment: value };
      return next;
    });
  };

  const totals = useMemo(() => {
    const total = criteria.reduce((acc, c) => acc + (Number(c.score) || 0), 0);
    const max = criteria.reduce((acc, c) => acc + (Number(c.maxScore) || 0), 0);
    const pct = max > 0 ? (total / max) * 100 : 0;
    return { total, max, pct };
  }, [criteria]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setSaveError(null);

      let subId = submissionId;
      if (!subId) {
        // Create a placeholder submission so we can persist a grade
        const submission = await assessmentService.createSubmission(
          candidateUserId,
          roundId,
          jobId,
          null,
          { source: "coding_challenge_assessment_only" }
        );
        subId = submission.id;
        setSubmissionId(subId);
      }

      const questionScores = criteria.map((c) => ({
        questionId: c.id,
        score: typeof c.score === "number" ? c.score : 0,
        maxScore: c.maxScore,
        notes: c.comment,
      }));

      await assessmentService.saveAssessmentGrade({
        submissionId: subId as string,
        totalScore: totals.total,
        maxScore: totals.max,
        overallNotes,
        questionScores,
      } as any);

      setSuccess("Assessment saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveError("Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

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
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pipeline
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900 truncate">
                {candidateName || "Candidate"}
              </h1>
              <div className="text-sm text-gray-500 mt-1">
                Coding Challenge Assessment
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
                Criteria
              </h2>
              <div className="space-y-4">
                {criteria.map((c, idx) => (
                  <div
                    key={c.id}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-gray-900 font-medium">{c.label}</div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min={0}
                          max={c.maxScore}
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
                          value={c.score === "" ? "" : String(c.score)}
                          onChange={(e) =>
                            handleScoreChange(idx, e.target.value)
                          }
                        />
                        <span className="text-sm text-gray-500">
                          / {c.maxScore}
                        </span>
                      </div>
                    </div>
                    <textarea
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Comments for this criterion"
                      value={c.comment}
                      onChange={(e) => handleCommentChange(idx, e.target.value)}
                    />
                  </div>
                ))}
                {criteria.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No evaluation criteria configured for this round.
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

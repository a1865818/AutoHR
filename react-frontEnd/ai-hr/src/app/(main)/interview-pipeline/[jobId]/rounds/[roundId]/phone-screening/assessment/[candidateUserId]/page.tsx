"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { roundConfigurationAPI } from "@/services/roundConfigurationApi";
import { candidateService } from "@/services/candidateService";
import { ArrowLeft, CheckCircle, Save, XCircle } from "lucide-react";
import { cleanJsonObject } from "@/utils/jsonUtils";
import { Toast } from "@/components/settings/Toast";
import {
  assessmentService,
  type AssessmentSubmission,
  type QuestionScore as TAQuestionScore,
} from "@/services/assessmentService";

type ScoringCriterion = {
  id: string;
  name: string;
  description?: string;
  weight?: number;
  maxScore?: number;
};

type PhoneScreenConfigData = {
  scoringCriteria?: ScoringCriterion[];
  questions?: Array<{
    id: string;
    text: string;
    required?: boolean;
    points?: number;
    category?: string;
  }>;
};

export default function PhoneScreeningAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const { jobId, roundId, candidateUserId } = params as unknown as {
    jobId: string;
    roundId: string;
    candidateUserId: string;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string>("");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [configData, setConfigData] = useState<PhoneScreenConfigData | null>(
    null
  );
  const [criteriaNotes, setCriteriaNotes] = useState<Record<string, string>>(
    {}
  );
  const [questionScores, setQuestionScores] = useState<
    Record<string, { score: number | ""; max: number; notes: string }>
  >({});
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Load round configuration to get scoring criteria
        const cfg = await roundConfigurationAPI.getConfiguration(
          jobId,
          roundId
        );
        let data = (cfg?.data as any)?.configurationData || {};
        // Clean potential JsonElement wrappers from .NET
        data = cleanJsonObject(data);
        setConfigData(data);

        // Try to resolve candidate name and application id via job list
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
        } catch {}

        // Initialize notes/scores for criteria and questions
        const initialNotes: Record<string, string> = {};
        const criteria = (data?.scoringCriteria || []) as ScoringCriterion[];
        criteria.forEach((c) => {
          initialNotes[c.id] = "";
        });
        setCriteriaNotes(initialNotes);

        const qInitial: Record<
          string,
          { score: number | ""; max: number; notes: string }
        > = {};
        const questionsArr =
          ((data?.questions || []) as PhoneScreenConfigData["questions"]) || [];
        questionsArr.forEach((q) => {
          const max = Number((q as any)?.points) || 5;
          qInitial[q.id] = { score: 0, max, notes: "" };
        });
        setQuestionScores(qInitial);

        // Load existing submission if present (reuse assessment endpoints for persistence)
        try {
          const existing = await assessmentService.getAssessmentSubmission(
            candidateUserId,
            roundId
          );
          if (existing) {
            setSubmission(existing);
            // If there is an existing grade, load it and prefill scores/notes
            try {
              const existingGrade = await assessmentService.getAssessmentGrade(
                existing.id
              );
              if (
                existingGrade &&
                Array.isArray(existingGrade.questionScores)
              ) {
                setQuestionScores((prev) => {
                  const updated = { ...prev };
                  for (const qs of existingGrade.questionScores) {
                    const qid = (qs as any).questionId;
                    if (qid && updated[qid]) {
                      updated[qid] = {
                        ...updated[qid],
                        score: Number((qs as any).score) || 0,
                        notes: (qs as any).notes || "",
                      };
                    }
                  }
                  return updated;
                });
              }
            } catch (gradeErr) {
              // No grade yet or failed to load; ignore
            }
          }
        } catch {}
      } catch (e) {
        setError("Failed to load configuration");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId, roundId, candidateUserId]);

  const overallNotes = useMemo(() => {
    const sections: string[] = [];
    const questionsArr =
      ((configData?.questions || []) as PhoneScreenConfigData["questions"]) ||
      [];
    if (questionsArr.length > 0) {
      sections.push("Questions:");
      questionsArr.forEach((q, idx) => {
        const qs = questionScores[q.id] || {
          score: 0,
          max: Number((q as any)?.points) || 5,
          notes: "",
        };
        const title = `Q${idx + 1} ${q.text}`;
        const scoreDisplay = typeof qs.score === "number" ? qs.score : 0;
        const line = `${title} (${scoreDisplay}/${qs.max})${
          qs.notes?.trim() ? ": " + qs.notes.trim() : ""
        }`;
        sections.push(line);
      });
    }
    return sections.join("\n");
  }, [questionScores, configData]);

  const handleSave = async () => {
    try {
      if (!applicationId) {
        setSaveError("Cannot save: missing application id");
        return;
      }
      setSaving(true);
      setSaveError(null);
      // Ensure we have a submission associated to this candidate/round
      let workingSubmission = submission;
      if (!workingSubmission) {
        try {
          workingSubmission = await assessmentService.createSubmission(
            candidateUserId,
            roundId,
            jobId,
            null,
            {
              type: "phone_screening",
              createdAt: new Date().toISOString(),
            }
          );
          setSubmission(workingSubmission);
        } catch (e) {
          console.warn("Failed to create submission for phone screening:", e);
        }
      }

      // Build question scores only
      const questionsArr =
        ((configData?.questions || []) as PhoneScreenConfigData["questions"]) ||
        [];
      const scores: TAQuestionScore[] = questionsArr.map((q) => {
        const qs = questionScores[q.id] || {
          score: 0,
          max: Number((q as any)?.points) || 5,
          notes: "",
        };
        const scoreNum = typeof qs.score === "number" ? qs.score : 0;
        return {
          questionId: q.id,
          score: scoreNum,
          maxScore: qs.max,
          notes: qs.notes || "",
        };
      });
      const total = scores.reduce((s, x) => s + (Number(x.score) || 0), 0);
      const maxTotal = scores.reduce(
        (s, x) => s + (Number(x.maxScore) || 0),
        0
      );

      if (workingSubmission) {
        await assessmentService.saveAssessmentGrade({
          submissionId: workingSubmission.id,
          totalScore: total,
          maxScore: maxTotal,
          overallNotes,
          questionScores: scores,
        });
      } else {
        // Fallback persistence of notes if submission couldn't be created
        await candidateService.saveCandidateNote(applicationId, overallNotes);
      }

      setSuccess("Phone screening assessment saved");
      setTimeout(() => setSuccess(null), 2500);
    } catch (e) {
      setSaveError("Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <div className="text-gray-800 font-medium mb-1">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  const criteria = (configData?.scoringCriteria || []) as ScoringCriterion[];
  const questionsArr =
    ((configData?.questions || []) as PhoneScreenConfigData["questions"]) || [];

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

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/interview-pipeline/${jobId}`)}
              aria-label="Back to Pipeline"
              className="inline-flex items-center px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pipeline
            </button>
            <div>
              <div className="text-xl font-semibold text-gray-900">
                Phone Screening Assessment
              </div>
              <div className="text-sm text-gray-500">
                Candidate: {candidateName || String(candidateUserId)}
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-accent disabled:opacity-50"
          >
            <Save className="h-4 w-4 inline mr-2" />
            {saving ? "Saving…" : "Save Assessment"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Questions Section */}
        {questionsArr.length > 0 ? (
          <div className="space-y-6">
            {questionsArr.map((q, index) => {
              const qs = questionScores[q.id] || {
                score: 0,
                max: Number((q as any)?.points) || 5,
                notes: "",
              };
              return (
                <div
                  key={q.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Question {index + 1}
                        </span>
                        {q?.required && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        )}
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {qs.max} points
                        </span>
                      </div>
                      <p className="text-gray-900">{q.text}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">Score</label>
                      <input
                        type="number"
                        min={0}
                        max={qs.max}
                        step={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={qs.score === "" ? "" : String(qs.score)}
                        onKeyDown={(e) => {
                          if (
                            ["e", "E", "+", "-", ".", ",", " "].includes(e.key)
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestionScores((prev) => ({
                            ...prev,
                            [q.id]: {
                              ...prev[q.id],
                              score:
                                val === ""
                                  ? ""
                                  : Math.max(0, Math.min(Number(val), qs.max)),
                            },
                          }));
                        }}
                        className="w-24 px-3 py-1.5 border rounded text-center"
                      />
                      <span className="text-sm text-gray-500">/ {qs.max}</span>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Comments
                      </label>
                      <textarea
                        value={qs.notes}
                        onChange={(e) =>
                          setQuestionScores((prev) => ({
                            ...prev,
                            [q.id]: { ...prev[q.id], notes: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                        placeholder="Add feedback or notes for this question..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-600">
            No interview questions configured.
          </div>
        )}

        {/* Criteria Guidance (as a single list section) */}
        {criteria.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-900 font-semibold mb-2">Criteria</h3>
            <ul className="mt-2 space-y-2">
              {criteria.map((c) => (
                <li key={c.id} className="flex items-start">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 mt-2 mr-2" />
                  <div>
                    <div className="text-gray-900 font-medium">{c.name}</div>
                    {c.description && (
                      <div className="text-gray-600 text-sm">
                        {c.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-gray-600">No scoring criteria configured.</div>
        )}

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="text-indigo-900 font-medium mb-2">Overall Notes</div>
          <pre className="whitespace-pre-wrap text-indigo-800 text-sm">
            {overallNotes || "No comments yet"}
          </pre>
        </div>
      </div>
    </div>
  );
}

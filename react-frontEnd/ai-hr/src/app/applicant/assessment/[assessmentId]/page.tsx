"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CultureFitAssessment } from "@/components/assessment/CultureFitAssessment";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface AssessmentData {
  id: string;
  jobId: string;
  roundId: string;
  candidateId: string;
  configuration: any; // Culture fit configuration
  status: "pending" | "in_progress" | "completed";
  startedAt?: string;
  completedAt?: string;
}

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;
  
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      const response = await fetch(`/api/assessments/${assessmentId}`);
      if (!response.ok) {
        throw new Error("Failed to load assessment");
      }
      
      const data = await response.json();
      setAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentComplete = async (results: any) => {
    try {
      // TODO: Submit assessment results
      const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(results),
      });

      if (!response.ok) {
        throw new Error("Failed to submit assessment");
      }

      // Redirect to completion page
      router.push(`/applicant/assessment/${assessmentId}/complete`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message="Assessment not found" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CultureFitAssessment
        assessment={assessment}
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
}

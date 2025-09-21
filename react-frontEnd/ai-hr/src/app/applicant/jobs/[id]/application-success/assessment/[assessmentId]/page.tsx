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
  const jobId = params.id as string;
  
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to transform configuration data to expected format
  const transformConfigData = (configData: any) => {
    console.log("🔍 Transforming config data:", configData);
    console.log("🔍 Config data keys:", Object.keys(configData));
    
    // If the config already has the expected structure, return it as is
    if (configData.companyValues && configData.cultureQuestions) {
      console.log("🔍 Config already has expected structure");
      console.log("🔍 Original cultureQuestions:", configData.cultureQuestions);
      console.log("🔍 Original culturalScenarios:", configData.culturalScenarios);
      console.log("🔍 Original questions:", configData.questions);
      console.log("🔍 Original scenarios:", configData.scenarios);
      // Ensure we're using cultureQuestions instead of questions
      const result = {
        ...configData,
        cultureQuestions: configData.cultureQuestions || configData.questions || [],
        culturalScenarios: configData.culturalScenarios || configData.scenarios || []
      };
      console.log("🔍 Transformed result cultureQuestions:", result.cultureQuestions);
      console.log("🔍 Transformed result culturalScenarios:", result.culturalScenarios);
      return result;
    }

    // Transform from focusAreas format to expected format
    if (configData.focusAreas) {
      console.log("🔍 Transforming from focusAreas format");
      return {
        name: configData.name || "Culture Fit Assessment",
        description: configData.description || "Assessment to evaluate cultural alignment and values fit",
        companyValues: configData.companyValues || configData.focusAreas.map((area: any, index: number) => ({
          id: area.id || `value-${index}`,
          name: area.name || area.title || `Value ${index + 1}`,
          description: area.description || "Company value description",
          weight: area.weight || 3,
          indicators: area.indicators || area.traits || []
        })),
        cultureQuestions: configData.cultureQuestions || configData.questions || [],
        culturalScenarios: configData.culturalScenarios || configData.scenarios || [],
        duration: Number(configData.duration) || 45, // Ensure duration is a number, fallback to 45 if invalid
        assessmentSettings: configData.assessmentSettings || {
          timePerQuestionSeconds: 60,
          shuffleQuestions: false,
          showExplanations: false
        },
        instructions: configData.instructions || "Please answer all questions honestly and thoughtfully.",
        evaluationCriteria: configData.evaluationCriteria || "Responses will be evaluated based on alignment with company values."
      };
    }

    // Fallback to default structure
    console.log("🔍 Using fallback structure");
    
    // Default scenarios if none are provided
    const defaultScenarios = [
      {
        id: "cs1",
        title: "Deadline Pressure",
        scenario: "Your team is facing a tight deadline and a colleague suggests cutting corners on quality to meet it. How would you respond?",
        category: "Integrity",
        expectedResponse: "Should discuss concerns openly, propose alternatives, escalate if necessary",
        evaluationCriteria: [
          "Maintains quality standards",
          "Communicates concerns effectively",
          "Seeks collaborative solutions",
          "Shows integrity under pressure",
        ],
        timeLimitMinutes: 5,
        wordLimit: { min: 200, max: 300 },
      },
      {
        id: "cs2",
        title: "Team Conflict",
        scenario: "Two team members have a disagreement about the direction of a project and ask for your input. How do you handle this?",
        category: "Collaboration",
        expectedResponse: "Listen to both sides, facilitate discussion, focus on project goals",
        evaluationCriteria: [
          "Remains neutral and objective",
          "Facilitates open communication",
          "Focuses on solutions",
          "Considers all perspectives",
        ],
        timeLimitMinutes: 5,
        wordLimit: { min: 200, max: 300 },
      }
    ];
    
    const scenarios = configData.culturalScenarios || configData.scenarios || defaultScenarios;
    console.log("🔍 Using scenarios:", scenarios);
    
    // Use the duration from backend if provided, otherwise calculate it
    let calculatedDuration = 45; // Default fallback
    
    if (configData.duration && !isNaN(Number(configData.duration))) {
      calculatedDuration = Number(configData.duration);
      console.log("✅ Using duration from backend:", calculatedDuration);
    } else {
      // Calculate duration based on questions and scenarios (fallback calculation)
      const cultureQuestions = configData.cultureQuestions || configData.questions || [];
      const culturalScenarios = scenarios;
      const timePerQuestion = configData.assessmentSettings?.timePerQuestionSeconds || 60;
      
      // Calculate time for game questions (in minutes)
      const gameQuestionsTime = cultureQuestions.length * (timePerQuestion / 60);
      
      // Calculate time for scenarios (in minutes)
      const scenariosTime = culturalScenarios.reduce((total: number, scenario: any) => {
        return total + (scenario.timeLimitMinutes || 5);
      }, 0);
      
      // Round up to get exact calculation
      calculatedDuration = Math.ceil(gameQuestionsTime + scenariosTime);
      
      // Ensure minimum duration
      if (calculatedDuration < 15) {
        calculatedDuration = 15;
      }
      
      console.log("🔍 Frontend fallback duration calculation:", {
        gameQuestionsCount: cultureQuestions.length,
        scenariosCount: culturalScenarios.length,
        timePerQuestionSeconds: timePerQuestion,
        gameQuestionsTimeMinutes: gameQuestionsTime,
        scenariosTimeMinutes: scenariosTime,
        calculatedDuration
      });
    }
    
    return {
      name: configData.name || "Culture Fit Assessment",
      description: configData.description || "Assessment to evaluate cultural alignment and values fit",
      companyValues: configData.companyValues || [],
      cultureQuestions: configData.cultureQuestions || configData.questions || [],
      culturalScenarios: scenarios,
      duration: calculatedDuration,
      assessmentSettings: configData.assessmentSettings || {
        timePerQuestionSeconds: 60,
        shuffleQuestions: false,
        showExplanations: false
      },
      instructions: configData.instructions || "Please answer all questions honestly and thoughtfully.",
      evaluationCriteria: configData.evaluationCriteria || "Responses will be evaluated based on alignment with company values."
    };
  };

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Loading assessment for ID: ${assessmentId}`);
      
      // Parse assessment ID to get round and user info
      // Format: {roundId}-{userId}-{timestamp}
      // Since both roundId and userId are GUIDs, we need to parse carefully
      const parts = assessmentId.split('-');
      
      if (parts.length < 7) { // GUID has 5 parts, so we need at least 7 parts total
        throw new Error('Invalid assessment ID format');
      }
      
      // roundId is the first 5 parts (GUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const roundId = parts.slice(0, 5).join('-');
      // userId is the next 5 parts (another GUID)
      const userId = parts.slice(5, 10).join('-');
      // timestamp is the last part
      const timestamp = parts[10];
      
      // Fetch assessment data from backend
      const url = `http://localhost:5189/assessments/${roundId}/configuration`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`🔍 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to load assessment: ${response.status} ${errorText}`);
      }
      
      const responseData = await response.json();
      
      // Extract the configuration data from the response
      const configData = responseData.data || responseData;
      
      // Transform the configuration data to match expected format
      const transformedConfig = transformConfigData(configData);
      
      // Create assessment data structure
      const assessmentData = {
        id: assessmentId,
        jobId: jobId,
        roundId: roundId,
        candidateId: userId,
        configuration: transformedConfig,
        status: "pending" as const,
        startedAt: undefined,
        completedAt: undefined
      };
      
      setAssessment(assessmentData);
    } catch (err) {
      console.error(`Error loading assessment:`, err);
      setError(err instanceof Error ? err.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentComplete = async (results: any) => {
    if (submitting) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Parse assessment ID to get round and user info
      const parts = assessmentId.split('-');
      
      if (parts.length < 7) {
        throw new Error('Invalid assessment ID format');
      }
      
      const roundId = parts.slice(0, 5).join('-');
      const userId = parts.slice(5, 10).join('-');
      
      console.log('🔍 Submitting for roundId:', roundId);
      console.log('🔍 Submitting for userId:', userId);
      console.log('🔍 Assessment ID parts:', parts);
      console.log('🔍 User ID from parts:', userId);
      console.log('🔍 User ID length:', userId.length);
      console.log('🔍 User ID format check:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId));
      
      // Submit results to backend
      const response = await fetch(`http://localhost:5189/assessments/${roundId}/submit`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: userId,
          results: results
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Submission failed:', errorText);
        throw new Error(`Failed to submit assessment: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ Submission successful:', responseData);

      // Redirect to completion page immediately without changing loading state
      router.push(`/applicant/jobs/${jobId}/application-success/assessment/${assessmentId}/complete`);
      // Don't set submitting to false here - let the redirect handle it
    } catch (err) {
      console.error('❌ Assessment submission error:', err);
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
      setSubmitting(false); // Only set to false on error
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
        <div className="max-w-md mx-auto text-center">
          <ErrorMessage message={error} />
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
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
    <div className="min-h-screen bg-gray-50 relative">
      <CultureFitAssessment
        assessment={assessment}
        onComplete={handleAssessmentComplete}
      />
      
      {/* Submission Loading State */}
      {submitting && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Submitting your assessment...</p>
          </div>
        </div>
      )}
    </div>
  );
}

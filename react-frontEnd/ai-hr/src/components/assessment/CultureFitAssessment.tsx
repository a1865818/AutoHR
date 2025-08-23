"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GameQuestionsSection } from "./GameQuestionsSection";
import { ScenarioQuestionsSection } from "./ScenarioQuestionsSection";
import { AssessmentTimer } from "./AssessmentTimer";
import { AssessmentProgress } from "./AssessmentProgress";
import { AssessmentInstructions } from "./AssessmentInstructions";

interface CultureFitConfiguration {
  name: string;
  description: string;
  companyValues: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
    indicators: string[];
  }>;
  cultureQuestions: Array<{
    id: string;
    text: string;
    trait: string;
    type: "multiple_choice" | "rank_scenario" | "slider" | "open_ended";
    weight: number;
    maxScore: number;
    options?: Array<{
      id: string;
      text: string;
      isCorrect?: boolean;
      score?: number;
    }>;
  }>;
  culturalScenarios: Array<{
    id: string;
    title: string;
    scenario: string;
    category: string;
    expectedResponse: string;
    evaluationCriteria: string[];
    timeLimitMinutes: number;
    wordLimit: {
      min: number;
      max: number;
    };
  }>;
  duration: number;
  assessmentSettings: {
    timePerQuestionSeconds: number;
    shuffleQuestions: boolean;
    showExplanations: boolean;
  };
  instructions: string;
  evaluationCriteria: string;
}

interface AssessmentData {
  id: string;
  jobId: string;
  roundId: string;
  candidateId: string;
  configuration: CultureFitConfiguration;
  status: "pending" | "in_progress" | "completed";
  startedAt?: string;
  completedAt?: string;
}

interface AssessmentResults {
  gameAnswers: Array<{
    questionId: string;
    answer: any;
    timeSpent: number;
  }>;
  scenarioAnswers: Array<{
    scenarioId: string;
    response: string;
    timeSpent: number;
    wordCount: number;
  }>;
  totalTimeSpent: number;
  completedAt: string;
}

interface CultureFitAssessmentProps {
  assessment: AssessmentData;
  onComplete: (results: AssessmentResults) => void;
}

export function CultureFitAssessment({ assessment, onComplete }: CultureFitAssessmentProps) {
  const [currentPhase, setCurrentPhase] = useState<"instructions" | "game" | "scenarios" | "complete">("instructions");
  const [gameAnswers, setGameAnswers] = useState<AssessmentResults["gameAnswers"]>([]);
  const [scenarioAnswers, setScenarioAnswers] = useState<AssessmentResults["scenarioAnswers"]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isPaused, setIsPaused] = useState(false);

  const config = assessment.configuration;
  const totalDuration = config.duration * 60; // Convert to seconds

  // Timer effect
  useEffect(() => {
    if (currentPhase === "game" || currentPhase === "scenarios") {
      const interval = setInterval(() => {
        if (!isPaused) {
          setCurrentTime(new Date());
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentPhase, isPaused]);

  // Calculate remaining time
  const getRemainingTime = useCallback(() => {
    if (!startTime) return totalDuration;
    
    const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    return Math.max(0, totalDuration - elapsed);
  }, [startTime, currentTime, totalDuration]);

  // Check if time is up
  useEffect(() => {
    if (getRemainingTime() <= 0 && (currentPhase === "game" || currentPhase === "scenarios")) {
      handleTimeUp();
    }
  }, [getRemainingTime, currentPhase]);

  const handleStartAssessment = () => {
    setStartTime(new Date());
    setCurrentPhase("game");
  };

  const handleGameComplete = (answers: AssessmentResults["gameAnswers"]) => {
    setGameAnswers(answers);
    
    if (config.culturalScenarios.length > 0) {
      setCurrentPhase("scenarios");
    } else {
      handleComplete();
    }
  };

  const handleScenariosComplete = (answers: AssessmentResults["scenarioAnswers"]) => {
    setScenarioAnswers(answers);
    handleComplete();
  };

  const handleTimeUp = () => {
    // Auto-submit with current answers
    handleComplete();
  };

  const handleComplete = () => {
    const results: AssessmentResults = {
      gameAnswers,
      scenarioAnswers,
      totalTimeSpent: startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0,
      completedAt: new Date().toISOString(),
    };

    onComplete(results);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const getCurrentPhaseTitle = () => {
    switch (currentPhase) {
      case "instructions":
        return "Assessment Instructions";
      case "game":
        return "Game-Based Questions";
      case "scenarios":
        return "Cultural Scenarios";
      default:
        return "Assessment";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {config.name}
              </h1>
              <span className="text-sm text-gray-500">
                {getCurrentPhaseTitle()}
              </span>
            </div>
            
            {(currentPhase === "game" || currentPhase === "scenarios") && (
              <div className="flex items-center space-x-4">
                <AssessmentTimer
                  remainingTime={getRemainingTime()}
                  totalTime={totalDuration}
                  isPaused={isPaused}
                  onPause={handlePause}
                  onResume={handleResume}
                />
                <AssessmentProgress
                  currentPhase={currentPhase}
                  gameProgress={gameAnswers.length / config.cultureQuestions.length}
                  scenarioProgress={scenarioAnswers.length / config.culturalScenarios.length}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPhase === "instructions" && (
          <AssessmentInstructions
            config={config}
            onStart={handleStartAssessment}
          />
        )}

        {currentPhase === "game" && (
          <GameQuestionsSection
            questions={config.cultureQuestions}
            timePerQuestion={config.assessmentSettings.timePerQuestionSeconds}
            onComplete={handleGameComplete}
            onTimeUp={handleTimeUp}
          />
        )}

        {currentPhase === "scenarios" && (
          <ScenarioQuestionsSection
            scenarios={config.culturalScenarios}
            onComplete={handleScenariosComplete}
            onTimeUp={handleTimeUp}
          />
        )}
      </div>
    </div>
  );
}

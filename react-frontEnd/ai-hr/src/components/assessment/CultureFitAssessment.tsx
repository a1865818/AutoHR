"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GameQuestionsSection } from "./GameQuestionsSection";
import { ScenarioQuestionsSection } from "./ScenarioQuestionsSection";

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
  assessmentMethods?: {
    cultureScenarios?: boolean;
    valuesAlignment?: boolean;
    personalityAssessment?: boolean;
    teamExercise?: boolean;
    peerInterview?: boolean;
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


  const config = assessment.configuration;
  const totalDuration = (Number(config.duration) || 45) * 60; // Convert to seconds, ensure duration is a number

  // Fallback scenarios if none are provided in configuration
  // Check if scenarios are enabled in assessment methods - handle both boolean and string values
  const cultureScenariosValue = config.assessmentMethods?.cultureScenarios;
  let scenariosEnabled = false;
  
  if (typeof cultureScenariosValue === 'boolean') {
    scenariosEnabled = cultureScenariosValue === true;
  } else if (typeof cultureScenariosValue === 'string') {
    scenariosEnabled = cultureScenariosValue === 'true' || cultureScenariosValue === '1';
  } else if (typeof cultureScenariosValue === 'number') {
    scenariosEnabled = cultureScenariosValue === 1;
  }
  console.log('🔍 Assessment - config.assessmentMethods:', config.assessmentMethods);
  console.log('🔍 Assessment - cultureScenariosValue:', cultureScenariosValue, typeof cultureScenariosValue);
  console.log('🔍 Assessment - scenariosEnabled:', scenariosEnabled);
  console.log('🔍 Assessment - config.culturalScenarios.length:', config.culturalScenarios?.length || 0);
  
  const effectiveScenarios = scenariosEnabled && config.culturalScenarios && config.culturalScenarios.length > 0 
    ? config.culturalScenarios 
    : [];
  console.log('🔍 Assessment - effectiveScenarios.length:', effectiveScenarios.length);

  // Create effective config with fallback scenarios
  const effectiveConfig = {
    ...config,
    culturalScenarios: effectiveScenarios
  };


  const handleStartAssessment = () => {
    setStartTime(new Date());
    setCurrentPhase("game");
  };

  const handleGameComplete = (answers: AssessmentResults["gameAnswers"]) => {
    setGameAnswers(answers);
    
    if (effectiveConfig.culturalScenarios.length > 0) {
      setCurrentPhase("scenarios");
    } else {
      handleComplete();
    }
  };

  const handleScenariosComplete = (answers: AssessmentResults["scenarioAnswers"]) => {
    setScenarioAnswers(answers);
    handleComplete(answers);
  };

  const handleTimeUp = () => {
    // Auto-submit with current answers
    // If we're in scenarios phase and have some scenario answers, preserve them
    if (currentPhase === "scenarios" && scenarioAnswers.length > 0) {
      // We already have some scenario answers, complete with what we have
      handleComplete();
    } else if (currentPhase === "scenarios" && scenarioAnswers.length === 0) {
      // We're in scenarios phase but have no answers - this might indicate an issue
      handleComplete();
    } else {
      // We're in game phase or haven't reached scenarios yet
      handleComplete();
    }
  };

  const handleComplete = (scenarioAnswersOverride?: AssessmentResults["scenarioAnswers"]) => {
    const finalScenarioAnswers = scenarioAnswersOverride || scenarioAnswers;
    
    const results: AssessmentResults = {
      gameAnswers,
      scenarioAnswers: finalScenarioAnswers,
      totalTimeSpent: startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0,
      completedAt: new Date().toISOString(),
    };

    onComplete(results);
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
                <AssessmentProgress
                  currentPhase={currentPhase}
                  gameProgress={gameAnswers.length / config.cultureQuestions.length}
                  scenarioProgress={scenarioAnswers.length / effectiveConfig.culturalScenarios.length}
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
            scenarios={effectiveConfig.culturalScenarios}
            onComplete={handleScenariosComplete}
            onTimeUp={handleTimeUp}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ScenarioQuestion } from "./questions/ScenarioQuestion";

interface Scenario {
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
}

interface ScenarioAnswer {
  scenarioId: string;
  response: string;
  timeSpent: number;
  wordCount: number;
}

interface ScenarioQuestionsSectionProps {
  scenarios: Scenario[];
  onComplete: (answers: ScenarioAnswer[]) => void;
  onTimeUp: () => void;
}

export function ScenarioQuestionsSection({ 
  scenarios, 
  onComplete, 
  onTimeUp 
}: ScenarioQuestionsSectionProps) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [answers, setAnswers] = useState<ScenarioAnswer[]>([]);
  const [shuffledScenarios, setShuffledScenarios] = useState<Scenario[]>([]);

  // Shuffle scenarios if needed
  useEffect(() => {
    const shuffled = [...scenarios].sort(() => Math.random() - 0.5);
    setShuffledScenarios(shuffled);
  }, [scenarios]);

  const currentScenario = shuffledScenarios[currentScenarioIndex];

  const handleScenarioComplete = (answer: ScenarioAnswer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Move to next scenario or complete
    if (currentScenarioIndex < shuffledScenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  const handleScenarioTimeUp = () => {
    // Auto-submit current scenario with empty response
    const emptyAnswer: ScenarioAnswer = {
      scenarioId: currentScenario.id,
      response: "",
      timeSpent: currentScenario.timeLimitMinutes * 60,
      wordCount: 0,
    };
    handleScenarioComplete(emptyAnswer);
  };

  const handleSkip = () => {
    const skipAnswer: ScenarioAnswer = {
      scenarioId: currentScenario.id,
      response: "",
      timeSpent: 0,
      wordCount: 0,
    };
    handleScenarioComplete(skipAnswer);
  };

  if (!currentScenario) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading scenarios...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Scenario {currentScenarioIndex + 1} of {shuffledScenarios.length}
            </h2>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              {currentScenario.category}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Time limit: {currentScenario.timeLimitMinutes} minutes
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentScenarioIndex + 1) / shuffledScenarios.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Scenario Content */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <ScenarioQuestion
          scenario={currentScenario}
          onComplete={handleScenarioComplete}
          onTimeUp={handleScenarioTimeUp}
          onSkip={handleSkip}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentScenarioIndex(Math.max(0, currentScenarioIndex - 1))}
          disabled={currentScenarioIndex === 0}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

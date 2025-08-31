"use client";

import React, { useState } from "react";

interface Option {
  id: string;
  text: string;
  desiredOrder?: number;
}

interface Question {
  id: string;
  text: string;
  trait: string;
  type: "multiple_choice" | "rank_scenario" | "slider" | "open_ended";
  weight: number;
  maxScore: number;
  options?: Option[];
}

interface RankScenarioQuestionProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
}

export function RankScenarioQuestion({ question, onAnswer }: RankScenarioQuestionProps) {
  const [rankedOptions, setRankedOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);

  const unrankedOptions = question.options?.filter(option => !rankedOptions.includes(option.id)) || [];

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    const newRankedOptions = [...rankedOptions, optionId];
    setRankedOptions(newRankedOptions);
    
    // Remove auto-save - let users continue working on their ranking
    // Only submit when they explicitly click "Next Question"
  };

  const handleOptionRemove = (optionId: string) => {
    if (isAnswered) return;
    setRankedOptions(rankedOptions.filter(id => id !== optionId));
  };

  const handleNext = () => {
    if (rankedOptions.length > 0 && !isAnswered) {
      setIsAnswered(true);
      onAnswer(rankedOptions);
    }
  };

  const handleReset = () => {
    if (!isAnswered) {
      setRankedOptions([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div>
        <h3 className="text-xl font-medium text-gray-900 mb-4">
          {question.text}
        </h3>
        <p className="text-sm text-gray-500">
          Click on options to add them to your ranking. You can reorder or remove items until you're satisfied, then click "Next Question" to continue.
        </p>
      </div>

      {/* Ranked Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Your Ranking (Most to Least Likely):</h4>
        {rankedOptions.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            No options ranked yet. Click on options below to add them to your ranking.
          </div>
        ) : (
          <div className="space-y-2">
            {rankedOptions.map((optionId, index) => {
              const option = question.options?.find(opt => opt.id === optionId);
              return (
                <div
                  key={optionId}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-900">{option?.text}</span>
                  </div>
                  <button
                    onClick={() => handleOptionRemove(optionId)}
                    disabled={isAnswered}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unranked Options */}
      {unrankedOptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Available Options:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unrankedOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={isAnswered}
                className="p-3 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset Button */}
      {rankedOptions.length > 0 && !isAnswered && (
        <div className="flex justify-start pt-6 border-t">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Reset Ranking
          </button>
        </div>
      )}

      {/* Next Button */}
      {rankedOptions.length > 0 && !isAnswered && (
        <div className="flex justify-end pt-6 border-t">
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Next Question
          </button>
        </div>
      )}

      {/* Answer Status */}
      {isAnswered && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Answer submitted. Moving to next question...
          </p>
        </div>
      )}
    </div>
  );
}

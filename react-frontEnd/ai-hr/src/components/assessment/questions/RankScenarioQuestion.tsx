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
  onSkip: () => void;
}

export function RankScenarioQuestion({ question, onAnswer, onSkip }: RankScenarioQuestionProps) {
  const [rankedOptions, setRankedOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);

  const unrankedOptions = question.options?.filter(option => !rankedOptions.includes(option.id)) || [];

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    setRankedOptions([...rankedOptions, optionId]);
  };

  const handleOptionRemove = (optionId: string) => {
    if (isAnswered) return;
    setRankedOptions(rankedOptions.filter(id => id !== optionId));
  };

  const handleSubmit = () => {
    if (rankedOptions.length > 0 && !isAnswered) {
      setIsAnswered(true);
      onAnswer(rankedOptions);
    }
  };

  const handleSkip = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      onSkip();
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
          Drag and drop the options to rank them from most likely to least likely. Click on an option to add it to your ranking.
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

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex space-x-3">
          <button
            onClick={handleSkip}
            disabled={isAnswered}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          
          <button
            onClick={handleReset}
            disabled={isAnswered || rankedOptions.length === 0}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={rankedOptions.length === 0 || isAnswered}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Ranking
        </button>
      </div>
    </div>
  );
}

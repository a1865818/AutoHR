"use client";

import React, { useState } from "react";

interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
  score?: number;
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

interface MultipleChoiceQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
}

export function MultipleChoiceQuestion({ question, onAnswer }: MultipleChoiceQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
  };

  const handleNext = () => {
    if (selectedOption && !isAnswered) {
      setIsAnswered(true);
      onAnswer(selectedOption);
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
          Select the option that best represents your response.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options?.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionSelect(option.id)}
            disabled={isAnswered}
            className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
              selectedOption === option.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            } ${isAnswered ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedOption === option.id
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300"
              }`}>
                {selectedOption === option.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-gray-900">{option.text}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Next Button */}
      {selectedOption && !isAnswered && (
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

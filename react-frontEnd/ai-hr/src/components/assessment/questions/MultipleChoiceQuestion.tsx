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
  onSkip: () => void;
}

export function MultipleChoiceQuestion({ question, onAnswer, onSkip }: MultipleChoiceQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (selectedOption && !isAnswered) {
      setIsAnswered(true);
      onAnswer(selectedOption);
    }
  };

  const handleSkip = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      onSkip();
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

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={handleSkip}
          disabled={isAnswered}
          className="px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Skip
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || isAnswered}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";

interface Question {
  id: string;
  text: string;
  trait: string;
  type: "multiple_choice" | "rank_scenario" | "slider" | "open_ended";
  weight: number;
  maxScore: number;
  leftLabel?: string;
  rightLabel?: string;
  targetRange?: [number, number];
}

interface SliderQuestionProps {
  question: Question;
  onAnswer: (answer: number) => void;
}

export function SliderQuestion({ question, onAnswer }: SliderQuestionProps) {
  const [value, setValue] = useState(5);
  const [isAnswered, setIsAnswered] = useState(false);

  const leftLabel = question.leftLabel || "Strongly Disagree";
  const rightLabel = question.rightLabel || "Strongly Agree";

  const handleSliderChange = (newValue: number) => {
    if (isAnswered) return;
    setValue(newValue);
  };

  const getValueLabel = (val: number) => {
    if (val <= 2) return "Strongly Disagree";
    if (val <= 4) return "Disagree";
    if (val <= 6) return "Neutral";
    if (val <= 8) return "Agree";
    return "Strongly Agree";
  };

  const handleNext = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      onAnswer(value);
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
          Use the slider to indicate your level of agreement with the statement.
        </p>
      </div>

      {/* Slider */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            disabled={isAnswered}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(value - 1) * 11.11}%, #E5E7EB ${(value - 1) * 11.11}%, #E5E7EB 100%)`
            }}
          />
          
          {/* Slider thumb styles */}
          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #3B82F6;
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #3B82F6;
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
          `}</style>
        </div>

        {/* Value Display */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-2xl font-bold text-blue-600">{value}</span>
            <span className="text-sm text-gray-600">/ 10</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {getValueLabel(value)}
          </p>
        </div>
      </div>

      {/* Quick Selection Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            onClick={() => handleSliderChange(num)}
            disabled={isAnswered}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              value === num
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } ${isAnswered ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Next Button */}
      {!isAnswered && (
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

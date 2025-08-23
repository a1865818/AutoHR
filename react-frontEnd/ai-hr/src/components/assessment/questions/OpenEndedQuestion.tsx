"use client";

import React, { useState } from "react";

interface Question {
  id: string;
  text: string;
  trait: string;
  type: "multiple_choice" | "rank_scenario" | "slider" | "open_ended";
  weight: number;
  maxScore: number;
}

interface OpenEndedQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}

export function OpenEndedQuestion({ question, onAnswer, onSkip }: OpenEndedQuestionProps) {
  const [response, setResponse] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);

  const wordCount = response.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = response.length;

  const handleSubmit = () => {
    if (!isAnswered && response.trim()) {
      setIsAnswered(true);
      onAnswer(response.trim());
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
          Please provide a detailed response to the question above.
        </p>
      </div>

      {/* Response Textarea */}
      <div className="space-y-3">
        <label htmlFor="response" className="block text-sm font-medium text-gray-700">
          Your Response
        </label>
        <textarea
          id="response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={isAnswered}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Type your response here..."
        />
        
        {/* Character and Word Count */}
        <div className="flex justify-between text-sm text-gray-500">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
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
          disabled={!response.trim() || isAnswered}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}

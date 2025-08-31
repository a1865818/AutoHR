"use client";

import React, { useState, useEffect } from "react";
import { Clock, FileText } from "lucide-react";

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

interface ScenarioQuestionProps {
  scenario: Scenario;
  onComplete: (answer: ScenarioAnswer) => void;
  onTimeUp: () => void;
}

export function ScenarioQuestion({ scenario, onComplete, onTimeUp }: ScenarioQuestionProps) {
  const [response, setResponse] = useState("");
  const [startTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);

  const wordCount = response.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = response.length;
  const timeSpent = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
  const remainingTime = Math.max(0, scenario.timeLimitMinutes * 60 - timeSpent);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check if time is up
  useEffect(() => {
    if (remainingTime <= 0 && !isSubmitted) {
      onTimeUp();
    }
  }, [remainingTime, isSubmitted, onTimeUp]);

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSubmitted) return;
    const newResponse = e.target.value;
    setResponse(newResponse);
  };

  const handleNext = () => {
    if (!isSubmitted && response.trim()) {
      setIsSubmitted(true);
      const answer: ScenarioAnswer = {
        scenarioId: scenario.id,
        response: response.trim(),
        timeSpent: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
        wordCount: response.trim().split(/\s+/).filter(word => word.length > 0).length,
      };
      onComplete(answer);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordCountColor = () => {
    if (wordCount < scenario.wordLimit.min) return "text-red-600";
    if (wordCount > scenario.wordLimit.max) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Scenario Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {scenario.title}
          </h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {scenario.category}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingTime)} remaining</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="w-4 h-4" />
            <span>{wordCount} / {scenario.wordLimit.max} words</span>
          </div>
        </div>
      </div>

      {/* Scenario Description */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Scenario:</h4>
        <p className="text-gray-700 whitespace-pre-wrap">{scenario.scenario}</p>
      </div>

      {/* Response Section */}
      <div className="space-y-3">
        <label htmlFor="scenario-response" className="block text-sm font-medium text-gray-700">
          Your Response
        </label>
        <textarea
          id="scenario-response"
          value={response}
          onChange={handleResponseChange}
          disabled={isSubmitted}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Please provide your response to the scenario above..."
        />
        
        {/* Word Count and Time */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className={getWordCountColor()}>
              {wordCount} words
              {wordCount < scenario.wordLimit.min && ` (minimum: ${scenario.wordLimit.min})`}
              {wordCount > scenario.wordLimit.max && ` (maximum: ${scenario.wordLimit.max})`}
            </span>
            <span className="text-gray-500">{charCount} characters</span>
          </div>
          <span className="text-gray-500">
            Time spent: {formatTime(timeSpent)}
          </span>
        </div>
      </div>

      {/* Evaluation Criteria */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">What we're looking for:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          {scenario.evaluationCriteria.map((criteria, index) => (
            <li key={index}>{criteria}</li>
          ))}
        </ul>
      </div>

      {/* Next Button */}
      {response.trim() && !isSubmitted && (
        <div className="flex justify-end pt-6 border-t">
          <button
            onClick={handleNext}
            disabled={wordCount < scenario.wordLimit.min}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Scenario
          </button>
        </div>
      )}

      {/* Answer Status */}
      {isSubmitted && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Response submitted. Moving to next scenario...
          </p>
        </div>
      )}
    </div>
  );
}

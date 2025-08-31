"use client";

import React from "react";
import { Clock, FileText, CheckCircle, AlertCircle } from "lucide-react";

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

interface AssessmentInstructionsProps {
  config: CultureFitConfiguration;
  onStart: () => void;
}

export function AssessmentInstructions({ config, onStart }: AssessmentInstructionsProps) {
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {config.name}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {config.description}
        </p>
      </div>

      {/* Assessment Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Total Duration</p>
              <p className="text-sm text-gray-600">{formatTime(config.duration)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Game Questions</p>
              <p className="text-sm text-gray-600">{config.cultureQuestions?.length || 0} questions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Scenarios</p>
              <p className="text-sm text-gray-600">{config.culturalScenarios?.length || 0} scenarios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
        <div className="prose prose-gray max-w-none">
          <div className="whitespace-pre-wrap text-gray-700">{config.instructions || "No instructions available."}</div>
        </div>
      </div>

      {/* Question Types */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Types</h2>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Game-Based Questions</h3>
            <p className="text-sm text-gray-600 mb-3">
              You'll encounter different types of questions designed to assess your cultural fit:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Multiple Choice:</strong> Select the best option from the given choices</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Rank Scenario:</strong> Order options from most to least likely</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Slider:</strong> Rate your agreement on a scale of 1-10</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Open Ended:</strong> Provide a detailed written response</span>
              </li>
            </ul>
          </div>

          {config.culturalScenarios?.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Cultural Scenarios</h3>
              <p className="text-sm text-gray-600 mb-3">
                You'll be presented with workplace scenarios and asked to provide written responses:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>Each scenario has a specific time limit</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>Word limits apply to your responses</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>Focus on demonstrating the company values</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Company Values */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Values We Assess</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.companyValues?.map((value) => (
            <div key={value.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{value.name}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Weight: {value.weight}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{value.description}</p>
              {value.indicators?.length > 0 && (
                <div className="text-xs text-gray-500">
                  <strong>Indicators:</strong> {value.indicators.slice(0, 2).join(", ")}
                  {value.indicators.length > 2 && "..."}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900 mb-2">Important Notes</h3>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• You cannot go back to previous questions once submitted</li>
              <li>• The assessment will auto-submit when time runs out</li>
              <li>• Ensure you have a stable internet connection</li>
              <li>• You can pause the assessment if needed</li>
              <li>• Be honest and authentic in your responses</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <button
          onClick={onStart}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 text-lg font-medium"
        >
          Start Assessment
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Click to begin your {formatTime(config.duration)} assessment
        </p>
      </div>
    </div>
  );
}

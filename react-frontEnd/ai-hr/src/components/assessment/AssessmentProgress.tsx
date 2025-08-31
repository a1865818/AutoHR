"use client";

import React from "react";
import { CheckCircle, Circle } from "lucide-react";

interface AssessmentProgressProps {
  currentPhase: "instructions" | "game" | "scenarios" | "complete";
  gameProgress: number;
  scenarioProgress: number;
}

export function AssessmentProgress({ 
  currentPhase, 
  gameProgress, 
  scenarioProgress 
}: AssessmentProgressProps) {
  const phases = [
    { id: "instructions", label: "Instructions", completed: currentPhase !== "instructions" },
    { id: "game", label: "Game Questions", completed: currentPhase === "scenarios" || currentPhase === "complete", progress: gameProgress },
    { id: "scenarios", label: "Scenarios", completed: currentPhase === "complete", progress: scenarioProgress },
  ];

  return (
    <div className="flex items-center space-x-4">
      {phases.map((phase, index) => (
        <div key={phase.id} className="flex items-center space-x-2">
          {/* Phase Icon */}
          <div className="flex items-center justify-center w-6 h-6">
            {phase.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className={`w-5 h-5 ${
                currentPhase === phase.id ? "text-blue-600" : "text-gray-400"
              }`} />
            )}
          </div>

          {/* Phase Label */}
          <span className={`text-sm font-medium ${
            currentPhase === phase.id 
              ? "text-blue-600" 
              : phase.completed 
                ? "text-green-600" 
                : "text-gray-500"
          }`}>
            {phase.label}
          </span>

          {/* Progress for current phase */}
          {currentPhase === phase.id && phase.progress !== undefined && (
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${phase.progress * 100}%` }}
              />
            </div>
          )}

          {/* Separator */}
          {index < phases.length - 1 && (
            <div className="w-4 h-px bg-gray-300" />
          )}
        </div>
      ))}
    </div>
  );
}

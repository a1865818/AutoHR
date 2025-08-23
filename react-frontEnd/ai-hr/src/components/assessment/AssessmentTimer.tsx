"use client";

import React, { useState, useEffect } from "react";
import { Clock, Pause, Play } from "lucide-react";

interface AssessmentTimerProps {
  remainingTime: number;
  totalTime: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
}

export function AssessmentTimer({ 
  remainingTime, 
  totalTime, 
  isPaused, 
  onPause, 
  onResume 
}: AssessmentTimerProps) {
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Update warning states based on remaining time
  useEffect(() => {
    const warningThreshold = totalTime * 0.2; // 20% of total time
    const criticalThreshold = totalTime * 0.1; // 10% of total time

    setIsWarning(remainingTime <= warningThreshold && remainingTime > criticalThreshold);
    setIsCritical(remainingTime <= criticalThreshold);
  }, [remainingTime, totalTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((totalTime - remainingTime) / totalTime) * 100;
  };

  const getTimerColor = () => {
    if (isCritical) return "text-red-600";
    if (isWarning) return "text-orange-600";
    return "text-gray-900";
  };

  const getProgressColor = () => {
    if (isCritical) return "bg-red-500";
    if (isWarning) return "bg-orange-500";
    return "bg-blue-500";
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Timer Display */}
      <div className="flex items-center space-x-2">
        <Clock className={`w-5 h-5 ${getTimerColor()}`} />
        <span className={`text-lg font-mono font-semibold ${getTimerColor()}`}>
          {formatTime(remainingTime)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Pause/Resume Button */}
      <button
        onClick={isPaused ? onResume : onPause}
        className={`p-2 rounded-md transition-colors ${
          isPaused 
            ? "bg-green-100 text-green-600 hover:bg-green-200" 
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        title={isPaused ? "Resume Assessment" : "Pause Assessment"}
      >
        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </button>

      {/* Status Indicator */}
      {isPaused && (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          PAUSED
        </span>
      )}
      
      {isCritical && !isPaused && (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full animate-pulse">
          TIME CRITICAL
        </span>
      )}
    </div>
  );
}

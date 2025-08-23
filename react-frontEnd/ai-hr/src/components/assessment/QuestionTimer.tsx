"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface QuestionTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
}

export function QuestionTimer({ duration, onTimeUp }: QuestionTimerProps) {
  const [remainingTime, setRemainingTime] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        
        // Update warning states
        const warningThreshold = duration * 0.3; // 30% of time
        const criticalThreshold = duration * 0.1; // 10% of time
        
        setIsWarning(newTime <= warningThreshold && newTime > criticalThreshold);
        setIsCritical(newTime <= criticalThreshold);
        
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((duration - remainingTime) / duration) * 100;
  };

  const getTimerColor = () => {
    if (isCritical) return "text-red-600";
    if (isWarning) return "text-orange-600";
    return "text-gray-600";
  };

  const getProgressColor = () => {
    if (isCritical) return "bg-red-500";
    if (isWarning) return "bg-orange-500";
    return "bg-blue-500";
  };

  return (
    <div className="flex items-center space-x-2">
      <Clock className={`w-4 h-4 ${getTimerColor()}`} />
      <span className={`text-sm font-mono font-medium ${getTimerColor()}`}>
        {formatTime(remainingTime)}
      </span>
      
      {/* Progress bar */}
      <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      {/* Warning indicator */}
      {isCritical && (
        <span className="px-1 py-0.5 bg-red-100 text-red-800 text-xs rounded animate-pulse">
          !
        </span>
      )}
    </div>
  );
}

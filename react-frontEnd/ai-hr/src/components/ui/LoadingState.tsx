"use client";

import { Loader2 } from "lucide-react";
import React from "react";

interface LoadingStateProps {
  message?: string;
  minHeightClass?: string; // e.g., "min-h-screen", "min-h-[60vh]"
}

export function LoadingState({
  message = "Loading...",
  minHeightClass = "min-h-screen",
}: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center ${minHeightClass}`}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

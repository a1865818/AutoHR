import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      <span className="text-red-800 font-medium">{message}</span>
    </div>
  );
}

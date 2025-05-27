"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div
        className={`flex items-center p-4 rounded-md shadow-lg max-w-sm ${
          type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 mr-3 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 mr-3 text-red-600" />
        )}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className={`ml-3 text-sm ${
            type === "success" ? "text-green-600" : "text-red-600"
          } hover:opacity-75`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

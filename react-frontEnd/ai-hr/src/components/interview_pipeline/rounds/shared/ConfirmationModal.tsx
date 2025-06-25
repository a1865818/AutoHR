import React, { useEffect, useRef } from "react";
import { AlertCircle, AlertTriangle, ArrowLeft, X } from "lucide-react";

interface ConfirmationBannerProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmType: "warning" | "danger" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmType = "warning",
  onConfirm,
  onCancel,
}: ConfirmationBannerProps) {
  if (!isOpen) return null;

  // Determine styles based on type
  const getTypeStyles = () => {
    switch (confirmType) {
      case "danger":
        return {
          icon: AlertCircle,
          iconColor: "text-red-500",
          buttonBg: "bg-red-600 hover:bg-red-700",
          bannerBg: "bg-red-50 border-red-200",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-amber-500",
          buttonBg: "bg-amber-600 hover:bg-amber-700",
          bannerBg: "bg-amber-50 border-amber-200",
        };
      case "info":
      default:
        return {
          icon: ArrowLeft,
          iconColor: "text-blue-500",
          buttonBg: "bg-blue-600 hover:bg-blue-700",
          bannerBg: "bg-blue-50 border-blue-200",
        };
    }
  };

  const { icon: Icon, iconColor, buttonBg, bannerBg } = getTypeStyles();

  return (
    <div className={`mb-6 rounded-lg border ${bannerBg} p-4 animate-slideIn`}>
      <div className="flex justify-between items-start">
        <div className="flex">
          <Icon className={`h-5 w-5 ${iconColor} mt-0.5 mr-3`} />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>

        <div className="ml-6 flex items-center space-x-3">
          <button
            type="button"
            className="px-3 py-1.5 border border-gray-300 text-sm text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm text-white rounded-md transition-colors ${buttonBg}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

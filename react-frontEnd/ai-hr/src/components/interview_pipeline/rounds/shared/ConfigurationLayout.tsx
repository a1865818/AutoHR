"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  RotateCcw,
  ArrowLeft,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  FileText,
} from "lucide-react";

interface ConfigurationLayoutProps {
  title: string;
  subtitle?: string;
  roundType: string;
  jobTitle: string;
  duration: number;
  hasUnsavedChanges: boolean;
  isValid: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
  onBack: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  status?: "not_configured" | "draft" | "configured" | "active" | "archived";
}

export function ConfigurationLayout({
  title,
  subtitle,
  roundType,
  jobTitle,
  duration,
  hasUnsavedChanges,
  isValid,
  saving,
  onSave,
  onReset,
  onBack,
  children,
  actions,
  status = "not_configured",
}: ConfigurationLayoutProps) {
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Monitor sidebar collapse state
  useEffect(() => {
    const checkSidebarState = () => {
      const savedCollapsed = localStorage.getItem("sidebar-collapsed");
      const isCollapsed = savedCollapsed === "true";
      setSidebarCollapsed(isCollapsed);
    };

    checkSidebarState();

    // Listen for localStorage changes and check periodically
    const interval = setInterval(checkSidebarState, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "configured":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          text: "Configured",
        };
      case "draft":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
          text: "Draft",
        };
      case "active":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Users,
          text: "Active",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-600 border-gray-200",
          icon: FileText,
          text: "Not Configured",
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const handleSave = () => {
    if (!isValid) {
      setShowValidationErrors(true);
      return;
    }
    onSave();
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Fixed Header - positioned to avoid sidebar overlap */}
      <div
        className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-[60] shadow-md backdrop-blur-sm bg-white/95 transition-all duration-300 ${
          sidebarCollapsed ? "lg:left-18" : "lg:left-70"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pipeline
              </button>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">{title}</span>
                </div>

                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${statusConfig.color}`}
                >
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {statusConfig.text}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Unsaved changes
                </span>
              )}

              {!isValid && showValidationErrors && (
                <span className="text-sm text-red-600 font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Please fix validation errors
                </span>
              )}

              {actions}

              <button
                onClick={onReset}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </button>

              <button
                onClick={handleSave}
                disabled={saving || (!hasUnsavedChanges && isValid)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Breadcrumb & Meta Info */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Interview Pipeline</span>
              <span>/</span>
              <span className="truncate max-w-xs">{jobTitle}</span>
              <span>/</span>
              <span className="font-medium text-gray-900">{title}</span>
            </div>

           
          </div>

          {subtitle && (
            <div className="mt-2">
              <p className="text-gray-600 text-sm">{subtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content - with top padding to avoid fixed header */}
      <div className="pt-32 pb-6 px-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

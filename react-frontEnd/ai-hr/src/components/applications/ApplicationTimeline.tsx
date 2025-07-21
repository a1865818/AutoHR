"use client";

import React from "react";
import {
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Phone,
  Video,
  Code,
  Crown,
  Heart,
  AlertCircle,
} from "lucide-react";

interface ApplicationTimelineProps {
  status: string;
  stage?: string;
  appliedAt: string;
  statusChangedAt?: string;
  showDetails?: boolean;
}

export function ApplicationTimeline({
  status,
  stage,
  appliedAt,
  statusChangedAt,
  showDetails = false,
}: ApplicationTimelineProps) {
  // Define the standard application stages
  const stages = [
    {
      id: "applied",
      title: "Applied",
      icon: FileText,
      color: "text-blue-600 bg-blue-100",
      status: "completed" as const,
    },
    {
      id: "review",
      title: "Under Review",
      icon: Clock,
      color: "text-yellow-600 bg-yellow-100",
      status: "pending" as const,
    },
    {
      id: "interview",
      title: "Interview",
      icon: Phone,
      color: "text-purple-600 bg-purple-100",
      status: "pending" as const,
    },
    {
      id: "offer",
      title: "Offer",
      icon: Crown,
      color: "text-green-600 bg-green-100",
      status: "pending" as const,
    },
  ];

  // Determine current stage based on status and stage
  const getCurrentStage = () => {
    const statusLower = status?.toLowerCase();
    const stageLower = stage?.toLowerCase();

    if (statusLower === "rejected" || statusLower === "declined") {
      return "rejected";
    }

    if (statusLower === "offer" || statusLower === "accepted") {
      return "offer";
    }

    if (stageLower?.includes("interview") || statusLower === "interview") {
      return "interview";
    }

    if (
      stageLower?.includes("review") ||
      statusLower === "initial_review" ||
      statusLower === "under_review"
    ) {
      return "review";
    }

    return "applied";
  };

  const currentStage = getCurrentStage();

  // Get current stage description
  const getCurrentStageDescription = () => {
    switch (currentStage) {
      case "applied":
        return "Your application has been submitted and is being processed";
      case "review":
        return "Your application is being reviewed by our team";
      case "interview":
        return "You're in the interview process";
      case "offer":
        return "You've received an offer or are in final negotiations";
      default:
        return "";
    }
  };

  // Update stage statuses based on current stage
  const updatedStages = stages.map((stageItem) => {
    if (currentStage === "rejected") {
      return {
        ...stageItem,
        status: stageItem.id === "applied" ? "completed" : ("pending" as const),
      };
    }

    const stageOrder = ["applied", "review", "interview", "offer"];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stageItem.id);

    if (stageIndex < currentIndex) {
      return { ...stageItem, status: "completed" as const };
    } else if (stageIndex === currentIndex) {
      return { ...stageItem, status: "current" as const };
    } else {
      return { ...stageItem, status: "pending" as const };
    }
  });

  const getStatusIcon = (status: "completed" | "current" | "pending") => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "current":
        return <Clock className="h-3 w-3 text-blue-600" />;
      case "pending":
        return <Calendar className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: "completed" | "current" | "pending") => {
    switch (status) {
      case "completed":
        return "border-green-500 bg-green-50";
      case "current":
        return "border-blue-500 bg-blue-50";
      case "pending":
        return "border-gray-300 bg-gray-50";
    }
  };

  // If rejected, show a simple rejected state
  if (currentStage === "rejected") {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
          <span className="text-sm text-red-800 font-medium">
            Application Not Selected
          </span>
        </div>
        {showDetails && (
          <p className="text-xs text-red-700 mt-1">
            Applied {new Date(appliedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      {showDetails && (
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Application Progress
        </h4>
      )}

      <div className="flex items-center space-x-2">
        {updatedStages.map((stageItem, index) => {
          const IconComponent = stageItem.icon;
          const isLast = index === updatedStages.length - 1;

          return (
            <React.Fragment key={stageItem.id}>
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${getStatusColor(
                    stageItem.status
                  )}`}
                >
                  {getStatusIcon(stageItem.status)}
                </div>
                {showDetails && (
                  <span className="ml-2 text-xs text-gray-600 whitespace-nowrap">
                    {stageItem.title}
                  </span>
                )}
              </div>
              {!isLast && <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>}
            </React.Fragment>
          );
        })}
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Applied: {new Date(appliedAt).toLocaleDateString()}</span>
              {statusChangedAt && statusChangedAt !== appliedAt && (
                <span>
                  Updated: {new Date(statusChangedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {getCurrentStageDescription() && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              {getCurrentStageDescription()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

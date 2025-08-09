"use client";

import React from "react";
import {
  CheckCircle,
  Clock,
  Calendar,
  Phone,
  Video,
  Code,
  MessageSquare,
  Crown,
  Heart,
  Users,
  FileText,
  AlertCircle,
} from "lucide-react";
import { InterviewRound, InterviewType } from "@/interfaces/interview";

interface InterviewPipelineTimelineProps {
  rounds: InterviewRound[];
  currentStage?: string;
  applicationStatus: string;
  appliedDate: string;
  statusChangedAt?: string;
}

export function InterviewPipelineTimeline({
  rounds,
  currentStage,
  applicationStatus,
  appliedDate,
  statusChangedAt,
}: InterviewPipelineTimelineProps) {
  const getRoundIcon = (type: InterviewType) => {
    switch (type) {
      case "phone_screening":
        return Phone;
      case "video_interview":
        return Video;
      case "technical_assessment":
      case "coding_challenge":
        return Code;
      case "culture_fit":
        return Heart;
      case "final_interview":
        return Crown;
      default:
        return Users;
    }
  };

  const getRoundColor = (type: InterviewType) => {
    switch (type) {
      case "phone_screening":
        return "text-blue-600 bg-blue-100";
      case "video_interview":
        return "text-purple-600 bg-purple-100";
      case "technical_assessment":
        return "text-orange-600 bg-orange-100";
      case "coding_challenge":
        return "text-red-600 bg-red-100";
      case "culture_fit":
        return "text-pink-600 bg-pink-100";
      case "final_interview":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Improved stage detection logic
  const getApplicationStage = () => {
    const statusLower = applicationStatus?.toLowerCase();
    const stageLower = currentStage?.toLowerCase();

    // Handle rejected applications
    if (statusLower === "rejected" || statusLower === "declined") {
      return "rejected";
    }

    // Handle offer/accepted applications
    if (statusLower === "offer" || statusLower === "accepted") {
      return "offer";
    }

    // Handle interview stages
    if (stageLower?.includes("interview") || statusLower === "interview") {
      return "interview";
    }

    // Handle review stages
    if (
      stageLower?.includes("review") ||
      statusLower === "initial_review" ||
      statusLower === "under_review" ||
      statusLower === "in_progress"
    ) {
      return "review";
    }

    // Default to applied
    return "applied";
  };

  const applicationStage = getApplicationStage();

  const getStageStatus = (stageType: string, index: number) => {
    const stageOrder = ["applied", "review", "interview", "offer"];
    const currentIndex = stageOrder.indexOf(applicationStage);
    const stageIndex = stageOrder.indexOf(stageType);

    if (applicationStage === "rejected") {
      return {
        status: (stageType === "applied" ? "completed" : "pending") as
          | "completed"
          | "current"
          | "pending",
        date: stageType === "applied" ? appliedDate : "Not reached",
        title: getStageTitle(stageType),
        description: getStageDescription(stageType),
      };
    }

    // Always show "Application Submitted" as completed
    if (stageType === "applied") {
      return {
        status: "completed" as const,
        date: appliedDate,
        title: getStageTitle(stageType),
        description: getStageDescription(stageType),
      };
    }

    // Always show "Under Review" as completed if applicant is in any interview round or further
    if (stageType === "review") {
      // If the currentStage is any interview round, mark as completed
      const interviewStages = [
        "Phone Screening",
        "Video Interview",
        "Technical Assessment",
        "Coding Challenge",
        "Culture Fit",
        "Final Interview",
      ];
      if (interviewStages.includes(currentStage || "")) {
        return {
          status: "completed" as const,
          date: statusChangedAt || "Completed",
          title: getStageTitle(stageType),
          description: getStageDescription(stageType),
        };
      }
      // Otherwise, show as current
      return {
        status: "current" as const,
        date: statusChangedAt || "In progress",
        title: getStageTitle(stageType),
        description: getStageDescription(stageType),
      };
    }

    // For other stages, use the original logic
    if (stageIndex < currentIndex) {
      return {
        status: "completed" as const,
        date: stageType === "applied" ? appliedDate : "Completed",
        title: getStageTitle(stageType),
        description: getStageDescription(stageType),
      };
    } else if (stageIndex === currentIndex) {
      return {
        status: "current" as const,
        date: statusChangedAt || "In progress",
        title: getStageTitle(stageType),
        description: getStageDescription(stageType),
      };
    } else {
      return {
        status: "pending" as const,
        date: "Pending",
        title: getStageTitle(stageType),
        description: getStageDescription(stageType),
      };
    }
  };

  const getStageTitle = (stageType: string) => {
    switch (stageType) {
      case "applied":
        return "Application Submitted";
      case "review":
        return "Under Review";
      case "interview":
        return "Interview Process";
      case "offer":
        return "Offer & Decision";
      default:
        return stageType;
    }
  };

  const getStageDescription = (stageType: string) => {
    switch (stageType) {
      case "applied":
        return "Your application has been successfully submitted";
      case "review":
        return "Your application is being reviewed by our team";
      case "interview":
        return "You're in the interview process";
      case "offer":
        return "Final decision and offer stage";
      default:
        return "";
    }
  };

  const getRoundStage = (type: InterviewType): string => {
    switch (type) {
      case "phone_screening":
        return "Phone Screening";
      case "video_interview":
        return "Video Interview";
      case "technical_assessment":
        return "Technical Assessment";
      case "coding_challenge":
        return "Coding Challenge";
      case "culture_fit":
        return "Culture Fit";
      case "final_interview":
        return "Final Interview";
      default:
        return type;
    }
  };

  const isStageCompleted = (
    roundStage: string,
    currentStage?: string
  ): boolean => {
    if (!currentStage) return false;

    const stageOrder = [
      "Phone Screening",
      "Video Interview",
      "Technical Assessment",
      "Coding Challenge",
      "Culture Fit",
      "Final Interview",
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    const roundIndex = stageOrder.indexOf(roundStage);

    return roundIndex < currentIndex;
  };

  const getStatusIcon = (status: "completed" | "current" | "pending") => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "current":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "pending":
        return <Calendar className="h-5 w-5 text-gray-400" />;
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

  // Create timeline items - always include basic stages
  const timelineItems = [
    // Application submitted - always show
    {
      id: "application-submitted",
      type: "application" as const,
      status: getStageStatus("applied", 0),
    },
    // Application under review - always show
    {
      id: "application-review",
      type: "review" as const,
      status: getStageStatus("review", 1),
    },
    // Interview rounds - only show if available
    ...rounds.map((round, index) => {
      const roundStage = getRoundStage(round.type);
      const isCurrentStage = currentStage === roundStage;
      const isCompleted = isStageCompleted(roundStage, currentStage);

      let status: "completed" | "current" | "pending";
      if (isCompleted) {
        status = "completed";
      } else if (isCurrentStage) {
        status = "current";
      } else {
        status = "pending";
      }

      return {
        id: round.id,
        type: "round" as const,
        round,
        status: {
          status,
          date: isCurrentStage
            ? statusChangedAt || "In progress"
            : isCompleted
            ? // Prefer the last status change time; fallback to application applied date
              statusChangedAt || appliedDate
            : "Pending",
          title: roundStage,
          description: isCurrentStage
            ? `You're currently in the ${roundStage} stage`
            : isCompleted
            ? `You've completed the ${roundStage} stage`
            : `The ${roundStage} stage is upcoming`,
        },
      };
    }),
    // Offer stage REMOVED
    // ...(rounds.length > 0 || applicationStage === "offer"
    //   ? [
    //       {
    //         id: "offer-stage",
    //         type: "offer" as const,
    //         status: getStageStatus("offer", 2 + rounds.length),
    //       },
    //     ]
    //   : []),
  ];

  // If rejected, show a special message
  if (applicationStage === "rejected") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-red-100 rounded-lg mr-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Application Status
            </h3>
            <p className="text-sm text-gray-600">
              Your application has been reviewed
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Application submitted - completed */}
          <div className="relative">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center border-green-500 bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg text-blue-600 bg-blue-100">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Application Submitted
                    </h4>
                    <p className="text-sm text-gray-600">
                      Your application has been successfully submitted
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {new Date(appliedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection notice */}
          <div className="relative">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center border-red-500 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg text-red-600 bg-red-100">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Application Not Selected
                    </h4>
                    <p className="text-sm text-gray-600">
                      Thank you for your interest in this position
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {statusChangedAt
                        ? new Date(statusChangedAt).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg mr-3">
          <Calendar className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Application Timeline
          </h3>
          <p className="text-sm text-gray-600">
            Track your progress through the application process
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {timelineItems.map((item, index) => {
          const isLast = index === timelineItems.length - 1;
          let IconComponent: React.ElementType;
          let iconColor: string;

          if (item.type === "round") {
            IconComponent = getRoundIcon(item.round.type);
            iconColor = getRoundColor(item.round.type);
          } else if (item.type === "application") {
            IconComponent = FileText;
            iconColor = "text-blue-600 bg-blue-100";
          } else if (item.type === "review") {
            IconComponent = Clock;
            iconColor = "text-yellow-600 bg-yellow-100";
          } else {
            // fallback for unknown types
            IconComponent = FileText;
            iconColor = "text-gray-600 bg-gray-100";
          }

          return (
            <div key={item.id} className="relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute top-0 left-6 w-0.5 h-full bg-gray-300 -z-10"></div>
              )}

              <div className="flex items-start space-x-4">
                {/* Status icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStatusColor(
                      item.status.status
                    )}`}
                  >
                    {getStatusIcon(item.status.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg ${iconColor}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.type === "round"
                          ? item.round.name
                          : item.status.title}
                      </h4>
                      {/* Remove description for all items to ensure consistent spacing */}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {typeof item.status.date === "string" &&
                        item.status.date !== "In progress" &&
                        item.status.date !== "Pending" &&
                        item.status.date !== "Completed" &&
                        item.status.date !== "Not reached"
                          ? new Date(item.status.date).toLocaleDateString()
                          : item.status.date}
                      </span>
                    </div>
                  </div>

                  {/* Round-specific details removed as requested */}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

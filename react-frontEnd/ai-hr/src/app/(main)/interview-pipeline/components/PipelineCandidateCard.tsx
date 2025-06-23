import React from "react";
import {
  MoreVertical,
  Star,
  User,
  Calendar,
  Clock,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Candidate } from "@/interfaces";

interface PipelineCandidate extends Candidate {
  currentRoundId?: string;
  roundProgress?: number;
}

interface PipelineCandidateCardProps {
  candidate: PipelineCandidate;
  onMove?: (candidateId: string, direction: "next" | "previous") => void;
  onViewProfile?: (candidateId: string) => void;
  onSchedule?: (candidateId: string) => void;
  onReject?: (candidateId: string) => void;
}

export function PipelineCandidateCard({
  candidate,
  onMove,
  onViewProfile,
  onSchedule,
  onReject,
}: PipelineCandidateCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "hired":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "in progress":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "hired":
        return CheckCircle;
      case "rejected":
        return XCircle;
      case "in progress":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "N/A";

    try {
      let dateStr = dateValue;

      // Handle .NET DateTime objects
      if (typeof dateValue === "object" && dateValue !== null) {
        dateStr = dateValue.value || dateValue.Value || dateValue.toString();
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const getAssessmentColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const StatusIcon = getStatusIcon(candidate.status || "In Progress");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
      {/* Candidate Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            {candidate.photo ? (
              <img
                src={candidate.photo}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {candidate.name}
            </h4>
            <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <StatusIcon
            className={`h-4 w-4 ${getStatusColor(
              candidate.status || "In Progress"
            )}`}
          />
          <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Candidate Info */}
      <div className="space-y-2">
        {/* Assessment Score */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Assessment Score</span>
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded ${getAssessmentColor(
              candidate.assessment
            )}`}
          >
            <Star className="h-3 w-3" />
            <span className="font-medium">{candidate.assessment}/100</span>
          </div>
        </div>

        {/* Applied Date */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Applied</span>
          <span className="text-gray-700">
            {formatDate(candidate.appliedAt)}
          </span>
        </div>

        {/* Expected Salary */}
        {candidate.expectedSalary && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Expected Salary</span>
            <span className="text-gray-700">
              ${candidate.expectedSalary.toLocaleString()}
            </span>
          </div>
        )}

        {/* Round Progress */}
        {candidate.roundProgress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Progress</span>
              <span className="text-gray-700">{candidate.roundProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-indigo-600 h-1 rounded-full transition-all"
                style={{ width: `${candidate.roundProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onViewProfile?.(candidate.id)}
          className="flex-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={() => onSchedule?.(candidate.id)}
          className="flex-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
        >
          Schedule
        </button>
      </div>

      {/* Quick Actions (shown on hover) */}
      <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onMove?.(candidate.id, "next")}
          className="flex-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded transition-colors"
        >
          Advance
        </button>
        <button
          onClick={() => onReject?.(candidate.id)}
          className="flex-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

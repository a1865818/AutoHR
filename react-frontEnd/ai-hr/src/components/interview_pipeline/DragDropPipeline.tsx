import React, { useState, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  Star,
  User,
  AlertTriangle,
  Clock,
  Award,
  FileText,
} from "lucide-react";
import { Candidate } from "@/interfaces";
import { InterviewRound } from "@/interfaces/interview";
import { HoverRejectModal } from "./HoverRejectModal";

interface PipelineCandidate extends Candidate {
  currentRoundId?: string;
  roundProgress?: number;
}

interface DragDropCandidateCardProps {
  candidate: PipelineCandidate;
  roundId?: string;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  onMove?: (candidateId: string, direction: "left" | "right") => void;
  onSchedule?: (candidateId: string) => void;
  onReject?: (candidateId: string) => void;
  onRejectWithEmail?: (
    candidateId: string,
    emailData: {
      reason: string;
      notes?: string;
      templateId?: string;
      subject: string;
      body: string;
    }
  ) => Promise<void>;
  onHire?: (candidateId: string) => void;
  onOffer?: (candidateId: string) => void;
  onViewProfile?: (candidateId: string) => void;
  onAddNote?: (candidateId: string, note: string) => void;
  onMarkAssessment?: (candidateId: string, roundId: string) => void;
  jobTitle?: string;
  companyName?: string;
  roundType?: string;
}

export function DragDropCandidateCard({
  candidate,
  roundId,
  canMoveLeft = false,
  canMoveRight = false,
  onMove,
  onSchedule,
  onReject,
  onRejectWithEmail,
  onHire,
  onOffer,
  onViewProfile,
  onAddNote,
  onMarkAssessment,
  jobTitle = "Position",
  companyName = "Company",
  roundType,
}: DragDropCandidateCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [note, setNote] = useState("");
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          candidateId: candidate.id,
          fromColumn: roundId,
        })
      );
      e.dataTransfer.effectAllowed = "move";
    },
    [candidate.id, roundId]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "N/A";
    try {
      let dateStr = dateValue;
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "hired":
        return "text-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      case "in progress":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getAssessmentColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const handleAddNote = () => {
    if (note.trim()) {
      onAddNote?.(candidate.id, note);
      setNote("");
      setShowNoteModal(false);
    }
  };

  const handleRejectWithEmail = async (
    candidateId: string,
    emailData: {
      reason: string;
      notes?: string;
      templateId?: string;
      subject: string;
      body: string;
    }
  ) => {
    try {
      if (onRejectWithEmail) {
        await onRejectWithEmail(candidateId, emailData);
      } else {
        // Fallback to simple reject
        onReject?.(candidateId);
      }
      setShowRejectModal(false);
    } catch (error) {
      console.error("Error rejecting candidate with email:", error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  const handleRejectClick = () => {
    if (onRejectWithEmail && jobTitle && companyName) {
      setShowRejectModal(true);
    } else {
      // Fallback to simple reject
      onReject?.(candidate.id);
    }
  };

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative bg-white border-2 rounded-lg p-4 cursor-move transition-all duration-200 group hover:shadow-lg ${
        isDragging
          ? "border-indigo-400 shadow-lg opacity-50"
          : "border-gray-200 hover:border-indigo-300"
      }`}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
    >
      {/* Candidate Header */}
      <div className="mb-3">
        {/* Name and photo row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
              {candidate.photo ? (
                <img
                  src={candidate.photo}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {candidate.name}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {candidate.email}
              </p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Status row - consistent positioning */}
        <div className="flex items-center justify-between">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              candidate.status || "In Progress"
            )}`}
          >
            {candidate.status || "In Progress"}
          </div>
        </div>
      </div>

      {/* Candidate Details */}
      <div className="space-y-2 mb-3">
        {/* Assessment Score */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Assessment</span>
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

        {/* Progress Bar */}
        {candidate.roundProgress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Progress</span>
              <span className="text-gray-700">{candidate.roundProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${candidate.roundProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onViewProfile?.(candidate.id)}
          className="flex-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1.5 rounded transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={() => onSchedule?.(candidate.id)}
          className="flex-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-2 py-1.5 rounded transition-colors"
        >
          Schedule
        </button>
      </div>

      {/* Quick Actions (shown on hover) */}
      {showQuickActions && (
        <div className="absolute inset-x-0 bottom-0 transform translate-y-full mt-2 z-10">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1">
            {/* Movement Buttons */}
            <div className="flex space-x-1">
              {canMoveLeft && (
                <button
                  onClick={() => onMove?.(candidate.id, "left")}
                  className="flex-1 flex items-center justify-center space-x-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span>Previous</span>
                </button>
              )}
              {canMoveRight && (
                <button
                  onClick={() => onMove?.(candidate.id, "right")}
                  className="flex-1 flex items-center justify-center space-x-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-1">
              <button
                onClick={() => onSchedule?.(candidate.id)}
                className="flex-1 flex items-center justify-center space-x-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                <Calendar className="h-3 w-3" />
                <span>Schedule</span>
              </button>

              <button
                onClick={() => setShowNoteModal(true)}
                className="flex-1 flex items-center justify-center space-x-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                <span>Add Note</span>
              </button>

              {/* Assessment Marking Button - Only show for technical rounds */}
              {(roundType === "technical_assessment" || roundType === "coding_challenge") && onMarkAssessment && (
                <button
                  onClick={() => onMarkAssessment?.(candidate.id, roundId || "")}
                  className="flex-1 flex items-center justify-center space-x-1 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  <span>Mark Assessment</span>
                </button>
              )}
            </div>

            {/* Offer, Hire, Reject Buttons */}
            <div className="flex space-x-1">
              {onOffer && (
                <button
                  onClick={() => onOffer?.(candidate.id)}
                  className="flex-1 flex items-center justify-center space-x-1 text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-2 py-1 rounded transition-colors"
                >
                  <Award className="h-3 w-3" />
                  <span>Offer Position</span>
                </button>
              )}

              {onHire && (
                <button
                  onClick={() => onHire?.(candidate.id)}
                  className="flex-1 flex items-center justify-center space-x-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Hire</span>
                </button>
              )}

              {(onReject || onRejectWithEmail) && (
                <button
                  onClick={handleRejectClick}
                  className="flex-1 flex items-center justify-center space-x-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  <span>Reject</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Note for {candidate.name}
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter your note..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hover Reject Modal */}
      <HoverRejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        candidate={candidate}
        jobTitle={jobTitle}
        companyName={companyName}
        onReject={handleRejectWithEmail}
      />

      {/* Drag Indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-100 bg-opacity-50 rounded-lg flex items-center justify-center">
          <div className="text-indigo-600 font-medium text-sm">Moving...</div>
        </div>
      )}
    </div>
  );
}

// Droppable Column Component
interface DroppableColumnProps {
  children: React.ReactNode;
  onDrop?: (candidateData: any) => void;
  className?: string;
}

export function DroppableColumn({
  children,
  onDrop,
  className = "",
}: DroppableColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      try {
        const candidateData = JSON.parse(e.dataTransfer.getData("text/plain"));
        onDrop?.(candidateData);
      } catch (error) {
        console.error("Error parsing dropped data:", error);
      }
    },
    [onDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-all duration-200 ${
        isDragOver ? "bg-indigo-50 border-indigo-300" : ""
      } ${className}`}
    >
      {children}
      {isDragOver && (
        <div className="absolute inset-0 bg-indigo-100 bg-opacity-30 rounded-lg border-2 border-dashed border-indigo-400 flex items-center justify-center">
          <div className="text-indigo-600 font-medium">Drop candidate here</div>
        </div>
      )}
    </div>
  );
}

// Bulk Actions Component
interface BulkActionsProps {
  selectedCandidates: string[];
  onClearSelection: () => void;
  onBulkMove: (candidateIds: string[], direction: "next" | "previous") => void;
  onBulkReject: (candidateIds: string[]) => void;
  onBulkSchedule: (candidateIds: string[]) => void;
}

export function BulkActions({
  selectedCandidates,
  onClearSelection,
  onBulkMove,
  onBulkReject,
  onBulkSchedule,
}: BulkActionsProps) {
  if (selectedCandidates.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-indigo-600" />
          <span className="font-medium text-gray-900">
            {selectedCandidates.length} candidate
            {selectedCandidates.length !== 1 ? "s" : ""} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onBulkMove(selectedCandidates, "next")}
            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition-colors text-sm"
          >
            Move Next
          </button>
          <button
            onClick={() => onBulkMove(selectedCandidates, "previous")}
            className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm"
          >
            Move Back
          </button>
          <button
            onClick={() => onBulkSchedule(selectedCandidates)}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors text-sm"
          >
            Bulk Schedule
          </button>
          <button
            onClick={() => onBulkReject(selectedCandidates)}
            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md transition-colors text-sm"
          >
            Reject All
          </button>
          <button
            onClick={onClearSelection}
            className="px-3 py-1.5 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  Phone,
  Video,
  Code,
  MessageSquare,
  Users,
  Crown,
  Heart,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  PlayCircle,
  PauseCircle,
  Download,
  Upload,
  Star,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import { InterviewType, InterviewRound } from "@/interfaces/interview";
import { Candidate } from "@/interfaces";
import { useRouter } from "next/navigation";

interface RoundSpecificActionsProps {
  round: InterviewRound;
  candidate?: Candidate;
  jobId?: string;
  isLastRound?: boolean;
  onSchedule?: (candidateId: string, roundId: string) => void;
  onComplete?: (candidateId: string, roundId: string, result: any) => void;
  onAddNotes?: (candidateId: string, roundId: string, notes: string) => void;
  onHire?: (candidateId: string) => void;
  onReject?: (candidateId: string) => void;
}

export function RoundSpecificActions({
  round,
  candidate,
  jobId,
  isLastRound = false,
  onSchedule,
  onComplete,
  onAddNotes,
  onHire,
  onReject,
}: RoundSpecificActionsProps) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [showScoring, setShowScoring] = useState(false);

  // If this is the last round, show final decision actions regardless of type
  if (isLastRound) {
    return (
      <LastRoundActions
        round={round}
        candidate={candidate}
        onSchedule={onSchedule}
        onHire={onHire}
        onReject={onReject}
      />
    );
  }

  switch (round.type) {
    case "phone_screening":
      return (
        <PhoneScreeningActions
          round={round}
          candidate={candidate}
          onSchedule={onSchedule}
        />
      );

    case "video_interview":
      return (
        <VideoInterviewActions
          round={round}
          candidate={candidate}
          onSchedule={onSchedule}
        />
      );

    case "technical_assessment":
      return (
        <TechnicalAssessmentActions
          round={round}
          candidate={candidate}
          jobId={jobId}
          onComplete={onComplete}
        />
      );

    case "coding_challenge":
      return (
        <CodingChallengeActions
          round={round}
          candidate={candidate}
          jobId={jobId}
          onComplete={onComplete}
        />
      );

    case "final_interview":
      return (
        <FinalInterviewActions
          round={round}
          candidate={candidate}
          onSchedule={onSchedule}
        />
      );

    default:
      return (
        <DefaultRoundActions
          round={round}
          candidate={candidate}
          onSchedule={onSchedule}
        />
      );
  }
}

// Last Round Actions Component (for any round type that is the final round)
function LastRoundActions({
  round,
  candidate,
  onSchedule,
  onHire,
  onReject,
}: any) {
  return (
    <div className="space-y-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
      <div className="flex items-center space-x-2 text-sm">
        <CheckCircle className="h-4 w-4 text-yellow-600" />
        <span className="font-medium text-yellow-800">
          Final Decision Round
        </span>
      </div>

      {/* Show round-specific actions first */}
      <div className="space-y-2">
        {round.type === "phone_screening" && (
          <button
            onClick={() => onSchedule?.(candidate?.id, round.id)}
            className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
          >
            <Calendar className="h-3 w-3" />
            <span>Schedule Call</span>
          </button>
        )}

        {(round.type === "video_interview" ||
          round.type === "final_interview") && (
          <button
            onClick={() => onSchedule?.(candidate?.id, round.id)}
            className="w-full text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
          >
            <Video className="h-3 w-3" />
            <span>Schedule Interview</span>
          </button>
        )}

        {(round.type === "technical_assessment" ||
          round.type === "coding_challenge") && (
          <button className="w-full text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1">
            <Code className="h-3 w-3" />
            <span>Send Assessment</span>
          </button>
        )}
      </div>

      {/* Final Decision Actions */}
      <div className="border-t border-yellow-200 pt-3">
        <div className="text-xs font-medium text-yellow-800 mb-2">
          Final Decision:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onHire?.(candidate?.id)}
            className="text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
          >
            <CheckCircle className="h-3 w-3" />
            <span>Hire</span>
          </button>
          <button
            onClick={() => onReject?.(candidate?.id)}
            className="text-xs bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-yellow-700">
        Duration: {round.duration} min • This is the final evaluation round
      </div>
    </div>
  );
}

// Phone Screening Component
function PhoneScreeningActions({ round, candidate, onSchedule }: any) {
  const [scheduledTime, setScheduledTime] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm">
        <Phone className="h-4 w-4 text-blue-600" />
        <span className="font-medium">Phone Screening</span>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onSchedule?.(candidate?.id, round.id)}
          className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
        >
          <Calendar className="h-3 w-3" />
          <span>Schedule Call</span>
        </button>

        <button className="w-full text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1">
          <FileText className="h-3 w-3" />
          <span>Add Notes</span>
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Duration: {round.duration} min • Score threshold:{" "}
        {round.passingCriteria}%
      </div>
    </div>
  );
}

// Video Interview Component
function VideoInterviewActions({ round, candidate, onSchedule }: any) {
  // Check if meeting is scheduled
  const isMeetingScheduled =
    round.meetingScheduled ||
    (round.configurationData && round.configurationData.meetingScheduled);

  const meetingData =
    round.meetingData ||
    (round.configurationData && round.configurationData.meetingData);

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm">
        <Video className="h-4 w-4 text-green-600" />
        <span className="font-medium">Video Interview</span>
      </div>

      <div className="space-y-2">
        {!isMeetingScheduled ? (
          <button
            onClick={() => onSchedule?.(candidate?.id, round.id)}
            className="w-full text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
          >
            <Video className="h-3 w-3" />
            <span>Schedule Interview</span>
          </button>
        ) : (
          <div className="space-y-2">
            <button
              className="w-full text-xs bg-green-100 text-green-800 px-3 py-2 rounded-md flex items-center justify-center space-x-1"
              disabled
            >
              <CheckCircle className="h-3 w-3" />
              <span>Scheduled</span>
            </button>

            {meetingData?.meetLink && (
              <button
                onClick={() => window.open(meetingData.meetLink, "_blank")}
                className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Join Meeting</span>
              </button>
            )}
          </div>
        )}

        <button className="w-full text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1">
          <PlayCircle className="h-3 w-3" />
          <span>Start Recording</span>
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Duration: {round.duration} min • Video platform ready
        {isMeetingScheduled && meetingData && (
          <div className="mt-1">
            <div>Meeting: {meetingData.summary || "Scheduled"}</div>
            <div>
              Date: {new Date(meetingData.startTime).toLocaleDateString()}
            </div>
            <div>
              Time: {new Date(meetingData.startTime).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Technical Assessment Component
function TechnicalAssessmentActions({
  round,
  candidate,
  jobId,
  onComplete,
}: any) {
  const [testScore, setTestScore] = useState(0);
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm">
        <Code className="h-4 w-4 text-purple-600" />
        <span className="font-medium">Technical Assessment</span>
      </div>

      <div className="space-y-2">
        <button className="w-full text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1">
          <Code className="h-3 w-3" />
          <span>Send Test Link</span>
        </button>
        {/* Removed grade input and button from here */}
      </div>

      <div className="text-xs text-gray-500">
        Time limit: {round.duration} min • Pass: {round.passingCriteria}%
      </div>
    </div>
  );
}

// Coding Challenge Component
function CodingChallengeActions({ round, candidate, jobId, onComplete }: any) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm">
        <Code className="h-4 w-4 text-orange-600" />
        <span className="font-medium">Coding Challenge</span>
      </div>

      <div className="space-y-2">
        <button className="w-full text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1">
          <Upload className="h-3 w-3" />
          <span>Send Challenge</span>
        </button>
        {/* Removed grade input and button from here */}
      </div>

      <div className="text-xs text-gray-500">
        Deadline: {round.duration}h • Review required
      </div>
    </div>
  );
}

// Final Interview Component (behaves like normal interview when not the last round)
function FinalInterviewActions({ round, candidate, onSchedule }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm">
        <Crown className="h-4 w-4 text-gray-600" />
        <span className="font-medium">Final Interview</span>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onSchedule?.(candidate?.id, round.id)}
          className="w-full text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
        >
          <Calendar className="h-3 w-3" />
          <span>Schedule Interview</span>
        </button>

        <button className="w-full text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1">
          <FileText className="h-3 w-3" />
          <span>Add Notes</span>
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Duration: {round.duration} min • Executive interview
      </div>
    </div>
  );
}

// Default Round Actions
function DefaultRoundActions({ round, candidate, onSchedule }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm">
        <Calendar className="h-4 w-4 text-gray-600" />
        <span className="font-medium">{round.name}</span>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onSchedule?.(candidate?.id, round.id)}
          className="w-full text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors flex items-center justify-center space-x-1"
        >
          <Calendar className="h-3 w-3" />
          <span>Schedule</span>
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Duration: {round.duration} min
      </div>
    </div>
  );
}

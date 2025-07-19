import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Plus,
} from "lucide-react";
import { Candidate } from "@/interfaces";
import { InterviewRound, InterviewType } from "@/interfaces/interview";

interface Interview {
  id: string;
  candidateId: string;
  roundId: string;
  scheduledAt: string;
  duration: number;
  type: InterviewType;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  interviewers: string[];
  location?: string;
  meetingLink?: string;
  notes?: string;
}

interface InterviewFeedback {
  overallScore: number;
  technicalScore?: number;
  communicationScore?: number;
  culturalFitScore?: number;
  recommendation: "hire" | "no_hire" | "maybe";
  notes: string;
  nextSteps?: string;
}

interface InterviewSchedulerProps {
  candidate: Candidate;
  round: InterviewRound;
  onSchedule?: (interview: Partial<Interview>) => void;
  onCancel?: (interviewId: string) => void;
  onComplete?: (interviewId: string, feedback: InterviewFeedback) => void;
}

export function InterviewScheduler({
  candidate,
  round,
  onSchedule,
  onCancel,
  onComplete,
}: InterviewSchedulerProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [interviewers, setInterviewers] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(
    null
  );

  const getInterviewTypeIcon = (type: InterviewType) => {
    switch (type) {
      case "phone_screening":
        return Phone;
      case "video_interview":
        return Video;
      default:
        return Calendar;
    }
  };

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;

    const scheduledAt = new Date(
      `${selectedDate}T${selectedTime}`
    ).toISOString();

    const interview: Partial<Interview> = {
      candidateId: candidate.id,
      roundId: round.id,
      scheduledAt,
      duration: round.duration,
      type: round.type,
      status: "scheduled",
      interviewers,
      location: location || undefined,
      meetingLink: meetingLink || undefined,
    };

    onSchedule?.(interview);
    setShowScheduler(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedDate("");
    setSelectedTime("");
    setInterviewers([]);
    setLocation("");
    setMeetingLink("");
  };

  return (
    <div className="space-y-4">
      {currentInterview ? (
        <InterviewCard
          interview={currentInterview}
          candidate={candidate}
          round={round}
          onCancel={() => onCancel?.(currentInterview.id)}
          onComplete={() => setShowFeedback(true)}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {React.createElement(getInterviewTypeIcon(round.type), {
                className: "h-5 w-5 text-gray-600",
              })}
              <div>
                <h3 className="font-medium text-gray-900">{round.name}</h3>
                <p className="text-sm text-gray-500">
                  {round.duration} minutes • {candidate.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowScheduler(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Interview
            </button>
          </div>
        </div>
      )}

      {showScheduler && (
        <ScheduleModal
          round={round}
          candidate={candidate}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          interviewers={interviewers}
          location={location}
          meetingLink={meetingLink}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
          onInterviewersChange={setInterviewers}
          onLocationChange={setLocation}
          onMeetingLinkChange={setMeetingLink}
          onSchedule={handleSchedule}
          onCancel={() => setShowScheduler(false)}
        />
      )}

      {showFeedback && currentInterview && (
        <FeedbackModal
          interview={currentInterview}
          candidate={candidate}
          round={round}
          onSubmit={(feedback) => {
            onComplete?.(currentInterview.id, feedback);
            setShowFeedback(false);
          }}
          onCancel={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}

interface InterviewCardProps {
  interview: Interview;
  candidate: Candidate;
  round: InterviewRound;
  onCancel?: () => void;
  onComplete?: () => void;
}

function InterviewCard({
  interview,
  candidate,
  round,
  onCancel,
  onComplete,
}: InterviewCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: Interview["status"]) => {
    switch (status) {
      case "scheduled":
        return "text-blue-600 bg-blue-50";
      case "in_progress":
        return "text-yellow-600 bg-yellow-50";
      case "completed":
        return "text-green-600 bg-green-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      case "no_show":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900">{round.name}</h3>
            <p className="text-sm text-gray-500">{candidate.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              interview.status
            )}`}
          >
            {interview.status.replace("_", " ")}
          </span>
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{new Date(interview.scheduledAt).toLocaleString()}</span>
        </div>

        {interview.location && (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{interview.location}</span>
          </div>
        )}

        {interview.meetingLink && (
          <div className="flex items-center space-x-2">
            <Video className="h-4 w-4 text-gray-400" />
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800"
            >
              Join Meeting
            </a>
          </div>
        )}
      </div>

      {showActions && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            {interview.status === "scheduled" && (
              <>
                <button
                  onClick={onComplete}
                  className="flex-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded transition-colors"
                >
                  Complete
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ScheduleModalProps {
  round: InterviewRound;
  candidate: Candidate;
  selectedDate: string;
  selectedTime: string;
  interviewers: string[];
  location: string;
  meetingLink: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onInterviewersChange: (interviewers: string[]) => void;
  onLocationChange: (location: string) => void;
  onMeetingLinkChange: (link: string) => void;
  onSchedule: () => void;
  onCancel: () => void;
}

function ScheduleModal({
  round,
  candidate,
  selectedDate,
  selectedTime,
  interviewers,
  location,
  meetingLink,
  onDateChange,
  onTimeChange,
  onInterviewersChange,
  onLocationChange,
  onMeetingLinkChange,
  onSchedule,
  onCancel,
}: ScheduleModalProps) {
  const [newInterviewer, setNewInterviewer] = useState("");

  const addInterviewer = () => {
    if (
      newInterviewer.trim() &&
      !interviewers.includes(newInterviewer.trim())
    ) {
      onInterviewersChange([...interviewers, newInterviewer.trim()]);
      setNewInterviewer("");
    }
  };

  const removeInterviewer = (interviewer: string) => {
    onInterviewersChange(interviewers.filter((i) => i !== interviewer));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Schedule {round.name}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Candidate
            </label>
            <p className="text-sm text-gray-900">{candidate.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interviewers
            </label>
            <div className="space-y-2">
              {interviewers.map((interviewer) => (
                <div
                  key={interviewer}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                >
                  <span className="text-sm">{interviewer}</span>
                  <button
                    onClick={() => removeInterviewer(interviewer)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Add interviewer email..."
                  value={newInterviewer}
                  onChange={(e) => setNewInterviewer(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={addInterviewer}
                  className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {round.type === "video_interview" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Link
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => onMeetingLinkChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="Office location or phone number..."
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSchedule}
            disabled={!selectedDate || !selectedTime}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Schedule Interview
          </button>
        </div>
      </div>
    </div>
  );
}

interface FeedbackModalProps {
  interview: Interview;
  candidate: Candidate;
  round: InterviewRound;
  onSubmit: (feedback: InterviewFeedback) => void;
  onCancel: () => void;
}

function FeedbackModal({
  interview,
  candidate,
  onSubmit,
  onCancel,
}: FeedbackModalProps) {
  const [feedback, setFeedback] = useState<Partial<InterviewFeedback>>({
    overallScore: 5,
    technicalScore: 5,
    communicationScore: 5,
    culturalFitScore: 5,
    recommendation: "maybe",
    notes: "",
    nextSteps: "",
  });

  const handleSubmit = () => {
    onSubmit(feedback as InterviewFeedback);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Interview Feedback - {candidate.name}
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Score (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={feedback.overallScore}
              onChange={(e) =>
                setFeedback({
                  ...feedback,
                  overallScore: Number(e.target.value),
                })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span className="font-medium">{feedback.overallScore}</span>
              <span>10</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technical (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={feedback.technicalScore}
                onChange={(e) =>
                  setFeedback({
                    ...feedback,
                    technicalScore: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Communication (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={feedback.communicationScore}
                onChange={(e) =>
                  setFeedback({
                    ...feedback,
                    communicationScore: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cultural Fit (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={feedback.culturalFitScore}
                onChange={(e) =>
                  setFeedback({
                    ...feedback,
                    culturalFitScore: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendation
            </label>
            <div className="flex space-x-4">
              {["hire", "maybe", "no_hire"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="recommendation"
                    value={option}
                    checked={feedback.recommendation === option}
                    onChange={(e) =>
                      setFeedback({
                        ...feedback,
                        recommendation: e.target.value as any,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="capitalize">{option.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Notes
            </label>
            <textarea
              value={feedback.notes}
              onChange={(e) =>
                setFeedback({ ...feedback, notes: e.target.value })
              }
              placeholder="Detailed feedback about the interview..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Steps
            </label>
            <textarea
              value={feedback.nextSteps}
              onChange={(e) =>
                setFeedback({ ...feedback, nextSteps: e.target.value })
              }
              placeholder="What should happen next in the process..."
              className="w-full h-20 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

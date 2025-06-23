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
  Star,
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
  status: "scheduled" | "completed" | "cancelled";
  interviewers: string[];
  location?: string;
  meetingLink?: string;
  feedback?: {
    overallScore: number;
    recommendation: "hire" | "no_hire" | "maybe";
    notes: string;
  };
}

interface InterviewManagerProps {
  candidate: Candidate;
  round: InterviewRound;
  onSchedule?: (interview: Partial<Interview>) => void;
  onComplete?: (interviewId: string, feedback: any) => void;
  onCancel?: (interviewId: string) => void;
}

export function InterviewManager({
  candidate,
  round,
  onSchedule,
  onComplete,
  onCancel,
}: InterviewManagerProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [interviewers, setInterviewers] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const getInterviewTypeIcon = (type: InterviewType) => {
    switch (type) {
      case "phone_screening":
        return Phone;
      case "video_interview":
        return Video;
      case "panel_interview":
        return Users;
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

  const addInterviewer = (email: string) => {
    if (email.trim() && !interviewers.includes(email.trim())) {
      setInterviewers([...interviewers, email.trim()]);
    }
  };

  const removeInterviewer = (email: string) => {
    setInterviewers(interviewers.filter((i) => i !== email));
  };

  return (
    <div className="space-y-4">
      {/* Schedule Interview Button */}
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

      {/* Schedule Modal */}
      {showScheduler && (
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
                    onChange={(e) => setSelectedDate(e.target.value)}
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
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <p className="text-sm text-gray-600">
                  {round.duration} minutes
                </p>
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
                  <InterviewerInput onAdd={addInterviewer} />
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
                    onChange={(e) => setMeetingLink(e.target.value)}
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
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduler(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={!selectedDate || !selectedTime}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for adding interviewers
function InterviewerInput({ onAdd }: { onAdd: (email: string) => void }) {
  const [email, setEmail] = useState("");

  const handleAdd = () => {
    if (email.trim()) {
      onAdd(email);
      setEmail("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex space-x-2">
      <input
        type="email"
        placeholder="Add interviewer email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <button
        onClick={handleAdd}
        className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// Interview Card component for displaying scheduled interviews
interface InterviewCardProps {
  interview: Interview;
  candidate: Candidate;
  round: InterviewRound;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function InterviewCard({
  interview,
  candidate,
  round,
  onComplete,
  onCancel,
}: InterviewCardProps) {
  const getStatusColor = (status: Interview["status"]) => {
    switch (status) {
      case "scheduled":
        return "text-blue-600 bg-blue-50";
      case "completed":
        return "text-green-600 bg-green-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
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
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            interview.status
          )}`}
        >
          {interview.status}
        </span>
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

      {interview.status === "scheduled" && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
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
          </div>
        </div>
      )}
    </div>
  );
}

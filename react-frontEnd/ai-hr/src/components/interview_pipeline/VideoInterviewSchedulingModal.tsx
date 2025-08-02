"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Video,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { roundConfigurationAPI } from "@/services/roundConfigurationApi";
import { googleCalendarService } from "@/services/googleCalendarService";

interface VideoInterviewSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  round: {
    id: string;
    name: string;
    type: string;
    duration: number;
  };
  jobId: string;
  roundId: string;
  onScheduleSuccess?: (meetingData: {
    meetLink: string;
    eventId: string;
    calendarEventId: string;
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    meetingDuration: number;
    startTime: string;
    endTime: string;
    timezone: string;
    candidateId?: string;
    scheduledAt: string;
  }) => void;
}

interface RoundConfiguration {
  meetingTitle?: string;
  meetingDuration?: number;
  duration: number;
}

export function VideoInterviewSchedulingModal({
  isOpen,
  onClose,
  candidate,
  round,
  jobId,
  roundId,
  onScheduleSuccess,
}: VideoInterviewSchedulingModalProps) {
  const [formData, setFormData] = useState({
    meetingTitle: "",
    date: "",
    time: "",
    duration: round.duration,
  });

  const [roundConfig, setRoundConfig] = useState<RoundConfiguration | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [meetingData, setMeetingData] = useState<{
    meetLink: string;
    eventId: string;
    calendarEventId: string;
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    meetingDuration: number;
    startTime: string;
    endTime: string;
    timezone: string;
    candidateId?: string;
    scheduledAt: string;
  } | null>(null);

  // Google Calendar Authorization States
  const [isGoogleCalendarAuthorized, setIsGoogleCalendarAuthorized] =
    useState(false);
  const [checkingAuthorization, setCheckingAuthorization] = useState(true);

  // Load round configuration to get meeting title and duration
  useEffect(() => {
    if (isOpen) {
      loadRoundConfiguration();
      checkGoogleCalendarAuthorization();
    }
  }, [isOpen, jobId, roundId]);

  const loadRoundConfiguration = async () => {
    try {
      setLoading(true);
      const response = await roundConfigurationAPI.getConfiguration(
        jobId,
        roundId
      );

      if (response.success && response.data) {
        const config = response.data;
        // Access configuration data from the response structure
        const configData = (config as any).configurationData || {};

        setRoundConfig({
          meetingTitle: configData.meetingTitle || "",
          meetingDuration: configData.meetingDuration || config.duration,
          duration: config.duration,
        });

        // Pre-fill the form with configuration data
        const candidateName = candidate.name;
        const defaultTitle = (configData.meetingTitle || "Video Interview")
          .replace("{Candidate Name}", candidateName)
          .replace("{candidate name}", candidateName);

        const defaultDuration = configData.meetingDuration || config.duration;
        console.log("Setting form duration to:", defaultDuration);

        setFormData({
          meetingTitle: defaultTitle,
          date: "",
          time: "",
          duration: defaultDuration,
        });
      }
    } catch (error) {
      console.error("Error loading round configuration:", error);
      setError("Failed to load round configuration");
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleCalendarAuthorization = async () => {
    try {
      setCheckingAuthorization(true);
      const response = await googleCalendarService.isAuthorized();
      if (response.success && response.data) {
        setIsGoogleCalendarAuthorized(response.data.isAuthorized);
      }
    } catch (error) {
      console.error("Error checking Google Calendar authorization:", error);
    } finally {
      setCheckingAuthorization(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!formData.meetingTitle || !formData.date || !formData.time) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setScheduling(true);
      setError("");

      const response = await roundConfigurationAPI.scheduleMeeting(
        jobId,
        roundId,
        formData.meetingTitle,
        formData.date,
        formData.time,
        formData.duration,
        candidate.email,
        candidate.id
      );

      if (response.success && response.data) {
        setMeetingData(response.data);
        setSuccess(true);
        onScheduleSuccess?.(response.data);
        console.log("Meeting scheduled successfully:", response.data);
      } else {
        setError(response.message || "Failed to schedule meeting");
        console.error("Failed to schedule meeting:", response.message);
      }
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      setError(
        "Failed to schedule meeting. Please check the console for details."
      );
    } finally {
      setScheduling(false);
    }
  };

  const handleClose = () => {
    if (!scheduling) {
      setFormData({
        meetingTitle: "",
        date: "",
        time: "",
        duration: round.duration,
      });
      setError("");
      setSuccess(false);
      setMeetingData(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Schedule Video Interview
          </h3>
          <button
            onClick={handleClose}
            disabled={scheduling}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2">Loading configuration...</span>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Meeting Scheduled Successfully!
              </span>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-2 text-sm text-green-700">
                <p>
                  <strong>Title:</strong> {formData.meetingTitle}
                </p>
                <p>
                  <strong>Date:</strong> {formData.date}
                </p>
                <p>
                  <strong>Time:</strong> {formData.time}
                </p>
                <p>
                  <strong>Duration:</strong> {formData.duration} minutes
                </p>
                <p>
                  <strong>Candidate:</strong> {candidate.name}
                </p>
              </div>

              {meetingData?.meetLink && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Meet Link
                  </label>
                  <div className="flex">
                    <input
                      type="url"
                      value={meetingData.meetLink}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(meetingData.meetLink)
                      }
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-r-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Calendar Authorization Status */}
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-800 mr-2">
                    Google Calendar Access:
                  </span>
                  {checkingAuthorization ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : isGoogleCalendarAuthorized ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Authorized
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Not Authorized
                    </span>
                  )}
                </div>
              </div>
              {!isGoogleCalendarAuthorized && !checkingAuthorization && (
                <p className="mt-1 text-xs text-blue-600">
                  Please authorize Google Calendar access in the round
                  configuration to schedule meetings.
                </p>
              )}
            </div>

            {/* Candidate Information */}
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Candidate
                </span>
              </div>
              <p className="text-sm text-gray-900">{candidate.name}</p>
              <p className="text-xs text-gray-500">{candidate.email}</p>
            </div>

            {/* Round Information */}
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Video className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Round</span>
              </div>
              <p className="text-sm text-gray-900">{round.name}</p>
              <p className="text-xs text-gray-500">
                {round.type} • {round.duration} minutes
              </p>
            </div>

            {/* Scheduling Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={formData.meetingTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingTitle: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Technical Interview - John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      const validValue = Math.max(15, Math.min(180, value));
                      setFormData({ ...formData, duration: validValue });
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="15"
                  max="180"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={scheduling}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleMeeting}
                disabled={
                  scheduling ||
                  !isGoogleCalendarAuthorized ||
                  !formData.meetingTitle ||
                  !formData.date ||
                  !formData.time
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Meeting
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

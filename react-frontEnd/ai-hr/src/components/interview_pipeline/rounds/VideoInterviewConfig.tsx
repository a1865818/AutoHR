"use client";

import { useRoundConfiguration } from "@/hooks/useRoundConfiguration";
import { cleanJsonObject } from "@/utils/jsonUtils";
import { RoundInstructions } from "./shared/RoundInstructions";
import { googleCalendarService } from "@/services/googleCalendarService";
import { roundConfigurationAPI } from "@/services/roundConfigurationApi";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Users,
  Video,
  CheckCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Question {
  id: string;
  text: string;
  category: "technical" | "culture" | "experience" | "scenario";
  followUpPrompts: string[];
}

interface Interviewer {
  id: string;
  name: string;
  email: string;
  role: string;
  isBackup: boolean;
}

interface VideoInterviewConfiguration {
  name: string;
  platform: "meet"; // Only Google Meet supported
  duration: number;
  questions: Question[];
  interviewers: Interviewer[];
  candidatePreparation: string;
  interviewerGuidelines: string;
  // New scheduling fields
  meetingTitle?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingDuration?: number;
  scheduledMeetingId?: string;
  meetLink?: string;
}

interface VideoInterviewConfigProps {
  jobId: string;
  roundId: string;
  round: any;
  onConfigurationChange: (newConfig: any) => void;
}

const defaultQuestions: Question[] = [
  {
    id: "vq1",
    text: "Tell me about a challenging project you worked on recently.",
    category: "experience",
    followUpPrompts: [
      "What was your specific role?",
      "How did you overcome obstacles?",
      "What would you do differently?",
    ],
  },
  {
    id: "vq2",
    text: "Describe a time when you had to work with a difficult team member.",
    category: "culture",
    followUpPrompts: [
      "How did you handle the situation?",
      "What was the outcome?",
    ],
  },
];

const defaultInterviewers: Interviewer[] = [
  {
    id: "int1",
    name: "Hiring Manager",
    email: "hiring.manager@company.com",
    role: "Primary Interviewer",
    isBackup: false,
  },
];

const defaultConfig: VideoInterviewConfiguration = {
  name: "Video Interview Configuration",
  platform: "meet",
  duration: 60,
  questions: defaultQuestions,
  interviewers: defaultInterviewers,
  candidatePreparation:
    "Please join the video call 5 minutes early to test your audio and video. Ensure you have a stable internet connection and are in a quiet, well-lit environment.",
  interviewerGuidelines:
    "Welcome the candidate warmly, explain the interview structure, and ensure both parties can see and hear clearly before beginning.",
};

export function VideoInterviewConfig({
  jobId,
  roundId,
  round,
  onConfigurationChange,
}: VideoInterviewConfigProps) {
  const {
    config: savedConfig,
    loading,
    error,
    saveConfiguration,
  } = useRoundConfiguration(jobId, roundId);
  const [config, setConfig] =
    useState<VideoInterviewConfiguration>(defaultConfig);

  // Google Calendar Authorization States
  const [isGoogleCalendarAuthorized, setIsGoogleCalendarAuthorized] =
    useState(false);
  const [checkingAuthorization, setCheckingAuthorization] = useState(true);
  const [authorizingGoogleCalendar, setAuthorizingGoogleCalendar] =
    useState(false);
  const [revokingAuthorization, setRevokingAuthorization] = useState(false);
  const [googleCalendarAuthError, setGoogleCalendarAuthError] = useState("");

  // Google Meet Link States
  const [generatingMeetLink, setGeneratingMeetLink] = useState(false);
  const [meetLink, setMeetLink] = useState("");
  const [meetLinkError, setMeetLinkError] = useState("");

  // Load configuration from the backend when available
  useEffect(() => {
    if (savedConfig) {
      console.log("Received saved config:", savedConfig);

      // First set the top-level properties
      const baseConfig = {
        ...defaultConfig,
        name: savedConfig.name || defaultConfig.name,
        duration: savedConfig.duration || defaultConfig.duration,
      };

      // Then merge in configuration data if available
      if (
        savedConfig.configurationData &&
        typeof savedConfig.configurationData === "object"
      ) {
        console.log("Found configuration data:", savedConfig.configurationData);

        // Clean the configuration data using our utility function
        const cleanConfigData = cleanJsonObject(savedConfig.configurationData);
        console.log("Cleaned configuration data:", cleanConfigData);

        // Sanitize questions if present to ensure followUpPrompts is always defined
        let sanitizedQuestions = defaultConfig.questions;
        if (
          cleanConfigData.questions &&
          Array.isArray(cleanConfigData.questions)
        ) {
          sanitizedQuestions = cleanConfigData.questions.map(
            (question: any) => {
              return {
                ...question,
                // Ensure followUpPrompts is defined
                followUpPrompts: question.followUpPrompts || [],
              };
            }
          );
        }

        // Sanitize interviewers if present
        let sanitizedInterviewers = defaultConfig.interviewers;
        if (
          cleanConfigData.interviewers &&
          Array.isArray(cleanConfigData.interviewers)
        ) {
          sanitizedInterviewers = cleanConfigData.interviewers.map(
            (interviewer: any) => {
              // Check if interviewer is malformed (has numeric keys or missing required fields)
              const hasNumericKeys =
                typeof interviewer === "object" &&
                interviewer !== null &&
                Object.keys(interviewer).some((key) => !isNaN(Number(key)));

              if (hasNumericKeys || !interviewer.id) {
                // Create a valid interviewer object, preserving valid fields
                return {
                  id:
                    // TODO: Remove this once we have a proper id for the interviewer
                    interviewer.id ||
                    `int_${Date.now()}_${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,
                  name: interviewer.name || "Unknown",
                  email: interviewer.email || "unknown@example.com",
                  role: interviewer.role || "Interviewer",
                  isBackup: interviewer.isBackup || false,
                };
              }
              return interviewer;
            }
          );
          console.log("Sanitized interviewers:", sanitizedInterviewers);
        }

        // Create a clean merged config
        const mergedConfig = {
          ...baseConfig,
          ...cleanConfigData,
          // Ensure meetingDuration defaults to duration if not set
          meetingDuration:
            cleanConfigData.meetingDuration || baseConfig.duration,
          // Use sanitized arrays
          questions: sanitizedQuestions,
          interviewers: sanitizedInterviewers,
        };

        console.log("Setting merged config:", mergedConfig);
        setConfig(mergedConfig);
      } else {
        console.warn(
          "No configuration data found in saved config, using defaults"
        );
        setConfig(baseConfig);
      }
    }
  }, [savedConfig]);

  const [expandedSections, setExpandedSections] = useState({
    platform: true,
    questions: true,
    interviewers: true,
    settings: true,
    instructions: false,
  });

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    category: "technical" as Question["category"],
    followUpPrompts: [""],
  });

  const [newInterviewer, setNewInterviewer] = useState({
    name: "",
    email: "",
    role: "",
    isBackup: false,
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddInterviewer, setShowAddInterviewer] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfigChange = (
    updates: Partial<VideoInterviewConfiguration>
  ) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigurationChange(newConfig);
  };

  const handleSaveConfiguration = async () => {
    // Prepare the configuration for saving
    setSaving(true);

    // Ensure config.questions is an array
    const safeQuestions = Array.isArray(config.questions)
      ? config.questions
      : defaultConfig.questions;

    const simplifiedQuestions = safeQuestions.map((q) => ({
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: q.text || "",
      category: q.category || "experience",
      followUpPrompts: q.followUpPrompts || [],
    }));

    // Log the questions that will be saved - this is for debugging
    console.log(
      `Preparing to save ${simplifiedQuestions.length} questions:`,
      simplifiedQuestions
    );

    // Validate and sanitize interviewers to ensure they have the correct structure
    const sanitizedInterviewers = Array.isArray(config.interviewers)
      ? config.interviewers.map((interviewer: any) => {
          // Check if interviewer has numeric keys, which indicates an issue
          const hasNumericKeys =
            typeof interviewer === "object" &&
            interviewer !== null &&
            Object.keys(interviewer).some((key) => !isNaN(Number(key)));

          if (hasNumericKeys || !interviewer.id) {
            // Create a new valid interviewer object
            return {
              id:
                interviewer.id ||
                `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: interviewer.name || "Unknown",
              email: interviewer.email || "unknown@example.com",
              role: interviewer.role || "Interviewer",
              isBackup: interviewer.isBackup || false,
            };
          }

          return interviewer;
        })
      : defaultConfig.interviewers;

    console.log("Sanitized interviewers:", sanitizedInterviewers);
    console.log("Simplified questions:", simplifiedQuestions);

    // Create a clean configuration data object with only the properties we need
    const configDataToSave = {
      platform: config.platform,
      questions: simplifiedQuestions, // Ensure questions are included
      interviewers: sanitizedInterviewers,
      interviewerGuidelines: config.interviewerGuidelines,
      candidatePreparation: config.candidatePreparation,
      // Include scheduling data
      meetingTitle: config.meetingTitle,
      meetingDate: config.meetingDate,
      meetingTime: config.meetingTime,
      meetingDuration: config.meetingDuration,
      scheduledMeetingId: config.scheduledMeetingId,
      meetLink: config.meetLink,
    };

    // Make sure questions are logged before cleaning
    console.log("Pre-clean configuration:", configDataToSave);
    console.log(
      "Pre-clean questions count:",
      configDataToSave.questions?.length || 0
    );

    // Create a backup copy of the questions for extra safety
    const questionsBackup = [...simplifiedQuestions];

    // Clean the configuration data using our utility function
    const cleanConfigData = cleanJsonObject(configDataToSave);

    // Verify questions are still there after cleaning
    console.log("Post-clean configuration:", cleanConfigData);
    console.log(
      "Post-clean questions count:",
      cleanConfigData.questions?.length || 0
    );

    // Double check questions are present
    if (
      !cleanConfigData.questions ||
      !Array.isArray(cleanConfigData.questions) ||
      cleanConfigData.questions.length === 0
    ) {
      console.warn(
        "Questions missing or empty after cleaning, restoring from backup"
      );
      cleanConfigData.questions = questionsBackup;
    }

    // Create the request object to send to the backend
    const configToSave = {
      name: config.name, // Use the name from our current config
      description:
        savedConfig?.description || "Configuration for video interview round",
      duration: config.duration, // We still keep duration at the top level as it's a base property
      status: savedConfig?.status || "draft",
      configurationData: cleanConfigData, // Clean configuration data
      // Add questions directly at top level as well for extra safety
      questions: questionsBackup,
    };

    console.log("Final configuration to save:", configToSave);
    console.log(
      "Final questions count:",
      configToSave.configurationData.questions?.length || 0
    );
    console.log("Backup questions count:", configToSave.questions?.length || 0);

    try {
      const result = await saveConfiguration(configToSave);
      if (result) {
        console.log("Configuration saved successfully");
      } else {
        console.error("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addQuestion = () => {
    if (!newQuestion.text.trim()) return;

    const question: Question = {
      id: `vq_${Date.now()}`,
      text: newQuestion.text,
      category: newQuestion.category,
      followUpPrompts: newQuestion.followUpPrompts.filter(
        (p) => p.trim() !== ""
      ),
    };

    handleConfigChange({
      questions: [...config.questions, question],
    });

    setNewQuestion({
      text: "",
      category: "technical",
      followUpPrompts: [""],
    });
    setShowAddQuestion(false);
  };

  const removeQuestion = (questionId: string) => {
    handleConfigChange({
      questions: config.questions.filter((q) => q.id !== questionId),
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    handleConfigChange({
      questions: config.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
  };

  const addInterviewer = () => {
    if (!newInterviewer.name.trim() || !newInterviewer.email.trim()) return;

    const interviewer: Interviewer = {
      id: `int_${Date.now()}`,
      name: newInterviewer.name,
      email: newInterviewer.email,
      role: newInterviewer.role || "Interviewer",
      isBackup: newInterviewer.isBackup,
    };

    handleConfigChange({
      interviewers: [...config.interviewers, interviewer],
    });

    setNewInterviewer({
      name: "",
      email: "",
      role: "",
      isBackup: false,
    });
    setShowAddInterviewer(false);
  };

  const removeInterviewer = (interviewerId: string) => {
    handleConfigChange({
      interviewers: config.interviewers.filter((i) => i.id !== interviewerId),
    });
  };

  const updateInterviewer = (
    interviewerId: string,
    updates: Partial<Interviewer>
  ) => {
    handleConfigChange({
      interviewers: config.interviewers.map((i) =>
        i.id === interviewerId ? { ...i, ...updates } : i
      ),
    });
  };

  // Google Calendar Handler Functions
  const checkGoogleCalendarAuthorization = async () => {
    try {
      setCheckingAuthorization(true);
      const response = await googleCalendarService.isAuthorized();
      if (response.success && response.data) {
        setIsGoogleCalendarAuthorized(response.data.isAuthorized);
      }
    } catch (error) {
      console.error("Error checking Google Calendar authorization:", error);
      setGoogleCalendarAuthError("Failed to check authorization status");
    } finally {
      setCheckingAuthorization(false);
    }
  };

  const handleAuthorizeGoogleCalendar = async () => {
    try {
      setAuthorizingGoogleCalendar(true);
      setGoogleCalendarAuthError("");

      // Use popup window for authorization
      const success = await googleCalendarService.authorizeWithPopup();

      if (success) {
        setIsGoogleCalendarAuthorized(true);
      } else {
        setGoogleCalendarAuthError("Authorization was cancelled or failed");
      }
    } catch (error) {
      console.error("Error authorizing Google Calendar:", error);
      setGoogleCalendarAuthError("Failed to authorize Google Calendar");
    } finally {
      setAuthorizingGoogleCalendar(false);
    }
  };

  const handleRevokeGoogleCalendarAuthorization = async () => {
    try {
      setRevokingAuthorization(true);
      setGoogleCalendarAuthError("");

      const response = await googleCalendarService.revokeAuthorization();

      if (response.success) {
        setIsGoogleCalendarAuthorized(false);
        setMeetLink(""); // Clear any existing meet link
      } else {
        setGoogleCalendarAuthError(
          response.message || "Failed to revoke authorization"
        );
      }
    } catch (error) {
      console.error("Error revoking Google Calendar authorization:", error);
      setGoogleCalendarAuthError(
        "Failed to revoke Google Calendar authorization"
      );
    } finally {
      setRevokingAuthorization(false);
    }
  };

  const handleGenerateMeetLink = async () => {
    try {
      setGeneratingMeetLink(true);
      setMeetLinkError("");
      setMeetLink("");

      console.log("Generating Meet link for job:", jobId, "round:", roundId);
      console.log("Current platform configuration:", config.platform);

      const response = await roundConfigurationAPI.generateMeetLink(
        jobId,
        roundId
      );

      if (response.success && response.data) {
        setMeetLink(response.data.meetLink);
        console.log(
          "Meet link generated successfully:",
          response.data.meetLink
        );

        // Show a success message if the platform was migrated
        if (response.message && response.message.includes("migrated")) {
          // You could add a toast notification here if you have a toast system
          console.log(
            "Platform configuration was automatically migrated to Google Meet"
          );
        }
      } else {
        const errorMessage =
          response.message || "Failed to generate Google Meet link";
        setMeetLinkError(errorMessage);
        console.error("Failed to generate Meet link:", errorMessage);
      }
    } catch (error) {
      console.error("Error generating Google Meet link:", error);
      setMeetLinkError(
        "Failed to generate Google Meet link. Please check the console for details."
      );
    } finally {
      setGeneratingMeetLink(false);
    }
  };

  // Check Google Calendar authorization on component mount
  useEffect(() => {
    checkGoogleCalendarAuthorization();
  }, []);

  const getCategoryColor = (category: Question["category"]) => {
    const colors = {
      technical: "bg-blue-100 text-blue-800",

      culture: "bg-purple-100 text-purple-800",
      experience: "bg-amber-100 text-amber-800",
      scenario: "bg-rose-100 text-rose-800",
    };
    return colors[category];
  };

  const getCategoryLabel = (category: Question["category"]) => {
    const labels = {
      technical: "Technical",

      culture: "Culture",
      experience: "Experience",
      scenario: "Scenario",
    };
    return labels[category];
  };

  const addFollowUpPrompt = (questionId: string) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        followUpPrompts: [...question.followUpPrompts, ""],
      });
    }
  };

  const removeFollowUpPrompt = (questionId: string, index: number) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question) {
      const newPrompts = [...question.followUpPrompts];
      newPrompts.splice(index, 1);
      updateQuestion(questionId, { followUpPrompts: newPrompts });
    }
  };

  const updateFollowUpPrompt = (
    questionId: string,
    index: number,
    value: string
  ) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question) {
      const newPrompts = [...question.followUpPrompts];
      newPrompts[index] = value;
      updateQuestion(questionId, { followUpPrompts: newPrompts });
    }
  };

  // Loading, error and return states
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <p className="font-medium">Error loading configuration</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Video Interview Configuration
        </h2>
        <button
          onClick={handleSaveConfiguration}
          disabled={saving}
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center ${
            saving ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      {/* Round Instructions */}
      <RoundInstructions roundType="video_interview" />

      {/* Configuration Name */}
      <div className="mb-4">
        <label
          htmlFor="configName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Configuration Name
        </label>
        <input
          type="text"
          id="configName"
          value={config.name}
          onChange={(e) => handleConfigChange({ name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter configuration name"
        />
        <p className="mt-1 text-xs text-gray-500">
          Give your video interview configuration a descriptive name
        </p>
      </div>

      {/* Platform Settings */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("platform")}
        >
          <div className="flex items-center space-x-3">
            <Video className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Platform & Recording
            </h3>
          </div>
          {expandedSections.platform ? (
            <ChevronUp key="platform-up" className="h-5 w-5" />
          ) : (
            <ChevronDown key="platform-down" className="h-5 w-5" />
          )}
        </div>

        {expandedSections.platform && (
          <div
            key="platform-expanded"
            className="p-4 border-t border-gray-200 space-y-4"
          >
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Google Meet Integration
                </h3>
                <Video className="h-5 w-5 text-blue-500" />
              </div>

              <p className="text-sm text-blue-700 mb-3">
                This interview will be conducted via Google Meet.
              </p>

              {/* Google Calendar Authorization Status */}
              <div className="mb-4 p-3 bg-white rounded-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">
                      Google Calendar Access:
                    </span>
                    {checkingAuthorization ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
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

                  <div>
                    {isGoogleCalendarAuthorized ? (
                      <button
                        onClick={handleRevokeGoogleCalendarAuthorization}
                        disabled={revokingAuthorization}
                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {revokingAuthorization
                          ? "Revoking..."
                          : "Revoke Access"}
                      </button>
                    ) : (
                      <button
                        onClick={handleAuthorizeGoogleCalendar}
                        disabled={authorizingGoogleCalendar}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {authorizingGoogleCalendar ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Authorizing...
                          </>
                        ) : (
                          "Authorize Google Calendar"
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {googleCalendarAuthError && (
                  <div className="mt-2 flex items-center text-xs text-red-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {googleCalendarAuthError}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  Authorization is required to schedule meetings in your
                  personal calendar.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Duration (minutes)
              </label>
              <input
                type="number"
                value={config.duration}
                onChange={(e) => {
                  // Allow the field to be cleared for typing
                  if (e.target.value === "") {
                    handleConfigChange({ duration: 15, meetingDuration: 15 });
                  } else {
                    const value = parseInt(e.target.value);
                    // Handle NaN and enforce min/max
                    if (!isNaN(value)) {
                      const validValue = Math.max(15, Math.min(180, value));
                      handleConfigChange({
                        duration: validValue,
                        meetingDuration: validValue,
                      });
                    }
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="15"
                max="180"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                value={config.meetingTitle || ""}
                onChange={(e) =>
                  handleConfigChange({ meetingTitle: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Technical Interview - {Candidate Name}"
              />
              <p className="mt-1 text-xs text-gray-500">
                This title will be used as the default for scheduling
                interviews. Use {"{Candidate Name}"} as a placeholder.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Questions Section */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("questions")}
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Interview Questions
            </h3>
            <span className="text-sm text-gray-500">
              ({Array.isArray(config.questions) ? config.questions.length : 0}{" "}
              questions)
            </span>
          </div>
          {expandedSections.questions ? (
            <ChevronUp key="questions-up" className="h-5 w-5" />
          ) : (
            <ChevronDown key="questions-down" className="h-5 w-5" />
          )}
        </div>

        {expandedSections.questions && (
          <div
            key="questions-expanded"
            className="p-4 border-t border-gray-200 space-y-4"
          >
            {(Array.isArray(config.questions) ? config.questions : []).map(
              (question) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          question.category
                        )}`}
                      >
                        {getCategoryLabel(question.category)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question
                      </label>
                      <textarea
                        value={question.text}
                        onChange={(e) =>
                          updateQuestion(question.id, { text: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={question.category}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            category: e.target.value as Question["category"],
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="culture">Culture</option>
                        <option value="experience">Experience</option>
                        <option value="scenario">Scenario</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Follow-up Prompts
                      </label>
                      <div className="space-y-2">
                        {(question.followUpPrompts || []).map(
                          (prompt, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="text"
                                value={prompt}
                                onChange={(e) =>
                                  updateFollowUpPrompt(
                                    question.id,
                                    index,
                                    e.target.value
                                  )
                                }
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Follow-up question..."
                              />
                              <button
                                onClick={() =>
                                  removeFollowUpPrompt(question.id, index)
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        )}
                        <button
                          onClick={() => addFollowUpPrompt(question.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          + Add follow-up prompt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {showAddQuestion ? (
              <div
                key="add-question-form"
                className="border border-dashed border-gray-300 rounded-lg p-4"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    <textarea
                      value={newQuestion.text}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, text: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newQuestion.category}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          category: e.target.value as Question["category"],
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="technical">Technical</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="culture">Culture</option>
                      <option value="experience">Experience</option>
                      <option value="scenario">Scenario</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addQuestion}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Add Question
                    </button>
                    <button
                      onClick={() => setShowAddQuestion(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                key="add-question-button"
                onClick={() => setShowAddQuestion(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add New Question
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interviewers Section */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("interviewers")}
        >
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Interviewers
            </h3>
            <span className="text-sm text-gray-500">
              (
              {Array.isArray(config.interviewers)
                ? config.interviewers.length
                : 0}{" "}
              assigned)
            </span>
          </div>
          {expandedSections.interviewers ? (
            <ChevronUp key="interviewers-up" className="h-5 w-5" />
          ) : (
            <ChevronDown key="interviewers-down" className="h-5 w-5" />
          )}
        </div>

        {expandedSections.interviewers && (
          <div
            key="interviewers-expanded"
            className="p-4 border-t border-gray-200 space-y-4"
          >
            {(Array.isArray(config.interviewers)
              ? config.interviewers
              : []
            ).map((interviewer) => (
              <div
                key={interviewer.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {interviewer.name}
                    </span>
                    {interviewer.isBackup && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Backup
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeInterviewer(interviewer.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={interviewer.name}
                      onChange={(e) =>
                        updateInterviewer(interviewer.id, {
                          name: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={interviewer.email}
                      onChange={(e) =>
                        updateInterviewer(interviewer.id, {
                          email: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={interviewer.role}
                      onChange={(e) =>
                        updateInterviewer(interviewer.id, {
                          role: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Technical Lead, HR Manager"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={interviewer.isBackup}
                        onChange={(e) =>
                          updateInterviewer(interviewer.id, {
                            isBackup: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Backup interviewer
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {showAddInterviewer ? (
              <div
                key="add-interviewer-form"
                className="border border-dashed border-gray-300 rounded-lg p-4"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newInterviewer.name}
                        onChange={(e) =>
                          setNewInterviewer({
                            ...newInterviewer,
                            name: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newInterviewer.email}
                        onChange={(e) =>
                          setNewInterviewer({
                            ...newInterviewer,
                            email: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="email@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={newInterviewer.role}
                        onChange={(e) =>
                          setNewInterviewer({
                            ...newInterviewer,
                            role: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Technical Lead"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newInterviewer.isBackup}
                          onChange={(e) =>
                            setNewInterviewer({
                              ...newInterviewer,
                              isBackup: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Backup interviewer
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addInterviewer}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Add Interviewer
                    </button>
                    <button
                      onClick={() => setShowAddInterviewer(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                key="add-interviewer-button"
                onClick={() => setShowAddInterviewer(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add Interviewer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Instructions Section */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("instructions")}
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Instructions & Guidelines
            </h3>
          </div>
          {expandedSections.instructions ? (
            <ChevronUp key="instructions-up" className="h-5 w-5" />
          ) : (
            <ChevronDown key="instructions-down" className="h-5 w-5" />
          )}
        </div>

        {expandedSections.instructions && (
          <div
            key="instructions-expanded"
            className="p-4 border-t border-gray-200 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer Guidelines
              </label>
              <textarea
                value={config.interviewerGuidelines}
                onChange={(e) =>
                  handleConfigChange({ interviewerGuidelines: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Guidelines for interviewers..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Preparation Instructions
              </label>
              <textarea
                value={config.candidatePreparation}
                onChange={(e) =>
                  handleConfigChange({ candidatePreparation: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Instructions to send to candidates..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              Configuration Summary
            </h4>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p>
                •{" "}
                {config.platform.charAt(0).toUpperCase() +
                  config.platform.slice(1)}{" "}
                platform
              </p>
              <p>
                •{" "}
                {Array.isArray(config.questions) ? config.questions.length : 0}{" "}
                interview questions configured
              </p>
              <p>
                •{" "}
                {Array.isArray(config.interviewers)
                  ? config.interviewers.filter((i) => !i.isBackup).length
                  : 0}{" "}
                primary interviewer(s),{" "}
                {Array.isArray(config.interviewers)
                  ? config.interviewers.filter((i) => i.isBackup).length
                  : 0}{" "}
                backup(s)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

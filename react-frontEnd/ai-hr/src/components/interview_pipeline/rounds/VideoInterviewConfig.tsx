"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Video,
  Clock,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Settings,
  Camera,
  Mic,
  Monitor,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  category: "technical" | "behavioral" | "culture" | "experience" | "scenario";
  followUpPrompts: string[];
  timeAllocation: number; // minutes
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
  platform: "zoom" | "teams" | "meet" | "custom";
  customPlatformUrl?: string;
  duration: number;
  bufferTime: number;
  autoRecord: boolean;
  recordingStorage: "cloud" | "local";
  waitingRoomEnabled: boolean;
  questions: Question[];
  interviewers: Interviewer[];
  techCheckRequired: boolean;
  candidatePreparation: string;
  interviewerGuidelines: string;
  meetingSettings: {
    allowScreenShare: boolean;
    allowChat: boolean;
    muteOnEntry: boolean;
    videoOnEntry: boolean;
  };
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
    timeAllocation: 10,
  },
  {
    id: "vq2",
    text: "Describe a time when you had to work with a difficult team member.",
    category: "behavioral",
    followUpPrompts: [
      "How did you handle the situation?",
      "What was the outcome?",
    ],
    timeAllocation: 8,
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

export function VideoInterviewConfig({
  jobId,
  roundId,
  round,
  onConfigurationChange,
}: VideoInterviewConfigProps) {
  const [config, setConfig] = useState<VideoInterviewConfiguration>({
    name: "Video Interview Configuration",
    platform: "zoom",
    duration: 60,
    bufferTime: 10,
    autoRecord: true,
    recordingStorage: "cloud",
    waitingRoomEnabled: true,
    questions: defaultQuestions,
    interviewers: defaultInterviewers,
    techCheckRequired: true,
    candidatePreparation:
      "Please join the video call 5 minutes early to test your audio and video. Ensure you have a stable internet connection and are in a quiet, well-lit environment.",
    interviewerGuidelines:
      "Welcome the candidate warmly, explain the interview structure, and ensure both parties can see and hear clearly before beginning.",
    meetingSettings: {
      allowScreenShare: true,
      allowChat: true,
      muteOnEntry: false,
      videoOnEntry: true,
    },
  });

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
    timeAllocation: 5,
  });

  const [newInterviewer, setNewInterviewer] = useState({
    name: "",
    email: "",
    role: "",
    isBackup: false,
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddInterviewer, setShowAddInterviewer] = useState(false);

  const handleConfigChange = (
    updates: Partial<VideoInterviewConfiguration>
  ) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigurationChange(newConfig);
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
      timeAllocation: newQuestion.timeAllocation,
    };

    handleConfigChange({
      questions: [...config.questions, question],
    });

    setNewQuestion({
      text: "",
      category: "technical",
      followUpPrompts: [""],
      timeAllocation: 5,
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

  const getCategoryColor = (category: Question["category"]) => {
    const colors = {
      technical: "bg-blue-100 text-blue-800",
      behavioral: "bg-green-100 text-green-800",
      culture: "bg-purple-100 text-purple-800",
      experience: "bg-orange-100 text-orange-800",
      scenario: "bg-pink-100 text-pink-800",
    };
    return colors[category];
  };

  const getCategoryLabel = (category: Question["category"]) => {
    const labels = {
      technical: "Technical",
      behavioral: "Behavioral",
      culture: "Culture",
      experience: "Experience",
      scenario: "Scenario",
    };
    return labels[category];
  };

  const addFollowUpPrompt = (questionId: string) => {
    updateQuestion(questionId, {
      followUpPrompts: [
        ...(config.questions.find((q) => q.id === questionId)
          ?.followUpPrompts || []),
        "",
      ],
    });
  };

  const removeFollowUpPrompt = (questionId: string, index: number) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        followUpPrompts: question.followUpPrompts.filter((_, i) => i !== index),
      });
    }
  };

  const updateFollowUpPrompt = (
    questionId: string,
    index: number,
    value: string
  ) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question) {
      const updatedPrompts = [...question.followUpPrompts];
      updatedPrompts[index] = value;
      updateQuestion(questionId, { followUpPrompts: updatedPrompts });
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Configuration Name */}
      <div className="mb-4">
        <label
          htmlFor="configName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Configuration Name
        </label>
        <input
          id="configName"
          type="text"
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
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.platform && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Platform
                </label>
                <select
                  value={config.platform}
                  onChange={(e) =>
                    handleConfigChange({ platform: e.target.value as any })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="meet">Google Meet</option>
                  <option value="custom">Custom Platform</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recording Storage
                </label>
                <select
                  value={config.recordingStorage}
                  onChange={(e) =>
                    handleConfigChange({
                      recordingStorage: e.target.value as any,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="cloud">Cloud Storage</option>
                  <option value="local">Local Storage</option>
                </select>
              </div>
            </div>

            {config.platform === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Platform URL
                </label>
                <input
                  type="url"
                  value={config.customPlatformUrl || ""}
                  onChange={(e) =>
                    handleConfigChange({ customPlatformUrl: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://your-platform.com/meeting"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={config.duration}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({ duration: 15 });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(15, Math.min(180, value));
                        handleConfigChange({ duration: validValue });
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
                  Buffer Time (minutes)
                </label>
                <input
                  type="number"
                  value={config.bufferTime}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({ bufferTime: 0 });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(0, Math.min(30, value));
                        handleConfigChange({ bufferTime: validValue });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="30"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoRecord}
                  onChange={(e) =>
                    handleConfigChange({ autoRecord: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Auto-start recording
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.waitingRoomEnabled}
                  onChange={(e) =>
                    handleConfigChange({ waitingRoomEnabled: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable waiting room
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.techCheckRequired}
                  onChange={(e) =>
                    handleConfigChange({ techCheckRequired: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Require pre-interview tech check
                </span>
              </label>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Meeting Settings
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.meetingSettings.allowScreenShare}
                    onChange={(e) =>
                      handleConfigChange({
                        meetingSettings: {
                          ...config.meetingSettings,
                          allowScreenShare: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow screen sharing
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.meetingSettings.allowChat}
                    onChange={(e) =>
                      handleConfigChange({
                        meetingSettings: {
                          ...config.meetingSettings,
                          allowChat: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow chat</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.meetingSettings.muteOnEntry}
                    onChange={(e) =>
                      handleConfigChange({
                        meetingSettings: {
                          ...config.meetingSettings,
                          muteOnEntry: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Mute on entry
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.meetingSettings.videoOnEntry}
                    onChange={(e) =>
                      handleConfigChange({
                        meetingSettings: {
                          ...config.meetingSettings,
                          videoOnEntry: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Video on entry
                  </span>
                </label>
              </div>
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
              ({config.questions.length} questions)
            </span>
          </div>
          {expandedSections.questions ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.questions && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {config.questions.map((question) => (
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
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {question.timeAllocation} min
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

                  <div className="grid grid-cols-2 gap-4">
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
                        Time Allocation (minutes)
                      </label>
                      <input
                        type="number"
                        value={question.timeAllocation}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            timeAllocation: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                        max="30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Follow-up Prompts
                    </label>
                    <div className="space-y-2">
                      {question.followUpPrompts.map((prompt, index) => (
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
                      ))}
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
            ))}

            {showAddQuestion ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
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

                  <div className="grid grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Allocation (minutes)
                      </label>
                      <input
                        type="number"
                        value={newQuestion.timeAllocation}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            timeAllocation: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                        max="30"
                      />
                    </div>
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
              ({config.interviewers.length} assigned)
            </span>
          </div>
          {expandedSections.interviewers ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.interviewers && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {config.interviewers.map((interviewer) => (
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
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
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
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.instructions && (
          <div className="p-4 border-t border-gray-200 space-y-4">
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
                platform with {config.duration} minute duration
              </p>
              <p>• {config.questions.length} interview questions configured</p>
              <p>
                • {config.interviewers.filter((i) => !i.isBackup).length}{" "}
                primary interviewer(s),{" "}
                {config.interviewers.filter((i) => i.isBackup).length} backup(s)
              </p>
              <p>
                • Recording {config.autoRecord ? "enabled" : "disabled"}, tech
                check {config.techCheckRequired ? "required" : "optional"}
              </p>
              <p>
                • Total estimated time:{" "}
                {config.questions.reduce((sum, q) => sum + q.timeAllocation, 0)}{" "}
                minutes for questions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

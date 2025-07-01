"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Users,
  User,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Settings,
  Vote,
  MessageSquare,
} from "lucide-react";

interface PanelMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isLead: boolean;
  assignedQuestions: string[];
  weight: number; // 1-5 for decision weight
}

interface Question {
  id: string;
  text: string;
  category: string;
  assignedTo: string; // panel member id
  timeAllocation: number;
  followUpQuestions: string[];
}

interface VotingRule {
  type: "unanimous" | "majority" | "weighted" | "lead_decides";
  threshold?: number; // for majority/weighted
  requiredVoters?: string[]; // specific panel members required
}

interface PanelInterviewConfiguration {
  name: string;
  panelSize: number;
  minPanelSize: number;
  maxPanelSize: number;
  panelMembers: PanelMember[];
  questions: Question[];
  duration: number;
  votingRules: VotingRule;
  coordinationSettings: {
    sharedEvaluationForm: boolean;
    realTimeCollaboration: boolean;
    privateNotes: boolean;
    discussionPhase: boolean;
    discussionDuration: number;
  };
  logisticsSettings: {
    roomBookingRequired: boolean;
    techSetupTime: number;
    bufferTime: number;
    backupInterviewers: string[];
  };
  instructions: string;
  panelGuidelines: string;
}

interface PanelInterviewConfigProps {
  jobId: string;
  roundId: string;
  round: any;
  onConfigurationChange: (newConfig: any) => void;
}

const defaultPanelMembers: PanelMember[] = [
  {
    id: "pm1",
    name: "Hiring Manager",
    email: "hiring.manager@company.com",
    role: "Lead Interviewer",
    department: "HR",
    isLead: true,
    assignedQuestions: [],
    weight: 3,
  },
  {
    id: "pm2",
    name: "Technical Lead",
    email: "tech.lead@company.com",
    role: "Technical Interviewer",
    department: "Engineering",
    isLead: false,
    assignedQuestions: [],
    weight: 2,
  },
];

export function PanelInterviewConfig({
  jobId,
  roundId,
  round,
  onConfigurationChange,
}: PanelInterviewConfigProps) {
  const [config, setConfig] = useState<PanelInterviewConfiguration>({
    name: "Panel Interview",
    panelSize: 3,
    minPanelSize: 2,
    maxPanelSize: 5,
    panelMembers: defaultPanelMembers,
    questions: [],
    duration: 90,
    votingRules: {
      type: "majority",
      threshold: 51,
    },
    coordinationSettings: {
      sharedEvaluationForm: true,
      realTimeCollaboration: true,
      privateNotes: true,
      discussionPhase: true,
      discussionDuration: 15,
    },
    logisticsSettings: {
      roomBookingRequired: true,
      techSetupTime: 10,
      bufferTime: 15,
      backupInterviewers: [],
    },
    instructions:
      "This panel interview will assess the candidate across multiple dimensions. Each panel member has specific questions to ask and areas to evaluate. Please coordinate your questions and maintain professional conduct throughout.",
    panelGuidelines:
      "Lead interviewer manages timing and flow. Technical members focus on domain expertise. All members participate in final discussion and decision-making process.",
  });

  const [expandedSections, setExpandedSections] = useState({
    panel: true,
    questions: true,
    voting: true,
    coordination: false,
    logistics: false,
  });

  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    isLead: false,
    weight: 2,
  });

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    category: "",
    assignedTo: "",
    timeAllocation: 5,
    followUpQuestions: [""],
  });

  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const handleConfigChange = (
    updates: Partial<PanelInterviewConfiguration>
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

  const addPanelMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) return;

    const member: PanelMember = {
      id: `pm_${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role || "Interviewer",
      department: newMember.department,
      isLead: newMember.isLead,
      assignedQuestions: [],
      weight: newMember.weight,
    };

    handleConfigChange({
      panelMembers: [...config.panelMembers, member],
    });

    setNewMember({
      name: "",
      email: "",
      role: "",
      department: "",
      isLead: false,
      weight: 2,
    });
    setShowAddMember(false);
  };

  const removePanelMember = (memberId: string) => {
    handleConfigChange({
      panelMembers: config.panelMembers.filter((m) => m.id !== memberId),
      questions: config.questions.map((q) =>
        q.assignedTo === memberId ? { ...q, assignedTo: "" } : q
      ),
    });
  };

  const updatePanelMember = (
    memberId: string,
    updates: Partial<PanelMember>
  ) => {
    handleConfigChange({
      panelMembers: config.panelMembers.map((m) =>
        m.id === memberId ? { ...m, ...updates } : m
      ),
    });
  };

  const addQuestion = () => {
    if (!newQuestion.text.trim()) return;

    const question: Question = {
      id: `q_${Date.now()}`,
      text: newQuestion.text,
      category: newQuestion.category,
      assignedTo: newQuestion.assignedTo,
      timeAllocation: newQuestion.timeAllocation,
      followUpQuestions: newQuestion.followUpQuestions.filter(
        (q) => q.trim() !== ""
      ),
    };

    handleConfigChange({
      questions: [...config.questions, question],
    });

    // Update panel member's assigned questions
    if (newQuestion.assignedTo) {
      const member = config.panelMembers.find(
        (m) => m.id === newQuestion.assignedTo
      );
      if (member) {
        updatePanelMember(newQuestion.assignedTo, {
          assignedQuestions: [...member.assignedQuestions, question.id],
        });
      }
    }

    setNewQuestion({
      text: "",
      category: "",
      assignedTo: "",
      timeAllocation: 5,
      followUpQuestions: [""],
    });
    setShowAddQuestion(false);
  };

  const removeQuestion = (questionId: string) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question && question.assignedTo) {
      const member = config.panelMembers.find(
        (m) => m.id === question.assignedTo
      );
      if (member) {
        updatePanelMember(question.assignedTo, {
          assignedQuestions: member.assignedQuestions.filter(
            (id) => id !== questionId
          ),
        });
      }
    }

    handleConfigChange({
      questions: config.questions.filter((q) => q.id !== questionId),
    });
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 4) return "bg-red-100 text-red-800";
    if (weight >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="p-6 space-y-8">
      {/* Panel Composition */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("panel")}
        >
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Panel Composition
            </h3>
            <span className="text-sm text-gray-500">
              ({config.panelMembers.length} members)
            </span>
          </div>
          {expandedSections.panel ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.panel && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Panel Size
                </label>
                <input
                  type="number"
                  value={config.panelSize}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({ panelSize: 2 });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(2, Math.min(8, value));
                        handleConfigChange({ panelSize: validValue });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="2"
                  max="8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Size
                </label>
                <input
                  type="number"
                  value={config.minPanelSize}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({ minPanelSize: 1 });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(
                          1,
                          Math.min(config.maxPanelSize, value)
                        );
                        handleConfigChange({ minPanelSize: validValue });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max={config.maxPanelSize}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Size
                </label>
                <input
                  type="number"
                  value={config.maxPanelSize}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({
                        maxPanelSize: Math.max(config.minPanelSize, 2),
                      });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(
                          config.minPanelSize,
                          Math.min(8, value)
                        );
                        handleConfigChange({ maxPanelSize: validValue });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min={config.minPanelSize}
                  max="8"
                />
              </div>
            </div>

            {config.panelMembers.map((member) => (
              <div
                key={member.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">
                      {member.name}
                    </span>
                    {member.isLead && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Lead
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getWeightColor(
                        member.weight
                      )}`}
                    >
                      Weight {member.weight}
                    </span>
                  </div>
                  <button
                    onClick={() => removePanelMember(member.id)}
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
                      value={member.name}
                      onChange={(e) =>
                        updatePanelMember(member.id, { name: e.target.value })
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
                      value={member.email}
                      onChange={(e) =>
                        updatePanelMember(member.id, { email: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) =>
                        updatePanelMember(member.id, { role: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={member.department}
                      onChange={(e) =>
                        updatePanelMember(member.id, {
                          department: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={member.isLead}
                        onChange={(e) =>
                          updatePanelMember(member.id, {
                            isLead: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Panel Lead
                      </span>
                    </label>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">
                        Decision Weight:
                      </label>
                      <select
                        value={member.weight}
                        onChange={(e) =>
                          updatePanelMember(member.id, {
                            weight: parseInt(e.target.value),
                          })
                        }
                        className="p-1 border border-gray-300 rounded text-sm"
                      >
                        <option value={1}>1 - Low</option>
                        <option value={2}>2 - Medium</option>
                        <option value={3}>3 - High</option>
                        <option value={4}>4 - Very High</option>
                        <option value={5}>5 - Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    {member.assignedQuestions.length} questions assigned
                  </div>
                </div>
              </div>
            ))}

            {showAddMember ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newMember.name}
                        onChange={(e) =>
                          setNewMember({ ...newMember, name: e.target.value })
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
                        value={newMember.email}
                        onChange={(e) =>
                          setNewMember({ ...newMember, email: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="email@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={newMember.role}
                        onChange={(e) =>
                          setNewMember({ ...newMember, role: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Technical Lead"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={newMember.department}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            department: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Engineering"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMember.isLead}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            isLead: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Panel Lead
                      </span>
                    </label>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">
                        Decision Weight:
                      </label>
                      <select
                        value={newMember.weight}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            weight: parseInt(e.target.value),
                          })
                        }
                        className="p-1 border border-gray-300 rounded text-sm"
                      >
                        <option value={1}>1 - Low</option>
                        <option value={2}>2 - Medium</option>
                        <option value={3}>3 - High</option>
                        <option value={4}>4 - Very High</option>
                        <option value={5}>5 - Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addPanelMember}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Add Member
                    </button>
                    <button
                      onClick={() => setShowAddMember(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add Panel Member
              </button>
            )}
          </div>
        )}
      </div>

      {/* Question Distribution */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("questions")}
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Question Distribution
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Duration (minutes)
              </label>
              <input
                type="number"
                value={config.duration}
                onChange={(e) =>
                  handleConfigChange({ duration: parseInt(e.target.value) })
                }
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="60"
                max="180"
              />
            </div>

            {config.questions.map((question) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {question.category}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {question.timeAllocation} min
                    </span>
                    {question.assignedTo && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {config.panelMembers.find(
                          (m) => m.id === question.assignedTo
                        )?.name || "Unknown"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-900 mb-2">
                  {question.text}
                </div>

                {question.followUpQuestions.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Follow-ups: {question.followUpQuestions.join(", ")}
                  </div>
                )}
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

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={newQuestion.category}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            category: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Technical"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned To
                      </label>
                      <select
                        value={newQuestion.assignedTo}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            assignedTo: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select panel member...</option>
                        {config.panelMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time (minutes)
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
                Add Question
              </button>
            )}
          </div>
        )}
      </div>

      {/* Voting & Decision Rules */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("voting")}
        >
          <div className="flex items-center space-x-3">
            <Vote className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Decision Making
            </h3>
          </div>
          {expandedSections.voting ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.voting && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voting Method
              </label>
              <select
                value={config.votingRules.type}
                onChange={(e) =>
                  handleConfigChange({
                    votingRules: {
                      ...config.votingRules,
                      type: e.target.value as any,
                    },
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="unanimous">Unanimous Decision</option>
                <option value="majority">Simple Majority</option>
                <option value="weighted">Weighted Vote</option>
                <option value="lead_decides">Lead Interviewer Decides</option>
              </select>
            </div>

            {config.votingRules.type === "majority" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threshold (%)
                </label>
                <input
                  type="number"
                  value={config.votingRules.threshold || 51}
                  onChange={(e) =>
                    handleConfigChange({
                      votingRules: {
                        ...config.votingRules,
                        threshold: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="50"
                  max="100"
                />
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Coordination Settings
              </h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.coordinationSettings.sharedEvaluationForm}
                    onChange={(e) =>
                      handleConfigChange({
                        coordinationSettings: {
                          ...config.coordinationSettings,
                          sharedEvaluationForm: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Use shared evaluation form
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.coordinationSettings.realTimeCollaboration}
                    onChange={(e) =>
                      handleConfigChange({
                        coordinationSettings: {
                          ...config.coordinationSettings,
                          realTimeCollaboration: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable real-time collaboration
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.coordinationSettings.privateNotes}
                    onChange={(e) =>
                      handleConfigChange({
                        coordinationSettings: {
                          ...config.coordinationSettings,
                          privateNotes: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow private notes
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.coordinationSettings.discussionPhase}
                    onChange={(e) =>
                      handleConfigChange({
                        coordinationSettings: {
                          ...config.coordinationSettings,
                          discussionPhase: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include discussion phase
                  </span>
                </label>
              </div>

              {config.coordinationSettings.discussionPhase && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discussion Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.coordinationSettings.discussionDuration}
                    onChange={(e) =>
                      handleConfigChange({
                        coordinationSettings: {
                          ...config.coordinationSettings,
                          discussionDuration: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    min="5"
                    max="60"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("logistics")}
        >
          <div className="flex items-center space-x-3">
            <Settings className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Instructions & Guidelines
            </h3>
          </div>
          {expandedSections.logistics ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.logistics && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Panel Guidelines
              </label>
              <textarea
                value={config.panelGuidelines}
                onChange={(e) =>
                  handleConfigChange({ panelGuidelines: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Guidelines for panel members..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={config.instructions}
                onChange={(e) =>
                  handleConfigChange({ instructions: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Instructions for the panel interview..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tech Setup Time (minutes)
                </label>
                <input
                  type="number"
                  value={config.logisticsSettings.techSetupTime}
                  onChange={(e) =>
                    handleConfigChange({
                      logisticsSettings: {
                        ...config.logisticsSettings,
                        techSetupTime: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer Time (minutes)
                </label>
                <input
                  type="number"
                  value={config.logisticsSettings.bufferTime}
                  onChange={(e) =>
                    handleConfigChange({
                      logisticsSettings: {
                        ...config.logisticsSettings,
                        bufferTime: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="60"
                />
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.logisticsSettings.roomBookingRequired}
                onChange={(e) =>
                  handleConfigChange({
                    logisticsSettings: {
                      ...config.logisticsSettings,
                      roomBookingRequired: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Room booking required
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-indigo-900">
              Panel Interview Summary
            </h4>
            <div className="mt-2 text-sm text-indigo-700 space-y-1">
              <p>
                • {config.panelMembers.length} panel members (
                {config.panelMembers.filter((m) => m.isLead).length} lead)
              </p>
              <p>
                • {config.duration} minute interview with{" "}
                {config.questions.length} questions assigned
              </p>
              <p>
                • {config.votingRules.type} voting method with{" "}
                {config.coordinationSettings.discussionPhase
                  ? "discussion phase"
                  : "no discussion"}
              </p>
              <p>
                • Total weighted score:{" "}
                {config.panelMembers.reduce((sum, m) => sum + m.weight, 0)}{" "}
                points
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

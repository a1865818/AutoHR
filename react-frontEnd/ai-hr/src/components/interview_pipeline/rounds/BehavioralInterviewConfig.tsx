"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Star,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Brain,
  Loader2,
} from "lucide-react";
import { useRoundConfiguration } from "@/hooks/useRoundConfiguration";
import { cleanJsonObject } from "@/utils/jsonUtils";
import { RoundInstructions } from "./shared/RoundInstructions";

interface Competency {
  id: string;
  name: string;
  description: string;
  weight: number; // 1-5
  indicators: string[];
  questions: string[];
}

interface Question {
  id: string;
  text: string;
  competencyId: string;
  starFramework: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  followUpQuestions: string[];
  scoringCriteria: ScoringLevel[];
}

interface ScoringLevel {
  level: number;
  label: string;
  description: string;
  indicators: string[];
}

interface BehavioralInterviewConfiguration {
  name: string;
  competencies: Competency[];
  questions: Question[];
  duration: number;
  scoringMethod: "star" | "likert" | "combined";
  biasPreventionMeasures: {
    structuredInterview: boolean;
    diversePanel: boolean;
    standardizedScoring: boolean;
    unconsciousBiasTips: boolean;
  };
  interviewerGuidelines: string;
  candidatePreparation: string;
  consistencyChecks: {
    calibrationQuestions: boolean;
    interRaterReliability: boolean;
    followUpRequired: boolean;
  };
}

interface BehavioralInterviewConfigProps {
  jobId: string;
  roundId: string;
  onConfigurationChange: (newConfig: BehavioralInterviewConfiguration) => void;
}

const defaultCompetencies: Competency[] = [
  {
    id: "comp1",
    name: "Leadership",
    description:
      "Ability to guide, influence, and inspire others to achieve goals",
    weight: 5,
    indicators: [
      "Takes initiative in group settings",
      "Motivates and influences team members",
      "Makes decisions under pressure",
      "Delegates effectively",
    ],
    questions: [
      "Tell me about a time when you had to lead a team through a difficult situation",
      "Describe a situation where you had to motivate an underperforming team member",
    ],
  },
  {
    id: "comp2",
    name: "Communication",
    description:
      "Effectively conveys information and ideas to diverse audiences",
    weight: 4,
    indicators: [
      "Listens actively and responds appropriately",
      "Presents ideas clearly and concisely",
      "Adapts communication style to audience",
      "Handles difficult conversations professionally",
    ],
    questions: [
      "Describe a time when you had to explain a complex concept to someone without technical background",
      "Tell me about a situation where you had to deliver bad news to a colleague or client",
    ],
  },
];

const defaultScoringLevels: ScoringLevel[] = [
  {
    level: 1,
    label: "Below Expectations",
    description: "Response lacks detail or demonstrates limited competency",
    indicators: [
      "Vague or incomplete examples",
      "No clear outcome or learning",
      "Limited self-awareness",
    ],
  },
  {
    level: 2,
    label: "Partially Meets Expectations",
    description: "Response shows some competency but lacks depth",
    indicators: [
      "Basic example provided",
      "Some outcomes mentioned",
      "Limited reflection on learning",
    ],
  },
  {
    level: 3,
    label: "Meets Expectations",
    description: "Clear demonstration of competency with good detail",
    indicators: [
      "Complete STAR response",
      "Clear positive outcome",
      "Shows learning and growth",
    ],
  },
  {
    level: 4,
    label: "Exceeds Expectations",
    description: "Strong demonstration with excellent detail and insight",
    indicators: [
      "Detailed and compelling example",
      "Outstanding results",
      "Significant learning and application",
    ],
  },
  {
    level: 5,
    label: "Outstanding",
    description:
      "Exceptional demonstration of competency with remarkable insight",
    indicators: [
      "Exceptional example with multiple stakeholders",
      "Transformational results",
      "Deep insights and continued application",
    ],
  },
];

const defaultConfig: BehavioralInterviewConfiguration = {
  name: "Behavioral Interview",
  competencies: defaultCompetencies,
  questions: [],
  duration: 60,
  scoringMethod: "combined",
  biasPreventionMeasures: {
    structuredInterview: true,
    diversePanel: false,
    standardizedScoring: true,
    unconsciousBiasTips: true,
  },
  interviewerGuidelines:
    "Use the STAR method to evaluate responses. Focus on specific examples and probe for details about the candidate's personal contribution. Avoid leading questions and maintain consistency across all candidates.",
  candidatePreparation:
    "Prepare specific examples from your experience that demonstrate leadership, teamwork, problem-solving, and communication skills. Use the STAR method (Situation, Task, Action, Result) to structure your responses.",
  consistencyChecks: {
    calibrationQuestions: true,
    interRaterReliability: true,
    followUpRequired: true,
  },
};

export function BehavioralInterviewConfig({
  jobId,
  roundId,
  onConfigurationChange,
}: BehavioralInterviewConfigProps) {
  const {
    config: savedConfig,
    loading,
    error,
    saveConfiguration,
  } = useRoundConfiguration(jobId, roundId);
  const [config, setConfig] =
    useState<BehavioralInterviewConfiguration>(defaultConfig);
  const [saving, setSaving] = useState(false);

  // Load configuration from the backend when available
  useEffect(() => {
    if (savedConfig) {
      const configurationData = savedConfig.configurationData || {};

      // Merge saved configuration with defaults
      setConfig((prevConfig) => ({
        ...prevConfig,
        // First merge the main configuration properties
        name: savedConfig.name || prevConfig.name,
        duration: savedConfig.duration || prevConfig.duration,
        // Then merge the configuration data
        ...configurationData,
        // Ensure nested objects are properly merged
        biasPreventionMeasures: {
          ...prevConfig.biasPreventionMeasures,
          ...(configurationData.biasPreventionMeasures || {}),
        },
        consistencyChecks: {
          ...prevConfig.consistencyChecks,
          ...(configurationData.consistencyChecks || {}),
        },
      }));
    }
  }, [savedConfig]);

  const [expandedSections, setExpandedSections] = useState({
    competencies: true,
    questions: true,
    scoring: true,
    bias: false,
    guidelines: false,
  });

  const [newCompetency, setNewCompetency] = useState({
    name: "",
    description: "",
    weight: 3,
    indicators: [""],
    questions: [""],
  });

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    competencyId: "",
    followUpQuestions: [""],
    starFramework: {
      situation: "",
      task: "",
      action: "",
      result: "",
    },
  });

  const [showAddCompetency, setShowAddCompetency] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const handleConfigChange = (
    updates: Partial<BehavioralInterviewConfiguration>
  ) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigurationChange(newConfig);
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);

    // Create a clean configuration data object with only the properties we need
    const configDataToSave = {
      competencies: config.competencies,
      questions: config.questions,
      duration: config.duration,
      scoringMethod: config.scoringMethod,
      biasPreventionMeasures: config.biasPreventionMeasures,
      interviewerGuidelines: config.interviewerGuidelines,
      candidatePreparation: config.candidatePreparation,
      consistencyChecks: config.consistencyChecks,
    };

    // Clean the configuration data using our utility function
    const cleanConfigData = cleanJsonObject(configDataToSave);

    // Create the request object to send to the backend
    const configToSave = {
      name: config.name,
      description:
        savedConfig?.description ||
        "Configuration for behavioral interview round",
      duration: config.duration,
      status: savedConfig?.status || "draft",
      configurationData: cleanConfigData,
    };

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

  const addCompetency = () => {
    if (!newCompetency.name.trim()) return;

    const competency: Competency = {
      id: `comp_${Date.now()}`,
      name: newCompetency.name,
      description: newCompetency.description,
      weight: newCompetency.weight,
      indicators: newCompetency.indicators.filter((i) => i.trim() !== ""),
      questions: newCompetency.questions.filter((q) => q.trim() !== ""),
    };

    handleConfigChange({
      competencies: [...config.competencies, competency],
    });

    setNewCompetency({
      name: "",
      description: "",
      weight: 3,
      indicators: [""],
      questions: [""],
    });
    setShowAddCompetency(false);
  };

  const removeCompetency = (competencyId: string) => {
    handleConfigChange({
      competencies: config.competencies.filter((c) => c.id !== competencyId),
      questions: config.questions.filter(
        (q) => q.competencyId !== competencyId
      ),
    });
  };

  const updateCompetency = (
    competencyId: string,
    updates: Partial<Competency>
  ) => {
    handleConfigChange({
      competencies: config.competencies.map((c) =>
        c.id === competencyId ? { ...c, ...updates } : c
      ),
    });
  };

  const addQuestion = () => {
    if (!newQuestion.text.trim() || !newQuestion.competencyId) return;

    const question: Question = {
      id: `q_${Date.now()}`,
      text: newQuestion.text,
      competencyId: newQuestion.competencyId,
      starFramework: newQuestion.starFramework,
      followUpQuestions: newQuestion.followUpQuestions.filter(
        (q) => q.trim() !== ""
      ),
      scoringCriteria: defaultScoringLevels,
    };

    handleConfigChange({
      questions: [...config.questions, question],
    });

    setNewQuestion({
      text: "",
      competencyId: "",
      followUpQuestions: [""],
      starFramework: {
        situation: "",
        task: "",
        action: "",
        result: "",
      },
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

  const addIndicator = (competencyId: string) => {
    const competency = config.competencies.find((c) => c.id === competencyId);
    if (competency) {
      updateCompetency(competencyId, {
        indicators: [...competency.indicators, ""],
      });
    }
  };

  const removeIndicator = (competencyId: string, index: number) => {
    const competency = config.competencies.find((c) => c.id === competencyId);
    if (competency) {
      updateCompetency(competencyId, {
        indicators: competency.indicators.filter((_, i) => i !== index),
      });
    }
  };

  const updateIndicator = (
    competencyId: string,
    index: number,
    value: string
  ) => {
    const competency = config.competencies.find((c) => c.id === competencyId);
    if (competency) {
      const newIndicators = [...competency.indicators];
      newIndicators[index] = value;
      updateCompetency(competencyId, { indicators: newIndicators });
    }
  };

  const addFollowUp = (questionId: string) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        followUpQuestions: [...question.followUpQuestions, ""],
      });
    }
  };

  const removeFollowUp = (questionId: string, index: number) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        followUpQuestions: question.followUpQuestions.filter(
          (_, i) => i !== index
        ),
      });
    }
  };

  const updateFollowUp = (questionId: string, index: number, value: string) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question) {
      const newFollowUps = [...question.followUpQuestions];
      newFollowUps[index] = value;
      updateQuestion(questionId, { followUpQuestions: newFollowUps });
    }
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 4) return "bg-red-100 text-red-800";
    if (weight >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getWeightLabel = (weight: number) => {
    const labels = {
      1: "Low",
      2: "Below Average",
      3: "Average",
      4: "High",
      5: "Critical",
    };
    return labels[weight as keyof typeof labels] || "Unknown";
  };

  // Loading and error states
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
          Behavioral Interview Configuration
        </h2>
        {/* <button
          onClick={handleSaveConfiguration}
          disabled={saving}
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center ${
            saving ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Configuration"}
        </button> */}
      </div>

      {/* Round Instructions */}
      <RoundInstructions roundType="behavioral_interview" />

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
          Give your behavioral interview configuration a descriptive name
        </p>
      </div>

      {/* Competencies Framework */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("competencies")}
        >
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Competency Framework
            </h3>
            <span className="text-sm text-gray-500">
              ({config.competencies.length} competencies)
            </span>
          </div>
          {expandedSections.competencies ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.competencies && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {config.competencies.map((competency) => (
              <div
                key={competency.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">
                      {competency.name}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getWeightColor(
                        competency.weight
                      )}`}
                    >
                      {getWeightLabel(competency.weight)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeCompetency(competency.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Competency Name
                    </label>
                    <input
                      type="text"
                      value={competency.name}
                      onChange={(e) =>
                        updateCompetency(competency.id, {
                          name: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={competency.description}
                      onChange={(e) =>
                        updateCompetency(competency.id, {
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importance Weight (1-5)
                    </label>
                    <select
                      value={competency.weight}
                      onChange={(e) =>
                        updateCompetency(competency.id, {
                          weight: parseInt(e.target.value),
                        })
                      }
                      className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={1}>1 - Low</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={3}>3 - Average</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Critical</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Behavioral Indicators
                      </label>
                      <button
                        onClick={() => addIndicator(competency.id)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        + Add indicator
                      </button>
                    </div>
                    <div className="space-y-2">
                      {competency.indicators.map((indicator, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={indicator}
                            onChange={(e) =>
                              updateIndicator(
                                competency.id,
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Observable behavior that demonstrates this competency..."
                          />
                          <button
                            onClick={() =>
                              removeIndicator(competency.id, index)
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {showAddCompetency ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Competency Name
                    </label>
                    <input
                      type="text"
                      value={newCompetency.name}
                      onChange={(e) =>
                        setNewCompetency({
                          ...newCompetency,
                          name: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Problem Solving"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newCompetency.description}
                      onChange={(e) =>
                        setNewCompetency({
                          ...newCompetency,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      placeholder="Define what this competency means..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importance Weight (1-5)
                    </label>
                    <select
                      value={newCompetency.weight}
                      onChange={(e) =>
                        setNewCompetency({
                          ...newCompetency,
                          weight: parseInt(e.target.value),
                        })
                      }
                      className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={1}>1 - Low</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={3}>3 - Average</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Critical</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addCompetency}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Add Competency
                    </button>
                    <button
                      onClick={() => setShowAddCompetency(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCompetency(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add New Competency
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interview Questions */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("questions")}
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              STAR-Method Questions
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
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {config.competencies.find(
                        (c) => c.id === question.competencyId
                      )?.name || "Unknown"}
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
                      Competency
                    </label>
                    <select
                      value={question.competencyId}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          competencyId: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select competency...</option>
                      {config.competencies.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      STAR Framework Guide (for interviewer)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Situation
                        </label>
                        <textarea
                          value={question.starFramework.situation}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              starFramework: {
                                ...question.starFramework,
                                situation: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded text-xs"
                          rows={2}
                          placeholder="What to listen for in the situation..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Task
                        </label>
                        <textarea
                          value={question.starFramework.task}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              starFramework: {
                                ...question.starFramework,
                                task: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded text-xs"
                          rows={2}
                          placeholder="What to listen for in the task..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Action
                        </label>
                        <textarea
                          value={question.starFramework.action}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              starFramework: {
                                ...question.starFramework,
                                action: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded text-xs"
                          rows={2}
                          placeholder="What to listen for in the action..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Result
                        </label>
                        <textarea
                          value={question.starFramework.result}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              starFramework: {
                                ...question.starFramework,
                                result: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded text-xs"
                          rows={2}
                          placeholder="What to listen for in the result..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Follow-up Questions
                      </label>
                      <button
                        onClick={() => addFollowUp(question.id)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        + Add follow-up
                      </button>
                    </div>
                    <div className="space-y-2">
                      {question.followUpQuestions.map((followUp, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={followUp}
                            onChange={(e) =>
                              updateFollowUp(question.id, index, e.target.value)
                            }
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Follow-up or probing question..."
                          />
                          <button
                            onClick={() => removeFollowUp(question.id, index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
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
                      placeholder="Enter your behavioral question..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Competency
                    </label>
                    <select
                      value={newQuestion.competencyId}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          competencyId: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select competency...</option>
                      {config.competencies.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
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

      {/* Scoring & Evaluation */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("scoring")}
        >
          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Scoring Method
            </h3>
          </div>
          {expandedSections.scoring ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.scoring && (
          <div className="p-4 border-t border-gray-200 space-y-4">
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
                    handleConfigChange({ duration: 30 });
                  } else {
                    const value = parseInt(e.target.value);
                    // Handle NaN and enforce min/max
                    if (!isNaN(value)) {
                      const validValue = Math.max(30, Math.min(180, value));
                      handleConfigChange({ duration: validValue });
                    }
                  }
                }}
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="30"
                max="180"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scoring Method
              </label>
              <select
                value={config.scoringMethod}
                onChange={(e) =>
                  handleConfigChange({
                    scoringMethod: e.target.value as
                      | "star"
                      | "likert"
                      | "combined",
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="star">STAR Method Only</option>
                <option value="likert">Likert Scale (1-5)</option>
                <option value="combined">Combined STAR + Likert</option>
              </select>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Standard Scoring Levels
              </h4>
              <div className="space-y-2">
                {defaultScoringLevels.map((level) => (
                  <div
                    key={level.level}
                    className="border border-gray-200 rounded p-3"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-sm font-bold">
                        {level.level}
                      </span>
                      <span className="font-medium text-gray-900">
                        {level.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {level.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      Key indicators: {level.indicators.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Consistency Checks
              </h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.consistencyChecks.calibrationQuestions}
                    onChange={(e) =>
                      handleConfigChange({
                        consistencyChecks: {
                          ...config.consistencyChecks,
                          calibrationQuestions: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include calibration questions
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.consistencyChecks.interRaterReliability}
                    onChange={(e) =>
                      handleConfigChange({
                        consistencyChecks: {
                          ...config.consistencyChecks,
                          interRaterReliability: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Track inter-rater reliability
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.consistencyChecks.followUpRequired}
                    onChange={(e) =>
                      handleConfigChange({
                        consistencyChecks: {
                          ...config.consistencyChecks,
                          followUpRequired: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Require follow-up questions
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bias Prevention */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("bias")}
        >
          <div className="flex items-center space-x-3">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Bias Prevention
            </h3>
          </div>
          {expandedSections.bias ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.bias && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.biasPreventionMeasures.structuredInterview}
                  onChange={(e) =>
                    handleConfigChange({
                      biasPreventionMeasures: {
                        ...config.biasPreventionMeasures,
                        structuredInterview: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Use structured interview format
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.biasPreventionMeasures.diversePanel}
                  onChange={(e) =>
                    handleConfigChange({
                      biasPreventionMeasures: {
                        ...config.biasPreventionMeasures,
                        diversePanel: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Require diverse interview panel
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.biasPreventionMeasures.standardizedScoring}
                  onChange={(e) =>
                    handleConfigChange({
                      biasPreventionMeasures: {
                        ...config.biasPreventionMeasures,
                        standardizedScoring: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Use standardized scoring rubrics
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.biasPreventionMeasures.unconsciousBiasTips}
                  onChange={(e) =>
                    handleConfigChange({
                      biasPreventionMeasures: {
                        ...config.biasPreventionMeasures,
                        unconsciousBiasTips: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show unconscious bias tips
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("guidelines")}
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Instructions & Guidelines
            </h3>
          </div>
          {expandedSections.guidelines ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.guidelines && (
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
                placeholder="Instructions for candidates..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-900">
              Interview Configuration Summary
            </h4>
            <div className="mt-2 text-sm text-green-700 space-y-1">
              <p>
                • {config.competencies.length} competencies defined with{" "}
                {config.questions.length} STAR-method questions
              </p>
              <p>
                • {config.duration} minute structured interview using{" "}
                {config.scoringMethod} scoring method
              </p>
              <p>
                • Bias prevention:{" "}
                {
                  Object.values(config.biasPreventionMeasures).filter(Boolean)
                    .length
                }
                /4 measures enabled
              </p>
              <p>
                • Consistency checks:{" "}
                {Object.values(config.consistencyChecks).filter(Boolean).length}
                /3 features enabled
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

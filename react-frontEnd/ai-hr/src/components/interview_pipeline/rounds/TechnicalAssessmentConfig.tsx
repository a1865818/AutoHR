"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
  Target,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { useRoundConfiguration } from "@/hooks/useRoundConfiguration";
import { cleanJsonObject } from "@/utils/jsonUtils";
import { RoundInstructions } from "./shared/RoundInstructions";

interface Question {
  id: string;
  text: string;
  type: "multiple_choice" | "short_answer" | "essay";
  points: number;
  options?: string[]; // for multiple choice
  correctAnswer?: string; // for multiple choice
  expectedResponse?: string; // for short answer/essay (evaluation guidance)
}

interface CaseStudy {
  id: string;
  title: string;
  scenario: string;
  attachments?: string[]; // URLs or references to case study materials
  questions: Question[];
}

interface TechnicalAssessmentConfiguration {
  name: string;
  description: string;
  totalTimeLimit: number; // minutes
  passingScore: number; // percentage
  instructions: string;
  evaluationCriteria: string;
  caseStudies: CaseStudy[];
  showScoresImmediately: boolean;
  provideFeedback: boolean;
}

interface TechnicalAssessmentConfigProps {
  jobId: string;
  roundId: string;
  onConfigurationChange: (newConfig: TechnicalAssessmentConfiguration) => void;
}

const defaultCaseStudy: CaseStudy = {
  id: "cs1",
  title: "System Design Challenge",
  scenario:
    "You are tasked with designing a scalable e-commerce platform that can handle high traffic during peak shopping seasons. Consider database design, API architecture, and scaling strategies.",
  questions: [
    {
      id: "q1",
      text: "What database structure would you recommend for this e-commerce platform and why?",
      type: "essay",
      points: 20,
      expectedResponse:
        "Look for discussion of SQL vs NoSQL, data relationships, normalization considerations, and scalability factors.",
    },
    {
      id: "q2",
      text: "Which of the following is typically the best approach for handling high traffic spikes?",
      type: "multiple_choice",
      points: 10,
      options: [
        "Vertical scaling only",
        "Horizontal scaling with load balancing",
        "Disabling features during peak times",
        "Limiting user access",
      ],
      correctAnswer: "Horizontal scaling with load balancing",
    },
  ],
};

export function TechnicalAssessmentConfig({
  jobId,
  roundId,
  onConfigurationChange,
}: TechnicalAssessmentConfigProps) {
  const {
    config: savedConfig,
    loading,
    error,
    saveConfiguration,
  } = useRoundConfiguration(jobId, roundId);
  const [config, setConfig] = useState<TechnicalAssessmentConfiguration>({
    name: "Technical Case Study Assessment",
    description:
      "Assessment based on real-world technical scenarios and case studies",
    totalTimeLimit: 90,
    passingScore: 70,
    instructions:
      "This assessment consists of case studies with related questions. Read each scenario carefully before answering the questions. Manage your time effectively as there's a time limit for the entire assessment.",
    evaluationCriteria:
      "Responses will be evaluated based on technical accuracy, problem-solving approach, clarity of explanation, and practical feasibility of solutions.",
    caseStudies: [defaultCaseStudy],
    showScoresImmediately: false,
    provideFeedback: true,
  });
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
        // Then merge the configuration data
        ...configurationData,
        // Ensure caseStudies are properly merged
        caseStudies: configurationData.caseStudies || prevConfig.caseStudies,
      }));
    }
  }, [savedConfig]);

  const [expandedSections, setExpandedSections] = useState({
    settings: true,
    caseStudies: true,
    evaluation: false,
  });

  const [expandedCaseStudies, setExpandedCaseStudies] = useState<
    Record<string, boolean>
  >({
    cs1: true,
  });

  const [showAddCaseStudy, setShowAddCaseStudy] = useState(false);
  const [newCaseStudy, setNewCaseStudy] = useState<
    Omit<CaseStudy, "id" | "questions">
  >({
    title: "",
    scenario: "",
  });

  const handleConfigChange = (
    updates: Partial<TechnicalAssessmentConfiguration>
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

  const toggleCaseStudy = (caseStudyId: string) => {
    setExpandedCaseStudies((prev) => ({
      ...prev,
      [caseStudyId]: !prev[caseStudyId],
    }));
  };

  const addCaseStudy = () => {
    if (!newCaseStudy.title.trim()) return;

    const caseStudy: CaseStudy = {
      id: `cs_${Date.now()}`,
      title: newCaseStudy.title,
      scenario: newCaseStudy.scenario,
      questions: [],
    };

    handleConfigChange({
      caseStudies: [...config.caseStudies, caseStudy],
    });

    setExpandedCaseStudies((prev) => ({
      ...prev,
      [caseStudy.id]: true,
    }));

    setNewCaseStudy({
      title: "",
      scenario: "",
    });
    setShowAddCaseStudy(false);
  };

  const removeCaseStudy = (caseStudyId: string) => {
    handleConfigChange({
      caseStudies: config.caseStudies.filter((cs) => cs.id !== caseStudyId),
    });
  };

  const updateCaseStudy = (
    caseStudyId: string,
    updates: Partial<CaseStudy>
  ) => {
    handleConfigChange({
      caseStudies: config.caseStudies.map((cs) =>
        cs.id === caseStudyId ? { ...cs, ...updates } : cs
      ),
    });
  };

  const addQuestion = (caseStudyId: string) => {
    const caseStudy = config.caseStudies.find((cs) => cs.id === caseStudyId);
    if (!caseStudy) return;

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: "",
      type: "multiple_choice",
      points: 10,
      options: ["", "", "", ""],
    };

    updateCaseStudy(caseStudyId, {
      questions: [...caseStudy.questions, newQuestion],
    });
  };

  const removeQuestion = (caseStudyId: string, questionId: string) => {
    const caseStudy = config.caseStudies.find((cs) => cs.id === caseStudyId);
    if (!caseStudy) return;

    updateCaseStudy(caseStudyId, {
      questions: caseStudy.questions.filter((q) => q.id !== questionId),
    });
  };

  const updateQuestion = (
    caseStudyId: string,
    questionId: string,
    updates: Partial<Question>
  ) => {
    const caseStudy = config.caseStudies.find((cs) => cs.id === caseStudyId);
    if (!caseStudy) return;

    updateCaseStudy(caseStudyId, {
      questions: caseStudy.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
  };

  const getQuestionTypeLabel = (type: Question["type"]) => {
    const types = {
      multiple_choice: "Multiple Choice",
      short_answer: "Short Answer",
      essay: "Essay/Long Answer",
    };
    return types[type];
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);

    // Create a clean configuration data object with only the properties we need
    const configDataToSave = {
      description: config.description,
      totalTimeLimit: config.totalTimeLimit,
      passingScore: config.passingScore,
      instructions: config.instructions,
      evaluationCriteria: config.evaluationCriteria,
      caseStudies: config.caseStudies,
      showScoresImmediately: config.showScoresImmediately,
      provideFeedback: config.provideFeedback,
    };

    // Clean the configuration data using our utility function
    const cleanConfigData = cleanJsonObject(configDataToSave);

    // Create the request object to send to the backend
    const configToSave = {
      name: config.name,
      description:
        savedConfig?.description ||
        "Configuration for technical assessment round",
      duration: config.totalTimeLimit,
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
          Technical Assessment Configuration
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
      <RoundInstructions roundType="technical_assessment" />

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
          Give your technical assessment configuration a descriptive name
        </p>
      </div>

      {/* Assessment Settings */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("settings")}
        >
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Assessment Settings
            </h3>
          </div>
          {expandedSections.settings ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.settings && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => handleConfigChange({ name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={config.description}
                  onChange={(e) =>
                    handleConfigChange({ description: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={config.totalTimeLimit}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({
                        totalTimeLimit: 30,
                      });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(30, Math.min(300, value));
                        handleConfigChange({
                          totalTimeLimit: validValue,
                        });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="30"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  value={config.passingScore}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({
                        passingScore: 0,
                      });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(0, Math.min(100, value));
                        handleConfigChange({
                          passingScore: validValue,
                        });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions for Candidates
              </label>
              <textarea
                value={config.instructions}
                onChange={(e) =>
                  handleConfigChange({ instructions: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showScoresImmediately}
                  onChange={(e) =>
                    handleConfigChange({
                      showScoresImmediately: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  id="showScores"
                />
                <label
                  htmlFor="showScores"
                  className="ml-2 text-sm text-gray-700"
                >
                  Show scores immediately after submission
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.provideFeedback}
                  onChange={(e) =>
                    handleConfigChange({ provideFeedback: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  id="provideFeedback"
                />
                <label
                  htmlFor="provideFeedback"
                  className="ml-2 text-sm text-gray-700"
                >
                  Provide feedback on responses
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Case Studies */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("caseStudies")}
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Case Studies
            </h3>
            <span className="text-sm text-gray-500">
              ({config.caseStudies.length} case studies)
            </span>
          </div>
          {expandedSections.caseStudies ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.caseStudies && (
          <div className="p-4 border-t border-gray-200 space-y-6">
            {config.caseStudies.map((caseStudy) => (
              <div
                key={caseStudy.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 bg-gray-50"
                  onClick={() => toggleCaseStudy(caseStudy.id)}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">
                      {caseStudy.title}
                    </h4>
                    <span className="text-sm text-gray-500">
                      ({caseStudy.questions.length} questions)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCaseStudy(caseStudy.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {expandedCaseStudies[caseStudy.id] ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {expandedCaseStudies[caseStudy.id] && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Case Study Title
                      </label>
                      <input
                        type="text"
                        value={caseStudy.title}
                        onChange={(e) =>
                          updateCaseStudy(caseStudy.id, {
                            title: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Case Study Scenario
                      </label>
                      <textarea
                        value={caseStudy.scenario}
                        onChange={(e) =>
                          updateCaseStudy(caseStudy.id, {
                            scenario: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={4}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-700">
                          Questions
                        </h5>
                        <button
                          onClick={() => addQuestion(caseStudy.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center space-x-1"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Question</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {caseStudy.questions.map((question, qIndex) => (
                          <div
                            key={question.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-700">
                                  Question {qIndex + 1}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                  {getQuestionTypeLabel(question.type)}
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {question.points} pts
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  removeQuestion(caseStudy.id, question.id)
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Question Text
                                </label>
                                <textarea
                                  value={question.text}
                                  onChange={(e) =>
                                    updateQuestion(caseStudy.id, question.id, {
                                      text: e.target.value,
                                    })
                                  }
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                  rows={2}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Question Type
                                  </label>
                                  <select
                                    value={question.type}
                                    onChange={(e) =>
                                      updateQuestion(
                                        caseStudy.id,
                                        question.id,
                                        {
                                          type: e.target
                                            .value as Question["type"],
                                        }
                                      )
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="multiple_choice">
                                      Multiple Choice
                                    </option>
                                    <option value="short_answer">
                                      Short Answer
                                    </option>
                                    <option value="essay">
                                      Essay/Long Answer
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Points
                                  </label>
                                  <input
                                    type="number"
                                    value={question.points}
                                    onChange={(e) =>
                                      updateQuestion(
                                        caseStudy.id,
                                        question.id,
                                        {
                                          points: parseInt(e.target.value) || 0,
                                        }
                                      )
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    min="1"
                                    max="100"
                                  />
                                </div>
                              </div>

                              {question.type === "multiple_choice" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Answer Options
                                  </label>
                                  <div className="space-y-2">
                                    {(question.options || []).map(
                                      (option, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-2"
                                        >
                                          <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={
                                              question.correctAnswer === option
                                            }
                                            onChange={() =>
                                              updateQuestion(
                                                caseStudy.id,
                                                question.id,
                                                {
                                                  correctAnswer: option,
                                                }
                                              )
                                            }
                                            className="text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => {
                                              const newOptions = [
                                                ...(question.options || []),
                                              ];
                                              newOptions[index] =
                                                e.target.value;
                                              updateQuestion(
                                                caseStudy.id,
                                                question.id,
                                                {
                                                  options: newOptions,
                                                }
                                              );
                                            }}
                                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder={`Option ${index + 1}`}
                                          />
                                          {index > 1 && (
                                            <button
                                              onClick={() => {
                                                const newOptions = [
                                                  ...(question.options || []),
                                                ];
                                                newOptions.splice(index, 1);
                                                updateQuestion(
                                                  caseStudy.id,
                                                  question.id,
                                                  {
                                                    options: newOptions,
                                                  }
                                                );
                                              }}
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          )}
                                        </div>
                                      )
                                    )}
                                    <button
                                      onClick={() => {
                                        const newOptions = [
                                          ...(question.options || []),
                                          "",
                                        ];
                                        updateQuestion(
                                          caseStudy.id,
                                          question.id,
                                          {
                                            options: newOptions,
                                          }
                                        );
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center space-x-1"
                                    >
                                      <Plus className="h-4 w-4" />
                                      <span>Add Option</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {(question.type === "short_answer" ||
                                question.type === "essay") && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expected Response / Evaluation Guidelines
                                  </label>
                                  <textarea
                                    value={question.expectedResponse || ""}
                                    onChange={(e) =>
                                      updateQuestion(
                                        caseStudy.id,
                                        question.id,
                                        {
                                          expectedResponse: e.target.value,
                                        }
                                      )
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={3}
                                    placeholder="Guidance on what constitutes a good answer..."
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {caseStudy.questions.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No questions yet</p>
                            <p className="text-sm">
                              Click &quot;Add Question&quot; to get started
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showAddCaseStudy ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Case Study Title
                    </label>
                    <input
                      type="text"
                      value={newCaseStudy.title}
                      onChange={(e) =>
                        setNewCaseStudy({
                          ...newCaseStudy,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., System Design Challenge"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Case Study Scenario
                    </label>
                    <textarea
                      value={newCaseStudy.scenario}
                      onChange={(e) =>
                        setNewCaseStudy({
                          ...newCaseStudy,
                          scenario: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Describe the scenario or problem to solve..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addCaseStudy}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Add Case Study
                    </button>
                    <button
                      onClick={() => setShowAddCaseStudy(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCaseStudy(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add New Case Study
              </button>
            )}
          </div>
        )}
      </div>

      {/* Evaluation Criteria */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("evaluation")}
        >
          <div className="flex items-center space-x-3">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Evaluation Criteria
            </h3>
          </div>
          {expandedSections.evaluation ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.evaluation && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Guidelines
              </label>
              <textarea
                value={config.evaluationCriteria}
                onChange={(e) =>
                  handleConfigChange({ evaluationCriteria: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={5}
                placeholder="Describe how responses should be evaluated..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-indigo-900">
              Assessment Summary
            </h4>
            <div className="mt-2 text-sm text-indigo-700 space-y-1">
              <p>
                • {config.caseStudies.length} case{" "}
                {config.caseStudies.length === 1 ? "study" : "studies"} with{" "}
                {config.caseStudies.reduce(
                  (total, cs) => total + cs.questions.length,
                  0
                )}{" "}
                total questions
              </p>
              <p>
                • {config.totalTimeLimit} minute assessment,{" "}
                {config.passingScore}% passing score
              </p>
              <p>
                • Total possible points:{" "}
                {config.caseStudies.reduce(
                  (total, cs) =>
                    total + cs.questions.reduce((sum, q) => sum + q.points, 0),
                  0
                )}
              </p>
              <p>
                • Feedback{" "}
                {config.provideFeedback ? "provided" : "not provided"} to
                candidates
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Clock,
  Star,
  Phone,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  AlertCircle,
} from "lucide-react";

// Types
interface Question {
  id: string;
  text: string;
  category: "background" | "motivation" | "skills" | "culture" | "logistics";
  isRequired: boolean;
  expectedAnswerGuidelines?: string;
}

interface ScoringCriteria {
  id: string;
  name: string;
  description: string;
  weight: number; // 1-5
}

interface PhoneScreeningConfiguration {
  questions: Question[];
  scoringCriteria: ScoringCriteria[];
  duration: number;
  bufferTime: number;
  interviewerInstructions: string;
  candidatePreparation: string;
  autoScheduling: boolean;
  recordingEnabled: boolean;
}

interface PhoneScreeningConfigProps {
  jobId: string;
  roundId: string;
  round: any;
  configuration: any;
  onConfigurationChange: (newConfig: any) => void;
  validationErrors?: string[];
}

const defaultQuestions: Question[] = [
  {
    id: "q1",
    text: "Tell me about your background and relevant experience for this role.",
    category: "background",
    isRequired: true,
    expectedAnswerGuidelines:
      "Look for relevant experience, career progression, and alignment with role requirements.",
  },
  {
    id: "q2",
    text: "What interests you most about this position and our company?",
    category: "motivation",
    isRequired: true,
    expectedAnswerGuidelines:
      "Assess genuine interest, research about company, and cultural fit.",
  },
  {
    id: "q3",
    text: "What are your salary expectations for this role?",
    category: "logistics",
    isRequired: false,
    expectedAnswerGuidelines: "Ensure alignment with budget and expectations.",
  },
];

const defaultScoringCriteria: ScoringCriteria[] = [
  {
    id: "sc1",
    name: "Relevant Experience",
    description: "Candidate has appropriate experience for the role",
    weight: 5,
  },
  {
    id: "sc2",
    name: "Communication Skills",
    description: "Clear, professional communication",
    weight: 4,
  },
  {
    id: "sc3",
    name: "Interest & Motivation",
    description: "Genuine interest in role and company",
    weight: 4,
  },
  {
    id: "sc4",
    name: "Cultural Fit",
    description: "Alignment with company values and culture",
    weight: 3,
  },
];

export function PhoneScreeningConfig({
  jobId,
  roundId,
  round,
  configuration: initialConfig,
  onConfigurationChange,
  validationErrors = [],
}: PhoneScreeningConfigProps) {
  const [config, setConfig] = useState<PhoneScreeningConfiguration>(() => {
    // Initialize with passed configuration or defaults
    return {
      questions: initialConfig?.questions || defaultQuestions,
      scoringCriteria: initialConfig?.scoringCriteria || defaultScoringCriteria,
      duration: initialConfig?.duration || 30,
      bufferTime: initialConfig?.callSettings?.bufferTime || 5,
      interviewerInstructions:
        initialConfig?.interviewerGuidelines ||
        "Welcome the candidate warmly and set a positive tone. Follow the structured questions but allow for natural conversation flow. Take detailed notes on responses and overall impression.",
      candidatePreparation:
        initialConfig?.candidateInstructions ||
        "Please ensure you're in a quiet environment with good phone reception. Have your resume ready for reference. The call will last approximately 30 minutes.",
      autoScheduling: initialConfig?.callSettings?.autoScheduling ?? true,
      recordingEnabled: initialConfig?.callSettings?.recordCall ?? false,
    };
  });

  const [expandedSections, setExpandedSections] = useState({
    questions: true,
    scoring: true,
    settings: true,
    instructions: false,
  });

  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: "",
    category: "background",
    isRequired: false,
    expectedAnswerGuidelines: "",
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Update config when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        questions: initialConfig?.questions || defaultQuestions,
        scoringCriteria:
          initialConfig?.scoringCriteria || defaultScoringCriteria,
        duration: initialConfig?.duration || 30,
        bufferTime: initialConfig?.callSettings?.bufferTime || 5,
        interviewerInstructions:
          initialConfig?.interviewerGuidelines ||
          "Welcome the candidate warmly and set a positive tone. Follow the structured questions but allow for natural conversation flow. Take detailed notes on responses and overall impression.",
        candidatePreparation:
          initialConfig?.candidateInstructions ||
          "Please ensure you're in a quiet environment with good phone reception. Have your resume ready for reference. The call will last approximately 30 minutes.",
        autoScheduling: initialConfig?.callSettings?.autoScheduling ?? true,
        recordingEnabled: initialConfig?.callSettings?.recordCall ?? false,
      });
    }
  }, [initialConfig]);

  const handleConfigChange = (
    updates: Partial<PhoneScreeningConfiguration>
  ) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    // Transform to backend format for saving
    const backendConfig = {
      ...initialConfig,
      questions: newConfig.questions,
      scoringCriteria: newConfig.scoringCriteria,
      duration: newConfig.duration,
      callSettings: {
        duration: newConfig.duration,
        bufferTime: newConfig.bufferTime,
        autoScheduling: newConfig.autoScheduling,
        recordCall: newConfig.recordingEnabled,
        requirePhone: true,
      },
      interviewerGuidelines: newConfig.interviewerInstructions,
      candidateInstructions: newConfig.candidatePreparation,
    };

    onConfigurationChange(backendConfig);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addQuestion = () => {
    if (!newQuestion.text?.trim()) return;

    const question: Question = {
      id: `q_${Date.now()}`,
      text: newQuestion.text,
      category: newQuestion.category as Question["category"],
      isRequired: newQuestion.isRequired || false,
      expectedAnswerGuidelines: newQuestion.expectedAnswerGuidelines || "",
    };

    handleConfigChange({
      questions: [...config.questions, question],
    });

    setNewQuestion({
      text: "",
      category: "background",
      isRequired: false,
      expectedAnswerGuidelines: "",
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

  const updateScoringCriteria = (
    criteriaId: string,
    updates: Partial<ScoringCriteria>
  ) => {
    handleConfigChange({
      scoringCriteria: config.scoringCriteria.map((sc) =>
        sc.id === criteriaId ? { ...sc, ...updates } : sc
      ),
    });
  };

  const getCategoryColor = (category: Question["category"]) => {
    const colors = {
      background: "bg-blue-100 text-blue-800",
      motivation: "bg-green-100 text-green-800",
      skills: "bg-purple-100 text-purple-800",
      culture: "bg-pink-100 text-pink-800",
      logistics: "bg-gray-100 text-gray-800",
    };
    return colors[category];
  };

  const getCategoryLabel = (category: Question["category"]) => {
    const labels = {
      background: "Background",
      motivation: "Motivation",
      skills: "Skills",
      culture: "Culture",
      logistics: "Logistics",
    };
    return labels[category];
  };

  return (
    <div className="p-6 space-y-8">
      {/* Error Display */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">
                Configuration Errors
              </h4>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
                    {question.isRequired && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Required
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
                        <option value="background">Background</option>
                        <option value="motivation">Motivation</option>
                        <option value="skills">Skills</option>
                        <option value="culture">Culture</option>
                        <option value="logistics">Logistics</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.isRequired}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              isRequired: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Required question
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Answer Guidelines (for interviewer)
                    </label>
                    <textarea
                      value={question.expectedAnswerGuidelines || ""}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          expectedAnswerGuidelines: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      placeholder="What should the interviewer look for in the candidate's response?"
                    />
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
                        <option value="background">Background</option>
                        <option value="motivation">Motivation</option>
                        <option value="skills">Skills</option>
                        <option value="culture">Culture</option>
                        <option value="logistics">Logistics</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newQuestion.isRequired}
                          onChange={(e) =>
                            setNewQuestion({
                              ...newQuestion,
                              isRequired: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Required question
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Answer Guidelines
                    </label>
                    <textarea
                      value={newQuestion.expectedAnswerGuidelines || ""}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          expectedAnswerGuidelines: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      placeholder="What should the interviewer look for?"
                    />
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

      {/* Scoring Criteria Section */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("scoring")}
        >
          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Scoring Criteria
            </h3>
            <span className="text-sm text-gray-500">
              ({config.scoringCriteria.length} criteria)
            </span>
          </div>
          {expandedSections.scoring ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.scoring && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {config.scoringCriteria.map((criteria) => (
              <div
                key={criteria.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Criteria Name
                    </label>
                    <input
                      type="text"
                      value={criteria.name}
                      onChange={(e) =>
                        updateScoringCriteria(criteria.id, {
                          name: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (1-5)
                    </label>
                    <select
                      value={criteria.weight}
                      onChange={(e) =>
                        updateScoringCriteria(criteria.id, {
                          weight: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={1}>1 - Low</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={3}>3 - Average</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Critical</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={criteria.description}
                    onChange={(e) =>
                      updateScoringCriteria(criteria.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("settings")}
        >
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Call Settings
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Call Duration (minutes)
                </label>
                <input
                  type="number"
                  value={config.duration}
                  onChange={(e) =>
                    handleConfigChange({ duration: parseInt(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="15"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer Time (minutes)
                </label>
                <input
                  type="number"
                  value={config.bufferTime}
                  onChange={(e) =>
                    handleConfigChange({ bufferTime: parseInt(e.target.value) })
                  }
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
                  checked={config.autoScheduling}
                  onChange={(e) =>
                    handleConfigChange({ autoScheduling: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable automatic scheduling
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.recordingEnabled}
                  onChange={(e) =>
                    handleConfigChange({ recordingEnabled: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable call recording
                </span>
              </label>
            </div>
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
            <Users className="h-5 w-5 text-purple-600" />
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
                Interviewer Instructions
              </label>
              <textarea
                value={config.interviewerInstructions}
                onChange={(e) =>
                  handleConfigChange({
                    interviewerInstructions: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Guidelines for the interviewer conducting the phone screening..."
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
                placeholder="Instructions to send to candidates before the phone screening..."
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
              Configuration Summary
            </h4>
            <div className="mt-2 text-sm text-indigo-700 space-y-1">
              <p>• {config.questions.length} interview questions configured</p>
              <p>• {config.scoringCriteria.length} scoring criteria defined</p>
              <p>
                • {config.duration} minute call duration with{" "}
                {config.bufferTime} minute buffer
              </p>
              <p>
                • {config.autoScheduling ? "Automatic" : "Manual"} scheduling
                enabled
              </p>
              <p>
                • Recording {config.recordingEnabled ? "enabled" : "disabled"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

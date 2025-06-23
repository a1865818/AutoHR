"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Code,
  Clock,
  Star,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Settings,
  Target,
  Timer,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: "multiple_choice" | "coding" | "theoretical" | "practical";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  timeLimit: number; // minutes
  correctAnswer?: string;
  options?: string[]; // for multiple choice
  codeTemplate?: string; // for coding questions
  testCases?: TestCase[]; // for coding questions
  rubric?: string; // for theoretical/practical
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface TechnicalAssessmentConfiguration {
  totalTimeLimit: number; // minutes
  passingScore: number; // percentage
  questionCount: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypes: {
    multiple_choice: number;
    coding: number;
    theoretical: number;
    practical: number;
  };
  questions: Question[];
  allowedLanguages: string[];
  environment: {
    ideEnabled: boolean;
    debuggingAllowed: boolean;
    internetAccess: boolean;
    allowedResources: string[];
  };
  antiCheatMeasures: {
    proctoringEnabled: boolean;
    screenRecording: boolean;
    tabSwitchingDetection: boolean;
    copyPasteRestriction: boolean;
  };
  instructions: string;
  feedbackSettings: {
    showCorrectAnswers: boolean;
    showScores: boolean;
    provideFeedback: boolean;
  };
}

interface TechnicalAssessmentConfigProps {
  jobId: string;
  roundId: string;
  round: any;
  onConfigurationChange: (newConfig: any) => void;
}

const defaultQuestions: Question[] = [
  {
    id: "tq1",
    text: "What is the time complexity of binary search?",
    type: "multiple_choice",
    difficulty: "easy",
    points: 5,
    timeLimit: 3,
    correctAnswer: "O(log n)",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
  },
  {
    id: "tq2",
    text: "Write a function to reverse a linked list",
    type: "coding",
    difficulty: "medium",
    points: 15,
    timeLimit: 20,
    codeTemplate:
      "def reverse_linked_list(head):\n    # Your code here\n    pass",
    testCases: [
      {
        id: "tc1",
        input: "[1,2,3,4,5]",
        expectedOutput: "[5,4,3,2,1]",
        isHidden: false,
      },
      {
        id: "tc2",
        input: "[]",
        expectedOutput: "[]",
        isHidden: true,
      },
    ],
  },
];

const defaultLanguages = [
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "TypeScript",
  "Go",
  "Rust",
];

export function TechnicalAssessmentConfig({
  jobId,
  roundId,
  round,
  onConfigurationChange,
}: TechnicalAssessmentConfigProps) {
  const [config, setConfig] = useState<TechnicalAssessmentConfiguration>({
    totalTimeLimit: 90,
    passingScore: 70,
    questionCount: 10,
    difficultyDistribution: {
      easy: 40,
      medium: 40,
      hard: 20,
    },
    questionTypes: {
      multiple_choice: 50,
      coding: 30,
      theoretical: 15,
      practical: 5,
    },
    questions: defaultQuestions,
    allowedLanguages: ["JavaScript", "Python", "Java"],
    environment: {
      ideEnabled: true,
      debuggingAllowed: true,
      internetAccess: false,
      allowedResources: ["Documentation", "Language Reference"],
    },
    antiCheatMeasures: {
      proctoringEnabled: false,
      screenRecording: false,
      tabSwitchingDetection: true,
      copyPasteRestriction: false,
    },
    instructions:
      "This technical assessment will evaluate your programming knowledge and problem-solving skills. Read each question carefully and manage your time effectively. You may use the provided IDE and documentation.",
    feedbackSettings: {
      showCorrectAnswers: false,
      showScores: true,
      provideFeedback: true,
    },
  });

  const [expandedSections, setExpandedSections] = useState({
    structure: true,
    questions: true,
    environment: true,
    security: false,
    settings: false,
  });

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    type: "multiple_choice" as Question["type"],
    difficulty: "medium" as Question["difficulty"],
    points: 10,
    timeLimit: 5,
    options: ["", "", "", ""],
    correctAnswer: "",
    codeTemplate: "",
    testCases: [] as TestCase[],
    rubric: "",
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);

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

  const addQuestion = () => {
    if (!newQuestion.text.trim()) return;

    const question: Question = {
      id: `tq_${Date.now()}`,
      text: newQuestion.text,
      type: newQuestion.type,
      difficulty: newQuestion.difficulty,
      points: newQuestion.points,
      timeLimit: newQuestion.timeLimit,
      ...(newQuestion.type === "multiple_choice" && {
        options: newQuestion.options.filter((opt) => opt.trim() !== ""),
        correctAnswer: newQuestion.correctAnswer,
      }),
      ...(newQuestion.type === "coding" && {
        codeTemplate: newQuestion.codeTemplate,
        testCases: newQuestion.testCases,
      }),
      ...((["theoretical", "practical"] as const).includes(
        newQuestion.type as any
      ) && {
        rubric: newQuestion.rubric,
      }),
    };

    handleConfigChange({
      questions: [...config.questions, question],
    });

    setNewQuestion({
      text: "",
      type: "multiple_choice",
      difficulty: "medium",
      points: 10,
      timeLimit: 5,
      options: ["", "", "", ""],
      correctAnswer: "",
      codeTemplate: "",
      testCases: [],
      rubric: "",
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

  const getDifficultyColor = (difficulty: Question["difficulty"]) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    };
    return colors[difficulty];
  };

  const getTypeColor = (type: Question["type"]) => {
    const colors = {
      multiple_choice: "bg-blue-100 text-blue-800",
      coding: "bg-purple-100 text-purple-800",
      theoretical: "bg-orange-100 text-orange-800",
      practical: "bg-pink-100 text-pink-800",
    };
    return colors[type];
  };

  const getTypeLabel = (type: Question["type"]) => {
    const labels = {
      multiple_choice: "Multiple Choice",
      coding: "Coding",
      theoretical: "Theoretical",
      practical: "Practical",
    };
    return labels[type];
  };

  const addTestCase = (questionId: string) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question && question.type === "coding") {
      const newTestCase: TestCase = {
        id: `tc_${Date.now()}`,
        input: "",
        expectedOutput: "",
        isHidden: false,
      };
      updateQuestion(questionId, {
        testCases: [...(question.testCases || []), newTestCase],
      });
    }
  };

  const removeTestCase = (questionId: string, testCaseId: string) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question && question.testCases) {
      updateQuestion(questionId, {
        testCases: question.testCases.filter((tc) => tc.id !== testCaseId),
      });
    }
  };

  const updateTestCase = (
    questionId: string,
    testCaseId: string,
    updates: Partial<TestCase>
  ) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (question && question.testCases) {
      updateQuestion(questionId, {
        testCases: question.testCases.map((tc) =>
          tc.id === testCaseId ? { ...tc, ...updates } : tc
        ),
      });
    }
  };

  const toggleLanguage = (language: string) => {
    if (config.allowedLanguages.includes(language)) {
      handleConfigChange({
        allowedLanguages: config.allowedLanguages.filter((l) => l !== language),
      });
    } else {
      handleConfigChange({
        allowedLanguages: [...config.allowedLanguages, language],
      });
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Test Structure */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("structure")}
        >
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Test Structure
            </h3>
          </div>
          {expandedSections.structure ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.structure && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={config.totalTimeLimit}
                  onChange={(e) =>
                    handleConfigChange({
                      totalTimeLimit: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="30"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Count
                </label>
                <input
                  type="number"
                  value={config.questionCount}
                  onChange={(e) =>
                    handleConfigChange({
                      questionCount: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="5"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  value={config.passingScore}
                  onChange={(e) =>
                    handleConfigChange({
                      passingScore: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Difficulty Distribution (%)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Easy
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.difficultyDistribution.easy}
                    onChange={(e) =>
                      handleConfigChange({
                        difficultyDistribution: {
                          ...config.difficultyDistribution,
                          easy: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {config.difficultyDistribution.easy}%
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Medium
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.difficultyDistribution.medium}
                    onChange={(e) =>
                      handleConfigChange({
                        difficultyDistribution: {
                          ...config.difficultyDistribution,
                          medium: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {config.difficultyDistribution.medium}%
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Hard
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.difficultyDistribution.hard}
                    onChange={(e) =>
                      handleConfigChange({
                        difficultyDistribution: {
                          ...config.difficultyDistribution,
                          hard: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {config.difficultyDistribution.hard}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Question Type Distribution (%)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(config.questionTypes).map(
                  ([type, percentage]) => (
                    <div key={type}>
                      <label className="block text-xs text-gray-600 mb-1 capitalize">
                        {type.replace("_", " ")}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) =>
                          handleConfigChange({
                            questionTypes: {
                              ...config.questionTypes,
                              [type]: parseInt(e.target.value),
                            },
                          })
                        }
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">
                        {percentage}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Questions Library */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("questions")}
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Question Library
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
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        question.type
                      )}`}
                    >
                      {getTypeLabel(question.type)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        question.difficulty
                      )}`}
                    >
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {question.points} pts
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {question.timeLimit} min
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

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            type: e.target.value as Question["type"],
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="coding">Coding</option>
                        <option value="theoretical">Theoretical</option>
                        <option value="practical">Practical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={question.difficulty}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            difficulty: e.target
                              .value as Question["difficulty"],
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
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
                          updateQuestion(question.id, {
                            points: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                        max="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Limit (min)
                      </label>
                      <input
                        type="number"
                        value={question.timeLimit}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            timeLimit: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  {/* Multiple Choice Options */}
                  {question.type === "multiple_choice" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Answer Options
                      </label>
                      <div className="space-y-2">
                        {question.options?.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === option}
                              onChange={() =>
                                updateQuestion(question.id, {
                                  correctAnswer: option,
                                })
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
                                newOptions[index] = e.target.value;
                                updateQuestion(question.id, {
                                  options: newOptions,
                                });
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coding Template and Test Cases */}
                  {question.type === "coding" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Code Template
                        </label>
                        <textarea
                          value={question.codeTemplate || ""}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              codeTemplate: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                          rows={4}
                          placeholder="def function_name():\n    # Your code here\n    pass"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Test Cases
                          </label>
                          <button
                            onClick={() => addTestCase(question.id)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            + Add test case
                          </button>
                        </div>
                        <div className="space-y-2">
                          {question.testCases?.map((testCase) => (
                            <div
                              key={testCase.id}
                              className="border border-gray-200 rounded p-3"
                            >
                              <div className="grid grid-cols-2 gap-3 mb-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Input
                                  </label>
                                  <input
                                    type="text"
                                    value={testCase.input}
                                    onChange={(e) =>
                                      updateTestCase(question.id, testCase.id, {
                                        input: e.target.value,
                                      })
                                    }
                                    className="w-full p-1 border border-gray-300 rounded text-sm font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Expected Output
                                  </label>
                                  <input
                                    type="text"
                                    value={testCase.expectedOutput}
                                    onChange={(e) =>
                                      updateTestCase(question.id, testCase.id, {
                                        expectedOutput: e.target.value,
                                      })
                                    }
                                    className="w-full p-1 border border-gray-300 rounded text-sm font-mono"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={testCase.isHidden}
                                    onChange={(e) =>
                                      updateTestCase(question.id, testCase.id, {
                                        isHidden: e.target.checked,
                                      })
                                    }
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="ml-2 text-xs text-gray-700">
                                    Hidden test case
                                  </span>
                                </label>
                                <button
                                  onClick={() =>
                                    removeTestCase(question.id, testCase.id)
                                  }
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rubric for Theoretical/Practical */}
                  {(["theoretical", "practical"] as const).includes(
                    question.type as any
                  ) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Evaluation Rubric
                      </label>
                      <textarea
                        value={question.rubric || ""}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            rubric: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        placeholder="Define how this question should be evaluated..."
                      />
                    </div>
                  )}
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

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={newQuestion.type}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            type: e.target.value as Question["type"],
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="coding">Coding</option>
                        <option value="theoretical">Theoretical</option>
                        <option value="practical">Practical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={newQuestion.difficulty}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            difficulty: e.target
                              .value as Question["difficulty"],
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        value={newQuestion.points}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            points: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                        max="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Limit (min)
                      </label>
                      <input
                        type="number"
                        value={newQuestion.timeLimit}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            timeLimit: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                        max="60"
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

      {/* Environment Settings */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("environment")}
        >
          <div className="flex items-center space-x-3">
            <Code className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Development Environment
            </h3>
          </div>
          {expandedSections.environment ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.environment && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Allowed Programming Languages
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {defaultLanguages.map((language) => (
                  <label key={language} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.allowedLanguages.includes(language)}
                      onChange={() => toggleLanguage(language)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {language}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Environment Features
              </h4>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.environment.ideEnabled}
                  onChange={(e) =>
                    handleConfigChange({
                      environment: {
                        ...config.environment,
                        ideEnabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable IDE/Code Editor
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.environment.debuggingAllowed}
                  onChange={(e) =>
                    handleConfigChange({
                      environment: {
                        ...config.environment,
                        debuggingAllowed: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Allow debugging tools
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.environment.internetAccess}
                  onChange={(e) =>
                    handleConfigChange({
                      environment: {
                        ...config.environment,
                        internetAccess: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Allow internet access
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Resources (one per line)
              </label>
              <textarea
                value={config.environment.allowedResources.join("\n")}
                onChange={(e) =>
                  handleConfigChange({
                    environment: {
                      ...config.environment,
                      allowedResources: e.target.value
                        .split("\n")
                        .filter((r) => r.trim() !== ""),
                    },
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Documentation&#10;Language Reference&#10;Stack Overflow"
              />
            </div>
          </div>
        )}
      </div>

      {/* Test Instructions */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("settings")}
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Instructions & Feedback
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Instructions
              </label>
              <textarea
                value={config.instructions}
                onChange={(e) =>
                  handleConfigChange({ instructions: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Instructions for candidates taking the assessment..."
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Feedback Settings
              </h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.feedbackSettings.showScores}
                    onChange={(e) =>
                      handleConfigChange({
                        feedbackSettings: {
                          ...config.feedbackSettings,
                          showScores: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Show scores to candidates
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.feedbackSettings.showCorrectAnswers}
                    onChange={(e) =>
                      handleConfigChange({
                        feedbackSettings: {
                          ...config.feedbackSettings,
                          showCorrectAnswers: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Show correct answers after submission
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.feedbackSettings.provideFeedback}
                    onChange={(e) =>
                      handleConfigChange({
                        feedbackSettings: {
                          ...config.feedbackSettings,
                          provideFeedback: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Provide detailed feedback
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-purple-900">
              Assessment Summary
            </h4>
            <div className="mt-2 text-sm text-purple-700 space-y-1">
              <p>
                • {config.totalTimeLimit} minute assessment with{" "}
                {config.questionCount} questions
              </p>
              <p>
                • {config.questions.length} questions in library,{" "}
                {config.passingScore}% required to pass
              </p>
              <p>
                • {config.allowedLanguages.length} programming languages
                available
              </p>
              <p>
                • IDE {config.environment.ideEnabled ? "enabled" : "disabled"},
                internet{" "}
                {config.environment.internetAccess ? "allowed" : "restricted"}
              </p>
              <p>
                • Total possible points:{" "}
                {config.questions.reduce((sum, q) => sum + q.points, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

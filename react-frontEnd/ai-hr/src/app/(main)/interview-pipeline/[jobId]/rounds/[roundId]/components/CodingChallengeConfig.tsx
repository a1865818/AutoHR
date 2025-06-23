"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Code,
  Clock,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number; // hours
  languages: string[];
  constraints: string[];
  examples: Example[];
  testCases: TestCase[];
  starterCode: Record<string, string>; // language -> code
}

interface Example {
  id: string;
  input: string;
  output: string;
  explanation?: string;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
}

interface CodingChallengeConfiguration {
  challenge: Challenge | null;
  deadline: number; // hours from assignment
  allowLateSubmission: boolean;
  lateSubmissionPenalty: number; // percentage
  maxAttempts: number;
  gradingMethod: "automatic" | "manual" | "hybrid";
  passingScore: number; // percentage
  codeQualityWeight: number; // percentage
  performanceWeight: number; // percentage
  correctnessWeight: number; // percentage
  allowedLanguages: string[];
  submissionRequirements: {
    requireComments: boolean;
    requireTests: boolean;
    maxFileSize: number; // MB
    allowedFileTypes: string[];
  };
  instructions: string;
  evaluationCriteria: string;
}

interface CodingChallengeConfigProps {
  jobId: string;
  roundId: string;
  round: any;
  onConfigurationChange: (newConfig: any) => void;
}

const defaultChallenge: Challenge = {
  id: "ch1",
  title: "Two Sum Problem",
  description:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  difficulty: "easy",
  timeLimit: 2,
  languages: ["JavaScript", "Python", "Java"],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists",
  ],
  examples: [
    {
      id: "ex1",
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
  ],
  testCases: [
    {
      id: "tc1",
      input: "[2,7,11,15]\n9",
      expectedOutput: "[0,1]",
      isHidden: false,
      points: 25,
    },
    {
      id: "tc2",
      input: "[3,2,4]\n6",
      expectedOutput: "[1,2]",
      isHidden: true,
      points: 25,
    },
  ],
  starterCode: {
    JavaScript: "function twoSum(nums, target) {\n    // Your solution here\n}",
    Python: "def two_sum(nums, target):\n    # Your solution here\n    pass",
    Java: "public int[] twoSum(int[] nums, int target) {\n    // Your solution here\n    return new int[0];\n}",
  },
};

const defaultLanguages = [
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "TypeScript",
  "Go",
  "Rust",
  "C#",
];

export function CodingChallengeConfig({
  jobId,
  roundId,
  round,
  onConfigurationChange,
}: CodingChallengeConfigProps) {
  const [config, setConfig] = useState<CodingChallengeConfiguration>({
    challenge: defaultChallenge,
    deadline: 48,
    allowLateSubmission: true,
    lateSubmissionPenalty: 10,
    maxAttempts: 3,
    gradingMethod: "automatic",
    passingScore: 70,
    codeQualityWeight: 20,
    performanceWeight: 30,
    correctnessWeight: 50,
    allowedLanguages: ["JavaScript", "Python", "Java"],
    submissionRequirements: {
      requireComments: true,
      requireTests: false,
      maxFileSize: 5,
      allowedFileTypes: [".js", ".py", ".java", ".cpp", ".ts"],
    },
    instructions:
      "Complete the coding challenge within the specified time limit. Your solution will be evaluated based on correctness, performance, and code quality. Make sure to test your solution thoroughly before submission.",
    evaluationCriteria:
      "Solutions will be graded on:\n1. Correctness (50%): All test cases pass\n2. Performance (30%): Time and space complexity\n3. Code Quality (20%): Readability, style, and best practices",
  });

  const [expandedSections, setExpandedSections] = useState({
    challenge: true,
    grading: true,
    submission: true,
    instructions: false,
  });

  const [editingChallenge, setEditingChallenge] = useState(false);

  const handleConfigChange = (
    updates: Partial<CodingChallengeConfiguration>
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

  const updateChallenge = (updates: Partial<Challenge>) => {
    if (config.challenge) {
      handleConfigChange({
        challenge: { ...config.challenge, ...updates },
      });
    }
  };

  const addExample = () => {
    if (config.challenge) {
      const newExample: Example = {
        id: `ex_${Date.now()}`,
        input: "",
        output: "",
        explanation: "",
      };
      updateChallenge({
        examples: [...config.challenge.examples, newExample],
      });
    }
  };

  const removeExample = (exampleId: string) => {
    if (config.challenge) {
      updateChallenge({
        examples: config.challenge.examples.filter((ex) => ex.id !== exampleId),
      });
    }
  };

  const updateExample = (exampleId: string, updates: Partial<Example>) => {
    if (config.challenge) {
      updateChallenge({
        examples: config.challenge.examples.map((ex) =>
          ex.id === exampleId ? { ...ex, ...updates } : ex
        ),
      });
    }
  };

  const addTestCase = () => {
    if (config.challenge) {
      const newTestCase: TestCase = {
        id: `tc_${Date.now()}`,
        input: "",
        expectedOutput: "",
        isHidden: false,
        points: 10,
      };
      updateChallenge({
        testCases: [...config.challenge.testCases, newTestCase],
      });
    }
  };

  const removeTestCase = (testCaseId: string) => {
    if (config.challenge) {
      updateChallenge({
        testCases: config.challenge.testCases.filter(
          (tc) => tc.id !== testCaseId
        ),
      });
    }
  };

  const updateTestCase = (testCaseId: string, updates: Partial<TestCase>) => {
    if (config.challenge) {
      updateChallenge({
        testCases: config.challenge.testCases.map((tc) =>
          tc.id === testCaseId ? { ...tc, ...updates } : tc
        ),
      });
    }
  };

  const addConstraint = () => {
    if (config.challenge) {
      updateChallenge({
        constraints: [...config.challenge.constraints, ""],
      });
    }
  };

  const removeConstraint = (index: number) => {
    if (config.challenge) {
      updateChallenge({
        constraints: config.challenge.constraints.filter((_, i) => i !== index),
      });
    }
  };

  const updateConstraint = (index: number, value: string) => {
    if (config.challenge) {
      const newConstraints = [...config.challenge.constraints];
      newConstraints[index] = value;
      updateChallenge({ constraints: newConstraints });
    }
  };

  const updateStarterCode = (language: string, code: string) => {
    if (config.challenge) {
      updateChallenge({
        starterCode: {
          ...config.challenge.starterCode,
          [language]: code,
        },
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

  const getDifficultyColor = (difficulty: Challenge["difficulty"]) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    };
    return colors[difficulty];
  };

  return (
    <div className="p-6 space-y-8">
      {/* Challenge Definition */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("challenge")}
        >
          <div className="flex items-center space-x-3">
            <Code className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Challenge Problem
            </h3>
            {config.challenge && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                  config.challenge.difficulty
                )}`}
              >
                {config.challenge.difficulty}
              </span>
            )}
          </div>
          {expandedSections.challenge ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.challenge && config.challenge && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={config.challenge.title}
                  onChange={(e) => updateChallenge({ title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={config.challenge.difficulty}
                  onChange={(e) =>
                    updateChallenge({
                      difficulty: e.target.value as Challenge["difficulty"],
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Description
              </label>
              <textarea
                value={config.challenge.description}
                onChange={(e) =>
                  updateChallenge({ description: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Describe the problem to be solved..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (hours)
              </label>
              <input
                type="number"
                value={config.challenge.timeLimit}
                onChange={(e) =>
                  updateChallenge({ timeLimit: parseInt(e.target.value) })
                }
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                max="168"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Constraints
                </label>
                <button
                  onClick={addConstraint}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  + Add constraint
                </button>
              </div>
              <div className="space-y-2">
                {config.challenge.constraints.map((constraint, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={constraint}
                      onChange={(e) => updateConstraint(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 1 <= n <= 1000"
                    />
                    <button
                      onClick={() => removeConstraint(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Examples
                </label>
                <button
                  onClick={addExample}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  + Add example
                </button>
              </div>
              <div className="space-y-3">
                {config.challenge.examples.map((example) => (
                  <div
                    key={example.id}
                    className="border border-gray-200 rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Example
                      </span>
                      <button
                        onClick={() => removeExample(example.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Input
                        </label>
                        <textarea
                          value={example.input}
                          onChange={(e) =>
                            updateExample(example.id, { input: e.target.value })
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Output
                        </label>
                        <textarea
                          value={example.output}
                          onChange={(e) =>
                            updateExample(example.id, {
                              output: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                          rows={2}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Explanation (optional)
                      </label>
                      <textarea
                        value={example.explanation || ""}
                        onChange={(e) =>
                          updateExample(example.id, {
                            explanation: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        rows={2}
                        placeholder="Explain why this input produces this output..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Test Cases
                </label>
                <button
                  onClick={addTestCase}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  + Add test case
                </button>
              </div>
              <div className="space-y-3">
                {config.challenge.testCases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className="border border-gray-200 rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                          Test Case
                        </span>
                        {testCase.isHidden && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                            Hidden
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeTestCase(testCase.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Input
                        </label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) =>
                            updateTestCase(testCase.id, {
                              input: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Expected Output
                        </label>
                        <textarea
                          value={testCase.expectedOutput}
                          onChange={(e) =>
                            updateTestCase(testCase.id, {
                              expectedOutput: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={testCase.isHidden}
                            onChange={(e) =>
                              updateTestCase(testCase.id, {
                                isHidden: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-xs text-gray-700">
                            Hidden test case
                          </span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">
                            Points:
                          </label>
                          <input
                            type="number"
                            value={testCase.points}
                            onChange={(e) =>
                              updateTestCase(testCase.id, {
                                points: parseInt(e.target.value),
                              })
                            }
                            className="w-16 p-1 border border-gray-300 rounded text-xs"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Starter Code Templates
              </h4>
              <div className="space-y-3">
                {config.allowedLanguages.map((language) => (
                  <div key={language}>
                    <label className="block text-xs text-gray-600 mb-1">
                      {language}
                    </label>
                    <textarea
                      value={config.challenge?.starterCode?.[language] || ""}
                      onChange={(e) =>
                        updateStarterCode(language, e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      rows={4}
                      placeholder={`// Starter code for ${language}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grading & Evaluation */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("grading")}
        >
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Grading & Evaluation
            </h3>
          </div>
          {expandedSections.grading ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.grading && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grading Method
                </label>
                <select
                  value={config.gradingMethod}
                  onChange={(e) =>
                    handleConfigChange({ gradingMethod: e.target.value as any })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="hybrid">Hybrid (Auto + Manual Review)</option>
                </select>
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
                Evaluation Weights (%)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Correctness
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.correctnessWeight}
                    onChange={(e) =>
                      handleConfigChange({
                        correctnessWeight: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {config.correctnessWeight}%
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Performance
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.performanceWeight}
                    onChange={(e) =>
                      handleConfigChange({
                        performanceWeight: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {config.performanceWeight}%
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Code Quality
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.codeQualityWeight}
                    onChange={(e) =>
                      handleConfigChange({
                        codeQualityWeight: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {config.codeQualityWeight}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Criteria
              </label>
              <textarea
                value={config.evaluationCriteria}
                onChange={(e) =>
                  handleConfigChange({ evaluationCriteria: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Describe how submissions will be evaluated..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Submission Settings */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("submission")}
        >
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Submission Settings
            </h3>
          </div>
          {expandedSections.submission ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.submission && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline (hours)
                </label>
                <input
                  type="number"
                  value={config.deadline}
                  onChange={(e) =>
                    handleConfigChange({ deadline: parseInt(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="168"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={config.maxAttempts}
                  onChange={(e) =>
                    handleConfigChange({
                      maxAttempts: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Late Penalty (%)
                </label>
                <input
                  type="number"
                  value={config.lateSubmissionPenalty}
                  onChange={(e) =>
                    handleConfigChange({
                      lateSubmissionPenalty: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="100"
                  disabled={!config.allowLateSubmission}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.allowLateSubmission}
                  onChange={(e) =>
                    handleConfigChange({
                      allowLateSubmission: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Allow late submissions
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.submissionRequirements.requireComments}
                  onChange={(e) =>
                    handleConfigChange({
                      submissionRequirements: {
                        ...config.submissionRequirements,
                        requireComments: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Require code comments
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.submissionRequirements.requireTests}
                  onChange={(e) =>
                    handleConfigChange({
                      submissionRequirements: {
                        ...config.submissionRequirements,
                        requireTests: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Require unit tests
                </span>
              </label>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  value={config.submissionRequirements.maxFileSize}
                  onChange={(e) =>
                    handleConfigChange({
                      submissionRequirements: {
                        ...config.submissionRequirements,
                        maxFileSize: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allowed File Types (comma-separated)
                </label>
                <input
                  type="text"
                  value={config.submissionRequirements.allowedFileTypes.join(
                    ", "
                  )}
                  onChange={(e) =>
                    handleConfigChange({
                      submissionRequirements: {
                        ...config.submissionRequirements,
                        allowedFileTypes: e.target.value
                          .split(",")
                          .map((t) => t.trim()),
                      },
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder=".js, .py, .java"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("instructions")}
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Instructions
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
                Challenge Instructions
              </label>
              <textarea
                value={config.instructions}
                onChange={(e) =>
                  handleConfigChange({ instructions: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Instructions for candidates..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-orange-900">
              Challenge Summary
            </h4>
            <div className="mt-2 text-sm text-orange-700 space-y-1">
              <p>
                • {config.challenge?.difficulty} difficulty challenge with{" "}
                {config.challenge?.timeLimit} hour time limit
              </p>
              <p>
                • {config.deadline} hour deadline, {config.maxAttempts} attempts
                allowed
              </p>
              <p>
                • {config.challenge?.testCases.length} test cases (
                {
                  config.challenge?.testCases.filter((tc) => !tc.isHidden)
                    .length
                }{" "}
                visible)
              </p>
              <p>
                • {config.allowedLanguages.length} programming languages
                supported
              </p>
              <p>
                • Grading: {config.correctnessWeight}% correctness,{" "}
                {config.performanceWeight}% performance,{" "}
                {config.codeQualityWeight}% quality
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

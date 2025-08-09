"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  Github,
  Monitor,
  Globe,
  Plus,
  Trash2,
} from "lucide-react";
import { useRoundConfiguration } from "@/hooks/useRoundConfiguration";
import { cleanJsonObject } from "@/utils/jsonUtils";
import { RoundInstructions } from "./shared/RoundInstructions";

interface ExternalPlatformConfig {
  platform: "hackerrank" | "codility" | "leetcode" | "custom";
  testId?: string;
  testLink?: string;
  additionalInstructions?: string;
}

interface OfflineChallengeConfig {
  projectDescription: string;
  requirements: string[];
  deliverables: string[];
  evaluationCriteria: string;
  allowedTechnologies?: string[];
  submissionInstructions: string;
}

interface CodingChallengeConfiguration {
  name: string;
  mode: "online" | "offline";
  externalPlatform?: ExternalPlatformConfig;
  offlineChallenge?: OfflineChallengeConfig;
  deadline: number; // hours from assignment
  allowLateSubmission: boolean;
  lateSubmissionPenalty: number; // percentage
  passingScore: number; // percentage
  instructions: string;
  evaluationCriteria: string[];
}

interface CodingChallengeConfigProps {
  jobId: string;
  roundId: string;
  configuration?: Partial<CodingChallengeConfiguration>;
  onConfigurationChange: (newConfig: CodingChallengeConfiguration) => void;
}

export function CodingChallengeConfig({
  jobId,
  roundId,
  configuration: parentConfiguration,
  onConfigurationChange,
}: CodingChallengeConfigProps) {
  const {
    config: savedConfig,
    loading,
    error,
  } = useRoundConfiguration(jobId, roundId);

  // Default configuration
  const defaultConfig: CodingChallengeConfiguration = {
    name: "Coding Challenge",
    mode: "online",
    externalPlatform: {
      platform: "hackerrank",
      testLink: "",
      testId: "",
      additionalInstructions: "",
    },
    offlineChallenge: {
      projectDescription: "",
      requirements: [""],
      deliverables: [""],
      evaluationCriteria:
        "Your submission will be evaluated based on:\n1. Code quality and architecture\n2. Functionality and correctness\n3. Documentation and testing\n4. Git commit history and project structure",
      allowedTechnologies: [""],
      submissionInstructions:
        "Submit your completed project by providing the GitHub repository URL. Ensure your repository is public or provide access instructions.",
    },
    deadline: 48,
    allowLateSubmission: true,
    lateSubmissionPenalty: 10,
    passingScore: 70,
    instructions:
      "Complete the coding challenge within the specified deadline.",
    evaluationCriteria: [
      "Correctness of solution",
      "Code efficiency and performance",
      "Code quality and readability",
    ],
  };

  // Use parent configuration if available, otherwise use saved config or default
  const config =
    parentConfiguration || savedConfig?.configurationData || defaultConfig;

  const [expandedSections, setExpandedSections] = useState({
    mode: true,
    platform: true,
    offline: true,
    deadline: true,
    scoring: true,
    instructions: true,
  });

  // Load configuration from the backend when available
  useEffect(() => {
    if (savedConfig && !parentConfiguration) {
      console.log("Received saved config:", savedConfig);

      if (
        savedConfig.configurationData &&
        typeof savedConfig.configurationData === "object"
      ) {
        console.log("Found configuration data:", savedConfig.configurationData);
        const cleanConfigData = cleanJsonObject(savedConfig.configurationData);
        console.log("Cleaned configuration data:", cleanConfigData);

        const mergedConfig = {
          ...defaultConfig,
          ...cleanConfigData,
        };

        console.log("Setting merged config:", mergedConfig);
        onConfigurationChange(mergedConfig);
      } else {
        console.warn(
          "No configuration data found in saved config, using defaults"
        );
        onConfigurationChange(defaultConfig);
      }
    }
  }, [savedConfig, parentConfiguration, onConfigurationChange]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateConfig = (updates: Partial<CodingChallengeConfiguration>) => {
    const newConfig = { ...config, ...updates };
    onConfigurationChange(newConfig);
  };

  // Helper functions for offline challenge arrays
  const addRequirement = () => {
    if (config.offlineChallenge) {
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          requirements: [...config.offlineChallenge.requirements, ""],
        },
      });
    }
  };

  const updateRequirement = (index: number, value: string) => {
    if (config.offlineChallenge) {
      const newRequirements = [...config.offlineChallenge.requirements];
      newRequirements[index] = value;
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          requirements: newRequirements,
        },
      });
    }
  };

  const removeRequirement = (index: number) => {
    if (config.offlineChallenge) {
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          requirements: config.offlineChallenge.requirements.filter(
            (_: string, i: number) => i !== index
          ),
        },
      });
    }
  };

  const addDeliverable = () => {
    if (config.offlineChallenge) {
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          deliverables: [...config.offlineChallenge.deliverables, ""],
        },
      });
    }
  };

  const updateDeliverable = (index: number, value: string) => {
    if (config.offlineChallenge) {
      const newDeliverables = [...config.offlineChallenge.deliverables];
      newDeliverables[index] = value;
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          deliverables: newDeliverables,
        },
      });
    }
  };

  const removeDeliverable = (index: number) => {
    if (config.offlineChallenge) {
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          deliverables: config.offlineChallenge.deliverables.filter(
            (_: string, i: number) => i !== index
          ),
        },
      });
    }
  };

  const addTechnology = () => {
    if (config.offlineChallenge) {
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          allowedTechnologies: [
            ...(config.offlineChallenge.allowedTechnologies || []),
            "",
          ],
        },
      });
    }
  };

  const updateTechnology = (index: number, value: string) => {
    if (
      config.offlineChallenge &&
      config.offlineChallenge.allowedTechnologies
    ) {
      const newTechnologies = [...config.offlineChallenge.allowedTechnologies];
      newTechnologies[index] = value;
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          allowedTechnologies: newTechnologies,
        },
      });
    }
  };

  const removeTechnology = (index: number) => {
    if (
      config.offlineChallenge &&
      config.offlineChallenge.allowedTechnologies
    ) {
      updateConfig({
        offlineChallenge: {
          ...config.offlineChallenge,
          allowedTechnologies:
            config.offlineChallenge.allowedTechnologies.filter(
              (_: string, i: number) => i !== index
            ),
        },
      });
    }
  };

  // Evaluation criteria list helpers
  const ensureEvalList = (): string[] => {
    const ec: any = (config as any).evaluationCriteria;
    if (Array.isArray(ec)) return ec as string[];
    if (typeof ec === "string") {
      return ec
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const addCriteria = () => {
    const list = ensureEvalList();
    updateConfig({ evaluationCriteria: [...list, ""] } as any);
  };

  const addCriteriaAfter = (index: number) => {
    const list = ensureEvalList();
    const next = [...list.slice(0, index + 1), "", ...list.slice(index + 1)];
    updateConfig({ evaluationCriteria: next } as any);
  };

  const updateCriteria = (index: number, value: string) => {
    const list = ensureEvalList();
    const next = [...list];
    next[index] = value;
    updateConfig({ evaluationCriteria: next } as any);
  };

  const removeCriteria = (index: number) => {
    const list = ensureEvalList();
    updateConfig({
      evaluationCriteria: list.filter((_, i) => i !== index),
    } as any);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-800">Failed to load configuration: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => toggleSection("mode")}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Monitor className="h-5 w-5 text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Challenge Mode
            </h3>
          </div>
          {expandedSections.mode ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.mode && (
          <div className="px-6 pb-6 space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => updateConfig({ mode: "online" })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  config.mode === "online"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Globe className="h-5 w-5 mx-auto mb-2" />
                <div className="font-medium">Online Challenge</div>
                <div className="text-sm mt-1 opacity-75">
                  External platform (HackerRank, Codility, etc.)
                </div>
              </button>
              <button
                onClick={() => updateConfig({ mode: "offline" })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  config.mode === "offline"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Github className="h-5 w-5 mx-auto mb-2" />
                <div className="font-medium">Offline Challenge</div>
                <div className="text-sm mt-1 opacity-75">
                  Take-home project with GitHub submission
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Online Platform Configuration */}
      {config.mode === "online" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => toggleSection("platform")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <ExternalLink className="h-5 w-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                External Platform Configuration
              </h3>
            </div>
            {expandedSections.platform ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.platform && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={config.externalPlatform?.platform || "hackerrank"}
                  onChange={(e) =>
                    updateConfig({
                      externalPlatform: {
                        ...config.externalPlatform,
                        platform: e.target.value as any,
                      } as ExternalPlatformConfig,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hackerrank">HackerRank</option>
                  <option value="codility">Codility</option>
                  <option value="leetcode">LeetCode</option>
                  <option value="custom">Custom Platform</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Link
                </label>
                <input
                  type="url"
                  value={config.externalPlatform?.testLink || ""}
                  onChange={(e) =>
                    updateConfig({
                      externalPlatform: {
                        ...config.externalPlatform,
                        testLink: e.target.value,
                      } as ExternalPlatformConfig,
                    })
                  }
                  placeholder="https://www.hackerrank.com/test/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test ID (Optional)
                </label>
                <input
                  type="text"
                  value={config.externalPlatform?.testId || ""}
                  onChange={(e) =>
                    updateConfig({
                      externalPlatform: {
                        ...config.externalPlatform,
                        testId: e.target.value,
                      } as ExternalPlatformConfig,
                    })
                  }
                  placeholder="Enter test ID if applicable"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Instructions
                </label>
                <textarea
                  value={config.externalPlatform?.additionalInstructions || ""}
                  onChange={(e) =>
                    updateConfig({
                      externalPlatform: {
                        ...config.externalPlatform,
                        additionalInstructions: e.target.value,
                      } as ExternalPlatformConfig,
                    })
                  }
                  rows={3}
                  placeholder="Any additional instructions for candidates..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Offline Challenge Configuration */}
      {config.mode === "offline" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => toggleSection("offline")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Github className="h-5 w-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Take-Home Project Configuration
              </h3>
            </div>
            {expandedSections.offline ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.offline && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  value={config.offlineChallenge?.projectDescription || ""}
                  onChange={(e) =>
                    updateConfig({
                      offlineChallenge: {
                        ...config.offlineChallenge!,
                        projectDescription: e.target.value,
                      },
                    })
                  }
                  rows={4}
                  placeholder="Describe the project that candidates need to build..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <div className="space-y-2">
                  {config.offlineChallenge?.requirements.map(
                    (req: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) =>
                            updateRequirement(index, e.target.value)
                          }
                          placeholder="Enter requirement..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeRequirement(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  )}
                  <button
                    onClick={addRequirement}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Requirement
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deliverables
                </label>
                <div className="space-y-2">
                  {config.offlineChallenge?.deliverables.map(
                    (del: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={del}
                          onChange={(e) =>
                            updateDeliverable(index, e.target.value)
                          }
                          placeholder="Enter deliverable..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeDeliverable(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  )}
                  <button
                    onClick={addDeliverable}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Deliverable
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Technologies (Optional)
                </label>
                <div className="space-y-2">
                  {config.offlineChallenge?.allowedTechnologies?.map(
                    (tech: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tech}
                          onChange={(e) =>
                            updateTechnology(index, e.target.value)
                          }
                          placeholder="e.g., React, Node.js, Python..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeTechnology(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  )}
                  <button
                    onClick={addTechnology}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Technology
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Instructions
                </label>
                <textarea
                  value={config.offlineChallenge?.submissionInstructions || ""}
                  onChange={(e) =>
                    updateConfig({
                      offlineChallenge: {
                        ...config.offlineChallenge!,
                        submissionInstructions: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  placeholder="Instructions for how candidates should submit their project..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Removed duplicate Evaluation Criteria (now managed in Scoring section) */}
            </div>
          )}
        </div>
      )}

      {/* Deadline Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => toggleSection("deadline")}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Deadline & Submission Settings
            </h3>
          </div>
          {expandedSections.deadline ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.deadline && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (hours from assignment)
              </label>
              <input
                type="number"
                value={config.deadline}
                onChange={(e) =>
                  updateConfig({ deadline: parseInt(e.target.value) || 48 })
                }
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Candidates will have {config.deadline} hours to complete the
                challenge
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Allow Late Submission
                </label>
                <p className="text-sm text-gray-500">
                  Accept submissions after the deadline with penalty
                </p>
              </div>
              <button
                onClick={() =>
                  updateConfig({
                    allowLateSubmission: !config.allowLateSubmission,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.allowLateSubmission ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.allowLateSubmission
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {config.allowLateSubmission && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Submission Penalty (%)
                </label>
                <input
                  type="number"
                  value={config.lateSubmissionPenalty}
                  onChange={(e) =>
                    updateConfig({
                      lateSubmissionPenalty: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scoring Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => toggleSection("scoring")}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Scoring</h3>
          </div>
          {expandedSections.scoring ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.scoring && (
          <div className="px-6 pb-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                value={config.passingScore}
                onChange={(e) =>
                  updateConfig({ passingScore: parseInt(e.target.value) || 70 })
                }
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Candidates must score at least {config.passingScore}% to pass
              </p>
            </div>

            {/* Evaluation Criteria - list */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Criteria
              </label>
              <div className="space-y-2">
                {ensureEvalList().map((crit: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-gray-400 select-none">•</span>
                    <input
                      type="text"
                      value={crit}
                      onChange={(e) => updateCriteria(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCriteriaAfter(index);
                        }
                        if (e.key === "Backspace" && !crit) {
                          e.preventDefault();
                          removeCriteria(index);
                        }
                      }}
                      placeholder="Add a criterion..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeCriteria(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCriteria}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Criterion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Instructions Section */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coding Challenge Instructions
          </label>
          <textarea
            value={config.instructions}
            onChange={(e) => updateConfig({ instructions: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Instructions for the coding challenge..."
          />
        </div>
      </div>

      {/* Round Instructions */}
      <RoundInstructions roundType="coding_challenge" />
    </div>
  );
}

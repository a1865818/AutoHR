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

interface CodingChallengeConfiguration {
  name: string;
  externalPlatform: ExternalPlatformConfig;
  deadline: number; // hours from assignment
  allowLateSubmission: boolean;
  lateSubmissionPenalty: number; // percentage
  passingScore: number; // percentage
  instructions: string;
  evaluationCriteria: string;
}

interface CodingChallengeConfigProps {
  jobId: string;
  roundId: string;
  onConfigurationChange: (newConfig: CodingChallengeConfiguration) => void;
}

export function CodingChallengeConfig({
  jobId,
  roundId,
  onConfigurationChange,
}: CodingChallengeConfigProps) {
  const {
    config: savedConfig,
    loading,
    error,
    saveConfiguration,
  } = useRoundConfiguration(jobId, roundId);
  const [config, setConfig] = useState<CodingChallengeConfiguration>({
    name: "Coding Challenge",
    externalPlatform: {
      platform: "hackerrank",
      testLink: "",
      testId: "",
      additionalInstructions: "",
    },
    deadline: 48,
    allowLateSubmission: true,
    lateSubmissionPenalty: 10,
    passingScore: 70,
    instructions:
      "Complete the coding challenge by clicking the link. You will be redirected to an external platform where the challenge will be hosted. Please ensure you complete the challenge within the specified deadline.",
    evaluationCriteria:
      "Your submission will be evaluated based on:\n1. Correctness of solution\n2. Code efficiency and performance\n3. Code quality and readability",
  });
  const [saving, setSaving] = useState(false);

  // Load configuration from the backend when available
  useEffect(() => {
    if (savedConfig) {
      console.log("Received saved config:", savedConfig);

      // First set the top-level properties
      const baseConfig = {
        ...config,
        name: savedConfig.name || config.name,
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

        // Create a clean merged config
        const mergedConfig = {
          ...baseConfig,
          ...cleanConfigData,
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
    settings: true,
    instructions: true,
  });

  const handleConfigChange = (
    updates: Partial<CodingChallengeConfiguration>
  ) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigurationChange(newConfig);
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);

    // Create a clean configuration data object with only the properties we need
    const configDataToSave = {
      externalPlatform: config.externalPlatform,
      deadline: config.deadline,
      allowLateSubmission: config.allowLateSubmission,
      lateSubmissionPenalty: config.lateSubmissionPenalty,
      passingScore: config.passingScore,
      instructions: config.instructions,
      evaluationCriteria: config.evaluationCriteria,
    };

    // Clean the configuration data using our utility function
    const cleanConfigData = cleanJsonObject(configDataToSave);

    // Create the request object to send to the backend
    const configToSave = {
      name: config.name,
      description:
        savedConfig?.description || "Configuration for coding challenge round",
      duration: 120, // Default duration for coding challenges
      status: savedConfig?.status || "draft",
      configurationData: cleanConfigData,
    };

    console.log("Final configuration to save:", configToSave);

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

  const updatePlatformConfig = (updates: Partial<ExternalPlatformConfig>) => {
    handleConfigChange({
      externalPlatform: { ...config.externalPlatform, ...updates },
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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
          Coding Challenge Configuration
        </h2>
      </div>

      {/* Round Instructions */}
      <RoundInstructions roundType="coding_challenge" />

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
          Give your coding challenge configuration a descriptive name
        </p>
      </div>

      {/* External Platform Configuration */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("platform")}
        >
          <div className="flex items-center space-x-3">
            <Code className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              External Platform Integration
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={config.externalPlatform.platform}
                onChange={(e) =>
                  updatePlatformConfig({
                    platform: e.target
                      .value as ExternalPlatformConfig["platform"],
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="hackerrank">HackerRank</option>
                <option value="codility">Codility</option>
                <option value="leetcode">LeetCode</option>
                <option value="custom">Custom Platform</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test ID (optional)
                </label>
                <input
                  type="text"
                  value={config.externalPlatform.testId || ""}
                  onChange={(e) =>
                    updatePlatformConfig({ testId: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`Enter ${config.externalPlatform.platform} Test ID`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={config.externalPlatform.testLink || ""}
                    onChange={(e) =>
                      updatePlatformConfig({ testLink: e.target.value })
                    }
                    className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`Enter ${config.externalPlatform.platform} Test Link`}
                  />
                  {config.externalPlatform.testLink && (
                    <a
                      href={config.externalPlatform.testLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This link will be sent to candidates
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Platform Instructions (optional)
              </label>
              <textarea
                value={config.externalPlatform.additionalInstructions || ""}
                onChange={(e) =>
                  updatePlatformConfig({
                    additionalInstructions: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Enter any additional instructions specific to the platform..."
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start">
                <LinkIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Integration Guide
                  </h4>
                  <p className="mt-1 text-sm text-blue-600">
                    {config.externalPlatform.platform === "hackerrank" && (
                      <>
                        To integrate with HackerRank, create a test in your
                        HackerRank for Work account, then copy the test link and
                        optionally the test ID. The test link will be sent to
                        candidates.
                      </>
                    )}
                    {config.externalPlatform.platform === "codility" && (
                      <>
                        To integrate with Codility, create an assessment in your
                        Codility account, then copy the public link. The link
                        will be sent to candidates.
                      </>
                    )}
                    {config.externalPlatform.platform === "leetcode" && (
                      <>
                        To integrate with LeetCode, create a contest or problem
                        set, then copy the link. The link will be sent to
                        candidates.
                      </>
                    )}
                    {config.externalPlatform.platform === "custom" && (
                      <>
                        For a custom platform, enter the direct link to the
                        coding challenge. This link will be sent to candidates.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Challenge Settings */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("settings")}
        >
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Challenge Settings
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline (hours)
                </label>
                <input
                  type="number"
                  value={config.deadline}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({ deadline: 1 });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(1, Math.min(168, value));
                        handleConfigChange({ deadline: validValue });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="168"
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
                      handleConfigChange({ passingScore: 0 });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(0, Math.min(100, value));
                        handleConfigChange({ passingScore: validValue });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Late Penalty (%)
                </label>
                <input
                  type="number"
                  value={config.lateSubmissionPenalty}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({ lateSubmissionPenalty: 0 });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(0, Math.min(100, value));
                        handleConfigChange({
                          lateSubmissionPenalty: validValue,
                        });
                      }
                    }
                  }}
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
              Instructions & Evaluation
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
                • Platform:{" "}
                {config.externalPlatform.platform.charAt(0).toUpperCase() +
                  config.externalPlatform.platform.slice(1)}
              </p>
              {config.externalPlatform.testId && (
                <p>• Test ID: {config.externalPlatform.testId}</p>
              )}
              <p>
                • {config.deadline} hour deadline
                {config.allowLateSubmission
                  ? ` (late submissions allowed with ${config.lateSubmissionPenalty}% penalty)`
                  : " (no late submissions)"}
              </p>
              <p>• Passing score: {config.passingScore}%</p>
              <p>
                •{" "}
                {config.externalPlatform.testLink ? (
                  <span className="text-blue-700">
                    Test link available{" "}
                    <CheckCircle className="h-4 w-4 inline ml-1" />
                  </span>
                ) : (
                  <span className="text-red-700">No test link provided</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

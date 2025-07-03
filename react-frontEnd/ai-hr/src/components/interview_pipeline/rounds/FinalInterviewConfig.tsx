"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Crown,
  DollarSign,
  CheckCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  Users,
  Target,
} from "lucide-react";

interface DecisionCriteria {
  id: string;
  criterion: string;
  weight: number;
  description: string;
  required: boolean;
}

interface Executive {
  id: string;
  name: string;
  title: string;
  email: string;
  role: "decision_maker" | "advisor" | "approver";
  required: boolean;
}

interface OfferParameter {
  id: string;
  parameter: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  unit: string;
  negotiable: boolean;
}

interface ReferenceCheck {
  id: string;
  type: "professional" | "manager" | "peer" | "client";
  required: boolean;
  minCount: number;
  questions: string[];
}

interface BackgroundCheck {
  id: string;
  type: string;
  provider: string;
  required: boolean;
  timeframe: number; // days
}

interface FinalInterviewConfiguration {
  name: string;
  decisionCriteria: DecisionCriteria[];
  executives: Executive[];
  offerParameters: OfferParameter[];
  referenceChecks: ReferenceCheck[];
  backgroundChecks: BackgroundCheck[];
  duration: number;
  approvalWorkflow: {
    requiresExecutiveApproval: boolean;
    requiresBudgetApproval: boolean;
    requiresHRApproval: boolean;
    approvalTimeframe: number; // days
  };
  negotiations: {
    allowNegotiation: boolean;
    maxNegotiationRounds: number;
    escalationRequired: boolean;
    timeLimit: number; // days
  };
  instructions: string;
  decisionTimeline: number; // days
}

interface FinalInterviewConfigProps {
  jobId: string;
  roundId: string;
  round: any;
  onConfigurationChange: (newConfig: any) => void;
}

const defaultCriteria: DecisionCriteria[] = [
  {
    id: "dc1",
    criterion: "Technical Competency",
    weight: 30,
    description: "Demonstrates required technical skills and knowledge",
    required: true,
  },
  {
    id: "dc2",
    criterion: "Cultural Fit",
    weight: 25,
    description: "Aligns with company values and team dynamics",
    required: true,
  },
  {
    id: "dc3",
    criterion: "Leadership Potential",
    weight: 20,
    description: "Shows potential for growth and leadership roles",
    required: false,
  },
  {
    id: "dc4",
    criterion: "Communication Skills",
    weight: 25,
    description: "Effectively communicates ideas and collaborates",
    required: true,
  },
];

const defaultOfferParameters: OfferParameter[] = [
  {
    id: "op1",
    parameter: "Base Salary",
    minValue: 80000,
    maxValue: 120000,
    defaultValue: 100000,
    unit: "USD",
    negotiable: true,
  },
  {
    id: "op2",
    parameter: "Vacation Days",
    minValue: 15,
    maxValue: 25,
    defaultValue: 20,
    unit: "days",
    negotiable: true,
  },
];

export function FinalInterviewConfig({
  jobId,
  roundId,
  round,
  onConfigurationChange,
}: FinalInterviewConfigProps) {
  const [config, setConfig] = useState<FinalInterviewConfiguration>({
    name: "Final Interview",
    decisionCriteria: defaultCriteria,
    executives: [],
    offerParameters: defaultOfferParameters,
    referenceChecks: [],
    backgroundChecks: [],
    duration: 60,
    approvalWorkflow: {
      requiresExecutiveApproval: true,
      requiresBudgetApproval: true,
      requiresHRApproval: true,
      approvalTimeframe: 3,
    },
    negotiations: {
      allowNegotiation: true,
      maxNegotiationRounds: 2,
      escalationRequired: true,
      timeLimit: 5,
    },
    instructions:
      "This final interview will determine the hiring decision. Focus on final evaluation criteria and cultural fit assessment.",
    decisionTimeline: 2,
  });

  const [expandedSections, setExpandedSections] = useState({
    criteria: true,
    executives: true,
    offer: true,
    checks: false,
    approval: false,
  });

  const handleConfigChange = (
    updates: Partial<FinalInterviewConfiguration>
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

  return (
    <div className="p-6 space-y-8">
      {/* Decision Criteria */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("criteria")}
        >
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Decision Criteria
            </h3>
            <span className="text-sm text-gray-500">
              ({config.decisionCriteria.length} criteria)
            </span>
          </div>
          {expandedSections.criteria ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.criteria && (
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
                      const validValue = Math.max(30, Math.min(120, value));
                      handleConfigChange({ duration: validValue });
                    }
                  }
                }}
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="30"
                max="120"
              />
            </div>

            {config.decisionCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {criterion.criterion}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {criterion.weight}%
                    </span>
                    {criterion.required && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Required
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{criterion.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Executive Involvement */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("executives")}
        >
          <div className="flex items-center space-x-3">
            <Crown className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Executive Involvement
            </h3>
            <span className="text-sm text-gray-500">
              ({config.executives.length} executives)
            </span>
          </div>
          {expandedSections.executives ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.executives && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="text-center text-gray-500 py-8">
              <Crown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No executives configured yet.</p>
              <p className="text-sm">
                Add executives who need to be involved in the final decision.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Offer Parameters */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("offer")}
        >
          <div className="flex items-center space-x-3">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Offer Parameters
            </h3>
            <span className="text-sm text-gray-500">
              ({config.offerParameters.length} parameters)
            </span>
          </div>
          {expandedSections.offer ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.offer && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {config.offerParameters.map((param) => (
              <div
                key={param.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {param.parameter}
                    </span>
                    {param.negotiable && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Negotiable
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Min:</span>
                    <span className="ml-1 font-medium">
                      {param.minValue.toLocaleString()} {param.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Default:</span>
                    <span className="ml-1 font-medium">
                      {param.defaultValue.toLocaleString()} {param.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max:</span>
                    <span className="ml-1 font-medium">
                      {param.maxValue.toLocaleString()} {param.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Unit:</span>
                    <span className="ml-1 font-medium">{param.unit}</span>
                  </div>
                </div>
              </div>
            ))}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Negotiation Settings
              </h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.negotiations.allowNegotiation}
                    onChange={(e) =>
                      handleConfigChange({
                        negotiations: {
                          ...config.negotiations,
                          allowNegotiation: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow salary negotiation
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.negotiations.escalationRequired}
                    onChange={(e) =>
                      handleConfigChange({
                        negotiations: {
                          ...config.negotiations,
                          escalationRequired: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Require escalation for negotiations
                  </span>
                </label>
              </div>

              {config.negotiations.allowNegotiation && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Negotiation Rounds
                    </label>
                    <input
                      type="number"
                      value={config.negotiations.maxNegotiationRounds}
                      onChange={(e) => {
                        // Allow the field to be cleared for typing
                        if (e.target.value === "") {
                          handleConfigChange({
                            negotiations: {
                              ...config.negotiations,
                              maxNegotiationRounds: 1,
                            },
                          });
                        } else {
                          const value = parseInt(e.target.value);
                          // Handle NaN and enforce min/max
                          if (!isNaN(value)) {
                            const validValue = Math.max(1, Math.min(5, value));
                            handleConfigChange({
                              negotiations: {
                                ...config.negotiations,
                                maxNegotiationRounds: validValue,
                              },
                            });
                          }
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      max="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Limit (days)
                    </label>
                    <input
                      type="number"
                      value={config.negotiations.timeLimit}
                      onChange={(e) => {
                        // Allow the field to be cleared for typing
                        if (e.target.value === "") {
                          handleConfigChange({
                            negotiations: {
                              ...config.negotiations,
                              timeLimit: 1,
                            },
                          });
                        } else {
                          const value = parseInt(e.target.value);
                          // Handle NaN and enforce min/max
                          if (!isNaN(value)) {
                            const validValue = Math.max(1, Math.min(14, value));
                            handleConfigChange({
                              negotiations: {
                                ...config.negotiations,
                                timeLimit: validValue,
                              },
                            });
                          }
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      max="14"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Approval Workflow */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("approval")}
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Approval Workflow
            </h3>
          </div>
          {expandedSections.approval ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.approval && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decision Timeline (days)
              </label>
              <input
                type="number"
                value={config.decisionTimeline}
                onChange={(e) => {
                  // Allow the field to be cleared for typing
                  if (e.target.value === "") {
                    handleConfigChange({
                      decisionTimeline: 1,
                    });
                  } else {
                    const value = parseInt(e.target.value);
                    // Handle NaN and enforce min/max
                    if (!isNaN(value)) {
                      const validValue = Math.max(1, Math.min(14, value));
                      handleConfigChange({
                        decisionTimeline: validValue,
                      });
                    }
                  }
                }}
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                max="14"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Required Approvals
              </h4>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.approvalWorkflow.requiresExecutiveApproval}
                  onChange={(e) =>
                    handleConfigChange({
                      approvalWorkflow: {
                        ...config.approvalWorkflow,
                        requiresExecutiveApproval: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Executive approval required
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.approvalWorkflow.requiresBudgetApproval}
                  onChange={(e) =>
                    handleConfigChange({
                      approvalWorkflow: {
                        ...config.approvalWorkflow,
                        requiresBudgetApproval: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Budget approval required
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.approvalWorkflow.requiresHRApproval}
                  onChange={(e) =>
                    handleConfigChange({
                      approvalWorkflow: {
                        ...config.approvalWorkflow,
                        requiresHRApproval: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  HR approval required
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approval Timeframe (days)
              </label>
              <input
                type="number"
                value={config.approvalWorkflow.approvalTimeframe}
                onChange={(e) => {
                  // Allow the field to be cleared for typing
                  if (e.target.value === "") {
                    handleConfigChange({
                      approvalWorkflow: {
                        ...config.approvalWorkflow,
                        approvalTimeframe: 1,
                      },
                    });
                  } else {
                    const value = parseInt(e.target.value);
                    // Handle NaN and enforce min/max
                    if (!isNaN(value)) {
                      const validValue = Math.max(1, Math.min(10, value));
                      handleConfigChange({
                        approvalWorkflow: {
                          ...config.approvalWorkflow,
                          approvalTimeframe: validValue,
                        },
                      });
                    }
                  }
                }}
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                max="10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final Interview Instructions
          </label>
          <textarea
            value={config.instructions}
            onChange={(e) =>
              handleConfigChange({ instructions: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Instructions for the final interview..."
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-purple-900">
              Final Interview Summary
            </h4>
            <div className="mt-2 text-sm text-purple-700 space-y-1">
              <p>
                • {config.duration} minute final interview with{" "}
                {config.decisionCriteria.length} evaluation criteria
              </p>
              <p>
                • {config.offerParameters.length} offer parameters configured
              </p>
              <p>
                • {config.decisionTimeline} day decision timeline with{" "}
                {Object.values(config.approvalWorkflow).filter(Boolean).length}{" "}
                approval requirements
              </p>
              <p>
                • Negotiations{" "}
                {config.negotiations.allowNegotiation
                  ? "allowed"
                  : "not allowed"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

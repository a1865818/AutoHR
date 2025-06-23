"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Star,
  Target,
  TrendingUp,
  BarChart3,
  Sliders,
  Info,
  CheckCircle,
} from "lucide-react";

export interface ScoringCriteria {
  id: string;
  name: string;
  description: string;
  weight: number; // 1-10
  maxScore: number;
  type: "numeric" | "star" | "scale" | "pass_fail" | "percentage";
  required: boolean;
  subCriteria?: ScoringCriteria[];
}

interface ScoringMethod {
  id: string;
  name: string;
  description: string;
  type: "weighted" | "average" | "composite" | "rubric";
  passingThreshold: number;
  criteria: ScoringCriteria[];
}

interface ScoringMatrixProps {
  scoringMethod: ScoringMethod;
  onScoringMethodChange: (method: ScoringMethod) => void;
  allowCustomCriteria?: boolean;
  predefinedCriteria?: ScoringCriteria[];
  showWeights?: boolean;
  showThreshold?: boolean;
  maxCriteria?: number;
}

export function ScoringMatrix({
  scoringMethod,
  onScoringMethodChange,
  allowCustomCriteria = true,
  predefinedCriteria = [],
  showWeights = true,
  showThreshold = true,
  maxCriteria = 10,
}: ScoringMatrixProps) {
  const [isAddingCriteria, setIsAddingCriteria] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<string | null>(null);
  const [previewScore, setPreviewScore] = useState<Record<string, number>>({});

  const scoringTypes = [
    {
      value: "weighted",
      label: "Weighted Average",
      description: "Criteria weighted by importance",
      icon: TrendingUp,
    },
    {
      value: "average",
      label: "Simple Average",
      description: "All criteria equally weighted",
      icon: BarChart3,
    },
    {
      value: "composite",
      label: "Composite Score",
      description: "Complex calculation method",
      icon: Sliders,
    },
    {
      value: "rubric",
      label: "Rubric-based",
      description: "Structured evaluation framework",
      icon: CheckCircle,
    },
  ];

  const criteriaTypes = [
    { value: "numeric", label: "Numeric (0-100)", icon: Target },
    { value: "star", label: "Star Rating (1-5)", icon: Star },
    { value: "scale", label: "Scale (1-10)", icon: Sliders },
    { value: "pass_fail", label: "Pass/Fail", icon: CheckCircle },
    { value: "percentage", label: "Percentage (0-100%)", icon: TrendingUp },
  ];

  const addCriteria = (criteria: ScoringCriteria) => {
    const updatedMethod = {
      ...scoringMethod,
      criteria: [...scoringMethod.criteria, criteria],
    };
    onScoringMethodChange(updatedMethod);
    setIsAddingCriteria(false);
  };

  const updateCriteria = (id: string, updates: Partial<ScoringCriteria>) => {
    const updatedMethod = {
      ...scoringMethod,
      criteria: scoringMethod.criteria.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    };
    onScoringMethodChange(updatedMethod);
    setEditingCriteria(null);
  };

  const deleteCriteria = (id: string) => {
    const updatedMethod = {
      ...scoringMethod,
      criteria: scoringMethod.criteria.filter((c) => c.id !== id),
    };
    onScoringMethodChange(updatedMethod);
  };

  const calculatePreviewScore = () => {
    const totalPossible = scoringMethod.criteria.reduce((sum, criteria) => {
      return sum + criteria.maxScore * (showWeights ? criteria.weight : 1);
    }, 0);

    const actualScore = scoringMethod.criteria.reduce((sum, criteria) => {
      const score = previewScore[criteria.id] || 0;
      return sum + score * (showWeights ? criteria.weight : 1);
    }, 0);

    return totalPossible > 0
      ? Math.round((actualScore / totalPossible) * 100)
      : 0;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = criteriaTypes.find((t) => t.value === type);
    return typeConfig?.icon || Target;
  };

  const formatScoreDisplay = (criteria: ScoringCriteria, score: number) => {
    switch (criteria.type) {
      case "star":
        return "★".repeat(score) + "☆".repeat(criteria.maxScore - score);
      case "pass_fail":
        return score > 0 ? "Pass" : "Fail";
      case "percentage":
        return `${score}%`;
      default:
        return `${score}/${criteria.maxScore}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Method Selection */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Scoring Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scoring Method
            </label>
            <select
              value={scoringMethod.type}
              onChange={(e) =>
                onScoringMethodChange({
                  ...scoringMethod,
                  type: e.target.value as ScoringMethod["type"],
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {scoringTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {
                scoringTypes.find((t) => t.value === scoringMethod.type)
                  ?.description
              }
            </p>
          </div>

          {showThreshold && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Threshold (%)
              </label>
              <input
                type="number"
                value={scoringMethod.passingThreshold}
                onChange={(e) =>
                  onScoringMethodChange({
                    ...scoringMethod,
                    passingThreshold: parseInt(e.target.value) || 70,
                  })
                }
                min="0"
                max="100"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Method Description
          </label>
          <textarea
            value={scoringMethod.description}
            onChange={(e) =>
              onScoringMethodChange({
                ...scoringMethod,
                description: e.target.value,
              })
            }
            placeholder="Describe how this scoring method should be applied..."
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Scoring Criteria */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              Evaluation Criteria
            </h4>
            <p className="text-sm text-gray-600">
              {scoringMethod.criteria.length} criteria
              {maxCriteria && ` (max ${maxCriteria})`}
            </p>
          </div>

          {allowCustomCriteria && (
            <button
              onClick={() => setIsAddingCriteria(true)}
              disabled={
                maxCriteria
                  ? scoringMethod.criteria.length >= maxCriteria
                  : false
              }
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Criteria
            </button>
          )}
        </div>

        {/* Criteria List */}
        <div className="space-y-3">
          {scoringMethod.criteria.map((criteria, index) => {
            const TypeIcon = getTypeIcon(criteria.type);
            const isEditing = editingCriteria === criteria.id;

            return (
              <div
                key={criteria.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                {isEditing ? (
                  <CriteriaEditor
                    criteria={criteria}
                    onSave={(updates) => updateCriteria(criteria.id, updates)}
                    onCancel={() => setEditingCriteria(null)}
                    showWeights={showWeights}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                            #{index + 1}
                          </span>
                          <div className="flex items-center space-x-1">
                            <TypeIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500 capitalize">
                              {criteria.type.replace("_", " ")}
                            </span>
                          </div>
                          {criteria.required && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              Required
                            </span>
                          )}
                          {showWeights && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              Weight: {criteria.weight}
                            </span>
                          )}
                        </div>

                        <h5 className="font-medium text-gray-900 mb-1">
                          {criteria.name}
                        </h5>
                        <p className="text-sm text-gray-600 mb-2">
                          {criteria.description}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Max Score: {criteria.maxScore}</span>
                          <span>Type: {criteria.type.replace("_", " ")}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingCriteria(criteria.id)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {allowCustomCriteria && (
                          <button
                            onClick={() => deleteCriteria(criteria.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preview Scoring */}
                    <div className="bg-gray-50 rounded p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Preview Score:
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max={criteria.maxScore}
                            value={previewScore[criteria.id] || 0}
                            onChange={(e) =>
                              setPreviewScore((prev) => ({
                                ...prev,
                                [criteria.id]: parseInt(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                          <span className="text-sm font-medium min-w-[60px]">
                            {formatScoreDisplay(
                              criteria,
                              previewScore[criteria.id] || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Criteria Form */}
        {isAddingCriteria && (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 mt-4">
            <CriteriaEditor
              criteria={{
                id: `criteria_${Date.now()}`,
                name: "",
                description: "",
                weight: 5,
                maxScore: 100,
                type: "numeric",
                required: false,
              }}
              onSave={addCriteria}
              onCancel={() => setIsAddingCriteria(false)}
              showWeights={showWeights}
              isNew={true}
            />
          </div>
        )}

        {scoringMethod.criteria.length === 0 && !isAddingCriteria && (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No evaluation criteria defined</p>
            <p className="text-sm">Add criteria to configure scoring</p>
          </div>
        )}
      </div>

      {/* Overall Score Preview */}
      {scoringMethod.criteria.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Score Preview
          </h4>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-900">
                Overall Score:
              </span>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-2xl font-bold ${getScoreColor(
                    calculatePreviewScore()
                  )}`}
                >
                  {calculatePreviewScore()}%
                </span>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    calculatePreviewScore() >= scoringMethod.passingThreshold
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {calculatePreviewScore() >= scoringMethod.passingThreshold
                    ? "Pass"
                    : "Fail"}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>
                Passing threshold: {scoringMethod.passingThreshold}% • Method:{" "}
                {
                  scoringTypes.find((t) => t.value === scoringMethod.type)
                    ?.label
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Criteria Editor Component
interface CriteriaEditorProps {
  criteria: Partial<ScoringCriteria>;
  onSave: (criteria: any) => void;
  onCancel: () => void;
  showWeights: boolean;
  isNew?: boolean;
}

function CriteriaEditor({
  criteria,
  onSave,
  onCancel,
  showWeights,
  isNew = false,
}: CriteriaEditorProps) {
  const [editedCriteria, setEditedCriteria] =
    useState<Partial<ScoringCriteria>>(criteria);

  const criteriaTypes = [
    { value: "numeric", label: "Numeric (0-100)", maxScore: 100 },
    { value: "star", label: "Star Rating (1-5)", maxScore: 5 },
    { value: "scale", label: "Scale (1-10)", maxScore: 10 },
    { value: "pass_fail", label: "Pass/Fail", maxScore: 1 },
    { value: "percentage", label: "Percentage (0-100%)", maxScore: 100 },
  ];

  const handleTypeChange = (type: string) => {
    const typeConfig = criteriaTypes.find((t) => t.value === type);
    setEditedCriteria((prev) => ({
      ...prev,
      type: type as ScoringCriteria["type"],
      maxScore: typeConfig?.maxScore || 100,
    }));
  };

  const handleSave = () => {
    if (!editedCriteria.name?.trim()) return;
    onSave(isNew ? editedCriteria : editedCriteria);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Criteria Name *
          </label>
          <input
            type="text"
            value={editedCriteria.name || ""}
            onChange={(e) =>
              setEditedCriteria((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., Technical Knowledge"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scoring Type
          </label>
          <select
            value={editedCriteria.type || "numeric"}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {criteriaTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={editedCriteria.description || ""}
          onChange={(e) =>
            setEditedCriteria((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Describe what this criteria evaluates..."
          rows={2}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {showWeights && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (1-10)
            </label>
            <input
              type="number"
              value={editedCriteria.weight || 5}
              onChange={(e) =>
                setEditedCriteria((prev) => ({
                  ...prev,
                  weight: parseInt(e.target.value) || 5,
                }))
              }
              min="1"
              max="10"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Score
          </label>
          <input
            type="number"
            value={editedCriteria.maxScore || 100}
            onChange={(e) =>
              setEditedCriteria((prev) => ({
                ...prev,
                maxScore: parseInt(e.target.value) || 100,
              }))
            }
            min="1"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="required"
          checked={editedCriteria.required || false}
          onChange={(e) =>
            setEditedCriteria((prev) => ({
              ...prev,
              required: e.target.checked,
            }))
          }
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="required" className="ml-2 text-sm text-gray-700">
          Required criteria
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!editedCriteria.name?.trim()}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isNew ? "Add Criteria" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

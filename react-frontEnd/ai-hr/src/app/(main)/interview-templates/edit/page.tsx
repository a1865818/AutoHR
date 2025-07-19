"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Users,
  Plus,
  X,
  Phone,
  Video,
  Code,
  MessageSquare,
  Crown,
  Heart,
  GripVertical,
  Check,
  AlertCircle,
  Save,
  Loader2,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  InterviewTemplate,
  InterviewRound,
  InterviewType,
} from "@/interfaces/interview";
import { interviewService } from "@/services/interviewService";

type Step = 1 | 2 | 3;

export default function EditInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<Partial<InterviewTemplate>>({
    name: "",
    description: "",
    isDefault: false,
    rounds: [],
  });

  const interviewTypes: Array<{
    type: InterviewType;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    duration: number;
  }> = [
    {
      type: "phone_screening",
      label: "Phone Screening",
      description: "Initial phone conversation to assess basic qualifications",
      icon: Phone,
      color: "blue",
      duration: 30,
    },
    {
      type: "video_interview",
      label: "Video Interview",
      description: "Face-to-face conversation over video call",
      icon: Video,
      color: "green",
      duration: 45,
    },
    {
      type: "technical_assessment",
      label: "Technical Assessment",
      description: "Evaluate technical skills and knowledge",
      icon: Code,
      color: "purple",
      duration: 60,
    },
    {
      type: "coding_challenge",
      label: "Coding Challenge",
      description: "Live coding session or take-home challenge",
      icon: Code,
      color: "orange",
      duration: 90,
    },

    {
      type: "final_interview",
      label: "Final Interview",
      description: "Final decision-making interview with leadership",
      icon: Crown,
      color: "yellow",
      duration: 45,
    },
    {
      type: "culture_fit",
      label: "Culture Fit",
      description: "Assess alignment with company values",
      icon: Heart,
      color: "red",
      duration: 30,
    },
  ];

  // Load template data on mount
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) {
        setError("No template ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [templateData, roundsData] = await Promise.all([
          interviewService.getInterviewTemplate(templateId),
          interviewService.getInterviewRounds(templateId),
        ]);

        setTemplate({
          ...templateData,
          rounds: roundsData,
        });
      } catch (err: any) {
        console.error("Error loading template:", err);
        setError(err.message || "Failed to load template");
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  const addRound = (type: InterviewType) => {
    const typeConfig = interviewTypes.find((t) => t.type === type);
    if (!typeConfig) return;

    const newRound: InterviewRound = {
      id: `round_${Date.now()}`,
      name: typeConfig.label,
      type: type,
      duration: typeConfig.duration,
      roundOrder: (template.rounds?.length || 0) + 1,
      requirements: [],
      interviewers: [],
      isOptional: false,
      passingCriteria: 70,
    };

    setTemplate((prev) => ({
      ...prev,
      rounds: [...(prev.rounds || []), newRound],
    }));
  };

  const updateRound = (roundId: string, updates: Partial<InterviewRound>) => {
    setTemplate((prev) => ({
      ...prev,
      rounds: prev.rounds?.map((round) =>
        round.id === roundId ? { ...round, ...updates } : round
      ),
    }));
  };

  const removeRound = (roundId: string) => {
    setTemplate((prev) => ({
      ...prev,
      rounds: prev.rounds?.filter((round) => round.id !== roundId),
    }));
  };

  const moveRound = (roundId: string, direction: "up" | "down") => {
    const rounds = template.rounds || [];
    const currentIndex = rounds.findIndex((r) => r.id === roundId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= rounds.length) return;

    const newRounds = [...rounds];
    [newRounds[currentIndex], newRounds[newIndex]] = [
      newRounds[newIndex],
      newRounds[currentIndex],
    ];

    // Update order
    newRounds.forEach((round, index) => {
      round.roundOrder = index + 1;
    });

    setTemplate((prev) => ({ ...prev, rounds: newRounds }));
  };

  // Drag and drop functionality
  const [draggedRound, setDraggedRound] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, roundId: string) => {
    setDraggedRound(roundId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", roundId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetRoundId: string) => {
    e.preventDefault();

    if (!draggedRound || draggedRound === targetRoundId) {
      setDraggedRound(null);
      return;
    }

    const rounds = template.rounds || [];
    const draggedIndex = rounds.findIndex((r) => r.id === draggedRound);
    const targetIndex = rounds.findIndex((r) => r.id === targetRoundId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedRound(null);
      return;
    }

    const newRounds = [...rounds];
    const [draggedItem] = newRounds.splice(draggedIndex, 1);
    newRounds.splice(targetIndex, 0, draggedItem);

    // Update order
    newRounds.forEach((round, index) => {
      round.roundOrder = index + 1;
    });

    setTemplate((prev) => ({ ...prev, rounds: newRounds }));
    setDraggedRound(null);
  };

  const handleDragEnd = () => {
    setDraggedRound(null);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      pink: "bg-pink-100 text-pink-800 border-pink-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      red: "bg-red-100 text-red-800 border-red-200",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return template.name && template.description;
    }
    if (currentStep === 2) {
      return template.rounds && template.rounds.length > 0;
    }
    return true;
  };

  const totalDuration = (template.rounds || []).reduce(
    (sum, round) => sum + round.duration,
    0
  );

  const handleSubmit = async () => {
    if (!template.name || !template.description || !templateId) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Update the template
      console.log("🔄 Updating template...");
      const templateData = {
        name: template.name,
        description: template.description,
        isDefault: template.isDefault || false,
      };

      await interviewService.updateInterviewTemplate(templateId, templateData);
      console.log("✅ Template updated successfully");

      // Get existing rounds to manage updates/creates/deletes
      console.log("🔄 Fetching existing rounds...");
      const existingRounds = await interviewService.getInterviewRounds(
        templateId
      );
      console.log("✅ Existing rounds fetched:", existingRounds.length);

      const currentRounds = template.rounds || [];
      console.log("📋 Current rounds:", currentRounds.length);

      // Helper function to check if ID is a valid GUID
      const isValidGuid = (id: string): boolean => {
        const guidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return guidRegex.test(id);
      };

      // Delete rounds that no longer exist
      console.log("🔄 Deleting removed rounds...");
      for (const existingRound of existingRounds) {
        const stillExists = currentRounds.find(
          (r) => r.id === existingRound.id && isValidGuid(r.id)
        );
        if (!stillExists) {
          console.log(
            `🗑️ Deleting round: ${existingRound.id} - ${existingRound.name}`
          );
          try {
            await interviewService.deleteInterviewRound(existingRound.id);
            console.log(`✅ Round deleted successfully: ${existingRound.id}`);
          } catch (deleteError: any) {
            console.error(
              `❌ Error deleting round ${existingRound.id}:`,
              deleteError
            );
            throw new Error(
              `Failed to delete round "${existingRound.name}": ${deleteError.message}`
            );
          }
        }
      }

      // Create or update rounds
      console.log("🔄 Processing round updates/creates...");
      for (let i = 0; i < currentRounds.length; i++) {
        const round = currentRounds[i];
        console.log(
          `🔄 Processing round ${i + 1}/${currentRounds.length}: ${
            round.name
          } (ID: ${round.id})`
        );

        const roundData = {
          name: round.name,
          type: round.type,
          duration: round.duration,
          roundOrder: round.roundOrder || 1,
          requirements: round.requirements || [],
          interviewers: round.interviewers || [],
          isOptional: round.isOptional || false,
          passingCriteria: round.passingCriteria || 70,
          description: round.description,
        };

        if (!isValidGuid(round.id)) {
          // New round with temporary ID - create it
          console.log(`➕ Creating new round: ${round.name}`);
          try {
            await interviewService.createInterviewRound(templateId, roundData);
            console.log(`✅ Round created successfully: ${round.name}`);
          } catch (createError: any) {
            console.error(
              `❌ Error creating round ${round.name}:`,
              createError
            );
            throw new Error(
              `Failed to create round "${round.name}": ${createError.message}`
            );
          }
        } else {
          // Existing round with valid GUID - check if it still exists in database before updating
          const existsInDb = existingRounds.find((r) => r.id === round.id);
          if (existsInDb) {
            console.log(
              `📝 Updating existing round: ${round.name} (${round.id})`
            );
            try {
              await interviewService.updateInterviewRound(round.id, roundData);
              console.log(`✅ Round updated successfully: ${round.name}`);
            } catch (updateError: any) {
              console.error(
                `❌ Error updating round ${round.id}:`,
                updateError
              );
              throw new Error(
                `Failed to update round "${round.name}": ${updateError.message}`
              );
            }
          } else {
            // Round was deleted from database but still in our local state, create as new
            console.log(`➕ Creating round (not found in DB): ${round.name}`);
            try {
              await interviewService.createInterviewRound(
                templateId,
                roundData
              );
              console.log(`✅ Round created successfully: ${round.name}`);
            } catch (createError: any) {
              console.error(
                `❌ Error creating round ${round.name}:`,
                createError
              );
              throw new Error(
                `Failed to create round "${round.name}": ${createError.message}`
              );
            }
          }
        }
      }

      console.log("🎉 All operations completed successfully, redirecting...");
      // Redirect back to the interview templates list page
      router.push("/interview-templates");
    } catch (error: any) {
      console.error("❌ Error updating interview template:", error);
      setError(error.message || "Failed to update interview template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-3" />
            <span className="text-gray-600">Loading template...</span>
          </div>
        </div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Template Information
        </h2>
        <p className="text-gray-600">Update your interview template details.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            value={template.name || ""}
            onChange={(e) =>
              setTemplate((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., Standard 3-Round Process"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={template.description || ""}
            onChange={(e) =>
              setTemplate((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe when and how this template should be used..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            checked={template.isDefault || false}
            onChange={(e) =>
              setTemplate((prev) => ({ ...prev, isDefault: e.target.checked }))
            }
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-3 text-sm text-gray-700">
            Set as default template for new jobs
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Interview Rounds
        </h2>
        <p className="text-gray-600">
          Add and configure the interview rounds for this template.
        </p>
      </div>

      {/* Add Round Types */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add Interview Round
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {interviewTypes.map((type) => {
            const IconComponent = type.icon;
            const colorClasses = getColorClasses(type.color);

            return (
              <button
                key={type.type}
                onClick={() => addRound(type.type)}
                className={`p-4 rounded-lg border-2 border-dashed transition-all hover:border-solid hover:shadow-md ${colorClasses}`}
              >
                <div className="text-center">
                  <IconComponent className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="font-medium text-sm mb-1">{type.label}</h4>
                  <p className="text-xs opacity-75">{type.duration}min</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Rounds */}
      {template.rounds && template.rounds.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Interview Flow
          </h3>
          <p className="text-sm text-gray-600 mb-4 flex items-center">
            <GripVertical className="w-4 h-4 mr-2" />
            Drag and drop rounds to reorder them
          </p>
          <div className="space-y-4">
            {template.rounds.map((round, index) => {
              const typeConfig = interviewTypes.find(
                (t) => t.type === round.type
              );
              const IconComponent = typeConfig?.icon || Users;
              const colorClasses = getColorClasses(typeConfig?.color || "gray");

              return (
                <div
                  key={round.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, round.id)}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDrop={(e) => handleDrop(e, round.id)}
                  onDragEnd={handleDragEnd}
                  className={`border border-gray-200 rounded-lg p-4 cursor-move transition-all duration-200 ${
                    draggedRound === round.id
                      ? "opacity-50 scale-95 shadow-lg border-indigo-300"
                      : "hover:shadow-md hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className={`p-2 rounded-lg ${colorClasses}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {round.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Round {round.roundOrder}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRound(round.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Round Name
                      </label>
                      <input
                        type="text"
                        value={round.name}
                        onChange={(e) =>
                          updateRound(round.id, { name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={round.duration}
                        onChange={(e) =>
                          updateRound(round.id, {
                            duration: parseInt(e.target.value) || 30,
                          })
                        }
                        min="15"
                        max="180"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passing Score (%)
                      </label>
                      <input
                        type="number"
                        value={round.passingCriteria}
                        onChange={(e) =>
                          updateRound(round.id, {
                            passingCriteria: parseInt(e.target.value) || 70,
                          })
                        }
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`optional-${round.id}`}
                        checked={round.isOptional}
                        onChange={(e) =>
                          updateRound(round.id, {
                            isOptional: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`optional-${round.id}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        Optional round
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Preview & Save
        </h2>
        <p className="text-gray-600">
          Review your interview template before saving.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {template.name}
            </h3>
            <p className="text-gray-600 mb-4">{template.description}</p>
            {template.isDefault && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                Default Template
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Interview Process
            </h4>
            <div className="text-sm text-gray-500">
              Total Duration: {Math.floor(totalDuration / 60)}h{" "}
              {totalDuration % 60}min
            </div>
          </div>

          <div className="space-y-4">
            {template.rounds?.map((round, index) => {
              const typeConfig = interviewTypes.find(
                (t) => t.type === round.type
              );
              const IconComponent = typeConfig?.icon || Users;
              const colorClasses = getColorClasses(typeConfig?.color || "gray");

              return (
                <div
                  key={round.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{round.name}</h5>
                    <p className="text-sm text-gray-500">
                      {round.duration} minutes • {round.passingCriteria}%
                      passing score
                      {round.isOptional && " • Optional"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/interview-templates"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Interview Template
              </h1>
              <p className="text-gray-600">Step {currentStep} of 3</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Edit className="w-4 h-4" />
            <span>Editing: {template.name}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              setCurrentStep((prev) => Math.max(1, prev - 1) as Step)
            }
            disabled={currentStep === 1 || isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            {currentStep === 3 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Template</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentStep((prev) => Math.min(3, prev + 1) as Step)
                }
                disabled={!canProceed() || isSubmitting}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

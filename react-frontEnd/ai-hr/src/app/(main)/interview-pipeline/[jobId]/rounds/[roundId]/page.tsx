"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Video,
  Code,
  MessageSquare,
  Users,
  Crown,
  Heart,
  Calendar,
  Settings,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  FileText,
  Loader,
} from "lucide-react";
import { ConfigurationLayout } from "@/components/interview_pipeline/rounds/shared/ConfigurationLayout";
import { PhoneScreeningConfig } from "@/components/interview_pipeline/rounds/PhoneScreeningConfig";
import { VideoInterviewConfig } from "@/components/interview_pipeline/rounds/VideoInterviewConfig";
import { TechnicalAssessmentConfig } from "@/components/interview_pipeline/rounds/TechnicalAssessmentConfig";
import { CodingChallengeConfig } from "@/components/interview_pipeline/rounds/CodingChallengeConfig";

import { PanelInterviewConfig } from "@/components/interview_pipeline/rounds/PanelInterviewConfig";
import { FinalInterviewConfig } from "@/components/interview_pipeline/rounds/FinalInterviewConfig";
import { CultureFitConfig } from "@/components/interview_pipeline/rounds/CultureFitConfig";
import { ConfirmationModal } from "@/components/interview_pipeline/rounds/shared/ConfirmationModal";
import {
  roundConfigurationAPI,
  RoundConfiguration,
  DEFAULT_CONFIGURATIONS,
} from "@/services/roundConfigurationApi";

// Types
interface InterviewType {
  phone_screening: string;
  video_interview: string;
  technical_assessment: string;
  coding_challenge: string;
  panel_interview: string;
  final_interview: string;
  culture_fit: string;
}

interface InterviewRound {
  id: string;
  name: string;
  type: keyof InterviewType;
  duration: number;
  roundOrder: number;
  passingCriteria: number;
  description?: string;
  requirements?: string[];
  interviewers?: string[];
  isOptional?: boolean;
}

interface Job {
  id: string;
  title: string;
  department?: string;
  interviewTemplate?: {
    id: string;
    name: string;
    rounds: InterviewRound[];
  };
}

export default function RoundConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const { jobId, roundId } = params;

  const [job, setJob] = useState<Job | null>(null);
  const [round, setRound] = useState<InterviewRound | null>(null);
  const [configuration, setConfiguration] = useState<
    Partial<RoundConfiguration>
  >({});
  const [originalConfiguration, setOriginalConfiguration] = useState<
    Partial<RoundConfiguration>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [status, setStatus] = useState<
    "not_configured" | "draft" | "configured" | "active" | "archived"
  >("not_configured");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    confirmType: "warning" as "warning" | "danger" | "info",
    action: "" as "reset" | "back" | "",
  });

  // Navigation target for back action
  const [navigationTarget, setNavigationTarget] = useState("");

  useEffect(() => {
    fetchJobAndRound();
  }, [jobId, roundId]);

  useEffect(() => {
    // Check for unsaved changes
    const hasChanges =
      JSON.stringify(configuration) !== JSON.stringify(originalConfiguration);
    setHasUnsavedChanges(hasChanges);
  }, [configuration, originalConfiguration]);

  const fetchJobAndRound = async () => {
    try {
      console.log("🔍 Fetching job and round data...");
      setLoading(true);

      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      const jobData = await jobResponse.json();

      if (jobData.success) {
        setJob(jobData.data);

        // Find the specific round
        const foundRound = jobData.data.interviewTemplate?.rounds?.find(
          (r: InterviewRound) => r.id === roundId
        );

        if (foundRound) {
          setRound(foundRound);
          await loadConfiguration(foundRound.type);
        } else {
          console.error("❌ Round not found!");
        }
      } else {
        console.error("❌ Job fetch failed:", jobData);
      }
    } catch (error) {
      console.error("Error fetching job and round:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = async (roundType: keyof InterviewType) => {
    try {
      console.log(`🔄 Loading configuration for round type: ${roundType}`);

      // Try to load existing configuration
      const response = await roundConfigurationAPI.getConfiguration(
        jobId as string,
        roundId as string
      );

      if (response.success && response.data) {
        console.log("✅ Loaded existing configuration:", response.data);

        // Transform backend data to frontend format
        const frontendConfig = transformFromBackendFormat(response.data);
        setConfiguration(frontendConfig);
        setOriginalConfiguration(frontendConfig);
        setStatus(response.data.status || "configured");
        return;
      }

      console.log("📋 No existing configuration found, loading defaults");

      // Load default configuration for this round type
      const defaultResponse =
        await roundConfigurationAPI.getDefaultConfiguration(roundType);

      if (defaultResponse.success && defaultResponse.data) {
        console.log("✅ Loaded default configuration:", defaultResponse.data);

        // Get the hard-coded defaults for this round type
        const hardcodedDefaults =
          DEFAULT_CONFIGURATIONS[
            roundType as keyof typeof DEFAULT_CONFIGURATIONS
          ];
        console.log("📚 Hard-coded defaults:", hardcodedDefaults);

        // Make sure we're using the full default configuration
        const defaultConfig = {
          ...hardcodedDefaults,
          ...defaultResponse.data,
          // Ensure questions and scoring criteria are preserved from hardcoded defaults
          questions:
            hardcodedDefaults && "questions" in hardcodedDefaults
              ? hardcodedDefaults.questions
              : [],
          scoringCriteria:
            hardcodedDefaults && "scoringCriteria" in hardcodedDefaults
              ? hardcodedDefaults.scoringCriteria
              : [],
          roundType,
          name: `${roundType
            .replace("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())} Configuration`,
          description: `Configuration for ${roundType.replace("_", " ")} round`,
          status: "draft" as const,
        };

        console.log("🔄 Final combined default configuration:", defaultConfig);
        setConfiguration(defaultConfig);
        setOriginalConfiguration(defaultConfig);
        setStatus("not_configured");
      }
    } catch (error) {
      console.error("❌ Error loading configuration:", error);

      // Use hardcoded defaults as fallback
      const defaultConfig = {
        ...(DEFAULT_CONFIGURATIONS[
          roundType as keyof typeof DEFAULT_CONFIGURATIONS
        ] || {}),
        roundType,
        name: `${roundType
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())} Configuration`,
        description: `Configuration for ${roundType.replace("_", " ")} round`,
        status: "draft" as const,
      };

      console.log("🆘 Using pure hard-coded defaults:", defaultConfig);
      setConfiguration(defaultConfig);
      setOriginalConfiguration(defaultConfig);
      setStatus("not_configured");
    }
  };

  // Transform backend response to frontend format
  const transformFromBackendFormat = (
    backendData: any
  ): Partial<RoundConfiguration> => {
    return {
      id: backendData.id,
      jobId: backendData.jobId,
      roundId: backendData.roundId,
      roundType: backendData.roundType,
      name: backendData.name,
      description: backendData.description,
      duration: backendData.duration,
      status: backendData.status,
      createdAt: backendData.createdAt,
      updatedAt: backendData.updatedAt,
      createdBy: backendData.createdBy,
      lastModifiedBy: backendData.lastModifiedBy,
      // Merge configurationData into the main object
      ...backendData.configurationData,
      // Include questions and scoring criteria if present
      questions: backendData.questions || [],
      scoringCriteria: backendData.scoringCriteria || [],
    };
  };

  const handleConfigurationChange = (
    newConfig: Partial<RoundConfiguration>
  ) => {
    setConfiguration(newConfig);

    // Close any open confirmation modal when the user makes changes
    if (confirmationModal.isOpen) {
      closeConfirmationModal();
    }

    validateConfiguration(newConfig);
  };

  const validateConfiguration = async (config: Partial<RoundConfiguration>) => {
    try {
      // Client-side validation for duration
      const errors: string[] = [];

      // Check duration limits
      if (config.duration !== undefined) {
        const duration = Number(config.duration);
        // Fix for NaN by checking if duration is a valid number
        if (isNaN(duration)) {
          errors.push("Duration must be a valid number");
        } else if (duration < 15) {
          errors.push("Duration must be at least 15 minutes");
        } else if (duration > 480) {
          errors.push("Duration cannot exceed 480 minutes (8 hours)");
        }
      }

      // Only call API validation if we passed client validations
      if (errors.length === 0) {
        const result = await roundConfigurationAPI.validateConfiguration(
          jobId as string,
          roundId as string,
          config
        );
        setValidationErrors(result.errors || []);
      } else {
        setValidationErrors(errors);
      }
    } catch (error) {
      console.error("Error validating configuration:", error);
      setValidationErrors([]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setValidationErrors([]);

      console.log("💾 Saving configuration:", configuration);

      // Ensure required fields are set
      const configToSave = {
        ...configuration,
        roundType: round?.type,
        status: (status === "not_configured" ? "draft" : "configured") as
          | "draft"
          | "configured"
          | "active"
          | "archived",
      };

      // Save configuration
      const response = await roundConfigurationAPI.saveConfiguration(
        jobId as string,
        roundId as string,
        configToSave
      );

      if (response.success) {
        console.log("✅ Configuration saved successfully!");

        // Transform the saved data back to frontend format
        const savedConfig = transformFromBackendFormat(response.data);
        setConfiguration(savedConfig);
        setOriginalConfiguration(savedConfig);
        setHasUnsavedChanges(false);
        setStatus(response.data.status || "configured");
        setValidationErrors([]);

        console.log("🎉 Configuration saved and state updated");
      } else {
        console.error("❌ Save failed:", response);
        setValidationErrors([
          response.message || "Failed to save configuration",
        ]);
      }
    } catch (error) {
      console.error("❌ Error saving configuration:", error);
      setValidationErrors([
        error instanceof Error ? error.message : "Unknown error occurred",
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    // Open confirmation modal instead of using confirm()
    setConfirmationModal({
      isOpen: true,
      title: "Reset Changes",
      message:
        "Are you sure you want to reset all changes? This action cannot be undone.",
      confirmLabel: "Reset",
      cancelLabel: "Cancel",
      confirmType: "warning",
      action: "reset",
    });
  };

  const handleResetConfirmed = async () => {
    try {
      // Reload the original configuration
      if (Object.keys(originalConfiguration).length > 0) {
        setConfiguration(originalConfiguration);
      } else {
        // Load default configuration
        await loadConfiguration(round?.type || "phone_screening");
      }
      setHasUnsavedChanges(false);
      setValidationErrors([]);
    } catch (error) {
      console.error("Error resetting configuration:", error);
    } finally {
      // Close the modal
      closeConfirmationModal();
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      // Open confirmation modal instead of using confirm()
      setConfirmationModal({
        isOpen: true,
        title: "Unsaved Changes",
        message: "You have unsaved changes. Are you sure you want to leave?",
        confirmLabel: "Leave",
        cancelLabel: "Stay",
        confirmType: "info",
        action: "back",
      });
      setNavigationTarget(`/interview-pipeline/${jobId}`);
    } else {
      router.push(`/interview-pipeline/${jobId}`);
    }
  };

  const handleBackConfirmed = () => {
    router.push(navigationTarget);
    closeConfirmationModal();
  };

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmAction = () => {
    switch (confirmationModal.action) {
      case "reset":
        handleResetConfirmed();
        break;
      case "back":
        handleBackConfirmed();
        break;
      default:
        closeConfirmationModal();
    }
  };

  const isValidConfiguration = () => {
    return (
      validationErrors.length === 0 &&
      configuration &&
      Object.keys(configuration).length > 0
    );
  };

  const getInterviewTypeIcon = (type: keyof InterviewType) => {
    const iconMap = {
      phone_screening: Phone,
      video_interview: Video,
      technical_assessment: Code,
      coding_challenge: Code,

      panel_interview: Users,
      final_interview: Crown,
      culture_fit: Heart,
    };
    return iconMap[type] || Calendar;
  };

  const getInterviewTypeTitle = (type: keyof InterviewType) => {
    const titleMap = {
      phone_screening: "Phone Screening",
      video_interview: "Video Interview",
      technical_assessment: "Technical Assessment",
      coding_challenge: "Coding Challenge",

      panel_interview: "Panel Interview",
      final_interview: "Final Interview",
      culture_fit: "Culture Fit",
    };
    return titleMap[type] || "Interview Round";
  };

  const renderRoundConfiguration = () => {
    if (!round) return null;

    const commonProps = {
      jobId: jobId as string,
      roundId: roundId as string,
      round,
      configuration,
      onConfigurationChange: handleConfigurationChange,
    };

    switch (round.type) {
      case "phone_screening":
        return <PhoneScreeningConfig {...commonProps} />;
      case "video_interview":
        return <VideoInterviewConfig {...commonProps} />;
      case "technical_assessment":
        return <TechnicalAssessmentConfig {...commonProps} />;
      case "coding_challenge":
        return <CodingChallengeConfig {...commonProps} />;

      case "panel_interview":
        return <PanelInterviewConfig {...commonProps} />;
      case "final_interview":
        return <FinalInterviewConfig {...commonProps} />;
      case "culture_fit":
        return <CultureFitConfig {...commonProps} />;
      default:
        return (
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Configuration not available for this round type.
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!job || !round) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Round Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested interview round could not be found.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Banner - Positioned at the right side */}
      {confirmationModal.isOpen && (
        <div className="fixed top-[148px] right-67 z-50">
          <div className="w-96 shadow-lg">
            <ConfirmationModal
              isOpen={true}
              title={confirmationModal.title}
              message={confirmationModal.message}
              confirmLabel={confirmationModal.confirmLabel}
              cancelLabel={confirmationModal.cancelLabel}
              confirmType={confirmationModal.confirmType}
              onConfirm={handleConfirmAction}
              onCancel={closeConfirmationModal}
            />
          </div>
        </div>
      )}

      <ConfigurationLayout
        title={getInterviewTypeTitle(round?.type)}
        subtitle={`Configure the ${getInterviewTypeTitle(
          round?.type
        ).toLowerCase()} for ${job?.title}`}
        roundType={round?.type}
        jobTitle={job?.title}
        duration={round?.duration}
        hasUnsavedChanges={hasUnsavedChanges}
        isValid={isValidConfiguration()}
        saving={saving}
        onSave={handleSave}
        onReset={handleReset}
        onBack={handleBack}
        status={status}
        actions={null}
      >
        <div className="space-y-6">
          {/* Validation Errors - Only show when no confirmation modal is active */}
          {validationErrors.length > 0 && !confirmationModal.isOpen && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <h4 className="text-sm font-medium text-red-800">
                  Configuration Issues
                </h4>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {status === "configured" && !hasUnsavedChanges && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-sm text-green-800">
                  Configuration is saved and up to date
                </p>
              </div>
            </div>
          )}

          {/* Round Configuration */}
          {renderRoundConfiguration()}
        </div>
      </ConfigurationLayout>
    </>
  );
}

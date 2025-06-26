import {
  Code,
  Crown,
  FileText,
  Heart,
  LucideIcon,
  MessageSquare,
  Phone,
  Users,
  Video,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// Import the InterviewType from your existing interfaces
export type InterviewType =
  | "phone_screening"
  | "video_interview"
  | "technical_assessment"
  | "coding_challenge"
  | "behavioral_interview"
  | "panel_interview"
  | "final_interview"
  | "culture_fit";

// Additional stage for initial application
export type ApplicationStage = "applied";

// Combined stage type
export type CandidateStageType = ApplicationStage | InterviewType;

// Interview stage configuration
export interface StageConfig {
  id: string;
  label: string;
  color: string;
  icon: string;
  order: number;
  description: string;
}

// Candidate interface for type safety
export interface Candidate {
  status?: string;
  stage?: string;
  jobId?: string;
  [key: string]: any;
}

// Active filters interface
export interface ActiveFilters {
  status: string[];
  stage: string[];
  position: string[];
}

// Filter counts interface
export interface FilterCounts {
  status: Record<string, number>;
  stage: Record<string, number>;
  position: Record<string, number>;
}

// Dynamic stage configuration generator
export class InterviewStageConfig {
  // Base configuration for the "Applied" stage
  private static readonly APPLIED_STAGE_CONFIG: StageConfig = {
    id: "applied",
    label: "Applied",
    color: "gray",
    icon: "FileText",
    order: 0,
    description: "Initial application submitted, waiting for first round",
  };

  // Interview type to display configuration mapping
  private static readonly INTERVIEW_TYPE_CONFIGS: Record<
    InterviewType,
    Omit<StageConfig, "id" | "order">
  > = {
    phone_screening: {
      label: "Phone Screening",
      color: "green",
      icon: "Phone",
      description: "Initial phone conversation with recruiter",
    },
    video_interview: {
      label: "Video Interview",
      color: "blue",
      icon: "Video",
      description: "Video interview with hiring manager",
    },
    technical_assessment: {
      label: "Technical Assessment",
      color: "purple",
      icon: "Code",
      description: "Technical skills evaluation",
    },
    coding_challenge: {
      label: "Coding Challenge",
      color: "orange",
      icon: "Code",
      description: "Take-home or live coding exercise",
    },
    behavioral_interview: {
      label: "Behavioral Interview",
      color: "pink",
      icon: "MessageSquare",
      description: "Behavioral and cultural fit assessment",
    },
    panel_interview: {
      label: "Panel Interview",
      color: "indigo",
      icon: "Users",
      description: "Interview with multiple team members",
    },
    final_interview: {
      label: "Final Interview",
      color: "yellow",
      icon: "Crown",
      description: "Final round with senior leadership",
    },
    culture_fit: {
      label: "Culture Fit",
      color: "red",
      icon: "Heart",
      description: "Final culture and team fit evaluation",
    },
  };

  // Get all available stage configurations
  static getAllStageConfigs(): StageConfig[] {
    const configs: StageConfig[] = [this.APPLIED_STAGE_CONFIG];

    // Dynamically add all interview types with incremental order
    Object.entries(this.INTERVIEW_TYPE_CONFIGS).forEach(
      ([key, config], index) => {
        configs.push({
          id: key,
          label: config.label,
          color: config.color,
          icon: config.icon,
          order: index + 1, // Start from 1 since applied is 0
          description: config.description,
        });
      }
    );

    return configs;
  }

  // Get stage config by ID
  static getStageConfig(stageId: string): StageConfig | null {
    if (stageId === "applied") {
      return this.APPLIED_STAGE_CONFIG;
    }

    const interviewConfig =
      this.INTERVIEW_TYPE_CONFIGS[stageId as InterviewType];
    if (interviewConfig) {
      const interviewTypes = Object.keys(this.INTERVIEW_TYPE_CONFIGS);
      return {
        id: stageId,
        ...interviewConfig,
        order: interviewTypes.indexOf(stageId) + 1,
      };
    }

    return null;
  }

  // Get icon component for stage
  static getStageIcon(stageId: string): React.ReactNode {
    const iconMap: Record<string, LucideIcon> = {
      applied: FileText,
      phone_screening: Phone,
      video_interview: Video,
      technical_assessment: Code,
      coding_challenge: Code,
      behavioral_interview: MessageSquare,
      panel_interview: Users,
      final_interview: Crown,
      culture_fit: Heart,
    };

    const IconComponent = iconMap[stageId] || FileText;
    const config = this.getStageConfig(stageId);
    const color = config?.color || "gray";

    // Use data attributes or CSS variables instead of dynamic Tailwind classes
    return React.createElement(IconComponent, {
      className: `h-3 w-3`,
      style: { color: `var(--color-${color}-500)` },
    });
  }

  // Map backend stage value to filter ID
  static mapStageToFilterId(stage: string): string {
    // Normalize the stage string
    const normalizedStage = stage.toLowerCase().replace(/\s+/g, "_");

    // Check if it's a valid stage
    if (
      normalizedStage === "applied" ||
      this.INTERVIEW_TYPE_CONFIGS[normalizedStage as InterviewType]
    ) {
      return normalizedStage;
    }

    // Legacy mappings for backward compatibility
    const legacyMap: Record<string, string> = {
      initial_review: "applied",
      interview: "video_interview",
      offer: "final_interview",
      phone_interview: "phone_screening",
      tech_assessment: "technical_assessment",
      coding_test: "coding_challenge",
      behavioral: "behavioral_interview",
      panel: "panel_interview",
      final: "final_interview",
      culture: "culture_fit",
      // Handle display format to backend format
      "phone screening": "phone_screening",
      "video interview": "video_interview",
      "technical assessment": "technical_assessment",
      "coding challenge": "coding_challenge",
      "behavioral interview": "behavioral_interview",
      "panel interview": "panel_interview",
      "final interview": "final_interview",
      "culture fit": "culture_fit",
    };

    return legacyMap[normalizedStage] || "applied";
  }

  // Map filter ID back to display format
  static mapFilterIdToDisplay(filterId: string): string {
    const config = this.getStageConfig(filterId);
    return config ? config.label : filterId.replace(/_/g, " ");
  }

  // Generate default active stage filters (useful for initial state)
  static getDefaultActiveStageFilters(): string[] {
    return this.getAllStageConfigs().map((config) => config.id);
  }

  // Validate if a stage ID is valid
  static isValidStage(stageId: string): boolean {
    return this.getStageConfig(stageId) !== null;
  }

  // Get stages in order
  static getStagesInOrder(): StageConfig[] {
    return this.getAllStageConfigs().sort((a, b) => a.order - b.order);
  }
}

// Filter utility functions
export class DynamicCandidateFilterUtils {
  // Map backend status to filter ID
  static mapStatusToFilterId(status: string): string {
    const statusMap: Record<string, string> = {
      "In Progress": "in-progress",
      in_progress: "in-progress",
      "in-progress": "in-progress",
      Offered: "offered",
      offered: "offered",
      Hired: "hired",
      hired: "hired",
      Rejected: "rejected",
      rejected: "rejected",
      Disqualified: "rejected", // Legacy mapping
      disqualified: "rejected",
    };

    return statusMap[status] || "in-progress";
  }

  // Calculate filter counts with dynamic stages
  static calculateFilterCounts(
    candidates: Candidate[],
    activeFilters: ActiveFilters
  ): FilterCounts {
    const stageConfigs = InterviewStageConfig.getAllStageConfigs();

    const counts: FilterCounts = {
      status: {
        "in-progress": 0,
        offered: 0,
        hired: 0,
        rejected: 0,
      },
      stage: {},
      position: {},
    };

    // Initialize stage counts dynamically
    stageConfigs.forEach((config) => {
      counts.stage[config.id] = 0;
    });

    // Get candidates filtered by status and stage (but not position for position counts)
    const getFilteredCandidatesForCounts = (): Candidate[] => {
      let filtered = candidates;

      // Apply status filter if active
      if (activeFilters.status.length > 0) {
        filtered = filtered.filter((candidate) => {
          const statusFilterId = this.mapStatusToFilterId(
            candidate.status || ""
          );
          return activeFilters.status.includes(statusFilterId);
        });
      }

      // Apply stage filter if active
      if (activeFilters.stage.length > 0) {
        filtered = filtered.filter((candidate) => {
          const stageFilterId = InterviewStageConfig.mapStageToFilterId(
            candidate.stage || ""
          );
          return activeFilters.stage.includes(stageFilterId);
        });
      }

      return filtered;
    };

    const filteredCandidatesForCounts = getFilteredCandidatesForCounts();

    // Count all candidates for status and stage
    candidates.forEach((candidate) => {
      // Count by status
      const statusFilterId = this.mapStatusToFilterId(candidate.status || "");
      if (counts.status[statusFilterId] !== undefined) {
        counts.status[statusFilterId]++;
      }

      // Count by stage using dynamic mapping
      const stageFilterId = InterviewStageConfig.mapStageToFilterId(
        candidate.stage || ""
      );
      if (counts.stage[stageFilterId] !== undefined) {
        counts.stage[stageFilterId]++;
      }
    });

    // Count for position filters (using filtered candidates that respect status/stage filters)
    filteredCandidatesForCounts.forEach((candidate) => {
      if (candidate.jobId) {
        counts.position[candidate.jobId] =
          (counts.position[candidate.jobId] || 0) + 1;
      }
    });

    return counts;
  }

  // Apply filters with dynamic stages
  static applyFilters(
    candidates: Candidate[],
    activeFilters: ActiveFilters
  ): Candidate[] {
    let filtered = candidates;

    // Apply position filter
    if (activeFilters.position.length > 0) {
      filtered = filtered.filter((candidate) => {
        return (
          candidate.jobId && activeFilters.position.includes(candidate.jobId)
        );
      });
    }

    // Apply status filter
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter((candidate) => {
        const statusFilterId = this.mapStatusToFilterId(candidate.status || "");
        return activeFilters.status.includes(statusFilterId);
      });
    }

    // Apply stage filter using dynamic mapping
    if (activeFilters.stage.length > 0) {
      filtered = filtered.filter((candidate) => {
        const stageFilterId = InterviewStageConfig.mapStageToFilterId(
          candidate.stage || ""
        );
        return activeFilters.stage.includes(stageFilterId);
      });
    }

    return filtered;
  }
}

// Hook return type interface
export interface UseDynamicStageConfigsReturn {
  stageConfigs: StageConfig[];
  loading: boolean;
}

// React hook for using dynamic stage configurations
export function useDynamicStageConfigs(): UseDynamicStageConfigsReturn {
  const [stageConfigs, setStageConfigs] = useState<StageConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Since we're using static configurations now, this loads immediately
    // In the future, you could fetch from your backend here
    const loadStageConfigs = () => {
      try {
        setLoading(true);
        const configs = InterviewStageConfig.getAllStageConfigs();
        setStageConfigs(configs);
      } catch (error) {
        console.error("Failed to load stage configs:", error);
        // Set default configs on error
        setStageConfigs(InterviewStageConfig.getAllStageConfigs());
      } finally {
        setLoading(false);
      }
    };

    loadStageConfigs();
  }, []);

  return {
    stageConfigs,
    loading,
  };
}

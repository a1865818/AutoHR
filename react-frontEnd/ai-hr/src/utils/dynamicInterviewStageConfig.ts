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
  Award,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { CandidateStage } from "@/interfaces";
import { InterviewType } from "@/interfaces/interview";

// Legacy types for backward compatibility
export type ApplicationStage = "applied";
export type CandidateStageType = CandidateStage;

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
  // Complete stage configuration mapping
  private static readonly STAGE_CONFIGS: Record<CandidateStage, StageConfig> = {
    "Applied": {
      id: "applied",
      label: "Applied",
      color: "gray",
      icon: "FileText",
      order: 0,
      description: "Application submitted, waiting for review",
    },
    "Phone Screening": {
      id: "phone_screening",
      label: "Phone Screening",
      color: "green",
      icon: "Phone",
      order: 1,
      description: "Initial phone screening interview",
    },
    "Video Interview": {
      id: "video_interview",
      label: "Video Interview",
      color: "blue",
      icon: "Video",
      order: 2,
      description: "Video interview with hiring team",
    },
    "Technical Assessment": {
      id: "technical_assessment",
      label: "Technical Assessment",
      color: "purple",
      icon: "Code",
      order: 3,
      description: "Technical skills evaluation",
    },
    "Coding Challenge": {
      id: "coding_challenge",
      label: "Coding Challenge",
      color: "orange",
      icon: "Code",
      order: 4,
      description: "Coding exercise or challenge",
    },
    "Behavioral Interview": {
      id: "behavioral_interview",
      label: "Behavioral Interview",
      color: "pink",
      icon: "MessageSquare",
      order: 5,
      description: "Behavioral and cultural assessment",
    },
    "Panel Interview": {
      id: "panel_interview",
      label: "Panel Interview",
      color: "indigo",
      icon: "Users",
      order: 6,
      description: "Interview with multiple team members",
    },
    "Final Interview": {
      id: "final_interview",
      label: "Final Interview",
      color: "yellow",
      icon: "Crown",
      order: 7,
      description: "Final round with leadership",
    },
    "Culture Fit": {
      id: "culture_fit",
      label: "Culture Fit",
      color: "red",
      icon: "Heart",
      order: 8,
      description: "Cultural fit evaluation",
    },
    "Offer": {
      id: "offer",
      label: "Offer",
      color: "yellow",
      icon: "Award",
      order: 9,
      description: "Offer extended or candidate hired",
    },
  };

  // Get all available stage configurations
  static getAllStageConfigs(): StageConfig[] {
    return Object.values(this.STAGE_CONFIGS).sort((a, b) => a.order - b.order);
  }

  // Get stage config by stage name
  static getStageConfig(stage: CandidateStage): StageConfig | null {
    return this.STAGE_CONFIGS[stage] || null;
  }

  // Get stage config by ID (for backward compatibility)
  static getStageConfigById(stageId: string): StageConfig | null {
    const stage = this.filterIdToStage(stageId);
    return stage ? this.STAGE_CONFIGS[stage] : null;
  }

  // Get icon component for stage
  static getStageIcon(stage: CandidateStage): React.ReactNode {
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
      offer: Award,
    };

    const stageId = this.stageToFilterId(stage);
    const IconComponent = iconMap[stageId] || FileText;
    const config = this.getStageConfig(stage);
    const color = config?.color || "gray";

    // Use data attributes or CSS variables instead of dynamic Tailwind classes
    return React.createElement(IconComponent, {
      className: `h-3 w-3`,
      style: { color: `var(--color-${color}-500)` },
    });
  }

  // Convert stage to filter ID
  static stageToFilterId(stage: CandidateStage): string {
    const filterId = stage.toLowerCase().replace(/\s+/g, "_");
    console.log(`🔍 DEBUG: stageToFilterId: "${stage}" -> "${filterId}"`);
    return filterId;
  }

  // Convert filter ID to stage (for backward compatibility)
  static filterIdToStage(filterId: string): CandidateStage | null {
    const mapping: Record<string, CandidateStage> = {
      "applied": "Applied",
      "phone_screening": "Phone Screening",
      "video_interview": "Video Interview",
      "technical_assessment": "Technical Assessment",
      "coding_challenge": "Coding Challenge",
      "behavioral_interview": "Behavioral Interview",
      "panel_interview": "Panel Interview",
      "final_interview": "Final Interview",
      "culture_fit": "Culture Fit",
      "offer": "Offer"
    };
    
    const result = mapping[filterId] || null;
    if (filterId && !result) {
      console.log(`⚠️ WARNING: filterIdToStage: No mapping found for "${filterId}"`);
    }
    return result;
  }

  // Legacy method for backward compatibility
  static mapStageToFilterId(stage: string): string {
    // If it's already a valid CandidateStage, convert it
    if (Object.keys(this.STAGE_CONFIGS).includes(stage as CandidateStage)) {
      const filterId = this.stageToFilterId(stage as CandidateStage);
      console.log(`🔍 DEBUG: mapStageToFilterId (direct): "${stage}" -> "${filterId}"`);
      return filterId;
    }

    // Legacy mappings for backward compatibility
    const legacyMap: Record<string, string> = {
      initial_review: "applied",
      interview: "video_interview",
      offer: "offer",
      phone_interview: "phone_screening",
      tech_assessment: "technical_assessment",
      coding_test: "coding_challenge",
      behavioral: "behavioral_interview",
      panel: "panel_interview",
      final: "final_interview",
      culture: "culture_fit",
    };

    const normalizedStage = stage.toLowerCase().replace(/\s+/g, "_");
    const result = legacyMap[normalizedStage] || "applied";
    
    console.log(`🔍 DEBUG: mapStageToFilterId (legacy): "${stage}" -> "${normalizedStage}" -> "${result}"`);
    
    if (!legacyMap[normalizedStage]) {
      console.log(`⚠️ WARNING: mapStageToFilterId: No legacy mapping found for "${normalizedStage}", defaulting to "applied"`);
    }
    
    return result;
  }

  // Map filter ID back to display format
  static mapFilterIdToDisplay(filterId: string): string {
    const stage = this.filterIdToStage(filterId);
    return stage || filterId.replace(/_/g, " ");
  }

  // Generate default active stage filters (useful for initial state)
  static getDefaultActiveStageFilters(): string[] {
    return this.getAllStageConfigs().map((config) => config.id);
  }

  // Validate if a stage ID is valid
  static isValidStage(stageId: string): boolean {
    const stage = this.filterIdToStage(stageId);
    return stage !== null && this.getStageConfig(stage) !== null;
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
    console.log("🔍 calculateFilterCounts called with", candidates.length, "candidates");
    
    const stageConfigs = InterviewStageConfig.getAllStageConfigs();
    console.log("🔍 Available stage configs:", stageConfigs.map(c => ({ id: c.id, label: c.label })));

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
            if (!candidate.stage) return false;
            const stageFilterId = InterviewStageConfig.stageToFilterId(
              candidate.stage as CandidateStage
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
      } else {
        console.log("⚠️ Status not found in counts:", statusFilterId, "for candidate:", candidate.name);
      }

      // Count by stage using dynamic mapping
      if (candidate.stage) {
        const stageFilterId = InterviewStageConfig.stageToFilterId(
          candidate.stage as CandidateStage
        );
        if (counts.stage[stageFilterId] !== undefined) {
          counts.stage[stageFilterId]++;
        } else {
          console.log("⚠️ Stage not found in counts:", stageFilterId, "for candidate:", candidate.name, "stage:", candidate.stage);
        }
      } else {
        console.log("⚠️ No stage for candidate:", candidate.name);
      }
    });

    // Count for position filters (using filtered candidates that respect status/stage filters)
    filteredCandidatesForCounts.forEach((candidate) => {
      if (candidate.jobId) {
        counts.position[candidate.jobId] =
          (counts.position[candidate.jobId] || 0) + 1;
      }
    });

    console.log("🔍 Final filter counts:", counts);
    return counts;
  }

  // Apply filters with dynamic stages
  static applyFilters(
    candidates: Candidate[],
    activeFilters: ActiveFilters
  ): Candidate[] {
    console.log("🔍 DEBUG: DynamicCandidateFilterUtils.applyFilters called with:", {
      candidatesCount: candidates.length,
      activeFilters
    });
    
    // If all filters are empty, return no candidates
    if (
      activeFilters.status.length === 0 &&
      activeFilters.stage.length === 0 &&
      activeFilters.position.length === 0
    ) {
      console.log("🔍 DEBUG: No active filters, returning empty array");
      return [];
    }
    let filtered = candidates;

    // Apply position filter
    if (activeFilters.position.length > 0) {
      filtered = filtered.filter((candidate) => {
        return (
          candidate.jobId && activeFilters.position.includes(candidate.jobId)
        );
      });
      console.log("🔍 DEBUG: After position filtering:", filtered.length);
    }

    // Apply status filter
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter((candidate) => {
        const statusFilterId = this.mapStatusToFilterId(candidate.status || "");
        return activeFilters.status.includes(statusFilterId);
      });
      console.log("🔍 DEBUG: After status filtering:", filtered.length);
    }

    // Apply stage filter using dynamic mapping
    if (activeFilters.stage.length > 0) {
      console.log("🔍 DEBUG: Stage filtering - active filters:", activeFilters.stage);
      
      // Log a sample of candidates before filtering
      const sampleCandidates = candidates.slice(0, 3);
      console.log("🔍 DEBUG: Sample candidates before stage filtering:", 
        sampleCandidates.map(c => ({
          name: c.name || 'Unknown',
          stage: c.stage || 'No stage',
          stageFilterId: InterviewStageConfig.stageToFilterId(c.stage as CandidateStage)
        }))
      );
      
      filtered = filtered.filter((candidate) => {
        const stageFilterId = InterviewStageConfig.stageToFilterId(
          candidate.stage as CandidateStage
        );
        
        const isIncluded = activeFilters.stage.includes(stageFilterId);
        
        // Log detailed info for candidates that don't match any filter
        if (!isIncluded && candidate.name) {
          console.log(`🔍 DEBUG: Candidate excluded by stage filter: ${candidate.name}, stage: ${candidate.stage}, stageFilterId: ${stageFilterId}`);
        }
        
        return isIncluded;
      });
      
      console.log("🔍 DEBUG: After stage filtering:", filtered.length);
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

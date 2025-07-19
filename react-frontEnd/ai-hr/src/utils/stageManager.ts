import { CandidateStage } from '@/interfaces';
import { InterviewTemplate, INTERVIEW_TYPE_TO_STAGE_MAP } from '@/interfaces/interview';

export class StageManager {
  /**
   * Determines the appropriate stage based on status and round ID
   */
  static getStageFromStatusAndRound(
    status: "In Progress" | "Hired" | "Rejected" | "Offered",
    roundId: string,
    interviewTemplate?: InterviewTemplate
  ): CandidateStage {
    console.log(`🔍 StageManager.getStageFromStatusAndRound:`, {
      status,
      roundId,
      hasTemplate: !!interviewTemplate,
      templateRoundsCount: interviewTemplate?.rounds?.length || 0
    });

    // If status is Offered or Hired, stage should be "Offer"
    if (status === "Offered" || status === "Hired") {
      console.log(`✅ Status-based stage: Offer (status: ${status})`);
      return "Offer";
    }

    // If status is Rejected, keep current stage (we'll determine from roundId)
    // If status is "In Progress", determine stage from round

    // Handle special cases
    if (roundId === "new" || roundId === "applied") {
      console.log(`✅ Special case stage: Applied (roundId: ${roundId})`);
      return "Applied";
    }
    if (roundId === "hired" || roundId === "offered") {
      console.log(`✅ Special case stage: Offer (roundId: ${roundId})`);
      return "Offer";
    }
    if (roundId === "rejected") {
      // For rejected, we need to determine what stage they were in
      // This might need additional logic based on your requirements
      console.log(`✅ Special case stage: Applied (rejected, roundId: ${roundId})`);
      return "Applied"; // Default fallback
    }

    // Find the round in the template
    if (interviewTemplate?.rounds) {
      console.log(`🔍 Searching for round ${roundId} in template rounds:`, 
        interviewTemplate.rounds.map(r => ({ id: r.id, type: r.type, name: r.name }))
      );
      
      const round = interviewTemplate.rounds.find(r => r.id === roundId);
      if (round) {
        const mappedStage = INTERVIEW_TYPE_TO_STAGE_MAP[round.type];
        console.log(`✅ Found round ${roundId} with type ${round.type}, mapped to stage: ${mappedStage}`);
        return mappedStage;
      } else {
        console.warn(`⚠️ Round ${roundId} not found in template. Available rounds:`, 
          interviewTemplate.rounds.map(r => r.id)
        );
      }
    } else {
      console.warn(`⚠️ No interview template or rounds available`);
    }

    console.log(`❌ Falling back to default stage: Applied`);
    return "Applied"; // Default fallback
  }

  /**
   * Gets the stage order for progression validation
   */
  static getStageOrder(): CandidateStage[] {
    return [
      "Applied",
      "Phone Screening", 
      "Video Interview",
      "Technical Assessment",
      "Coding Challenge",
      "Final Interview",
      "Culture Fit",
      "Offer"
    ];
  }

  /**
   * Validates if a stage transition is allowed
   */
  static isValidStageTransition(fromStage: CandidateStage, toStage: CandidateStage): boolean {
    const stageOrder = this.getStageOrder();
    const fromIndex = stageOrder.indexOf(fromStage);
    const toIndex = stageOrder.indexOf(toStage);
    
    // Allow moving forward, backward, or staying same
    return fromIndex !== -1 && toIndex !== -1;
  }

  /**
   * Determines the stage when moving between columns in the pipeline
   */
  static getStageForColumnMove(
    toColumnId: string,
    status: "In Progress" | "Hired" | "Rejected" | "Offered",
    interviewTemplate?: InterviewTemplate
  ): CandidateStage {
    console.log(`🎯 StageManager.getStageForColumnMove:`, {
      toColumnId,
      status,
      hasTemplate: !!interviewTemplate,
      templateId: interviewTemplate?.id
    });

    // Special column handling
    switch (toColumnId) {
      case "new":
      case "applied":
        console.log(`✅ Special column: Applied (${toColumnId})`);
        return "Applied";
      case "hired":
      case "offered":
        console.log(`✅ Special column: Offer (${toColumnId})`);
        return "Offer";
      case "rejected":
        // For rejected, we might want to keep the stage they were in
        // But for simplicity, let's default to Applied
        console.log(`✅ Special column: Applied (rejected, ${toColumnId})`);
        return "Applied";
      default:
        // For interview rounds, determine from the round
        console.log(`🔄 Determining stage for interview round: ${toColumnId}`);
        const resultStage = this.getStageFromStatusAndRound(status, toColumnId, interviewTemplate);
        console.log(`✅ Final stage determined: ${resultStage}`);
        return resultStage;
    }
  }

  /**
   * Gets a human-readable description of the stage
   */
  static getStageDescription(stage: CandidateStage): string {
    const descriptions: Record<CandidateStage, string> = {
      "Applied": "Application submitted, waiting for review",
      "Phone Screening": "Initial phone screening interview",
      "Video Interview": "Video interview with hiring team",
      "Technical Assessment": "Technical skills evaluation",
      "Coding Challenge": "Coding exercise or challenge",
      "Final Interview": "Final round with leadership",
      "Culture Fit": "Cultural fit evaluation",
      "Offer": "Offer extended or candidate hired"
    };
    
    return descriptions[stage] || "Unknown stage";
  }

  /**
   * Converts stage to a filter-friendly ID
   */
  static stageToFilterId(stage: CandidateStage): string {
    return stage.toLowerCase().replace(/\s+/g, "_");
  }

  /**
   * Converts filter ID back to stage
   */
  static filterIdToStage(filterId: string): CandidateStage | null {
    const mapping: Record<string, CandidateStage> = {
      "applied": "Applied",
      "phone_screening": "Phone Screening",
      "video_interview": "Video Interview",
      "technical_assessment": "Technical Assessment",
      "coding_challenge": "Coding Challenge",
      "final_interview": "Final Interview",
      "culture_fit": "Culture Fit",
      "offer": "Offer"
    };
    
    return mapping[filterId] || null;
  }
} 
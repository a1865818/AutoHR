"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Building,
  GitBranch,
  Plus,
  Search,
  Phone,
  Video,
  Code,
  Crown,
  Heart,
  User,
  Loader2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Mail,
  Send,
} from "lucide-react";
import { VideoInterviewSchedulingModal } from "@/components/interview_pipeline/VideoInterviewSchedulingModal";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { jobService } from "@/services/jobService";
import { interviewService } from "@/services/interviewService";
import { candidateService } from "@/services/candidateService";
import { rejectedCandidatesService } from "@/services/rejectedCandidatesService";
import { assessmentService } from "@/services/assessmentService";
import { roundConfigurationAPI } from "@/services/roundConfigurationApi";
import { ApiJob, ApiCompany } from "@/interfaces/api";
import {
  InterviewTemplate,
  InterviewRound,
  InterviewType,
  INTERVIEW_TYPE_TO_STAGE_MAP,
} from "@/interfaces/interview";
import { Candidate, CandidateStage } from "@/interfaces";
import { StageManager } from "@/utils/stageManager";
import {
  DragDropCandidateCard,
  DroppableColumn,
  BulkActions,
} from "@/components/interview_pipeline/DragDropPipeline";

import { BulkNotificationModal } from "@/components/interview_pipeline/BulkNotificationModal";

interface JobWithTemplate extends Omit<ApiJob, "interviewTemplate"> {
  interviewTemplate?: InterviewTemplate;
}

interface PipelineCandidate extends Candidate {
  currentRoundId?: string;
  roundProgress?: number;
  hasSubmittedAssessment?: boolean;
  isAssessmentGraded?: boolean;
}

interface PipelineColumn {
  id: string;
  title: string;
  type: "new" | "round" | "hired" | "offered" | "rejected";
  round?: InterviewRound;
  candidates: PipelineCandidate[];
  color: string;
}

export default function JobPipelinePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Early validation - redirect if jobId is invalid
  useEffect(() => {
    if (!jobId || jobId === "undefined") {
      console.error("❌ Invalid jobId detected:", jobId);
      router.push("/interview-pipeline");
      return;
    }
  }, [jobId, router]);

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "N/A";

    try {
      let dateStr = dateValue;

      // Handle .NET DateTime objects
      if (typeof dateValue === "object" && dateValue !== null) {
        dateStr = dateValue.value || dateValue.Value || dateValue.toString();
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const [job, setJob] = useState<JobWithTemplate | null>(null);
  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [dragEnabled, setDragEnabled] = useState(true);

  // Template management states
  const [availableTemplates, setAvailableTemplates] = useState<
    InterviewTemplate[]
  >([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isAssigningTemplate, setIsAssigningTemplate] = useState(false);

  // Video Interview Scheduling Modal States
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [selectedRound, setSelectedRound] = useState<InterviewRound | null>(
    null
  );

  const [noApplicationsFound, setNoApplicationsFound] = useState(false);

  // Pending notification state - track candidates moved but not yet emailed
  const [pendingNotifications, setPendingNotifications] = useState<
    Array<{
      candidateId: string;
      candidateName: string;
      fromColumn: string;
      toColumn: string;
      movedAt: Date;
      emailSent: boolean;
    }>
  >([]);

  // Bulk notification modal state - track which round modal is open
  const [activeBulkNotificationRound, setActiveBulkNotificationRound] =
    useState<string | null>(null);

  // Backward movement warning modal state
  const [showBackwardWarningModal, setShowBackwardWarningModal] =
    useState(false);
  const [pendingBackwardMove, setPendingBackwardMove] = useState<{
    candidateId: string;
    candidate: PipelineCandidate;
    fromColumnId: string;
    toColumnId: string;
  } | null>(null);

  // Load job, template, and candidates
  useEffect(() => {
    if (jobId) {
      loadJobPipeline();
    }
  }, [jobId]);

  // Update columns when candidates change
  useEffect(() => {
    if (job && candidates.length >= 0) {
      console.log("🔄 Organizing columns with job:", job);
      console.log("🔄 Job has interview template:", !!job.interviewTemplate);
      organizeIntoColumns();
    }
  }, [job, candidates]);

  const loadJobPipeline = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNoApplicationsFound(false);

      // Load job details
      const jobData = await jobService.getJobById(jobId);
      console.log("🔍 Raw job data from backend:", jobData);
      console.log(
        "🔍 Job has interviewTemplateId:",
        jobData.interviewTemplateId
      );
      console.log(
        "🔍 Job has InterviewTemplate:",
        (jobData as any).InterviewTemplate
      );

      const jobWithTemplate: JobWithTemplate = {
        ...jobData,
        interviewTemplate: undefined,
      };

      // Check if interview template is already included in the response
      if ((jobData as any).InterviewTemplate) {
        console.log("✅ Interview template found in job data");
        jobWithTemplate.interviewTemplate = (jobData as any).InterviewTemplate;
      }
      // Otherwise, load interview template if job has one
      else if (jobData.interviewTemplateId) {
        try {
          console.log("🔄 Loading interview template separately...");
          const template = await interviewService.getInterviewTemplate(
            jobData.interviewTemplateId
          );
          const rounds = await interviewService.getInterviewRounds(
            jobData.interviewTemplateId
          );
          jobWithTemplate.interviewTemplate = {
            ...template,
            rounds: rounds,
          };
        } catch (error) {
          console.warn(`Failed to load template for job ${jobId}:`, error);
        }
      }

      setJob(jobWithTemplate);

      // Load round configurations for meeting data
      if (jobWithTemplate.interviewTemplate?.rounds) {
        try {
          console.log("🔄 Loading round configurations...");
          const roundConfigurations = await Promise.all(
            jobWithTemplate.interviewTemplate.rounds.map(async (round) => {
              try {
                const config = await roundConfigurationAPI.getConfiguration(
                  jobId,
                  round.id
                );
                return {
                  roundId: round.id,
                  config: config.success ? config.data : null,
                };
              } catch (error) {
                console.warn(
                  `Failed to load configuration for round ${round.id}:`,
                  error
                );
                return { roundId: round.id, config: null };
              }
            })
          );

          // Update rounds with configuration data
          jobWithTemplate.interviewTemplate.rounds =
            jobWithTemplate.interviewTemplate.rounds.map((round) => {
              const roundConfig = roundConfigurations.find(
                (rc) => rc.roundId === round.id
              );
              if (roundConfig?.config) {
                return {
                  ...round,
                  meetingScheduled: roundConfig.config.meetingScheduled,
                  meetingData: roundConfig.config.meetingData,
                  configurationData: (roundConfig.config as any)
                    .configurationData,
                };
              }
              return round;
            });

          setJob(jobWithTemplate);
          console.log("✅ Round configurations loaded with meeting data");
        } catch (error) {
          console.warn("Failed to load round configurations:", error);
        }
      }

      // Load company data
      if (jobData.companyId) {
        try {
          console.log("🔄 Loading company data...");
          const companyData = await jobService.getCompanyById(
            jobData.companyId
          );
          console.log("✅ Company data loaded:", companyData);
          setCompany(companyData);
        } catch (error) {
          console.warn(`Failed to load company for job ${jobId}:`, error);
        }
      }

      // Load candidates for this job
      const candidatesData = await candidateService.getCandidatesForJob(jobId);
      let applicationDetails = [];
      try {
        applicationDetails = await candidateService.getApplicationDetailByJob(
          jobId
        );
      } catch (error) {
        // Gracefully handle the 'No applications found' error
        if (
          error instanceof Error &&
          error.message.includes("No applications found for job ID")
        ) {
          applicationDetails = [];
          setNoApplicationsFound(true);
        } else {
          throw error;
        }
      }

      // status and stage use applicationDetails data
      console.log("🔍 Candidates data:", candidatesData);
      console.log("🔍 Application details:", applicationDetails);

      for (const candidate of candidatesData) {
        const matchingApplicationDetail = applicationDetails.find(
          (applicationDetail: any) =>
            applicationDetail.id === candidate.applicationId
        );
        candidate.stage = matchingApplicationDetail?.stage || "Applied";
        candidate.status = matchingApplicationDetail?.status || "In Progress";
      }

      // Check submission status for candidates in technical rounds
      const pipelineCandidates: PipelineCandidate[] = await Promise.all(
        candidatesData.map(async (candidate) => {
          const currentRoundId = getCurrentRoundId(
            candidate,
            jobWithTemplate.interviewTemplate
          );

          console.log(`🔍 Current round determination for ${candidate.name}:`, {
            candidateStage: candidate.stage,
            candidateCurrentRoundId: candidate.currentRoundId,
            calculatedCurrentRoundId: currentRoundId,
            availableRounds: jobWithTemplate.interviewTemplate?.rounds?.map(
              (r) => ({ id: r.id, name: r.name, type: r.type })
            ),
          });

          // Check if this candidate is in a technical assessment round
          let hasSubmittedAssessment = false;
          let isAssessmentGraded = false;
          if (jobWithTemplate.interviewTemplate?.rounds && currentRoundId) {
            const currentRound = jobWithTemplate.interviewTemplate.rounds.find(
              (r) => r.id === currentRoundId
            );
            console.log(`🔍 Pipeline processing candidate ${candidate.name}:`, {
              applicationId: candidate.id,
              candidateUserId: candidate.candidateUserId,
              hasCandidateUserId: !!candidate.candidateUserId,
              candidateUserIdLength: candidate.candidateUserId?.length,
              currentRoundId,
              roundType: currentRound?.type,
              isInTechnicalRound:
                currentRound &&
                (currentRound.type === "technical_assessment" ||
                  currentRound.type === "coding_challenge"),
            });

            // Safety check for missing candidateUserId
            if (!candidate.candidateUserId) {
              console.warn(
                `⚠️ WARNING: Candidate ${candidate.name} (${candidate.id}) is missing candidateUserId!`
              );
            }

            if (
              currentRound &&
              (currentRound.type === "technical_assessment" ||
                currentRound.type === "coding_challenge")
            ) {
              try {
                console.log(`🔍 About to check submission for:`, {
                  candidateName: candidate.name,
                  applicationId: candidate.id,
                  candidateUserId: candidate.candidateUserId,
                  roundId: currentRoundId,
                  roundName: currentRound.name,
                  roundType: currentRound.type,
                });

                // Fetch submission once and derive flags from status
                const submission =
                  await assessmentService.getAssessmentSubmission(
                    candidate.candidateUserId,
                    currentRoundId
                  );
                hasSubmittedAssessment =
                  !!submission &&
                  (submission.status === "submitted" ||
                    submission.status === "graded");
                isAssessmentGraded =
                  !!submission && submission.status === "graded";
                console.log(
                  `📝 Candidate ${candidate.name} submission and grading:`,
                  {
                    submissionStatus: submission?.status,
                    hasSubmitted: hasSubmittedAssessment,
                    isGraded: isAssessmentGraded,
                    applicationId: candidate.id,
                    candidateUserId: candidate.candidateUserId,
                    roundId: currentRoundId,
                  }
                );
              } catch (error) {
                console.warn(
                  `Failed to check submission status for candidate ${candidate.id}:`,
                  error
                );
                hasSubmittedAssessment = false;
              }
            }
          }

          // Check meeting status for video interview rounds
          let meetingScheduled = false;
          let meetLink: string | undefined;
          let meetingData: any = undefined;

          if (jobWithTemplate.interviewTemplate?.rounds && currentRoundId) {
            const currentRound = jobWithTemplate.interviewTemplate.rounds.find(
              (r) => r.id === currentRoundId
            );

            if (currentRound && currentRound.type === "video_interview") {
              try {
                console.log(
                  `🔍 Checking meeting status for candidate ${candidate.name}:`,
                  {
                    applicationId: candidate.applicationId,
                    roundId: currentRoundId,
                    jobId: jobId,
                  }
                );

                const meetingStatus =
                  await roundConfigurationAPI.checkMeetingStatus(
                    jobId,
                    currentRoundId,
                    candidate.applicationId
                  );

                if (meetingStatus.success && meetingStatus.data.hasMeeting) {
                  meetingScheduled = true;
                  meetLink = meetingStatus.data.meetLink;

                  // Get full meeting details if meeting exists
                  try {
                    const meetingDetails =
                      await roundConfigurationAPI.getMeetingDetails(
                        jobId,
                        currentRoundId,
                        candidate.applicationId
                      );
                    if (meetingDetails.success) {
                      meetingData = meetingDetails.data;
                    }
                  } catch (error) {
                    console.warn(
                      `Failed to get meeting details for candidate ${candidate.name}:`,
                      error
                    );
                  }

                  console.log(
                    `✅ Meeting found for candidate ${candidate.name}:`,
                    {
                      meetLink,
                      meetingData,
                    }
                  );
                } else {
                  console.log(
                    `❌ No meeting found for candidate ${candidate.name}`
                  );
                }
              } catch (error) {
                console.warn(
                  `Failed to check meeting status for candidate ${candidate.name}:`,
                  error
                );
              }
            }
          }

          return {
            ...candidate,
            currentRoundId,
            roundProgress: calculateRoundProgress(
              candidate,
              jobWithTemplate.interviewTemplate
            ),
            hasSubmittedAssessment,
            isAssessmentGraded,
            meetingScheduled,
            meetLink,
            meetingData,
          };
        })
      );

      console.log("🔍 Pipeline candidates:", pipelineCandidates);

      setCandidates(pipelineCandidates);

      // Load pending notifications from the database
      try {
        console.log("🔍 Loading pending notifications from database...");
        const { apiService } = await import("@/services/api");
        const pendingNotificationsResponse =
          await apiService.getPendingNotifications(jobId);

        if (
          pendingNotificationsResponse &&
          pendingNotificationsResponse.pendingNotifications
        ) {
          console.log(
            "✅ Loaded pending notifications:",
            pendingNotificationsResponse.pendingNotifications
          );
          setPendingNotifications(
            pendingNotificationsResponse.pendingNotifications
          );
        } else {
          console.log("📭 No pending notifications found");
          setPendingNotifications([]);
        }
      } catch (error) {
        console.warn("⚠️ Failed to load pending notifications:", error);
        setPendingNotifications([]);
      }
    } catch (error) {
      console.error("Error loading job pipeline:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load pipeline"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRoundId = (
    candidate: Candidate,
    template?: InterviewTemplate
  ): string | undefined => {
    // Handle final statuses first
    if (candidate.status === "Hired") {
      return "hired";
    }
    if (candidate.status === "Offered") {
      return "offered";
    }
    if (candidate.status === "Rejected") {
      return "rejected";
    }

    // For "In Progress" status, determine column based on stage
    if (candidate.status === "In Progress") {
      if (candidate.stage === "Applied") {
        return "new";
      }

      // For interview stages, find the matching round
      if (template?.rounds) {
        for (const round of template.rounds) {
          const roundStage = INTERVIEW_TYPE_TO_STAGE_MAP[round.type];
          if (roundStage === candidate.stage) {
            return round.id;
          }
        }
      }
    }

    // Default to "new" if we can't determine the round
    return "new";
  };

  const calculateRoundProgress = (
    candidate: Candidate,
    template?: InterviewTemplate
  ): number => {
    if (!template?.rounds) return 0;

    const stageOrder = StageManager.getStageOrder();
    const currentStageIndex = stageOrder.indexOf(candidate.stage);

    if (currentStageIndex === -1) return 0;

    // Calculate progress as percentage through the pipeline
    const totalStages = stageOrder.length;
    return Math.round((currentStageIndex / (totalStages - 1)) * 100);
  };

  // Re-check assessment submission and grading flags for a specific candidate and round
  const refreshCandidateAssessmentFlags = async (
    candidateUserId: string | undefined,
    roundId: string | undefined
  ) => {
    try {
      if (!candidateUserId || !roundId) return;
      // Determine if the target round is of assessment type
      const round = job?.interviewTemplate?.rounds?.find(
        (r) => r.id === roundId
      );
      const isAssessmentRound =
        round &&
        (round.type === "technical_assessment" ||
          round.type === "coding_challenge");

      if (!isAssessmentRound) {
        // Clear flags for non-assessment rounds
        setCandidates((prev) =>
          prev.map((c) =>
            c.candidateUserId === candidateUserId
              ? {
                  ...c,
                  hasSubmittedAssessment: false,
                  isAssessmentGraded: false,
                }
              : c
          )
        );
        return;
      }

      const [submitted, graded] = await Promise.all([
        assessmentService.hasSubmittedAssessment(candidateUserId, roundId),
        assessmentService.isSubmissionGraded(candidateUserId, roundId),
      ]);

      setCandidates((prev) =>
        prev.map((c) =>
          c.candidateUserId === candidateUserId
            ? {
                ...c,
                hasSubmittedAssessment: submitted,
                isAssessmentGraded: graded,
              }
            : c
        )
      );
    } catch (e) {
      console.warn("Failed to refresh assessment flags", {
        candidateUserId,
        roundId,
        error: e,
      });
      // On error, pessimistically clear flags for the new round to avoid stale UI
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidateUserId === candidateUserId
            ? { ...c, hasSubmittedAssessment: false, isAssessmentGraded: false }
            : c
        )
      );
    }
  };

  const organizeIntoColumns = () => {
    const newColumns: PipelineColumn[] = [];

    console.log(
      `📊 Organizing columns with ${candidates.length} candidates:`,
      candidates.map((c) => ({
        name: c.name,
        status: c.status,
        stage: c.stage,
        currentRoundId: c.currentRoundId,
      }))
    );

    // Applied column - always show this
    const appliedCandidates = candidates.filter(
      (c) => c.status === "In Progress" && c.stage === "Applied"
    );
    console.log(
      `📋 Applied column: ${appliedCandidates.length} candidates`,
      appliedCandidates.map((c) => ({
        name: c.name,
        stage: c.stage,
        status: c.status,
      }))
    );

    newColumns.push({
      id: "new",
      title: "Applied",
      type: "new",
      candidates: appliedCandidates,
      color: "border-blue-500 bg-blue-50",
    });

    // Interview round columns based on template
    if (job?.interviewTemplate?.rounds) {
      job.interviewTemplate.rounds
        .sort((a, b) => a.roundOrder - b.roundOrder)
        .forEach((round) => {
          const roundStage = INTERVIEW_TYPE_TO_STAGE_MAP[round.type];
          const roundCandidates = candidates.filter(
            (c) => c.status === "In Progress" && c.stage === roundStage
          );

          console.log(
            `📋 ${roundStage} column (round ${round.id}): ${roundCandidates.length} candidates`,
            roundCandidates.map((c) => ({
              name: c.name,
              stage: c.stage,
              status: c.status,
              currentRoundId: c.currentRoundId,
            }))
          );

          newColumns.push({
            id: round.id,
            title: roundStage,
            type: "round",
            round: round,
            candidates: roundCandidates,
            color: getColumnColor(round.type),
          });
        });
    }

    // Offer column (only for Offered status)
    const offeredCandidates = candidates.filter((c) => c.status === "Offered");
    console.log(`📊 Organizing columns - Offered candidates:`, {
      total: candidates.length,
      offered: offeredCandidates.length,
      offeredCandidates: offeredCandidates.map((c) => ({
        name: c.name,
        status: c.status,
        stage: c.stage,
        currentRoundId: c.currentRoundId,
      })),
    });

    newColumns.push({
      id: "offered",
      title: "Offer",
      type: "offered",
      candidates: offeredCandidates,
      color: "border-yellow-500 bg-yellow-50",
    });

    // Hired column (only for Hired status)
    const hiredCandidates = candidates.filter((c) => c.status === "Hired");
    console.log(`📋 Hired column: ${hiredCandidates.length} candidates`);

    newColumns.push({
      id: "hired",
      title: "Hired",
      type: "hired",
      candidates: hiredCandidates,
      color: "border-green-500 bg-green-50",
    });

    // Rejected column
    const rejectedCandidates = candidates.filter(
      (c) => c.status === "Rejected"
    );
    console.log(`📋 Rejected column: ${rejectedCandidates.length} candidates`);

    newColumns.push({
      id: "rejected",
      title: "Rejected",
      type: "rejected",
      candidates: rejectedCandidates,
      color: "border-red-500 bg-red-50",
    });

    setColumns(newColumns);
  };

  const getColumnColor = (type: InterviewType): string => {
    switch (type) {
      case "phone_screening":
        return "border-blue-400 bg-blue-50";
      case "video_interview":
        return "border-green-400 bg-green-50";
      case "technical_assessment":
        return "border-purple-400 bg-purple-50";
      case "coding_challenge":
        return "border-orange-400 bg-orange-50";
      case "final_interview":
        return "border-gray-400 bg-white";
      case "culture_fit":
        return "border-red-400 bg-red-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  const getInterviewTypeIcon = (type: InterviewType) => {
    switch (type) {
      case "phone_screening":
        return Phone;
      case "video_interview":
        return Video;
      case "technical_assessment":
        return Code;
      case "coding_challenge":
        return Code;
      case "final_interview":
        return Crown;
      case "culture_fit":
        return Heart;
      default:
        return Calendar;
    }
  };

  // Debug utility function to trace candidate state
  const debugCandidateState = (candidateId: string, label: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      console.log(`❌ ${label}: Candidate ${candidateId} not found`);
      return;
    }

    console.log(`🔍 ${label}:`, {
      name: candidate.name,
      status: candidate.status,
      stage: candidate.stage,
      currentRoundId: candidate.currentRoundId,
      applicationId: candidate.applicationId,
    });

    // Also check which column this candidate should be in
    const expectedColumn = determineExpectedColumn(candidate);
    console.log(`📍 Expected column for ${candidate.name}:`, expectedColumn);
  };

  // Utility to determine which column a candidate should be in based on their current state
  const determineExpectedColumn = (candidate: Candidate) => {
    if (candidate.status === "Hired") return "hired";
    if (candidate.status === "Rejected") return "rejected";
    if (candidate.status === "Offered") return "offered";
    if (candidate.status === "In Progress" && candidate.stage === "Applied")
      return "new";

    // For other stages, find the corresponding round
    if (job?.interviewTemplate?.rounds) {
      const round = job.interviewTemplate.rounds.find(
        (r) => INTERVIEW_TYPE_TO_STAGE_MAP[r.type] === candidate.stage
      );
      return round ? round.id : "unknown";
    }

    return "unknown";
  };

  // Check if candidate movement is forward progression
  const checkIfForwardMovement = (
    fromColumnId: string,
    toColumnId: string
  ): boolean => {
    // Define column order for forward movement detection
    const columnOrder = ["new", "applied"];

    // Add interview round columns in order
    if (job?.interviewTemplate?.rounds) {
      job.interviewTemplate.rounds.forEach((round) => {
        columnOrder.push(round.id);
      });
    }

    // Add final stages
    columnOrder.push("offered", "hired");

    const fromIndex = columnOrder.indexOf(fromColumnId);
    const toIndex = columnOrder.indexOf(toColumnId);

    // Forward movement means moving to a higher index (excluding rejection)
    return fromIndex >= 0 && toIndex > fromIndex && toColumnId !== "rejected";
  };

  // Complete candidate move without showing modal (used after email confirmation)
  const completeCandidateMove = async (
    candidateId: string,
    fromColumnId: string,
    toColumnId: string,
    handlePendingNotifications: boolean = false
  ) => {
    console.log(
      `🚀 Completing candidate move: ${candidateId} from ${fromColumnId} to ${toColumnId}`
    );

    // Get the candidate
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      console.error(`Candidate ${candidateId} not found`);
      return;
    }

    console.log(`🔍 Current candidate state:`, {
      name: candidate.name,
      currentStatus: candidate.status,
      currentStage: candidate.stage,
      toColumnId,
    });

    // Determine new status and stage based on target column
    let newStatus: "In Progress" | "Hired" | "Rejected" | "Offered" =
      "In Progress";
    let newStage: CandidateStage;

    switch (toColumnId) {
      case "new":
      case "applied":
        newStatus = "In Progress";
        newStage = "Applied";
        break;
      case "hired":
        newStatus = "Hired";
        newStage = "Offer";
        break;
      case "rejected":
        newStatus = "Rejected";
        newStage = candidate.stage; // Keep current stage
        break;
      case "offered":
        newStatus = "Offered";
        newStage = "Offer";
        break;
      default:
        // For interview rounds, determine stage from the round
        newStatus = "In Progress";
        newStage = StageManager.getStageForColumnMove(
          toColumnId,
          "In Progress",
          job?.interviewTemplate
        );
    }

    console.log(`🎯 Determined new values:`, {
      newStatus,
      newStage,
      toColumnId,
    });

    // Validate stage transition
    if (!StageManager.isValidStageTransition(candidate.stage, newStage)) {
      console.warn(
        `Invalid stage transition from ${candidate.stage} to ${newStage}`
      );
      return;
    }

    // Make API call to update in backend FIRST, then update local state
    try {
      console.log(`📤 Sending to backend:`, {
        applicationId: candidate.applicationId,
        newStatus,
        newStage,
        toColumnId,
      });

      const updateResult = await candidateService.updateCandidateStatus(
        candidate.applicationId,
        newStatus,
        newStage,
        toColumnId
      );

      console.log(
        `✅ Successfully updated candidate ${candidateId} status in backend`,
        updateResult
      );

      // NOW update local state with the actual backend response (or fallback to our calculated values)
      const finalStatus =
        updateResult && typeof updateResult === "object" && updateResult.status
          ? updateResult.status
          : newStatus;
      const finalStage =
        updateResult && typeof updateResult === "object" && updateResult.stage
          ? updateResult.stage
          : newStage;
      const finalCurrentRoundId =
        updateResult &&
        typeof updateResult === "object" &&
        updateResult.currentRoundId
          ? updateResult.currentRoundId
          : toColumnId;

      console.log(`🔄 Updating local state with final values:`, {
        finalStatus,
        finalStage,
        finalCurrentRoundId,
        source:
          updateResult && typeof updateResult === "object" && updateResult.stage
            ? "backend_response"
            : "calculated_values",
      });

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                currentRoundId: finalCurrentRoundId,
                status: finalStatus,
                stage: finalStage,
                // Reset assessment flags when moving; they'll be re-evaluated below
                hasSubmittedAssessment: false,
                isAssessmentGraded: false,
              }
            : c
        )
      );

      console.log(
        `✅ Successfully completed candidate move for ${candidate.name}`
      );

      // Re-evaluate assessment flags for the new round asynchronously
      await refreshCandidateAssessmentFlags(
        candidate.candidateUserId,
        finalCurrentRoundId
      );

      // Handle pending notifications if requested
      if (handlePendingNotifications) {
        console.log(`🔄 Handling pending notifications for candidate move`);

        // Check if this is a backward movement
        const isBackwardMovement =
          !checkIfForwardMovement(fromColumnId, toColumnId) &&
          toColumnId !== "rejected" &&
          fromColumnId !== toColumnId;

        if (isBackwardMovement) {
          console.log(`🔄 Processing backward movement pending notifications`);

          // Update pending notifications for backward movement
          setPendingNotifications((prev) => {
            // Remove any existing notification for this candidate
            const filtered = prev.filter((n) => n.candidateId !== candidateId);

            // Add new pending notification for the target round (if it's not a final status)
            if (
              toColumnId !== "rejected" &&
              toColumnId !== "hired" &&
              toColumnId !== "offered"
            ) {
              const newNotification = {
                candidateId,
                candidateName: candidate.name,
                fromColumn: fromColumnId,
                toColumn: toColumnId,
                movedAt: new Date(),
                emailSent: false,
              };

              console.log(
                `📝 Added pending notification for backward move: ${candidate.name} (${fromColumnId} → ${toColumnId})`
              );

              return [...filtered, newNotification];
            }

            return filtered;
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error updating candidate status:`, error);
    }
  };

  // Helper function to group notifications by target round
  const getGroupedNotifications = () => {
    const groups: Record<
      string,
      Array<{
        candidateId: string;
        candidateName: string;
        fromColumn: string;
        toColumn: string;
        movedAt: Date;
        emailSent: boolean;
      }>
    > = {};

    pendingNotifications
      .filter((n) => !n.emailSent)
      .forEach((notification) => {
        if (!groups[notification.toColumn]) {
          groups[notification.toColumn] = [];
        }
        groups[notification.toColumn].push(notification);
      });

    return groups;
  };

  // Get round display name and appropriate email template type
  const getRoundInfo = (roundId: string) => {
    switch (roundId) {
      case "new":
      case "applied":
        return {
          displayName: "Applied Stage",
          templateType: "Success",
          description: "Initial application confirmation",
        };
      case "hired":
        return {
          displayName: "Hired",
          templateType: "Success",
          description: "Job offer and congratulations",
        };
      case "offered":
        return {
          displayName: "Offer Stage",
          templateType: "Success",
          description: "Offer preparation and next steps",
        };
      case "rejected":
        return {
          displayName: "Rejected",
          templateType: "Reject",
          description: "Application status update",
        };
      default:
        // Find the specific interview round
        const round = job?.interviewTemplate?.rounds?.find(
          (r) => r.id === roundId
        );
        if (round) {
          return {
            displayName: round.name || `${round.type} Round`,
            templateType: "Success", // Use "Success" for all progress notifications
            description: `${round.type} interview preparation and next steps`,
          };
        }
        return {
          displayName: roundId,
          templateType: "Success",
          description: "Interview round progression",
        };
    }
  };

  // Handle confirmation of backward movement
  const handleBackwardMoveConfirm = async () => {
    if (!pendingBackwardMove) return;

    console.log(
      `⚠️ Confirmed backward move for ${pendingBackwardMove.candidate.name}`
    );

    // Close the warning modal
    setShowBackwardWarningModal(false);

    // Proceed with the backward move using the same logic as normal moves
    await completeCandidateMove(
      pendingBackwardMove.candidateId,
      pendingBackwardMove.fromColumnId,
      pendingBackwardMove.toColumnId,
      true // Handle pending notifications for backward movement
    );

    // Clear the pending move
    setPendingBackwardMove(null);
  };

  const handleBackwardMoveCancel = () => {
    console.log(
      `❌ Cancelled backward move for ${pendingBackwardMove?.candidate.name}`
    );
    setShowBackwardWarningModal(false);
    setPendingBackwardMove(null);
  };

  // Handle bulk notification sending for a specific round
  const handleBulkNotificationSend = async (
    notificationsToSend: Array<{
      candidateId: string;
      candidateName: string;
      fromColumn: string;
      toColumn: string;
    }>
  ) => {
    console.log(
      `📧 Sending bulk notifications to ${notificationsToSend.length} candidates`
    );

    try {
      // Get the current round info to determine which notification flag to set
      const currentRoundId = notificationsToSend[0]?.toColumn;

      // Map round types to notification flags
      const notificationFlagMap: Record<string, string> = {
        phone_screening: "IsSendPhoneScreening",
        video_interview: "IsSendVideoInterview",
        technical_assessment: "IsSendTechAssessment",
        coding_challenge: "IsSendCodeChallenge",
        culture_fit: "IsSendCultureFit",
        final_interview: "IsSendFinalInterview",
      };

      // Get the round type from the job template
      const currentRound = job?.interviewTemplate?.rounds?.find(
        (r) => r.id === currentRoundId
      );
      const roundType = currentRound?.type;
      const flagToSet = roundType ? notificationFlagMap[roundType] : null;

      if (flagToSet) {
        console.log(
          `🔄 Setting ${flagToSet} to true for ${notificationsToSend.length} candidates`
        );

        // Update notification flags in the backend for each candidate
        const { apiService } = await import("@/services/api");

        for (const notification of notificationsToSend) {
          try {
            const candidate = candidates.find(
              (c) => c.id === notification.candidateId
            );
            if (candidate) {
              await apiService.makeRequest(
                `/applicationdetails/${candidate.applicationId}`,
                {
                  method: "PUT",
                  body: JSON.stringify({
                    [flagToSet]: true,
                  }),
                }
              );
              console.log(
                `✅ Set ${flagToSet} for candidate ${notification.candidateId}`
              );
            }
          } catch (error) {
            console.warn(
              `⚠️ Failed to set notification flag for candidate ${notification.candidateId}:`,
              error
            );
          }
        }
      }

      // Mark these notifications as email sent in local state
      setPendingNotifications((prev) =>
        prev.map((notification) =>
          notificationsToSend.some(
            (n) => n.candidateId === notification.candidateId
          )
            ? { ...notification, emailSent: true }
            : notification
        )
      );

      console.log(
        `✅ Successfully marked ${notificationsToSend.length} notifications as sent`
      );

      // Close the modal
      setActiveBulkNotificationRound(null);
    } catch (error) {
      console.error(`❌ Error sending bulk notifications:`, error);
    }
  };

  const handleCandidateMove = async (
    candidateId: string,
    fromColumnId: string,
    toColumnId: string
  ) => {
    console.log(`\n🚀 ===== CANDIDATE MOVE STARTED =====`);
    console.log(
      `Moving candidate ${candidateId} from ${fromColumnId} to ${toColumnId}`
    );

    // Debug: Current state before move
    debugCandidateState(candidateId, "BEFORE MOVE");

    // Get the candidate
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Check if this is a forward movement (progress to next stage)
    const isForwardMovement = checkIfForwardMovement(fromColumnId, toColumnId);

    // Check if this is a backward movement (reverse in hiring process)
    const isBackwardMovement =
      !isForwardMovement &&
      toColumnId !== "rejected" &&
      fromColumnId !== toColumnId;

    if (isBackwardMovement) {
      // Show warning modal for backward movement
      setPendingBackwardMove({
        candidateId,
        candidate,
        fromColumnId,
        toColumnId,
      });
      setShowBackwardWarningModal(true);
      return; // Exit early, the modal will handle the move if confirmed
    }

    if (
      isForwardMovement &&
      toColumnId !== "rejected" &&
      toColumnId !== "hired"
    ) {
      // Add to pending notifications instead of showing modal
      const newNotification = {
        candidateId,
        candidateName: candidate.name,
        fromColumn: fromColumnId,
        toColumn: toColumnId,
        movedAt: new Date(),
        emailSent: false,
      };

      setPendingNotifications((prev) => {
        // Check if this candidate already has a pending notification
        const existingIndex = prev.findIndex(
          (n) => n.candidateId === candidateId
        );
        if (existingIndex >= 0) {
          // Update existing notification
          const updated = [...prev];
          updated[existingIndex] = newNotification;
          return updated;
        } else {
          // Add new notification
          return [...prev, newNotification];
        }
      });

      console.log(
        `📝 Added pending notification for ${candidate.name} (${fromColumnId} → ${toColumnId})`
      );
      // Continue with the move - don't return early
    }

    console.log(`🔍 Current candidate state:`, {
      name: candidate.name,
      currentStatus: candidate.status,
      currentStage: candidate.stage,
      toColumnId,
    });

    // Debug the interview template availability
    console.log(`🔍 Interview template debug:`, {
      hasJob: !!job,
      hasTemplate: !!job?.interviewTemplate,
      templateId: job?.interviewTemplate?.id,
      roundsCount: job?.interviewTemplate?.rounds?.length || 0,
      rounds:
        job?.interviewTemplate?.rounds?.map((r) => ({
          id: r.id,
          type: r.type,
          name: r.name,
        })) || [],
    });

    // Determine new status and stage based on target column
    let newStatus: "In Progress" | "Hired" | "Rejected" | "Offered" =
      "In Progress";
    let newStage: CandidateStage;

    switch (toColumnId) {
      case "new":
      case "applied":
        newStatus = "In Progress";
        newStage = "Applied";
        break;
      case "hired":
        newStatus = "Hired";
        newStage = "Offer";
        break;
      case "rejected":
        newStatus = "Rejected";
        newStage = candidate.stage; // Keep current stage
        break;
      case "offered":
        newStatus = "Offered";
        newStage = "Offer";
        break;
      default:
        // For interview rounds, determine stage from the round
        newStatus = "In Progress";
        console.log(
          `🔄 About to call StageManager.getStageForColumnMove with:`,
          {
            toColumnId,
            status: "In Progress",
            template: {
              id: job?.interviewTemplate?.id,
              roundsCount: job?.interviewTemplate?.rounds?.length,
              rounds: job?.interviewTemplate?.rounds?.map((r) => ({
                id: r.id,
                type: r.type,
              })),
            },
          }
        );
        newStage = StageManager.getStageForColumnMove(
          toColumnId,
          "In Progress",
          job?.interviewTemplate
        );
        console.log(`🎯 StageManager returned stage: ${newStage}`);
    }

    console.log(`🎯 Determined new values:`, {
      newStatus,
      newStage,
      toColumnId,
    });

    // Validate stage transition
    if (!StageManager.isValidStageTransition(candidate.stage, newStage)) {
      console.warn(
        `Invalid stage transition from ${candidate.stage} to ${newStage}`
      );
      return;
    }

    console.log(
      `🚀 Starting API call without optimistic update to avoid conflicts`
    );

    // Make API call to update in backend FIRST, then update local state
    try {
      console.log(`📤 Sending to backend:`, {
        applicationId: candidate.applicationId,
        newStatus,
        newStage,
        toColumnId,
      });

      const updateResult = await candidateService.updateCandidateStatus(
        candidate.applicationId,
        newStatus,
        newStage,
        toColumnId
      );

      console.log(
        `✅ Successfully updated candidate ${candidateId} status in backend`,
        updateResult
      );

      // NOW update local state with the actual backend response (or fallback to our calculated values)
      const finalStatus =
        updateResult && typeof updateResult === "object" && updateResult.status
          ? updateResult.status
          : newStatus;
      const finalStage =
        updateResult && typeof updateResult === "object" && updateResult.stage
          ? updateResult.stage
          : newStage;
      const finalCurrentRoundId =
        updateResult &&
        typeof updateResult === "object" &&
        updateResult.currentRoundId
          ? updateResult.currentRoundId
          : toColumnId;

      console.log(`🔄 Updating local state with final values:`, {
        finalStatus,
        finalStage,
        finalCurrentRoundId,
        source:
          updateResult && typeof updateResult === "object" && updateResult.stage
            ? "backend_response"
            : "calculated_values",
      });

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                currentRoundId: finalCurrentRoundId,
                status: finalStatus,
                stage: finalStage,
                // Reset assessment flags when moving; they'll be re-evaluated below
                hasSubmittedAssessment: false,
                isAssessmentGraded: false,
              }
            : c
        )
      );

      // Update the candidates in the backend
      await candidateService.updateCandidateStatus(
        candidate.applicationId,
        finalStatus,
        finalStage,
        finalCurrentRoundId
      );

      // Re-evaluate assessment flags for the new round asynchronously
      await refreshCandidateAssessmentFlags(
        candidate.candidateUserId,
        finalCurrentRoundId
      );

      // Handle notification flags for backward movement
      if (isBackwardMovement) {
        console.log(`🔄 Resetting notification flags for backward movement`);

        // Determine which notification flag to reset based on the previous round
        const previousRound = job?.interviewTemplate?.rounds?.find(
          (r) => r.id === fromColumnId
        );
        if (previousRound) {
          const notificationFlagMap: Record<string, string> = {
            phone_screening: "IsSendPhoneScreening",
            video_interview: "IsSendVideoInterview",
            technical_assessment: "IsSendTechAssessment",
            coding_challenge: "IsSendCodeChallenge",
            culture_fit: "IsSendCultureFit",
            final_interview: "IsSendFinalInterview",
          };

          const flagToReset = notificationFlagMap[previousRound.type];
          if (flagToReset) {
            try {
              console.log(
                `🔄 Resetting ${flagToReset} to false for candidate ${candidateId}`
              );

              // Update the notification flag in the backend
              const { apiService } = await import("@/services/api");
              await apiService.makeRequest(
                `/applicationdetails/${candidate.applicationId}`,
                {
                  method: "PUT",
                  body: JSON.stringify({
                    [flagToReset]: false,
                  }),
                }
              );

              console.log(
                `✅ Successfully reset ${flagToReset} for candidate ${candidateId}`
              );
            } catch (error) {
              console.warn(`⚠️ Failed to reset notification flag:`, error);
            }
          }
        }

        // Update pending notifications for backward movement
        setPendingNotifications((prev) => {
          // Remove any existing notification for this candidate
          const filtered = prev.filter((n) => n.candidateId !== candidateId);

          // Add new pending notification for the target round (if it's not a final status)
          if (
            toColumnId !== "rejected" &&
            toColumnId !== "hired" &&
            toColumnId !== "offered"
          ) {
            const newNotification = {
              candidateId,
              candidateName: candidate.name,
              fromColumn: fromColumnId,
              toColumn: toColumnId,
              movedAt: new Date(),
              emailSent: false,
            };

            console.log(
              `📝 Added pending notification for backward move: ${candidate.name} (${fromColumnId} → ${toColumnId})`
            );

            return [...filtered, newNotification];
          }

          return filtered;
        });
      }
    } catch (error) {
      console.error(`❌ Error updating candidate status:`, error);
    }
  };

  const handleDragDrop = (candidateData: any, toColumnId: string) => {
    handleCandidateMove(
      candidateData.candidateId,
      candidateData.fromColumn,
      toColumnId
    );
  };

  const handleBulkMove = (
    candidateIds: string[],
    direction: "next" | "previous"
  ) => {
    candidateIds.forEach((candidateId) => {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate) return;

      const currentColumnIndex = columns.findIndex((col) =>
        col.candidates.some((c) => c.id === candidateId)
      );

      const targetIndex =
        direction === "next"
          ? Math.min(currentColumnIndex + 1, columns.length - 1)
          : Math.max(currentColumnIndex - 1, 0);

      if (targetIndex !== currentColumnIndex) {
        handleCandidateMove(
          candidateId,
          columns[currentColumnIndex].id,
          columns[targetIndex].id
        );
      }
    });
    setSelectedCandidates([]);
  };

  const handleBulkReject = (candidateIds: string[]) => {
    candidateIds.forEach((candidateId) => {
      // TODO: Implement reject logic
      console.log(`Rejecting candidate ${candidateId}`);
    });
    setSelectedCandidates([]);
  };

  const handleBulkSchedule = (candidateIds: string[]) => {
    // TODO: Implement bulk scheduling
    console.log(`Bulk scheduling for candidates: ${candidateIds.join(", ")}`);
    setSelectedCandidates([]);
  };

  const handleScheduleInterview = (candidateId: string, roundId: string) => {
    console.log(
      `Scheduling interview for candidate ${candidateId} in round ${roundId}`
    );

    if (!candidateId) {
      console.error("Candidate ID is undefined");
      return;
    }

    // Find the candidate - try multiple ID fields
    const candidate = candidates.find(
      (c) =>
        c.id === candidateId ||
        c.applicationId === candidateId ||
        (c as any).Id === candidateId ||
        (c as any).ApplicationId === candidateId
    );

    if (!candidate) {
      console.error("Candidate not found:", candidateId);
      console.log(
        "Available candidates:",
        candidates.map((c) => ({
          id: c.id,
          applicationId: c.applicationId,
          name: c.name,
        }))
      );
      return;
    }

    // Find the round
    const round = job?.interviewTemplate?.rounds.find((r) => r.id === roundId);
    if (!round) {
      console.error("Round not found:", roundId);
      console.log(
        "Available rounds:",
        job?.interviewTemplate?.rounds.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
        }))
      );
      return;
    }

    // Set the selected candidate and round for the modal
    setSelectedCandidate(candidate);
    setSelectedRound(round);
    setShowSchedulingModal(true);
  };

  const handleCompleteRound = (
    candidateId: string,
    roundId: string,
    result: any
  ) => {
    console.log(
      `Completing round ${roundId} for candidate ${candidateId}`,
      result
    );
    // TODO: Implement round completion
  };

  const handleAddNotes = (
    candidateId: string,
    roundId: string,
    notes: string
  ) => {
    console.log(
      `Adding notes for candidate ${candidateId} in round ${roundId}: ${notes}`
    );
    // TODO: Implement notes functionality
  };

  const handleMarkAssessment = (candidateUserId: string, roundId: string) => {
    // Validate jobId before navigation
    if (!jobId || jobId === "undefined") {
      console.error("❌ Cannot navigate to assessment: invalid jobId", jobId);
      return;
    }

    // Determine round type to route appropriately
    const round = job?.interviewTemplate?.rounds?.find((r) => r.id === roundId);
    let targetUrl = `/interview-pipeline/${jobId}/rounds/${roundId}/technical-assessment/assessment/${candidateUserId}`;
    if (round?.type === "coding_challenge") {
      targetUrl = `/interview-pipeline/${jobId}/rounds/${roundId}/coding-challenge/assessment/${candidateUserId}`;
    } else if (round?.type === "video_interview") {
      targetUrl = `/interview-pipeline/${jobId}/rounds/${roundId}/video-interview/assessment/${candidateUserId}`;
    }

    console.log("🔍 Navigating to assessment marking with:", {
      jobId,
      roundId,
      candidateUserId,
      roundType: round?.type,
      url: targetUrl,
    });
    router.push(targetUrl);
  };

  const handleMarkPhoneScreening = (
    candidateUserId: string,
    roundId: string
  ) => {
    if (!jobId || jobId === "undefined") {
      console.error(
        "❌ Cannot navigate to phone screening marking: invalid jobId",
        jobId
      );
      return;
    }
    const targetUrl = `/interview-pipeline/${jobId}/rounds/${roundId}/phone-screening/assessment/${candidateUserId}`;
    console.log("🔍 Navigating to phone screening assessment with:", {
      jobId,
      roundId,
      candidateUserId,
      url: targetUrl,
    });
    router.push(targetUrl);
  };

  // Bulk create (or ensure) assessment submissions for all candidates in a video interview round
  const handleCreateVideoInterviewSubmissions = async (roundId: string) => {
    try {
      if (!jobId || !roundId) return;
      const round = job?.interviewTemplate?.rounds?.find(
        (r) => r.id === roundId
      );
      if (!round || round.type !== "video_interview") return;

      const candidatesInRound = candidates.filter(
        (c) => c.currentRoundId === roundId
      );

      // Create submissions in parallel, but ignore errors per-candidate
      await Promise.all(
        candidatesInRound.map(async (c) => {
          try {
            const existing = await assessmentService.getAssessmentSubmission(
              c.candidateUserId as string,
              roundId
            );
            if (!existing) {
              await assessmentService.createSubmission(
                c.candidateUserId as string,
                roundId,
                jobId as string,
                null,
                { source: "video_interview_bulk_init" }
              );
            }
          } catch (err) {
            // swallow per-candidate errors to continue others
            console.warn(
              "Bulk submission create failed for candidate",
              c.id,
              err
            );
          }
        })
      );

      console.log(
        `✅ Ensured submissions for ${candidatesInRound.length} candidate(s) in video interview round ${roundId}`
      );
    } catch (e) {
      console.error("Failed bulk create video interview submissions", e);
    }
  };

  const handleHireCandidate = async (candidateId: string) => {
    console.log(`Hiring candidate ${candidateId}`);

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Update local state optimistically
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status: "Hired",
              currentRoundId: "hired",
              stage: "Offer",
            }
          : candidate
      )
    );

    // Note: organizeIntoColumns() will be called automatically by useEffect when candidates state updates

    // Make API call to update in backend
    try {
      await candidateService.updateCandidateStatus(
        candidate.applicationId,
        "Hired",
        "Offer",
        "hired"
      );
      console.log(
        `✅ Successfully updated candidate ${candidateId} to Hired status in backend`
      );
    } catch (error) {
      console.error(
        `❌ Failed to update candidate ${candidateId} to Hired status:`,
        error
      );
    }
  };

  const handleRejectCandidate = async (candidateId: string) => {
    console.log(`Rejecting candidate ${candidateId}`);

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Update candidate status to rejected
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status: "Rejected",
              currentRoundId: "rejected",
            }
          : candidate
      )
    );

    // Note: organizeIntoColumns() will be called automatically by useEffect when candidates state updates

    // Make API call to update in backend
    try {
      await candidateService.updateCandidateStatus(
        candidate.applicationId,
        "Rejected",
        candidate.stage, // Keep the current stage
        "rejected"
      );
      console.log(
        `✅ Successfully updated candidate ${candidateId} to Rejected status in backend`
      );
    } catch (error) {
      console.error(
        `❌ Failed to update candidate ${candidateId} to Rejected status:`,
        error
      );
    }
  };

  // New function to handle rejecting a candidate with email
  const handleRejectCandidateWithEmail = async (
    candidateId: string,
    emailData: {
      reason: string;
      notes?: string;
      templateId?: string;
      subject: string;
      body: string;
    }
  ) => {
    console.log(
      `Rejecting candidate ${candidateId} with email and reason`,
      emailData
    );

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Optimistically update candidate status to rejected
    setCandidates((prev) =>
      prev.map((candidateState) =>
        candidateState.id === candidateId
          ? {
              ...candidateState,
              status: "Rejected",
              currentRoundId: "rejected",
              rejectionReason: emailData.reason,
              rejectionNotes: emailData.notes,
              rejectedAt: new Date().toISOString(),
            }
          : candidateState
      )
    );

    try {
      // Use the rejectedCandidatesService to properly update with rejection reason and notes
      await rejectedCandidatesService.rejectCandidate(
        candidate.applicationId,
        emailData.reason,
        emailData.notes
      );

      // Then send the rejection email (simulate API call for now)
      console.log("📧 Sending rejection email:", {
        to: candidate.email,
        subject: emailData.subject,
        body: emailData.body,
        templateId: emailData.templateId,
        reason: emailData.reason,
        notes: emailData.notes,
      });

      // TODO: Implement actual email sending API call
      // await emailService.sendRejectionEmail({
      //   candidateId,
      //   email: candidate.email,
      //   subject: emailData.subject,
      //   body: emailData.body,
      //   templateId: emailData.templateId,
      //   reason: emailData.reason,
      //   notes: emailData.notes,
      // });

      console.log(
        `✅ Successfully rejected candidate ${candidateId} with reason: ${emailData.reason} and sent email`
      );
    } catch (error) {
      console.error(
        `❌ Failed to reject candidate ${candidateId} with email:`,
        error
      );

      // Revert the optimistic update on error
      setCandidates((prev) =>
        prev.map((candidateState) =>
          candidateState.id === candidateId
            ? {
                ...candidateState,
                status: candidate.status,
                currentRoundId: candidate.currentRoundId,
                rejectionReason: undefined,
                rejectionNotes: undefined,
                rejectedAt: undefined,
              }
            : candidateState
        )
      );

      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  // New function to handle offering a position to a candidate
  const handleOfferCandidate = async (candidateId: string) => {
    console.log(`Offering position to candidate ${candidateId}`);

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Update local state optimistically
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status: "Offered",
              currentRoundId: "offered",
              stage: "Offer",
            }
          : candidate
      )
    );

    // Note: organizeIntoColumns() will be called automatically by useEffect when candidates state updates

    // Make API call to update in backend
    try {
      await candidateService.updateCandidateStatus(
        candidate.applicationId,
        "Offered",
        "Offer",
        "offered"
      );
      console.log(
        `✅ Successfully updated candidate ${candidateId} to Offered status in backend`
      );
    } catch (error) {
      console.error(
        `❌ Failed to update candidate ${candidateId} to Offered status:`,
        error
      );
    }
  };

  // Template management functions
  const loadAvailableTemplates = async () => {
    try {
      const templates = await interviewService.getInterviewTemplates();
      setAvailableTemplates(templates);
    } catch (error) {
      console.error("Error loading interview templates:", error);
    }
  };

  const handleAssignTemplate = async (templateId: string) => {
    if (!job) return;

    try {
      setIsAssigningTemplate(true);

      // Update the job with new template
      await jobService.updateJob(job.id, {
        ...job,
        interviewTemplateId: templateId,
      });

      // Reload the job pipeline to reflect the change
      await loadJobPipeline();

      setShowTemplateSelector(false);
    } catch (error) {
      console.error("Error assigning interview template:", error);
      alert("Failed to assign interview template. Please try again.");
    } finally {
      setIsAssigningTemplate(false);
    }
  };

  const handleOpenTemplateSelector = () => {
    if (availableTemplates.length === 0) {
      loadAvailableTemplates();
    }
    setShowTemplateSelector(true);
  };

  const isLastRound = (roundId: string): boolean => {
    if (!job?.interviewTemplate?.rounds) return false;
    const rounds = job.interviewTemplate.rounds;
    const currentRoundIndex = rounds.findIndex((r) => r.id === roundId);
    return currentRoundIndex === rounds.length - 1;
  };

  const filteredColumns = columns.map((column) => ({
    ...column,
    candidates: column.candidates.filter(
      (candidate) =>
        searchQuery === "" ||
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-medium">Error loading pipeline</p>
          <p className="text-gray-600 text-sm mt-1">
            {error || "Job not found"}
          </p>
          <Link
            href="/interview-pipeline"
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/interview-pipeline"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <GitBranch className="h-6 w-6 mr-2 text-indigo-600" />
                {job.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                {job.department && (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {job.department}
                  </div>
                )}
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.locationType}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {candidates.length} candidate
                  {candidates.length !== 1 ? "s" : ""}
                </div>
                {job.interviewTemplate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {job.interviewTemplate.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* No Template Warning - Show when job has no interview template */}
      {!job?.interviewTemplate && (
        <div className="mx-6 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-amber-900 mb-2">
                  No Interview Template Assigned
                </h3>
                <p className="text-amber-800 mb-4">
                  This job doesn't have an interview template configured. To
                  manage candidates through interview rounds, you need to assign
                  an interview template that defines the interview process.
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleOpenTemplateSelector}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Assign Template
                  </button>
                  <Link
                    href="/interview-templates/create"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Template
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Applications Found Warning */}
      {noApplicationsFound && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 flex items-center justify-between"
          role="alert"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
            <span>No applications found for this job.</span>
          </div>
          <button
            className="ml-4 text-yellow-700 hover:text-yellow-900"
            onClick={() => setNoApplicationsFound(false)}
            aria-label="Dismiss"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Round-Based Pending Notifications */}
      {Object.entries(getGroupedNotifications()).length > 0 && (
        <div className="mx-6 mb-4 space-y-3">
          {Object.entries(getGroupedNotifications()).map(
            ([roundId, notifications]) => {
              const roundInfo = getRoundInfo(roundId);
              return (
                <div
                  key={roundId}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">
                          {roundInfo.displayName} - Pending Notifications
                        </h3>
                        <p className="text-sm text-blue-600">
                          {notifications.length} candidate
                          {notifications.length !== 1 ? "s" : ""} moved to this
                          round, not yet notified
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          {roundInfo.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveBulkNotificationRound(roundId)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send {notifications.length} Email
                      {notifications.length !== 1 ? "s" : ""}
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-6 space-x-6 min-w-max">
          {filteredColumns.map((column, columnIndex) => (
            <DroppableColumn
              key={column.id}
              onDrop={(candidateData) =>
                handleDragDrop(candidateData, column.id)
              }
              className={`flex flex-col w-80 bg-white rounded-lg border-2 ${column.color} shadow-sm relative`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    {column.round ? (
                      <div className="w-6 h-6 flex items-center justify-center">
                        {React.createElement(
                          getInterviewTypeIcon(column.round.type),
                          {
                            className: "w-4 h-4 text-gray-600",
                          }
                        )}
                      </div>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    {column.round ? (
                      <Link
                        href={`/interview-pipeline/${jobId}/rounds/${column.round.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer block truncate"
                      >
                        {column.title}
                      </Link>
                    ) : (
                      <h3 className="font-semibold text-gray-900 truncate">
                        {column.title}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                      {column.candidates.length}
                    </span>
                  </div>
                </div>
                {/* Ensure consistent header height by always showing info line */}
                <div className="mt-2 text-xs text-gray-500 min-h-[16px]">
                  {column.round ? (
                    <>
                      {column.round.duration} min •{" "}
                      {column.round.passingCriteria}% to pass
                    </>
                  ) : (
                    <span className="text-gray-400">
                      New applicants waiting for review
                    </span>
                  )}
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {column.candidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <User className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No candidates</p>
                  </div>
                ) : (
                  column.candidates.map((candidate) => {
                    const canMoveLeft =
                      column.id !== "new" &&
                      column.id !== "rejected" &&
                      column.id !== "hired" &&
                      dragEnabled;

                    const canMoveRight =
                      column.id !== "hired" &&
                      column.id !== "rejected" &&
                      column.id !== "offered" && // Can't move right from offered (must go to hired)
                      dragEnabled;

                    // Determine which special action buttons to show based on the current column
                    const showHireButton = column.id === "offered"; // Only show hire button from offered column
                    const showOfferButton =
                      isLastRound(column.id) && // Only show offer button in last round
                      column.id !== "offered" &&
                      column.id !== "hired" &&
                      column.id !== "rejected" &&
                      column.id !== "new";

                    return (
                      <div key={candidate.id} className="space-y-2">
                        <DragDropCandidateCard
                          candidate={candidate}
                          roundId={column.id}
                          canMoveLeft={canMoveLeft}
                          canMoveRight={canMoveRight}
                          onMove={(candidateId, direction) => {
                            const currentColumnIndex = columns.findIndex(
                              (c) => c.id === column.id
                            );
                            const targetColumnIndex =
                              direction === "left"
                                ? currentColumnIndex - 1
                                : currentColumnIndex + 1;
                            if (
                              targetColumnIndex >= 0 &&
                              targetColumnIndex < columns.length
                            ) {
                              handleCandidateMove(
                                candidateId,
                                column.id,
                                columns[targetColumnIndex].id
                              );
                            }
                          }}
                          onSchedule={(candidateId) =>
                            handleScheduleInterview(
                              candidateId,
                              column.round?.id || column.id
                            )
                          }
                          onReject={handleRejectCandidate}
                          onRejectWithEmail={handleRejectCandidateWithEmail}
                          jobTitle={job?.title || "Position"}
                          companyName={company?.name || "Company"}
                          onHire={
                            showHireButton ? handleHireCandidate : undefined
                          }
                          onOffer={
                            showOfferButton ? handleOfferCandidate : undefined
                          }
                          onViewProfile={(candidateId) =>
                            console.log(
                              `Viewing profile for candidate ${candidateId}`
                            )
                          }
                          onAddNote={(candidateId, note) =>
                            handleAddNotes(candidateId, column.id, note)
                          }
                          onMarkAssessment={(candidateId, roundId) =>
                            handleMarkAssessment(
                              candidate.candidateUserId,
                              roundId
                            )
                          }
                          onMarkPhoneScreen={(candidateUserId, roundId) =>
                            handleMarkPhoneScreening(candidateUserId, roundId)
                          }
                          roundType={column.round?.type}
                          roundConfigurationData={
                            (column.round as any)?.configurationData
                          }
                          hasSubmittedAssessment={
                            candidate.hasSubmittedAssessment
                          }
                          isAssessmentGraded={candidate.isAssessmentGraded}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </DroppableColumn>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCandidates={selectedCandidates}
        onClearSelection={() => setSelectedCandidates([])}
        onBulkMove={handleBulkMove}
        onBulkReject={handleBulkReject}
        onBulkSchedule={handleBulkSchedule}
      />

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Interview Template
              </h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isAssigningTemplate}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Job: <span className="font-medium">{job?.title}</span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Assigning a template will create interview rounds for
                managing candidates
              </p>
            </div>

            <div className="space-y-3">
              {availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-50"
                  onClick={() => handleAssignTemplate(template.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span>{template.rounds?.length || 0} rounds</span>
                        {template.isDefault && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>

            {availableTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No interview templates available</p>
                <p className="text-xs mt-1">Create a template first</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <Link
                href="/interview-templates/create"
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors font-medium"
              >
                Create New Template
              </Link>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                disabled={isAssigningTemplate}
              >
                Cancel
              </button>
            </div>

            {isAssigningTemplate && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-sm text-gray-600">Assigning template...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Round-Specific Bulk Notification Modal */}
      {activeBulkNotificationRound && (
        <BulkNotificationModal
          isOpen={!!activeBulkNotificationRound}
          onClose={() => setActiveBulkNotificationRound(null)}
          pendingNotifications={
            getGroupedNotifications()[activeBulkNotificationRound] || []
          }
          jobTitle={job?.title || "Position"}
          companyName={company?.name || "Company"}
          onNotificationsSent={handleBulkNotificationSend}
          roundInfo={getRoundInfo(activeBulkNotificationRound)}
        />
      )}

      {/* Backward Movement Warning Modal */}
      {showBackwardWarningModal && pendingBackwardMove && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              {/* Header */}
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Backward Movement
                  </h3>
                  <p className="text-sm text-gray-500">
                    You're moving a candidate backwards in the hiring process
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      {pendingBackwardMove.candidate.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 text-sm text-yellow-700">
                    <span>
                      {
                        getRoundInfo(pendingBackwardMove.fromColumnId)
                          .displayName
                      }
                    </span>
                    <ArrowLeft className="h-4 w-4" />
                    <span>
                      {getRoundInfo(pendingBackwardMove.toColumnId).displayName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    ⚠️ <strong>This candidate may have already:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Completed assessments for the current round</li>
                    <li>Been interviewed by team members</li>
                    <li>Received progress notifications</li>
                  </ul>
                  <p className="mt-3">
                    Moving them backward will reset their position in the hiring
                    process.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleBackwardMoveCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBackwardMoveConfirm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors"
                >
                  Move Backward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Interview Scheduling Modal */}
      {showSchedulingModal && selectedCandidate && selectedRound && (
        <VideoInterviewSchedulingModal
          isOpen={showSchedulingModal}
          onClose={() => {
            setShowSchedulingModal(false);
            setSelectedCandidate(null);
            setSelectedRound(null);
          }}
          candidate={{
            id: selectedCandidate.id,
            name: selectedCandidate.name,
            email: selectedCandidate.email,
          }}
          round={{
            id: selectedRound.id,
            name: selectedRound.name,
            type: selectedRound.type,
            duration: selectedRound.duration,
          }}
          jobId={jobId}
          roundId={selectedRound.id}
          onScheduleSuccess={(meetingData) => {
            console.log("Meeting scheduled successfully:", meetingData);

            // Refresh the job pipeline to get updated round configurations
            loadJobPipeline();

            // Close the modal
            setShowSchedulingModal(false);
            setSelectedCandidate(null);
            setSelectedRound(null);

            // Show success notification
            // You can implement a toast notification here
            console.log("✅ Meeting scheduled and pipeline refreshed");
          }}
        />
      )}
    </div>
  );
}

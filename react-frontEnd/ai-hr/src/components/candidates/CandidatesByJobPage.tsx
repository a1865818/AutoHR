"use client";

import { withHiringAuth } from "@/components/auth/WithHiringAuth";
import { CandidateDetail } from "@/components/candidates/CandidateDetail";
import { CandidateHeader } from "@/components/candidates/CandidateHeader";
import { CandidatesList } from "@/components/candidates/CandidatesList";
import { FilterSidebar } from "@/components/candidates/FilterSidebar";
import { NotesEditModal } from "@/components/candidates/NotesEditModal";
import { NotesList } from "@/components/candidates/NotesList";
import { RankingModal } from "@/components/candidates/RankingModal";
import { RankingTab } from "@/components/candidates/RankingTab";
import { RejectedCandidatesTab } from "@/components/candidates/RejectedCandidatesTab";
import { JobSpecificEmailModal } from "@/components/candidates/JobSpecificEmailModal";

import { useHiringAuth } from "@/hooks/useHiringAuth";
import {
  Candidate,
  CandidateStage,
  CandidateWithJobDetails,
  Job,
} from "@/interfaces";
import {
  InterviewTemplate,
  INTERVIEW_TYPE_TO_STAGE_MAP,
} from "@/interfaces/interview";
import { candidateRankingService } from "@/services/candidateRankingService";
import { candidateService } from "@/services/candidateService";
import { interviewService } from "@/services/interviewService";
import { jobService } from "@/services/jobService";
import { rejectedCandidatesService } from "@/services/rejectedCandidatesService";
import {
  DynamicCandidateFilterUtils,
  InterviewStageConfig,
  useDynamicStageConfigs,
} from "@/utils/dynamicInterviewStageConfig";
import { StageManager } from "@/utils/stageManager";

import { ArrowLeft, FileText, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface CandidatesByJobPageProps {
  jobId: string;
}

// Empty State Component
interface EmptyStateProps {
  type: "no-applications" | "no-candidates" | "no-results" | "no-notes";
  searchQuery?: string;
  onClearSearch?: () => void;
  onViewCandidates?: () => void;
}

function EmptyState({
  type,
  searchQuery,
  onClearSearch,
  onViewCandidates,
}: EmptyStateProps) {
  const emptyStates = {
    "no-applications": {
      icon: <FileText className="h-16 w-16 text-gray-300" />,
      title: "No Applications Yet",
      description: `This job posting hasn't received any applications yet. This is normal for new postings.`,
      actionText: "Share Job Posting",
      actionIcon: <Users className="h-4 w-4 mr-2" />,
      action: () => (window.location.href = "/jobs"),
      tips: [
        "Share your job posting on social media",
        "Check job boards and career sites",
        "Applications typically start coming in within 24-48 hours",
      ],
    },
    "no-candidates": {
      icon: <Users className="h-16 w-16 text-gray-300" />,
      title: "No Candidates Found",
      description: "There are no candidates matching your current filters.",
      actionText: "Clear All Filters",
      actionIcon: <Users className="h-4 w-4 mr-2" />,
      action: onClearSearch,
      tips: [
        "Try removing some filters",
        "Check different status categories",
        "Expand your search criteria",
      ],
    },
    "no-results": {
      icon: <Users className="h-16 w-16 text-gray-300" />,
      title: "No Search Results",
      description: `No candidates found for "${searchQuery}". Try a different search term.`,
      actionText: "Clear Search",
      actionIcon: <Users className="h-4 w-4 mr-2" />,
      action: onClearSearch,
      tips: [
        "Check your spelling",
        "Try broader search terms",
        "Search by email or company name",
      ],
    },
    "no-notes": {
      icon: <FileText className="h-16 w-16 text-gray-300" />,
      title: "No Notes Yet",
      description:
        "Start adding notes to candidates to keep track of your thoughts and feedback.",
      actionText: "View Candidates",
      actionIcon: <Users className="h-4 w-4 mr-2" />,
      action: onViewCandidates,
      tips: [
        "Add notes during interviews",
        "Track candidate strengths and concerns",
        "Share feedback with your team",
      ],
    },
  };

  const state = emptyStates[type];

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 py-12">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <FileText className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            No Content Available
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            There's nothing to display right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 py-12">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">{state.icon}</div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {state.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {state.description}
        </p>

        {/* Action Button */}
        {state.action && (
          <button
            onClick={state.action}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors mb-8"
          >
            {state.actionIcon}
            {state.actionText}
          </button>
        )}

        {/* Tips */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            💡 Helpful Tips
          </h4>
          <ul className="text-sm text-gray-600 space-y-2">
            {state.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CandidatesByJobPageComponent({ jobId }: CandidatesByJobPageProps) {
  const router = useRouter();
  const {
    isAuthorized,
    companyId,
    user,
    isLoading: authLoading,
  } = useHiringAuth();

  const [candidates, setCandidates] = useState<CandidateWithJobDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  );
  const [job, setJob] = useState<Job | null>(null);
  const [interviewTemplate, setInterviewTemplate] =
    useState<InterviewTemplate | null>(null);

  // Use dynamic stage configurations
  const { stageConfigs, loading: stageConfigsLoading } =
    useDynamicStageConfigs();

  const [selectedForRanking, setSelectedForRanking] = useState<string[]>([]);
  const [selectedRankingCandidate, setSelectedRankingCandidate] = useState<
    string | null
  >(null);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "candidates" | "notes" | "ranking" | "rejected"
  >("candidates");

  // Ranking state
  const [rankingsByPosition, setRankingsByPosition] = useState<
    Record<string, CandidateWithJobDetails[]>
  >({});
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [rankedCandidates, setRankedCandidates] = useState<Set<string>>(
    new Set()
  );
  const [loadingRankings, setLoadingRankings] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<{
    field: "name" | "stage" | "status";
    direction: "asc" | "desc";
  }>({ field: "name", direction: "asc" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [candidatesPerPage] = useState(11);

  // Filter states
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    stage: true,
    position: false, // Hide position filter since we're showing one job
  });

  const [activeFilters, setActiveFilters] = useState<{
    status: string[];
    stage: string[];
    position: string[];
  }>({
    status: [],
    stage: [],
    position: [],
  });

  const [filterCounts, setFilterCounts] = useState<{
    status: Record<string, number>;
    stage: Record<string, number>;
    position: Record<string, number>;
  }>({
    status: {},
    stage: {},
    position: {},
  });

  // Notes state
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notesEditModalOpen, setNotesEditModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
    null
  );

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    []
  );

  // Load job details and candidates
  useEffect(() => {
    let isCurrent = true;

    const loadJobAndCandidates = async () => {
      if (!jobId || authLoading) return;

      if (!isAuthorized || !companyId) {
        console.log("❌ Not authorized or no company ID:", {
          isAuthorized,
          companyId,
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load job details
        const jobData = await jobService.getJobById(jobId);
        if (!isCurrent) return;

        if (jobData) {
          const convertedJob = jobService.convertApiJobToJob(jobData);
          setJob(convertedJob);

          // Load interview template if job has one
          if (jobData.interviewTemplateId) {
            try {
              console.log(
                "🔄 Loading interview template for job:",
                jobData.interviewTemplateId
              );
              const template = await interviewService.getInterviewTemplate(
                jobData.interviewTemplateId
              );
              const rounds = await interviewService.getInterviewRounds(
                jobData.interviewTemplateId
              );
              const templateWithRounds = {
                ...template,
                rounds: rounds.sort((a, b) => a.roundOrder - b.roundOrder),
              };
              setInterviewTemplate(templateWithRounds);
              console.log("✅ Interview template loaded:", templateWithRounds);
            } catch (err) {
              console.warn(
                `Failed to load interview template for job ${jobId}:`,
                err
              );
              setInterviewTemplate(null);
            }
          } else {
            console.log("ℹ️ No interview template associated with this job");
            setInterviewTemplate(null);
          }
        }

        // Load candidates for this job
        console.log("🔄 Loading candidates for job:", jobId);
        const jobCandidates = await candidateService.getCandidatesForJob(jobId);
        if (!isCurrent) return;

        setCandidates(jobCandidates);
        setSelectedPosition(jobId);

        // Extract notes from candidate data
        const notesFromDb: Record<string, string> = {};
        jobCandidates.forEach((candidate) => {
          const noteValue = (candidate as any).hiringNotes;
          if (noteValue && noteValue.trim() !== "") {
            notesFromDb[candidate.applicationId] = noteValue;
          }
        });
        setNotes(notesFromDb);

        // Load existing rankings
        await loadRankingsFromBackend();
      } catch (err) {
        if (!isCurrent) return;
        console.error("❌ Failed to load job and candidates:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load candidates";

        if (errorMessage.includes("No applications")) {
          setError("no-applications");
        } else {
          setError("general-error");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadJobAndCandidates();

    return () => {
      isCurrent = false;
    };
  }, [isAuthorized, companyId, authLoading, jobId]);

  // Recalculate filter counts when candidates or active filters change
  useEffect(() => {
    if (candidates.length > 0) {
      const filterCounts = DynamicCandidateFilterUtils.calculateFilterCounts(
        candidates,
        activeFilters
      );
      setFilterCounts(filterCounts);
    }
  }, [candidates, activeFilters]);

  // Load rankings from the backend
  const loadRankingsFromBackend = async () => {
    if (!jobId) return;

    setLoadingRankings(true);
    try {
      const response = await candidateRankingService.getRankings(
        companyId || "",
        jobId
      );

      if (response.success && response.data) {
        const rankingData = response.data || [];
        const rankedCandidatesSet = new Set<string>();

        rankingData.forEach((candidate: CandidateWithJobDetails) => {
          if (candidate.applicationId) {
            rankedCandidatesSet.add(candidate.applicationId);
          }
        });

        setRankedCandidates(rankedCandidatesSet);
        setRankingsByPosition((prev) => ({
          ...prev,
          [jobId]: rankingData,
        }));
      }
    } catch (err) {
      console.error("Error loading rankings:", err);
    } finally {
      setLoadingRankings(false);
    }
  };

  // Handle candidate click
  const handleCandidateClick = (candidateId: string) => {
    setSelectedCandidate(candidateId);
  };

  const closeSidebar = () => {
    setSelectedCandidate(null);
  };

  const toggleFilter = (filterType: "status" | "stage" | "position") => {
    setExpandedFilters({
      ...expandedFilters,
      [filterType]: !expandedFilters[filterType],
    });
  };

  const handleFilterChange = (
    filterType: "status" | "stage" | "position",
    filterId: string,
    checked: boolean
  ) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      if (checked) {
        newFilters[filterType] = [...prev[filterType], filterId];
      } else {
        newFilters[filterType] = prev[filterType].filter(
          (id) => id !== filterId
        );
      }
      return newFilters;
    });
    setCurrentPage(1);
  };

  const handleRankingSelect = (candidateId: string, selected: boolean) => {
    setSelectedForRanking((prev) => {
      if (selected) {
        return [...prev, candidateId];
      } else {
        return prev.filter((id) => id !== candidateId);
      }
    });
  };

  const handleSelectAllForRanking = (selectAll: boolean) => {
    if (selectAll) {
      const allCandidateIds = filteredAndSortedCandidates.map(
        (candidate) => candidate.id
      );
      setSelectedForRanking(allCandidateIds);
    } else {
      setSelectedForRanking([]);
    }
  };

  const handleGoToRanking = async () => {
    const selectedCandidates: CandidateWithJobDetails[] = candidates.filter(
      (c) => selectedForRanking.includes(c.id)
    );

    try {
      const applicationIds = selectedCandidates.map((c) => c.applicationId);
      console.log(
        `📤 Adding ${selectedCandidates.length} candidates to ranking for job ${jobId}`
      );

      const result = await candidateRankingService.addCandidatesToRanking(
        jobId,
        applicationIds
      );
      console.log(`✅ Ranking result for job ${jobId}:`, result);

      if (result.success) {
        const updatedRankings = await candidateRankingService.getRankings(
          companyId || "",
          jobId
        );
        const rankedCandidates = updatedRankings.data || [];

        setRankingsByPosition((prev) => ({
          ...prev,
          [jobId]: rankedCandidates,
        }));

        setRankedCandidates((prev) => {
          const newSet = new Set(prev);
          applicationIds.forEach((id) => newSet.add(id));
          return newSet;
        });
      }

      setActiveTab("ranking");
      setSelectedForRanking([]);
    } catch (error) {
      console.error("❌ Failed to add candidates to ranking:", error);
      alert("Failed to add candidates to ranking. Please try again.");
    }
  };

  const handleRemoveFromRanking = async (candidateId: string) => {
    try {
      const candidate = Object.values(rankingsByPosition)
        .flat()
        .find((c) => c.id === candidateId);

      if (!candidate) {
        console.error("Candidate not found in rankings:", candidateId);
        return;
      }

      console.log(
        `📤 Removing candidate ${candidate.name} from ranking for job ${jobId}`
      );

      await candidateRankingService.removeCandidateFromRanking(
        jobId,
        candidate.applicationId
      );

      setRankingsByPosition((prev) => {
        const updated = { ...prev };
        if (updated[jobId]) {
          updated[jobId] = updated[jobId].filter((c) => c.id !== candidateId);
          if (updated[jobId].length === 0) {
            delete updated[jobId];
          }
        }
        return updated;
      });

      setRankedCandidates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(candidate.applicationId);
        return newSet;
      });

      if (selectedRankingCandidate === candidateId) {
        setSelectedRankingCandidate(null);
        setIsRankingModalOpen(false);
      }

      console.log("✅ Candidate removed from ranking successfully");
    } catch (error) {
      console.error("❌ Failed to remove candidate from ranking:", error);
      alert("Failed to remove candidate from ranking. Please try again.");
    }
  };

  const handleRankingCandidateSelect = (candidateId: string) => {
    setSelectedRankingCandidate(candidateId);
    setIsRankingModalOpen(true);
  };

  const clearFilters = () => {
    setActiveFilters({
      status: [],
      stage: [],
      position: [],
    });
    setCurrentPage(1);
  };

  const handleSort = (field: "name" | "stage" | "status") => {
    setSortBy((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleCandidateAction = async (
    candidateId: string,
    action: "approve" | "decline"
  ) => {
    try {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate) return;

      let newStatus: "In Progress" | "Hired" | "Rejected";
      let newStage: CandidateStage;

      if (action === "approve") {
        console.log(
          `🎯 Approving candidate ${candidate.name} from stage: ${candidate.stage}`
        );
        console.log(`🔍 Interview template available:`, {
          hasTemplate: !!interviewTemplate,
          templateName: interviewTemplate?.name,
          roundsCount: interviewTemplate?.rounds?.length || 0,
          rounds:
            interviewTemplate?.rounds?.map((r) => ({
              type: r.type,
              name: r.name,
              order: r.roundOrder,
              stage: INTERVIEW_TYPE_TO_STAGE_MAP[r.type],
            })) || [],
        });

        if (candidate.stage === "Applied") {
          newStatus = "In Progress";
          // Use template to determine first stage, fallback to hardcoded if no template
          if (
            interviewTemplate?.rounds &&
            interviewTemplate.rounds.length > 0
          ) {
            const firstRound = interviewTemplate.rounds[0];
            newStage = INTERVIEW_TYPE_TO_STAGE_MAP[firstRound.type];
            console.log(
              `✅ Moving from Applied to first template round: ${newStage}`
            );
          } else {
            newStage = "Phone Screening"; // Fallback
            console.log(
              `⚠️ No template available, using fallback: ${newStage}`
            );
          }
        } else if (candidate.stage === "Offer") {
          newStatus = "Hired";
          newStage = "Offer";
          console.log(`✅ Moving from Offer to Hired`);
        } else {
          // Use template-based progression for interview stages
          newStatus = "In Progress";
          newStage = StageManager.getNextStageFromTemplate(
            candidate.stage,
            interviewTemplate
          );
          console.log(
            `✅ Template-based progression: ${candidate.stage} → ${newStage}`
          );
        }
      } else {
        newStatus = "Rejected";
        newStage = candidate.stage;
        console.log(`❌ Rejecting candidate, keeping stage: ${newStage}`);
      }

      console.log(`📤 Updating candidate status:`, {
        candidateId,
        currentStage: candidate.stage,
        newStage,
        newStatus,
        action,
      });

      await candidateService.updateCandidateStatus(
        candidate.applicationId,
        newStatus,
        newStage
      );

      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id === candidateId) {
            return {
              ...c,
              status: newStatus,
              stage: newStage || c.stage,
            };
          }
          return c;
        })
      );

      setSelectedCandidate(null);
      console.log(`✅ Candidate ${action}d successfully`);
    } catch (error) {
      console.error(`❌ Failed to ${action} candidate:`, error);
      alert(`Failed to ${action} candidate. Please try again.`);
    }
  };

  const handleRejectCandidate = async (
    applicationId: string,
    reason: string,
    notes?: string
  ) => {
    try {
      const candidate = candidates.find(
        (c) => c.applicationId === applicationId
      );
      if (!candidate) return;

      // Use the rejection service to update with reason and notes
      await rejectedCandidatesService.rejectCandidate(
        applicationId,
        reason,
        notes
      );

      // Update local state
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.applicationId === applicationId) {
            return {
              ...c,
              status: "Rejected",
              rejectionReason: reason,
              rejectionNotes: notes,
              rejectedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );

      setSelectedCandidate(null);
      console.log(`✅ Candidate rejected successfully with reason: ${reason}`);
    } catch (error) {
      console.error("❌ Failed to reject candidate:", error);
      alert("Failed to reject candidate. Please try again.");
      throw error;
    }
  };

  const handleSaveNote = async (candidateId: string, note: string) => {
    try {
      const candidate = candidates.find((c) => c.applicationId === candidateId);
      if (!candidate) {
        console.error("Candidate not found for applicationId:", candidateId);
        return;
      }

      console.log("💾 Saving note to database for application:", candidateId);

      const timestamps = await candidateService.saveCandidateNote(
        candidateId,
        note
      );

      const newNotes = {
        ...notes,
        [candidateId]: note,
      };
      setNotes(newNotes);

      setCandidates((prevCandidates) =>
        prevCandidates.map((c) => {
          if (c.applicationId === candidateId) {
            return {
              ...c,
              hiringNotes: note,
              notesCreatedAt: timestamps.notesCreatedAt,
              notesUpdatedAt: timestamps.notesUpdatedAt,
            };
          }
          return c;
        })
      );

      console.log(
        "✅ Note saved successfully to database and local state updated with timestamps"
      );
    } catch (error) {
      console.error("❌ Failed to save note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  const handleDeleteNote = async (candidateId: string) => {
    try {
      console.log(
        "🗑️ Deleting note from database for application:",
        candidateId
      );

      await candidateService.deleteCandidateNote(candidateId);

      const newNotes = { ...notes };
      delete newNotes[candidateId];
      setNotes(newNotes);

      console.log("✅ Note deleted successfully from database");
    } catch (error) {
      console.error("❌ Failed to delete note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  const handleEditNote = (candidate: Candidate) => {
    const fullCandidateData = candidates.find((c) => c.id === candidate.id);
    setEditingCandidate(fullCandidateData || candidate);
    setNotesEditModalOpen(true);
  };

  const handleCloseNotesModal = () => {
    setNotesEditModalOpen(false);
    setEditingCandidate(null);
  };

  const handleSaveNoteFromModal = async (candidateId: string, note: string) => {
    await handleSaveNote(candidateId, note);
  };

  const handleClearFilters = () => {
    setActiveFilters({
      status: [],
      stage: [],
      position: [],
    });
    setSearchQuery("");
  };

  const handleBulkEmail = (candidateIds: string[]) => {
    console.log("Opening email modal for candidates:", candidateIds);
    setSelectedCandidateIds(candidateIds);
    setIsEmailModalOpen(true);
  };

  const handleEmailSent = () => {
    setIsEmailModalOpen(false);

    // Check if any of the selected candidates are rejected
    const selectedCandidates = candidates.filter((c) =>
      selectedCandidateIds.includes(c.id)
    );
    const rejectedCandidates = selectedCandidates.filter(
      (c) => c.status === "Rejected"
    );

    if (rejectedCandidates.length > 0) {
      // Switch to rejected tab to show the results
      setActiveTab("rejected");

      // Update the candidates state to reflect the email sent status
      setCandidates((prevCandidates) =>
        prevCandidates.map((candidate) => {
          if (
            selectedCandidateIds.includes(candidate.id) &&
            candidate.status === "Rejected"
          ) {
            return { ...candidate, isSendRejectEmail: true };
          }
          return candidate;
        })
      );

      console.log(
        `✅ Successfully sent ${rejectedCandidates.length} rejection emails`
      );
    }

    setSelectedCandidateIds([]);
    // Optionally refresh candidates or show success message
  };

  const handleRejectedEmailSent = (
    sentCount: number,
    candidateIds: string[]
  ) => {
    // Switch to rejected tab to show the results
    setActiveTab("rejected");

    // Update the candidates state to reflect the email sent status
    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate) => {
        if (candidateIds.includes(candidate.id)) {
          return { ...candidate, isSendRejectEmail: true };
        }
        return candidate;
      })
    );

    // Show success message
    console.log(`✅ Successfully sent ${sentCount} rejection emails`);
  };

  // Get candidates with notes (excluding rejected candidates)
  const candidatesWithNotes = useMemo(() => {
    const withNotes = candidates.filter((candidate) => {
      const hasNote = notes[candidate.applicationId];
      return (
        hasNote && hasNote.trim() !== "" && candidate.status !== "Rejected"
      );
    });
    return withNotes;
  }, [candidates, notes]);

  // Filter notes based on search and active filters
  const filteredNoteCandidates = useMemo(() => {
    let filtered = candidatesWithNotes;

    if (searchQuery) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notes[candidate.applicationId]
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilters.status.length > 0) {
      filtered = filtered.filter((candidate) => {
        const statusFilterId = DynamicCandidateFilterUtils.mapStatusToFilterId(
          candidate.status || ""
        );
        return activeFilters.status.includes(statusFilterId);
      });
    }

    if (activeFilters.stage.length > 0) {
      filtered = filtered.filter((candidate) => {
        const stageFilterId = InterviewStageConfig.mapStageToFilterId(
          candidate.stage || ""
        );
        return activeFilters.stage.includes(stageFilterId);
      });
    }

    return filtered;
  }, [candidatesWithNotes, searchQuery, notes, activeFilters]);

  // Filter and sort candidates
  const filteredAndSortedCandidates: CandidateWithJobDetails[] = useMemo(() => {
    if (stageConfigsLoading || stageConfigs.length === 0) {
      return [];
    }

    let filtered = candidates.filter(
      (candidate) => candidate.status !== "Rejected"
    );

    if (activeFilters.status.length > 0) {
      filtered = filtered.filter((candidate) => {
        const statusFilterId = DynamicCandidateFilterUtils.mapStatusToFilterId(
          candidate.status || ""
        );
        return activeFilters.status.includes(statusFilterId);
      });
    }

    if (activeFilters.stage.length > 0) {
      filtered = filtered.filter((candidate) => {
        const stageFilterId = InterviewStageConfig.mapStageToFilterId(
          candidate.stage || ""
        );
        return activeFilters.stage.includes(stageFilterId);
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (candidate.role &&
            candidate.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
          candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy.field) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "stage":
          aValue = a.stage;
          bValue = b.stage;
          break;
        case "status":
          aValue = a.status || "In Progress";
          bValue = b.status || "In Progress";
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortBy.direction === "asc" ? comparison : -comparison;
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        const comparison = aValue - bValue;
        return sortBy.direction === "asc" ? comparison : -comparison;
      }

      return 0;
    });

    return filtered as CandidateWithJobDetails[];
  }, [
    candidates,
    searchQuery,
    activeFilters,
    sortBy,
    stageConfigs,
    stageConfigsLoading,
  ]);

  // Reset to first page when active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate pagination
  const totalCandidates = filteredAndSortedCandidates.length;
  const totalPages = Math.ceil(totalCandidates / candidatesPerPage);
  const startIndex = (currentPage - 1) * candidatesPerPage;
  const endIndex = startIndex + candidatesPerPage;
  const paginatedCandidates = filteredAndSortedCandidates.slice(
    startIndex,
    endIndex
  );

  // Calculate counts for each tab
  const candidatesCount = filteredAndSortedCandidates.length;
  const notesCount = filteredAndSortedCandidates.filter(
    (c) => notes[c.applicationId] && notes[c.applicationId].trim() !== ""
  ).length;
  const rankingCount = rankingsByPosition[jobId]
    ? rankingsByPosition[jobId].filter((c) => c.isRanked).length
    : 0;
  const rejectedCount = candidates.filter(
    (c) => c.status === "Rejected"
  ).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document
      .getElementById("candidates-list-container")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshCandidates = async () => {
    if (!jobId || authLoading || !isAuthorized || !companyId) return;

    try {
      const candidatesData = await candidateService.getCandidatesForJob(jobId);
      setCandidates(candidatesData || []);
    } catch (error) {
      console.error("Error refreshing candidates:", error);
    }
  };

  // Get selected candidate data
  const selectedCandidateData = candidates.find(
    (candidate) => candidate.id === selectedCandidate
  );

  // Return early if not authorized
  if (!isAuthorized) {
    return null;
  }

  // Handle loading state
  if (loading && candidates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    if (error === "no-applications") {
      return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
          <div className="px-6 py-4 bg-white border-b">
            <div className="flex items-center">
              <Link
                href="/candidates"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {job?.title || "Job Candidates"}
              </h1>
            </div>
          </div>
          <EmptyState type="no-applications" />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Candidates
          </h2>
          <p className="text-gray-600 mb-4">
            {typeof error === "string" ? error : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-1 flex overflow-hidden">
        {/* Filter sidebar */}
        <FilterSidebar
          expandedFilters={expandedFilters}
          toggleFilter={toggleFilter}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          filterCounts={filterCounts}
          availableJobs={
            job
              ? [{ id: job.id, title: job.title, department: job.department }]
              : []
          }
          stageConfigs={stageConfigs}
          hidePositionFilter={true}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CandidateHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            candidatesCount={candidatesCount}
            notesCount={notesCount}
            rankingCount={rankingCount}
            rejectedCount={rejectedCount}
            jobTitle={job?.title}
            onBackToJobs={() => router.push("/candidates")}
            totalCandidates={filteredAndSortedCandidates.length}
          />

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {activeTab === "candidates" && (
                <CandidatesList
                  candidates={filteredAndSortedCandidates}
                  selectedCandidate={selectedCandidate}
                  selectedForRanking={selectedForRanking}
                  rankedCandidates={rankedCandidates}
                  onCandidateClick={handleCandidateClick}
                  onRankingSelect={handleRankingSelect}
                  onSelectAllForRanking={handleSelectAllForRanking}
                  onGoToRanking={handleGoToRanking}
                  sortBy={sortBy}
                  onSort={handleSort}
                />
              )}

              {activeTab === "notes" && (
                <NotesList
                  candidates={filteredAndSortedCandidates.filter(
                    (c) =>
                      notes[c.applicationId] &&
                      notes[c.applicationId].trim() !== ""
                  )}
                  notes={notes}
                  selectedCandidate={selectedCandidate}
                  onCandidateClick={(candidateId: string) => {
                    setSelectedCandidate(candidateId);
                    setActiveTab("candidates");
                  }}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}

              {activeTab === "ranking" && (
                <RankingTab
                  candidates={rankingsByPosition[jobId] || []}
                  selectedCandidateId={selectedRankingCandidate}
                  onCandidateSelect={handleRankingCandidateSelect}
                  onRemoveFromRanking={handleRemoveFromRanking}
                />
              )}

              {activeTab === "rejected" && (
                <RejectedCandidatesTab
                  candidates={candidates}
                  searchQuery={searchQuery}
                  onCandidateSelect={handleCandidateClick}
                  onBulkEmail={handleBulkEmail}
                  onEmailSent={handleRejectedEmailSent}
                  onRefresh={refreshCandidates}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isRankingModalOpen && selectedRankingCandidate && (
        <RankingModal
          candidate={
            candidates.find((c) => c.id === selectedRankingCandidate) || null
          }
          isOpen={isRankingModalOpen}
          onClose={() => setIsRankingModalOpen(false)}
          rank={
            rankingsByPosition[jobId]?.findIndex(
              (c) => c.id === selectedRankingCandidate
            ) + 1 || 1
          }
        />
      )}

      {notesEditModalOpen && editingCandidate && (
        <NotesEditModal
          isOpen={notesEditModalOpen}
          candidate={editingCandidate}
          currentNote={notes[editingCandidate.applicationId] || ""}
          onClose={handleCloseNotesModal}
          onSave={handleSaveNoteFromModal}
        />
      )}

      {isEmailModalOpen && (
        <JobSpecificEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          candidateIds={selectedCandidateIds}
          candidates={candidates}
          jobTitle={job?.title || ""}
          companyName={job?.company || "Company"}
          onEmailSent={handleEmailSent}
        />
      )}

      {/* Candidate Detail Sidebar (fixed overlay) */}
      {selectedCandidate && selectedCandidateData && (
        <div className="fixed right-0 top-[200px] h-[calc(100vh-112px)] w-96 bg-white border-l border-gray-200 shadow-2xl z-50 animate-slide-in-right">
          <CandidateDetail
            candidate={selectedCandidateData}
            onClose={closeSidebar}
            onAction={handleCandidateAction}
            onReject={handleRejectCandidate}
            onSaveNote={handleSaveNote}
            note={notes[selectedCandidateData.applicationId] || ""}
          />
        </div>
      )}
    </div>
  );
}

export const CandidatesByJobPage = withHiringAuth(CandidatesByJobPageComponent);

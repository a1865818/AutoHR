"use client";

import { withHiringAuth } from "@/components/auth/WithHiringAuth";
import { CandidateDetail } from "@/components/candidates/CandidateDetail";
import { CandidateHeader } from "@/components/candidates/CandidateHeader";
import { CandidatesList } from "@/components/candidates/CandidatesList";
import { FilterSidebar } from "@/components/candidates/FilterSidebar";
import { NotesEditModal } from "@/components/candidates/NotesEditModal";
import { NotesList } from "@/components/candidates/NotesList";
import { PositionRankingSelector } from "@/components/candidates/PositionRankingSelector";
import { RankingModal } from "@/components/candidates/RankingModal";
import { RankingTab } from "@/components/candidates/RankingTab";

import { useHiringAuth } from "@/hooks/useHiringAuth";
import { Candidate, CandidateWithJobDetails } from "@/interfaces";
import { candidateRankingService } from "@/services/candidateRankingService";
import { candidateService } from "@/services/candidateService";
import {
  DynamicCandidateFilterUtils,
  InterviewStageConfig,
  useDynamicStageConfigs,
} from "@/utils/dynamicInterviewStageConfig";

import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// Empty State Component
interface EmptyStateProps {
  type:
    | "no-jobs"
    | "no-applications"
    | "no-candidates"
    | "no-results"
    | "no-notes";
  companyName?: string;
  searchQuery?: string;
  onCreateJob?: () => void;
  onClearSearch?: () => void;
  onViewCandidates?: () => void;
}

function EmptyState({
  type,
  companyName = "your company",
  searchQuery,
  onCreateJob,
  onClearSearch,
  onViewCandidates,
}: EmptyStateProps) {
  const emptyStates = {
    "no-jobs": {
      icon: <Briefcase className="h-16 w-16 text-gray-300" />,
      title: "No Job Postings Yet",
      description: `${companyName} hasn't posted any jobs yet. Create your first job posting to start receiving applications.`,
      actionText: "Create First Job",
      actionIcon: <Plus className="h-4 w-4 mr-2" />,
      action: onCreateJob,
      tips: [
        "Post jobs to attract qualified candidates",
        "Use detailed job descriptions for better matches",
        "Include salary ranges to attract serious applicants",
      ],
    },
    "no-applications": {
      icon: <FileText className="h-16 w-16 text-gray-300" />,
      title: "No Applications Yet",
      description: `Your job postings haven't received any applications yet. This is normal for new postings.`,
      actionText: "View Job Postings",
      actionIcon: <Briefcase className="h-4 w-4 mr-2" />,
      action: () => (window.location.href = "/jobs"),
      tips: [
        "Share your job postings on social media",
        "Check job boards and career sites",
        "Applications typically start coming in within 24-48 hours",
      ],
    },
    "no-candidates": {
      icon: <Users className="h-16 w-16 text-gray-300" />,
      title: "No Candidates Found",
      description: "There are no candidates matching your current filters.",
      actionText: "Clear All Filters",
      actionIcon: <Search className="h-4 w-4 mr-2" />,
      action: onClearSearch,
      tips: [
        "Try removing some filters",
        "Check different status categories",
        "Expand your search criteria",
      ],
    },
    "no-results": {
      icon: <Search className="h-16 w-16 text-gray-300" />,
      title: "No Search Results",
      description: `No candidates found for "${searchQuery}". Try a different search term.`,
      actionText: "Clear Search",
      actionIcon: <Search className="h-4 w-4 mr-2" />,
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

  // Fallback state if type is not found
  if (!state) {
    console.warn(`Unknown empty state type: ${type}`);
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

// Main Candidates Page Component
function CandidatesPage() {
  const { isAuthorized, companyId, user } = useHiringAuth();
  const [candidates, setCandidates] = useState<CandidateWithJobDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("your company");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  );

  // Use dynamic stage configurations
  const { stageConfigs, loading: stageConfigsLoading } =
    useDynamicStageConfigs();

  const [selectedForRanking, setSelectedForRanking] = useState<string[]>([]);
  const [selectedRankingCandidate, setSelectedRankingCandidate] = useState<
    string | null
  >(null);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "candidates" | "notes" | "ranking"
  >("candidates");

  // NEW: Add state for position-based rankings
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
    field: "name" | "company" | "stage" | "status";
    direction: "asc" | "desc";
  }>({ field: "name", direction: "asc" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [candidatesPerPage] = useState(11);

  // Filter states
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    stage: true,
    position: true,
  });

  // Updated: Default active filters now use dynamic stages
  const [activeFilters, setActiveFilters] = useState({
    status: ["in-progress"],
    stage: [] as string[],
    position: [] as string[],
  });

  // Only initialize stage filters on first load
  const didInitStageFilters = useRef(false);
  useEffect(() => {
    if (
      !didInitStageFilters.current &&
      stageConfigs.length > 0 &&
      activeFilters.stage.length === 0
    ) {
      setActiveFilters((prev) => ({
        ...prev,
        stage: stageConfigs.map((config) => config.id), // All stages by default
      }));
      didInitStageFilters.current = true;
    }
  }, [stageConfigs, activeFilters.stage.length]);

  // Notes state
  const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>(
    {}
  );
  const [notesSearchQuery, setNotesSearchQuery] = useState("");

  // Modal state for editing notes
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] =
    useState<CandidateWithJobDetails | null>(null);

  // Load candidates data with better error handling
  useEffect(() => {
    if (!isAuthorized || !companyId) {
      return;
    }

    const loadCandidates = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔄 Loading candidates for company:", companyId);
        const response = await candidateService.getCandidatesForCompany();

        console.log("✅ Candidates loaded:", response.candidates.length);
        setCandidates(response.candidates);
        setCompanyName(response.companyName || "your company");

        // DEBUG: Log the raw response to see what we're getting
        console.log("🔍 DEBUG: Raw candidates response:", response.candidates);

        // Extract notes from candidate data using consistent key (applicationId)
        const notesFromDb: Record<string, string> = {};
        response.candidates.forEach((candidate, index) => {
          console.log(`🔍 DEBUG: Candidate ${index}:`, {
            id: candidate.id,
            applicationId: candidate.applicationId,
            candidateUserId: candidate.candidateUserId,
            name: candidate.name,
            hiringNotes: (candidate as any).hiringNotes,
            notesCreatedAt: (candidate as any).notesCreatedAt,
            notesUpdatedAt: (candidate as any).notesUpdatedAt,
          });

          // Check for notes - handle both null and empty string
          const noteValue = (candidate as any).hiringNotes;
          if (noteValue && noteValue.trim() !== "") {
            notesFromDb[candidate.applicationId] = noteValue;
            console.log(
              `📝 DEBUG: Added note for ${candidate.name} with key ${candidate.applicationId}:`,
              noteValue
            );
          } else {
            console.log(
              `📝 DEBUG: No valid note for ${candidate.name}. Raw value:`,
              noteValue
            );
          }
        });

        setCandidateNotes(notesFromDb);
        console.log("📝 Final notes object:", notesFromDb);
        console.log(
          "📝 Loaded notes for",
          Object.keys(notesFromDb).length,
          "candidates"
        );

        // Load existing rankings from backend
        await loadRankingsFromBackend();
      } catch (err) {
        console.error("❌ Failed to load candidates:", err);

        // Better error categorization
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load candidates";

        if (errorMessage.includes("Company not found")) {
          setError("company-not-found");
        } else if (errorMessage.includes("No jobs found")) {
          setError("no-jobs");
        } else if (errorMessage.includes("No applications")) {
          setError("no-applications");
        } else {
          setError("general-error");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, [isAuthorized, companyId]);

  // Load rankings from backend
  const loadRankingsFromBackend = async () => {
    try {
      setLoadingRankings(true);
      console.log("🔄 Loading rankings from backend...");

      const rankingsResponse =
        await candidateRankingService.getRankingsByCompany();

      // Group rankings by job
      const rankingsByJob: Record<string, CandidateWithJobDetails[]> = {};
      const rankedApplicationIds = new Set<string>();

      rankingsResponse.forEach((jobRanking) => {
        const jobId = jobRanking.jobId;
        const candidates = jobRanking.rankings.map((ranking) =>
          candidateRankingService.convertRankingToCandidate(ranking)
        );

        rankingsByJob[jobId] = candidates;

        // Track which candidates are ranked
        candidates.forEach((candidate) => {
          rankedApplicationIds.add(candidate.applicationId);
        });
      });

      setRankingsByPosition(rankingsByJob);
      setRankedCandidates(rankedApplicationIds);

      console.log("✅ Rankings loaded from backend:", {
        jobsWithRankings: Object.keys(rankingsByJob).length,
        totalRankedCandidates: rankedApplicationIds.size,
      });
    } catch (error) {
      console.error("❌ Failed to load rankings from backend:", error);
      // Don't fail the entire page load, just log the error
    } finally {
      setLoadingRankings(false);
    }
  };

  // Get available jobs from candidates for filtering
  const availableJobs = useMemo(() => {
    const jobsMap = new Map();
    candidates.forEach((candidate) => {
      const hasJobDetails = "jobTitle" in candidate && "jobId" in candidate;
      if (hasJobDetails) {
        const candidateWithDetails = candidate as CandidateWithJobDetails;
        const jobId = candidateWithDetails.jobId;
        const jobTitle = candidateWithDetails.jobTitle;
        const jobDepartment = candidateWithDetails.jobDepartment;

        if (!jobsMap.has(jobId)) {
          jobsMap.set(jobId, {
            id: jobId,
            title: jobTitle,
            department: jobDepartment,
          });
        }
      }
    });
    return Array.from(jobsMap.values());
  }, [candidates]);

  // Calculate filter counts using dynamic utilities
  const filterCounts = useMemo(() => {
    if (stageConfigsLoading || stageConfigs.length === 0) {
      return {
        status: { "in-progress": 0, offered: 0, hired: 0, rejected: 0 },
        stage: {} as Record<string, number>,
        position: {} as Record<string, number>,
      };
    }

    const counts = DynamicCandidateFilterUtils.calculateFilterCounts(
      candidates,
      {
        status: activeFilters.status,
        stage: activeFilters.stage,
        position: activeFilters.position,
      }
    );

    return counts;
  }, [candidates, activeFilters, stageConfigs, stageConfigsLoading]);

  const handleCandidateClick = (candidateId: string) => {
    setSelectedCandidate(candidateId);
  };

  const closeSidebar = () => {
    setSelectedCandidate(null);
  };

  const toggleFilter = (filterType: "status" | "stage" | "position") => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const handleFilterChange = (
    filterType: "status" | "stage" | "position",
    filterId: string,
    checked: boolean
  ) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType], filterId]
        : prev[filterType].filter((id) => id !== filterId),
    }));
    setCurrentPage(1);
  };

  // Add these handler functions:
  const handleRankingSelect = (candidateId: string, selected: boolean) => {
    // Find the candidate to check if they're already ranked
    const candidate = filteredAndSortedCandidates.find(
      (c) => c.id === candidateId
    );

    if (candidate && rankedCandidates.has(candidate.applicationId)) {
      console.log("Candidate is already ranked, cannot select for ranking");
      return;
    }

    if (selected) {
      setSelectedForRanking((prev) => [...prev, candidateId]);
    } else {
      setSelectedForRanking((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  const handleSelectAllForRanking = (selectAll: boolean) => {
    if (selectAll) {
      // Only select candidates that are not already ranked
      const unrankedCandidates = filteredAndSortedCandidates.filter(
        (c) => !rankedCandidates.has(c.applicationId)
      );
      setSelectedForRanking(unrankedCandidates.map((c) => c.id));
    } else {
      setSelectedForRanking([]);
    }
  };

  const handleGoToRanking = async () => {
    const selectedCandidates: CandidateWithJobDetails[] =
      filteredAndSortedCandidates.filter((c) =>
        selectedForRanking.includes(c.id)
      );

    // NEW: Group candidates by job ID to ensure same-role ranking
    const candidatesByPosition: Record<string, CandidateWithJobDetails[]> = {};

    selectedCandidates.forEach((candidate) => {
      // Use jobId as the position key for reliable role distinction
      const positionKey = candidate.jobId || "unknown-job";
      if (!candidatesByPosition[positionKey]) {
        candidatesByPosition[positionKey] = [];
      }
      candidatesByPosition[positionKey].push(candidate);
    });

    try {
      // Add candidates to backend ranking system
      for (const [jobId, candidates] of Object.entries(candidatesByPosition)) {
        const applicationIds = candidates.map((c) => c.applicationId);

        console.log(
          `📤 Adding ${candidates.length} candidates to ranking for job ${jobId}`
        );

        const result = await candidateRankingService.addCandidatesToRanking(
          jobId,
          applicationIds
        );

        console.log(`✅ Ranking result for job ${jobId}:`, result);

        if (result.success) {
          // Update local state with new rankings
          const updatedRankings =
            await candidateRankingService.getRankingsByJob(jobId);
          const rankedCandidates = updatedRankings.rankings.map((ranking) =>
            candidateRankingService.convertRankingToCandidate(ranking)
          );

          setRankingsByPosition((prev) => ({
            ...prev,
            [jobId]: rankedCandidates,
          }));

          // Update ranked candidates set
          setRankedCandidates((prev) => {
            const newSet = new Set(prev);
            applicationIds.forEach((id) => newSet.add(id));
            return newSet;
          });
        }
      }

      // Set the first position as selected if none is selected
      if (!selectedPosition && Object.keys(candidatesByPosition).length > 0) {
        setSelectedPosition(Object.keys(candidatesByPosition)[0]);
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
      // Find the candidate and their job
      const candidate = Object.values(rankingsByPosition)
        .flat()
        .find((c) => c.id === candidateId);

      if (!candidate) {
        console.error("Candidate not found in rankings:", candidateId);
        return;
      }

      console.log(
        `📤 Removing candidate ${candidate.name} from ranking for job ${candidate.jobId}`
      );

      // Remove from backend
      await candidateRankingService.removeCandidateFromRanking(
        candidate.jobId,
        candidate.applicationId
      );

      // Remove from local state
      setRankingsByPosition((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((position) => {
          updated[position] = updated[position].filter(
            (c) => c.id !== candidateId
          );
        });
        // Remove empty positions
        Object.keys(updated).forEach((position) => {
          if (updated[position].length === 0) {
            delete updated[position];
          }
        });
        return updated;
      });

      // Remove from ranked candidates set
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

  const handlePositionSelect = (positionId: string) => {
    setSelectedPosition(positionId);
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
    // Reset to first page when clearing filters
    setCurrentPage(1);
  };

  const handleSort = (field: "name" | "company" | "stage" | "status") => {
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
      let newStage: "Applied" | "Interview" | "Offer" | undefined;

      if (action === "approve") {
        if (candidate.stage === "Applied") {
          newStatus = "In Progress";
          newStage = "Interview";
        } else if (candidate.stage === "Interview") {
          newStatus = "In Progress";
          newStage = "Offer";
        } else if (candidate.stage === "Offer") {
          newStatus = "Hired";
          newStage = undefined;
        } else {
          newStatus = "In Progress";
        }
      } else {
        newStatus = "Rejected";
      }

      // Update backend
      await candidateService.updateCandidateStatus(
        candidate.applicationId,
        newStatus,
        newStage
      );

      // Update local state
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

  const handleSaveNote = async (candidateId: string, note: string) => {
    try {
      // Find candidate by the passed candidateId (which should be applicationId)
      const candidate = candidates.find((c) => c.applicationId === candidateId);
      if (!candidate) {
        console.error("Candidate not found for applicationId:", candidateId);
        return;
      }

      console.log("💾 Saving note to database for application:", candidateId);

      // Save to backend database using applicationId and get timestamps back
      const timestamps = await candidateService.saveCandidateNote(
        candidateId,
        note
      );

      const newNotes = {
        ...candidateNotes,
        [candidateId]: note, // Use applicationId consistently
      };
      setCandidateNotes(newNotes);

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

      // Delete from backend database
      await candidateService.deleteCandidateNote(candidateId);

      // Update local state using applicationId
      const newNotes = { ...candidateNotes };
      delete newNotes[candidateId];
      setCandidateNotes(newNotes);

      console.log("✅ Note deleted successfully from database");
    } catch (error) {
      console.error("❌ Failed to delete note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  const handleEditNote = (candidate: Candidate) => {
    // Find the full candidate data with job details
    const fullCandidateData = candidates.find((c) => c.id === candidate.id);
    setEditingCandidate(fullCandidateData || candidate);
    setIsNotesModalOpen(true);
  };

  const handleCloseNotesModal = () => {
    setIsNotesModalOpen(false);
    setEditingCandidate(null);
  };

  const handleSaveNoteFromModal = async (candidateId: string, note: string) => {
    // candidateId here is actually applicationId passed from the modal
    await handleSaveNote(candidateId, note);
    // No need to manually refresh - handleSaveNote now updates local state with timestamps immediately
  };

  const handleClearFilters = () => {
    setActiveFilters({
      status: [],
      stage: [],
      position: [],
    });
    setSearchQuery("");
    setNotesSearchQuery("");
  };

  // Get candidates with notes using applicationId
  const candidatesWithNotes = useMemo(() => {
    console.log("🔍 DEBUG: Calculating candidatesWithNotes");
    console.log(
      "🔍 DEBUG: All candidates:",
      candidates.map((c) => ({
        id: c.id,
        applicationId: c.applicationId,
        name: c.name,
      }))
    );
    console.log(
      "🔍 DEBUG: Current candidateNotes keys:",
      Object.keys(candidateNotes)
    );

    const withNotes = candidates.filter((candidate) => {
      // Use applicationId to check for notes
      const hasNote = candidateNotes[candidate.applicationId];
      console.log(
        `🔍 DEBUG: Candidate ${candidate.name} (app: ${candidate.applicationId}) has note:`,
        !!hasNote
      );
      return hasNote;
    });

    console.log(
      "🔍 DEBUG: Candidates with notes:",
      withNotes.map((c) => ({
        id: c.id,
        applicationId: c.applicationId,
        name: c.name,
      }))
    );
    return withNotes;
  }, [candidates, candidateNotes]);

  // Filter notes based on search and active filters
  const filteredNoteCandidates = useMemo(() => {
    let filtered = candidatesWithNotes;

    // Apply search filter
    if (notesSearchQuery) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name
            .toLowerCase()
            .includes(notesSearchQuery.toLowerCase()) ||
          candidate.company
            .toLowerCase()
            .includes(notesSearchQuery.toLowerCase()) ||
          candidateNotes[candidate.applicationId]
            ?.toLowerCase()
            .includes(notesSearchQuery.toLowerCase())
      );
    }

    // Apply position filter
    if (activeFilters.position.length > 0) {
      filtered = filtered.filter((candidate) => {
        const hasJobDetails = "jobId" in candidate;
        if (hasJobDetails) {
          const candidateWithDetails = candidate as CandidateWithJobDetails;
          const jobId = candidateWithDetails.jobId;
          return activeFilters.position.includes(jobId);
        }
        return false;
      });
    }

    // Apply status filter
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter((candidate) => {
        const statusFilterId = DynamicCandidateFilterUtils.mapStatusToFilterId(
          candidate.status || ""
        );
        return activeFilters.status.includes(statusFilterId);
      });
    }

    // Apply stage filter
    if (activeFilters.stage.length > 0) {
      filtered = filtered.filter((candidate) => {
        const stageFilterId = InterviewStageConfig.mapStageToFilterId(
          candidate.stage || ""
        );
        return activeFilters.stage.includes(stageFilterId);
      });
    }

    return filtered;
  }, [candidatesWithNotes, notesSearchQuery, candidateNotes, activeFilters]);

  // Calculate pagination for notes
  const totalNotes = filteredNoteCandidates.length;
  const totalNotesPages = Math.ceil(totalNotes / candidatesPerPage);
  const notesStartIndex = (currentPage - 1) * candidatesPerPage;
  const notesEndIndex = notesStartIndex + candidatesPerPage;
  const paginatedNoteCandidates = filteredNoteCandidates.slice(
    notesStartIndex,
    notesEndIndex
  );

  // Filter and sort candidates using dynamic utilities
  const filteredAndSortedCandidates: CandidateWithJobDetails[] = useMemo(() => {
    if (stageConfigsLoading || stageConfigs.length === 0) {
      return []; // Return empty while loading stage configs
    }

    let filtered = DynamicCandidateFilterUtils.applyFilters(candidates, {
      status: activeFilters.status,
      stage: activeFilters.stage,
      position: activeFilters.position,
    }) as CandidateWithJobDetails[];

    // Apply search filter
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy.field) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "company":
          aValue = a.company;
          bValue = b.company;
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

  // Calculate pagination for candidates
  const totalCandidates = filteredAndSortedCandidates.length;
  const totalPages = Math.ceil(totalCandidates / candidatesPerPage);
  const startIndex = (currentPage - 1) * candidatesPerPage;
  const endIndex = startIndex + candidatesPerPage;
  const paginatedCandidates = filteredAndSortedCandidates.slice(
    startIndex,
    endIndex
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of candidate list when page changes
    document
      .getElementById("candidates-list-container")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get selected candidate data
  const selectedCandidateData = candidates.find(
    (candidate) => candidate.id === selectedCandidate
  );

  const stagesWithCandidates = useMemo(() => {
    const stageIds = new Set<string>();
    candidates.forEach((candidate) => {
      const stageId = InterviewStageConfig.mapStageToFilterId(
        candidate.stage || ""
      );
      stageIds.add(stageId);
    });
    return stageIds;
  }, [candidates]);

  const filteredStageConfigs = useMemo(() => {
    return stageConfigs.filter((config) => stagesWithCandidates.has(config.id));
  }, [stageConfigs, stagesWithCandidates]);

  // Loading state with animation
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  // Error states with better UX
  if (error) {
    const renderErrorState = () => {
      switch (error) {
        case "company-not-found":
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="text-red-500 text-6xl mb-4">🏢</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Company Not Found
                </h2>
                <p className="text-gray-600 mb-4">
                  The company associated with your account could not be found.
                  Please contact your administrator.
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

        case "no-jobs":
          return (
            <div className="flex h-screen bg-gray-50">
              <FilterSidebar
                expandedFilters={expandedFilters}
                toggleFilter={toggleFilter}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                filterCounts={filterCounts}
                availableJobs={availableJobs}
                stageConfigs={filteredStageConfigs}
                onClearFilters={clearFilters}
              />
              <div className="flex-1 overflow-hidden flex flex-col">
                <CandidateHeader
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  candidatesCount={0}
                  notesCount={0}
                  rankingCount={0}
                />
                <EmptyState
                  type="no-jobs"
                  companyName={companyName}
                  onCreateJob={() => (window.location.href = "/jobs/create")}
                />
              </div>
            </div>
          );

        case "no-applications":
          return (
            <div className="flex h-screen bg-gray-50">
              <FilterSidebar
                expandedFilters={expandedFilters}
                toggleFilter={toggleFilter}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                filterCounts={filterCounts}
                availableJobs={availableJobs}
                stageConfigs={filteredStageConfigs}
                onClearFilters={clearFilters}
              />
              <div className="flex-1 overflow-hidden flex flex-col">
                <CandidateHeader
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  candidatesCount={0}
                  notesCount={0}
                  rankingCount={0}
                />
                <EmptyState type="no-applications" companyName={companyName} />
              </div>
            </div>
          );

        default:
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Error Loading Candidates
                </h2>
                <p className="text-gray-600 mb-4">
                  {typeof error === "string"
                    ? error
                    : "An unexpected error occurred"}
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
    };

    return renderErrorState();
  }

  // Main content with empty state handling
  const renderMainContent = () => {
    if (activeTab === "candidates") {
      if (filteredAndSortedCandidates.length === 0) {
        if (searchQuery) {
          return (
            <EmptyState
              type="no-results"
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
            />
          );
        } else if (candidates.length === 0) {
          return (
            <EmptyState type="no-applications" companyName={companyName} />
          );
        } else {
          return (
            <EmptyState
              type="no-candidates"
              onClearSearch={handleClearFilters}
            />
          );
        }
      }
      return (
        <div className="flex flex-col flex-1 overflow-hidden">
          <CandidatesList
            candidates={paginatedCandidates}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, totalCandidates)} of {totalCandidates}{" "}
                  candidates
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and 2 pages around current page
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 2
                        );
                      })
                      .map((page, index, filteredPages) => {
                        // Add ellipsis if there's a gap
                        const showEllipsis =
                          index > 0 && page - filteredPages[index - 1] > 1;

                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeTab === "notes") {
      // Notes tab
      if (filteredNoteCandidates.length === 0) {
        if (notesSearchQuery) {
          return (
            <EmptyState
              type="no-results"
              searchQuery={notesSearchQuery}
              onClearSearch={() => setNotesSearchQuery("")}
            />
          );
        } else {
          return (
            <EmptyState
              type="no-notes"
              onViewCandidates={() => setActiveTab("candidates")}
            />
          );
        }
      }
      return (
        <div className="flex flex-col flex-1 overflow-hidden">
          <NotesList
            candidates={paginatedNoteCandidates}
            notes={candidateNotes}
            selectedCandidate={selectedCandidate}
            onCandidateClick={handleCandidateClick}
            onDeleteNote={handleDeleteNote}
            onEditNote={handleEditNote}
          />

          {/* Pagination for Notes */}
          {totalNotesPages > 1 && (
            <div className="border-t bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {notesStartIndex + 1} to{" "}
                  {Math.min(notesEndIndex, totalNotes)} of {totalNotes} notes
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: totalNotesPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and 2 pages around current page
                        return (
                          page === 1 ||
                          page === totalNotesPages ||
                          Math.abs(page - currentPage) <= 2
                        );
                      })
                      .map((page, index, filteredPages) => {
                        // Add ellipsis if there's a gap
                        const showEllipsis =
                          index > 0 && page - filteredPages[index - 1] > 1;

                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalNotesPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalNotesPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    // Add ranking tab rendering
    if (activeTab === "ranking") {
      // NEW: Show position selector if multiple positions, or direct ranking if single position
      const positions = Object.keys(rankingsByPosition);

      if (positions.length === 0) {
        return (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Rankings Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Select candidates from the same position in the Candidates tab
                  to start ranking
                </p>
              </div>
            </div>
          </div>
        );
      }

      if (positions.length === 1) {
        // Single position - show direct ranking
        const positionCandidates = rankingsByPosition[positions[0]];
        return (
          <div className="flex flex-col flex-1 overflow-hidden">
            <RankingTab
              candidates={positionCandidates}
              selectedCandidateId={selectedRankingCandidate}
              onCandidateSelect={handleRankingCandidateSelect}
              onRemoveFromRanking={handleRemoveFromRanking}
            />
          </div>
        );
      }

      // Multiple positions - show position selector
      if (!selectedPosition) {
        return (
          <div className="flex flex-col flex-1 overflow-hidden">
            <PositionRankingSelector
              rankingsByPosition={rankingsByPosition}
              selectedPosition={selectedPosition}
              onPositionSelect={handlePositionSelect}
            />
          </div>
        );
      }

      // Show ranking for selected position
      const positionCandidates = rankingsByPosition[selectedPosition] || [];
      return (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ranking: {selectedPosition}
                </h3>
                <p className="text-sm text-gray-600">
                  {positionCandidates.length} candidates
                </p>
              </div>
              <button
                onClick={() => setSelectedPosition(null)}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Change Position
              </button>
            </div>
          </div>
          <RankingTab
            candidates={positionCandidates}
            selectedCandidateId={selectedRankingCandidate}
            onCandidateSelect={handleRankingCandidateSelect}
            onRemoveFromRanking={handleRemoveFromRanking}
          />
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left navigation sidebar */}
      <FilterSidebar
        expandedFilters={expandedFilters}
        toggleFilter={toggleFilter}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        filterCounts={filterCounts}
        availableJobs={availableJobs}
        stageConfigs={filteredStageConfigs}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <CandidateHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={
            activeTab === "candidates"
              ? searchQuery
              : activeTab === "notes"
              ? notesSearchQuery
              : searchQuery
          }
          onSearchChange={
            activeTab === "candidates"
              ? setSearchQuery
              : activeTab === "notes"
              ? setNotesSearchQuery
              : setSearchQuery
          }
          candidatesCount={filteredAndSortedCandidates.length}
          notesCount={filteredNoteCandidates.length}
          rankingCount={Object.values(rankingsByPosition).reduce(
            (total, candidates) => total + candidates.length,
            0
          )}
        />
        {renderMainContent()}
      </div>

      {/* Sidebar details panel - use applicationId for note lookup */}
      {selectedCandidateData && (
        <CandidateDetail
          candidate={selectedCandidateData}
          onClose={closeSidebar}
          onAction={handleCandidateAction}
          note={candidateNotes[selectedCandidateData.applicationId] || ""}
          onSaveNote={(candidateId, note) =>
            handleSaveNote(selectedCandidateData.applicationId, note)
          }
        />
      )}

      {/* Notes Edit Modal - use applicationId */}
      <NotesEditModal
        isOpen={isNotesModalOpen}
        candidate={editingCandidate}
        currentNote={
          editingCandidate
            ? candidateNotes[editingCandidate.applicationId] || ""
            : ""
        }
        onClose={handleCloseNotesModal}
        onSave={(candidateId, note) =>
          handleSaveNoteFromModal(editingCandidate?.applicationId || "", note)
        }
      />
      {/* Add ranking modal at the end of your JSX */}
      <RankingModal
        candidate={(() => {
          // Find the candidate from the selected position
          if (selectedPosition && rankingsByPosition[selectedPosition]) {
            return (
              rankingsByPosition[selectedPosition].find(
                (c) => c.id === selectedRankingCandidate
              ) || null
            );
          }
          // Fallback to searching all positions
          for (const candidates of Object.values(rankingsByPosition)) {
            const found = candidates.find(
              (c) => c.id === selectedRankingCandidate
            );
            if (found) return found;
          }
          return null;
        })()}
        isOpen={isRankingModalOpen}
        onClose={() => {
          setIsRankingModalOpen(false);
          setSelectedRankingCandidate(null);
        }}
        rank={(() => {
          // Calculate rank within the selected position
          if (selectedPosition && rankingsByPosition[selectedPosition]) {
            const sortedCandidates = [
              ...rankingsByPosition[selectedPosition],
            ].sort((a, b) => b.assessment - a.assessment);
            return (
              sortedCandidates.findIndex(
                (c) => c.id === selectedRankingCandidate
              ) + 1
            );
          }
          return 1; // Fallback
        })()}
      />
    </div>
  );
}

// Export the component wrapped with authentication
export default withHiringAuth(CandidatesPage);

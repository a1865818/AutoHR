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
import { JobGrid } from "@/components/candidates/JobGrid";

import { useHiringAuth } from "@/hooks/useHiringAuth";
import {
  Candidate,
  CandidateWithJobDetails,
  CandidateStage,
  Job,
} from "@/interfaces";
import { candidateRankingService } from "@/services/candidateRankingService";
import { candidateService } from "@/services/candidateService";
import { jobService } from "@/services/jobService";
import {
  DynamicCandidateFilterUtils,
  InterviewStageConfig,
  useDynamicStageConfigs,
} from "@/utils/dynamicInterviewStageConfig";
import { StageManager } from "@/utils/stageManager";

import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
  Users,
  Trophy,
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
    position: true,
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

  // NEW: State for jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Load jobs on component mount
  useEffect(() => {
    const loadJobs = async () => {
      if (!companyId) {
        setJobs([]);
        setJobsLoading(false);
        return;
      }

      setJobsLoading(true);
      try {
        // Use getAllJobs with "Active" status and companyId to filter for active jobs only
        const jobsData = await jobService.getAllJobs("Active", companyId);
        if (jobsData && Array.isArray(jobsData)) {
          const convertedJobs = jobsData.map((apiJob: any) => {
            // Ensure the API job has the correct field names for conversion
            const normalizedApiJob = {
              ...apiJob,
              // Handle both camelCase and PascalCase field names from backend
              applicantCount:
                apiJob.applicantCount || apiJob.ApplicantCount || 0,
              viewCount: apiJob.viewCount || apiJob.ViewCount || 0,
            };
            const convertedJob =
              jobService.convertApiJobToJob(normalizedApiJob);
            return convertedJob;
          });
          setJobs(convertedJobs);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setJobsLoading(false);
      }
    };

    loadJobs();
  }, [companyId]);

  // Load candidates from the backend
  const loadCandidates = async () => {
    // Only load candidates if a job is selected
    if (!selectedJob) {
      setCandidates([]);
      return;
    }

    setLoading(true);
    try {
      // Use the correct endpoint for getting candidates by job
      const candidateData = await candidateService.getCandidatesForJob(
        selectedJob
      );
      setCandidates(candidateData);

      // Set company name from the first candidate if available
      if (candidateData.length > 0 && candidateData[0].company) {
        setCompanyName(candidateData[0].company);
      }

      // Calculate filter counts using the proper utility function
      const filterCounts = DynamicCandidateFilterUtils.calculateFilterCounts(
        candidateData,
        activeFilters
      );

      setFilterCounts(filterCounts);
    } catch (err) {
      console.error("Error loading candidates:", err);
      setError("Failed to load candidates. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Reload candidates when selected job changes
  useEffect(() => {
    loadCandidates();
  }, [selectedJob]);

  // Recalculate filter counts when candidates or active filters change
  useEffect(() => {
    if (candidates.length > 0) {
      console.log(
        "🔍 Recalculating filter counts for",
        candidates.length,
        "candidates"
      );
      console.log(
        "🔍 Sample candidates:",
        candidates.slice(0, 3).map((c) => ({
          name: c.name,
          status: c.status,
          stage: c.stage,
          jobId: c.jobId,
        }))
      );

      const filterCounts = DynamicCandidateFilterUtils.calculateFilterCounts(
        candidates,
        activeFilters
      );

      console.log("🔍 Calculated filter counts:", filterCounts);
      setFilterCounts(filterCounts);
    }
  }, [candidates, activeFilters]);

  // Load rankings from the backend
  const loadRankingsFromBackend = async () => {
    // Only load rankings if a job is selected
    if (!selectedJob) return;

    setLoadingRankings(true);
    try {
      const response = await candidateRankingService.getRankings(
        companyId || "",
        selectedJob
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

        // Store ranking data for this position
        setRankingsByPosition((prev) => ({
          ...prev,
          [selectedJob]: rankingData,
        }));
      }
    } catch (err) {
      console.error("Error loading rankings:", err);
    } finally {
      setLoadingRankings(false);
    }
  };

  // Load rankings when the selected position changes
  useEffect(() => {
    loadRankingsFromBackend();
  }, [selectedJob]);

  // Handle job selection
  const handleJobSelect = (jobId: string) => {
    setSelectedJob(jobId);
    // When selecting a job, clear any selected candidate
    setSelectedCandidate(null);
    // Set the selected position to the jobId as well
    setSelectedPosition(jobId);
    // Reset pagination
    setCurrentPage(1);
    // Clear any selected candidates for ranking
    setSelectedForRanking([]);
    // Set active filters for that job if needed
    setActiveFilters({
      ...activeFilters,
      position: [jobId],
    });
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

    // Reset to first page when filters change
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
      const allCandidateIds = candidates.map((candidate) => candidate.id);
      setSelectedForRanking(allCandidateIds);
    } else {
      setSelectedForRanking([]);
    }
  };

  const handleGoToRanking = async () => {
    const selectedCandidates: CandidateWithJobDetails[] = candidates.filter(
      (c) => selectedForRanking.includes(c.id)
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
        if (candidate.stage === "Applied") {
          newStatus = "In Progress";
          newStage = "Phone Screening"; // Move to first interview stage
        } else if (candidate.stage === "Offer") {
          newStatus = "Hired";
          newStage = "Offer"; // Keep stage as Offer, status becomes Hired
        } else {
          // For any interview stage, move to next stage or to Offer
          const stageOrder = StageManager.getStageOrder();
          const currentIndex = stageOrder.indexOf(candidate.stage);
          if (currentIndex !== -1 && currentIndex < stageOrder.length - 1) {
            newStatus = "In Progress";
            newStage = stageOrder[currentIndex + 1];
          } else {
            newStatus = "In Progress";
            newStage = "Offer";
          }
        }
      } else {
        newStatus = "Rejected";
        newStage = candidate.stage; // Keep current stage when rejecting
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
        ...notes,
        [candidateId]: note, // Use applicationId consistently
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

      // Delete from backend database
      await candidateService.deleteCandidateNote(candidateId);

      // Update local state using applicationId
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
    // Find the full candidate data with job details
    const fullCandidateData = candidates.find((c) => c.id === candidate.id);
    setEditingCandidate(fullCandidateData || candidate);
    setNotesEditModalOpen(true);
  };

  const handleCloseNotesModal = () => {
    setNotesEditModalOpen(false);
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
  };

  // Get candidates with notes using applicationId
  const candidatesWithNotes = useMemo(() => {
    const withNotes = candidates.filter((candidate) => {
      // Use applicationId to check for notes
      const hasNote = notes[candidate.applicationId];
      return hasNote && hasNote.trim() !== "";
    });
    return withNotes;
  }, [candidates, notes]);

  // Filter notes based on search and active filters
  const filteredNoteCandidates = useMemo(() => {
    let filtered = candidatesWithNotes;

    // Apply search filter
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
  }, [candidatesWithNotes, searchQuery, notes, activeFilters]);

  // Calculate pagination for notes
  const totalNotes = filteredNoteCandidates.length;
  const totalNotesPages = Math.ceil(totalNotes / candidatesPerPage);
  const notesStartIndex = (currentPage - 1) * candidatesPerPage;
  const notesEndIndex = notesStartIndex + candidatesPerPage;
  const paginatedNoteCandidates = filteredNoteCandidates.slice(
    notesStartIndex,
    notesEndIndex
  );

  // Filter and sort candidates using local filtering
  const filteredAndSortedCandidates: CandidateWithJobDetails[] = useMemo(() => {
    if (stageConfigsLoading || stageConfigs.length === 0) {
      return []; // Return empty while loading stage configs
    }

    let filtered = candidates;

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

  // Calculate counts for each tab with respect to current filters
  const candidatesCount = filteredAndSortedCandidates.length;
  const notesCount = filteredAndSortedCandidates.filter(
    (c) => notes[c.applicationId] && notes[c.applicationId].trim() !== ""
  ).length;
  const rankingCount = Object.values(rankingsByPosition).reduce(
    (total, candidates) => total + candidates.length,
    0
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

  // Show all stage configs instead of only those with candidates
  const filteredStageConfigs = useMemo(() => {
    // Return all stage configs instead of filtering
    return stageConfigs;
  }, [stageConfigs]);

  // Return back to the job selection grid
  const handleBackToJobs = () => {
    setSelectedJob(null);
    setSelectedCandidate(null);
  };

  // Render the UI
  if (!isAuthorized) {
    return null;
  }

  // Show job grid if no job is selected
  if (!selectedJob) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-50">
        <div className="px-6 py-4 bg-white border-b">
          <h1 className="text-xl font-semibold text-gray-900">
            Candidates by Job
          </h1>
          <p className="text-gray-600 text-sm">
            Select a job to view its candidates
          </p>
        </div>

        {jobsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            type="no-jobs"
            companyName={companyName}
            onCreateJob={() => (window.location.href = "/create-job")}
          />
        ) : (
          <div className="flex-1 p-6 overflow-y-auto">
            <JobGrid
              jobs={jobs}
              onJobSelect={handleJobSelect}
              showStats={true}
            />
          </div>
        )}
      </div>
    );
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
                availableJobs={
                  selectedJob
                    ? [
                        {
                          id: selectedJob,
                          title:
                            jobs.find((j) => j.id === selectedJob)?.title ||
                            "Selected Job",
                          department: jobs.find((j) => j.id === selectedJob)
                            ?.department,
                        },
                      ]
                    : []
                }
                stageConfigs={filteredStageConfigs}
                onClearFilters={clearFilters}
              />
              <div className="flex-1 overflow-hidden flex flex-col">
                <CandidateHeader
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  candidatesCount={candidatesCount}
                  notesCount={notesCount}
                  rankingCount={rankingCount}
                />
                <EmptyState type="no-jobs" companyName={companyName} />
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
                availableJobs={
                  selectedJob
                    ? [
                        {
                          id: selectedJob,
                          title:
                            jobs.find((j) => j.id === selectedJob)?.title ||
                            "Selected Job",
                          department: jobs.find((j) => j.id === selectedJob)
                            ?.department,
                        },
                      ]
                    : []
                }
                stageConfigs={filteredStageConfigs}
                onClearFilters={clearFilters}
              />
              <div className="flex-1 overflow-hidden flex flex-col">
                <CandidateHeader
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  candidatesCount={candidatesCount}
                  notesCount={notesCount}
                  rankingCount={rankingCount}
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

  // Main render for when a job is selected and candidates are available
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header with back button and job title */}
      <div className="px-6 py-4 bg-white border-b flex items-center">
        <button
          onClick={handleBackToJobs}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Candidates for{" "}
            {jobs.find((j) => j.id === selectedJob)?.title || "Selected Job"}
          </h1>
          <p className="text-gray-600 text-sm">
            {filteredAndSortedCandidates.length} candidates
          </p>
        </div>
      </div>

      {/* Tabs and Search - Moved to top */}
      <CandidateHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        candidatesCount={candidatesCount}
        notesCount={notesCount}
        rankingCount={rankingCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Filter sidebar */}
        <FilterSidebar
          expandedFilters={{
            status: expandedFilters.status,
            stage: expandedFilters.stage,
            position: false, // Hide position filter since job is already selected
          }}
          toggleFilter={toggleFilter}
          activeFilters={{
            ...activeFilters,
            position: [], // Don't show any position filters
          }}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          filterCounts={filterCounts}
          availableJobs={
            selectedJob
              ? [
                  {
                    id: selectedJob,
                    title:
                      jobs.find((j) => j.id === selectedJob)?.title ||
                      "Selected Job",
                    department: jobs.find((j) => j.id === selectedJob)
                      ?.department,
                  },
                ]
              : []
          }
          stageConfigs={stageConfigs}
          hidePositionFilter={true} // Hide the position section
        />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === "candidates" && (
            <div className="flex-1 flex overflow-hidden">
              {/* Candidates list */}
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

              {/* Candidate details sidebar */}
              {selectedCandidate &&
                (() => {
                  const candidateData = filteredAndSortedCandidates.find(
                    (c) => c.id === selectedCandidate
                  );
                  return candidateData ? (
                    <div className="w-96 bg-white border-l overflow-auto">
                      <CandidateDetail
                        candidate={candidateData}
                        onClose={closeSidebar}
                        onAction={(
                          candidateId: string,
                          action: "approve" | "decline"
                        ) => handleCandidateAction(candidateId, action)}
                        onSaveNote={handleSaveNote}
                        note={notes[candidateData.applicationId] || ""}
                      />
                    </div>
                  ) : null;
                })()}
            </div>
          )}

          {/* Notes tab */}
          {activeTab === "notes" && (
            <NotesList
              candidates={filteredAndSortedCandidates.filter(
                (c) =>
                  notes[c.applicationId] && notes[c.applicationId].trim() !== ""
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

          {/* Ranking tab */}
          {activeTab === "ranking" && (
            <RankingTab
              candidates={rankingsByPosition[selectedPosition || ""] || []}
              selectedCandidateId={selectedRankingCandidate}
              onCandidateSelect={handleRankingCandidateSelect}
              onRemoveFromRanking={handleRemoveFromRanking}
            />
          )}
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
            rankingsByPosition[selectedPosition || ""]?.findIndex(
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
    </div>
  );
}

export default withHiringAuth(CandidatesPage);

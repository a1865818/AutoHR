// "use client";

// import { withHiringAuth } from "@/components/auth/WithHiringAuth";
// import { CandidateDetail } from "@/components/candidates/CandidateDetail";
// import { CandidateHeader } from "@/components/candidates/CandidateHeader";
// import { CandidatesList } from "@/components/candidates/CandidatesList";
// import { FilterSidebar } from "@/components/candidates/FilterSidebar";
// import { NotesList } from "@/components/candidates/NotesList";
// import { useHiringAuth } from "@/hooks/useHiringAuth";
// import { CandidateWithJobDetails } from "@/interfaces";
// import { candidateService } from "@/services/candidateService";
// import { useEffect, useMemo, useState } from "react";

// function CandidatesPage() {
//   const { isAuthorized, companyId, user } = useHiringAuth();
//   const [candidates, setCandidates] = useState<CandidateWithJobDetails[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
//     null
//   );
//   const [activeTab, setActiveTab] = useState<"candidates" | "notes">(
//     "candidates"
//   );
//   const [searchQuery, setSearchQuery] = useState("");
//   const [sortBy, setSortBy] = useState<{
//     field: "name" | "company" | "assessment" | "stage" | "status";
//     direction: "asc" | "desc";
//   }>({ field: "name", direction: "asc" });

//   // Filter states
//   const [expandedFilters, setExpandedFilters] = useState({
//     status: true,
//     stage: true,
//   });

//   const [activeFilters, setActiveFilters] = useState({
//     favorites: [] as string[],
//     status: ["in-progress"],
//     stage: ["applied", "interview", "offer"],
//   });

//   // Customizable favorites
//   const [favoriteFilters, setFavoriteFilters] = useState<
//     Array<{
//       id: string;
//       label: string;
//       type: "status" | "stage";
//     }>
//   >([
//     { id: "in-progress", label: "In Progress", type: "status" as const },
//     { id: "hired", label: "Hired", type: "status" as const },
//     { id: "disqualified", label: "Disqualified", type: "status" as const },
//   ]);

//   // Notes state - now stored locally but can be persisted to backend
//   const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>(
//     {}
//   );
//   const [notesSearchQuery, setNotesSearchQuery] = useState("");

//   // Load candidates data
//   useEffect(() => {
//     if (!isAuthorized || !companyId) {
//       return;
//     }

//     const loadCandidates = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         console.log("🔄 Loading candidates for company:", companyId);
//         const response = await candidateService.getCandidatesForCompany();

//         console.log("✅ Candidates loaded:", response.candidates.length);
//         setCandidates(response.candidates);

//         // Load any existing notes from localStorage (you can change this to backend later)
//         const savedNotes = localStorage.getItem(`candidate_notes_${companyId}`);
//         if (savedNotes) {
//           try {
//             setCandidateNotes(JSON.parse(savedNotes));
//           } catch (e) {
//             console.warn("Failed to parse saved notes:", e);
//           }
//         }
//       } catch (err) {
//         console.error("❌ Failed to load candidates:", err);
//         setError(
//           err instanceof Error ? err.message : "Failed to load candidates"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadCandidates();
//   }, [isAuthorized, companyId]);

//   // Calculate filter counts based on real candidates data
//   const filterCounts = useMemo(() => {
//     const counts = {
//       favorites: {} as Record<string, number>,
//       status: {
//         "in-progress": 0,
//         hired: 0,
//         disqualified: 0,
//       },
//       stage: {
//         applied: 0,
//         interview: 0,
//         offer: 0,
//       },
//     };

//     // Count by status and stage
//     candidates.forEach((candidate) => {
//       // Count for status filters
//       const status = (candidate.status?.toLowerCase().replace(" ", "-") ||
//         "in-progress") as keyof typeof counts.status;
//       if (counts.status[status] !== undefined) {
//         counts.status[status]++;
//       }

//       // Count for stage filters
//       const stage = candidate.stage.toLowerCase() as keyof typeof counts.stage;
//       if (stage in counts.stage) {
//         counts.stage[stage]++;
//       }
//     });

//     // Calculate favorite counts based on current favorite filters
//     favoriteFilters.forEach((favorite) => {
//       if (favorite.type === "status") {
//         counts.favorites[favorite.id] =
//           counts.status[favorite.id as keyof typeof counts.status] || 0;
//       } else if (favorite.type === "stage") {
//         counts.favorites[favorite.id] =
//           counts.stage[favorite.id as keyof typeof counts.stage] || 0;
//       }
//     });

//     return counts;
//   }, [candidates, favoriteFilters]);

//   const handleCandidateClick = (candidateId: string) => {
//     setSelectedCandidate(candidateId);
//   };

//   const closeSidebar = () => {
//     setSelectedCandidate(null);
//   };

//   const toggleFilter = (filterType: "status" | "stage") => {
//     setExpandedFilters((prev) => ({
//       ...prev,
//       [filterType]: !prev[filterType],
//     }));
//   };

//   const handleFilterChange = (
//     filterType: "favorites" | "status" | "stage",
//     filterId: string,
//     checked: boolean
//   ) => {
//     setActiveFilters((prev) => ({
//       ...prev,
//       [filterType]: checked
//         ? [...prev[filterType], filterId]
//         : prev[filterType].filter((id) => id !== filterId),
//     }));
//   };

//   const handleFavoriteToggle = (filterId: string) => {
//     const favorite = favoriteFilters.find((f) => f.id === filterId);
//     if (favorite) {
//       const isCurrentlyActive =
//         favorite.type === "status"
//           ? activeFilters.status.includes(filterId)
//           : activeFilters.stage.includes(filterId);

//       if (isCurrentlyActive) {
//         if (favorite.type === "status") {
//           handleFilterChange("status", filterId, false);
//         } else if (favorite.type === "stage") {
//           handleFilterChange("stage", filterId, false);
//         }
//         setActiveFilters((prev) => ({ ...prev, favorites: [] }));
//       } else {
//         setActiveFilters((prev) => ({
//           ...prev,
//           status: [],
//           stage: [],
//           favorites: [filterId],
//         }));

//         if (favorite.type === "status") {
//           handleFilterChange("status", filterId, true);
//         } else if (favorite.type === "stage") {
//           handleFilterChange("stage", filterId, true);
//         }
//       }
//     }
//   };

//   const handleAddFavorite = (
//     filterId: string,
//     label: string,
//     type: "status" | "stage"
//   ) => {
//     if (!favoriteFilters.find((f) => f.id === filterId)) {
//       setFavoriteFilters((prev) => [...prev, { id: filterId, label, type }]);
//     }
//   };

//   const handleRemoveFavorite = (filterId: string) => {
//     setFavoriteFilters((prev) => prev.filter((f) => f.id !== filterId));
//     const favorite = favoriteFilters.find((f) => f.id === filterId);
//     if (favorite) {
//       if (favorite.type === "status") {
//         handleFilterChange("status", filterId, false);
//       } else if (favorite.type === "stage") {
//         handleFilterChange("stage", filterId, false);
//       }
//       setActiveFilters((prev) => ({
//         ...prev,
//         favorites: prev.favorites.filter((id) => id !== filterId),
//       }));
//     }
//   };

//   const clearFilters = () => {
//     setActiveFilters({
//       favorites: [],
//       status: [],
//       stage: [],
//     });
//   };

//   const handleSort = (
//     field: "name" | "company" | "assessment" | "stage" | "status"
//   ) => {
//     setSortBy((prev) => ({
//       field,
//       direction:
//         prev.field === field && prev.direction === "asc" ? "desc" : "asc",
//     }));
//   };

//   const handleCandidateAction = async (
//     candidateId: string,
//     action: "approve" | "decline"
//   ) => {
//     try {
//       const candidate = candidates.find((c) => c.id === candidateId);
//       if (!candidate) return;

//       let newStatus: "In Progress" | "Hired" | "Disqualified";
//       let newStage: "Applied" | "Interview" | "Offer" | undefined;

//       if (action === "approve") {
//         if (candidate.stage === "Applied") {
//           newStatus = "In Progress";
//           newStage = "Interview";
//         } else if (candidate.stage === "Interview") {
//           newStatus = "In Progress";
//           newStage = "Offer";
//         } else if (candidate.stage === "Offer") {
//           newStatus = "Hired";
//           newStage = undefined; // Keep current stage
//         } else {
//           newStatus = "In Progress";
//         }
//       } else {
//         newStatus = "Disqualified";
//       }

//       // Update backend
//       await candidateService.updateCandidateStatus(
//         candidate.applicationId,
//         newStatus,
//         newStage
//       );

//       // Update local state
//       setCandidates((prev) =>
//         prev.map((c) => {
//           if (c.id === candidateId) {
//             return {
//               ...c,
//               status: newStatus,
//               stage: newStage || c.stage,
//             };
//           }
//           return c;
//         })
//       );

//       setSelectedCandidate(null);

//       // Show success message
//       console.log(`✅ Candidate ${action}d successfully`);
//     } catch (error) {
//       console.error(`❌ Failed to ${action} candidate:`, error);
//       // You could show an error toast here
//       alert(`Failed to ${action} candidate. Please try again.`);
//     }
//   };

//   const handleSaveNote = async (candidateId: string, note: string) => {
//     try {
//       const candidate = candidates.find((c) => c.id === candidateId);
//       if (!candidate) return;

//       // Save to backend (you can implement this later)
//       // await candidateService.saveCandidateNote(candidate.applicationId, note);

//       // Update local state
//       const newNotes = {
//         ...candidateNotes,
//         [candidateId]: note,
//       };
//       setCandidateNotes(newNotes);

//       // Save to localStorage for now (replace with backend call later)
//       if (companyId) {
//         localStorage.setItem(
//           `candidate_notes_${companyId}`,
//           JSON.stringify(newNotes)
//         );
//       }

//       console.log("✅ Note saved successfully");
//     } catch (error) {
//       console.error("❌ Failed to save note:", error);
//       alert("Failed to save note. Please try again.");
//     }
//   };

//   const handleDeleteNote = (candidateId: string) => {
//     const newNotes = { ...candidateNotes };
//     delete newNotes[candidateId];
//     setCandidateNotes(newNotes);

//     // Update localStorage
//     if (companyId) {
//       localStorage.setItem(
//         `candidate_notes_${companyId}`,
//         JSON.stringify(newNotes)
//       );
//     }
//   };

//   // Get candidates with notes for the notes tab
//   const candidatesWithNotes = useMemo(() => {
//     return candidates.filter((candidate) => candidateNotes[candidate.id]);
//   }, [candidates, candidateNotes]);

//   // Filter notes based on search
//   const filteredNoteCandidates = useMemo(() => {
//     if (!notesSearchQuery) return candidatesWithNotes;

//     return candidatesWithNotes.filter(
//       (candidate) =>
//         candidate.name.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
//         candidate.company
//           .toLowerCase()
//           .includes(notesSearchQuery.toLowerCase()) ||
//         candidateNotes[candidate.id]
//           ?.toLowerCase()
//           .includes(notesSearchQuery.toLowerCase())
//     );
//   }, [candidatesWithNotes, notesSearchQuery, candidateNotes]);

//   // Filter and sort candidates
//   const filteredAndSortedCandidates = useMemo(() => {
//     let filtered = candidates;

//     // Apply search filter
//     if (searchQuery) {
//       filtered = filtered.filter(
//         (candidate) =>
//           candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           candidate.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           (candidate.role &&
//             candidate.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
//           candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     // Apply status filter
//     if (activeFilters.status.length > 0) {
//       filtered = filtered.filter((candidate) =>
//         activeFilters.status.includes(
//           candidate.status?.toLowerCase().replace(" ", "-") || "in-progress"
//         )
//       );
//     }

//     // Apply stage filter
//     if (activeFilters.stage.length > 0) {
//       filtered = filtered.filter((candidate) =>
//         activeFilters.stage.includes(candidate.stage.toLowerCase())
//       );
//     }

//     // Apply sorting
//     filtered.sort((a, b) => {
//       let aValue: string | number;
//       let bValue: string | number;

//       switch (sortBy.field) {
//         case "name":
//           aValue = a.name;
//           bValue = b.name;
//           break;
//         case "company":
//           aValue = a.company;
//           bValue = b.company;
//           break;
//         case "assessment":
//           aValue = a.assessment;
//           bValue = b.assessment;
//           break;
//         case "stage":
//           aValue = a.stage;
//           bValue = b.stage;
//           break;
//         case "status":
//           aValue = a.status || "In Progress";
//           bValue = b.status || "In Progress";
//           break;
//         default:
//           aValue = a.name;
//           bValue = b.name;
//       }

//       if (typeof aValue === "string" && typeof bValue === "string") {
//         const comparison = aValue.localeCompare(bValue);
//         return sortBy.direction === "asc" ? comparison : -comparison;
//       } else if (typeof aValue === "number" && typeof bValue === "number") {
//         const comparison = aValue - bValue;
//         return sortBy.direction === "asc" ? comparison : -comparison;
//       }

//       return 0;
//     });

//     return filtered;
//   }, [candidates, searchQuery, activeFilters, sortBy]);

//   // Get selected candidate data
//   const selectedCandidateData = candidates.find(
//     (candidate) => candidate.id === selectedCandidate
//   );

//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading candidates...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center max-w-md mx-auto p-6">
//           <div className="text-red-500 text-6xl mb-4">⚠️</div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">
//             Error Loading Candidates
//           </h2>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Left navigation sidebar */}
//       <FilterSidebar
//         expandedFilters={expandedFilters}
//         toggleFilter={toggleFilter}
//         activeFilters={activeFilters}
//         onFilterChange={handleFilterChange}
//         onFavoriteToggle={handleFavoriteToggle}
//         onAddFavorite={handleAddFavorite}
//         onRemoveFavorite={handleRemoveFavorite}
//         onClearFilters={clearFilters}
//         filterCounts={filterCounts}
//         favoriteFilters={favoriteFilters}
//       />

//       {/* Main content area */}
//       <div className="flex-1 overflow-hidden flex flex-col">
//         <CandidateHeader
//           activeTab={activeTab}
//           onTabChange={setActiveTab}
//           searchQuery={
//             activeTab === "candidates" ? searchQuery : notesSearchQuery
//           }
//           onSearchChange={
//             activeTab === "candidates" ? setSearchQuery : setNotesSearchQuery
//           }
//           candidatesCount={
//             activeTab === "candidates"
//               ? filteredAndSortedCandidates.length
//               : filteredNoteCandidates.length
//           }
//           notesCount={candidatesWithNotes.length}
//         />
//         {activeTab === "candidates" ? (
//           <CandidatesList
//             candidates={filteredAndSortedCandidates}
//             selectedCandidate={selectedCandidate}
//             onCandidateClick={handleCandidateClick}
//             sortBy={sortBy}
//             onSort={handleSort}
//           />
//         ) : (
//           <NotesList
//             candidates={filteredNoteCandidates}
//             notes={candidateNotes}
//             selectedCandidate={selectedCandidate}
//             onCandidateClick={handleCandidateClick}
//             onDeleteNote={handleDeleteNote}
//           />
//         )}
//       </div>

//       {/* Sidebar details panel */}
//       {selectedCandidateData && (
//         <CandidateDetail
//           candidate={selectedCandidateData}
//           onClose={closeSidebar}
//           onAction={handleCandidateAction}
//           note={candidateNotes[selectedCandidateData.id] || ""}
//           onSaveNote={handleSaveNote}
//         />
//       )}
//     </div>
//   );
// }

// export default withHiringAuth(CandidatesPage);

"use client";

import { withHiringAuth } from "@/components/auth/WithHiringAuth";
import { CandidateDetail } from "@/components/candidates/CandidateDetail";
import { CandidateHeader } from "@/components/candidates/CandidateHeader";
import { CandidatesList } from "@/components/candidates/CandidatesList";
import { EmptyState } from "@/components/candidates/EmptyStates";
import { FilterSidebar } from "@/components/candidates/FilterSidebar";
import { NotesList } from "@/components/candidates/NotesList";
import { useHiringAuth } from "@/hooks/useHiringAuth";
import { CandidateWithJobDetails } from "@/interfaces";
import { candidateService } from "@/services/candidateService";
import { useEffect, useMemo, useState } from "react";

function CandidatesPage() {
  const { isAuthorized, companyId, user } = useHiringAuth();
  const [candidates, setCandidates] = useState<CandidateWithJobDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("your company");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"candidates" | "notes">(
    "candidates"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<{
    field: "name" | "company" | "assessment" | "stage" | "status";
    direction: "asc" | "desc";
  }>({ field: "name", direction: "asc" });

  // Filter states
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    stage: true,
  });

  const [activeFilters, setActiveFilters] = useState({
    favorites: [] as string[],
    status: ["in-progress"],
    stage: ["applied", "interview", "offer"],
  });

  // Customizable favorites
  const [favoriteFilters, setFavoriteFilters] = useState<
    Array<{
      id: string;
      label: string;
      type: "status" | "stage";
    }>
  >([
    { id: "in-progress", label: "In Progress", type: "status" as const },
    { id: "hired", label: "Hired", type: "status" as const },
    { id: "disqualified", label: "Disqualified", type: "status" as const },
  ]);

  // Notes state
  const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>(
    {}
  );
  const [notesSearchQuery, setNotesSearchQuery] = useState("");

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

        // Load any existing notes from localStorage
        const savedNotes = localStorage.getItem(`candidate_notes_${companyId}`);
        if (savedNotes) {
          try {
            setCandidateNotes(JSON.parse(savedNotes));
          } catch (e) {
            console.warn("Failed to parse saved notes:", e);
          }
        }
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

  // Calculate filter counts based on real candidates data
  const filterCounts = useMemo(() => {
    const counts = {
      favorites: {} as Record<string, number>,
      status: {
        "in-progress": 0,
        hired: 0,
        disqualified: 0,
      },
      stage: {
        applied: 0,
        interview: 0,
        offer: 0,
      },
    };

    // Count by status and stage
    candidates.forEach((candidate) => {
      // Count for status filters
      const status = (candidate.status?.toLowerCase().replace(" ", "-") ||
        "in-progress") as keyof typeof counts.status;
      if (counts.status[status] !== undefined) {
        counts.status[status]++;
      }

      // Count for stage filters
      const stage = candidate.stage.toLowerCase() as keyof typeof counts.stage;
      if (stage in counts.stage) {
        counts.stage[stage]++;
      }
    });

    // Calculate favorite counts based on current favorite filters
    favoriteFilters.forEach((favorite) => {
      if (favorite.type === "status") {
        counts.favorites[favorite.id] =
          counts.status[favorite.id as keyof typeof counts.status] || 0;
      } else if (favorite.type === "stage") {
        counts.favorites[favorite.id] =
          counts.stage[favorite.id as keyof typeof counts.stage] || 0;
      }
    });

    return counts;
  }, [candidates, favoriteFilters]);

  const handleCandidateClick = (candidateId: string) => {
    setSelectedCandidate(candidateId);
  };

  const closeSidebar = () => {
    setSelectedCandidate(null);
  };

  const toggleFilter = (filterType: "status" | "stage") => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const handleFilterChange = (
    filterType: "favorites" | "status" | "stage",
    filterId: string,
    checked: boolean
  ) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType], filterId]
        : prev[filterType].filter((id) => id !== filterId),
    }));
  };

  const handleFavoriteToggle = (filterId: string) => {
    const favorite = favoriteFilters.find((f) => f.id === filterId);
    if (favorite) {
      const isCurrentlyActive =
        favorite.type === "status"
          ? activeFilters.status.includes(filterId)
          : activeFilters.stage.includes(filterId);

      if (isCurrentlyActive) {
        if (favorite.type === "status") {
          handleFilterChange("status", filterId, false);
        } else if (favorite.type === "stage") {
          handleFilterChange("stage", filterId, false);
        }
        setActiveFilters((prev) => ({ ...prev, favorites: [] }));
      } else {
        setActiveFilters((prev) => ({
          ...prev,
          status: [],
          stage: [],
          favorites: [filterId],
        }));

        if (favorite.type === "status") {
          handleFilterChange("status", filterId, true);
        } else if (favorite.type === "stage") {
          handleFilterChange("stage", filterId, true);
        }
      }
    }
  };

  const handleAddFavorite = (
    filterId: string,
    label: string,
    type: "status" | "stage"
  ) => {
    if (!favoriteFilters.find((f) => f.id === filterId)) {
      setFavoriteFilters((prev) => [...prev, { id: filterId, label, type }]);
    }
  };

  const handleRemoveFavorite = (filterId: string) => {
    setFavoriteFilters((prev) => prev.filter((f) => f.id !== filterId));
    const favorite = favoriteFilters.find((f) => f.id === filterId);
    if (favorite) {
      if (favorite.type === "status") {
        handleFilterChange("status", filterId, false);
      } else if (favorite.type === "stage") {
        handleFilterChange("stage", filterId, false);
      }
      setActiveFilters((prev) => ({
        ...prev,
        favorites: prev.favorites.filter((id) => id !== filterId),
      }));
    }
  };

  const clearFilters = () => {
    setActiveFilters({
      favorites: [],
      status: [],
      stage: [],
    });
  };

  const handleSort = (
    field: "name" | "company" | "assessment" | "stage" | "status"
  ) => {
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

      let newStatus: "In Progress" | "Hired" | "Disqualified";
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
        newStatus = "Disqualified";
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
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate) return;

      // Update local state
      const newNotes = {
        ...candidateNotes,
        [candidateId]: note,
      };
      setCandidateNotes(newNotes);

      // Save to localStorage for now
      if (companyId) {
        localStorage.setItem(
          `candidate_notes_${companyId}`,
          JSON.stringify(newNotes)
        );
      }

      console.log("✅ Note saved successfully");
    } catch (error) {
      console.error("❌ Failed to save note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  const handleDeleteNote = (candidateId: string) => {
    const newNotes = { ...candidateNotes };
    delete newNotes[candidateId];
    setCandidateNotes(newNotes);

    // Update localStorage
    if (companyId) {
      localStorage.setItem(
        `candidate_notes_${companyId}`,
        JSON.stringify(newNotes)
      );
    }
  };

  const handleCreateJob = () => {
    window.location.href = "/jobs/create";
  };

  const handleClearFilters = () => {
    setActiveFilters({
      favorites: [],
      status: [],
      stage: [],
    });
    setSearchQuery("");
    setNotesSearchQuery("");
  };

  // Get candidates with notes for the notes tab
  const candidatesWithNotes = useMemo(() => {
    return candidates.filter((candidate) => candidateNotes[candidate.id]);
  }, [candidates, candidateNotes]);

  // Filter notes based on search
  const filteredNoteCandidates = useMemo(() => {
    if (!notesSearchQuery) return candidatesWithNotes;

    return candidatesWithNotes.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
        candidate.company
          .toLowerCase()
          .includes(notesSearchQuery.toLowerCase()) ||
        candidateNotes[candidate.id]
          ?.toLowerCase()
          .includes(notesSearchQuery.toLowerCase())
    );
  }, [candidatesWithNotes, notesSearchQuery, candidateNotes]);

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates;

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

    // Apply status filter
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter((candidate) =>
        activeFilters.status.includes(
          candidate.status?.toLowerCase().replace(" ", "-") || "in-progress"
        )
      );
    }

    // Apply stage filter
    if (activeFilters.stage.length > 0) {
      filtered = filtered.filter((candidate) =>
        activeFilters.stage.includes(candidate.stage.toLowerCase())
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
        case "assessment":
          aValue = a.assessment;
          bValue = b.assessment;
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

    return filtered;
  }, [candidates, searchQuery, activeFilters, sortBy]);

  // Get selected candidate data
  const selectedCandidateData = candidates.find(
    (candidate) => candidate.id === selectedCandidate
  );

  // Loading state
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
                onFavoriteToggle={handleFavoriteToggle}
                onAddFavorite={handleAddFavorite}
                onRemoveFavorite={handleRemoveFavorite}
                onClearFilters={clearFilters}
                filterCounts={filterCounts}
                favoriteFilters={favoriteFilters}
              />
              <div className="flex-1 overflow-hidden flex flex-col">
                <CandidateHeader
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  candidatesCount={0}
                  notesCount={0}
                />
                <EmptyState
                  type="no-jobs"
                  companyName={companyName}
                  onCreateJob={handleCreateJob}
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
                onFavoriteToggle={handleFavoriteToggle}
                onAddFavorite={handleAddFavorite}
                onRemoveFavorite={handleRemoveFavorite}
                onClearFilters={clearFilters}
                filterCounts={filterCounts}
                favoriteFilters={favoriteFilters}
              />
              <div className="flex-1 overflow-hidden flex flex-col">
                <CandidateHeader
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  candidatesCount={0}
                  notesCount={0}
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
        <CandidatesList
          candidates={filteredAndSortedCandidates}
          selectedCandidate={selectedCandidate}
          onCandidateClick={handleCandidateClick}
          sortBy={sortBy}
          onSort={handleSort}
        />
      );
    } else {
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
        <NotesList
          candidates={filteredNoteCandidates}
          notes={candidateNotes}
          selectedCandidate={selectedCandidate}
          onCandidateClick={handleCandidateClick}
          onDeleteNote={handleDeleteNote}
        />
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
        onFavoriteToggle={handleFavoriteToggle}
        onAddFavorite={handleAddFavorite}
        onRemoveFavorite={handleRemoveFavorite}
        onClearFilters={clearFilters}
        filterCounts={filterCounts}
        favoriteFilters={favoriteFilters}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <CandidateHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={
            activeTab === "candidates" ? searchQuery : notesSearchQuery
          }
          onSearchChange={
            activeTab === "candidates" ? setSearchQuery : setNotesSearchQuery
          }
          candidatesCount={
            activeTab === "candidates"
              ? filteredAndSortedCandidates.length
              : filteredNoteCandidates.length
          }
          notesCount={candidatesWithNotes.length}
        />
        {renderMainContent()}
      </div>

      {/* Sidebar details panel */}
      {selectedCandidateData && (
        <CandidateDetail
          candidate={selectedCandidateData}
          onClose={closeSidebar}
          onAction={handleCandidateAction}
          note={candidateNotes[selectedCandidateData.id] || ""}
          onSaveNote={handleSaveNote}
        />
      )}
    </div>
  );
}

// Export the component wrapped with authentication
export default withHiringAuth(CandidatesPage);

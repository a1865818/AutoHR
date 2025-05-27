"use client";

import { CandidateDetail } from "@/components/candidates/CandidateDetail";
import { CandidateHeader } from "@/components/candidates/CandidateHeader";
import { CandidatesList } from "@/components/candidates/CandidatesList";
import { FilterSidebar } from "@/components/candidates/FilterSidebar";
import { NotesList } from "@/components/candidates/NotesList";
import { Candidate } from "@/interfaces";
import { useMemo, useState } from "react";

// Sample candidate data
const initialCandidates: Candidate[] = [
  {
    id: "1",
    name: "Josephine Torres",
    photo: "/api/placeholder/32/32",
    company: "Figma",
    companyLogo: "/api/placeholder/24/24",
    assessment: 100,
    stage: "Applied",
    status: "Qualified",
  },
  {
    id: "2",
    name: "Mitchell Santos",
    photo: "/api/placeholder/32/32",
    role: "UI/UX designer at Mailchimp",
    company: "Mailchimp",
    companyLogo: "/api/placeholder/24/24",
    assessment: 80,
    stage: "Interview",
    status: "Qualified",
  },
  {
    id: "3",
    name: "Fred Bowen",
    photo: "/api/placeholder/32/32",
    company: "Intercom",
    companyLogo: "/api/placeholder/24/24",
    assessment: 50,
    stage: "Interview",
    status: "Qualified",
  },
  {
    id: "4",
    name: "Keith Morgan",
    photo: "/api/placeholder/32/32",
    company: "Stripe",
    companyLogo: "/api/placeholder/24/24",
    assessment: 80,
    stage: "Hired",
    status: "Qualified",
  },
  {
    id: "5",
    name: "Rena Johnston",
    photo: "/api/placeholder/32/32",
    company: "Microsoft",
    companyLogo: "/api/placeholder/24/24",
    assessment: 25,
    stage: "Hired",
    status: "Qualified",
  },
  {
    id: "6",
    name: "Flora Russell",
    photo: "/api/placeholder/32/32",
    company: "Spotify",
    companyLogo: "/api/placeholder/24/24",
    assessment: 80,
    stage: "Interview",
    status: "Qualified",
  },
  {
    id: "7",
    name: "Andre Lyons",
    photo: "/api/placeholder/32/32",
    company: "Atlassian",
    companyLogo: "/api/placeholder/24/24",
    assessment: 100,
    stage: "Offer",
    status: "Qualified",
  },
  {
    id: "8",
    name: "Fred Bowen",
    photo: "/api/placeholder/32/32",
    company: "Dropbox",
    companyLogo: "/api/placeholder/24/24",
    assessment: 72,
    stage: "Applied",
    status: "Qualified",
  },
  {
    id: "9",
    name: "Josie Fowler",
    photo: "/api/placeholder/32/32",
    company: "Amazon",
    companyLogo: "/api/placeholder/24/24",
    assessment: 64,
    stage: "Hired",
    status: "Qualified",
  },
  {
    id: "10",
    name: "Gabriel Frazier",
    photo: "/api/placeholder/32/32",
    company: "Facebook",
    companyLogo: "/api/placeholder/24/24",
    assessment: 100,
    stage: "Applied",
    status: "Qualified",
  },
];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"candidates" | "notes">(
    "candidates"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<{
    field: "name" | "company" | "assessment" | "stage";
    direction: "asc" | "desc";
  }>({ field: "name", direction: "asc" });

  // Filter states
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    stage: true,
  });

  const [activeFilters, setActiveFilters] = useState({
    favorites: [] as string[], // Will only hold max 1 item
    status: ["qualified"],
    stage: ["hired", "applied", "interview", "offer"],
  });

  // Customizable favorites - users can add/remove these
  const [favoriteFilters, setFavoriteFilters] = useState([
    { id: "qualified", label: "Qualified", type: "status" as const },
    { id: "hired", label: "Hired", type: "stage" as const },
    { id: "disqualified", label: "Disqualified", type: "status" as const },
  ]);

  // Notes state
  const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>({
    "1": "Excellent portfolio with strong UX research background. Shows great attention to detail in design systems.",
    "2": "Good technical skills but needs improvement in user research methodology. Solid Figma expertise.",
    "7": "Outstanding problem-solving skills and team collaboration. Ready for senior role.",
  });

  const [notesSearchQuery, setNotesSearchQuery] = useState("");

  // Calculate filter counts based on all candidates
  const filterCounts = useMemo(() => {
    const counts = {
      favorites: {} as Record<string, number>,
      status: {
        qualified: 0,
        new: 0,
        disqualified: 0,
      },
      stage: {
        hired: 0,
        applied: 0,
        interview: 0,
        "phone-interview": 0,
        offer: 0,
        evaluation: 0,
      },
    };

    // Count by status and stage
    candidates.forEach((candidate) => {
      // Count for status filters
      const status = (candidate.status?.toLowerCase() ||
        "qualified") as keyof typeof counts.status;
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
    // For favorites, only allow one selection at a time
    const favorite = favoriteFilters.find((f) => f.id === filterId);
    if (favorite) {
      const isCurrentlyActive =
        favorite.type === "status"
          ? activeFilters.status.includes(filterId)
          : activeFilters.stage.includes(filterId);

      if (isCurrentlyActive) {
        // If currently active, deactivate it
        if (favorite.type === "status") {
          handleFilterChange("status", filterId, false);
        } else if (favorite.type === "stage") {
          handleFilterChange("stage", filterId, false);
        }
        setActiveFilters((prev) => ({ ...prev, favorites: [] }));
      } else {
        // Clear all current filters first, then activate the selected one
        setActiveFilters((prev) => ({
          ...prev,
          status: [],
          stage: [],
          favorites: [filterId],
        }));

        // Then activate the selected filter
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
    // Also remove from active filters if it was selected
    const favorite = favoriteFilters.find((f) => f.id === filterId);
    if (favorite) {
      if (favorite.type === "status") {
        handleFilterChange("status", filterId, false);
      } else if (favorite.type === "stage") {
        handleFilterChange("stage", filterId, false);
      }
      // Clear from favorites active list
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

  const handleSort = (field: "name" | "company" | "assessment" | "stage") => {
    setSortBy((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleCandidateAction = (
    candidateId: string,
    action: "approve" | "decline"
  ) => {
    setCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id === candidateId) {
          if (action === "approve") {
            // Move to next stage or hire
            const nextStage =
              candidate.stage === "Applied"
                ? "Interview"
                : candidate.stage === "Interview"
                ? "Offer"
                : candidate.stage === "Offer"
                ? "Hired"
                : "Hired";
            return { ...candidate, stage: nextStage };
          } else {
            // Decline candidate
            return { ...candidate, status: "Disqualified" };
          }
        }
        return candidate;
      })
    );
    setSelectedCandidate(null);
  };

  const handleSaveNote = (candidateId: string, note: string) => {
    setCandidateNotes((prev) => ({
      ...prev,
      [candidateId]: note,
    }));
  };

  const handleDeleteNote = (candidateId: string) => {
    setCandidateNotes((prev) => {
      const newNotes = { ...prev };
      delete newNotes[candidateId];
      return newNotes;
    });
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
            candidate.role.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter((candidate) =>
        activeFilters.status.includes(
          candidate.status?.toLowerCase() || "qualified"
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
      <div className="flex-1 overflow-hidden">
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
        {activeTab === "candidates" ? (
          <CandidatesList
            candidates={filteredAndSortedCandidates}
            selectedCandidate={selectedCandidate}
            onCandidateClick={handleCandidateClick}
            sortBy={sortBy}
            onSort={handleSort}
          />
        ) : (
          <NotesList
            candidates={filteredNoteCandidates}
            notes={candidateNotes}
            selectedCandidate={selectedCandidate}
            onCandidateClick={handleCandidateClick}
            onDeleteNote={handleDeleteNote}
          />
        )}
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

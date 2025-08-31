import { Candidate } from "@/interfaces";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trophy,
  Users,
} from "lucide-react";
import { CandidateCard } from "./CandidateCard";

interface CandidatesListProps {
  candidates: Candidate[];
  selectedCandidate: string | null;
  selectedForRanking: string[];
  rankedCandidates: Set<string>;
  onCandidateClick: (candidateId: string) => void;
  onRankingSelect: (candidateId: string, selected: boolean) => void;
  onSelectAllForRanking: (selected: boolean) => void;
  onGoToRanking: () => void;
  sortBy: {
    field: "name" | "stage" | "status";
    direction: "asc" | "desc";
  };
  onSort: (field: "name" | "stage" | "status") => void;
}

export function CandidatesList({
  candidates,
  selectedCandidate,
  selectedForRanking,
  rankedCandidates,
  onCandidateClick,
  onRankingSelect,
  onSelectAllForRanking,
  onGoToRanking,
  sortBy,
  onSort,
}: CandidatesListProps) {
  const getSortIcon = (field: "name" | "stage" | "status") => {
    if (sortBy.field !== field) {
      return <ChevronDown className="ml-1 h-3 w-3 text-gray-400" />;
    }
    return sortBy.direction === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 text-[#066046]" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-[#066046]" />
    );
  };

  const allSelected =
    candidates.length > 0 &&
    candidates.every((c) => selectedForRanking.includes(c.id));
  const someSelected = selectedForRanking.length > 0 && !allSelected;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Bulk Actions Header */}
      <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={(e) => onSelectAllForRanking(e.target.checked)}
              className="h-4 w-4 text-[#066046] rounded border-gray-300 focus:ring-[#066046]"
            />
            <span className="text-sm text-gray-700">
              Select All for Ranking
            </span>
          </label>
          {selectedForRanking.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedForRanking.length} selected
              </span>
              <button
                onClick={onGoToRanking}
                className="inline-flex items-center px-3 py-1.5 bg-[#066046] text-white text-sm rounded-md hover:bg-[#267a54] transition-colors"
              >
                <Trophy className="h-4 w-4 mr-1" />
                Add to Ranking
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          <Users className="h-4 w-4 inline mr-1" />
          {candidates.length} candidates
        </div>
      </div>

      {/* Table header */}
      <div className="px-6 flex-shrink-0">
        <div className="grid grid-cols-7 py-2 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-1 flex items-center">Rank</div>
          <div className="col-span-4 flex items-center">
            <button
              onClick={() => onSort("name")}
              className={`flex items-center hover:text-gray-700 transition-colors ${
                sortBy.field === "name" ? "text-gray-500" : ""
              }`}
            >
              Name {getSortIcon("name")}
            </button>
          </div>
          <div className="col-span-1 flex items-center">
            <button
              onClick={() => onSort("stage")}
              className={`flex items-center hover:text-gray-700 transition-colors ${
                sortBy.field === "stage" ? "text-[#066046]" : ""
              }`}
            >
              Stage {getSortIcon("stage")}
            </button>
          </div>
          <div className="col-span-1 flex items-center">
            <button
              onClick={() => onSort("status")}
              className={`flex items-center hover:text-gray-700 transition-colors ${
                sortBy.field === "status" ? "text-[#066046]" : ""
              }`}
            >
              Status {getSortIcon("status")}
            </button>
          </div>
        </div>
      </div>

      {/* Candidate list */}
      <div
        id="candidates-list-container"
        className="flex-1 overflow-y-auto px-6"
      >
        {candidates.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="text-sm">No candidates found</p>
              <p className="text-xs mt-1">
                Try adjusting your filters or search query
              </p>
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidate === candidate.id}
                isSelectedForRanking={selectedForRanking.includes(candidate.id)}
                isRanked={rankedCandidates.has(candidate.applicationId)}
                onClick={onCandidateClick}
                onRankingSelect={onRankingSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

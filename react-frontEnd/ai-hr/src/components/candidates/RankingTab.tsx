import { CandidateWithJobDetails } from "@/interfaces";
import { Award, Crown, Medal, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AssessmentIcon } from "./AssessmentIcon";

interface RankingTabProps {
  candidates: CandidateWithJobDetails[];
  selectedCandidateId: string | null;
  onCandidateSelect: (candidateId: string) => void;
  onRemoveFromRanking: (candidateId: string) => void;
}

export function RankingTab({
  candidates,
  selectedCandidateId,
  onCandidateSelect,
  onRemoveFromRanking,
}: RankingTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Sort candidates by assessment score for ranking
  const rankedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.assessment - a.assessment);
  }, [candidates]);

  // Pagination
  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rankedCandidates.slice(startIndex, startIndex + pageSize);
  }, [rankedCandidates, currentPage]);

  const totalPages = Math.ceil(rankedCandidates.length / pageSize);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-blue-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  return (
    <div className="px-6 space-y-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Candidate Rankings
          </h3>
          <p className="text-sm text-gray-600">
            Top performers ranked by AI assessment score
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {rankedCandidates.length} candidates in ranking
        </div>
      </div>

      {/* Ranking List - Scrollable Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 pb-4">
          {paginatedCandidates.map((candidate, index) => {
            const globalRank = (currentPage - 1) * pageSize + index + 1;
            const isSelected = selectedCandidateId === candidate.id;

            // Calculate quick stats (mock AI analysis for now)
            const skillMatch = Math.min(
              100,
              candidate.assessment + Math.floor(Math.random() * 10) - 5
            );
            const experienceMatch = Math.min(
              100,
              candidate.assessment + Math.floor(Math.random() * 8) - 4
            );
            const cultureMatch = Math.min(
              100,
              candidate.assessment + Math.floor(Math.random() * 6) - 3
            );
            const educationMatch = Math.min(
              100,
              candidate.assessment + Math.floor(Math.random() * 5) - 2
            );

            return (
              <div
                key={candidate.id}
                onClick={() => onCandidateSelect(candidate.id)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : `${getRankColor(globalRank)} hover:border-gray-300`
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank Badge */}
                  <div className="flex flex-col items-center">
                    {getRankIcon(globalRank)}
                    <span className="text-sm font-bold text-gray-700 mt-1">
                      #{globalRank}
                    </span>
                  </div>

                  {/* Candidate Info */}
                  <div className="flex items-center space-x-3 flex-1">
                    <img
                      src={
                        candidate.photo ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          candidate.name
                        )}&size=48&background=e5e7eb&color=374151&rounded=true`
                      }
                      alt={candidate.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {candidate.name}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {candidate.role || candidate.jobTitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        {candidate.company}
                      </p>
                    </div>
                  </div>

                  {/* Assessment Icon (same as candidate tab) */}
                  <div className="flex items-center">
                    <AssessmentIcon score={candidate.assessment} />
                  </div>

                  {/* Quick Stats */}
                  <div className="hidden md:flex space-x-4 text-sm text-gray-600">
                    <div className="text-center">
                      <div className="font-medium">{skillMatch}%</div>
                      <div className="text-xs">Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{experienceMatch}%</div>
                      <div className="text-xs">Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{cultureMatch}%</div>
                      <div className="text-xs">Culture</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{educationMatch}%</div>
                      <div className="text-xs">Education</div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromRanking(candidate.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove from ranking"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${candidate.assessment}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {rankedCandidates.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Candidates in Ranking
            </h3>
            <p className="text-gray-600 mb-4">
              Select candidates from the Candidates tab to start ranking
            </p>
          </div>
        )}
      </div>

      {/* Pagination - Fixed at bottom */}
      {rankedCandidates.length > pageSize && (
        <div className="flex justify-center mt-6 flex-shrink-0 py-4 border-t bg-white">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? "bg-blue-500 text-white"
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default RankingTab;

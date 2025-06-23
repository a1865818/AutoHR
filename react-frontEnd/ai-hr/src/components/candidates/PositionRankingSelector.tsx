import { CandidateWithJobDetails } from "@/interfaces";
import { Briefcase, ChevronRight, Trophy, Users } from "lucide-react";
import { useMemo } from "react";

interface JobPosition {
  id: string;
  title: string;
  department?: string;
  candidateCount: number;
}

interface PositionRankingSelectorProps {
  rankingsByPosition: Record<string, CandidateWithJobDetails[]>;
  selectedPosition: string | null;
  onPositionSelect: (positionId: string) => void;
}

export function PositionRankingSelector({
  rankingsByPosition,
  selectedPosition,
  onPositionSelect,
}: PositionRankingSelectorProps) {
  // Generate position list from ranking data
  const positions = useMemo(() => {
    const positionMap = new Map<string, JobPosition>();

    Object.entries(rankingsByPosition).forEach(([positionId, candidates]) => {
      if (candidates.length > 0) {
        const firstCandidate = candidates[0];
        positionMap.set(positionId, {
          id: positionId,
          title: firstCandidate.jobTitle || "Unknown Position",
          department: firstCandidate.jobDepartment,
          candidateCount: candidates.length,
        });
      }
    });

    return Array.from(positionMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [rankingsByPosition]);

  if (positions.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Position Rankings Yet
        </h3>
        <p className="text-gray-600 mb-4">
          Add candidates to ranking from the Candidates tab to start creating
          position-based rankings
        </p>
        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💡 How it works
          </h4>
          <ul className="text-xs text-blue-700 space-y-1 text-left">
            <li>
              Select candidates from the same position in the Candidates tab
            </li>
            <li>
              Click &quot;Add to Ranking&quot; to create position-specific
              rankings
            </li>
            <li> Compare candidates fairly within the same role</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Position Rankings
          </h3>
          <p className="text-sm text-gray-600">
            Select a position to view candidate rankings
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {positions.length} position{positions.length !== 1 ? "s" : ""} with
          rankings
        </div>
      </div>

      {/* Position List */}
      <div className="space-y-3">
        {positions.map((position) => {
          const isSelected = selectedPosition === position.id;
          const topCandidate = rankingsByPosition[position.id]?.sort(
            (a, b) => b.assessment - a.assessment
          )[0];

          return (
            <div
              key={position.id}
              onClick={() => onPositionSelect(position.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {position.title}
                    </h4>
                    {position.department && (
                      <p className="text-sm text-gray-600">
                        {position.department}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="h-3 w-3 mr-1" />
                        {position.candidateCount} candidate
                        {position.candidateCount !== 1 ? "s" : ""}
                      </div>
                      {topCandidate && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                          Top: {topCandidate.name} ({topCandidate.assessment}%)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Quick stats for top 3 candidates */}
                  <div className="hidden md:flex space-x-1">
                    {rankingsByPosition[position.id]
                      ?.sort((a, b) => b.assessment - a.assessment)
                      .slice(0, 3)
                      .map((candidate, index) => (
                        <div
                          key={candidate.id}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium"
                          title={`${candidate.name} - ${candidate.assessment}%`}
                        >
                          {index + 1}
                        </div>
                      ))}
                  </div>

                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${
                      isSelected ? "rotate-90 text-blue-500" : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

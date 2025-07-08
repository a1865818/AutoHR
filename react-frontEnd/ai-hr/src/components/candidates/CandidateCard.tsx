import { Candidate } from "@/interfaces";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { StageTag } from "./StageTag";
import { StatusTag } from "./StatusTag";

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  isSelectedForRanking: boolean;
  isRanked: boolean;
  onClick: (candidateId: string) => void;
  onRankingSelect: (candidateId: string, selected: boolean) => void;
}

export function CandidateCard({
  candidate,
  isSelected,
  isSelectedForRanking,
  isRanked,
  onClick,
  onRankingSelect,
}: CandidateCardProps) {
  return (
    <div
      className={`grid grid-cols-7 py-3 border-b hover:bg-gray-50 cursor-pointer ${
        isSelected ? "bg-blue-50" : ""
      }`}
      onClick={() => onClick(candidate.id)}
    >
      {/* Ranking Selection Checkbox */}
      <div className="col-span-1 flex items-center">
        {isRanked ? (
          <div className="flex items-center space-x-1">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-gray-500">Ranked</span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRankingSelect(candidate.id, !isSelectedForRanking);
            }}
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            {isSelectedForRanking ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      <div className="col-span-4 flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
          <img
            src={candidate.photo}
            alt={candidate.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="ml-3">
          <div className="font-medium text-gray-900">{candidate.name}</div>
          {candidate.role && (
            <div className="text-xs text-gray-500">{candidate.role}</div>
          )}
        </div>
      </div>
      <div className="col-span-1 flex items-center">
        <StageTag stage={candidate.stage} />
      </div>
      <div className="col-span-1 flex items-center">
        <StatusTag status={candidate.status || "In Progress"} />
      </div>
    </div>
  );
}

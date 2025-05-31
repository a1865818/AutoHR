import { Candidate } from "@/interfaces";
import { AssessmentIcon } from "./AssessmentIcon";
import { StageTag } from "./StageTag";
import { StatusTag } from "./StatusTag";

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onClick: (candidateId: string) => void;
}

export function CandidateCard({
  candidate,
  isSelected,
  onClick,
}: CandidateCardProps) {
  return (
    <div
      className={`grid grid-cols-9 py-3 border-b hover:bg-gray-50 cursor-pointer ${
        isSelected ? "bg-blue-50" : ""
      }`}
      onClick={() => onClick(candidate.id)}
    >
      <div className="col-span-3 flex items-center">
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
      <div className="col-span-2 flex items-center">
        <div className="w-6 h-6 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
          <img
            src={candidate.companyLogo}
            alt={candidate.company}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="ml-2 text-gray-700">{candidate.company}</span>
      </div>
      <div className="col-span-1 flex items-center ">
        <AssessmentIcon score={candidate.assessment} />
      </div>
      <div className="col-span-1 flex items-center">
        <StageTag stage={candidate.stage} />
      </div>
      <div className="col-span-2 flex items-center">
        <StatusTag status={candidate.status || "In Progress"} />
      </div>
    </div>
  );
}

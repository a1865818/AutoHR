import { Candidate } from "@/interfaces";
import { ChevronDown } from "lucide-react";
import { CandidateCard } from "./CandidateCard";

interface CandidatesListProps {
  candidates: Candidate[];
  selectedCandidate: string | null;
  onCandidateClick: (candidateId: string) => void;
}

export function CandidatesList({
  candidates,
  selectedCandidate,
  onCandidateClick,
}: CandidatesListProps) {
  return (
    <>
      {/* Table header */}
      <div className="px-6">
        <div className="grid grid-cols-8 py-2 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3 flex items-center">
            Name <ChevronDown className="ml-1 h-3 w-3" />
          </div>
          <div className="col-span-2 flex items-center">
            Company <ChevronDown className="ml-1 h-3 w-3" />
          </div>
          <div className="col-span-2 flex items-center">
            Assessment <ChevronDown className="ml-1 h-3 w-3" />
          </div>
          <div className="col-span-1 flex items-center">Stage</div>
        </div>
      </div>

      {/* Candidate list */}
      <div
        className="px-6 overflow-y-auto"
        style={{ height: "calc(100vh - 200px)" }}
      >
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            isSelected={selectedCandidate === candidate.id}
            onClick={onCandidateClick}
          />
        ))}
      </div>
    </>
  );
}

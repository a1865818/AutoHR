// import { Candidate } from "@/interfaces";
// import { ChevronDown } from "lucide-react";
// import { CandidateCard } from "./CandidateCard";

// interface CandidatesListProps {
//   candidates: Candidate[];
//   selectedCandidate: string | null;
//   onCandidateClick: (candidateId: string) => void;
// }

// export function CandidatesList({
//   candidates,
//   selectedCandidate,
//   onCandidateClick,
// }: CandidatesListProps) {
//   return (
//     <>
//       {/* Table header */}
//       <div className="px-6">
//         <div className="grid grid-cols-8 py-2 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
//           <div className="col-span-3 flex items-center">
//             Name <ChevronDown className="ml-1 h-3 w-3" />
//           </div>
//           <div className="col-span-2 flex items-center">
//             Company <ChevronDown className="ml-1 h-3 w-3" />
//           </div>
//           <div className="col-span-2 flex items-center">
//             Assessment <ChevronDown className="ml-1 h-3 w-3" />
//           </div>
//           <div className="col-span-1 flex items-center">Stage</div>
//         </div>
//       </div>

//       {/* Candidate list */}
//       <div
//         className="px-6 overflow-y-auto"
//         style={{ height: "calc(100vh - 200px)" }}
//       >
//         {candidates.map((candidate) => (
//           <CandidateCard
//             key={candidate.id}
//             candidate={candidate}
//             isSelected={selectedCandidate === candidate.id}
//             onClick={onCandidateClick}
//           />
//         ))}
//       </div>
//     </>
//   );
// }
import { Candidate } from "@/interfaces";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CandidateCard } from "./CandidateCard";

interface CandidatesListProps {
  candidates: Candidate[];
  selectedCandidate: string | null;
  onCandidateClick: (candidateId: string) => void;
  sortBy: {
    field: "name" | "company" | "assessment" | "stage";
    direction: "asc" | "desc";
  };
  onSort: (field: "name" | "company" | "assessment" | "stage") => void;
}

export function CandidatesList({
  candidates,
  selectedCandidate,
  onCandidateClick,
  sortBy,
  onSort,
}: CandidatesListProps) {
  const getSortIcon = (field: "name" | "company" | "assessment" | "stage") => {
    if (sortBy.field !== field) {
      return <ChevronDown className="ml-1 h-3 w-3 text-gray-400" />;
    }
    return sortBy.direction === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 text-blue-500" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-blue-500" />
    );
  };

  return (
    <>
      {/* Table header */}
      <div className="px-6">
        <div className="grid grid-cols-8 py-2 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3 flex items-center">
            <button
              onClick={() => onSort("name")}
              className={`flex items-center hover:text-gray-700 transition-colors ${
                sortBy.field === "name" ? "text-blue-500" : ""
              }`}
            >
              Name {getSortIcon("name")}
            </button>
          </div>
          <div className="col-span-2 flex items-center">
            <button
              onClick={() => onSort("company")}
              className={`flex items-center hover:text-gray-700 transition-colors ${
                sortBy.field === "company" ? "text-blue-500" : ""
              }`}
            >
              Company {getSortIcon("company")}
            </button>
          </div>
          <div className="col-span-2 flex items-center">
            <button
              onClick={() => onSort("assessment")}
              className={`flex items-center hover:text-gray-700 transition-colors ${
                sortBy.field === "assessment" ? "text-blue-500" : ""
              }`}
            >
              Assessment {getSortIcon("assessment")}
            </button>
          </div>
          <div className="col-span-1 flex items-center">
            <button
              onClick={() => onSort("stage")}
              className={`flex items-center hover:text-gray-700 transition-colors ${
                sortBy.field === "stage" ? "text-blue-500" : ""
              }`}
            >
              Stage {getSortIcon("stage")}
            </button>
          </div>
        </div>
      </div>

      {/* Candidate list */}
      <div
        className="px-6 overflow-y-auto"
        style={{ height: "calc(100vh - 200px)" }}
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
          candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isSelected={selectedCandidate === candidate.id}
              onClick={onCandidateClick}
            />
          ))
        )}
      </div>
    </>
  );
}

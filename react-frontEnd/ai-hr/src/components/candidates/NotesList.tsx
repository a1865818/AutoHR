import { Candidate } from "@/interfaces";
import { Calendar, Edit3, Trash2, User, Briefcase } from "lucide-react";

interface NotesListProps {
  candidates: Candidate[];
  notes: Record<string, string>;
  selectedCandidate: string | null;
  onCandidateClick: (candidateId: string) => void;
  onDeleteNote: (candidateId: string) => void;
}

export function NotesList({
  candidates,
  notes,
  selectedCandidate,
  onCandidateClick,
  onDeleteNote,
}: NotesListProps) {
  const handleDeleteClick = (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      onDeleteNote(candidateId);
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Type guard to check if candidate has job details
  const hasJobDetails = (
    candidate: any
  ): candidate is Candidate & { jobTitle: string } => {
    return "jobTitle" in candidate;
  };

  //   const formatDate = (candidateId: string) => {
  //     // In a real app, you'd store the actual date when the note was created/updated
  //     return "2 days ago";
  //   };

  return (
    <div
      className="px-6 overflow-y-auto"
      style={{ height: "calc(100vh - 200px)" }}
    >
      {candidates.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No notes found</p>
            <p className="text-xs mt-1">
              Switch to Candidates tab and select a candidate to add notes
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          {candidates.map((candidate) => {
            const note = notes[candidate.id];
            const isSelected = selectedCandidate === candidate.id;

            return (
              <div
                key={candidate.id}
                onClick={() => onCandidateClick(candidate.id)}
                className={`p-5 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* Candidate header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                      <img
                        src={candidate.photo}
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base truncate">
                        {candidate.name}
                      </h3>
                      {/* Job Title with briefcase icon */}
                      {hasJobDetails(candidate) && candidate.jobTitle && (
                        <div className="flex items-center mt-1 text-sm text-blue-600">
                          <Briefcase className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="font-medium truncate">
                            {candidate.jobTitle}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span className="truncate">{candidate.company}</span>
                        <span className="mx-2 flex-shrink-0">•</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                            candidate.stage === "Offer"
                              ? "bg-blue-100 text-blue-700"
                              : candidate.stage === "Interview"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {candidate.stage}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCandidateClick(candidate.id);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit note"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, candidate.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Note content */}
                <div className="mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {truncateText(note)}
                  </p>
                </div>

                {/* Note metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Last updated today</span>
                  </div>
                  <span>{note.length} characters</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

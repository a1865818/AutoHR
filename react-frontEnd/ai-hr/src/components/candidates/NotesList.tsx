import { Candidate } from "@/interfaces";
import { Calendar, Edit3, Trash2, User } from "lucide-react";

interface NotesListProps {
  candidates: Candidate[];
  notes: Record<string, string>;
  selectedCandidate: string | null;
  onCandidateClick: (candidateId: string) => void;
  onDeleteNote: (candidateId: string) => void;
  onEditNote: (candidate: Candidate) => void;
}

export function NotesList({
  candidates,
  notes,
  selectedCandidate,
  onCandidateClick,
  onDeleteNote,
  onEditNote,
}: NotesListProps) {
  // FIXED: Use applicationId for delete operations
  const handleDeleteClick = (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      onDeleteNote(candidate.applicationId); // FIXED: Pass applicationId instead of candidate.id
    }
  };

  const handleEditClick = (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    onEditNote(candidate);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "Unknown time";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 168) {
      // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

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
            // FIXED: Get note using applicationId
            const note = notes[candidate.applicationId];
            const isSelected = selectedCandidate === candidate.id;

            // Get timestamp info
            const notesUpdatedAt = (candidate as any).notesUpdatedAt;
            const notesCreatedAt = (candidate as any).notesCreatedAt;
            const displayTime = notesUpdatedAt || notesCreatedAt;

            return (
              <div
                key={candidate.id}
                onClick={() => onCandidateClick(candidate.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* Candidate header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                      <img
                        src={candidate.photo}
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">
                        {candidate.name}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{candidate.company}</span>
                        <span className="mx-2">•</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleEditClick(e, candidate)}
                      className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                      title="Edit note"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {/* FIXED: Pass entire candidate object to get applicationId */}
                    <button
                      onClick={(e) => handleDeleteClick(e, candidate)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Note content */}
                <div className="mb-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {truncateText(note)}
                  </p>
                </div>

                {/* Note metadata */}
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    {notesUpdatedAt && notesUpdatedAt !== notesCreatedAt
                      ? `Updated ${formatTimestamp(notesUpdatedAt)}`
                      : `Created ${formatTimestamp(notesCreatedAt)}`}
                  </span>
                  <span className="mx-2">•</span>
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

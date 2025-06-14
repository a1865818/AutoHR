import { Candidate } from "@/interfaces";
import { Calendar, Save, User, X } from "lucide-react";
import { useEffect, useState } from "react";

interface NotesEditModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  currentNote: string;
  onClose: () => void;
  onSave: (candidateId: string, note: string) => Promise<void>;
}

export function NotesEditModal({
  isOpen,
  candidate,
  currentNote,
  onClose,
  onSave,
}: NotesEditModalProps) {
  const [note, setNote] = useState(currentNote);
  const [isSaving, setIsSaving] = useState(false);

  // Update note when modal opens or candidate changes
  useEffect(() => {
    setNote(currentNote);
  }, [currentNote, isOpen]);

  const handleSave = async () => {
    if (!candidate) return;

    try {
      setIsSaving(true);
      // FIXED: Pass applicationId instead of candidate.id
      await onSave(candidate.applicationId, note);
      onClose();
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNote(currentNote); // Reset to original note
    onClose();
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "Never";

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

  if (!isOpen || !candidate) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden mr-3">
                <img
                  src={candidate.photo}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Note for {candidate.name}
                </h2>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <User className="h-4 w-4 mr-1" />
                  <span>
                    {candidate.role || "Candidate"} at {candidate.company}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Timestamp Info */}
            {(candidate as any).notesCreatedAt && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Created:{" "}
                    {formatTimestamp((candidate as any).notesCreatedAt)}
                    {(candidate as any).notesUpdatedAt &&
                      (candidate as any).notesUpdatedAt !==
                        (candidate as any).notesCreatedAt && (
                        <span className="ml-4">
                          Last updated:{" "}
                          {formatTimestamp((candidate as any).notesUpdatedAt)}
                        </span>
                      )}
                  </span>
                </div>
              </div>
            )}

            {/* Note Editor */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Hiring Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add your notes about this candidate..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              />

              {/* Character count */}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{note.length} characters</span>
                <div className="flex items-center space-x-1">
                  {note.length > 1000 && (
                    <span className="text-yellow-600">• Long note</span>
                  )}
                  {note.length > 2000 && (
                    <span className="text-red-600">• Very long note</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                💡 Note Tips
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Track interview feedback and key insights</li>
                <li>• Note strengths, concerns, or follow-up actions</li>
                <li>• Include salary expectations and availability</li>
                <li>• Share thoughts with your hiring team</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              {note !== currentNote && (
                <span className="text-yellow-600">• Unsaved changes</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || note === currentNote}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

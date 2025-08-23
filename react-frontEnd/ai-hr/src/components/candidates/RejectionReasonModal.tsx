import { rejectedCandidatesService } from "@/services/rejectedCandidatesService";
import { X, AlertCircle } from "lucide-react";
import { useState } from "react";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  onReject: (reason: string, notes?: string) => void;
}

export function RejectionReasonModal({
  isOpen,
  onClose,
  candidateId,
  onReject,
}: RejectionReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const commonReasons = rejectedCandidatesService.getCommonRejectionReasons();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reason = selectedReason === "Other" ? customReason : selectedReason;
    if (!reason.trim()) {
      const { toast } = await import("@/utils/toast");
      toast.error("Please select or enter a rejection reason.");
      return;
    }

    setSubmitting(true);
    try {
      await onReject(reason, rejectionNotes);
      onClose();
    } catch (error) {
      console.error("Failed to reject candidate:", error);
      const { toast } = await import("@/utils/toast");
      toast.error("Failed to reject candidate. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm transition-opacity duration-300 cursor-pointer hover:bg-gray-900/15"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-xl w-full transform transition-all duration-300 ease-in-out animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Reject Candidate
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Reason for rejection *
              </label>
              <div className="space-y-2">
                {commonReasons.map((reason) => (
                  <label key={reason} className="flex items-center">
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === "Other" && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please specify the reason..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional notes (optional)
              </label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Add any additional context or feedback for the candidate..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                These notes will be stored internally and can be referenced
                later.
              </p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Before rejecting this candidate:
                  </h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    <li>
                      • Make sure you've thoroughly reviewed their application
                    </li>
                    <li>
                      • Consider if they might be suitable for other positions
                    </li>
                    <li>• This action cannot be easily undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  !selectedReason ||
                  (selectedReason === "Other" && !customReason.trim())
                }
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Rejecting..." : "Reject Candidate"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

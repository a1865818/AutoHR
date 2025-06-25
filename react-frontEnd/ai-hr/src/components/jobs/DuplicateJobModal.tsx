import { JobDuplicateRequest } from "@/interfaces";
import { X } from "lucide-react";
import { useState } from "react";

interface DuplicateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (request: JobDuplicateRequest) => void;
  originalTitle: string;
  isLoading: boolean;
}

export function DuplicateJobModal({
  isOpen,
  onClose,
  onDuplicate,
  originalTitle,
  isLoading,
}: DuplicateJobModalProps) {
  const [newTitle, setNewTitle] = useState(`${originalTitle} (Copy)`);
  const [status, setStatus] = useState("Draft");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDuplicate({
      newTitle: newTitle.trim(),
      status,
      copyApplications: false,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Duplicate Job</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Job Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !newTitle.trim()}
            >
              {isLoading ? "Duplicating..." : "Duplicate Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

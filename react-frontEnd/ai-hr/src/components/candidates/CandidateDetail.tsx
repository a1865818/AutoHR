import { Candidate } from "@/interfaces";
import { Edit, Plus, X } from "lucide-react";

interface CandidateDetailProps {
  candidate: Candidate;
  onClose: () => void;
}

export function CandidateDetail({ candidate, onClose }: CandidateDetailProps) {
  return (
    <div className="w-80 border-l bg-white overflow-hidden flex flex-col">
      {/* Header with close button */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
            <img
              src={candidate.photo}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-3">
            <h2 className="font-medium text-gray-900">{candidate.name}</h2>
            <p className="text-xs text-gray-500">
              {candidate.role || `UI/UX designer at ${candidate.company}`}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b flex">
        <button className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
          Info
        </button>
        <button className="px-3 py-2 text-xs text-blue-500 border-b-2 border-blue-500 font-medium">
          Interview
        </button>
        <button className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
          Assessment
        </button>
        <button className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
          Files
        </button>
      </div>

      {/* Interview details */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1 */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium text-sm">
              15
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <h3 className="font-medium text-sm">1 Step - HR interview</h3>
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  <Edit className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-gray-500">11:30 AM - 12:30 PM</p>
            </div>
          </div>

          <div className="mt-4 pl-11">
            <h4 className="text-xs font-medium text-gray-500 mb-2">
              Interviewers
            </h4>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
                <img
                  src="/api/placeholder/24/24"
                  alt="Caroline Robertson"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="ml-2 text-xs font-medium">
                Caroline Robertson
              </span>
              <span className="ml-1 text-xs text-gray-500">HR Manager</span>
            </div>
          </div>

          <div className="mt-4 pl-11">
            <h4 className="text-xs font-medium text-gray-500 mb-2">
              Evaluation
            </h4>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">4</span>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-green-500 rounded"
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium text-sm">
              18
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <h3 className="font-medium text-sm">2 Step - Tech interview</h3>
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  <Edit className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-gray-500">1:30 PM - 2:30 PM</p>
            </div>
          </div>

          <div className="mt-4 pl-11">
            <h4 className="text-xs font-medium text-gray-500 mb-2">
              Interviewers
            </h4>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
                <img
                  src="/api/placeholder/24/24"
                  alt="Matthew Curry"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="ml-2 text-xs font-medium">Matthew Curry</span>
              <span className="ml-1 text-xs text-gray-500">
                TL of Design Department
              </span>
            </div>
            <button className="mt-2 flex items-center text-blue-500 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add specialist
            </button>
          </div>

          <div className="mt-4 pl-11">
            <h4 className="text-xs font-medium text-gray-500 mb-2">
              Evaluation
            </h4>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">3</span>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-yellow-500 rounded"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 mt-8">
          <button className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-50">
            Decline
          </button>
          <button className="flex-1 bg-blue-500 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-600">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

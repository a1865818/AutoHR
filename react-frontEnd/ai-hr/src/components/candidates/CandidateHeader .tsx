import { Search } from "lucide-react";

export function CandidateHeader() {
  return (
    <>
      {/* Header */}
      <div className="p-6 bg-white">
        <h1 className="text-xl font-semibold text-gray-800">
          Qualified candidates
        </h1>

        {/* Tabs */}
        <div className="flex mt-6 border-b">
          <button className="pb-2 px-4 text-sm font-medium border-b-2 border-blue-500 text-blue-500">
            Candidates{" "}
            <span className="ml-1 text-xs bg-blue-100 text-blue-500 px-2 py-0.5 rounded-full">
              26
            </span>
          </button>
          <button className="pb-2 px-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Notes{" "}
            <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              12
            </span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-6 py-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search candidates..."
          />
        </div>
      </div>
    </>
  );
}

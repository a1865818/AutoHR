import {
  ChevronLeft,
  NotebookIcon,
  Search,
  Trophy,
  User,
  UserX,
} from "lucide-react";

interface CandidateHeaderProps {
  activeTab: "candidates" | "notes" | "ranking" | "rejected";
  onTabChange: (tab: "candidates" | "notes" | "ranking" | "rejected") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  candidatesCount: number;
  notesCount?: number;
  rankingCount?: number;
  rejectedCount?: number;
  jobTitle?: string;
  onBackToJobs?: () => void;
  totalCandidates?: number;
}

export function CandidateHeader({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  candidatesCount,
  notesCount = 0,
  rankingCount = 0,
  rejectedCount = 0,
  jobTitle,
  onBackToJobs,
  totalCandidates,
}: CandidateHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="p-6 bg-white">
        <div className="flex items-center mb-4">
          {onBackToJobs && (
            <button
              onClick={onBackToJobs}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {jobTitle ? `Candidates for ${jobTitle}` : "Candidates"}
            </h1>
            {totalCandidates !== undefined && (
              <p className="text-gray-600 text-sm">
                {totalCandidates} candidates
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mt-6 border-b">
          <button
            onClick={() => onTabChange("candidates")}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors  flex items-center space-x-2${
              activeTab === "candidates"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            <span>Candidates </span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "candidates"
                  ? "bg-blue-100 text-blue-500"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {candidatesCount}
            </span>
          </button>
          <button
            onClick={() => onTabChange("notes")}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors   flex items-center space-x-2${
              activeTab === "notes"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <NotebookIcon className="h-4 w-4 mr-2" />
            <span>Notes </span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "notes"
                  ? "bg-blue-100 text-blue-500"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {notesCount}
            </span>
          </button>
          <button
            onClick={() => onTabChange("ranking")}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === "ranking"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Ranking</span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "ranking"
                  ? "bg-blue-100 text-blue-500"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {rankingCount}
            </span>
          </button>
          <button
            onClick={() => onTabChange("rejected")}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === "rejected"
                ? "border-red-500 text-red-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserX className="h-4 w-4" />
            <span>Rejected</span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "rejected"
                  ? "bg-red-100 text-red-500"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {rejectedCount}
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
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder={
              activeTab === "candidates"
                ? "Search candidates..."
                : activeTab === "notes"
                ? "Search notes..."
                : activeTab === "ranking"
                ? "Search rankings..."
                : "Search rejected candidates..."
            }
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

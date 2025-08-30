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
      <div className="bg-gradient-to-r from-[#066046]/5 to-[#267a54]/5 border border-[#066046]/10 rounded-xl p-8 mb-8 mx-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {onBackToJobs && (
              <button
                onClick={onBackToJobs}
                className="p-2 rounded-full hover:bg-[#066046]/10 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-[#066046]" />
              </button>
            )}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#066046]/10 rounded-lg">
                <svg
                  className="w-8 h-8 text-[#066046]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {jobTitle ? `${jobTitle}` : "Candidates"}
                </h1>
                {totalCandidates !== undefined && (
                  <p className="text-gray-600 text-base">
                    {totalCandidates} candidates
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mt-6 border-b">
          <button
            onClick={() => onTabChange("candidates")}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2${
              activeTab === "candidates"
                ? "border-[#066046] text-[#066046]"
                : "border-transparent text-gray-500 hover:text-[#066046]"
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            <span>Candidates </span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "candidates"
                  ? "bg-[#066046]/10 text-[#066046]"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {candidatesCount}
            </span>
          </button>
          <button
            onClick={() => onTabChange("notes")}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2${
              activeTab === "notes"
                ? "border-[#066046] text-[#066046]"
                : "border-transparent text-gray-500 hover:text-[#066046]"
            }`}
          >
            <NotebookIcon className="h-4 w-4 mr-2" />
            <span>Notes </span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "notes"
                  ? "bg-[#066046]/10 text-[#066046]"
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
                ? "border-[#066046] text-[#066046]"
                : "border-transparent text-gray-500 hover:text-[#066046]"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Ranking</span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "ranking"
                  ? "bg-[#066046]/10 text-[#066046]"
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
                ? "border-[#267a54] text-[#267a54]"
                : "border-transparent text-gray-500 hover:text-[#267a54]"
            }`}
          >
            <UserX className="h-4 w-4" />
            <span>Rejected</span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === "rejected"
                  ? "bg-[#267a54]/10 text-[#267a54]"
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#066046] focus:border-[#066046] transition-colors"
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

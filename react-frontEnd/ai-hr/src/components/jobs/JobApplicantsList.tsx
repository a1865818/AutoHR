import { CandidateWithJobDetails } from "@/interfaces";
import { candidateService } from "@/services/candidateService";
import {
  AlertCircle,
  Calendar,
  Loader2,
  Mail,
  User,
  FileText,
  DollarSign,
  Search,
  Filter,
  SortAsc,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

interface JobApplicantsListProps {
  jobId: string;
  onCandidateClick: (candidate: CandidateWithJobDetails) => void;
}

type SortField = "name" | "appliedAt" | "assessment" | "stage";
type SortDirection = "asc" | "desc";

export function JobApplicantsList({
  jobId,
  onCandidateClick,
}: JobApplicantsListProps) {
  const [candidates, setCandidates] = useState<CandidateWithJobDetails[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<
    CandidateWithJobDetails[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("appliedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobApplicants();
    }
  }, [jobId]);

  useEffect(() => {
    filterAndSortCandidates();
  }, [
    candidates,
    searchQuery,
    sortField,
    sortDirection,
    filterStage,
    filterStatus,
  ]);

  const loadJobApplicants = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 Loading applicants for job:", jobId);

      const applicants = await candidateService.getCandidatesForJob(jobId);
      console.log("✅ Raw applicants data:", applicants);

      // Process candidates to ensure they have proper name values
      const processedApplicants = applicants.map((candidate) => {
        console.log(`🔍 Processing candidate:`, candidate);

        // Try different ways to get the name
        let candidateName = candidate.name;

        if (!candidateName || candidateName.includes("Unknown")) {
          // Try to construct from individual fields
          const firstName = (candidate as any).firstName || "";
          const lastName = (candidate as any).lastName || "";

          if (firstName || lastName) {
            candidateName = `${firstName} ${lastName}`.trim();
          }
        }

        // If still no name, use fallback
        if (!candidateName || candidateName.includes("Unknown")) {
          candidateName = "Unknown Candidate";
        }

        console.log(`📝 Final name for candidate: "${candidateName}"`);

        return {
          ...candidate,
          name: candidateName,
          email: candidate.email || "No email provided",
          // Add currentPosition if not present
          currentPosition:
            (candidate as any).currentPosition ||
            (candidate as any).role ||
            "Position not specified",
        };
      });

      console.log("✅ Processed applicants:", processedApplicants.length);
      setCandidates(processedApplicants);
    } catch (err) {
      console.error("❌ Failed to load job applicants:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load applicants"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCandidates = () => {
    let filtered = [...candidates];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          (candidate.name?.toLowerCase() || '').includes(query) ||
          (candidate.email?.toLowerCase() || '').includes(query) 
      );
    }

    // Apply stage filter
    if (filterStage !== "all") {
      filtered = filtered.filter(
        (candidate) =>
          candidate.stage.toLowerCase() === filterStage.toLowerCase()
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (candidate) =>
          candidate.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "appliedAt":
          aValue = new Date(a.appliedAt).getTime();
          bValue = new Date(b.appliedAt).getTime();
          break;
        case "assessment":
          aValue = a.assessment;
          bValue = b.assessment;
          break;
        case "stage":
          aValue = a.stage.toLowerCase();
          bValue = b.stage.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredCandidates(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setShowSortDropdown(false);
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "interview":
        return "bg-yellow-100 text-yellow-800";
      case "offer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "hired":
        return "bg-green-100 text-green-800";
      case "disqualified":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return "Unknown";
    }
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return "Not specified";
    return `$${salary.toLocaleString()}`;
  };

  const getSortLabel = (field: SortField) => {
    const labels = {
      name: "Name",
      appliedAt: "Applied Date",
      assessment: "Assessment Score",
      stage: "Stage",
    };
    return labels[field];
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-gray-500">No applicants for this job yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search candidates..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Candidate list */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">No matching candidates found.</p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <div
              key={candidate.applicationId}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onCandidateClick(candidate)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar/Initials - using local rendering instead of ui-avatars.com service */}
                <div className="flex-shrink-0">
                  {candidate.photo && candidate.photo.startsWith("https://") && 
                   !candidate.photo.includes("ui-avatars.com") ? (
                    <Image
                      src={candidate.photo}
                      alt={`${candidate.name}`}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-xl text-gray-600 font-medium">
                      {getInitials(candidate.name)}
                    </div>
                  )}
                </div>

                {/* Candidate info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {candidate.name}
                      </h3>
                   
                    </div>

                    <div className="flex items-center gap-2">
                      {candidate.status && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            candidate.status === "Hired"
                              ? "bg-green-100 text-green-800"
                              : candidate.status === "Disqualified"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {candidate.status}
                        </span>
                      )}

                      {candidate.assessment && (
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${candidate.assessment}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs font-medium text-gray-700">
                            {Math.round(candidate.assessment)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {candidate.email || "No email"}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Applied {formatDate(candidate.appliedAt)}
                    </div>
                    {candidate.expectedSalary && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span>{formatSalary(candidate.expectedSalary)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

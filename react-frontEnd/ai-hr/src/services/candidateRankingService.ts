import { CandidateStage, CandidateWithJobDetails } from "@/interfaces";
import { toast } from "@/utils/toast";

interface AddCandidatesToRankingRequest {
  companyId: string;
  jobId: string;
  applicationIds: string[];
  rankedBy: string;
}

interface RemoveCandidateFromRankingRequest {
  companyId: string;
  jobId: string;
  applicationId: string;
}

interface UpdateRankingPositionRequest {
  companyId: string;
  jobId: string;
  applicationId: string;
  newPosition: number;
  newScore?: number;
  aiAnalysisData?: Record<string, unknown>;
}

interface CandidateRankingResponse {
  id: string;
  companyId: string;
  jobId: string;
  applicationId: string;
  candidateUserId: string;
  rankingScore: number;
  rankingPosition: number;
  aiAnalysisData?: Record<string, unknown>;
  isRanked: boolean;
  rankedBy: string;
  rankedAt: string;
  updatedAt: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhoto?: string;
  jobTitle: string;
  companyName: string;
  assessmentScore: number;
  stage: string;
  status: string;
}

interface RankingsByJobResponse {
  jobId: string;
  jobTitle: string;
  companyName: string;
  rankings: CandidateRankingResponse[];
  totalRanked: number;
  lastUpdated: string;
}

interface BulkRankingResponse {
  success: boolean;
  addedCount: number;
  skippedCount: number;
  errors: string[];
  message: string;
}

interface CheckRankedResponse {
  isRanked: boolean;
  ranking?: {
    jobId: string;
    rankingPosition: number;
    rankingScore: number;
    rankedAt: string;
  };
}

class CandidateRankingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
  }

  private getAuthData() {
    // NOTE: We intentionally check cookies first so that authentication works
    // across browser tabs. Only if a value is missing do we fall back to
    // localStorage / sessionStorage so that the old logic still works.

    if (typeof window === "undefined") {
      return {
        token: null,
        userId: null,
        userCategory: null,
        companyId: null,
      };
    }

    let token: string | null = null;
    let userId: string | null = null;
    let userCategory: string | null = null;
    let companyId: string | null = null;

    // ----------------------
    // 1) Try to read cookies
    // ----------------------
    const rawCookies = document.cookie ? document.cookie.split(";") : [];
    rawCookies.forEach((rawCookie) => {
      const cookie = rawCookie.trim();

      if (cookie.startsWith("authToken=")) {
        token = decodeURIComponent(cookie.substring("authToken=".length));
      } else if (cookie.startsWith("userData=")) {
        try {
          const userData = JSON.parse(
            decodeURIComponent(cookie.substring("userData=".length))
          );
          userId = userData.id ?? userData.userId ?? null;
          companyId = userData.companyId ?? null;
          userCategory = userData.userCategory ?? userData.role ?? null;
        } catch (err) {
          console.warn(
            "CandidateRankingService: failed to parse userData from cookie",
            err
          );
        }
      }
    });

    // ----------------------------------------------------
    // 2) Fallback to localStorage / sessionStorage if needed
    // ----------------------------------------------------
    if (!token) {
      token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
    }

    if (!userCategory) {
      userCategory =
        localStorage.getItem("userCategory") ||
        sessionStorage.getItem("userCategory");
    }

    if (!userId || !companyId) {
      const currentUserStr =
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          userId = userId || currentUser.id || null;
          companyId = companyId || currentUser.companyId || null;
        } catch (error) {
          console.warn(
            "CandidateRankingService: failed to parse currentUser from storage",
            error
          );
        }
      }
    }

    // Debug output so we can trace where the token was sourced from
    console.log("🔍 CandidateRankingService.getAuthData()", {
      fromCookie:
        !!token && !!rawCookies.find((c) => c.trim().startsWith("authToken=")),
      fromStorage:
        !!token && !rawCookies.find((c) => c.trim().startsWith("authToken=")),
      hasToken: !!token,
      userId,
      companyId,
    });

    return { token, userId, userCategory, companyId };
  }

  private getHeaders(): HeadersInit {
    const { token } = this.getAuthData();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Add candidates to ranking
  async addCandidatesToRanking(
    jobId: string,
    applicationIds: string[]
  ): Promise<BulkRankingResponse | null> {
    const { token, userId, companyId } = this.getAuthData();

    if (!token) {
      toast.error("Authentication required to rank candidates");
      return null;
    }

    if (!companyId) {
      toast.error("Company information not found");
      return null;
    }

    if (!userId) {
      toast.error("User information not found");
      return null;
    }

    console.log("📤 Adding candidates to ranking:", {
      jobId,
      applicationIds,
      companyId,
      rankedBy: userId,
    });

    try {
      const request: AddCandidatesToRankingRequest = {
        companyId,
        jobId,
        applicationIds,
        rankedBy: userId,
      };

      const response = await fetch(`${this.baseUrl}/candidates/rankings/add`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        toast.error(`Failed to add candidates to ranking: ${error}`);
        return null;
      }

      const result = await response.json();
      console.log("✅ Candidates added to ranking successfully:", result);
      toast.success(`Successfully added ${result.addedCount || applicationIds.length} candidates to ranking`);
      return result;
    } catch (error) {
      console.error("❌ Failed to add candidates to ranking:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add candidates to ranking";
      toast.error(errorMessage);
      return null;
    }
  }

  // Remove candidate from ranking
  async removeCandidateFromRanking(
    jobId: string,
    applicationId: string
  ): Promise<void | null> {
    const { token, companyId } = this.getAuthData();

    if (!token) {
      toast.error("Authentication required to remove candidates from ranking");
      return null;
    }

    if (!companyId) {
      toast.error("Company information not found");
      return null;
    }

    console.log("📤 Removing candidate from ranking:", {
      jobId,
      applicationId,
      companyId,
    });

    try {
      const request: RemoveCandidateFromRankingRequest = {
        companyId,
        jobId,
        applicationId,
      };

      const response = await fetch(
        `${this.baseUrl}/candidates/rankings/remove`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        toast.error(`Failed to remove candidate from ranking: ${error}`);
        return null;
      }

      console.log("✅ Candidate removed from ranking successfully");
      toast.success("Candidate removed from ranking successfully");
    } catch (error) {
      console.error("❌ Failed to remove candidate from ranking:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to remove candidate from ranking";
      toast.error(errorMessage);
      return null;
    }
  }

  // Update ranking position
  async updateRankingPosition(
    jobId: string,
    applicationId: string,
    newPosition: number,
    newScore?: number,
    aiAnalysisData?: Record<string, unknown>
  ): Promise<void | null> {
    const { token, companyId } = this.getAuthData();

    if (!token) {
      toast.error("Authentication required to update ranking");
      return null;
    }

    if (!companyId) {
      toast.error("Company information not found");
      return null;
    }

    console.log("📤 Updating ranking position:", {
      jobId,
      applicationId,
      newPosition,
      newScore,
      companyId,
    });

    try {
      const request: UpdateRankingPositionRequest = {
        companyId,
        jobId,
        applicationId,
        newPosition,
        newScore,
        aiAnalysisData,
      };

      const response = await fetch(
        `${this.baseUrl}/candidates/rankings/update`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        toast.error(`Failed to update ranking position: ${error}`);
        return null;
      }

      console.log("✅ Ranking position updated successfully");
      toast.success("Ranking position updated successfully");
    } catch (error) {
      console.error("❌ Failed to update ranking position:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update ranking position";
      toast.error(errorMessage);
      return null;
    }
  }

  // Get rankings by job
  async getRankingsByJob(jobId: string): Promise<RankingsByJobResponse | null> {
    const { token } = this.getAuthData();

    if (!token) {
      toast.error("Authentication required to view rankings");
      return null;
    }

    console.log("📤 Getting rankings for job:", jobId);

    try {
      const response = await fetch(
        `${this.baseUrl}/candidates/rankings/job/${jobId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        toast.error(`Failed to get rankings: ${error}`);
        return null;
      }

      const result = await response.json();
      console.log("✅ Rankings retrieved successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to get rankings:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load rankings";
      toast.error(errorMessage);
      return null;
    }
  }

  // Get rankings for all jobs in a company
  async getRankingsByCompany(): Promise<RankingsByJobResponse[]> {
    const { token, companyId } = this.getAuthData();

    if (!token) {
      toast.error("Authentication required to view company rankings");
      return [];
    }

    if (!companyId) {
      toast.error("Company information not found");
      return [];
    }

    console.log("📤 Fetching all rankings for company:", companyId);

    try {
      const response = await fetch(
        `${this.baseUrl}/candidates/rankings/company/${companyId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        const error = await response.text();
        toast.error(`Failed to fetch company rankings: ${error}`);
        return [];
      }

      const result = await response.json();
      console.log("✅ Company rankings fetched successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to fetch company rankings:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load company rankings";
      toast.error(errorMessage);
      return [];
    }
  }

  // Get rankings for a specific job and company
  async getRankings(companyId: string, jobId: string) {
    const { token } = this.getAuthData();

    if (!token) {
      toast.error("Authentication required to view rankings");
      return {
        success: false,
        data: [],
        error: "Authentication required",
      };
    }

    const actualCompanyId = companyId || this.getAuthData().companyId;

    if (!actualCompanyId) {
      toast.error("Company information is required");
      return {
        success: false,
        data: [],
        error: "Company ID is required",
      };
    }

    console.log("📤 Fetching rankings:", {
      jobId,
      companyId: actualCompanyId,
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/candidates/rankings/job/${jobId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: [],
            meta: {
              jobId,
              jobTitle: "Unknown Job",
              companyName: "Unknown Company",
              totalRanked: 0,
              lastUpdated: new Date().toISOString(),
            },
          };
        }
        const error = await response.text();
        toast.error(`Failed to fetch rankings: ${error}`);
        return {
          success: false,
          data: [],
          error: `Failed to fetch rankings: ${error}`,
        };
      }

      const responseData = await response.json();

      // Convert backend response to frontend format
      const rankingData = responseData.rankings.map(
        (ranking: CandidateRankingResponse) =>
          this.convertRankingToCandidate(ranking)
      );

      return {
        success: true,
        data: rankingData,
        meta: {
          jobId: responseData.jobId,
          jobTitle: responseData.jobTitle,
          companyName: responseData.companyName,
          totalRanked: responseData.totalRanked,
          lastUpdated: responseData.lastUpdated,
        },
      };
    } catch (error) {
      console.error("❌ Failed to fetch rankings:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Check if candidate is ranked
  async checkCandidateRanked(
    applicationId: string
  ): Promise<CheckRankedResponse | null> {
    const { token } = this.getAuthData();

    if (!token) {
      toast.error("Authentication required to check candidate ranking");
      return null;
    }

    console.log("📤 Checking if candidate is ranked:", applicationId);

    try {
      const response = await fetch(
        `${this.baseUrl}/candidates/rankings/check-ranked/${applicationId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        toast.error(`Failed to check candidate ranking: ${error}`);
        return null;
      }

      const result = await response.json();
      console.log("✅ Candidate ranking check completed:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to check candidate ranking:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to check candidate ranking";
      toast.error(errorMessage);
      return null;
    }
  }

  // Convert backend ranking response to frontend candidate format
  convertRankingToCandidate(
    ranking: CandidateRankingResponse
  ): CandidateWithJobDetails {
    return {
      id: ranking.applicationId, // Use applicationId as the main ID
      applicationId: ranking.applicationId,
      candidateUserId: ranking.candidateUserId,
      jobId: ranking.jobId,
      name: ranking.candidateName,
      email: ranking.candidateEmail,
      photo: ranking.candidatePhoto,
      role: ranking.jobTitle,
      company: ranking.companyName,
      assessment: ranking.rankingScore,
      stage: ranking.stage as CandidateStage,
      status: ranking.status as
        | "In Progress"
        | "Hired"
        | "Rejected"
        | "Offered",
      appliedAt: ranking.rankedAt, // Use rankedAt as appliedAt for display
      jobTitle: ranking.jobTitle,
      jobDepartment: "",
      jobLocationType: "Unknown",
      jobEmploymentType: "Unknown",
      // Add ranking-specific fields
      rankingScore: ranking.rankingScore,
      rankingPosition: ranking.rankingPosition,
      aiAnalysisData: ranking.aiAnalysisData,
      isRanked: ranking.isRanked,
    };
  }

  // Get current user info
  getCurrentUser() {
    return this.getAuthData();
  }
}

export const candidateRankingService = new CandidateRankingService();

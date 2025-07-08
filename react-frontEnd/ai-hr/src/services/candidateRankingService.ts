import { CandidateStage, CandidateWithJobDetails } from "@/interfaces";

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
    if (typeof window === "undefined") {
      return { token: null, userId: null, userCategory: null, companyId: null };
    }

    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const userCategory =
      localStorage.getItem("userCategory") ||
      sessionStorage.getItem("userCategory");

    const currentUserStr =
      localStorage.getItem("currentUser") ||
      sessionStorage.getItem("currentUser");

    let userId = null;
    let companyId = null;

    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        userId = currentUser.id;
        companyId = currentUser.companyId;
      } catch (error) {
        console.warn("Failed to parse currentUser from storage:", error);
      }
    }

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
  ): Promise<BulkRankingResponse> {
    const { token, userId, companyId } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (!companyId) {
      throw new Error("Company ID not found");
    }

    if (!userId) {
      throw new Error("User ID not found");
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
        throw new Error(`Failed to add candidates to ranking: ${error}`);
      }

      const result = await response.json();
      console.log("✅ Candidates added to ranking successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to add candidates to ranking:", error);
      throw error;
    }
  }

  // Remove candidate from ranking
  async removeCandidateFromRanking(
    jobId: string,
    applicationId: string
  ): Promise<void> {
    const { token, companyId } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (!companyId) {
      throw new Error("Company ID not found");
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
        throw new Error(`Failed to remove candidate from ranking: ${error}`);
      }

      console.log("✅ Candidate removed from ranking successfully");
    } catch (error) {
      console.error("❌ Failed to remove candidate from ranking:", error);
      throw error;
    }
  }

  // Update ranking position
  async updateRankingPosition(
    jobId: string,
    applicationId: string,
    newPosition: number,
    newScore?: number,
    aiAnalysisData?: Record<string, unknown>
  ): Promise<void> {
    const { token, companyId } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (!companyId) {
      throw new Error("Company ID not found");
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
        throw new Error(`Failed to update ranking position: ${error}`);
      }

      console.log("✅ Ranking position updated successfully");
    } catch (error) {
      console.error("❌ Failed to update ranking position:", error);
      throw error;
    }
  }

  // Get rankings by job
  async getRankingsByJob(jobId: string): Promise<RankingsByJobResponse> {
    const { token } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
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
        throw new Error(`Failed to get rankings: ${error}`);
      }

      const result = await response.json();
      console.log("✅ Rankings retrieved successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to get rankings:", error);
      throw error;
    }
  }

  // Get rankings for all jobs in a company
  async getRankingsByCompany(): Promise<RankingsByJobResponse[]> {
    const { token, companyId } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (!companyId) {
      throw new Error("Company ID not found");
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
        throw new Error(`Failed to fetch company rankings: ${error}`);
      }

      const result = await response.json();
      console.log("✅ Company rankings fetched successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to fetch company rankings:", error);
      throw error;
    }
  }

  // Get rankings for a specific job and company
  async getRankings(companyId: string, jobId: string) {
    const { token } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    const actualCompanyId = companyId || this.getAuthData().companyId;
    
    if (!actualCompanyId) {
      throw new Error("Company ID is required");
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
            }
          };
        }
        const error = await response.text();
        throw new Error(`Failed to fetch rankings: ${error}`);
      }

      const responseData = await response.json();
      
      // Convert backend response to frontend format
      const rankingData = responseData.rankings.map((ranking: CandidateRankingResponse) => 
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
        }
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
  ): Promise<CheckRankedResponse> {
    const { token } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
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
        throw new Error(`Failed to check candidate ranking: ${error}`);
      }

      const result = await response.json();
      console.log("✅ Candidate ranking check completed:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to check candidate ranking:", error);
      throw error;
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
      status: ranking.status as "In Progress" | "Hired" | "Rejected" | "Offered",
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
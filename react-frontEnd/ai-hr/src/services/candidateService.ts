import {
  Candidate,
  CandidateWithJobDetails,
  CandidatesResponse,
} from "@/interfaces/index";

class CandidateService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
  }

  private getAuthData() {
    if (typeof window === "undefined") {
      return { token: null, userId: null, userCategory: null, companyId: null };
    }

    // Check cookies first, then localStorage and sessionStorage
    let token = null;
    let userCategory = null;
    let userId = null;
    let companyId = null;

    // Try to get from cookies first
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf("authToken=") === 0) {
        token = decodeURIComponent(
          cookie.substring("authToken=".length, cookie.length)
        );
      } else if (cookie.indexOf("userCategory=") === 0) {
        userCategory = decodeURIComponent(
          cookie.substring("userCategory=".length, cookie.length)
        );
      } else if (cookie.indexOf("userData=") === 0) {
        try {
          const userData = JSON.parse(
            decodeURIComponent(
              cookie.substring("userData=".length, cookie.length)
            )
          );
          userId = userData.id;
          companyId = userData.companyId;
        } catch (error) {
          console.warn("Failed to parse userData from cookie:", error);
        }
      }
    }

    // Fallback to localStorage/sessionStorage if not found in cookies
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
          if (!userId) userId = currentUser.id;
          if (!companyId) companyId = currentUser.companyId;
        } catch (error) {
          console.warn("Failed to parse currentUser from storage:", error);
        }
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

  // Check if user is a hiring user with access to candidates
  isHiringUser(): boolean {
    const { token, userId, userCategory, companyId } = this.getAuthData();

    const isHiring = !!(
      token &&
      userId &&
      companyId &&
      userCategory !== "ApplicationUser"
    );

    console.log("🔑 CandidateService Auth Check:", {
      hasToken: !!token,
      hasUserId: !!userId,
      hasCompanyId: !!companyId,
      userCategory,
      isHiringUser: isHiring,
    });

    return isHiring;
  }

  // Get candidates for the hiring user's company
  async getCandidatesForCompany(): Promise<CandidatesResponse> {
    const { token, companyId, userCategory } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated - please log in");
    }

    if (!companyId) {
      throw new Error(
        "Company ID not found - user may not be associated with a company"
      );
    }

    if (userCategory === "ApplicationUser") {
      throw new Error("Access denied - only hiring users can view candidates");
    }

    console.log("📤 Fetching candidates for company:", companyId);

    try {
      const response = await fetch(
        `${this.baseUrl}/candidates/company/${companyId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            candidates: [],
            totalCount: 0,
            companyName: "Unknown Company",
          };
        }
        const error = await response.text();
        throw new Error(`Failed to fetch candidates: ${error}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("❌ Failed to fetch candidates:", error);
      throw error;
    }
  }

  // Get candidates for a specific job
  async getCandidatesForJob(jobId: string): Promise<CandidateWithJobDetails[]> {
    const { token, companyId, userCategory } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (userCategory === "ApplicationUser") {
      throw new Error("Access denied - only hiring users can view candidates");
    }

    try {
      const response = await fetch(`${this.baseUrl}/candidates/job/${jobId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        const error = await response.text();
        throw new Error(`Failed to fetch job candidates: ${error}`);
      }

      const candidates = await response.json();
      console.log(
        "✅ Job candidates fetched successfully:",
        candidates.length,
        "candidates"
      );

      return candidates;
    } catch (error) {
      console.error("❌ Failed to fetch job candidates:", error);
      throw error;
    }
  }

  // Update candidate status (approve/decline)
  async updateCandidateStatus(
    applicationId: string,
    status: "In Progress" | "Hired" | "Rejected" | "Offered",
    stage?: import("@/interfaces").CandidateStage,
    currentRoundId?: string
  ): Promise<any> {
    const { token, userCategory } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (userCategory === "ApplicationUser") {
      throw new Error(
        "Access denied - only hiring users can update candidate status"
      );
    }

    console.log("📤 Updating candidate status:", {
      applicationId,
      status,
      stage,
      currentRoundId,
    });

    try {
      const updateData: any = { status };
      if (stage) {
        updateData.stage = stage;
      }
      if (currentRoundId) {
        updateData.currentRoundId = currentRoundId;
      }

      console.log("📤 Sending to backend API:", {
        url: `${this.baseUrl}/applicationdetails/${applicationId}`,
        method: "PUT",
        data: updateData,
      });

      const response = await fetch(
        `${this.baseUrl}/applicationdetails/${applicationId}`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(updateData),
        }
      );

      console.log("📥 Backend response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Backend error response:", error);
        throw new Error(`Failed to update candidate status: ${error}`);
      }

      let responseData = null;
      try {
        responseData = await response.json();
        console.log("✅ Candidate status updated successfully:", responseData);
      } catch (parseError) {
        console.log(
          "✅ Candidate status updated successfully (no JSON response)"
        );
      }

      return responseData;
    } catch (error) {
      console.error("❌ Failed to update candidate status:", error);
      throw error;
    }
  }

  async getApplicationDetailByJob(jobId: string): Promise<any> {
    const { token, userCategory } = this.getAuthData();
    if (!token) {
      throw new Error("User not authenticated");
    }

    if (userCategory === "ApplicationUser") {
      throw new Error(
        "Access denied - only hiring users can view application details"
      );
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/applicationdetails/job/${jobId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

    if (!response.ok) {
      const error = await response.text();
      if (error.includes('No applications found for job ID')) {
        return [];
      }
      throw new Error(`Failed to fetch application details: ${error}`);
    }

      const data = await response.json();
      console.log("✅ Application details fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Failed to fetch application details:", error);
      throw error;
    }
  }

  // Get detailed candidate information
  async getCandidateDetails(candidateId: string): Promise<Candidate> {
    const { token, userCategory } = this.getAuthData();
    if (!token) {
      throw new Error("User not authenticated");
    }

    if (userCategory === "ApplicationUser") {
      throw new Error(
        "Access denied - only hiring users can view candidate details"
      );
    }

    console.log("📤 Fetching detailed candidate information for:", candidateId);

    try {
      const response = await fetch(
        `${this.baseUrl}/candidates/${candidateId}/details`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch candidate details: ${error}`);
      }

      const data = await response.json();
      console.log("✅ Candidate details fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Failed to fetch candidate details:", error);
      throw error;
    }
  }

  // UPDATED: Save candidate note with proper timestamp handling and return timestamps
  async saveCandidateNote(
    applicationId: string,
    note: string
  ): Promise<{
    notesCreatedAt?: string;
    notesUpdatedAt?: string;
  }> {
    const { token, userCategory } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (userCategory === "ApplicationUser") {
      throw new Error("Access denied - only hiring users can save notes");
    }

    console.log("📤 Saving candidate note to database:", applicationId);

    try {
      const requestBody = {
        notes: note, // Save the note as-is, let backend handle timestamps
      };

      const response = await fetch(
        `${this.baseUrl}/candidates/${applicationId}/notes`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save note: ${error}`);
      }

      const result = await response.json();
      console.log("✅ Candidate note saved to database successfully:", result);

      // Return the timestamps from the backend response
      return {
        notesCreatedAt: result.notesCreatedAt,
        notesUpdatedAt: result.notesUpdatedAt,
      };
    } catch (error) {
      console.error("❌ Failed to save candidate note:", error);
      throw error;
    }
  }

  // Delete candidate note from database
  async deleteCandidateNote(applicationId: string): Promise<void> {
    const { token, userCategory } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (userCategory === "ApplicationUser") {
      throw new Error("Access denied - only hiring users can delete notes");
    }

    console.log("📤 Deleting candidate note from database:", applicationId);

    try {
      const response = await fetch(
        `${this.baseUrl}/candidates/${applicationId}/notes`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete note: ${error}`);
      }

      console.log("✅ Candidate note deleted from database successfully");
    } catch (error) {
      console.error("❌ Failed to delete candidate note:", error);
      throw error;
    }
  }

  // Get current user info
  getCurrentUser() {
    return this.getAuthData();
  }

  // Enhanced method to get candidates with filtering options
  async getCandidates({
    companyId,
    jobIds = [],
    statusFilters = [],
    stageFilters = [],
    query = "",
    page = 1,
    pageSize = 10,
  }: {
    companyId?: string;
    jobIds?: string[];
    statusFilters?: string[];
    stageFilters?: string[];
    query?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { token, userCategory } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    if (userCategory === "ApplicationUser") {
      throw new Error("Access denied - only hiring users can view candidates");
    }

    const actualCompanyId = companyId || this.getAuthData().companyId;
    
    if (!actualCompanyId) {
      throw new Error("Company ID is required");
    }

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add pagination
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      
      // Add search query if provided
      if (query) {
        params.append("query", query);
      }
      
      // Add filters
      if (jobIds && jobIds.length > 0) {
        jobIds.forEach(jobId => {
          params.append("jobIds", jobId);
        });
      }
      
      if (statusFilters && statusFilters.length > 0) {
        statusFilters.forEach(status => {
          params.append("statusFilters", status);
        });
      }
      
      if (stageFilters && stageFilters.length > 0) {
        stageFilters.forEach(stage => {
          params.append("stageFilters", stage);
        });
      }
      
      const queryString = params.toString();
      const endpoint = `/candidates/filter/${actualCompanyId}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`📤 Fetching candidates with filters:`, {
        endpoint,
        filters: { jobIds, statusFilters, stageFilters, query }
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: [],
            meta: {
              totalCount: 0,
              companyName: "Unknown Company",
              filterCounts: {
                status: {},
                stage: {},
                position: {},
              }
            }
          };
        }
        const error = await response.text();
        throw new Error(`Failed to fetch candidates: ${error}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        data: responseData.candidates || [],
        meta: {
          totalCount: responseData.totalCount || 0,
          companyName: responseData.companyName || "Unknown Company",
          filterCounts: responseData.filterCounts || {
            status: {},
            stage: {},
            position: {},
          }
        }
      };
    } catch (error) {
      console.error("❌ Failed to fetch candidates with filters:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const candidateService = new CandidateService();

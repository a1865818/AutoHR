import {
  Candidate,
  CandidateWithJobDetails,
  CandidatesResponse,
} from "@/interfaces/index";
import { toast } from "@/utils/toast";

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
  async getCandidatesForCompany(): Promise<CandidatesResponse | null> {
    const { token, companyId, userCategory } = this.getAuthData();

    if (!token) {
      toast.error("Please log in to continue");
      return null;
    }

    if (!companyId) {
      toast.error("Unable to access candidates - company information not found");
      return null;
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can view candidates");
      return null;
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
        toast.error(`Unable to load candidates: ${error}`);
        return null;
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("❌ Failed to fetch candidates:", error);
      toast.error("Failed to load candidates. Please try again.");
      return null;
    }
  }

  // Get candidates for a specific job
  async getCandidatesForJob(jobId: string): Promise<CandidateWithJobDetails[]> {
    const { token, companyId, userCategory } = this.getAuthData();

    if (!token) {
      toast.error("Please log in to continue");
      return [];
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can view candidates");
      return [];
    }

    try {
      console.log("🔍 Making API call to:", `${this.baseUrl}/candidates/job/${jobId}`);
      console.log("🔍 Auth data:", { token: token ? "present" : "missing", userCategory, companyId });
      
      const response = await fetch(`${this.baseUrl}/candidates/job/${jobId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      if (!response.ok) {
        if (response.status === 404) {
          console.log("🔍 404 - No candidates found");
          return [];
        }
        const error = await response.text();
        console.error("🔍 API Error:", error);
        toast.error(`Unable to load job candidates: ${error}`);
        return [];
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
      toast.error("Failed to load job candidates. Please try again.");
      return [];
    }
  }

  // Get candidates for a specific job with pagination
  async getCandidatesForJobPaged(
    jobId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    candidates: CandidateWithJobDetails[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    const { token, userCategory } = this.getAuthData();

    if (!token) {
      toast.error("Please log in to continue");
      return { candidates: [], totalCount: 0, page, pageSize };
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can view candidates");
      return { candidates: [], totalCount: 0, page, pageSize };
    }

    try {
      const url = new URL(
        `${this.baseUrl}/candidates/job/${jobId}/paged`
      );
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { candidates: [], totalCount: 0, page, pageSize };
        }
        const error = await response.text();
        toast.error(`Unable to load candidates: ${error}`);
        return { candidates: [], totalCount: 0, page, pageSize };
      }

      const data = await response.json();
      return {
        candidates: data.candidates || [],
        totalCount: data.totalCount || 0,
        page: data.page || page,
        pageSize: data.pageSize || pageSize,
      };
    } catch (error) {
      console.error("❌ Failed to fetch job candidates (paged):", error);
      toast.error("Failed to load candidates. Please try again.");
      return { candidates: [], totalCount: 0, page, pageSize };
    }
  }

  // Update candidate status (approve/decline)
  async updateCandidateStatus(
    applicationId: string,
    status: "In Progress" | "Hired" | "Rejected" | "Offered",
    stage?: import("@/interfaces").CandidateStage,
    currentRoundId?: string
  ): Promise<any | null> {
    const { token, userCategory } = this.getAuthData();

    if (!token) {
      toast.error("Please log in to continue");
      return null;
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can update candidate status");
      return null;
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
        toast.error(`Unable to update candidate status: ${error}`);
        return null;
      }

      let responseData = null;
      try {
        responseData = await response.json();
        console.log("✅ Candidate status updated successfully:", responseData);
        toast.success("Candidate status updated successfully");
      } catch (parseError) {
        console.log(
          "✅ Candidate status updated successfully (no JSON response)"
        );
        toast.success("Candidate status updated successfully");
      }

      return responseData;
    } catch (error) {
      console.error("❌ Failed to update candidate status:", error);
      toast.error("Failed to update candidate status. Please try again.");
      return null;
    }
  }

  async getApplicationDetailByJob(jobId: string): Promise<any[]> {
    const { token, userCategory } = this.getAuthData();
    if (!token) {
      toast.error("Please log in to continue");
      return [];
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can view application details");
      return [];
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
      toast.error(`Unable to load application details: ${error}`);
      return [];
    }

      const data = await response.json();
      console.log("✅ Application details fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Failed to fetch application details:", error);
      toast.error("Failed to load application details. Please try again.");
      return [];
    }
  }

  // Get detailed candidate information
  async getCandidateDetails(candidateId: string): Promise<Candidate | null> {
    const { token, userCategory } = this.getAuthData();
    if (!token) {
      toast.error("Please log in to continue");
      return null;
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can view candidate details");
      return null;
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
        toast.error(`Unable to load candidate details: ${error}`);
        return null;
      }

      const data = await response.json();
      console.log("✅ Candidate details fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Failed to fetch candidate details:", error);
      toast.error("Failed to load candidate details. Please try again.");
      return null;
    }
  }

  // UPDATED: Save candidate note with proper timestamp handling and return timestamps
  async saveCandidateNote(
    applicationId: string,
    note: string
  ): Promise<{
    notesCreatedAt?: string;
    notesUpdatedAt?: string;
  } | null> {
    const { token, userCategory } = this.getAuthData();

    if (!token) {
      toast.error("Please log in to continue");
      return null;
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can save notes");
      return null;
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
        toast.error(`Unable to save note: ${error}`);
        return null;
      }

      const result = await response.json();
      console.log("✅ Candidate note saved to database successfully:", result);
      toast.success("Note saved successfully");

      // Return the timestamps from the backend response
      return {
        notesCreatedAt: result.notesCreatedAt,
        notesUpdatedAt: result.notesUpdatedAt,
      };
    } catch (error) {
      console.error("❌ Failed to save candidate note:", error);
      toast.error("Failed to save note. Please try again.");
      return null;
    }
  }

  // Delete candidate note from database
  async deleteCandidateNote(applicationId: string): Promise<boolean> {
    const { token, userCategory } = this.getAuthData();

    if (!token) {
      toast.error("Please log in to continue");
      return false;
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can delete notes");
      return false;
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
        toast.error(`Unable to delete note: ${error}`);
        return false;
      }

      console.log("✅ Candidate note deleted from database successfully");
      toast.success("Note deleted successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to delete candidate note:", error);
      toast.error("Failed to delete note. Please try again.");
      return false;
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
      toast.error("Please log in to continue");
      return {
        success: false,
        data: [],
        error: "Authentication required"
      };
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring managers can view candidates");
      return {
        success: false,
        data: [],
        error: "Access denied"
      };
    }

    const actualCompanyId = companyId || this.getAuthData().companyId;
    
    if (!actualCompanyId) {
      toast.error("Unable to access candidates - company information not found");
      return {
        success: false,
        data: [],
        error: "Company ID required"
      };
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
        toast.error(`Unable to load candidates: ${error}`);
        return {
          success: false,
          data: [],
          error: `Failed to fetch candidates: ${error}`
        };
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to load candidates. Please try again.");
      return {
        success: false,
        data: [],
        error: errorMessage,
      };
    }
  }
}

export const candidateService = new CandidateService();

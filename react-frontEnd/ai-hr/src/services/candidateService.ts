import {
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
    status: "In Progress" | "Hired" | "Rejected",
    stage?: "Applied" | "Interview" | "Offer"
  ): Promise<void> {
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
    });

    try {
      const updateData: any = { status };
      if (stage) {
        updateData.stage = stage.toLowerCase().replace(" ", "_");
      }

      const response = await fetch(
        `${this.baseUrl}/applicationdetails/${applicationId}`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update candidate status: ${error}`);
      }

      console.log("✅ Candidate status updated successfully");
    } catch (error) {
      console.error("❌ Failed to update candidate status:", error);
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
}

export const candidateService = new CandidateService();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

export interface SavedJobsResponse {
  savedJobs: string[];
  count: number;
}

export interface SaveJobResponse {
  message: string;
  jobId: string;
}

export interface IsJobSavedResponse {
  jobId: string;
  isSaved: boolean;
}

class SavedJobsService {
  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
      );
    }
    return null;
  }

  private async fetchApi(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {};

    if (options?.method && ["POST", "PUT", "PATCH"].includes(options.method)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          ...headers,
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          errorData = text
            ? JSON.parse(text)
            : { error: `HTTP ${response.status}: ${response.statusText}` };
        } catch (e) {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        if (response.status === 401) {
          console.error("🚫 Unauthorized - Token may be invalid or expired");
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            sessionStorage.removeItem("authToken");
          }
          throw new Error("Authentication required. Please log in again.");
        }

        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        if (!text || text.trim() === "") {
          return null;
        }
        return JSON.parse(text);
      }

      return await response.text();
    } catch (error) {
      console.error("🚨 SavedJobs API Error:", { url, error });
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  async saveJob(jobId: string): Promise<SaveJobResponse> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to save jobs");
    }

    if (!jobId) {
      throw new Error("Job ID is required");
    }

    try {
      const response = await this.fetchApi(`/api/saved-jobs/${jobId}`, {
        method: "POST",
      });

      console.log("✅ Job saved successfully:", jobId);
      return response;
    } catch (error) {
      console.error("❌ Failed to save job:", error);
      throw error;
    }
  }

  async unsaveJob(jobId: string): Promise<SaveJobResponse> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to unsave jobs");
    }

    if (!jobId) {
      throw new Error("Job ID is required");
    }

    try {
      const response = await this.fetchApi(`/api/saved-jobs/${jobId}`, {
        method: "DELETE",
      });

      console.log("✅ Job unsaved successfully:", jobId);
      return response;
    } catch (error) {
      console.error("❌ Failed to unsave job:", error);
      throw error;
    }
  }

  async getSavedJobIds(): Promise<string[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to get saved jobs");
    }

    try {
      const response: SavedJobsResponse = await this.fetchApi("/api/saved-jobs");
      return response?.savedJobs || [];
    } catch (error) {
      console.error("❌ Failed to get saved jobs:", error);
      throw error;
    }
  }

  async isJobSaved(jobId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    if (!jobId) {
      return false;
    }

    try {
      const response: IsJobSavedResponse = await this.fetchApi(
        `/api/saved-jobs/check/${jobId}`
      );
      return response?.isSaved || false;
    } catch (error) {
      console.error("❌ Failed to check if job is saved:", error);
      return false;
    }
  }

  async toggleJobSaved(jobId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required");
    }

    try {
      const isSaved = await this.isJobSaved(jobId);
      
      if (isSaved) {
        await this.unsaveJob(jobId);
        return false;
      } else {
        await this.saveJob(jobId);
        return true;
      }
    } catch (error) {
      console.error("❌ Failed to toggle job saved status:", error);
      throw error;
    }
  }
}

export const savedJobsService = new SavedJobsService(); 
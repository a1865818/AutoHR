import { toast } from "@/utils/toast";

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
      // Try to get from cookies first
      const cookies = document.cookie.split(";");
      let tokenFromCookie = null;

      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === " ") {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf("authToken=") === 0) {
          tokenFromCookie = decodeURIComponent(
            cookie.substring("authToken=".length, cookie.length)
          );
          break;
        }
      }

      // Fallback to localStorage/sessionStorage
      const tokenFromStorage =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      console.log("🔍 SavedJobsService: Token sources", {
        fromCookie: !!tokenFromCookie,
        fromStorage: !!tokenFromStorage,
        cookieLength: tokenFromCookie?.length || 0,
        storageLength: tokenFromStorage?.length || 0,
      });

      return tokenFromCookie || tokenFromStorage;
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
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            sessionStorage.removeItem("authToken");
          }
          toast.error("Your session has expired. Please log in again.");
          return null;
        }

        toast.error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
        return null;
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
      if (error instanceof Error && error.message.includes("session has expired")) {
        // Don't show duplicate toast for auth errors
        return null;
      }
      toast.error(
        `Network error: ${
          error instanceof Error ? error.message : "Connection failed"
        }`
      );
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    console.log("🔍 SavedJobsService: Authentication check", {
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });
    return !!token;
  }

  async saveJob(jobId: string): Promise<SaveJobResponse | null> {
    if (!this.isAuthenticated()) {
      toast.error("Authentication required to save jobs");
      return null;
    }

    if (!jobId) {
      toast.error("Job ID is required");
      return null;
    }

    const response = await this.fetchApi(`/api/saved-jobs/${jobId}`, {
      method: "POST",
    });

    if (response) {
      console.log("✅ Job saved successfully:", jobId);
      toast.success("Job saved successfully!");
    }
    return response;
  }

  async unsaveJob(jobId: string): Promise<SaveJobResponse | null> {
    if (!this.isAuthenticated()) {
      toast.error("Authentication required to unsave jobs");
      return null;
    }

    if (!jobId) {
      toast.error("Job ID is required");
      return null;
    }

    const response = await this.fetchApi(`/api/saved-jobs/${jobId}`, {
      method: "DELETE",
    });

    if (response) {
      console.log("✅ Job unsaved successfully:", jobId);
      toast.success("Job removed from saved list!");
    }
    return response;
  }

  async getSavedJobIds(): Promise<string[]> {
    if (!this.isAuthenticated()) {
      toast.error("Authentication required to get saved jobs");
      return [];
    }

    const response: SavedJobsResponse | null = await this.fetchApi(
      "/api/saved-jobs"
    );
    return response?.savedJobs || [];
  }

  async isJobSaved(jobId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    if (!jobId) {
      return false;
    }

    const response: IsJobSavedResponse | null = await this.fetchApi(
      `/api/saved-jobs/check/${jobId}`
    );
    return response?.isSaved || false;
  }

  async toggleJobSaved(jobId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      toast.error("Authentication required");
      return false;
    }

    const isSaved = await this.isJobSaved(jobId);

    if (isSaved) {
      const result = await this.unsaveJob(jobId);
      return result ? false : isSaved; // Return current state if unsave failed
    } else {
      const result = await this.saveJob(jobId);
      return result ? true : isSaved; // Return current state if save failed
    }
  }
}

export const savedJobsService = new SavedJobsService();

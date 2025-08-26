import {
  InterviewTemplate,
  InterviewRound,
  InterviewStats,
} from "@/interfaces/interview";
import { toast } from "@/utils/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

// DTOs matching the backend contracts
export interface InterviewTemplateCreateDto {
  name: string;
  description: string;
  isDefault: boolean;
}

export interface InterviewTemplateUpdateDto {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export interface InterviewRoundCreateDto {
  name: string;
  type: string;
  duration: number;
  roundOrder: number;
  requirements: string[];
  interviewers: string[];
  isOptional: boolean;
  passingCriteria: number;
  description?: string;
}

export interface InterviewRoundUpdateDto {
  name?: string;
  type?: string;
  duration?: number;
  roundOrder?: number;
  requirements?: string[];
  interviewers?: string[];
  isOptional?: boolean;
  passingCriteria?: number;
  description?: string;
}

export interface CloneTemplateRequest {
  name: string;
}

class InterviewService {
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
      const tokenFromStorage = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      
      // Debug token sources (remove in production)
      console.log("🔍 InterviewService - Token sources:", {
        fromCookie: !!tokenFromCookie,
        fromStorage: !!tokenFromStorage,
        cookieLength: tokenFromCookie?.length || 0,
        storageLength: tokenFromStorage?.length || 0,
        cookiePreview: tokenFromCookie ? `${tokenFromCookie.substring(0, 20)}...` : 'none',
        storagePreview: tokenFromStorage ? `${tokenFromStorage.substring(0, 20)}...` : 'none',
        allCookies: document.cookie,
      });

      return tokenFromCookie || tokenFromStorage;
    }
    return null;
  }

  private async fetchApi(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    // Debug API calls (remove in production)
    console.log("🔍 InterviewService fetchApi:", {
      url,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'none',
      headers: token ? { Authorization: `Bearer ${token.substring(0, 30)}...` } : 'no auth header'
    });

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
        } catch {
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

        const errorMessage = errorData.error || `Request failed with status ${response.status}`;
        toast.error(errorMessage);
        return null;
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");

      if (!contentType || contentLength === "0") {
        return null;
      }

      if (contentType.includes("application/json")) {
        const text = await response.text();

        if (!text || text.trim() === "") {
          return null;
        }

        try {
          return JSON.parse(text);
        } catch (parseError: unknown) {
          console.error("❌ JSON Parse Error:", parseError);
          toast.error("Received invalid data from server");
          return null;
        }
      }

      const text = await response.text();
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          return JSON.parse(text);
        } catch (parseError: unknown) {
          toast.error("Failed to process server response");
          return null;
        }
      }

      return text || null;
    } catch (error: unknown) {
      // Don't log fetch errors twice - they're already handled above
      if (
        error instanceof Error &&
        (error.message.includes("JSON") || error.message.includes("HTTP"))
      ) {
        const errorMessage = error.message;
        toast.error(errorMessage);
        return null;
      }

      console.error("🚨 Network/Fetch Error:", { url, error });
      toast.error(
        error instanceof Error ? error.message : "Network connection failed"
      );
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Interview Template Methods
  async getInterviewTemplates(): Promise<InterviewTemplate[]> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view interview templates");
      return [];
    }

    try {
      const templates = await this.fetchApi("/interviews/templates");
      return templates || [];
    } catch (error) {
      console.error("❌ Failed to load interview templates:", error);
      toast.error("Failed to load interview templates. Please try again.");
      return [];
    }
  }

  async getInterviewTemplate(id: string): Promise<InterviewTemplate | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view interview template");
      return null;
    }

    try {
      const template = await this.fetchApi(`/interviews/templates/${id}`);
      if (!template) {
        toast.error("Interview template not found");
        return null;
      }
      return template;
    } catch (error) {
      console.error("❌ Failed to load interview template:", error);
      toast.error("Failed to load interview template. Please try again.");
      return null;
    }
  }

  async getInterviewTemplateApplicant(
    id: string,
    companyId: string
  ): Promise<InterviewTemplate | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view interview template");
      return null;
    }

    try {
      const template = await this.fetchApi(
        `/interviews/templates/${id}/applicant?companyId=${companyId}`
      );
      if (!template) {
        toast.error("Interview template not found");
        return null;
      }
      return template;
    } catch (error) {
      console.error("❌ Failed to load interview template:", error);
      toast.error("Failed to load interview template. Please try again.");
      return null;
    }
  }

  async createInterviewTemplate(
    data: InterviewTemplateCreateDto
  ): Promise<InterviewTemplate | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to create interview template");
      return null;
    }

    try {
      const template = await this.fetchApi("/interviews/templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success("Interview template created successfully!");
      return template;
    } catch (error) {
      console.error("❌ Failed to create interview template:", error);
      toast.error("Failed to create interview template. Please try again.");
      return null;
    }
  }

  async updateInterviewTemplate(
    id: string,
    data: InterviewTemplateUpdateDto
  ): Promise<InterviewTemplate | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to update interview template");
      return null;
    }

    try {
      const template = await this.fetchApi(`/interviews/templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      toast.success("Interview template updated successfully!");
      return template;
    } catch (error) {
      console.error("❌ Failed to update interview template:", error);
      toast.error("Failed to update interview template. Please try again.");
      return null;
    }
  }

  async deleteInterviewTemplate(id: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to delete interview template");
      return false;
    }

    try {
      await this.fetchApi(`/interviews/templates/${id}`, {
        method: "DELETE",
      });
      toast.success("Interview template deleted successfully!");
      return true;
    } catch (error) {
      console.error("❌ Failed to delete interview template:", error);
      toast.error("Failed to delete interview template. Please try again.");
      return false;
    }
  }

  async cloneInterviewTemplate(
    id: string,
    name: string
  ): Promise<InterviewTemplate | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to clone interview template");
      return null;
    }

    try {
      const template = await this.fetchApi(
        `/interviews/templates/${id}/clone`,
        {
          method: "POST",
          body: JSON.stringify({ name }),
        }
      );
      toast.success("Interview template cloned successfully!");
      return template;
    } catch (error) {
      console.error("❌ Failed to clone interview template:", error);
      toast.error("Failed to clone interview template. Please try again.");
      return null;
    }
  }

  async setDefaultInterviewTemplate(id: string): Promise<InterviewTemplate | null> {
    if (!this.isAuthenticated()) {
      toast.error(
        "Please log in to set default interview template"
      );
      return null;
    }

    try {
      const template = await this.fetchApi(
        `/interviews/templates/${id}/set-default`,
        {
          method: "POST",
        }
      );
      return template;
    } catch (error) {
      console.error("❌ Failed to set default interview template:", error);
      toast.error("Failed to set default interview template. Please try again.");
      return null;
    }
  }

  async getInterviewStats(): Promise<InterviewStats> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view interview stats");
      return {
        totalTemplates: 0,
        activeInterviews: 0,
        successRate: 0,
        averageDuration: 0,
      };
    }

    try {
      const stats = await this.fetchApi("/interviews/stats");
      return (
        stats || {
          totalTemplates: 0,
          activeInterviews: 0,
          successRate: 0,
          averageDuration: 0,
        }
      );
    } catch (error) {
      console.error("❌ Failed to load interview stats:", error);
      toast.error("Failed to load interview statistics. Please try again.");
      return {
        totalTemplates: 0,
        activeInterviews: 0,
        successRate: 0,
        averageDuration: 0,
      };
    }
  }

  // Interview Round Methods
  async getInterviewRounds(templateId: string): Promise<InterviewRound[]> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view interview rounds");
      return [];
    }

    try {
      const rounds = await this.fetchApi(
        `/interviews/templates/${templateId}/rounds`
      );
      return rounds || [];
    } catch (error) {
      console.error("❌ Failed to load interview rounds:", error);
      toast.error("Failed to load interview rounds. Please try again.");
      return [];
    }
  }

  async createInterviewRound(
    templateId: string,
    data: InterviewRoundCreateDto
  ): Promise<InterviewRound | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to create interview round");
      return null;
    }

    try {
      const round = await this.fetchApi(
        `/interviews/templates/${templateId}/rounds`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      toast.success("Interview round created successfully!");
      return round;
    } catch (error) {
      console.error("❌ Failed to create interview round:", error);
      toast.error("Failed to create interview round. Please try again.");
      return null;
    }
  }

  async updateInterviewRound(
    id: string,
    data: InterviewRoundUpdateDto
  ): Promise<InterviewRound | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to update interview round");
      return null;
    }

    try {
      const round = await this.fetchApi(`/interviews/rounds/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      toast.success("Interview round updated successfully!");
      return round;
    } catch (error) {
      console.error("❌ Failed to update interview round:", error);
      toast.error("Failed to update interview round. Please try again.");
      return null;
    }
  }

  async deleteInterviewRound(id: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to delete interview round");
      return false;
    }

    try {
      await this.fetchApi(`/interviews/rounds/${id}`, {
        method: "DELETE",
      });
      toast.success("Interview round deleted successfully!");
      return true;
    } catch (error) {
      console.error("❌ Failed to delete interview round:", error);
      toast.error("Failed to delete interview round. Please try again.");
      return false;
    }
  }

  // Legacy method aliases for backward compatibility
  async getAllTemplates(): Promise<InterviewTemplate[]> {
    return this.getInterviewTemplates();
  }

  async getTemplateById(id: string): Promise<InterviewTemplate | null> {
    return this.getInterviewTemplate(id);
  }

  async createTemplate(
    data: InterviewTemplateCreateDto
  ): Promise<InterviewTemplate | null> {
    return this.createInterviewTemplate(data);
  }

  async updateTemplate(
    id: string,
    data: InterviewTemplateUpdateDto
  ): Promise<InterviewTemplate | null> {
    return this.updateInterviewTemplate(id, data);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.deleteInterviewTemplate(id);
  }

  async cloneTemplate(id: string, name: string): Promise<InterviewTemplate | null> {
    return this.cloneInterviewTemplate(id, name);
  }

  async setDefaultTemplate(id: string): Promise<InterviewTemplate | null> {
    return this.setDefaultInterviewTemplate(id);
  }

  async getStats(): Promise<InterviewStats> {
    return this.getInterviewStats();
  }

  async getRoundsByTemplate(templateId: string): Promise<InterviewRound[]> {
    return this.getInterviewRounds(templateId);
  }

  async createRound(
    templateId: string,
    data: InterviewRoundCreateDto
  ): Promise<InterviewRound | null> {
    return this.createInterviewRound(templateId, data);
  }

  async updateRound(
    id: string,
    data: InterviewRoundUpdateDto
  ): Promise<InterviewRound | null> {
    return this.updateInterviewRound(id, data);
  }

  async deleteRound(id: string): Promise<boolean> {
    return this.deleteInterviewRound(id);
  }
}

export const interviewService = new InterviewService();

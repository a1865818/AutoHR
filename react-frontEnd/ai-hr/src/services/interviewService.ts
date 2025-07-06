import {
  InterviewTemplate,
  InterviewRound,
  InterviewStats,
} from "@/interfaces/interview";

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
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === " ") {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf("authToken=") === 0) {
          return decodeURIComponent(
            cookie.substring("authToken=".length, cookie.length)
          );
        }
      }

      // Fallback to localStorage/sessionStorage
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
        } catch (parseError: any) {
          console.error("❌ JSON Parse Error:", parseError);
          throw new Error(
            `Invalid JSON response from server: ${parseError.message}`
          );
        }
      }

      const text = await response.text();
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          return JSON.parse(text);
        } catch (parseError: any) {
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      }

      return text || null;
    } catch (error: any) {
      if (
        error.message &&
        (error.message.includes("JSON") || error.message.includes("HTTP"))
      ) {
        throw error;
      }

      console.error("🚨 Network/Fetch Error:", { url, error });
      throw new Error(`Network error: ${error.message || "Unknown error"}`);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Interview Template Methods
  async getInterviewTemplates(): Promise<InterviewTemplate[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view interview templates");
    }

    try {
      const templates = await this.fetchApi("/interviews/templates");
      return templates || [];
    } catch (error) {
      console.error("❌ Failed to load interview templates:", error);
      throw error;
    }
  }

  async getInterviewTemplate(id: string): Promise<InterviewTemplate> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view interview template");
    }

    try {
      const template = await this.fetchApi(`/interviews/templates/${id}`);
      if (!template) {
        throw new Error("Interview template not found");
      }
      return template;
    } catch (error) {
      console.error("❌ Failed to load interview template:", error);
      throw error;
    }
  }

  async createInterviewTemplate(
    data: InterviewTemplateCreateDto
  ): Promise<InterviewTemplate> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to create interview template");
    }

    try {
      const template = await this.fetchApi("/interviews/templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return template;
    } catch (error) {
      console.error("❌ Failed to create interview template:", error);
      throw error;
    }
  }

  async updateInterviewTemplate(
    id: string,
    data: InterviewTemplateUpdateDto
  ): Promise<InterviewTemplate> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to update interview template");
    }

    try {
      const template = await this.fetchApi(`/interviews/templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return template;
    } catch (error) {
      console.error("❌ Failed to update interview template:", error);
      throw error;
    }
  }

  async deleteInterviewTemplate(id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to delete interview template");
    }

    try {
      await this.fetchApi(`/interviews/templates/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("❌ Failed to delete interview template:", error);
      throw error;
    }
  }

  async cloneInterviewTemplate(
    id: string,
    name: string
  ): Promise<InterviewTemplate> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to clone interview template");
    }

    try {
      const template = await this.fetchApi(
        `/interviews/templates/${id}/clone`,
        {
          method: "POST",
          body: JSON.stringify({ name }),
        }
      );
      return template;
    } catch (error) {
      console.error("❌ Failed to clone interview template:", error);
      throw error;
    }
  }

  async setDefaultInterviewTemplate(id: string): Promise<InterviewTemplate> {
    if (!this.isAuthenticated()) {
      throw new Error(
        "Authentication required to set default interview template"
      );
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
      throw error;
    }
  }

  async getInterviewStats(): Promise<InterviewStats> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view interview stats");
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
      throw error;
    }
  }

  // Interview Round Methods
  async getInterviewRounds(templateId: string): Promise<InterviewRound[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view interview rounds");
    }

    try {
      const rounds = await this.fetchApi(
        `/interviews/templates/${templateId}/rounds`
      );
      return rounds || [];
    } catch (error) {
      console.error("❌ Failed to load interview rounds:", error);
      throw error;
    }
  }

  async createInterviewRound(
    templateId: string,
    data: InterviewRoundCreateDto
  ): Promise<InterviewRound> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to create interview round");
    }

    try {
      const round = await this.fetchApi(
        `/interviews/templates/${templateId}/rounds`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return round;
    } catch (error) {
      console.error("❌ Failed to create interview round:", error);
      throw error;
    }
  }

  async updateInterviewRound(
    id: string,
    data: InterviewRoundUpdateDto
  ): Promise<InterviewRound> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to update interview round");
    }

    try {
      const round = await this.fetchApi(`/interviews/rounds/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return round;
    } catch (error) {
      console.error("❌ Failed to update interview round:", error);
      throw error;
    }
  }

  async deleteInterviewRound(id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to delete interview round");
    }

    try {
      await this.fetchApi(`/interviews/rounds/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("❌ Failed to delete interview round:", error);
      throw error;
    }
  }

  // Legacy method aliases for backward compatibility
  async getAllTemplates(): Promise<InterviewTemplate[]> {
    return this.getInterviewTemplates();
  }

  async getTemplateById(id: string): Promise<InterviewTemplate> {
    return this.getInterviewTemplate(id);
  }

  async createTemplate(
    data: InterviewTemplateCreateDto
  ): Promise<InterviewTemplate> {
    return this.createInterviewTemplate(data);
  }

  async updateTemplate(
    id: string,
    data: InterviewTemplateUpdateDto
  ): Promise<InterviewTemplate> {
    return this.updateInterviewTemplate(id, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.deleteInterviewTemplate(id);
  }

  async cloneTemplate(id: string, name: string): Promise<InterviewTemplate> {
    return this.cloneInterviewTemplate(id, name);
  }

  async setDefaultTemplate(id: string): Promise<InterviewTemplate> {
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
  ): Promise<InterviewRound> {
    return this.createInterviewRound(templateId, data);
  }

  async updateRound(
    id: string,
    data: InterviewRoundUpdateDto
  ): Promise<InterviewRound> {
    return this.updateInterviewRound(id, data);
  }

  async deleteRound(id: string): Promise<void> {
    return this.deleteInterviewRound(id);
  }
}

export const interviewService = new InterviewService();

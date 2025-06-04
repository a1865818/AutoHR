import { JobFormData } from "@/interfaces";
import {
  ApiCompany,
  ApiJob,
  CreateJobRequest,
  UpdateJobRequest,
} from "@/interfaces/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

class JobService {
  private getAuthToken(): string | null {
    // Check both localStorage and sessionStorage for token
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

    // Build headers with authentication
    const headers: Record<string, string> = {};

    // Only add Content-Type for requests with body (POST, PUT, PATCH)
    if (options?.method && ["POST", "PUT", "PATCH"].includes(options.method)) {
      headers["Content-Type"] = "application/json";
    }

    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Debug logging
    console.log("🔍 API Request:", {
      url,
      method: options?.method || "GET",
      hasToken: !!token,
      hasBody: !!options?.body,
    });

    try {
      const response = await fetch(url, {
        headers: {
          ...headers,
          ...options?.headers,
        },
        ...options,
      });

      // Debug logging
      console.log("📡 API Response:", {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
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

        console.error("❌ API Error:", {
          url,
          status: response.status,
          errorData,
          hasToken: !!token,
        });

        // Handle specific error cases
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

      // 🔧 FIXED: Handle different response types properly

      // Handle 204 No Content
      if (response.status === 204) {
        console.log("✅ API Success: No Content (204)");
        return null;
      }

      // Check if response has content
      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");

      // If no content-type or content-length is 0, return null
      if (!contentType || contentLength === "0") {
        console.log("✅ API Success: Empty response");
        return null;
      }

      // If response says it's JSON, try to parse it
      if (contentType.includes("application/json")) {
        const text = await response.text();

        // Handle empty JSON responses
        if (!text || text.trim() === "") {
          console.log("✅ API Success: Empty JSON response");
          return null;
        }

        try {
          const data = JSON.parse(text);
          console.log("✅ API Success:", {
            url,
            dataType: Array.isArray(data) ? `Array(${data.length})` : "Object",
          });
          return data;
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          console.error("❌ Response text:", text);
          throw new Error(
            `Invalid JSON response from server: ${parseError.message}`
          );
        }
      }

      // If it's not JSON, try to get text response
      const text = await response.text();
      console.log("✅ API Success: Text response");

      // If the text looks like JSON, try to parse it
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error("❌ Failed to parse JSON-like text:", text);
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      }

      // Return text as-is if it's not JSON
      return text || null;
    } catch (error) {
      // Don't log fetch errors twice
      if (error.message.includes("JSON") || error.message.includes("HTTP")) {
        throw error;
      }

      console.error("🚨 Network/Fetch Error:", { url, error });
      throw new Error(`Network error: ${error.message}`);
    }
  }
  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Job-related methods

  async jobExists(id: string): Promise<boolean> {
    try {
      await this.getJobById(id);
      return true;
    } catch (error) {
      console.log("Job existence check failed:", error.message);
      return false;
    }
  }

  async getJobById(id: string): Promise<ApiJob> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view job details");
    }

    console.log("🔍 Loading job by ID:", id);

    try {
      const job = await this.fetchApi(`/jobs/${id}`);

      if (!job) {
        throw new Error("Job not found");
      }

      console.log("✅ Job loaded:", job.title);
      return job;
    } catch (error) {
      console.error("❌ Failed to load job:", error);

      // Provide more helpful error messages
      if (error.message.includes("404")) {
        throw new Error("Job not found. It may have been deleted.");
      } else if (error.message.includes("401")) {
        throw new Error("Authentication required. Please log in again.");
      } else if (error.message.includes("403")) {
        throw new Error("You do not have permission to view this job.");
      }

      throw error;
    }
  }

  async getAllJobs(status?: string, companyId?: string): Promise<ApiJob[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view jobs");
    }
    let backendStatus = status;
    if (status === "active") {
      backendStatus = "Open"; // Backend uses "open" for active jobs
    }
    // Build query parameters
    const params = new URLSearchParams();
    if (backendStatus && backendStatus.trim())
      params.append("status", backendStatus);
    if (companyId && companyId.trim()) params.append("companyId", companyId);

    const queryString = params.toString();
    const endpoint = `/jobs${queryString ? `?${queryString}` : ""}`;

    console.log(
      `📡 Loading jobs with backend status: "${backendStatus}" (frontend requested: "${status}")`
    );

    return this.fetchApi(endpoint);
  }

  async createJob(data: CreateJobRequest): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to create jobs");
    }
    return this.fetchApi("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateJob(id: string, data: UpdateJobRequest): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to update jobs");
    }

    console.log("🔄 Updating job:", id);
    console.log("📝 Update data:", data);

    try {
      const response = await this.fetchApi(`/jobs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      // The response might be null for successful updates (204 No Content)
      console.log("✅ Job update response:", response);

      // No need to return anything for successful updates
      return;
    } catch (error) {
      console.error("❌ Job update failed:", error);
      throw error;
    }
  }

  async deleteJob(id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to delete jobs");
    }
    return this.fetchApi(`/jobs/${id}`, {
      method: "DELETE",
    });
  }

  async getJobsByCompany(companyId: string): Promise<ApiJob[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view company jobs");
    }
    return this.fetchApi(`/jobs/company/${companyId}`);
  }

  // Company-related methods
  async getCompanyById(id: string): Promise<ApiCompany> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view company details");
    }
    return this.fetchApi(`/companies/${id}`);
  }

  async getAllCompanies(
    industry?: string,
    isVerified?: boolean
  ): Promise<ApiCompany[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view companies");
    }

    const params = new URLSearchParams();
    if (industry && industry.trim()) params.append("industry", industry);
    if (isVerified !== undefined)
      params.append("isVerified", isVerified.toString());

    const queryString = params.toString();
    const endpoint = `/companies/filter${queryString ? `?${queryString}` : ""}`;

    return this.fetchApi(endpoint);
  }

  // Test method to check API connectivity and auth
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        console.warn("⚠️ No authentication token found");
        return false;
      }
      // Try to get jobs without any filters
      await this.fetchApi("/jobs");
      return true;
    } catch (error) {
      console.error("❌ API Connection Test Failed:", error);
      return false;
    }
  }

  // Utility methods to convert between API and frontend formats (unchanged)
  convertApiJobToFormData(apiJob: ApiJob, company?: ApiCompany): JobFormData {
    return {
      title: apiJob.title,
      company: company?.name,
      department: "",
      description: apiJob.description,
      location: this.extractLocationString(apiJob.locations),
      locationType: this.mapLocationTypeToFormData(apiJob.locationType),
      type: apiJob.employmentType,
      experience: this.mapExperienceToFormData(
        apiJob.seniorityLevel,
        apiJob.experienceYearsMin
      ),
      responsibilities: apiJob.responsibilities || [],
      requirements: apiJob.requirements || [],
      qualifications: apiJob.qualifications || [],
      benefits: apiJob.benefits || [],
      skills: [],
      salary: {
        min: apiJob.salaryMin,
        max: apiJob.salaryMax,
        currency: apiJob.salaryCurrency || "USD",
        period: "per year",
      },
      applicationSettings: {
        deadline: apiJob.applicationDeadline,
        questionsRequired: false,
        resumeRequired: true,
        coverLetterRequired: false,
        portfolioRequired: false,
      },
    };
  }

  convertFormDataToUpdateRequest(formData: JobFormData): UpdateJobRequest {
    return {
      title: formData.title,
      description: formData.description,
      responsibilities: formData.responsibilities.filter((r) => r.trim()),
      requirements: formData.requirements.filter((r) => r.trim()),
      qualifications: formData.qualifications.filter((q) => q.trim()),
      benefits: formData.benefits.filter((b) => b.trim()),
      employmentType: formData.type,
      seniorityLevel: this.mapFormDataToSeniorityLevel(formData.experience),
      experienceYearsMin: this.extractMinExperience(formData.experience),
      locationType: this.mapFormDataToLocationType(formData.locationType),
      locations: this.createLocationObject(
        formData.location,
        formData.locationType
      ),
      salaryMin: formData.salary.min,
      salaryMax: formData.salary.max,
      salaryCurrency: formData.salary.currency,
      applicationDeadline: formData.applicationSettings.deadline || undefined,
      status: "draft", // Always save as draft when editing
    };
  }

  convertFormDataToCreateRequest(
    formData: JobFormData,
    companyId: string,
    createdBy: string
  ): CreateJobRequest {
    const updateRequest = this.convertFormDataToUpdateRequest(formData);
    return {
      ...updateRequest,
      companyId,
      createdBy,
      title: formData.title,
      description: formData.description,
      responsibilities: formData.responsibilities.filter((r) => r.trim()),
      requirements: formData.requirements.filter((r) => r.trim()),
      qualifications: formData.qualifications.filter((q) => q.trim()),
      benefits: formData.benefits.filter((b) => b.trim()),
      employmentType: formData.type,
      seniorityLevel: this.mapFormDataToSeniorityLevel(formData.experience),
      locationType: this.mapFormDataToLocationType(formData.locationType),
      locations: this.createLocationObject(
        formData.location,
        formData.locationType
      ),
      salaryCurrency: formData.salary.currency,
      status: "draft",
      aiGeneratedDescription: false,
      skillMatchThreshold: 0.7,
    };
  }

  // Helper methods for data transformation (unchanged from original)
  private extractLocationString(locations: Record<string, any>): string {
    if (!locations) return "Location not specified";

    if (locations.city && locations.state) {
      return `${locations.city}, ${locations.state}`;
    }

    if (locations.address) {
      return locations.address;
    }

    if (locations.description) {
      return locations.description;
    }

    if (typeof locations === "string") {
      return locations;
    }

    return "Location not specified";
  }

  private mapLocationTypeToFormData(
    locationType: string
  ): "On-site" | "Remote" | "Hybrid" {
    switch (locationType?.toLowerCase()) {
      case "remote":
        return "Remote";
      case "hybrid":
        return "Hybrid";
      case "on-site":
      case "onsite":
      default:
        return "On-site";
    }
  }

  private mapFormDataToLocationType(
    locationType: "On-site" | "Remote" | "Hybrid"
  ): string {
    switch (locationType) {
      case "Remote":
        return "remote";
      case "Hybrid":
        return "hybrid";
      case "On-site":
      default:
        return "on-site";
    }
  }

  private mapExperienceToFormData(
    seniorityLevel: string,
    minYears?: number
  ): string {
    if (minYears !== undefined) {
      if (minYears === 0) return "0-1 years";
      if (minYears <= 1) return "1-3 years";
      if (minYears <= 3) return "3-5 years";
      if (minYears <= 5) return "5-8 years";
      if (minYears <= 8) return "8+ years";
      return "10+ years";
    }

    switch (seniorityLevel?.toLowerCase()) {
      case "entry":
      case "junior":
        return "0-1 years";
      case "mid":
      case "intermediate":
        return "3-5 years";
      case "senior":
        return "5-8 years";
      case "lead":
      case "principal":
        return "8+ years";
      case "executive":
        return "10+ years";
      default:
        return "3-5 years";
    }
  }

  private mapFormDataToSeniorityLevel(experience: string): string {
    if (experience.includes("0-1") || experience.includes("1-3"))
      return "junior";
    if (experience.includes("3-5")) return "mid";
    if (experience.includes("5-8")) return "senior";
    if (experience.includes("8+")) return "lead";
    if (experience.includes("10+")) return "executive";
    return "mid";
  }

  // 🔧 FIXED: Helper method to convert frontend status to backend status
  private mapFrontendStatusToBackend(frontendStatus: string): string {
    switch (frontendStatus.toLowerCase()) {
      case "active":
        return "open"; // Frontend "Active" -> Backend "Open"
      case "draft":
        return "draft"; // Frontend "Draft" -> Backend "Draft"
      case "paused":
        return "paused"; // Frontend "Paused" -> Backend "Paused"
      case "closed":
        return "closed"; // Frontend "Closed" -> Backend "Closed"
      default:
        return "draft"; // Default fallback
    }
  }

  // 🔧 FIXED: Helper method to convert backend status to frontend status
  private mapBackendStatusToFrontend(
    backendStatus: string
  ): "Draft" | "Active" | "Paused" | "Closed" {
    switch (backendStatus.toLowerCase()) {
      case "open":
        return "Active"; // Backend "Open" -> Frontend "Active"
      case "draft":
        return "Draft"; // Backend "Draft" -> Frontend "Draft"
      case "paused":
        return "Paused"; // Backend "Paused" -> Frontend "Paused"
      case "closed":
        return "Closed"; // Backend "Closed" -> Frontend "Closed"
      default:
        console.warn("🚨 Unknown backend status:", backendStatus);
        return "Draft"; // Default fallback
    }
  }

  private extractMinExperience(experience: string): number {
    const match = experience.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  private createLocationObject(
    location: string | Record<string, any>,
    locationType: "On-site" | "Remote" | "Hybrid"
  ): Record<string, any> {
    // If location is already an object, use it as base and just update the type
    if (typeof location === "object" && location !== null) {
      return {
        ...location,
        type: locationType.toLowerCase(),
      };
    }

    // Handle null/undefined case
    if (!location) {
      return {
        type: locationType.toLowerCase(),
        description:
          locationType === "Remote" ? "Remote work" : "Location not specified",
      };
    }

    // Now we know location is a string, proceed with original logic
    const locationStr = String(location); // Ensure it's a string
    const parts = locationStr.split(",").map((p) => p.trim());

    if (locationType === "Remote") {
      return {
        type: "remote",
        description: "Remote work",
        address: locationStr,
      };
    }

    if (parts.length >= 2) {
      return {
        city: parts[0],
        state: parts[1],
        type: locationType.toLowerCase(),
        address: locationStr,
      };
    }

    return {
      address: locationStr,
      type: locationType.toLowerCase(),
      description: locationStr,
    };
  }
}

export const jobService = new JobService();

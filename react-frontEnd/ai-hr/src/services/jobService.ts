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
          return null;
        }

        try {
          const data = JSON.parse(text);

          return data;
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          console.error("❌ Response text:", text);
          throw new Error(
            `Invalid JSON response from server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
          );
        }
      }

      // If it's not JSON, try to get text response
      const text = await response.text();

      // If the text looks like JSON, try to parse it
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error("❌ Failed to parse JSON-like text:", text);
          throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      }

      // Return text as-is if it's not JSON
      return text || null;
    } catch (error) {
      // Don't log fetch errors twice
      if (error instanceof Error && (error.message.includes("JSON") || error.message.includes("HTTP"))) {
        throw error;
      }

      console.error("🚨 Network/Fetch Error:", { url, error });
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.log("Job existence check failed:", error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async getJobById(id: string): Promise<ApiJob> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view job details");
    }

    try {
      const response = await this.fetchApi(`/jobs/${id}`);

      if (!response) {
        throw new Error("Job not found");
      }

      // Handle wrapped response from backend
      console.log("🔍 JobService - Raw response:", response);
      const job = response.data || response;
      console.log("🔍 JobService - Extracted job:", job);
      console.log("🔍 JobService - Job has InterviewTemplate:", !!(job as any)?.InterviewTemplate);
      
      if (!job) {
        throw new Error("Job not found");
      }

      // Map PascalCase InterviewTemplate to camelCase interviewTemplate
      if ((job as any).InterviewTemplate && !(job as any).interviewTemplate) {
        (job as any).interviewTemplate = (job as any).InterviewTemplate;
        console.log("🔄 Mapped InterviewTemplate to interviewTemplate");
      }

      return job;
    } catch (error) {
      console.error("❌ Failed to load job:", error);

      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          throw new Error("Job not found. It may have been deleted.");
        } else if (error.message.includes("401")) {
          throw new Error("Authentication required. Please log in again.");
        } else if (error.message.includes("403")) {
          throw new Error("You do not have permission to view this job.");
        }
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
      backendStatus = "Open";
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (backendStatus && backendStatus.trim()) {
      params.append("status", backendStatus);
    }

    // 🔥 ALWAYS INCLUDE COMPANY ID FOR HIRING USERS
    if (companyId && companyId.trim()) {
      params.append("companyId", companyId);
      console.log("📊 Filtering jobs by company ID:", companyId);
    } else {
      console.warn("⚠️ No company ID provided - this may return all jobs");
    }

    const queryString = params.toString();
    const endpoint = `/jobs${queryString ? `?${queryString}` : ""}`;

    console.log("📊 Fetching jobs from endpoint:", endpoint);

    const jobs = await this.fetchApi(endpoint);
    console.log("📊 Received jobs:", jobs?.length || 0);

    return jobs;
  }

  getCurrentUser() {
    if (typeof window === "undefined") {
      return { token: null, userId: null, userCategory: null, companyId: null };
    }
  
    const token = this.getAuthToken();
    const userCategory = localStorage.getItem("userCategory") || sessionStorage.getItem("userCategory");
  
    // Get user data to extract userId and companyId
    const currentUserStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    let userId = null;
    let companyId = null;
  
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        userId = currentUser.id;
        companyId = currentUser.companyId;
        console.log("👤 getCurrentUser - parsed user data:", { userId, companyId });
      } catch (error) {
        console.warn("Failed to parse currentUser from storage:", error);
      }
    }
  
    return { token, userId, userCategory, companyId };
  }

  
  async createJob(data: CreateJobRequest): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to create jobs");
    }
    
    console.log("🚀 JobService createJob called with data:", {
      ...data,
      interviewTemplateId: data.interviewTemplateId
    });
    
    return this.fetchApi("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateJob(id: string, data: UpdateJobRequest): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to update jobs");
    }

    try {
      const response = await this.fetchApi(`/jobs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      // No need to return anything for successful updates
      return;
    } catch (error) {
      console.error("❌ Job update failed:", error);
      throw error;
    }
  }

  async deleteJob(id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to delete job");
    }

    await this.fetchApi(`/jobs/${id}`, { method: "DELETE" });
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

  // Public methods for applicant job browsing (no auth required)
  async getPublicJobs(status?: string, companyId?: string): Promise<ApiJob[]> {
    let backendStatus = status;
    if (status === "active") {
      backendStatus = "Open";
    }

    // Build query parameters for public endpoint
    const params = new URLSearchParams();
    if (backendStatus && backendStatus.trim())
      params.append("status", backendStatus);
    if (companyId && companyId.trim()) params.append("companyId", companyId);

    const queryString = params.toString();
    const endpoint = `/public/jobs${queryString ? `?${queryString}` : ""}`;

    console.log("🌍 Fetching public jobs from:", endpoint);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const jobs = await response.json();
      console.log("✅ Public jobs fetched successfully:", jobs.length);
      return jobs;
    } catch (error: unknown) {
      console.error("❌ Failed to fetch public jobs:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch public jobs");
    }
  }

  async getPublicJobById(id: string): Promise<ApiJob> {
    console.log("🌍 Fetching public job by ID:", id);

    try {
      const response = await fetch(`${API_BASE_URL}/public/jobs/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
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

        // Provide more helpful error messages
        if (response.status === 404) {
          throw new Error("Job not found or is no longer available.");
        }

        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const job = await response.json();
      console.log("✅ Public job fetched successfully:", job.title);
      return job;
    } catch (error: unknown) {
      console.error("❌ Failed to fetch public job:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch public job");
    }
  }

  // Utility methods to convert between API and frontend formats - updated for city/country
  convertApiJobToFormData(apiJob: ApiJob, company?: ApiCompany): JobFormData {
    const location = this.extractLocationFromObject(apiJob.locations);
    return {
      title: apiJob.title,
      company: company?.name,
      department: apiJob.department || "",
      description: apiJob.description,
      city: location.city,
      country: location.country,
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

  convertFormDataToUpdateRequest(
    formData: JobFormData
    // status?: string
  ): UpdateJobRequest {
    return {
      title: formData.title,
      department: formData.department || "",
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
        formData.city,
        formData.country,
        formData.locationType
      ),
      salaryMin: formData.salary.min,
      salaryMax: formData.salary.max,
      salaryCurrency: formData.salary.currency,
      applicationDeadline: formData.applicationSettings.deadline || undefined,
      status: "Draft", // Always save as draft when editing
      interviewTemplateId: formData.interviewTemplateId,
    };
  }

  convertFormDataToCreateRequest(
    formData: JobFormData,
    companyId: string,
    createdBy: string
  ): CreateJobRequest {
    console.log("🔧 Converting form data to create request. FormData.interviewTemplateId:", formData.interviewTemplateId);
    
    const updateRequest = this.convertFormDataToUpdateRequest(formData);
    const createRequest = {
      ...updateRequest,
      companyId,
      createdBy,
      title: formData.title,
      description: formData.description,
      department: formData.department || "",
      responsibilities: formData.responsibilities.filter((r) => r.trim()),
      requirements: formData.requirements.filter((r) => r.trim()),
      qualifications: formData.qualifications.filter((q) => q.trim()),
      benefits: formData.benefits.filter((b) => b.trim()),
      employmentType: formData.type,
      seniorityLevel: this.mapFormDataToSeniorityLevel(formData.experience),
      locationType: this.mapFormDataToLocationType(formData.locationType),
      locations: this.createLocationObject(
        formData.city,
        formData.country,
        formData.locationType
      ),
      salaryCurrency: formData.salary.currency,
      status: "draft",
      aiGeneratedDescription: false,
      skillMatchThreshold: 0.7,
      interviewTemplateId: formData.interviewTemplateId,
    };
    
    console.log("🔧 Created request with interviewTemplateId:", createRequest.interviewTemplateId);
    return createRequest;
  }

  // Helper methods for data transformation - updated to extract city and country
  private extractLocationFromObject(locations: Record<string, any>): { city: string; country: string } {
    if (!locations) return { city: "", country: "" };

    // Direct city and country fields
    if (locations.city || locations.country) {
      return {
        city: locations.city || "",
        country: locations.country || ""
      };
    }

    // Legacy support: try to extract from address
    if (locations.address && typeof locations.address === "string") {
      const parts = locations.address.split(",").map((p: string) => p.trim());
      return {
        city: parts[0] || "",
        country: parts[1] || ""
      };
    }

    // Legacy support: try description
    if (locations.description && typeof locations.description === "string") {
      const parts = locations.description.split(",").map((p: string) => p.trim());
      return {
        city: parts[0] || "",
        country: parts[1] || ""
      };
    }

    return { city: "", country: "" };
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
        return "Open"; // Frontend "Active" -> Backend "Open"
      case "draft":
        return "Draft"; // Frontend "Draft" -> Backend "Draft"
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
      case "Open":
        return "Active"; // Backend "Open" -> Frontend "Active"
      case "Draft":
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
    city: string,
    country: string,
    locationType: "On-site" | "Remote" | "Hybrid"
  ): Record<string, any> {
    // Ensure city and country are strings
    const cityStr = String(city || "").trim();
    const countryStr = String(country || "").trim();

    // Handle null/undefined case
    if (!cityStr && !countryStr) {
      return {
        type: locationType.toLowerCase(),
        description:
          locationType === "Remote" ? "Remote work" : "Location not specified",
      };
    }

    if (locationType === "Remote") {
      return {
        type: "remote",
        description: "Remote work",
        city: cityStr || "Remote",
        country: countryStr || "Global",
      };
    }

    return {
      city: cityStr,
      country: countryStr,
      type: locationType.toLowerCase(),
      address: cityStr && countryStr ? `${cityStr}, ${countryStr}` : cityStr || countryStr,
      description: cityStr && countryStr ? `${cityStr}, ${countryStr}` : cityStr || countryStr || "Location not specified",
    };
  }

  async getInterviewTemplatesForJobs(): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view interview templates");
    }

    try {
      const templates = await this.fetchApi("/jobs/interview-templates");
      return templates || [];
    } catch (error) {
      console.error("❌ Failed to load interview templates:", error);
      throw error;
    }
  }
}

export const jobService = new JobService();

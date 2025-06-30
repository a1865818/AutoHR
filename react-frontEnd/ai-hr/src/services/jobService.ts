import {
  BulkJobStatusChangeRequest,
  JobDuplicateRequest,
  JobFormData,
  Job,
  JobStatusChangeRequest,
  JobStatusHistory,
} from "@/interfaces";
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
            `Invalid JSON response from server: ${
              parseError instanceof Error ? parseError.message : "Unknown error"
            }`
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
          throw new Error(
            `Invalid JSON response: ${
              parseError instanceof Error ? parseError.message : "Unknown error"
            }`
          );
        }
      }

      // Return text as-is if it's not JSON
      return text || null;
    } catch (error) {
      // Don't log fetch errors twice
      if (
        error instanceof Error &&
        (error.message.includes("JSON") || error.message.includes("HTTP"))
      ) {
        throw error;
      }

      console.error("🚨 Network/Fetch Error:", { url, error });
      throw new Error(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
      console.log(
        "Job existence check failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
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
      console.log(
        "🔍 JobService - Job has InterviewTemplate:",
        !!(job as any)?.InterviewTemplate
      );

      if (!job) {
        throw new Error("Job not found");
      }

      // Map PascalCase InterviewTemplate to camelCase interviewTemplate
      if ((job as any).InterviewTemplate && !(job as any).interviewTemplate) {
        (job as any).interviewTemplate = (job as any).InterviewTemplate;
        console.log("🔄 Mapped InterviewTemplate to interviewTemplate");
      }

      return {
        ...job,
        status: job.status,
      };
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

    // Don't do complex conversions - pass status directly to backend

    // Build query parameters
    const params = new URLSearchParams();
    if (status && status.trim()) {
      params.append("status", status);
      console.log("📊 Requesting jobs with backend status:", status);
    }

    // Always include company ID for hiring users
    if (companyId && companyId.trim()) {
      params.append("companyId", companyId);
      console.log("📊 Filtering jobs by company ID:", companyId);
    } else {
      console.warn("⚠️ No company ID provided - this may return all jobs");
    }

    const queryString = params.toString();
    const endpoint = `/jobs${queryString ? `?${queryString}` : ""}`;

    console.log("📊 Final API endpoint:", endpoint);

    const jobs = await this.fetchApi(endpoint);
    console.log("📊 Received jobs from API:", jobs?.length || 0);

    // ✅ MINIMAL PROCESSING - Don't convert statuses, let the frontend handle it
    return jobs || [];
  }

  getCurrentUser() {
    if (typeof window === "undefined") {
      return { token: null, userId: null, userCategory: null, companyId: null };
    }

    const token = this.getAuthToken();
    const userCategory =
      localStorage.getItem("userCategory") ||
      sessionStorage.getItem("userCategory");

    // Get user data to extract userId and companyId
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
        console.log("👤 getCurrentUser - parsed user data:", {
          userId,
          companyId,
        });
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
      interviewTemplateId: data.interviewTemplateId,
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

  //   Status Change

  async changeJobStatus(
    jobId: string,
    request: JobStatusChangeRequest
  ): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to change job status");
    }

    try {
      console.log(`🔄 Changing job ${jobId} status to ${request.status}`);

      // Ensure status is properly capitalized before sending to backend
      const normalizedRequest = {
        ...request,
        status: this.toBackendStatus(request.status),
      };

      const response = await this.fetchApi(`/jobs/${jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify(normalizedRequest),
      });

      console.log(`✅ Successfully changed job status`);
      return response;
    } catch (error) {
      console.error("❌ Failed to change job status:", error);
      throw error;
    }
  }

  async bulkChangeJobStatus(request: BulkJobStatusChangeRequest): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to change job statuses");
    }

    try {
      console.log(`🔄 Bulk changing status for ${request.jobIds.length} jobs`);

      // Ensure status is properly capitalized
      const normalizedRequest = {
        ...request,
        status: this.toBackendStatus(request.status),
      };

      const response = await this.fetchApi("/jobs/bulk-status", {
        method: "PATCH",
        body: JSON.stringify(normalizedRequest),
      });

      console.log(`✅ Bulk status change completed`);
      return response;
    } catch (error) {
      console.error("❌ Failed to bulk change job statuses:", error);
      throw error;
    }
  }

  async duplicateJob(
    jobId: string,
    request: JobDuplicateRequest
  ): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to duplicate job");
    }

    try {
      console.log(`📋 Duplicating job ${jobId}`);

      // Ensure status is properly capitalized
      const normalizedRequest = {
        ...request,
        status: request.status ? this.toBackendStatus(request.status) : "Draft",
      };

      const response = await this.fetchApi(`/jobs/${jobId}/duplicate`, {
        method: "POST",
        body: JSON.stringify(normalizedRequest),
      });

      console.log(`✅ Successfully duplicated job`);
      return response;
    } catch (error) {
      console.error("❌ Failed to duplicate job:", error);
      throw error;
    }
  }

  async getJobsByStatus(status: string): Promise<ApiJob[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view jobs");
    }

    try {
      console.log(`📊 Getting jobs with status: ${status}`);
      const jobs = await this.fetchApi(`/jobs/by-status/${status}`);

      // Normalize status in response
      return jobs.map((job: any) => ({
        ...job,
        status: job.status,
      }));
    } catch (error) {
      console.error("❌ Failed to get jobs by status:", error);
      throw error;
    }
  }

  async getJobStatusHistory(jobId: string): Promise<JobStatusHistory[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view job status history");
    }

    try {
      const history = await this.fetchApi(`/jobs/${jobId}/status-history`);

      // Normalize statuses in history
      return history.map((record: any) => ({
        ...record,
        fromStatus: record.fromStatus,
        toStatus: record.toStatus,
      }));
    } catch (error) {
      console.error("❌ Failed to get job status history:", error);
      throw error;
    }
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
    // Build query parameters for public endpoint
    const params = new URLSearchParams();
    if (status && status.trim()) params.append("status", status);
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

  // Get job analytics (for hiring users)
  async getJobAnalytics(jobId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view job analytics");
    }

    try {
      const analytics = await this.fetchApi(`/jobs/${jobId}/analytics`);
      return analytics;
    } catch (error) {
      console.error("❌ Failed to load job analytics:", error);
      throw error;
    }
  }

  // Fix all view counts (admin function)
  async fixAllViewCounts(): Promise<{
    message: string;
    totalJobs: number;
    updatedJobs: number;
    errors: number;
    success: boolean;
  }> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to fix view counts");
    }

    try {
      const result = await this.fetchApi("/jobs/fix-view-counts", {
        method: "POST",
      });
      return result;
    } catch (error) {
      console.error("❌ Failed to fix view counts:", error);
      throw error;
    }
  }

  //Create session ID for job view tracking
  getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "server-side";

    let sessionId = sessionStorage.getItem("viewSessionId");
    if (!sessionId) {
      sessionId =
        "view_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
      sessionStorage.setItem("viewSessionId", sessionId);
    }
    return sessionId;
  }

  // Check if user has viewed a specific job (client-side tracking)
  hasViewedJob(jobId: string): boolean {
    if (typeof window === "undefined") return false;

    const viewedJobs = JSON.parse(localStorage.getItem("viewedJobs") || "[]");
    return viewedJobs.includes(jobId);
  }

  // Mark job as viewed (client-side tracking)
  markJobAsViewed(jobId: string): void {
    if (typeof window === "undefined") return;

    const viewedJobs = JSON.parse(localStorage.getItem("viewedJobs") || "[]");
    if (!viewedJobs.includes(jobId)) {
      viewedJobs.push(jobId);
      localStorage.setItem("viewedJobs", JSON.stringify(viewedJobs));
      console.log(`📊 Marked job ${jobId} as viewed (client-side)`);
    }
  }

  // Get view statistics for a job (hiring users only)
  async getJobViewStats(jobId: string): Promise<{
    totalViews: number;
    viewsByUserType: Record<string, number>;
    applicationRate: number;
  }> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view job statistics");
    }

    try {
      const analytics = await this.getJobAnalytics(jobId);
      return {
        totalViews: analytics.TotalViews || 0,
        viewsByUserType: analytics.ViewsByUserType || {},
        applicationRate: analytics.ApplicationRate || 0,
      };
    } catch (error) {
      console.error("❌ Failed to load job view stats:", error);
      return {
        totalViews: 0,
        viewsByUserType: {},
        applicationRate: 0,
      };
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
      interviewTemplateId: apiJob.interviewTemplateId,
      viewCount: apiJob.viewCount || 0,
    };
  }

  // Convert API job to frontend Job interface (with view count)
  convertApiJobToJob(apiJob: ApiJob, company?: ApiCompany): Job {
    const location = this.extractLocationFromObject(apiJob.locations);
    return {
      id: apiJob.id,
      title: apiJob.title,
      company: company?.name || "Unknown Company",
      location: this.formatLocationString(location),
      locationType: this.mapLocationTypeToFormData(apiJob.locationType),
      type: apiJob.employmentType as
        | "Full-Time"
        | "Part-Time"
        | "Contract"
        | "Internship",
      department: apiJob.department || "Not specified",
      experience: this.mapExperienceToFormData(
        apiJob.seniorityLevel,
        apiJob.experienceYearsMin
      ),
      salary: {
        min: apiJob.salaryMin || 0,
        max: apiJob.salaryMax || 0,
        currency: apiJob.salaryCurrency || "USD",
        period: "per year",
      },
      description: apiJob.description,
      requirements: apiJob.requirements || [],
      qualifications: apiJob.qualifications || [],
      responsibilities: apiJob.responsibilities || [],
      benefits: apiJob.benefits || [],
      skills: [],
      applicationSettings: {
        deadline: apiJob.applicationDeadline || "",
        questionsRequired: false,
        resumeRequired: true,
        coverLetterRequired: false,
        portfolioRequired: false,
      },
      postedDate: this.formatPostedDate(apiJob.postedDate || apiJob.createdAt),
      status: apiJob.status,
      applicants: apiJob.applicantCount || 0,
      viewCount: apiJob.viewCount || 0, // Include view count
      createdBy: apiJob.createdBy,
      updatedAt: apiJob.createdAt,
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
    console.log(
      "🔧 Converting form data to create request. FormData.interviewTemplateId:",
      formData.interviewTemplateId
    );

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

    console.log(
      "🔧 Created request with interviewTemplateId:",
      createRequest.interviewTemplateId
    );
    return createRequest;
  }

  // Helper method to format location string
  private formatLocationString(location: {
    city: string;
    country: string;
  }): string {
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    return location.city || location.country || "Location not specified";
  }

  // Helper method to format posted date
  private formatPostedDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 14) return "1 week ago";
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch (error) {
      return "Recently posted";
    }
  }

  // Helper methods for data transformation - updated to extract city and country
  private extractLocationFromObject(locations: Record<string, any>): {
    city: string;
    country: string;
  } {
    if (!locations) return { city: "", country: "" };

    // Direct city and country fields
    if (locations.city || locations.country) {
      return {
        city: locations.city || "",
        country: locations.country || "",
      };
    }

    // Legacy support: try to extract from address
    if (locations.address && typeof locations.address === "string") {
      const parts = locations.address.split(",").map((p: string) => p.trim());
      return {
        city: parts[0] || "",
        country: parts[1] || "",
      };
    }

    // Legacy support: try description
    if (locations.description && typeof locations.description === "string") {
      const parts = locations.description
        .split(",")
        .map((p: string) => p.trim());
      return {
        city: parts[0] || "",
        country: parts[1] || "",
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


  // Helper method to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Paused":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-red-100 text-red-800";
      case "Expired":
        return "bg-orange-100 text-orange-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      address:
        cityStr && countryStr
          ? `${cityStr}, ${countryStr}`
          : cityStr || countryStr,
      description:
        cityStr && countryStr
          ? `${cityStr}, ${countryStr}`
          : cityStr || countryStr || "Location not specified",
    };
  }

  async getApplicantJobById(id: string): Promise<ApiJob> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view job details");
    }

    try {
      console.log(`👤 FRONTEND: API call for applicant job ${id}`);
      console.log(`👤 FRONTEND: Timestamp: ${new Date().toISOString()}`);

      const job = await this.fetchApi(`/applicant/jobs/${id}`);

      console.log(`👤 FRONTEND: Applicant job API call completed for ${id}`);
      console.log(`👤 FRONTEND: Job title: ${job?.title}`);
      console.log(
        `👤 FRONTEND: Current view count in response: ${
          job?.viewCount || job?.ViewCount
        }`
      );

      if (!job) {
        throw new Error("Job not found");
      }

      return job;
    } catch (error) {
      console.error("❌ FRONTEND: Failed to load applicant job:", error);

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

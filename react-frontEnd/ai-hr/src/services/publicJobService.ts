import { ApiCompany, ApiJob } from "@/interfaces";
import { sessionManager } from "@/utils/sessionManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

class PublicJobService {
  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
      );
    }
    return null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("🔑 Adding auth token to public job request");
    } else {
      console.log("👤 No auth token found - anonymous request");

      // For anonymous users, add consistent session ID
      const sessionId = sessionManager.getOrCreateSessionId();
      headers["X-Session-ID"] = sessionId;
      console.log(`📱 Adding session ID header: ${sessionId}`);
    }

    return headers;
  }

  // Get all public jobs (no authentication required)
  async getPublicJobs(
    filters?: {
      status?: string;
      companyId?: string;
      location?: string;
      employmentType?: string;
      experience?: string;
    },
    page?: number,
    pageSize?: number
  ): Promise<{
    jobs: ApiJob[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      console.log("🌍 FRONTEND: Fetching public jobs...");
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.companyId) params.append("companyId", filters.companyId);
      if (page) params.append("page", page.toString());
      if (pageSize) params.append("pageSize", pageSize.toString());

      const response = await fetch(
        `${API_BASE_URL}/public/jobs${
          params.toString() ? `?${params.toString()}` : ""
        }`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...this.getHeaders(), // 🔥 Use headers with optional auth
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ FRONTEND: Fetched ${data.jobs?.length || 0} public jobs`);
      return data;
    } catch (error) {
      console.error("❌ FRONTEND: Error fetching public jobs:", error);
      throw new Error("Failed to fetch public jobs");
    }
  }

  // Get a specific public job by ID (no authentication required)
  async getPublicJobById(jobId: string): Promise<ApiJob> {
    try {
      console.log(`🌍 Fetching public job: ${jobId}`);

      const response = await fetch(`${API_BASE_URL}/public/jobs/${jobId}`, {
        method: "GET",
        headers: this.getHeaders(), // 🔥 Use headers with optional auth
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Job not found or is no longer available");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const job = await response.json();
      console.log(`✅ Fetched public job: ${job.title}`);
      return job;
    } catch (error) {
      console.error(`❌ Error fetching public job ${jobId}:`, error);
      throw error;
    }
  }

  // Get company info (this might need to be a public endpoint too)
  async getCompanyById(companyId: string): Promise<ApiCompany> {
    try {
      console.log(`🌍 Fetching company info: ${companyId}`);

      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...this.getHeaders(), // 🔥 Use headers with optional auth
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Company not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const company = await response.json();
      console.log(`✅ Fetched company: ${company.name}`);
      return company;
    } catch (error) {
      console.error(`❌ Error fetching company ${companyId}:`, error);
      throw error;
    }
  }

  // Submit guest application (no authentication required)
  async submitGuestApplication(
    jobId: string,
    applicationData: {
      personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        city: string;
        country: string;
        countryCode: string;
      };
      resume: File;
      coverLetter?: string;
      experience?: Array<{
        title: string;
        company: string;
        location: string;
        description: string;
        startDate: string;
        endDate?: string;
        isCurrent: boolean;
      }>;
      education?: Array<{
        institution: string;
        degree: string;
        major: string;
        location: string;
        description?: string;
        startDate: string;
        endDate?: string;
        isCurrentlyAttending: boolean;
      }>;
    }
  ): Promise<{ applicationId: string; message: string }> {
    try {
      console.log(`🌍 Submitting guest application for job: ${jobId}`);

      const formData = new FormData();

      // Add job ID
      formData.append("jobId", jobId);

      // Add application type flag
      formData.append("isPublic", "true");

      // Add personal info
      formData.append("firstName", applicationData.personalInfo.firstName);
      formData.append("lastName", applicationData.personalInfo.lastName);
      formData.append("email", applicationData.personalInfo.email);
      formData.append("phoneNumber", applicationData.personalInfo.phoneNumber);
      formData.append("city", applicationData.personalInfo.city);
      formData.append("country", applicationData.personalInfo.country);
      formData.append("countryCode", applicationData.personalInfo.countryCode);

      // Add resume file
      formData.append("resume", applicationData.resume);

      // Add optional data
      if (applicationData.coverLetter) {
        formData.append("coverLetter", applicationData.coverLetter);
      }

      if (applicationData.experience && applicationData.experience.length > 0) {
        formData.append(
          "experience",
          JSON.stringify(applicationData.experience)
        );
      }

      if (applicationData.education && applicationData.education.length > 0) {
        formData.append("education", JSON.stringify(applicationData.education));
      }

      const response = await fetch(
        `${API_BASE_URL}/public/jobs/${jobId}/apply`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log(`✅ Guest application submitted: ${result.applicationId}`);
      return result;
    } catch (error) {
      console.error(`❌ Error submitting guest application:`, error);
      throw error;
    }
  }

  // Track application status (using email + application ID)
  async trackGuestApplication(
    email: string,
    applicationId: string
  ): Promise<{
    status: string;
    jobTitle: string;
    companyName: string;
    submittedAt: string;
    lastUpdated: string;
  }> {
    try {
      console.log(`🌍 Tracking guest application: ${applicationId}`);

      const response = await fetch(
        `${API_BASE_URL}/public/applications/track?email=${encodeURIComponent(
          email
        )}&applicationId=${applicationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Application not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Application tracking data retrieved`);
      return result;
    } catch (error) {
      console.error(`❌ Error tracking application:`, error);
      throw error;
    }
  }
}

export const publicJobService = new PublicJobService();

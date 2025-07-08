// services/applicationService.ts
import {
  ApplicationDetailResponse,
  CreateApplicationDetailRequest,
  ApplicationWithJobDetails,
} from "@/interfaces/api";
import { ApplicationData, PreliminaryData } from "@/interfaces/apply";
import { jobService } from "@/services/jobService";

class ApplicationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
  }

  // Get auth data from your existing auth system
  private getAuthData() {
    if (typeof window === "undefined") {
      return { token: null, userId: null, userCategory: null };
    }

    // Check cookies first, then localStorage and sessionStorage
    let token = null;
    let userCategory = null;
    let userId = null;

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
    if (!userId) {
      const currentUserStr =
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          userId = currentUser.id;
        } catch (error) {
          console.warn("Failed to parse currentUser from storage:", error);
        }
      }
    }

    return { token, userId, userCategory };
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

  private getFormDataHeaders(): HeadersInit {
    const { token } = this.getAuthData();

    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  //   // Upload files (placeholder for future implementation)
  //   async uploadFile(request: UploadFileRequest): Promise<FileUploadResponse> {
  //     console.warn("File upload not implemented on backend yet");

  //     // Mock response for development
  //     return {
  //       fileId: `file_${Date.now()}`,
  //       fileName: request.file.name,
  //       fileUrl: URL.createObjectURL(request.file),
  //       fileSize: request.file.size,
  //       uploadedAt: new Date().toISOString(),
  //     };
  //   }

  //   // Auto-fill application data from resume (placeholder for future implementation)
  //   async autoFillFromResume(file: File): Promise<Partial<ApplicationData>> {
  //     console.warn("Auto-fill from resume not implemented on backend yet");

  //     return {
  //       personalInfo: {
  //         firstName: "",
  //         lastName: "",
  //         email: "",
  //         confirmEmail: "",
  //         city: "",
  //         phoneNumber: "",
  //         countryCode: "+1",
  //       },
  //       experiences: [],
  //       education: [],
  //       profiles: {
  //         linkedin: "",
  //         facebook: "",
  //         twitter: "",
  //         website: "",
  //       },
  //     };
  //   }

  // Submit job application using your actual backend structure
  async submitApplication(
    jobId: string,
    applicationData: ApplicationData,
    preliminaryData: PreliminaryData,
    resumeFileId?: string
  ): Promise<{
    applicationId: string;
    status: string;
    submittedAt: string;
    message: string;
  }> {
    const { token, userId, userCategory } = this.getAuthData();

    if (!token || !userId) {
      throw new Error("User not authenticated - please log in");
    }

    // Verify this is an ApplicationUser (not a hiring user)
    if (userCategory !== "ApplicationUser") {
      throw new Error("Only application users can submit job applications");
    }

    console.log("📤 Submitting application:", {
      jobId,
      candidateUserId: userId,
      hasToken: !!token,
      userCategory,
    });

    // Combine all the application data into the format your backend expects
    const coverLetterText = this.buildCoverLetterText(
      applicationData,
      preliminaryData
    );

    // Calculate expected salary from user input if available
    const expectedSalary = this.calculateExpectedSalary(applicationData);

    // Determine resume URL - prioritize selected resume URL over file upload
    let resumeUrl: string | undefined;
    if (applicationData.selectedResumeUrl) {
      resumeUrl = applicationData.selectedResumeUrl;
    } else if (resumeFileId) {
      resumeUrl = `uploads/${resumeFileId}`;
    }

    const request: CreateApplicationDetailRequest = {
      jobId,
      candidateUserId: userId,
      resumeUrl,
      coverLetterText,
      expectedSalary,
      availabilityDate: this.calculateAvailabilityDate(applicationData),
      jobSource: "company_website",
      aiAnalysis: {
        personalInfo: applicationData.personalInfo,
        experiences: applicationData.experiences,
        education: applicationData.education,
        socialProfiles: applicationData.profiles,
        preliminaryAnswers: preliminaryData,
        applicationMethod: applicationData.method,
        submittedAt: new Date().toISOString(),
        selectedResumeName: applicationData.selectedResumeName,
      },
    };

    const response = await fetch(`${this.baseUrl}/applicationdetails`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Application submission failed:", {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      throw new Error(`Application submission failed: ${error}`);
    }

    // Parse the response from the backend to get the real application ID
    const responseData = await response.json();
    console.log("✅ Application submitted successfully:", responseData);

    // Use the application ID returned from the backend
    return {
      applicationId: responseData.id || responseData.applicationId, // Use the correct ID field from backend
      status: responseData.status || "applied",
      submittedAt:
        responseData.submittedAt ||
        responseData.createdAt ||
        new Date().toISOString(),
      message: "Application submitted successfully",
    };
  }

  // Get application status by ID
  async getApplicationStatus(
    applicationId: string
  ): Promise<ApplicationDetailResponse> {
    const { token } = this.getAuthData();

    if (!token) {
      throw new Error("User not authenticated");
    }

    // Validate that the applicationId is in the correct format (GUID format)
    if (!this.isValidGuid(applicationId)) {
      console.error("❌ Invalid application ID format:", applicationId);
      throw new Error("Invalid application ID format. Expected a GUID.");
    }

    console.log("🔍 Getting application status for ID:", applicationId);

    const response = await fetch(
      `${this.baseUrl}/applicationdetails/${applicationId}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Failed to get application status:", {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      throw new Error(`Failed to get application status: ${error}`);
    }

    const result = await response.json();
    console.log("✅ Got application status:", result);
    return result;
  }

  // Helper method to check if a string is a valid GUID
  private isValidGuid(str: string): boolean {
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(str);
  }

  // Get user's applications
  async getUserApplications(): Promise<ApplicationDetailResponse[]> {
    const { token, userId } = this.getAuthData();

    if (!token || !userId) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(
      `${this.baseUrl}/applicationdetails/candidate/${userId}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return []; // No applications found
      }
      const error = await response.text();
      throw new Error(`Failed to get applications: ${error}`);
    }

    return response.json();
  }

  // Get user's applications with job details
  async getUserApplicationsWithJobDetails(): Promise<
    ApplicationWithJobDetails[]
  > {
    const applications = await this.getUserApplications();

    // Fetch job details for each application
    const applicationsWithJobs = await Promise.allSettled(
      applications.map(async (app) => {
        try {
          const job = await jobService.getJobById(app.jobId);

          // Extract location string from locations object
          let locationString = "Unknown Location";
          if (job.locations) {
            if (typeof job.locations === "string") {
              locationString = job.locations;
            } else if (typeof job.locations === "object") {
              // Extract first location or fallback
              const locationValues = Object.values(job.locations);
              locationString =
                locationValues.length > 0
                  ? String(locationValues[0])
                  : "Unknown Location";
            }
          }

          // We'll need to fetch company details separately
          let companyName = "Unknown Company";
          try {
            const company = await jobService.getCompanyById(job.companyId);
            companyName = company.name;
          } catch (error) {
            console.warn(
              `Failed to fetch company details for company ${job.companyId}:`,
              error
            );
          }

          return {
            ...app,
            job: {
              title: job.title,
              company: companyName,
              location: locationString,
              employmentType: job.employmentType,
              status: job.status,
              department: job.department || "Not specified",
              salary:
                job.salaryMin || job.salaryMax
                  ? {
                      min: job.salaryMin || 0,
                      max: job.salaryMax || 0,
                      currency: job.salaryCurrency || "USD",
                      period: "per year",
                    }
                  : undefined,
            },
          };
        } catch (error) {
          console.warn(
            `Failed to fetch job details for job ${app.jobId}:`,
            error
          );
          return {
            ...app,
            job: {
              title: "Unknown Position",
              company: "Unknown Company",
              location: "Unknown Location",
              employmentType: "Unknown",
              status: "unknown",
              department: "Not specified",
            },
          };
        }
      })
    );

    // Filter out rejected promises and return successful ones
    return applicationsWithJobs
      .filter((result) => result.status === "fulfilled")
      .map(
        (result) =>
          (result as PromiseFulfilledResult<ApplicationWithJobDetails>).value
      );
  }

  // Check if user has already applied to a job
  async hasAppliedToJob(jobId: string): Promise<boolean> {
    const { token, userId } = this.getAuthData();

    if (!token || !userId) {
      console.log("⚠️ User not authenticated, cannot check application status");
      return false;
    }

    try {
      console.log("🔍 Checking if user has applied to job:", jobId);
      const applications = await this.getUserApplications();
      const hasApplied = applications.some((app) => app.jobId === jobId);
      console.log(
        `📝 Application check result: ${
          hasApplied ? "Already applied" : "Not applied"
        }`
      );
      return hasApplied;
    } catch (error) {
      console.warn("Failed to check application status:", error);
      return false;
    }
  }

  // Save application as draft (using localStorage)
  async saveApplicationDraft(
    jobId: string,
    applicationData: Partial<ApplicationData>
  ): Promise<{ draftId: string; savedAt: string }> {
    if (typeof window === "undefined") {
      throw new Error("Cannot save draft on server side");
    }

    const { userId } = this.getAuthData();
    const draftKey = `application_draft_${jobId}_${userId}`;
    const draftData = {
      jobId,
      userId,
      data: applicationData,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(draftKey, JSON.stringify(draftData));

    return {
      draftId: draftKey,
      savedAt: draftData.savedAt,
    };
  }

  // Get saved application draft (from localStorage)
  async getApplicationDraft(
    jobId: string
  ): Promise<Partial<ApplicationData> | null> {
    if (typeof window === "undefined") {
      return null;
    }

    const { userId } = this.getAuthData();
    const draftKey = `application_draft_${jobId}_${userId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (!savedDraft) {
      return null;
    }

    try {
      const draftData = JSON.parse(savedDraft);

      // Verify the draft belongs to the current user
      if (draftData.userId !== userId) {
        console.warn("Draft belongs to different user, ignoring");
        localStorage.removeItem(draftKey);
        return null;
      }

      return draftData.data || null;
    } catch (error) {
      console.warn("Failed to parse saved draft:", error);
      return null;
    }
  }

  // Check if user is authenticated using your auth system
  isAuthenticated(): boolean {
    const { token, userId, userCategory } = this.getAuthData();

    const isAuth = !!(token && userId && userCategory === "ApplicationUser");

    console.log("🔑 ApplicationService Auth Check:", {
      hasToken: !!token,
      hasUserId: !!userId,
      userCategory,
      isApplicationUser: userCategory === "ApplicationUser",
      isAuthenticated: isAuth,
    });

    return isAuth;
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    const { userId } = this.getAuthData();
    return userId;
  }

  // Get current token
  getCurrentToken(): string | null {
    const { token } = this.getAuthData();
    return token;
  }

  // Get current user category
  getCurrentUserCategory(): string | null {
    const { userCategory } = this.getAuthData();
    return userCategory;
  }

  // Helper method to build cover letter text with all application data
  private buildCoverLetterText(
    applicationData: ApplicationData,
    preliminaryData: PreliminaryData
  ): string {
    let coverLetter = applicationData.coverLetter || "";

    // If no cover letter provided, create a basic one
    if (!coverLetter.trim()) {
      coverLetter = `Dear Hiring Manager,
  
  I am interested in applying for this position. Please find my application details below.
  
  Best regards,
  ${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`;
    }

    // Append application metadata as JSON for backend processing
    const metadata = {
      personalInfo: applicationData.personalInfo,
      experienceCount: applicationData.experiences.length,
      educationCount: applicationData.education.length,
      socialProfiles: applicationData.profiles,
      preliminaryAnswers: preliminaryData,
      applicationMethod: applicationData.method,
    };

    return `${coverLetter}\n\n[APPLICATION_METADATA]${JSON.stringify(
      metadata
    )}[/APPLICATION_METADATA]`;
  }

  // Helper method to calculate expected salary
  private calculateExpectedSalary(
    applicationData: ApplicationData
  ): number | undefined {
    // You can implement logic to extract salary expectations from the application
    // For now, return undefined (no salary expectation provided)
    return undefined;
  }

  // Helper method to calculate availability date
  private calculateAvailabilityDate(
    applicationData: ApplicationData
  ): string | undefined {
    // You can implement logic to calculate when the candidate is available
    // For now, assume immediate availability
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    return twoWeeksFromNow.toISOString();
  }
}

export const applicationService = new ApplicationService();

// services/applicationService.ts
import {
  ApplicationDetailResponse,
  CreateApplicationDetailRequest,
  ApplicationWithJobDetails,
} from "@/interfaces/api";
import { ApplicationData, PreliminaryData } from "@/interfaces/apply";
import { jobService } from "@/services/jobService";
import { toast } from "@/utils/toast";

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
  } | null> {
    try {
      const { token, userId, userCategory } = this.getAuthData();

      if (!token || !userId) {
        toast.error("Please log in to submit your application");
        return null;
      }

      // Verify this is an ApplicationUser (not a hiring user)
      if (userCategory !== "ApplicationUser") {
        toast.error("Only job seekers can submit applications. Please use the correct account type.");
        return null;
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
      toast.error("Failed to submit your application. Please try again.");
      return null;
    }

    // Parse the response from the backend to get the real application ID
    const responseData = await response.json();
    console.log("✅ Application submitted successfully:", responseData);

    toast.success("Application submitted successfully! We'll be in touch soon.");

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
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("An unexpected error occurred while submitting your application. Please try again.");
      return null;
    }
  }

  // Get application status by ID
  async getApplicationStatus(
    applicationId: string,
    silent: boolean = false
  ): Promise<ApplicationDetailResponse | null> {
    try {
      const { token } = this.getAuthData();

      if (!token) {
        if (!silent) {
          toast.error("Please log in to view your application status");
        }
        return null;
      }

      // Validate that the applicationId is in the correct format (GUID format)
      if (!this.isValidGuid(applicationId)) {
        if (!silent) {
          console.error("❌ Invalid application ID format:", applicationId);
          toast.error("Invalid application ID format. Please contact support.");
        }
        return null;
      }

      if (!silent) {
        console.log("🔍 Getting application status for ID:", applicationId);
      }

    const response = await fetch(
      `${this.baseUrl}/applicationdetails/${applicationId}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      if (!silent) {
        console.error("❌ Failed to get application status:", {
          status: response.status,
          statusText: response.statusText,
          error,
        });
        toast.error("Unable to retrieve application status. Please try again later.");
      }
      return null;
    }

      const result = await response.json();
      if (!silent) {
        console.log("✅ Got application status:", result);
      }
      return result;
    } catch (error) {
      if (!silent) {
        console.error("Error getting application status:", error);
        toast.error("An unexpected error occurred while retrieving your application status. Please try again.");
      }
      return null;
    }
  }

  // Get application ID for a specific candidate and job
  async getApplicationIdByCandidateAndJob(
    candidateUserId: string,
    jobId: string,
    silent: boolean = false
  ): Promise<ApplicationDetailResponse> {
    if (!silent) {
      console.log('🔍 ApplyService - getApplicationIdByCandidateAndJob called with:', { candidateUserId, jobId });
    }
    
    const { token } = this.getAuthData();
    if (!silent) {
      console.log('🔍 ApplyService - Authentication token available:', !!token);
      console.log('🔍 ApplyService - Token length:', token?.length || 0);
    }

    if (!token) {
      throw new Error("User not authenticated");
    }

    // Validate that the candidateUserId and jobId are in the correct format (GUID format)
    if (!silent) {
      console.log('🔍 ApplyService - Validating candidateUserId:', candidateUserId);
      console.log('🔍 ApplyService - isValidGuid result for candidateUserId:', this.isValidGuid(candidateUserId));
    }
    
    if (!this.isValidGuid(candidateUserId)) {
      if (!silent) {
        console.error("Invalid candidate user ID format:", candidateUserId);
      }
      throw new Error("Invalid candidate user ID format. Expected a GUID.");
    }

    if (!silent) {
      console.log('🔍 ApplyService - Validating jobId:', jobId);
      console.log('🔍 ApplyService - isValidGuid result for jobId:', this.isValidGuid(jobId));
    }
    
    if (!this.isValidGuid(jobId)) {
      if (!silent) {
        console.error("Invalid job ID format:", jobId);
      }
      throw new Error("Invalid job ID format. Expected a GUID.");
    }

    const url = `${this.baseUrl}/applicationdetails/candidate/${candidateUserId}/job/${jobId}`;
    if (!silent) {
      console.log('🔍 ApplyService - Base URL:', this.baseUrl);
      console.log('🔍 ApplyService - Making request to:', url);
      console.log('🔍 ApplyService - Request headers:', this.getHeaders());
    }

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!silent) {
      console.log('🔍 ApplyService - Response status:', response.status);
      console.log('🔍 ApplyService - Response ok:', response.ok);
    }

    if (!response.ok) {
      const error = await response.text();
      if (!silent) {
        console.error("Failed to get application ID:", {
          status: response.status,
          statusText: response.statusText,
          error,
          url,
          candidateUserId,
          jobId,
        });
      }
      
      // Try to parse error as JSON for more details
      try {
        const errorJson = JSON.parse(error);
        if (!silent) {
          console.error("Parsed error response:", errorJson);
        }
        throw new Error(`Failed to get application ID: ${errorJson.message || errorJson.error || error}`);
      } catch {
        throw new Error(`Failed to get application ID: ${response.status} ${response.statusText} - ${error}`);
      }
    }

    const result = await response.json();
    if (!silent) {
      console.log('🔍 ApplyService - Response result:', result);
    }
    return result;
  }

  // Helper method to check if a string is a valid GUID
  private isValidGuid(str: string): boolean {
    // More permissive GUID regex - just check the basic format
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    console.log('🔍 ApplyService - GUID validation for:', str, 'result:', guidRegex.test(str));
    return guidRegex.test(str);
  }

  // Get user's applications
  async getUserApplications(): Promise<ApplicationDetailResponse[]> {
    try {
      const { token, userId } = this.getAuthData();

      if (!token || !userId) {
        toast.error("Please log in to view your applications");
        return [];
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
        toast.error("Unable to load your applications. Please try again later.");
        return [];
      }

      return response.json();
    } catch (error) {
      console.error("Error getting user applications:", error);
      toast.error("An unexpected error occurred while loading your applications. Please try again.");
      return [];
    }
  }

  // Get user's applications with pagination
  async getUserApplicationsPaged(page: number = 1, pageSize: number = 10): Promise<{
    applications: ApplicationDetailResponse[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const { token, userId } = this.getAuthData();

      if (!token || !userId) {
        toast.error("Please log in to view your applications");
        return {
          applications: [],
          totalCount: 0,
          page,
          pageSize
        };
      }

      const response = await fetch(
        `${this.baseUrl}/applicationdetails/candidate/${userId}/paged?page=${page}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            applications: [],
            totalCount: 0,
            page,
            pageSize
          };
        }
        const error = await response.text();
        toast.error("Unable to load your applications. Please try again later.");
        return {
          applications: [],
          totalCount: 0,
          page,
          pageSize
        };
      }

      return response.json();
    } catch (error) {
      console.error("Error getting user applications (paged):", error);
      toast.error("An unexpected error occurred while loading your applications. Please try again.");
      return {
        applications: [],
        totalCount: 0,
        page,
        pageSize
      };
    }
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

  // Get user's applications with job details (paginated)
  async getUserApplicationsWithJobDetailsPaged(page: number = 1, pageSize: number = 10): Promise<{
    applications: ApplicationWithJobDetails[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    const pagedData = await this.getUserApplicationsPaged(page, pageSize);

    // Fetch job details for each application
    const applicationsWithJobs = await Promise.allSettled(
      pagedData.applications.map(async (app) => {
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
    const applications = applicationsWithJobs
      .filter((result) => result.status === "fulfilled")
      .map(
        (result) =>
          (result as PromiseFulfilledResult<ApplicationWithJobDetails>).value
      );

    return {
      applications,
      totalCount: pagedData.totalCount,
      page: pagedData.page,
      pageSize: pagedData.pageSize
    };
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
  ): Promise<{ draftId: string; savedAt: string } | null> {
    if (typeof window === "undefined") {
      toast.error("Cannot save draft in this environment");
      return null;
    }

    const { userId } = this.getAuthData();
    const draftKey = `application_draft_${jobId}_${userId}`;
    const draftData = {
      jobId,
      userId,
      data: applicationData,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      toast.success("Draft saved successfully!");
      
      return {
        draftId: draftKey,
        savedAt: draftData.savedAt,
      };
    } catch (error) {
      toast.error("Failed to save draft. Please try again.");
      return null;
    }
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

  // Get technical assessment for a candidate and round
  async getTechnicalAssessment(candidateId: string, roundId: string): Promise<{
    url: string;
    fileName: string;
    uploadedAt: string;
  } | null> {
    try {
      console.log(`🔍 Looking for assessment submission for candidate: ${candidateId}, round: ${roundId}`);
      
      // First try the specific round
      const response = await fetch(
        `${this.baseUrl}/assessments/submissions/${candidateId}/${roundId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (response.ok) {
        const submission = await response.json();
        console.log(`✅ Found submission for specific round: ${roundId}`);
        return {
          url: submission.pdfUrl,
          fileName: submission.submissionData?.fileName || "Assessment",
          uploadedAt: submission.submittedAt
        };
      }

      // If not found for specific round, try to find any submission for this candidate
      if (response.status === 404) {
        console.log(`📝 No submission found for round ${roundId} (this is normal if the application has progressed to a new stage)`);
        
        // Get all submissions for the candidate
        const allSubmissionsResponse = await fetch(
          `${this.baseUrl}/assessments/submissions/candidate/${candidateId}`,
          {
            method: "GET",
            headers: this.getHeaders(),
          }
        );

        if (allSubmissionsResponse.ok) {
          const allSubmissions = await allSubmissionsResponse.json();
          console.log(`🔍 Found ${allSubmissions.length} submissions for candidate ${candidateId}`);
          
          // Find the most recent submitted or graded submission
          const candidateSubmission = allSubmissions
            .filter((sub: any) => sub.status === "submitted" || sub.status === "graded")
            .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
          
          if (candidateSubmission) {
            console.log(`✅ Found submission in round: ${candidateSubmission.roundId} (different from current round ${roundId})`);
            return {
              url: candidateSubmission.pdfUrl,
              fileName: candidateSubmission.submissionData?.fileName || "Assessment",
              uploadedAt: candidateSubmission.submittedAt
            };
          }
        }
      }

      console.log(`📭 No assessment submissions found for candidate: ${candidateId}`);
      return null;
    } catch (error) {
      console.error("Error getting technical assessment:", error);
      toast.error("An unexpected error occurred while loading the technical assessment. Please try again.");
      return null;
    }
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

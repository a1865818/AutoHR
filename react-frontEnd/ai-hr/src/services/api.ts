import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  ApplicationUserRegisterRequest,
  LoginResponse,
  ApplicationUserLoginResponse,
  CompanyRegisterRequest,
  CompanyRegisterResponse,
  HiringUserRegisterRequest,
  ApplicationUserRegisterRequestEnhanced,
} from "@/interfaces/api";
import {
  JobFormData,
  CreateJobRequest,
  CreateJobResponse,
  JobData,
} from "@/interfaces/job";
import { NotificationType, Notification } from "@/interfaces/notifications";
import { toast } from "@/utils/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
  }

  // Resolve the auth token from the cookie first, then localStorage/sessionStorage.
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf("authToken=") === 0) {
        return decodeURIComponent(cookie.substring("authToken=".length));
      }
    }

    return (
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken")
    );
  }

  // Build the standard authenticated request headers (Content-Type + bearer + Supabase apikey).
  private authHeaders(extra: HeadersInit = {}): HeadersInit {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
        // apikey header for the Supabase auth system
        apikey:
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          "",
      }),
      ...extra,
    };
  }

  public async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    const headers = this.authHeaders(options.headers);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `${response.status}: ${errorText || response.statusText}`;
        toast.error(errorMessage);
        return null as T;
      }

      // Check if response has content
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        return text ? JSON.parse(text) : {} as T;
      }

      return {} as T;
    } catch (error) {
      console.error("API request failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      toast.error(errorMessage);
      return null as T;
    }
  }

  // Unauthenticated request method (for registration, login, etc.)
  private async makeUnauthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `${response.status}: ${errorText || response.statusText}`;
        toast.error(errorMessage);
        return null as T;
      }

      // Check if response has content
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        return text ? JSON.parse(text) : {} as T;
      }

      return {} as T;
    } catch (error) {
      console.error("API request failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      toast.error(errorMessage);
      return null as T;
    }
  }

  // Authentication methods - Unified endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse | null> {
    return this.makeUnauthenticatedRequest<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    );
  }

  async register(userData: RegisterRequest): Promise<LoginResponse | null> {
    return this.makeUnauthenticatedRequest<LoginResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      }
    );
  }

  async forgotPassword(email: string): Promise<{ message: string } | null> {
    return this.makeUnauthenticatedRequest<{ message: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );
  }

  // Legacy methods for backward compatibility - redirect to unified endpoints
  async applicationUserLogin(
    credentials: LoginRequest
  ): Promise<ApplicationUserLoginResponse | null> {
    return this.makeUnauthenticatedRequest<ApplicationUserLoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    );
  }

  async applicationUserRegister(
    userData: ApplicationUserRegisterRequest
  ): Promise<ApplicationUserLoginResponse | null> {
    return this.makeUnauthenticatedRequest<ApplicationUserLoginResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      }
    );
  }

  // Profile methods - Unified endpoint
  async getCurrentUser(): Promise<any | null> {
    return this.makeRequest<any>("/auth/me");
  }

  /**
   * Validate the current session against `/auth/me`, distinguishing an authentication
   * rejection (token invalid/expired/revoked) from a transient network/server failure.
   * Unlike `makeRequest`, a 401/403 is reported explicitly so the caller can clear the
   * session instead of silently restoring a cached (but unauthenticated) user.
   */
  async validateCurrentUser(): Promise<
    | { status: "valid"; user: any }
    | { status: "unauthorized" }
    | { status: "error" }
  > {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: this.authHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        return { status: "unauthorized" };
      }
      if (!response.ok) {
        return { status: "error" };
      }

      const text = await response.text();
      return { status: "valid", user: text ? JSON.parse(text) : {} };
    } catch (error) {
      console.error("Session validation request failed:", error);
      return { status: "error" };
    }
  }

  // Legacy method for backward compatibility - redirect to unified endpoint
  async getCurrentApplicationUser(): Promise<any | null> {
    return this.makeRequest<any>("/auth/me");
  }

  async getPendingNotifications(jobId: string): Promise<any> {
    return this.makeRequest<any>(`/applicationdetails/job/${jobId}/pending-notifications`);
  }

  async updateHiringUserProfile(id: string, data: any): Promise<any> {
    return this.makeRequest<any>(`/hiring-user-profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateApplicationUserProfile(data: any): Promise<any> {
    return this.makeRequest<any>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Logout methods - Unified endpoint
  async logout(): Promise<void | null> {
    return this.makeRequest<void>("/auth/logout", {
      method: "POST",
    });
  }

  // Legacy method for backward compatibility - redirect to unified endpoint
  async applicationUserLogout(): Promise<void | null> {
    return this.makeRequest<void>("/auth/logout", {
      method: "POST",
    });
  }

  // Refresh token methods - Unified endpoint
  async refreshToken(refreshToken: string): Promise<LoginResponse | null> {
    return this.makeRequest<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Legacy method for backward compatibility - redirect to unified endpoint
  async applicationUserRefreshToken(
    refreshToken: string
  ): Promise<ApplicationUserLoginResponse | null> {
    return this.makeRequest<ApplicationUserLoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Company registration method
  async registerCompany(
    companyData: CompanyRegisterRequest
  ): Promise<CompanyRegisterResponse | null> {
    console.log("API Service - registerCompany called with:", companyData);

    const jsonPayload = JSON.stringify(companyData);
    console.log("API Service - JSON payload being sent:", jsonPayload);

    // Parse it back to verify structure
    const parsedPayload = JSON.parse(jsonPayload);
    console.log("API Service - Parsed payload verification:", parsedPayload);
    console.log(
      "API Service - Email in parsed payload:",
      `"${parsedPayload.email}"`
    );

    return this.makeUnauthenticatedRequest<CompanyRegisterResponse>(
      "/companies",
      {
        method: "POST",
        body: jsonPayload,
      }
    );
  }

  // Get companies (for searching existing companies)
  async getCompanies(industry?: string, isVerified?: boolean): Promise<any[] | null> {
    if (industry || isVerified !== undefined) {
      // Use filter endpoint when filters are provided
      const params = new URLSearchParams();
      if (industry) params.append("industry", industry);
      if (isVerified !== undefined)
        params.append("isVerified", isVerified.toString());

      const queryString = params.toString();
      const endpoint = `/companies/filter?${queryString}`;

      const result = await this.makeUnauthenticatedRequest<any[]>(endpoint, {
        method: "GET",
      });
      return result || [];
    } else {
      // Use general endpoint for all companies
      const result = await this.makeUnauthenticatedRequest<any[]>("/companies", {
        method: "GET",
      });
      return result || [];
    }
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<any | null> {
    return this.makeUnauthenticatedRequest<any>(`/companies/${id}`, {
      method: "GET",
    });
  }

  // Enhanced hiring user registration (legacy method - now uses unified endpoint)
  async registerHiringUser(
    userData: HiringUserRegisterRequest
  ): Promise<LoginResponse | null> {
    console.log(
      "API Service - registerHiringUser called with userData:",
      userData
    );

    // Convert companyId to proper format for backend
    let companyIdForBackend: string | undefined = undefined;

    if (userData.companyId) {
      if (typeof userData.companyId === "string") {
        // Validate it's a valid GUID format
        const guidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (guidRegex.test(userData.companyId)) {
          companyIdForBackend = userData.companyId;
        } else {
          console.log(
            "⚠️ Invalid GUID format for companyId:",
            userData.companyId
          );
        }
      } else {
        // Convert number or other types to string and validate
        const stringId = String(userData.companyId);
        const guidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (guidRegex.test(stringId)) {
          companyIdForBackend = stringId;
        } else {
          console.log("⚠️ Invalid GUID format after conversion:", stringId);
        }
      }
    }

    console.log("📋 Company ID processing:", {
      original: userData.companyId,
      processed: companyIdForBackend,
      type: typeof userData.companyId,
    });

    // Transform HiringUserRegisterRequest to UnifiedRegisterRequest format
    const unifiedRequest = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userCategory: "HiringUserProfile", // Required by backend
      userType: userData.role, // Map 'role' to 'userType'
      companyId: companyIdForBackend, // Send as GUID string or undefined
      bio: userData.company ? `Works at ${userData.company}` : undefined, // Use company name as bio if provided
      linkedinUrl: undefined,
      location: undefined,
      preferences: undefined,
    };

    console.log(
      "API Service - registerHiringUser transformed request:",
      unifiedRequest
    );

    return this.makeUnauthenticatedRequest<LoginResponse>(
      "/auth/register-hiring",
      {
        method: "POST",
        body: JSON.stringify(unifiedRequest),
      }
    );
  }

  // Copy standard interview templates for newly registered company
  async copyStandardTemplates(companyId: string): Promise<any> {
    console.log("🔄 Copying standard templates for company:", companyId);

    try {
      const response = await this.makeRequest<any>(
        `/companies/${companyId}/copy-standard-templates`,
        {
          method: "POST",
        }
      );

      console.log("✅ Standard templates copy response:", response);
      return response;
    } catch (error) {
      console.warn(
        "⚠️ Failed to copy standard templates (non-critical):",
        error
      );
      // Don't throw error - this is a background process and shouldn't fail registration
      return {
        message: "Template copying failed but company registration succeeded",
        error: error instanceof Error ? error.message : "Unknown error",
        templatesCreated: 0,
      };
    }
  }

  // Enhanced application user registration
  async registerApplicationUser(
    userData: ApplicationUserRegisterRequestEnhanced
  ): Promise<ApplicationUserLoginResponse | null> {
    // Transform ApplicationUserRegisterRequestEnhanced to RegisterRequest format
    const registerRequest = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };

    console.log(
      "API Service - registerApplicationUser transformed request:",
      registerRequest
    );

    return this.makeUnauthenticatedRequest<ApplicationUserLoginResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(registerRequest),
      }
    );
  }
}

export const apiService = new ApiService();
export type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  ApplicationUserRegisterRequest,
  ApplicationUserLoginResponse,
  CompanyRegisterRequest,
  CompanyRegisterResponse,
  HiringUserRegisterRequest,
  ApplicationUserRegisterRequestEnhanced,
};

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

// Generic API call function with error handling (updated from utils)
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (response.ok) {
      // Check if response has content
      const contentType = response.headers.get("content-type");
      let data = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      // Extract ID from Location header if available (for created resources)
      const location = response.headers.get("Location");
      if (location && !data) {
        const id = location.split("/").pop();
        data = { id };
      }

      return {
        data: data as T,
        success: true,
      };
    } else {
      const errorText = await response.text();
      return {
        error: `${response.status}: ${errorText || response.statusText}`,
        success: false,
      };
    }
  } catch (error) {
    return {
      error: `Network error: ${(error as Error).message}`,
      success: false,
    };
  }
}

// Job mapping functions (moved from utils/jobMapper.ts)
// Extract years from experience string (e.g., "3-5 years" -> 3)
function extractMinYears(experience: string): number | undefined {
  if (!experience) return undefined;

  // Look for patterns like "3-5 years", "2+ years", "5 years"
  const match = experience.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

// Map experience to seniority level
function mapExperienceToSeniority(experience: string): string {
  if (!experience) return "";

  const exp = experience.toLowerCase();
  if (
    exp.includes("entry") ||
    exp.includes("junior") ||
    exp.includes("0-1") ||
    exp.includes("0-2")
  ) {
    return "Junior";
  } else if (
    exp.includes("mid") ||
    exp.includes("2-5") ||
    exp.includes("3-5")
  ) {
    return "Mid";
  } else if (
    exp.includes("senior") ||
    exp.includes("5+") ||
    exp.includes("5-10")
  ) {
    return "Senior";
  } else if (
    exp.includes("lead") ||
    exp.includes("principal") ||
    exp.includes("10+")
  ) {
    return "Lead";
  }

  return "Mid"; // Default fallback
}

// Transform city and country to locations object
function transformLocation(
  city: string,
  country: string,
  locationType: string
): Record<string, unknown> {
  // Handle null/undefined case
  if ((!city || city.trim() === "") && (!country || country.trim() === "")) {
    return {
      type: locationType.toLowerCase(),
      description:
        locationType === "Remote" ? "Remote work" : "Location not specified",
    };
  }

  // Ensure city and country are strings
  const cityStr = String(city || "").trim();
  const countryStr = String(country || "").trim();

  return {
    city: cityStr,
    country: countryStr,
    address:
      cityStr && countryStr
        ? `${cityStr}, ${countryStr}`
        : cityStr || countryStr,
  };
}

// Main mapper function
export function mapFormDataToCreateJobRequest(
  formData: JobFormData,
  companyId: string = "00000000-0000-0000-0000-000000000001", // Default company ID - should come from auth context
  createdBy: string = "00000000-0000-0000-0000-000000000001", // Default user ID - should come from auth context
  status: "Active" | "Draft" = "Active",
  aiGeneratedDescription: boolean = false
): CreateJobRequest {
  console.log(
    "🔧 mapFormDataToCreateJobRequest - FormData.interviewTemplateId:",
    formData.interviewTemplateId
  );

  const createRequest = {
    title: formData.title,
    companyId,
    createdBy,
    description: formData.description,
    department: formData.department || "",
    responsibilities: formData.responsibilities,
    requirements: formData.requirements,
    qualifications: formData.qualifications,
    benefits: formData.benefits,
    employmentType: formData.type, // "Full-Time", "Part-Time", etc.
    seniorityLevel: mapExperienceToSeniority(formData.experience),
    experienceYearsMin: extractMinYears(formData.experience),
    locationType: formData.locationType, // "On-site", "Remote", "Hybrid"
    locations: transformLocation(
      formData.city,
      formData.country,
      formData.locationType
    ),
    salaryMin: formData.salary.min || undefined,
    salaryMax: formData.salary.max || undefined,
    salaryCurrency: formData.salary.currency,
    applicationDeadline: formData.applicationSettings.deadline
      ? new Date(formData.applicationSettings.deadline).toISOString()
      : undefined,
    status,
    aiGeneratedDescription,
    skillMatchThreshold: 0.7, // Default value from backend
    interviewTemplateId: formData.interviewTemplateId,
  };

  console.log(
    "🔧 Created request with interviewTemplateId:",
    createRequest.interviewTemplateId
  );
  return createRequest;
}

// Validation function to check if form data is complete enough for API call
export function validateFormDataForSubmission(formData: JobFormData): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Required fields for job creation
  if (!formData.title.trim()) missingFields.push("Job Title");
  if (!formData.description.trim()) missingFields.push("Job Description");
  if (!formData.city.trim()) missingFields.push("City");
  if (!formData.country.trim()) missingFields.push("Country");
  if (formData.responsibilities.length === 0)
    missingFields.push("Responsibilities");
  if (formData.requirements.length === 0) missingFields.push("Requirements");
  if (formData.qualifications.length === 0)
    missingFields.push("Qualifications");

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

// Validation for draft (less strict)
export function validateFormDataForDraft(formData: JobFormData): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Only require title for draft
  if (!formData.title.trim()) missingFields.push("Job Title");

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

// Notification utilities (moved from utils/notifications.ts)
export const showNotification = (
  type: NotificationType,
  title: string,
  message?: string
) => {
  const formatted = `${title}${message ? `: ${message}` : ""}`;
  if (type === "error") toast.error(formatted);
  else if (type === "success") toast.success(formatted);
  else console.log(`${type.toUpperCase()}: ${formatted}`);
};

export const notifications = {
  success: (title: string, message?: string) =>
    showNotification("success", title, message),
  error: (title: string, message?: string) =>
    showNotification("error", title, message),
  info: (title: string, message?: string) =>
    showNotification("info", title, message),
  warning: (title: string, message?: string) =>
    showNotification("warning", title, message),
};

// Job API functions (moved and enhanced from utils/api.ts)
export const jobApi = {
  // Create a new job - now accepts CreateJobRequest directly
  createJob: async (
    jobData: CreateJobRequest
  ): Promise<ApiResponse<CreateJobResponse>> => {
    console.log("🚀 jobApi.createJob called with data:", {
      ...jobData,
      interviewTemplateId: jobData.interviewTemplateId,
    });

    return apiCall<CreateJobResponse>("/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });
  },

  // Get job by ID
  getJob: async (id: string): Promise<ApiResponse<JobData>> => {
    return apiCall<JobData>(`/jobs/${id}`);
  },

  // Get all jobs
  getJobs: async (
    status?: string,
    companyId?: string
  ): Promise<ApiResponse<JobData[]>> => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (companyId) params.append("companyId", companyId);

    const queryString = params.toString();
    const endpoint = queryString ? `/jobs?${queryString}` : "/jobs";

    return apiCall<JobData[]>(endpoint);
  },
};

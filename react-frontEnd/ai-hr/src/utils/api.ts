// API configuration and utility functions
// Use proxy path instead of direct localhost URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Import the CreateJobRequest type
import { CreateJobRequest } from "./jobMapper";

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface CreateJobResponse {
  id?: string;
  message?: string;
}

export interface JobData {
  [key: string]: unknown;
}

// Generic API call function with error handling
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

// Job API functions
export const jobApi = {
  // Create a new job - now accepts CreateJobRequest directly
  createJob: async (jobData: CreateJobRequest): Promise<ApiResponse<CreateJobResponse>> => {
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
  getJobs: async (status?: string, companyId?: string): Promise<ApiResponse<JobData[]>> => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (companyId) params.append("companyId", companyId);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/jobs?${queryString}` : "/jobs";
    
    return apiCall<JobData[]>(endpoint);
  },
}; 
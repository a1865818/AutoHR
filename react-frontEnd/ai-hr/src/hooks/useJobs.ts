// hooks/useJobs.ts
import { ApiCompany, ApiJob, JobFormData } from "@/interfaces";
import { jobService } from "@/services/jobService";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseJobsReturn {
  jobs: ApiJob[];
  companies: Map<string, ApiCompany>;
  isLoading: boolean;
  error: string | null;
  refreshJobs: () => Promise<void>;
  createJob: (
    jobData: JobFormData,
    companyId: string,
    createdBy: string
  ) => Promise<void>;
  updateJob: (jobId: string, jobData: JobFormData) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
}

export function useJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [companies, setCompanies] = useState<Map<string, ApiCompany>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load all jobs using the new paginated API
      // For this hook, we'll load jobs in batches of 100
      const response = await jobService.getAllJobs(undefined, undefined, 1, 100);
      setJobs(response.jobs);

      // Load companies for all jobs
      const companyIds = [...new Set(response.jobs.map((job) => job.companyId))];
      const companiesMap = new Map<string, ApiCompany>();

      await Promise.all(
        companyIds.map(async (companyId) => {
          try {
            const company = await jobService.getCompanyById(companyId);
            companiesMap.set(companyId, company);
          } catch (error) {
            console.warn(`Failed to load company ${companyId}:`, error);
          }
        })
      );

      setCompanies(companiesMap);
    } catch (error) {
      console.error("Error loading jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshJobs = useCallback(async () => {
    await loadJobs();
  }, [loadJobs]);

  const createJob = useCallback(
    async (jobData: JobFormData, companyId: string, createdBy: string) => {
      try {
        const createRequest = jobService.convertFormDataToCreateRequest(
          jobData,
          companyId,
          createdBy
        );
        await jobService.createJob(createRequest);
        await refreshJobs(); // Refresh the list after creating
      } catch (error) {
        console.error("Error creating job:", error);
        throw error;
      }
    },
    [refreshJobs]
  );

  const updateJob = useCallback(
    async (jobId: string, jobData: JobFormData) => {
      try {
        const updateRequest =
          jobService.convertFormDataToUpdateRequest(jobData);
        await jobService.updateJob(jobId, updateRequest);
        await refreshJobs(); // Refresh the list after updating
      } catch (error) {
        console.error("Error updating job:", error);
        throw error;
      }
    },
    [refreshJobs]
  );

  const deleteJob = useCallback(
    async (jobId: string) => {
      try {
        await jobService.deleteJob(jobId);
        await refreshJobs(); // Refresh the list after deleting
      } catch (error) {
        console.error("Error deleting job:", error);
        throw error;
      }
    },
    [refreshJobs]
  );

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    companies,
    isLoading,
    error,
    refreshJobs,
    createJob,
    updateJob,
    deleteJob,
  };
}

// Hook for managing a single job
export interface UseJobReturn {
  job: ApiJob | null;
  company: ApiCompany | null;
  isLoading: boolean;
  error: string | null;
  refreshJob: () => Promise<void>;
  updateJob: (jobData: JobFormData) => Promise<void>;
}

export function useJob(jobId: string): UseJobReturn {
  const [job, setJob] = useState<ApiJob | null>(null);
  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    setError(null);

    try {
      const jobData = await jobService.getJobById(jobId);
      setJob(jobData);

      // Load company data if available
      if (jobData.companyId) {
        try {
          const companyData = await jobService.getCompanyById(
            jobData.companyId
          );
          setCompany(companyData);
        } catch (error) {
          console.warn("Could not load company data:", error);
        }
      }
    } catch (error) {
      console.error("Error loading job:", error);
      setError(error instanceof Error ? error.message : "Failed to load job");
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const refreshJob = useCallback(async () => {
    await loadJob();
  }, [loadJob]);

  const updateJob = useCallback(
    async (jobData: JobFormData) => {
      if (!jobId) throw new Error("No job ID provided");

      try {
        const updateRequest =
          jobService.convertFormDataToUpdateRequest(jobData);
        await jobService.updateJob(jobId, updateRequest);
        await refreshJob(); // Refresh after updating
      } catch (error) {
        console.error("Error updating job:", error);
        throw error;
      }
    },
    [jobId, refreshJob]
  );

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  return {
    job,
    company,
    isLoading,
    error,
    refreshJob,
    updateJob,
  };
}

export function useApplicantJob(jobId: string): UseJobReturn {
  const [job, setJob] = useState<ApiJob | null>(null);
  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add request deduplication
  const requestInProgress = useRef<boolean>(false);
  const lastJobId = useRef<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!jobId) return;

    // Prevent duplicate requests for the same job
    if (requestInProgress.current && lastJobId.current === jobId) {
      console.log(
        `🚫 Request already in progress for applicant job ${jobId}, skipping`
      );
      return;
    }

    // Mark request as in progress
    requestInProgress.current = true;
    lastJobId.current = jobId;

    setIsLoading(true);
    setError(null);

    try {
      console.log("👤 Loading applicant job data for ID:", jobId);
      console.log(`👤 Request timestamp: ${new Date().toISOString()}`);

      // Use the new applicant-specific endpoint
      const jobData = await jobService.getApplicantJobById(jobId);
      setJob(jobData);

      // Load company data if available
      if (jobData.companyId) {
        try {
          const companyData = await jobService.getCompanyById(
            jobData.companyId
          );
          setCompany(companyData);
        } catch (error) {
          console.warn("Could not load company data:", error);
        }
      }
    } catch (error) {
      console.error("Error loading applicant job:", error);
      setError(error instanceof Error ? error.message : "Failed to load job");
    } finally {
      setIsLoading(false);
      requestInProgress.current = false;
    }
  }, [jobId]);

  const refreshJob = useCallback(async () => {
    // For refresh, allow duplicate requests
    requestInProgress.current = false;
    await loadJob();
  }, [loadJob]);

  // For applicant jobs, we don't allow updates
  const updateJob = useCallback(async () => {
    throw new Error("Cannot update jobs in applicant view");
  }, []);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  return {
    job,
    company,
    isLoading,
    error,
    refreshJob,
    updateJob,
  };
}

// Public hook for applicants to view jobs without authentication
export function usePublicJob(jobId: string): UseJobReturn {
  const [job, setJob] = useState<ApiJob | null>(null);
  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔥 Add request deduplication
  const requestInProgress = useRef<boolean>(false);
  const lastJobId = useRef<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!jobId) return;

    // Prevent duplicate requests for the same job
    if (requestInProgress.current && lastJobId.current === jobId) {
      console.log(`🚫 Request already in progress for job ${jobId}, skipping`);
      return;
    }

    // Mark request as in progress
    requestInProgress.current = true;
    lastJobId.current = jobId;

    setIsLoading(true);
    setError(null);

    try {
      console.log("🌍 Loading public job data for ID:", jobId);
      console.log(`🌍 Request timestamp: ${new Date().toISOString()}`);

      const jobData = await jobService.getPublicJobById(jobId);
      setJob(jobData);

      // Load company data if available
      if (jobData.companyId) {
        try {
          const companyData = await jobService.getCompanyById(
            jobData.companyId
          );
          setCompany(companyData);
        } catch (error) {
          console.warn("Could not load company data:", error);
          // For public jobs, company data is nice to have but not required
        }
      }
    } catch (error) {
      console.error("Error loading public job:", error);
      setError(error instanceof Error ? error.message : "Failed to load job");
    } finally {
      setIsLoading(false);
      requestInProgress.current = false; // Reset flag when done
    }
  }, [jobId]);

  const refreshJob = useCallback(async () => {
    // For refresh, allow duplicate requests
    requestInProgress.current = false;
    await loadJob();
  }, [loadJob]);

  // For public jobs, we don't allow updates
  const updateJob = useCallback(async () => {
    throw new Error("Cannot update jobs in public view");
  }, []);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  return {
    job,
    company,
    isLoading,
    error,
    refreshJob,
    updateJob,
  };
}

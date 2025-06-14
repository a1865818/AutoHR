"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { savedJobsService } from "@/services/savedJobsService";
import { useAuth } from "@/contexts/AuthContext";

interface SavedJobsContextType {
  savedJobIds: string[];
  isLoading: boolean;
  error: string | null;
  isJobSaved: (jobId: string) => boolean;
  saveJob: (jobId: string) => Promise<void>;
  unsaveJob: (jobId: string) => Promise<void>;
  toggleJobSaved: (jobId: string) => Promise<void>;
  refreshSavedJobs: () => Promise<void>;
  savedJobsCount: number;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(
  undefined
);

interface SavedJobsProviderProps {
  children: ReactNode;
}

export function SavedJobsProvider({ children }: SavedJobsProviderProps) {
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const loadSavedJobs = async () => {
    if (!isAuthenticated || !user) {
      setSavedJobIds([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const jobIds = await savedJobsService.getSavedJobIds();
      setSavedJobIds(jobIds);
    } catch (err) {
      console.error("Failed to load saved jobs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load saved jobs"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isJobSaved = (jobId: string): boolean => {
    return savedJobIds.includes(jobId);
  };

  const saveJob = async (jobId: string): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error("Authentication required");
    }

    // Optimistic update
    setSavedJobIds((prev) => {
      if (prev.includes(jobId)) return prev;
      return [...prev, jobId];
    });

    try {
      await savedJobsService.saveJob(jobId);
      setError(null);
    } catch (err) {
      // Revert optimistic update on error
      setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save job";
      setError(errorMessage);
      throw err;
    }
  };

  const unsaveJob = async (jobId: string): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error("Authentication required");
    }

    // Optimistic update
    setSavedJobIds((prev) => prev.filter((id) => id !== jobId));

    try {
      await savedJobsService.unsaveJob(jobId);
      setError(null);
    } catch (err) {
      // Revert optimistic update on error
      setSavedJobIds((prev) => {
        if (prev.includes(jobId)) return prev;
        return [...prev, jobId];
      });
      const errorMessage =
        err instanceof Error ? err.message : "Failed to unsave job";
      setError(errorMessage);
      throw err;
    }
  };

  const toggleJobSaved = async (jobId: string): Promise<void> => {
    if (isJobSaved(jobId)) {
      await unsaveJob(jobId);
    } else {
      await saveJob(jobId);
    }
  };

  const refreshSavedJobs = async (): Promise<void> => {
    await loadSavedJobs();
  };

  // Load saved jobs when user authentication state changes
  useEffect(() => {
    loadSavedJobs();
  }, [isAuthenticated, user?.id]);

  const value: SavedJobsContextType = {
    savedJobIds,
    isLoading,
    error,
    isJobSaved,
    saveJob,
    unsaveJob,
    toggleJobSaved,
    refreshSavedJobs,
    savedJobsCount: savedJobIds.length,
  };

  return (
    <SavedJobsContext.Provider value={value}>
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobs(): SavedJobsContextType {
  const context = useContext(SavedJobsContext);
  if (context === undefined) {
    throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  }
  return context;
}

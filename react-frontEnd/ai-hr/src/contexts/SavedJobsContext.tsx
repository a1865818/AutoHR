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
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const loadSavedJobs = async () => {
    console.log("🔄 SavedJobsContext: Loading saved jobs...", {
      isAuthenticated,
      hasUser: !!user,
      authLoading,
      userCategory: user?.userCategory,
    });

    if (!isAuthenticated || !user) {
      console.log("❌ SavedJobsContext: Not authenticated or no user, clearing saved jobs");
      setSavedJobIds([]);
      return;
    }

    // Only load saved jobs for ApplicationUser (applicants)
    if (user.userCategory !== "ApplicationUser") {
      console.log("ℹ️ SavedJobsContext: Not an ApplicationUser, skipping saved jobs");
      setSavedJobIds([]);
      return;
    }

    // Double-check authentication before calling the service
    if (!savedJobsService.isAuthenticated()) {
      console.log("❌ SavedJobsContext: Service reports not authenticated, clearing saved jobs");
      setSavedJobIds([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // console.log("📤 SavedJobsContext: Calling savedJobsService.getSavedJobIds()");
      const jobIds = await savedJobsService.getSavedJobIds();
      // console.log("✅ SavedJobsContext: Loaded saved jobs:", jobIds);
      setSavedJobIds(jobIds);
    } catch (err) {
      console.error("❌ SavedJobsContext: Failed to load saved jobs:", err);
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

    if (user.userCategory !== "ApplicationUser") {
      throw new Error("Only applicants can save jobs");
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

    if (user.userCategory !== "ApplicationUser") {
      throw new Error("Only applicants can unsave jobs");
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
    console.log("🔄 SavedJobsContext: useEffect triggered", {
      authLoading,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      userCategory: user?.userCategory,
    });

    // Wait for authentication to be fully loaded
    if (authLoading) {
      console.log("⏳ SavedJobsContext: Waiting for authentication to load...");
      return;
    }

    // Only proceed if we have a valid ApplicationUser
    if (!isAuthenticated || !user || user.userCategory !== "ApplicationUser") {
      console.log("ℹ️ SavedJobsContext: Not a valid ApplicationUser, skipping saved jobs");
      setSavedJobIds([]);
      return;
    }

    console.log("✅ SavedJobsContext: Authentication ready, loading saved jobs");
    loadSavedJobs();
  }, [isAuthenticated, user?.id, user?.userCategory, authLoading]);

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

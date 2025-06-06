"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface HiringAuthState {
  isLoading: boolean;
  isAuthorized: boolean;
  user: any;
  companyId: string | null;
  error: string | null;
}

export function useHiringAuth() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [authState, setAuthState] = useState<HiringAuthState>({
    isLoading: true,
    isAuthorized: false,
    user: null,
    companyId: null,
    error: null,
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setAuthState({
        isLoading: false,
        isAuthorized: false,
        user: null,
        companyId: null,
        error: "User not authenticated. Please log in.",
      });

      return;
    }

    // Check if user is an application user (should not have access)
    if (user.userCategory === "ApplicationUser") {
      setAuthState({
        isLoading: false,
        isAuthorized: false,
        user,
        companyId: null,
        error: "Access denied. Only hiring users can view candidates.",
      });

      return;
    }

    // Check if user has a company ID
    if (!user.companyId) {
      setAuthState({
        isLoading: false,
        isAuthorized: false,
        user,
        companyId: null,
        error:
          "No company association found. Please contact your administrator.",
      });
      return;
    }

    // User is authorized
    setAuthState({
      isLoading: false,
      isAuthorized: true,
      user,
      companyId: user.companyId,
      error: null,
    });
  }, [authLoading, isAuthenticated, user, router]);

  return authState;
}

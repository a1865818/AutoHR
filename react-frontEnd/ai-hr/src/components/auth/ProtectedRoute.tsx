"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredUserCategory?: "ApplicationUser" | "HiringUserProfile";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requiredUserCategory,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!isLoading && isAuthenticated && user && requiredUserCategory) {
      // Check if user's category matches the required category
      if (user.userCategory !== requiredUserCategory) {
        // Redirect to appropriate dashboard based on user category
        if (user.userCategory === "ApplicationUser") {
          router.push("/applicant");
        } else if (user.userCategory === "HiringUserProfile") {
          router.push("/");
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, router, user, requiredUserCategory]);

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    // Return null while redirecting
    return null;
  }

  // If a specific user category is required and user doesn't match, return null while redirecting
  if (
    requiredUserCategory &&
    user &&
    user.userCategory !== requiredUserCategory
  ) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

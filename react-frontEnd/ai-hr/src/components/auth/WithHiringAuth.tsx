"use client";

import { useHiringAuth } from "@/hooks/useHiringAuth";

// Higher-Order Component for hiring-only pages
export function withHiringAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function HiringAuthWrapper(props: P) {
    const { isLoading, isAuthorized, error } = useHiringAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying access...</p>
          </div>
        </div>
      );
    }

    if (!isAuthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "You don't have permission to access this page."}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

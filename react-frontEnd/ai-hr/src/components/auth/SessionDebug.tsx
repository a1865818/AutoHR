"use client";

import React, { useState, useEffect } from "react";
import { sessionCookies } from "@/utils/cookieUtils";
import { useAuth } from "@/contexts/AuthContext";

export const SessionDebug: React.FC = () => {
  const [cookieData, setCookieData] = useState<{
    authToken: string | null;
    refreshToken: string | null;
    userCategory: string | null;
    userData: string | null;
  } | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const updateCookieData = () => {
      const data = sessionCookies.getSessionData();
      setCookieData(data);
    };

    updateCookieData();
    const interval = setInterval(updateCookieData, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Don't show in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm text-xs z-50">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <div className="space-y-1">
        <div>
          <strong>Auth State:</strong> {isAuthenticated ? "Logged In" : "Logged Out"}
        </div>
        <div>
          <strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : "None"}
        </div>
        <div>
          <strong>Has Auth Token:</strong> {cookieData?.authToken ? "Yes" : "No"}
        </div>
        <div>
          <strong>User Category:</strong> {cookieData?.userCategory || "None"}
        </div>
        <div>
          <strong>Cookies Enabled:</strong> {sessionCookies.hasSessionData() ? "Yes" : "No"}
        </div>
        <div>
          <strong>All Cookies:</strong> {document.cookie ? document.cookie.split(';').length : 0} cookies
        </div>
        <div className="text-xs text-gray-400 mt-2">
          <div>Auth Token: {cookieData?.authToken ? `${cookieData.authToken.substring(0, 10)}...` : "None"}</div>
          <div>User Data: {cookieData?.userData ? "Present" : "None"}</div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700">
          <button
            onClick={() => {
              console.log("Testing cookie functionality...");
              const testData = {
                authToken: "test-token-123",
                refreshToken: "test-refresh-456",
                userCategory: "HiringUserProfile",
                userData: JSON.stringify({ test: "user" }),
              };
              sessionCookies.setSessionData(testData, false);
              console.log("Test cookies set, checking...");
              const verify = sessionCookies.getSessionData();
              console.log("Verification:", verify);
            }}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Test Cookies
          </button>
        </div>
      </div>
    </div>
  );
}; 
import React, { useState, useEffect } from "react";
import { X, Mail, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { sessionCookies } from "@/utils/cookieUtils";

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthComplete: () => void;
}

export function GmailAuthModal({
  isOpen,
  onClose,
  onAuthComplete,
}: GmailAuthModalProps) {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "unauthorized" | "authorizing" | "authorized" | "error"
  >("checking");
  const [authUrl, setAuthUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const checkAuthStatus = async () => {
    try {
      setAuthStatus("checking");

      // Get token from cookies first, then fallback to localStorage
      const sessionData = sessionCookies.getSessionData();
      let token = sessionData.authToken;

      if (!token) {
        token = localStorage.getItem("authToken");
      }

      console.log("🔍 GmailAuthModal: Token sources", {
        fromCookie: !!sessionData.authToken,
        fromStorage: !!token && !sessionData.authToken,
        hasToken: !!token,
      });

      const response = await fetch(`${BASE_URL}/api/gmail/auth/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("🔍 GmailAuthModal: Response", response);

      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data.isAuthorized ? "authorized" : "unauthorized");
        if (data.isAuthorized) {
          onAuthComplete();
        }
      } else {
        const errorText = await response.text();
        setAuthStatus("error");
        if (response.status === 401) {
          setError("Authentication required. Please log in again.");
        } else {
          setError(`Failed to check authorization status: ${errorText}`);
        }
      }
    } catch (err) {
      setAuthStatus("error");
      setError(
        "Failed to check authorization status. Please check your internet connection."
      );
    }
  };

  const startAuthorization = async () => {
    try {
      setAuthStatus("authorizing");
      const redirectUri = `${window.location.origin}/gmail/callback`;

      // Get token from cookies first, then fallback to localStorage
      const sessionData = sessionCookies.getSessionData();
      let token = sessionData.authToken;

      if (!token) {
        token = localStorage.getItem("authToken");
      }

      const response = await fetch(
        `${BASE_URL}/api/gmail/auth/url?redirectUri=${encodeURIComponent(
          redirectUri
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAuthUrl(data.authUrl);

        // Open popup window for authorization
        const popup = window.open(
          data.authUrl,
          "gmail-auth",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        // Listen for popup completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check auth status again after popup closes
            setTimeout(() => {
              checkAuthStatus();
            }, 1000);
          }
        }, 1000);
      } else {
        const errorData = await response.json();
        setAuthStatus("error");
        if (response.status === 401) {
          setError("Authentication required. Please log in again.");
        } else if (
          errorData.error &&
          errorData.error.includes("GOOGLE_CLIENT_ID")
        ) {
          setError(
            "Gmail OAuth is not configured. Please contact your administrator."
          );
        } else {
          setError(
            `Failed to get authorization URL: ${
              errorData.error || "Unknown error"
            }`
          );
        }
      }
    } catch (err) {
      setAuthStatus("error");
      setError(
        "Failed to start authorization. Please check your internet connection."
      );
    }
  };

  const handleRetry = () => {
    setError("");
    checkAuthStatus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm transition-opacity duration-300 cursor-pointer hover:bg-gray-900/15"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ease-in-out animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-500" />
              Gmail Authorization Required
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {authStatus === "checking" && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Checking authorization status...
                </p>
              </div>
            )}

            {authStatus === "unauthorized" && (
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Gmail Access Required
                </h3>
                <p className="text-gray-600 mb-6">
                  To send emails to candidates, you need to authorize access to
                  your Gmail account. This allows the system to send emails on
                  your behalf.
                </p>
                <button
                  onClick={startAuthorization}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Authorize Gmail Access
                </button>
              </div>
            )}

            {authStatus === "authorizing" && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Authorization in Progress
                </h3>
                <p className="text-gray-600 mb-4">
                  Please complete the authorization in the popup window.
                </p>
                {authUrl && (
                  <p className="text-sm text-gray-500">
                    If the popup was blocked, you can{" "}
                    <a
                      href={authUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      click here to authorize manually
                    </a>
                  </p>
                )}
              </div>
            )}

            {authStatus === "authorized" && (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Gmail Authorized Successfully
                </h3>
                <p className="text-gray-600 mb-6">
                  You can now send emails to candidates using your Gmail
                  account.
                </p>
                <button
                  onClick={() => {
                    onAuthComplete();
                    onClose();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continue
                </button>
              </div>
            )}

            {authStatus === "error" && (
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Authorization Error
                </h3>
                <p className="text-gray-600 mb-4">
                  {error ||
                    "An error occurred during authorization. Please try again."}
                </p>

                {error && error.includes("verification process") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">
                          Google App Verification Required
                        </h4>
                        <p className="text-sm text-yellow-700 mb-2">
                          Your Google OAuth app is in testing mode. To fix this:
                        </p>
                        <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                          <li>Go to Google Cloud Console</li>
                          <li>
                            Navigate to APIs & Services → OAuth consent screen
                          </li>
                          <li>Add your email as a test user, or</li>
                          <li>
                            Click "PUBLISH APP" to make it available to everyone
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

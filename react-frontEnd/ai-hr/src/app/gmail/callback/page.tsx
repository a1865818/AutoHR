"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { sessionCookies } from "@/utils/cookieUtils";

export default function GmailCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        if (error) {
          setStatus("error");
          setMessage(`Authorization failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("Authorization code not received");
          return;
        }

        // Get token from cookies or localStorage
        const sessionData = sessionCookies.getSessionData();
        let token = sessionData.authToken;

        if (!token) {
          token = localStorage.getItem("authToken");
        }

        if (!token) {
          setStatus("error");
          setMessage("User not authenticated");
          return;
        }

        const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
        const redirectUri = `${window.location.origin}/gmail/callback`;

        const response = await fetch(`${BASE_URL}/api/gmail/auth/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code,
            redirectUri,
          }),
        });

        if (response.ok) {
          setStatus("success");
          setMessage(
            "Gmail authorization successful! You can now close this window."
          );

          // Close the popup window after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          const errorData = await response.json();
          setStatus("error");
          setMessage(
            `Authorization failed: ${errorData.error || "Unknown error"}`
          );
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred during authorization");
        console.error("Gmail callback error:", err);
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {status === "processing" && (
            <>
              <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Authorization
              </h1>
              <p className="text-gray-600">
                Please wait while we complete your Gmail authorization...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Authorization Successful!
              </h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                This window will close automatically in a few seconds.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Authorization Failed
              </h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => window.close()}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close Window
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

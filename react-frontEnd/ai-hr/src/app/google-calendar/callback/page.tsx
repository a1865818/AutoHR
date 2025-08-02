"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function GoogleCalendarCallbackPage() {
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

        if (!code || !state) {
          setStatus("error");
          setMessage("Missing authorization code or state parameter");
          return;
        }

        console.log("Processing Google Calendar callback with code and state");

        // Use the exact same redirect URI that was used in the authorization request
        const redirectUri = `${window.location.origin}/google-calendar/callback`;

        console.log(
          "Google Calendar callback - using redirect URI:",
          redirectUri
        );
        console.log("Google Calendar callback - code length:", code?.length);
        console.log("Google Calendar callback - state:", state);

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189"
          }/api/google-calendar/callback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              state,
              redirectUri,
            }),
          }
        );

        if (response.ok) {
          setStatus("success");
          setMessage(
            "Google Calendar authorization successful! You can now close this window."
          );

          // Close the popup window after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          let errorMessage = "Unknown error";
          try {
            const errorData = await response.json();
            errorMessage =
              errorData.message || errorData.error || "Unknown error";
          } catch (jsonError) {
            // If JSON parsing fails, use the response text
            const responseText = await response.text();
            errorMessage =
              responseText || `HTTP ${response.status}: ${response.statusText}`;
          }

          setStatus("error");
          setMessage(`Authorization failed: ${errorMessage}`);
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred during authorization");
        console.error("Google Calendar callback error:", err);
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
                Please wait while we complete your Google Calendar
                authorization...
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

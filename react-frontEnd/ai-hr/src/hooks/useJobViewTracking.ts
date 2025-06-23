// hooks/useJobViewTracking.ts - Updated to only log, not track
import { useEffect, useRef } from "react";

interface ViewTrackingOptions {
  enabled?: boolean;
  delay?: number; // Minimum time on page before counting as view (in ms)
}

export function useJobViewTracking(
  jobId: string | undefined,
  options: ViewTrackingOptions = {}
) {
  const {
    enabled = true,
    delay = 3000, // 3 seconds minimum view time
  } = options;
  const hasTrackedView = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Only log if enabled and jobId exists
    if (!enabled || !jobId || hasTrackedView.current) {
      return;
    }

    console.log(`👀 Starting view session for job: ${jobId}`);
    startTimeRef.current = Date.now();
    hasTrackedView.current = true;

    // Generate session ID for consistency with backend
    let sessionId = sessionStorage.getItem("viewSessionId");
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem("viewSessionId", sessionId);
    }

    console.log(
      `📊 Job view session started: ${jobId} (session: ${sessionId})`
    );
    console.log(
      `ℹ️  View tracking is handled by the backend when job details are fetched`
    );

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [jobId, enabled, delay]);

  // Log when component unmounts
  useEffect(() => {
    return () => {
      if (jobId && enabled && hasTrackedView.current && startTimeRef.current) {
        const viewDuration = Date.now() - startTimeRef.current;
        console.log(
          `📊 Job view session ended: ${jobId} (duration: ${Math.round(
            viewDuration / 1000
          )}s)`
        );
      }
    };
  }, [jobId, enabled]);

  const generateSessionId = (): string => {
    return "view_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
  };

  return {
    isTracking: false, // Always false since backend handles tracking
    hasTracked: hasTrackedView.current,
  };
}

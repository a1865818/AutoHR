import { formatDistanceToNow } from "date-fns";
/**
 * Get a consistent "now" timestamp rounded to the nearest minute
 * This helps sync timestamp displays across components
 */
const getConsistentNow = (): Date => {
  const now = new Date();
  // Round to nearest minute to reduce inconsistencies
  const roundedTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0,
    0
  );
  return roundedTime;
};

/**
 * Formats a UTC timestamp to show relative time in Adelaide timezone
 * @param timestamp - UTC timestamp string from database
 * @param showLocal - Whether to show the local time string for debugging
 * @returns Formatted relative time string
 */
export const formatTimestamp = (
  timestamp: string | undefined,
  showLocal?: boolean
): string => {
  if (!timestamp) return "Unknown time";

  try {
    // Parse the UTC timestamp correctly
    let utcDate: Date;

    if (timestamp.includes("+00")) {
      // Convert "+00" to "Z" for proper parsing
      utcDate = new Date(timestamp.replace("+00", "Z"));
    } else if (timestamp.includes("Z")) {
      // Already has Z timezone info
      utcDate = new Date(timestamp);
    } else {
      // Assume UTC if no timezone info - add Z
      utcDate = new Date(timestamp + "Z");
    }

    // Validate the date
    if (isNaN(utcDate.getTime())) {
      console.warn("Invalid timestamp:", timestamp);
      return "Invalid time";
    }

    // Use consistent "now" time for calculations
    const now = getConsistentNow();
    const diffMs = now.getTime() - utcDate.getTime();

    // TEMPORARY FIX: Check if timestamp seems to be in the future
    // Adelaide is UTC+9:30, so adjust accordingly
    if (diffMs < -3600000) {
      // More than 1 hour in future
      const adelaideOffset = 9.5 * 60 * 60 * 1000; // 9.5 hours in milliseconds (UTC+9:30)
      const adjustedDate = new Date(utcDate.getTime() - adelaideOffset);

      if (showLocal) {
        console.log("🔧 TIMEZONE FIX APPLIED:", {
          original: timestamp,
          originalUTC: utcDate.toISOString(),
          adjustedUTC: adjustedDate.toISOString(),
          originalDiffMs: diffMs,
          adjustedDiffMs: now.getTime() - adjustedDate.getTime(),
          adjustment: "Subtracted Adelaide offset (UTC+9:30)",
          consistentNow: now.toISOString(),
        });
      }

      return formatDistanceToNow(adjustedDate, { addSuffix: true });
    }

    // Use formatDistanceToNow directly with the UTC date
    const relativeTime = formatDistanceToNow(utcDate, { addSuffix: true });

    // Debug info
    if (showLocal) {
      console.log("🕐 Timestamp Debug:", {
        original: timestamp,
        utcDate: utcDate.toISOString(),
        utcTime: utcDate.getTime(),
        nowTime: now.getTime(),
        consistentNow: now.toISOString(),
        diffMs: diffMs,
        diffHours: diffMs / (1000 * 60 * 60),
        relativeTime,
        browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        needsAdjustment: diffMs < -3600000,
      });
    }

    return relativeTime;
  } catch (error) {
    console.error("Error formatting timestamp:", error, "Original:", timestamp);
    return "Unknown time";
  }
};

/**
 * Formats a timestamp for the modal display with more detail
 */
export const formatTimestampDetailed = (
  timestamp: string | undefined
): string => {
  if (!timestamp) return "Never";

  try {
    // Parse the UTC timestamp correctly (same logic as formatTimestamp)
    let utcDate: Date;

    if (timestamp.includes("+00")) {
      // Convert "+00" to "Z" for proper parsing
      utcDate = new Date(timestamp.replace("+00", "Z"));
    } else if (timestamp.includes("Z")) {
      // Already has Z timezone info
      utcDate = new Date(timestamp);
    } else {
      // Assume UTC if no timezone info - add Z
      utcDate = new Date(timestamp + "Z");
    }

    if (isNaN(utcDate.getTime())) {
      return "Invalid time";
    }

    // Use consistent "now" time for calculations
    const now = getConsistentNow();
    let diffInMilliseconds = now.getTime() - utcDate.getTime();

    // FIXED: Apply the same timezone adjustment as formatTimestamp
    if (diffInMilliseconds < -3600000) {
      // More than 1 hour in future
      const adelaideOffset = 9.5 * 60 * 60 * 1000; // 9.5 hours in milliseconds (UTC+9:30)
      const adjustedDate = new Date(utcDate.getTime() - adelaideOffset);
      diffInMilliseconds = now.getTime() - adjustedDate.getTime();

      console.log("🔧 DETAILED TIMEZONE FIX APPLIED:", {
        original: timestamp,
        originalUTC: utcDate.toISOString(),
        adjustedUTC: adjustedDate.toISOString(),
        originalDiffMs: now.getTime() - utcDate.getTime(),
        adjustedDiffMs: diffInMilliseconds,
        adelaideOffset: "UTC+9:30",
        consistentNow: now.toISOString(),
      });
    }

    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    // Handle negative times (should be rare now with timezone fix)
    if (diffInMilliseconds < 0) {
      console.warn(
        "⚠️ Timestamp still appears to be in the future after adjustment:",
        {
          timestamp,
          diffMs: diffInMilliseconds,
        }
      );
      return "Just now";
    }

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    } else {
      // For older dates, show the actual date in Adelaide timezone
      return utcDate.toLocaleDateString("en-AU", {
        timeZone: "Australia/Adelaide",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch (error) {
    console.error("Error formatting detailed timestamp:", error);
    return "Unknown time";
  }
};

// Storage event utilities for cross-tab communication

export interface StorageEventData {
  type: "logout" | "login" | "session_update";
  timestamp: number;
  data?: unknown;
}

export const storageEvents = {
  /**
   * Dispatch a storage event to notify other tabs
   */
  dispatch(eventType: StorageEventData["type"], data?: unknown): void {
    // Don't dispatch on server side
    if (typeof window === "undefined") {
      return;
    }

    const eventData: StorageEventData = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    // Store the event in localStorage to trigger storage event
    localStorage.setItem("authEvent", JSON.stringify(eventData));

    // Remove it immediately to keep localStorage clean
    setTimeout(() => {
      localStorage.removeItem("authEvent");
    }, 100);
  },

  /**
   * Listen for storage events from other tabs
   */
  listen(callback: (event: StorageEventData) => void): () => void {
    // Don't listen on server side
    if (typeof window === "undefined") {
      return () => {}; // Return empty cleanup function
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "authEvent" && e.newValue) {
        try {
          const eventData: StorageEventData = JSON.parse(e.newValue);
          callback(eventData);
        } catch (error) {
          console.error("Error parsing storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    // Return cleanup function
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  },

  /**
   * Check if the current tab is the one that triggered the event
   */
  isCurrentTabEvent(event: StorageEvent): boolean {
    // This is a simple heuristic - in a real app you might want to add a unique tab ID
    return event.newValue === null;
  },
};

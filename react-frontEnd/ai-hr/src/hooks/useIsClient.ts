"use client";

import { useState, useEffect } from "react";

/**
 * Hook to safely detect if we're on the client side
 * This prevents hydration mismatches by ensuring the component
 * renders the same on both server and client initially
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

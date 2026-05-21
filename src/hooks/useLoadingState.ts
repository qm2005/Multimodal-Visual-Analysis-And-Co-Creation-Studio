import { useState, useCallback, useMemo } from "react";

/**
 * Custom hook to streamline and manage the visual loading workflows,
 * including tracking concurrent requests and micro-granular stage indices.
 */
export function useLoadingState() {
  const [activeRequests, setActiveRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [regionLoading, setRegionLoading] = useState(false);

  const incrementRequests = useCallback(() => {
    setActiveRequests((prev) => prev + 1);
  }, []);

  const decrementRequests = useCallback(() => {
    setActiveRequests((prev) => Math.max(0, prev - 1));
  }, []);

  const startAnalysis = useCallback((isRegion = false) => {
    setActiveRequests((prev) => prev + 1);
    if (isRegion) {
      setRegionLoading(true);
    } else {
      setLoading(true);
    }
  }, []);

  const endAnalysis = useCallback((isRegion = false) => {
    setActiveRequests((prev) => Math.max(0, prev - 1));
    if (isRegion) {
      setRegionLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const resetAll = useCallback(() => {
    setActiveRequests(0);
    setLoading(false);
    setRegionLoading(false);
  }, []);

  // Consolidating states into a single derived state as requested
  const isGlobalLoading = useMemo(() => {
    return activeRequests > 0 || loading || regionLoading;
  }, [activeRequests, loading, regionLoading]);

  return {
    loading,
    setLoading,
    regionLoading,
    setRegionLoading,
    activeRequests,
    setActiveRequests,
    isGlobalLoading,
    incrementRequests,
    decrementRequests,
    startAnalysis,
    endAnalysis,
    resetAll,
  };
}

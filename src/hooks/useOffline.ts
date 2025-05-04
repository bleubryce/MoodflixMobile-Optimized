import { useNetInfo } from "@react-native-community/netinfo";
import { offlineService } from "@services/offlineService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Movie } from "@types/movie";
import { OfflineState } from "@types/offline";
import { useState, useEffect } from "react";

export const useOffline = () => {
  const netInfo = useNetInfo();
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isConnected: true,
    lastSync: null,
    cacheSize: 0,
  });

  useEffect(() => {
    const loadOfflineState = async () => {
      const isConnected = await offlineService.isConnected();
      setOfflineState((prev) => ({ ...prev, isConnected }));
    };

    loadOfflineState();
    return () => {
      // Cleanup if needed
    };
  }, [offlineService]);

  useEffect(() => {
    const updateConnectionState = async () => {
      const isConnected = netInfo.isConnected ?? true;
      setOfflineState((prev) => ({ ...prev, isConnected }));
    };

    updateConnectionState();
    return () => {
      // Cleanup if needed
    };
  }, [netInfo.isConnected]);

  const updateLastSync = async (timestamp: string) => {
    setOfflineState((prev) => ({ ...prev, lastSync: new Date(timestamp) }));
  };

  const clearCache = async () => {
    await offlineService.clearCache();
    setOfflineState((prev) => ({
      ...prev,
      cacheSize: 0,
      lastSync: null,
    }));
  };

  const queryClient = useQueryClient();
  const { data: isOffline } = useQuery({
    queryKey: ["offline"],
    queryFn: () => offlineService.isConnected().then((connected) => !connected),
    initialData: false,
  });

  return {
    isConnected: offlineState.isConnected,
    lastSync: offlineState.lastSync,
    cacheSize: offlineState.cacheSize,
    updateLastSync,
    clearCache,
    isOffline,
  };
};

interface UseOfflineOptions<T> {
  queryKey: string[];
  fetchFn: () => Promise<T>;
  cacheKey: string;
  staleTime?: number;
}

export function useOfflineData<T>({
  queryKey,
  fetchFn,
  cacheKey,
  staleTime = 5 * 60 * 1000, // 5 minutes
}: UseOfflineOptions<T>) {
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = offlineService.subscribeToNetworkChanges(setIsOnline);
    return () => unsubscribe();
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const result = await fetchFn();
        // Cache the result
        await offlineService.cacheMovies(result as unknown as Movie[]);
        return result;
      } catch (err) {
        // If offline, try to get cached data
        if (!isOnline) {
          const cached = await offlineService.getCachedMovies();
          if (cached.length > 0) {
            return cached as unknown as T;
          }
        }
        throw err;
      }
    },
    staleTime,
    retry: isOnline ? 3 : 0,
    enabled: true,
  });

  return {
    data,
    isLoading,
    error,
    isOnline,
  };
}

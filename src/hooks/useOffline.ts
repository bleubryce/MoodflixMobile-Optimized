import { useState, useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { offlineService } from '../services/offlineService';
import { OfflineState } from '../types/offline';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OfflineService } from '../services/offlineService';
import { Movie } from '../types/movie';

export const useOffline = () => {
  const netInfo = useNetInfo();
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isConnected: true,
    lastSync: null,
    cacheSize: 0,
  });

  useEffect(() => {
    const loadOfflineState = async () => {
      const state = await offlineService.getOfflineState();
      setOfflineState(state);
    };

    loadOfflineState();
  }, []);

  useEffect(() => {
    const updateConnectionState = async () => {
      const isConnected = netInfo.isConnected ?? true;
      await offlineService.updateOfflineState({ isConnected });
      setOfflineState(prev => ({ ...prev, isConnected }));
    };

    updateConnectionState();
  }, [netInfo.isConnected]);

  const updateLastSync = async (timestamp: string) => {
    await offlineService.updateOfflineState({ lastSync: timestamp });
    setOfflineState(prev => ({ ...prev, lastSync: timestamp }));
  };

  const clearCache = async () => {
    await offlineService.clearCache();
    setOfflineState(prev => ({
      ...prev,
      cacheSize: 0,
      lastSync: null,
    }));
  };

  const _queryClient = useQueryClient();
  const { data: isOffline } = useQuery({
    queryKey: ['offline'],
    queryFn: () => OfflineService.isOffline(),
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
    const unsubscribe = OfflineService.subscribeToNetworkChanges(setIsOnline);
    return () => unsubscribe();
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const result = await fetchFn();
        // Cache the result
        await OfflineService.cacheMovies(result as unknown as Movie[]);
        return result;
      } catch (err) {
        // If offline, try to get cached data
        if (!isOnline) {
          const cached = await OfflineService.getCachedMovies();
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
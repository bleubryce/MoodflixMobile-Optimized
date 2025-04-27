import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TMDBMovie } from '../types/tmdb';

export class OfflineService {
  private static instance: OfflineService;
  private subscribers: ((isConnected: boolean) => void)[] = [];

  private constructor() {
    NetInfo.addEventListener(state => {
      this.notifySubscribers(state.isConnected ?? false);
    });
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  public subscribeToNetworkChanges(callback: (isConnected: boolean) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(isConnected: boolean): void {
    this.subscribers.forEach(callback => callback(isConnected));
  }

  public async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  public async cacheData<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  public async getCachedData<T>(key: string, ttl?: number): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, itemTtl } = JSON.parse(cached);
      const effectiveTtl = ttl || itemTtl;

      if (effectiveTtl && Date.now() - timestamp > effectiveTtl) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  public async clearCache(key?: string): Promise<void> {
    try {
      if (key) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  public async getCachedMovies(): Promise<TMDBMovie[]> {
    const cachedMovies = await this.getCachedData<TMDBMovie[]>('cached_movies', 24 * 60 * 60 * 1000);
    return cachedMovies || [];
  }

  public async cacheMovies(movies: TMDBMovie[]): Promise<void> {
    return this.cacheData('cached_movies', movies, 24 * 60 * 60 * 1000);
  }
}

export const offlineService = OfflineService.getInstance(); 
import { Movie } from './index';

export interface CachedMovie extends Movie {
  lastUpdated: string;
  isOffline: boolean;
}

export interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // in bytes
}

export interface OfflineState {
  isConnected: boolean;
  lastSync: string | null;
  cacheSize: number;
} 
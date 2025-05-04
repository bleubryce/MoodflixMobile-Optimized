import { Movie } from "./movie";

export interface OfflineState {
  isConnected: boolean;
  lastSync: Date | null;
  cacheSize: number;
}

export interface OfflineService {
  getOfflineState: () => Promise<OfflineState>;
  updateOfflineState: (state: Partial<OfflineState>) => Promise<void>;
  isOffline: () => Promise<boolean>;
  subscribeToNetworkChanges: (
    callback: (isConnected: boolean) => void,
  ) => () => void;
  cacheMovies: (movies: Movie[]) => Promise<void>;
  getCachedMovies: () => Promise<Movie[]>;
  clearCache: () => Promise<void>;
}

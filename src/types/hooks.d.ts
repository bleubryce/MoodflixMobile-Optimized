import { Movie } from "./movie";
import { User } from "./auth";
import { NotificationPreferences } from "./notifications";
import { OfflineState } from "./offline";
import { WatchParty } from "./watchParty";

export interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export interface UseNotificationsResult {
  preferences: NotificationPreferences;
  loading: boolean;
  error: Error | null;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

export interface UseOfflineResult {
  isOffline: boolean;
  offlineState: OfflineState;
  loading: boolean;
  error: Error | null;
  updateOfflineState: (state: Partial<OfflineState>) => Promise<void>;
  cacheMovies: (movies: Movie[]) => Promise<void>;
  getCachedMovies: () => Promise<Movie[]>;
  clearCache: () => Promise<void>;
}

export interface UseWatchPartyResult {
  party: WatchParty | null;
  loading: boolean;
  error: Error | null;
  createParty: (movieId: string, startTime: Date) => Promise<string>;
  joinParty: (partyId: string) => Promise<void>;
  leaveParty: (partyId: string) => Promise<void>;
  updatePartyStatus: (status: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  updatePlaybackStatus: (
    currentTime: number,
    isPlaying: boolean,
  ) => Promise<void>;
  inviteUser: (userId: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
}

declare module "src/hooks/useMovies" {
  export const useMovies: () => UseMoviesResult;
}

declare module "src/hooks/useAuth" {
  export const useAuth: () => UseAuthResult;
}

declare module "src/hooks/useNotifications" {
  export const useNotifications: () => UseNotificationsResult;
}

declare module "src/hooks/useOffline" {
  export const useOffline: () => UseOfflineResult;
}

declare module "src/hooks/useWatchParty" {
  export const useWatchParty: (partyId?: string) => UseWatchPartyResult;
}

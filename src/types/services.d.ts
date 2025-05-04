import { Movie } from "./movie";
import { User } from "./auth";
import { WatchParty, WatchPartyParticipant, ChatMessage } from "./watchParty";
import { NotificationPreferences } from "./notifications";
import { OfflineState } from "./offline";

export interface MovieService {
  getMovieDetails: (movieId: string) => Promise<Movie>;
  searchMovies: (query: string, page?: number) => Promise<Movie[]>;
  getPopularMovies: (page?: number) => Promise<Movie[]>;
  getRecommendations: (movieId: string) => Promise<Movie[]>;
}

export interface NotificationService {
  getPreferences: () => Promise<NotificationPreferences>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  scheduleMoodSuggestionNotification: (mood: string) => Promise<void>;
  scheduleWatchReminder: (movieTitle: string) => Promise<void>;
  showLocalNotification: (title: string, body: string) => Promise<void>;
  sendNotification: (
    userId: string,
    title: string,
    body: string,
  ) => Promise<void>;
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
  clearCache: (key?: string) => Promise<void>;
  cacheData: <T>(key: string, data: T, ttl?: number) => Promise<void>;
  getCachedData: <T>(key: string) => Promise<T | null>;
}

export interface WatchPartyService {
  createParty: (movieId: string, startTime: Date) => Promise<string>;
  joinParty: (partyId: string) => Promise<void>;
  leaveParty: (partyId: string) => Promise<void>;
  getPartyDetails: (partyId: string) => Promise<WatchParty>;
  updatePartyStatus: (partyId: string, status: string) => Promise<void>;
  sendChatMessage: (partyId: string, message: string) => Promise<void>;
  updatePlaybackStatus: (
    partyId: string,
    currentTime: number,
    isPlaying: boolean,
  ) => Promise<void>;
  inviteUser: (partyId: string, userId: string) => Promise<void>;
  removeUser: (partyId: string, userId: string) => Promise<void>;
}

export interface FriendService {
  getFriends: (userId: string) => Promise<User[]>;
  getFriendRequests: (userId: string) => Promise<User[]>;
  sendFriendRequest: (userId: string, friendId: string) => Promise<void>;
  acceptFriendRequest: (userId: string, friendId: string) => Promise<void>;
  rejectFriendRequest: (userId: string, friendId: string) => Promise<void>;
  removeFriend: (userId: string, friendId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
}

export interface ActivityService {
  getActivityFeed: (userId: string) => Promise<ActivityItem[]>;
  addActivity: (userId: string, activity: ActivityItem) => Promise<void>;
  clearActivityFeed: (userId: string) => Promise<void>;
}

export interface ActivityItem {
  id: string;
  type: string;
  userId: string;
  movieId?: string;
  watchPartyId?: string;
  friendId?: string;
  timestamp: string;
  data?: Record<string, any>;
}

declare module "src/services/notificationService" {
  export const NotificationService: {
    getPreferences: () => Promise<NotificationPreferences>;
    updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
    cancelAllNotifications: () => Promise<void>;
  };
}

declare module "src/services/offlineService" {
  export const OfflineService: {
    getOfflineState: () => Promise<OfflineState>;
    updateOfflineState: (state: Partial<OfflineState>) => Promise<void>;
    isOffline: () => Promise<boolean>;
    subscribeToNetworkChanges: (
      callback: (isConnected: boolean) => void,
    ) => () => void;
    cacheMovies: (movies: Movie[]) => Promise<void>;
    getCachedMovies: () => Promise<Movie[]>;
    clearCache: () => Promise<void>;
  };
}

declare module "src/services/authService" {
  export const AuthService: {
    signIn: (
      email: string,
      password: string,
    ) => Promise<{ user: User; token: string }>;
    signUp: (
      email: string,
      password: string,
      username: string,
    ) => Promise<{ user: User; token: string }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    getCurrentUser: () => Promise<User | null>;
  };
}

declare module "src/services/watchPartyService" {
  export const WatchPartyService: {
    createParty: (movieId: string, startTime: Date) => Promise<string>;
    joinParty: (partyId: string) => Promise<void>;
    leaveParty: (partyId: string) => Promise<void>;
    getPartyDetails: (partyId: string) => Promise<{
      id: string;
      movieId: string;
      hostId: string;
      startTime: Date;
      participants: User[];
    }>;
  };
}

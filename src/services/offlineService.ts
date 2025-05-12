import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { CacheError, NetworkError, AuthenticationError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";
import { Movie } from "../types/movie";
import { WatchParty } from "../types/watchParty";
import { NotificationPreferences } from "../types/notifications";
import { MoodHistory } from "../types/mood";
import { supabase } from "../lib/supabase";

interface CacheConfig {
  maxAge: number;
  maxItems: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface PendingSync<T> {
  action: "create" | "update" | "delete";
  entityType: string;
  data: T;
  timestamp: number;
}

class CacheNotConfiguredError extends Error {
  constructor(entityType: string) {
    super(`No cache configuration for entity type: ${entityType}`);
    this.name = "CacheNotConfiguredError";
  }
}

class UnknownEntityError extends Error {
  constructor(entityType: string) {
    super(`Unknown entity type for sync: ${entityType}`);
    this.name = "UnknownEntityError";
  }
}

class OfflineServiceImpl {
  private static readonly CACHE_CONFIG: Record<string, CacheConfig> = {
    movies: { maxAge: 24 * 60 * 60 * 1000, maxItems: 100 }, // 24 hours
    moods: { maxAge: 7 * 24 * 60 * 60 * 1000, maxItems: 100 }, // 7 days
    watchParties: { maxAge: 12 * 60 * 60 * 1000, maxItems: 50 }, // 12 hours
    notifications: { maxAge: 24 * 60 * 60 * 1000, maxItems: 100 }, // 24 hours
  };

  private static instance: OfflineServiceImpl;
  private subscribers: ((isConnected: boolean) => void)[] = [];
  private isOnline: boolean = true;
  private pendingSyncs: PendingSync<any>[] = [];
  private readonly errorHandler = ErrorHandler.getInstance();
  private readonly MOVIES_CACHE_KEY = "@movies_cache";

  private constructor() {
    this.setupNetworkListener();
    this.loadPendingSyncs();
  }

  public static getInstance(): OfflineServiceImpl {
    if (!OfflineServiceImpl.instance) {
      OfflineServiceImpl.instance = new OfflineServiceImpl();
    }
    return OfflineServiceImpl.instance;
  }

  public subscribeToNetworkChanges(
    callback: (isConnected: boolean) => void,
  ): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  public async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      await this.errorHandler.handleError(
        new NetworkError("Failed to check network connectivity"),
        {
          componentName: "OfflineService",
          action: "isConnected",
        }
      );
      return false;
    }
  }

  private async setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify subscribers
      this.subscribers.forEach((callback) => callback(this.isOnline));

      if (wasOffline && this.isOnline) {
        this.syncPendingChanges();
      }
    });
  }

  private async loadPendingSyncs() {
    try {
      const syncs = await AsyncStorage.getItem("pending_syncs");
      if (syncs) {
        this.pendingSyncs = JSON.parse(syncs);
      }
    } catch (error) {
      await this.errorHandler.handleError(
        new CacheError(
          "Failed to load pending syncs",
          "pending_syncs",
          "read"
        ),
        {
          componentName: "OfflineService",
          action: "loadPendingSyncs",
        }
      );
    }
  }

  private async savePendingSyncs() {
    try {
      await AsyncStorage.setItem(
        "pending_syncs",
        JSON.stringify(this.pendingSyncs),
      );
    } catch (error) {
      await this.errorHandler.handleError(
        new CacheError(
          "Failed to save pending syncs",
          "pending_syncs",
          "write"
        ),
        {
          componentName: "OfflineService",
          action: "savePendingSyncs",
        }
      );
    }
  }

  async cacheData<T extends unknown[] | Record<string, unknown>>(
    key: string,
    data: T,
    entityType: string,
  ): Promise<void> {
    const config = OfflineServiceImpl.CACHE_CONFIG[entityType];
    if (!config) {
      throw new CacheNotConfiguredError(entityType);
    }

    const entry: CacheEntry<T> = {
      data: Array.isArray(data) ? (data.slice(0, config.maxItems) as T) : data,
      timestamp: Date.now(),
    };

    try {
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      await this.errorHandler.handleError(
        new CacheError(
          `Failed to cache ${entityType} data`,
          key,
          "write"
        ),
        {
          componentName: "OfflineService",
          action: "cacheData",
          additionalInfo: { entityType },
        }
      );
      throw error;
    }
  }

  async getCachedData<T>(key: string, entityType: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const config = OfflineServiceImpl.CACHE_CONFIG[entityType];

      if (!config) {
        throw new CacheNotConfiguredError(entityType);
      }

      // Check if cache is still valid
      if (Date.now() - entry.timestamp > config.maxAge) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      await this.errorHandler.handleError(
        new CacheError(
          `Failed to retrieve cached ${entityType} data`,
          key,
          "read"
        ),
        {
          componentName: "OfflineService",
          action: "getCachedData",
          additionalInfo: { entityType },
        }
      );
      return null;
    }
  }

  async addPendingSync<T>(
    action: "create" | "update" | "delete",
    entityType: string,
    data: T,
  ): Promise<void> {
    if (this.isOnline) {
      return; // No need to queue if online
    }

    const sync: PendingSync<T> = {
      action,
      entityType,
      data,
      timestamp: Date.now(),
    };

    this.pendingSyncs.push(sync);
    await this.savePendingSyncs();
  }

  private async syncPendingChanges() {
    if (!this.isOnline || this.pendingSyncs.length === 0) return;

    const syncs = [...this.pendingSyncs];
    this.pendingSyncs = [];
    await this.savePendingSyncs();

    for (const sync of syncs) {
      try {
        switch (sync.entityType) {
          case "movies":
            await this.syncMovieData(sync as PendingSync<Movie>);
            break;
          case "moods":
            await this.syncMoodData(sync as PendingSync<MoodHistory>);
            break;
          case "watchParties":
            await this.syncWatchPartyData(sync as PendingSync<WatchParty>);
            break;
          case "notifications":
            await this.syncNotificationData(
              sync as PendingSync<NotificationPreferences>,
            );
            break;
          default:
            throw new UnknownEntityError(sync.entityType);
        }
      } catch (error) {
        await this.errorHandler.handleError(
          error instanceof Error ? error : new Error(`Failed to sync ${sync.entityType}`),
          {
            componentName: "OfflineService",
            action: "syncPendingChanges",
            additionalInfo: { sync },
          }
        );
        // Re-add failed sync to queue
        this.pendingSyncs.push(sync);
        await this.savePendingSyncs();
      }
    }
  }

  private async syncMovieData(sync: PendingSync<Movie>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError("User not authenticated", "auth", "supabase");
      }

      switch (sync.action) {
        case "create":
          await supabase
            .from("watched_movies")
            .insert({
              user_id: user.id,
              movie_id: sync.data.id,
              watched_at: sync.timestamp,
            });
          break;
        case "update":
          await supabase
            .from("watched_movies")
            .update({
              rating: sync.data.vote_average,
              updated_at: sync.timestamp,
            })
            .eq("user_id", user.id)
            .eq("movie_id", sync.data.id);
          break;
        case "delete":
          await supabase
            .from("watched_movies")
            .delete()
            .eq("user_id", user.id)
            .eq("movie_id", sync.data.id);
          break;
      }
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to sync movie data"),
        {
          componentName: "OfflineService",
          action: "syncMovieData",
          additionalInfo: { sync },
        }
      );
      throw error;
    }
  }

  private async syncMoodData(sync: PendingSync<MoodHistory>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError("User not authenticated", "auth", "supabase");
      }

      switch (sync.action) {
        case "create":
          await supabase
            .from("mood_history")
            .insert({
              user_id: user.id,
              movie_id: sync.data.movieId,
              mood: sync.data.mood,
              created_at: sync.data.timestamp,
            });
          break;
        case "update":
          await supabase
            .from("mood_history")
            .update({
              mood: sync.data.mood,
              updated_at: sync.timestamp,
            })
            .eq("user_id", user.id)
            .eq("movie_id", sync.data.movieId)
            .eq("created_at", sync.data.timestamp);
          break;
        case "delete":
          await supabase
            .from("mood_history")
            .delete()
            .eq("user_id", user.id)
            .eq("movie_id", sync.data.movieId)
            .eq("created_at", sync.data.timestamp);
          break;
      }
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to sync mood data"),
        {
          componentName: "OfflineService",
          action: "syncMoodData",
          additionalInfo: { sync },
        }
      );
      throw error;
    }
  }

  private async syncWatchPartyData(sync: PendingSync<WatchParty>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError("User not authenticated", "auth", "supabase");
      }

      const watchPartyData = {
        host_id: user.id,
        movie_id: sync.data.movieId,
        status: sync.data.status,
        current_position: 0,
        is_playing: false,
        participants: JSON.stringify(sync.data.participants),
        chat_messages: JSON.stringify(sync.data.chatMessages)
      };

      switch (sync.action) {
        case "create":
          await supabase
            .from("watch_parties")
            .insert({
              ...watchPartyData,
              created_at: sync.timestamp
            });
          break;
        case "update":
          await supabase
            .from("watch_parties")
            .update({
              ...watchPartyData,
              updated_at: sync.timestamp
            })
            .eq("host_id", user.id)
            .eq("movie_id", sync.data.movieId);
          break;
        case "delete":
          await supabase
            .from("watch_parties")
            .delete()
            .eq("host_id", user.id)
            .eq("movie_id", sync.data.movieId);
          break;
      }
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to sync watch party data"),
        {
          componentName: "OfflineService",
          action: "syncWatchPartyData",
          additionalInfo: { sync },
        }
      );
      throw error;
    }
  }

  private async syncNotificationData(sync: PendingSync<NotificationPreferences>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError("User not authenticated", "auth", "supabase");
      }

      switch (sync.action) {
        case "update":
          await supabase
            .from("notification_preferences")
            .upsert({
              user_id: user.id,
              ...sync.data,
              updated_at: sync.timestamp,
            });
          break;
      }
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to sync notification preferences"),
        {
          componentName: "OfflineService",
          action: "syncNotificationData",
          additionalInfo: { sync },
        }
      );
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (key) =>
          key.startsWith("movies_") ||
          key.startsWith("moods_") ||
          key.startsWith("watchParties_") ||
          key.startsWith("notifications_") ||
          key === "pending_syncs",
      );
      await AsyncStorage.multiRemove(cacheKeys);
      this.pendingSyncs = [];
    } catch (error) {
      await this.errorHandler.handleError(
        new CacheError(
          "Failed to clear cache",
          "all",
          "delete"
        ),
        {
          componentName: "OfflineService",
          action: "clearCache",
        }
      );
      throw error;
    }
  }

  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  async getCachedMovies(): Promise<Movie[]> {
    try {
      const cached = await this.getCachedData<Movie[]>(this.MOVIES_CACHE_KEY, "movies");
      return cached || [];
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to get cached movies"),
        {
          componentName: "OfflineService",
          action: "getCachedMovies"
        }
      );
      return [];
    }
  }

  async cacheMovies(movies: Movie[]): Promise<void> {
    try {
      await this.cacheData(this.MOVIES_CACHE_KEY, movies, "movies");
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to cache movies"),
        {
          componentName: "OfflineService",
          action: "cacheMovies",
          additionalInfo: { count: movies.length }
        }
      );
    }
  }
}

export const offlineService = OfflineServiceImpl.getInstance();

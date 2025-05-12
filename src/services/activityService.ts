import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityItem, ActivityType } from "../types/activity";
import { AuthenticationError, DatabaseError, CacheError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";

const ACTIVITY_CACHE_KEY = "@activity_feed";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface DatabaseActivityItem {
  id: string;
  user_id: string;
  type: ActivityType;
  content: string;
  timestamp: string;
  data: {
    movie?: { id: number; title: string };
    mood?: { id: number; name: string };
    rating?: number;
    friend_id?: string;
    watch_party_id?: string;
    message?: string;
  };
  is_private: boolean;
  user: {
    username: string;
    avatar_url: string | null;
  };
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class ActivityServiceImpl {
  private static instance: ActivityServiceImpl | null = null;
  private readonly PAGE_SIZE = 20;
  private readonly errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): ActivityServiceImpl {
    if (!ActivityServiceImpl.instance) {
      ActivityServiceImpl.instance = new ActivityServiceImpl();
    }
    return ActivityServiceImpl.instance;
  }

  private transformDatabaseItem(item: DatabaseActivityItem): ActivityItem {
    return {
      id: item.id,
      type: item.type,
      username: item.user.username,
      content: item.content,
      timestamp: item.timestamp,
      resourceId: item.data?.movie?.id?.toString() || item.data?.friend_id,
      avatarUrl: item.user.avatar_url || undefined,
    };
  }

  async recordActivity(
    type: ActivityType,
    content: string,
    data: DatabaseActivityItem["data"],
  ): Promise<ActivityItem> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new AuthenticationError("User not authenticated", "auth", "getUser");
      }

      const activity = {
        type,
        content,
        data,
        timestamp: new Date().toISOString(),
        user_id: user.id,
        is_private: false,
      };

      const { data: newActivity, error } = await supabase
        .from("activities")
        .insert(activity)
        .select(
          `
          *,
          user:profiles!activities_user_id_fkey (
            username,
            avatar_url
          )
        `,
        )
        .single();

      if (error) {
        throw new DatabaseError(
          "Failed to record activity",
          "create",
          "activities",
          error
        );
      }

      const transformedActivity = this.transformDatabaseItem(
        newActivity as DatabaseActivityItem,
      );
      await this.addToLocalCache(transformedActivity);

      return transformedActivity;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "ActivityService",
          action: "recordActivity",
          additionalInfo: { type, content },
        });
      }
      throw error;
    }
  }

  private async addToLocalCache(activity: ActivityItem): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(ACTIVITY_CACHE_KEY);
      let feed: CacheItem<{ items: ActivityItem[]; hasMore: boolean }>;

      if (cached) {
        feed = JSON.parse(cached);
        feed.data.items.unshift(activity);

        if (feed.data.items.length > 100) {
          feed.data.items.pop();
        }
      } else {
        feed = {
          data: { items: [activity], hasMore: true },
          timestamp: Date.now()
        };
      }

      await AsyncStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(feed));
    } catch (error) {
      const cacheError = new CacheError(
        "Failed to update activity cache",
        ACTIVITY_CACHE_KEY,
        "write"
      );
      await this.errorHandler.handleError(cacheError, {
        componentName: "ActivityService",
        action: "addToLocalCache",
        severity: "warning"
      });
      throw cacheError;
    }
  }

  async getActivityFeed(lastTimestamp: string | null): Promise<{
    items: ActivityItem[];
    hasMore: boolean;
    lastTimestamp: string | null;
  }> {
    try {
      // Try to get from cache first if no lastTimestamp (first page)
      if (!lastTimestamp) {
        try {
          const cached = await AsyncStorage.getItem(ACTIVITY_CACHE_KEY);
          if (cached) {
            const { data: feed, timestamp }: CacheItem<{ items: ActivityItem[]; hasMore: boolean }> = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRY) {
              return {
                ...feed,
                lastTimestamp: feed.items[feed.items.length - 1]?.timestamp || null,
              };
            }
          }
        } catch (error) {
          const cacheError = new CacheError(
            "Failed to read activity cache",
            ACTIVITY_CACHE_KEY,
            "read"
          );
          await this.errorHandler.handleError(cacheError, {
            componentName: "ActivityService",
            action: "getActivityFeed",
            severity: "warning"
          });
        }
      }

      let query = supabase
        .from("activities")
        .select(
          `
          id,
          user_id,
          type,
          content,
          timestamp,
          data,
          is_private,
          user:profiles!activities_user_id_fkey (
            username,
            avatar_url
          )
        `,
        )
        .order("timestamp", { ascending: false })
        .limit(this.PAGE_SIZE);

      if (lastTimestamp) {
        query = query.lt("timestamp", lastTimestamp);
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(
          "Failed to fetch activity feed",
          "read",
          "activities",
          error
        );
      }

      const items = (data as unknown as DatabaseActivityItem[]).map(item => this.transformDatabaseItem(item));
      const result = {
        items,
        hasMore: items.length === this.PAGE_SIZE,
        lastTimestamp: items[items.length - 1]?.timestamp || null,
      };

      // Cache first page
      if (!lastTimestamp) {
        await AsyncStorage.setItem(
          ACTIVITY_CACHE_KEY,
          JSON.stringify({
            data: { items, hasMore: result.hasMore },
            timestamp: Date.now()
          })
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "ActivityService",
          action: "getActivityFeed",
          additionalInfo: { lastTimestamp },
        });
      }
      throw error;
    }
  }

  async createActivity(
    type: ActivityType,
    content: string,
    resourceId?: string,
    resourceType?: "movie" | "user" | "mood",
    isPrivate = false,
  ): Promise<void> {
    try {
      const data: DatabaseActivityItem["data"] = {};

      if (resourceId && resourceType) {
        switch (resourceType) {
          case "movie":
            data.movie = { id: parseInt(resourceId), title: "" }; // Title will be filled by DB trigger
            break;
          case "user":
            data.friend_id = resourceId;
            break;
          case "mood":
            data.mood = { id: parseInt(resourceId), name: "" }; // Name will be filled by DB trigger
            break;
        }
      }

      const { error } = await supabase.from("activities").insert({
        type,
        content,
        data,
        timestamp: new Date().toISOString(),
        is_private: isPrivate,
      });

      if (error) {
        throw new DatabaseError(
          "Failed to create activity",
          "create",
          "activities",
          error
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "ActivityService",
          action: "createActivity",
          additionalInfo: { type, content, resourceId, resourceType, isPrivate },
        });
      }
      throw error;
    }
  }
}

export const ActivityService = ActivityServiceImpl;

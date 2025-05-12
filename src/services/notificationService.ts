import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@lib/supabase";
import { CacheError, NotificationError, DatabaseError } from "@errors/errors";
import { ErrorHandler } from "@utils/errorHandler";

const NOTIFICATION_PREFERENCES_KEY = "@notification_preferences";
const NOTIFICATION_TOKEN_KEY = "@notification_token";
const NOTIFICATIONS_CACHE_KEY = "@notifications";

export interface NotificationPayload {
  type: string;
  [key: string]: any;
}

export interface NotificationPreferences {
  enabled: boolean;
  watchPartyNotifications: boolean;
  friendActivityNotifications: boolean;
  movieRecommendationNotifications: boolean;
}

interface NotificationToken {
  token: string;
  platform: string;
  createdAt: string;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

class NotificationService {
  private static instance: NotificationService | null = null;
  private readonly errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Try to get from cache first
      const cached = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to database
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        throw new DatabaseError(
          "Failed to get notification preferences",
          "read",
          "notification_preferences",
          error
        );
      }

      // Cache the preferences
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_KEY,
        JSON.stringify(data)
      );

      return data;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "notificationService",
          action: "getPreferences",
          additionalInfo: { userId },
        });
      }
      throw error;
    }
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .update(preferences)
        .eq("user_id", userId)
        .single();

      if (error) {
        throw new DatabaseError(
          "Failed to update notification preferences",
          "update",
          "notification_preferences",
          error
        );
      }

      // Update cache
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_KEY,
        JSON.stringify(data)
      );

      return data;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "notificationService",
          action: "updatePreferences",
          additionalInfo: { userId, preferences },
        });
      }
      throw error;
    }
  }

  async registerPushToken(): Promise<void> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          throw new NotificationError(
            "Permission to receive notifications was denied",
            "permission"
          );
        }
      }

      const token = await Notifications.getExpoPushTokenAsync();
      const tokenData: NotificationToken = {
        token: token.data,
        platform: Platform.OS,
        createdAt: new Date().toISOString(),
      };

      // Save token to database
      const { error } = await supabase
        .from("notification_tokens")
        .upsert(tokenData);

      if (error) {
        throw new DatabaseError(
          "Failed to save notification token",
          "create",
          "notification_tokens",
          error
        );
      }

      // Cache token
      await AsyncStorage.setItem(
        NOTIFICATION_TOKEN_KEY,
        JSON.stringify(tokenData)
      );
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "notificationService",
          action: "registerPushToken",
          severity: "error",
        });
      }
      throw error;
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      // Try to get from cache first
      const cached = await AsyncStorage.getItem(NOTIFICATIONS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to database
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new DatabaseError(
          "Failed to get notifications",
          "read",
          "notifications",
          error
        );
      }

      // Cache notifications
      await AsyncStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(data));

      return data;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "notificationService",
          action: "getNotifications",
          additionalInfo: { userId },
        });
      }
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        throw new DatabaseError(
          "Failed to mark notification as read",
          "update",
          "notifications",
          error
        );
      }

      // Update cache
      const cached = await AsyncStorage.getItem(NOTIFICATIONS_CACHE_KEY);
      if (cached) {
        const notifications: Notification[] = JSON.parse(cached);
        const updated = notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        await AsyncStorage.setItem(
          NOTIFICATIONS_CACHE_KEY,
          JSON.stringify(updated)
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "notificationService",
          action: "markAsRead",
          additionalInfo: { notificationId },
        });
      }
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(NOTIFICATION_PREFERENCES_KEY),
        AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY),
        AsyncStorage.removeItem(NOTIFICATIONS_CACHE_KEY),
      ]);
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "notificationService",
          action: "clearCache",
          severity: "warning",
        });
      }
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    // Implementation
  }

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    payload?: NotificationPayload
  ): Promise<void> {
    try {
      // Look up the user's push token from Supabase
      const { data: tokens, error } = await supabase
        .from("notification_tokens")
        .select("token")
        .eq("user_id", userId)
        .limit(1);

      if (error) {
        throw new DatabaseError(
          "Failed to fetch notification token",
          "read",
          "notification_tokens",
          error
        );
      }

      if (!tokens || tokens.length === 0) {
        console.warn(`No push token found for user ${userId}`);
        return;
      }

      const pushToken = tokens[0].token;
      const message = {
        to: pushToken,
        sound: "default",
        title,
        body,
        data: payload || {},
      };

      // Send the notification via Expo push API
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new NotificationError(
          `Failed to send push notification: ${response.statusText}`,
          "delivery"
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        const notificationError = new NotificationError(
          "Failed to send notification",
          "delivery"
        );
        await this.errorHandler.handleError(notificationError, {
          componentName: "NotificationService",
          action: "sendNotification",
          additionalInfo: { userId, title }
        });
        throw notificationError;
      }
      throw error;
    }
  }
}

export default NotificationService;

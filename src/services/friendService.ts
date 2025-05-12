import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../lib/supabase";
import { AuthenticationError, DatabaseError, NetworkError, CacheError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";
import { User } from "../types/user";

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  status: FriendStatus;
  createdAt: string;
  updatedAt: string;
}

export type FriendStatus = "pending" | "accepted" | "rejected" | "blocked";

export interface Friend {
  id: string;
  friendship_id: string;
  username: string;
  avatar_url?: string;
  status: FriendStatus;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Friend extends UserProfile {
  friendship_id: string;
  status: FriendStatus;
}

interface BlockedUser {
  blocked_id: string;
  blocked: User;
}

const FRIENDS_CACHE_KEY = "@friends_cache";
const REQUESTS_CACHE_KEY = "@friend_requests_cache";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class FriendServiceImpl {
  private static instance: FriendServiceImpl | null = null;
  private subscription: any = null;
  private readonly errorHandler = ErrorHandler.getInstance();

  private constructor() {}

  public static getInstance(): FriendServiceImpl {
    if (!FriendServiceImpl.instance) {
      FriendServiceImpl.instance = new FriendServiceImpl();
    }
    return FriendServiceImpl.instance;
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new AuthenticationError("User not authenticated", "auth", "supabase");
    }
    return user.id;
  }

  async checkNetworkConnection(): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new NetworkError("Network connection unavailable");
      }
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new NetworkError("Failed to check network connection"),
        {
          componentName: "FriendService",
          action: "checkNetworkConnection",
        }
      );
      throw error;
    }
  }

  async getFriends(): Promise<Friend[]> {
    try {
      await this.checkNetworkConnection();
      const userId = await this.getCurrentUserId();

      // Try to get from cache first
      try {
        const cached = await AsyncStorage.getItem(FRIENDS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache valid for 1 hour
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            return data;
          }
        }
      } catch (cacheError) {
        await this.errorHandler.handleError(
          new CacheError(
            "Failed to read friends cache",
            FRIENDS_CACHE_KEY,
            "read"
          ),
          {
            componentName: "FriendService",
            action: "getFriends_cache",
            severity: "warning"
          }
        );
      }

      const { data: friends, error } = await supabase
        .from("friends")
        .select("*")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq("status", "accepted");

      if (error) {
        throw new DatabaseError(
          "Failed to fetch friends",
          "read",
          "friends",
          error
        );
      }

      // Cache the friends list
      try {
        await AsyncStorage.setItem(
          FRIENDS_CACHE_KEY,
          JSON.stringify({
            data: friends,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        const cacheError = new CacheError(
          "Failed to write friends cache",
          FRIENDS_CACHE_KEY,
          "write"
        );
        await this.errorHandler.handleError(cacheError, {
          componentName: "FriendService",
          action: "getFriends",
          severity: "warning"
        });
      }

      return friends;
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to get friends"),
        {
          componentName: "FriendService",
          action: "getFriends",
          additionalInfo: { userId: await this.getCurrentUserId() },
        }
      );
      throw error;
    }
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    try {
      const userId = await this.getCurrentUserId();

      // Try to get from cache first
      try {
        const cached = await AsyncStorage.getItem(REQUESTS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            return data;
          }
        }
      } catch (error) {
        const cacheError = new CacheError(
          "Failed to read friend requests cache",
          REQUESTS_CACHE_KEY,
          "read"
        );
        await this.errorHandler.handleError(cacheError, {
          componentName: "friendService",
          action: "getFriendRequests",
          severity: "warning"
        });
      }

      await this.checkNetworkConnection();

      const { data: requests, error } = await supabase
        .from("friend_requests")
        .select("*, sender:sender_id(username, avatar_url)")
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new DatabaseError(
          "Failed to fetch friend requests",
          "read",
          "friend_requests",
          error
        );
      }

      const formattedRequests = requests.map((request) => ({
        id: request.id,
        senderId: request.sender_id,
        senderName: request.sender.username,
        senderAvatar: request.sender.avatar_url,
        receiverId: request.receiver_id,
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      }));

      // Cache the results
      try {
        await AsyncStorage.setItem(
          REQUESTS_CACHE_KEY,
          JSON.stringify({
            data: formattedRequests,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        const cacheError = new CacheError(
          "Failed to write friend requests cache",
          REQUESTS_CACHE_KEY,
          "write"
        );
        await this.errorHandler.handleError(cacheError, {
          componentName: "friendService",
          action: "getFriendRequests",
          severity: "warning"
        });
      }

      return formattedRequests;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "friendService",
          action: "getFriendRequests",
          additionalInfo: { userId: await this.getCurrentUserId() },
        });
      }
      throw error;
    }
  }

  async sendFriendRequest(friendId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      await this.checkNetworkConnection();

      const { error } = await supabase
        .from("friend_requests")
        .insert({
          sender_id: userId,
          receiver_id: friendId,
          status: "pending",
        });

      if (error) {
        throw new DatabaseError(
          "Failed to send friend request",
          "create",
          "friend_requests",
          error
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "friendService",
          action: "sendFriendRequest",
          additionalInfo: { friendId },
        });
      }
      throw error;
    }
  }

  async respondToFriendRequest(requestId: string, accept: boolean): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      await this.checkNetworkConnection();

      const { error } = await supabase
        .from("friend_requests")
        .update({
          status: accept ? "accepted" : "rejected",
        })
        .eq("id", requestId)
        .eq("receiver_id", userId);

      if (error) {
        throw new DatabaseError(
          "Failed to respond to friend request",
          "update",
          "friend_requests",
          error
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "friendService",
          action: "respondToFriendRequest",
          additionalInfo: { requestId, accept },
        });
      }
      throw error;
    }
  }

  async removeFriend(friendId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      await this.checkNetworkConnection();

      const { error } = await supabase
        .from("friend_connections")
        .delete()
        .or(`user_id.eq.${userId},friend_id.eq.${friendId}`);

      if (error) {
        throw new DatabaseError(
          "Failed to remove friend",
          "delete",
          "friend_connections",
          error
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "friendService",
          action: "removeFriend",
          additionalInfo: { friendId },
        });
      }
      throw error;
    }
  }

  async blockUser(userId: string): Promise<void> {
    try {
      const currentUserId = await this.getCurrentUserId();
      await this.checkNetworkConnection();

      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: currentUserId,
          blocked_id: userId,
        });

      if (error) {
        throw new DatabaseError(
          "Failed to block user",
          "create",
          "blocked_users",
          error
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "friendService",
          action: "blockUser",
          additionalInfo: { userId },
        });
      }
      throw error;
    }
  }

  async unblockUser(userId: string): Promise<void> {
    try {
      const currentUserId = await this.getCurrentUserId();
      await this.checkNetworkConnection();

      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .match({ blocker_id: currentUserId, blocked_id: userId });

      if (error) {
        throw new DatabaseError(
          "Failed to unblock user",
          "delete",
          "blocked_users",
          error
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "friendService",
          action: "unblockUser",
          additionalInfo: { userId },
        });
      }
      throw error;
    }
  }

  async getBlockedUsers(): Promise<User[]> {
    try {
      const userId = await this.getCurrentUserId();
      await this.checkNetworkConnection();

      const { data, error } = await supabase
        .from("blocked_users")
        .select("blocked_id, blocked:blocked_id(id, username, avatar_url)")
        .eq("blocker_id", userId) as { data: BlockedUser[] | null, error: any };

      if (error) {
        throw new DatabaseError(
          "Failed to get blocked users",
          "read",
          "blocked_users",
          error
        );
      }

      return data?.map((item) => item.blocked) || [];
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "friendService",
          action: "getBlockedUsers",
          additionalInfo: { userId: await this.getCurrentUserId() },
        });
      }
      throw error;
    }
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      await this.checkNetworkConnection();

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, created_at")
        .ilike("username", `%${query}%`)
        .limit(20);

      if (error) {
        throw new DatabaseError(
          "Failed to search users",
          "read",
          "profiles",
          error
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "friendService",
          action: "searchUsers",
          additionalInfo: { query },
        });
      }
      throw error;
    }
  }

  async invalidateCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${FRIENDS_CACHE_KEY}_${key}`);
    } catch (error) {
      if (error instanceof Error) {
        const cacheError = new CacheError(
          "Failed to invalidate cache",
          `${FRIENDS_CACHE_KEY}_${key}`,
          "delete"
        );
        await this.errorHandler.handleError(cacheError, {
          componentName: "friendService",
          action: "invalidateCache",
          additionalInfo: { key },
        });
      }
    }
  }

  setupRealtimeSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = supabase
      .channel('friend_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends',
      }, async (payload) => {
        try {
          await this.handleRealtimeUpdate(payload);
        } catch (error) {
          if (error instanceof Error) {
            await this.errorHandler.handleError(error, {
              componentName: "FriendService",
              action: "handleRealtimeUpdate",
              additionalInfo: { payload },
            });
          }
        }
      })
      .subscribe();
  }

  private async handleRealtimeUpdate(payload: any) {
    // Implementation of realtime update handling
  }

  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}

export const friendService = FriendServiceImpl.getInstance();

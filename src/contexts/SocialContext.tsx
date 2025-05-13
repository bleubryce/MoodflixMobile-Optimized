import { activityService } from "@services/activityService";
import { friendService, Friend, FriendRequest } from "@services/friendService";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { ActivityItem, ActivityType } from "@/types/activity";

interface SocialContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  activityFeed: ActivityItem[];
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  isLoadingActivity: boolean;
  hasMoreActivity: boolean;
  loadMoreActivity: () => Promise<void>;
  sendFriendRequest: (friendId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  createActivity: (
    type: ActivityType,
    content: string,
    resourceId?: string,
    resourceType?: "movie" | "user" | "mood",
    isPrivate?: boolean,
  ) => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshActivity: () => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [hasMoreActivity, setHasMoreActivity] = useState(true);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadInitialData();
    setupSubscriptions();

    return () => {
      friendService.cleanup();
    };
  }, []);

  const loadInitialData = async () => {
    await Promise.all([refreshFriends(), refreshActivity()]);
  };

  const setupSubscriptions = async () => {
    await Promise.all([friendService.setupRealtimeSubscription()]);
  };

  const refreshFriends = async () => {
    try {
      setIsLoadingFriends(true);
      setIsLoadingRequests(true);

      const [friendsData, requestsData] = await Promise.all([
        friendService.getFriends(),
        friendService.getFriendRequests(),
      ]);

      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (error) {
      console.error("Error refreshing friends data:", error);
    } finally {
      setIsLoadingFriends(false);
      setIsLoadingRequests(false);
    }
  };

  const loadMoreActivity = useCallback(async () => {
    if (!hasMoreActivity || isLoadingActivity) return;

    setIsLoadingActivity(true);
    try {
      const { items, hasMore, lastTimestamp } =
        await activityService.getActivityFeed(lastActivityTimestamp);

      setActivityFeed((prev) => [...prev, ...items]);
      setHasMoreActivity(hasMore);
      setLastActivityTimestamp(lastTimestamp);
    } catch (error) {
      console.error("Failed to load activity feed:", error);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [hasMoreActivity, isLoadingActivity, lastActivityTimestamp]);

  const refreshActivity = useCallback(async () => {
    setIsLoadingActivity(true);
    try {
      const { items, hasMore, lastTimestamp } =
        await activityService.getActivityFeed(null);

      setActivityFeed(items);
      setHasMoreActivity(hasMore);
      setLastActivityTimestamp(lastTimestamp);
    } catch (error) {
      console.error("Failed to refresh activity feed:", error);
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  const sendFriendRequest = async (friendId: string) => {
    try {
      await friendService.sendFriendRequest(friendId);
      await refreshFriends();
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await friendService.respondToFriendRequest(requestId, true);
      await refreshFriends();

      await activityService.createActivity(
        "friend",
        "Became friends with someone new",
        undefined,
        "user",
        false,
      );

      await refreshActivity();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      await friendService.respondToFriendRequest(requestId, false);
      await refreshFriends();
    } catch (error) {
      console.error("Error declining friend request:", error);
      throw error;
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await friendService.removeFriend(friendId);
      await refreshFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  };

  const blockUser = async (userId: string) => {
    try {
      await friendService.blockUser(userId);
      await refreshFriends();
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
  };

  const createActivity = async (
    type: ActivityType,
    content: string,
    resourceId?: string,
    resourceType?: "movie" | "user" | "mood",
    isPrivate = false,
  ) => {
    try {
      await activityService.createActivity(
        type,
        content,
        resourceId,
        resourceType,
        isPrivate,
      );
      await refreshActivity();
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  };

  return (
    <SocialContext.Provider
      value={{
        friends,
        friendRequests,
        activityFeed,
        isLoadingFriends,
        isLoadingRequests,
        isLoadingActivity,
        hasMoreActivity,
        loadMoreActivity,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        blockUser,
        createActivity,
        refreshFriends,
        refreshActivity,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = (): SocialContextType => {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error("useSocial must be used within a SocialProvider");
  }
  return context;
};

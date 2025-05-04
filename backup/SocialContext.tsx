import React, { createContext, useContext, useState, useEffect } from 'react';
import { FriendService, Friend, FriendRequest } from '../services/friendService';
import { ActivityService, ActivityItem } from '../services/activityService';

interface SocialContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  activityFeed: ActivityItem[];
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  isLoadingActivity: boolean;
  loadMoreActivity: () => Promise<void>;
  sendFriendRequest: (friendId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  createActivity: (
    type: 'watch' | 'rate' | 'recommend' | 'friend' | 'mood',
    content: string,
    resourceId?: string,
    resourceType?: 'movie' | 'user' | 'mood',
    isPrivate?: boolean
  ) => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshActivity: () => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [activityOffset, setActivityOffset] = useState(0);

  const friendService = FriendService.getInstance();
  const activityService = ActivityService.getInstance();

  useEffect(() => {
    loadInitialData();
    setupSubscriptions();

    return () => {
      friendService.cleanup();
      activityService.cleanup();
    };
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      refreshFriends(),
      refreshActivity(),
    ]);
  };

  const setupSubscriptions = async () => {
    await Promise.all([
      friendService.setupRealtimeSubscription(),
      activityService.setupRealtimeSubscription(),
    ]);
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
      console.error('Error refreshing friends data:', error);
    } finally {
      setIsLoadingFriends(false);
      setIsLoadingRequests(false);
    }
  };

  const refreshActivity = async () => {
    try {
      setIsLoadingActivity(true);
      setActivityOffset(0);
      
      const activityData = await activityService.getActivityFeed(20, 0);
      setActivityFeed(activityData);
    } catch (error) {
      console.error('Error refreshing activity feed:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const loadMoreActivity = async () => {
    try {
      const newOffset = activityOffset + 20;
      setActivityOffset(newOffset);
      
      const moreActivity = await activityService.getActivityFeed(20, newOffset);
      setActivityFeed(prev => [...prev, ...moreActivity]);
    } catch (error) {
      console.error('Error loading more activity:', error);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      await friendService.sendFriendRequest(friendId);
      await refreshFriends();
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await friendService.respondToFriendRequest(requestId, true);
      await refreshFriends();
      
      // Create activity for accepting friend request
      await activityService.createActivity(
        'friend',
        'Became friends with someone new',
        undefined,
        'user',
        false
      );
      
      await refreshActivity();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      await friendService.respondToFriendRequest(requestId, false);
      await refreshFriends();
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await friendService.removeFriend(friendId);
      await refreshFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  };

  const blockUser = async (userId: string) => {
    try {
      await friendService.blockUser(userId);
      await refreshFriends();
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  };

  const createActivity = async (
    type: 'watch' | 'rate' | 'recommend' | 'friend' | 'mood',
    content: string,
    resourceId?: string,
    resourceType?: 'movie' | 'user' | 'mood',
    isPrivate: boolean = false
  ) => {
    try {
      await activityService.createActivity(type, content, resourceId, resourceType, isPrivate);
      await refreshActivity();
    } catch (error) {
      console.error('Error creating activity:', error);
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
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

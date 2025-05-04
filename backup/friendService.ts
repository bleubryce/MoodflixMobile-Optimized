import { User } from '../types/user';
import { supabase } from '../config/supabase';
import { OfflineService } from './offlineService';
import { NotificationService } from './notificationService';

export type FriendStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

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

export interface Friend {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastActive: string;
}

export class FriendService {
  private static instance: FriendService;
  private subscription: any = null;

  private constructor() {}

  static getInstance(): FriendService {
    if (!FriendService.instance) {
      FriendService.instance = new FriendService();
    }
    return FriendService.instance;
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('No active session');
    }
    return session.user.id;
  }

  async getFriends(): Promise<Friend[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Try to get from cache first
      const cachedFriends = await OfflineService.getCachedData<Friend[]>(`friends_${userId}`);
      if (cachedFriends) {
        return cachedFriends;
      }

      const { data: friendConnections, error } = await supabase
        .from('friend_connections')
        .select('*, profiles:friend_id(*)')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;

      const friends: Friend[] = friendConnections.map(connection => ({
        id: connection.id,
        userId: connection.friend_id,
        name: connection.profiles.display_name || connection.profiles.username,
        avatar: connection.profiles.avatar_url,
        status: connection.profiles.online_status || 'offline',
        lastActive: connection.profiles.last_active,
      }));

      // Cache the friends list
      await OfflineService.cacheData(`friends_${userId}`, friends, 5 * 60 * 1000); // 5 minutes TTL

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      // Try to get from cache as fallback
      const cachedFriends = await OfflineService.getCachedData<Friend[]>(`friends_${userId}`);
      return cachedFriends || [];
    }
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('*, sender:sender_id(username, avatar_url)')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return requests.map(request => ({
        id: request.id,
        senderId: request.sender_id,
        senderName: request.sender.username,
        senderAvatar: request.sender.avatar_url,
        receiverId: request.receiver_id,
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      }));
    } catch (error) {
      console.error('Error getting friend requests:', error);
      return [];
    }
  }

  async sendFriendRequest(friendId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Check if request already exists
      const { data: existingRequests } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`);

      if (existingRequests && existingRequests.length > 0) {
        throw new Error('A friend request already exists between these users');
      }

      // Create new request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: userId,
          receiver_id: friendId,
          status: 'pending',
        });

      if (error) throw error;

      // Send notification to the receiver
      await NotificationService.sendNotification(
        friendId,
        'New Friend Request',
        'You have received a new friend request',
        { type: 'friend_request', senderId: userId }
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  async respondToFriendRequest(requestId: string, accept: boolean): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Update request status
      const { data: request, error } = await supabase
        .from('friend_requests')
        .update({ 
          status: accept ? 'accepted' : 'declined',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('receiver_id', userId)
        .select('*')
        .single();

      if (error) throw error;

      if (accept) {
        // Create friend connections for both users
        await Promise.all([
          supabase.from('friend_connections').insert({
            user_id: userId,
            friend_id: request.sender_id,
            status: 'accepted',
          }),
          supabase.from('friend_connections').insert({
            user_id: request.sender_id,
            friend_id: userId,
            status: 'accepted',
          }),
        ]);

        // Send notification to the sender
        await NotificationService.sendNotification(
          request.sender_id,
          'Friend Request Accepted',
          'Your friend request has been accepted',
          { type: 'friend_request_accepted', receiverId: userId }
        );
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  }

  async removeFriend(friendId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Remove both connections
      await Promise.all([
        supabase
          .from('friend_connections')
          .delete()
          .eq('user_id', userId)
          .eq('friend_id', friendId),
        supabase
          .from('friend_connections')
          .delete()
          .eq('user_id', friendId)
          .eq('friend_id', userId),
      ]);

      // Clear cache
      await OfflineService.clearCache(`friends_${userId}`);
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  async blockUser(userId: string): Promise<void> {
    try {
      const currentUserId = await this.getCurrentUserId();
      
      // First remove any existing friend connections
      await this.removeFriend(userId);

      // Then create a block record
      await supabase
        .from('user_blocks')
        .insert({
          blocker_id: currentUserId,
          blocked_id: userId,
        });
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  async unblockUser(userId: string): Promise<void> {
    try {
      const currentUserId = await this.getCurrentUserId();
      
      await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', userId);
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  async getBlockedUsers(): Promise<User[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id, profiles:blocked_id(*)')
        .eq('blocker_id', currentUserId);

      if (error) throw error;

      return data.map(item => ({
        id: item.blocked_id,
        username: item.profiles.username,
        email: item.profiles.email,
        avatarUrl: item.profiles.avatar_url,
        displayName: item.profiles.display_name,
      }));
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }
  }

  async setupRealtimeSubscription(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Clean up existing subscription if any
      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      // Subscribe to friend requests
      this.subscription = supabase
        .channel('friend_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_requests',
            filter: `receiver_id=eq.${userId}`,
          },
          (payload) => {
            // Handle friend request changes
            console.log('Friend request change:', payload);
            // Trigger UI updates or notifications
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_connections',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // Handle friend connection changes
            console.log('Friend connection change:', payload);
            // Trigger UI updates
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up friend subscription:', error);
    }
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}

import { supabase } from '../config/supabase';
import { OfflineService } from './offlineService';
import { NotificationService } from './notificationService';

export interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  type: 'watch' | 'rate' | 'recommend' | 'friend' | 'mood';
  content: string;
  resourceId?: string;
  resourceType?: 'movie' | 'user' | 'mood';
  timestamp: string;
  isPrivate: boolean;
}

export class ActivityService {
  private static instance: ActivityService;
  private subscription: any = null;

  private constructor() {}

  static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('No active session');
    }
    return session.user.id;
  }

  async getActivityFeed(limit: number = 20, offset: number = 0): Promise<ActivityItem[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Try to get from cache first if it's the initial load
      if (offset === 0) {
        const cachedFeed = await OfflineService.getCachedData<ActivityItem[]>(`activity_feed_${userId}`);
        if (cachedFeed) {
          return cachedFeed;
        }
      }

      // Get user's friends
      const { data: friendConnections, error: friendError } = await supabase
        .from('friend_connections')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (friendError) throw friendError;

      const friendIds = friendConnections.map(connection => connection.friend_id);
      
      // Get activity from friends and user
      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('*, profiles:user_id(*)')
        .or(`user_id.eq.${userId},user_id.in.(${friendIds.join(',')})`)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const activityItems: ActivityItem[] = activities.map(activity => ({
        id: activity.id,
        userId: activity.user_id,
        username: activity.profiles.username,
        avatarUrl: activity.profiles.avatar_url,
        type: activity.activity_type,
        content: activity.content,
        resourceId: activity.resource_id,
        resourceType: activity.resource_type,
        timestamp: activity.created_at,
        isPrivate: activity.is_private,
      }));

      // Cache the feed if it's the initial load
      if (offset === 0) {
        await OfflineService.cacheData(`activity_feed_${userId}`, activityItems, 5 * 60 * 1000); // 5 minutes TTL
      }

      return activityItems;
    } catch (error) {
      console.error('Error getting activity feed:', error);
      // Try to get from cache as fallback
      const cachedFeed = await OfflineService.getCachedData<ActivityItem[]>(`activity_feed_${userId}`);
      return cachedFeed || [];
    }
  }

  async createActivity(
    type: 'watch' | 'rate' | 'recommend' | 'friend' | 'mood',
    content: string,
    resourceId?: string,
    resourceType?: 'movie' | 'user' | 'mood',
    isPrivate: boolean = false
  ): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: type,
          content,
          resource_id: resourceId,
          resource_type: resourceType,
          is_private: isPrivate,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Clear activity feed cache to ensure fresh data on next load
      await OfflineService.clearCache(`activity_feed_${userId}`);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async deleteActivity(activityId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      const { error } = await supabase
        .from('user_activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', userId);

      if (error) throw error;

      // Clear activity feed cache
      await OfflineService.clearCache(`activity_feed_${userId}`);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  async updateActivityPrivacy(activityId: string, isPrivate: boolean): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      const { error } = await supabase
        .from('user_activities')
        .update({ is_private: isPrivate })
        .eq('id', activityId)
        .eq('user_id', userId);

      if (error) throw error;

      // Clear activity feed cache
      await OfflineService.clearCache(`activity_feed_${userId}`);
    } catch (error) {
      console.error('Error updating activity privacy:', error);
      throw error;
    }
  }

  async setupRealtimeSubscription(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Clean up existing subscription if any
      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      // Get user's friends
      const { data: friendConnections, error: friendError } = await supabase
        .from('friend_connections')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (friendError) throw friendError;

      const friendIds = friendConnections.map(connection => connection.friend_id);
      
      // Subscribe to activity changes
      this.subscription = supabase
        .channel('activity_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_activities',
            filter: `user_id=in.(${[userId, ...friendIds].join(',')})`,
          },
          (payload) => {
            // Handle new activity
            console.log('New activity:', payload);
            // Clear cache to ensure fresh data on next load
            OfflineService.clearCache(`activity_feed_${userId}`);
            // Notify user if it's a friend's activity
            if (payload.new.user_id !== userId && !payload.new.is_private) {
              NotificationService.showLocalNotification(
                'New Activity',
                payload.new.content
              );
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up activity subscription:', error);
    }
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}

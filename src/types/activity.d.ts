export type ActivityType = 'watch' | 'rate' | 'recommend' | 'friend' | 'mood';

export interface ActivityData {
  movie?: {
    id: number;
    title: string;
  };
  mood?: {
    id: number;
    name: string;
  };
  rating?: number;
  friend_id?: string;
  watch_party_id?: string;
  message?: string;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  username: string;
  content: string;
  timestamp: string;
  resourceId?: string;
  avatarUrl?: string;
  data?: ActivityData;
}

export interface ActivityFeed {
  items: ActivityItem[];
  hasMore: boolean;
  lastTimestamp: string | null;
}

export interface ActivityServiceResponse {
  items: ActivityItem[];
  hasMore: boolean;
  lastTimestamp: string | null;
} 
export interface ActivityItem {
  id: string;
  type: 'watch' | 'rate' | 'recommend' | 'friend' | 'mood';
  username: string;
  avatarUrl?: string;
  content: string;
  resourceId?: string;
  resourceType?: 'movie' | 'user' | 'mood';
  timestamp: string;
  isPrivate?: boolean;
} 
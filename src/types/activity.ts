export type ActivityType = "watch" | "rate" | "recommend" | "friend" | "mood";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  username: string;
  content: string;
  timestamp: string;
  resourceId?: string;
  avatarUrl?: string;
}

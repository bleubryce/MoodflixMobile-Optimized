export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  friendRequests: boolean;
  watchPartyInvites: boolean;
  activityUpdates: boolean;
}

export interface NotificationService {
  getPreferences: () => Promise<NotificationPreferences>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
} 
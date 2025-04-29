export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  friendRequests: boolean;
  watchPartyInvites: boolean;
  activityUpdates: boolean;
  movieRecommendations: boolean;
  moodSuggestions: boolean;
  watchReminders: boolean;
}

export interface NotificationService {
  getPreferences: () => Promise<NotificationPreferences>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  scheduleMoodSuggestionNotification: (mood: string) => Promise<void>;
  scheduleWatchReminder: (movieTitle: string) => Promise<void>;
  showLocalNotification: (title: string, body: string) => Promise<void>;
  sendNotification: (userId: string, title: string, body: string) => Promise<void>;
} 
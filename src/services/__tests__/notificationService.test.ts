import { NotificationService } from '../notificationService';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../../lib/supabase';

jest.mock('expo-notifications');
jest.mock('expo-device');
jest.mock('../../lib/supabase');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('initializes notifications on a physical device', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      await NotificationService.initialize();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
    });

    it('does not initialize on a simulator', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(false);

      await NotificationService.initialize();

      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });
  });

  describe('scheduleRecommendationNotification', () => {
    it('schedules a recommendation notification', async () => {
      const movieTitle = 'Test Movie';

      await NotificationService.scheduleRecommendationNotification(movieTitle);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'New Movie Recommendation',
          body: `Check out "${movieTitle}" - it might be perfect for your current mood!`,
          data: { type: 'recommendation' },
        },
        trigger: null,
      });
    });
  });

  describe('scheduleMoodSuggestionNotification', () => {
    it('schedules a mood suggestion notification', async () => {
      const mood = 'excited';

      await NotificationService.scheduleMoodSuggestionNotification(mood);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Mood-Based Suggestion',
          body: `We've found some great movies for when you're feeling ${mood}!`,
          data: { type: 'mood_suggestion' },
        },
        trigger: null,
      });
    });
  });

  describe('scheduleWatchReminder', () => {
    it('schedules a watch reminder notification', async () => {
      const movieTitle = 'Test Movie';

      await NotificationService.scheduleWatchReminder(movieTitle);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Watch Reminder',
          body: `Don't forget to watch "${movieTitle}"!`,
          data: { type: 'watch_reminder' },
        },
        trigger: {
          type: 'timeInterval',
          seconds: 24 * 60 * 60,
        },
      });
    });
  });

  describe('getPreferences', () => {
    it('returns default preferences when no data exists', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const preferences = await NotificationService.getPreferences('user123');

      expect(preferences).toEqual({
        recommendations: true,
        moodSuggestions: true,
        watchReminders: true,
      });
    });

    it('returns stored preferences when they exist', async () => {
      const mockPreferences = {
        recommendations: false,
        moodSuggestions: true,
        watchReminders: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPreferences, error: null }),
          }),
        }),
      });

      const preferences = await NotificationService.getPreferences('user123');

      expect(preferences).toEqual(mockPreferences);
    });
  });

  describe('updatePreferences', () => {
    it('updates notification preferences', async () => {
      const userId = 'user123';
      const newPreferences = {
        recommendations: false,
        moodSuggestions: true,
      };

      await NotificationService.updatePreferences(userId, newPreferences);

      expect(supabase.from).toHaveBeenCalledWith('notification_preferences');
      expect(supabase.from('notification_preferences').upsert).toHaveBeenCalledWith({
        user_id: userId,
        ...newPreferences,
        updated_at: expect.any(String),
      });
    });
  });

  describe('cancelAllNotifications', () => {
    it('cancels all scheduled notifications', async () => {
      await NotificationService.cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });
}); 
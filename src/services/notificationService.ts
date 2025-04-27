import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Movie } from '../types/movie';
import { supabase } from '../lib/supabase';

const TRIGGER_TYPES = {
  TIME_INTERVAL: 'timeInterval' as const,
  DATE: 'date' as const,
};

export interface NotificationPreferences {
  recommendations: boolean;
  moodSuggestions: boolean;
  watchReminders: boolean;
}

export class NotificationService {
  private static readonly CHANNEL_ID = 'moodflix-notifications';
  private static readonly CHANNEL_NAME = 'MoodFlix Notifications';
  private static instance: NotificationService;
  private preferences: NotificationPreferences = {
    recommendations: true,
    moodSuggestions: true,
    watchReminders: true,
  };

  private constructor() {
    this.setupNotificationHandler();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async setupNotificationHandler(): Promise<void> {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  public async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  public async scheduleWatchReminder(movie: { title: string }, days: number): Promise<void> {
    const trigger: Notifications.NotificationTriggerInput = {
      type: 'timeInterval',
      seconds: days * 24 * 60 * 60,
      repeats: false,
    } as Notifications.TimeIntervalTriggerInput;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Watch Reminder',
        body: `Don't forget to watch ${movie.title}!`,
      },
      trigger,
    });
  }

  public async scheduleMoodSuggestion(movie: { title: string }): Promise<void> {
    const trigger: Notifications.NotificationTriggerInput = {
      type: 'timeInterval',
      seconds: 24 * 60 * 60,
      repeats: true,
    } as Notifications.TimeIntervalTriggerInput;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Mood Suggestion',
        body: `Based on your mood, we recommend watching ${movie.title}!`,
      },
      trigger,
    });
  }

  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  public getPreferences() {
    return this.preferences;
  }

  public async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
  }

  static async initialize(): Promise<void> {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(this.CHANNEL_ID, {
        name: this.CHANNEL_NAME,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const token = await this.getPushToken();
    if (token) {
      await this.savePushToken(token);
    }
  }

  static async getPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_notifications')
        .upsert({
          user_id: user.id,
          push_token: token,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  static async scheduleRecommendationNotification(movieTitle: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Movie Recommendation',
        body: `Check out "${movieTitle}" - it might be perfect for your current mood!`,
        data: { type: 'recommendation' },
      },
      trigger: null, // Send immediately
    });
  }

  static async scheduleMoodBasedSuggestion(movie: Movie, mood: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Mood Match!',
        body: `We found a ${mood} movie for you: "${movie.title}"`,
        data: { movieId: movie.id },
      },
      trigger: null, // Immediate notification
    });
  }

  public async scheduleMovieRecommendation(movie: { title: string; overview: string; id: number }, date: Date): Promise<void> {
    const trigger: Notifications.NotificationTriggerInput = {
      type: 'date',
      date,
    } as Notifications.DateTriggerInput;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Movie Recommendation',
        body: `Check out "${movie.title}" - ${movie.overview.substring(0, 100)}...`,
        data: { movieId: movie.id },
      },
      trigger,
    });
  }

  static async getNotificationSettings() {
    return await Notifications.getPermissionsAsync();
  }

  static async updateNotificationSettings(settings: Notifications.NotificationPermissionsStatus) {
    // Implement settings update logic here
    // This might involve updating user preferences in your backend
  }
}

export const notificationService = NotificationService.getInstance(); 
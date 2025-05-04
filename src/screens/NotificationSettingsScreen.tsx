import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { List, Switch, useTheme, Text, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

interface NotificationSettings {
  pushEnabled: boolean;
  friendRequests: boolean;
  watchPartyInvites: boolean;
  movieRecommendations: boolean;
  newContent: boolean;
  activityUpdates: boolean;
}

const NOTIFICATION_SETTINGS_KEY = "@notification_settings";

export const NotificationSettingsScreen = () => {
  const theme = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    friendRequests: true,
    watchPartyInvites: true,
    movieRecommendations: true,
    newContent: true,
    activityUpdates: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(
        NOTIFICATION_SETTINGS_KEY,
      );
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  const updateSetting = async (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    try {
      const newSettings = {
        ...settings,
        [key]: value,
        // If push notifications are disabled, disable all other notifications
        ...(key === "pushEnabled" &&
          !value && {
            friendRequests: false,
            watchPartyInvites: false,
            movieRecommendations: false,
            newContent: false,
            activityUpdates: false,
          }),
      };

      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newSettings),
      );
      setSettings(newSettings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <List.Section>
        <List.Subheader>General</List.Subheader>
        <List.Item
          title="Push notifications"
          description="Enable or disable all notifications"
          right={() => (
            <Switch
              value={settings.pushEnabled}
              onValueChange={(value) => updateSetting("pushEnabled", value)}
            />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Social</List.Subheader>
        <List.Item
          title="Friend requests"
          right={() => (
            <Switch
              value={settings.friendRequests && settings.pushEnabled}
              onValueChange={(value) => updateSetting("friendRequests", value)}
              disabled={!settings.pushEnabled}
            />
          )}
        />
        <List.Item
          title="Watch party invites"
          right={() => (
            <Switch
              value={settings.watchPartyInvites && settings.pushEnabled}
              onValueChange={(value) =>
                updateSetting("watchPartyInvites", value)
              }
              disabled={!settings.pushEnabled}
            />
          )}
        />
        <List.Item
          title="Activity updates"
          description="Get notified about friend activities"
          right={() => (
            <Switch
              value={settings.activityUpdates && settings.pushEnabled}
              onValueChange={(value) => updateSetting("activityUpdates", value)}
              disabled={!settings.pushEnabled}
            />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Content</List.Subheader>
        <List.Item
          title="Movie recommendations"
          description="Get personalized movie suggestions"
          right={() => (
            <Switch
              value={settings.movieRecommendations && settings.pushEnabled}
              onValueChange={(value) =>
                updateSetting("movieRecommendations", value)
              }
              disabled={!settings.pushEnabled}
            />
          )}
        />
        <List.Item
          title="New content"
          description="Get notified when new movies are added"
          right={() => (
            <Switch
              value={settings.newContent && settings.pushEnabled}
              onValueChange={(value) => updateSetting("newContent", value)}
              disabled={!settings.pushEnabled}
            />
          )}
        />
      </List.Section>

      {!settings.pushEnabled && (
        <View style={styles.warningContainer}>
          <Text
            variant="bodySmall"
            style={[styles.warningText, { color: theme.colors.error }]}
          >
            Push notifications are currently disabled. Enable them to receive
            updates.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningContainer: {
    padding: 16,
  },
  warningText: {
    textAlign: "center",
  },
});

export default NotificationSettingsScreen;

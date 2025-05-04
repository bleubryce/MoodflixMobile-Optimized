import { useTheme } from "@contexts/ThemeContext";
import { createStackNavigator } from "@react-navigation/stack";
import { DownloadQualityScreen } from "@screens/DownloadQualityScreen";
import { NotificationSettingsScreen } from "@screens/NotificationSettingsScreen";
import { SettingsScreen } from "@screens/SettingsScreen";
import { StorageUsageScreen } from "@screens/StorageUsageScreen";
import React from "react";

export type SettingsStackParamList = {
  Settings: undefined;
  DownloadQuality: undefined;
  StorageUsage: undefined;
  NotificationSettings: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  OpenSourceLicenses: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

export const SettingsNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          color: theme.colors.text,
        },
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="DownloadQuality"
        component={DownloadQualityScreen}
        options={{
          title: "Download Quality",
        }}
      />
      <Stack.Screen
        name="StorageUsage"
        component={StorageUsageScreen}
        options={{
          title: "Storage Usage",
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: "Notifications",
        }}
      />
    </Stack.Navigator>
  );
};

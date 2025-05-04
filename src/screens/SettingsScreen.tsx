import { useTheme } from "@contexts/ThemeContext";
import { useOfflineMode, DownloadQuality } from "@hooks/useOfflineMode";
import { SettingsStackParamList } from "@navigation/SettingsNavigator";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  List,
  Switch,
  useTheme as usePaperTheme,
  Text,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type SettingsScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  "Settings"
>;

export const SettingsScreen = () => {
  const { themeMode, setThemeMode, isDark } = useTheme();
  const paperTheme = usePaperTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [
    { isEnabled: isOfflineEnabled, autoDownload, downloadQuality },
    { toggleOfflineMode, toggleAutoDownload, setDownloadQuality },
  ] = useOfflineMode();

  const handleThemeModeChange = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: paperTheme.colors.background },
      ]}
    >
      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Use system theme"
            right={() => (
              <Switch
                value={themeMode === "system"}
                onValueChange={(value) =>
                  handleThemeModeChange(
                    value ? "system" : isDark ? "dark" : "light",
                  )
                }
              />
            )}
          />
          {themeMode !== "system" && (
            <List.Item
              title="Dark mode"
              right={() => (
                <Switch
                  value={isDark}
                  onValueChange={(value) =>
                    handleThemeModeChange(value ? "dark" : "light")
                  }
                />
              )}
            />
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Offline Mode</List.Subheader>
          <List.Item
            title="Enable offline mode"
            description="Download movies for offline viewing"
            right={() => (
              <Switch
                value={isOfflineEnabled}
                onValueChange={toggleOfflineMode}
              />
            )}
          />
          {isOfflineEnabled && (
            <>
              <List.Item
                title="Auto-download on Wi-Fi"
                description="Automatically download saved movies when on Wi-Fi"
                right={() => (
                  <Switch
                    value={autoDownload}
                    onValueChange={toggleAutoDownload}
                  />
                )}
              />
              <List.Item
                title="Download quality"
                description={`Current quality: ${downloadQuality}`}
                onPress={() => navigation.navigate("DownloadQuality")}
              />
              <List.Item
                title="Storage usage"
                description="Manage downloaded content"
                onPress={() => navigation.navigate("StorageUsage")}
              />
            </>
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Notifications</List.Subheader>
          <List.Item
            title="Notification settings"
            description="Manage your notification preferences"
            onPress={() => navigation.navigate("NotificationSettings")}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item title="Version" description="1.0.0" />
          <List.Item
            title="Terms of Service"
            onPress={() => navigation.navigate("TermsOfService")}
          />
          <List.Item
            title="Privacy Policy"
            onPress={() => navigation.navigate("PrivacyPolicy")}
          />
          <List.Item
            title="Open Source Licenses"
            onPress={() => navigation.navigate("OpenSourceLicenses")}
          />
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen;

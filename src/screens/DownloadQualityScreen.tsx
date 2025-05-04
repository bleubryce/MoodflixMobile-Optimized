import { useOfflineMode, DownloadQuality } from "@hooks/useOfflineMode";
import React from "react";
import { View, StyleSheet } from "react-native";
import { List, RadioButton, useTheme, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const qualityOptions: {
  label: string;
  value: DownloadQuality;
  description: string;
}[] = [
  {
    label: "Low",
    value: "low",
    description: "Uses less storage, suitable for slower connections",
  },
  {
    label: "Medium",
    value: "medium",
    description: "Balanced quality and storage usage",
  },
  {
    label: "High",
    value: "high",
    description: "Best quality, requires more storage space",
  },
];

export const DownloadQualityScreen = () => {
  const theme = useTheme();
  const [{ downloadQuality }, { setDownloadQuality }] = useOfflineMode();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <List.Section>
        <List.Subheader>Select Download Quality</List.Subheader>
        {qualityOptions.map((option) => (
          <List.Item
            key={option.value}
            title={option.label}
            description={option.description}
            onPress={() => setDownloadQuality(option.value)}
            left={(props) => (
              <RadioButton
                {...props}
                value={option.value}
                status={
                  downloadQuality === option.value ? "checked" : "unchecked"
                }
                onPress={() => setDownloadQuality(option.value)}
              />
            )}
          />
        ))}
      </List.Section>

      <View style={styles.infoContainer}>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Higher quality downloads will use more storage space and may take
          longer to download. Make sure you have enough storage space available
          on your device.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
  },
});

export default DownloadQualityScreen;

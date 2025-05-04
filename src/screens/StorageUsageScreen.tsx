import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatBytes } from "@utils/formatters";
import * as FileSystem from "expo-file-system";
import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { List, useTheme, Text, Button, ProgressBar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

interface StorageInfo {
  totalSpace: number;
  usedSpace: number;
  downloadedMovies: {
    id: number;
    title: string;
    size: number;
    lastAccessed: string;
  }[];
}

export const StorageUsageScreen = () => {
  const theme = useTheme();
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalSpace: 0,
    usedSpace: 0,
    downloadedMovies: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      setIsLoading(true);

      // Get available device storage
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();
      const usedSpace = totalSpace - freeSpace;

      // Get downloaded movies info
      const downloadedMoviesStr =
        await AsyncStorage.getItem("@downloaded_movies");
      const downloadedMovies = downloadedMoviesStr
        ? JSON.parse(downloadedMoviesStr)
        : [];

      setStorageInfo({
        totalSpace,
        usedSpace,
        downloadedMovies,
      });
    } catch (error) {
      console.error("Error loading storage info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId: number) => {
    try {
      // Delete movie file
      const moviePath = `${FileSystem.documentDirectory}movies/${movieId}`;
      await FileSystem.deleteAsync(moviePath);

      // Update downloaded movies list
      const updatedMovies = storageInfo.downloadedMovies.filter(
        (movie) => movie.id !== movieId,
      );
      await AsyncStorage.setItem(
        "@downloaded_movies",
        JSON.stringify(updatedMovies),
      );

      // Refresh storage info
      await loadStorageInfo();
    } catch (error) {
      console.error("Error deleting movie:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      // Delete all movie files
      await FileSystem.deleteAsync(`${FileSystem.documentDirectory}movies`);

      // Clear downloaded movies list
      await AsyncStorage.setItem("@downloaded_movies", JSON.stringify([]));

      // Refresh storage info
      await loadStorageInfo();
    } catch (error) {
      console.error("Error clearing all downloads:", error);
    }
  };

  const usagePercentage =
    (storageInfo.usedSpace / storageInfo.totalSpace) * 100;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.storageInfo}>
        <Text variant="titleMedium">Storage Usage</Text>
        <ProgressBar
          progress={usagePercentage / 100}
          color={theme.colors.primary}
          style={styles.progressBar}
        />
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {formatBytes(storageInfo.usedSpace)} used of{" "}
          {formatBytes(storageInfo.totalSpace)}
        </Text>
      </View>

      <List.Section>
        <List.Subheader>Downloaded Movies</List.Subheader>
        {storageInfo.downloadedMovies.map((movie) => (
          <List.Item
            key={movie.id}
            title={movie.title}
            description={`${formatBytes(movie.size)} • Last watched ${new Date(movie.lastAccessed).toLocaleDateString()}`}
            right={(props) => (
              <Button
                {...props}
                mode="text"
                onPress={() => handleDeleteMovie(movie.id)}
              >
                Delete
              </Button>
            )}
          />
        ))}
        {storageInfo.downloadedMovies.length === 0 && (
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            No downloaded movies
          </Text>
        )}
      </List.Section>

      {storageInfo.downloadedMovies.length > 0 && (
        <View style={styles.clearAllContainer}>
          <Button
            mode="outlined"
            onPress={handleClearAll}
            style={{ borderColor: theme.colors.error }}
            textColor={theme.colors.error}
          >
            Clear All Downloads
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  storageInfo: {
    padding: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  emptyText: {
    textAlign: "center",
    padding: 16,
  },
  clearAllContainer: {
    padding: 16,
  },
});

export default StorageUsageScreen;

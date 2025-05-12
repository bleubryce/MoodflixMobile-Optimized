import { useOffline } from "@hooks/useOffline";
import { MoodService, Mood } from "@services/moodService";
import { TMDBMovie } from "@types/tmdb";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";

import { MovieCard } from "../MovieCard";

interface MoodRecommendationsProps {
  mood: Mood;
  onMoviePress?: (movie: TMDBMovie) => void;
  recommendationsWithReasons?: { movie: TMDBMovie; reason: string }[];
}

export const MoodRecommendations: React.FC<MoodRecommendationsProps> = ({
  mood,
  onMoviePress,
  recommendationsWithReasons,
}) => {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useOffline();
  const theme = useTheme();

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const recommendations = await MoodService.getRecommendations(mood);
        setMovies(recommendations);
      } catch (err) {
        setError("Failed to load recommendations");
        console.error("Error loading recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [mood]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          testID="loading-indicator"
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {!isConnected && (
          <Text style={styles.offlineText}>
            You are offline. Please check your internet connection.
          </Text>
        )}
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>No recommendations found for your current mood.</Text>
      </View>
    );
  }

  if (recommendationsWithReasons) {
    return (
      <FlatList
        data={recommendationsWithReasons}
        keyExtractor={(item) => item.movie.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{item.reason}</Text>
            <MovieCard
              testID={`movie-card-${item.movie.id}`}
              movie={item.movie}
              onPress={() => onMoviePress?.(item.movie)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={movies}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <MovieCard
          testID={`movie-card-${item.id}`}
          movie={item}
          onPress={() => onMoviePress?.(item)}
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 8,
  },
  offlineText: {
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});

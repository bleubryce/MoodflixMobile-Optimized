import { useAuth } from "@contexts/AuthContext";
import { getMovieDetails } from "@services/movieService";
import { TMDBMovieDetails } from "@types/tmdb";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Image } from "react-native";
import {
  Text,
  Button,
  Chip,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";

type Mood = "Happy" | "Sad" | "Excited" | "Relaxed" | "Romantic";

const moods: Mood[] = ["Happy", "Sad", "Excited", "Relaxed", "Romantic"];

export default function MovieDetailScreen({ route, navigation }: any) {
  const { movieId } = route.params;
  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<Mood | "">("");
  const { user } = useAuth();
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const fetchMovieDetails = async () => {
    try {
      const response = await getMovieDetails(movieId);
      if (response.data) {
        setMovie(response.data);
      } else {
        setError("Movie not found");
      }
    } catch (err) {
      setError("Failed to fetch movie details");
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    // Here you would typically save the mood selection to your backend
  };

  if (loading || !movie) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`,
        }}
        style={styles.backdrop}
      />

      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          {movie.title}
        </Text>

        <View style={styles.ratingContainer}>
          <Text variant="bodyLarge" style={styles.rating}>
            Rating: {movie.vote_average}/10
          </Text>
          <Text variant="bodyLarge" style={styles.releaseDate}>
            Release: {movie.release_date}
          </Text>
        </View>

        <View style={styles.genresContainer}>
          {movie.genres.map((genre) => (
            <Chip key={genre.id} style={styles.genreChip}>
              {genre.name}
            </Chip>
          ))}
        </View>

        <Text variant="bodyLarge" style={styles.overview}>
          {movie.overview}
        </Text>

        <Text variant="titleMedium" style={styles.moodTitle}>
          How does this movie make you feel?
        </Text>

        <View style={styles.moodsContainer}>
          {moods.map((mood) => (
            <Chip
              key={mood}
              selected={selectedMood === mood}
              onPress={() => handleMoodSelect(mood)}
              style={styles.moodChip}
            >
              {mood}
            </Chip>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={() => {
            // Save mood selection and navigate back
            navigation.goBack();
          }}
          style={styles.button}
          disabled={!selectedMood}
        >
          Save Mood
        </Button>
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  backdrop: {
    height: 200,
    width: "100%",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  genreChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  overview: {
    fontSize: 16,
    marginBottom: 16,
  },
  rating: {
    fontSize: 18,
    marginBottom: 8,
  },
  releaseDate: {
    fontSize: 16,
    marginBottom: 16,
  },
  moodTitle: {
    marginBottom: 16,
  },
  moodsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  moodChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { Text, Button, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { TMDBMovieDetails } from '../types/tmdb';
import { movieService } from '../services/movieService';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genres: { id: number; name: string }[];
}

const moods = ['Happy', 'Sad', 'Excited', 'Relaxed', 'Romantic'];

export const MovieDetailScreen = ({ route, navigation }: any) => {
  const { movieId } = route.params;
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const fetchMovieDetails = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=YOUR_API_KEY`
      );
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (mood: string) => {
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
        source={{ uri: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}` }}
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
        >
          Save Mood
        </Button>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  backdrop: {
    height: 200,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
}); 
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { TMDBMovie } from '../../types/tmdb';

interface MovieCardProps {
  movie: TMDBMovie;
  onPress?: (movie: TMDBMovie) => void;
  testID?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onPress, testID }) => {
  const theme = useTheme();
  const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => onPress?.(movie)}
      testID={testID}
    >
      <View style={styles.container}>
        <Image
          testID="movie-poster"
          source={{
            uri: movie.poster_path
              ? `${imageBaseUrl}${movie.poster_path}`
              : 'https://via.placeholder.com/500x750',
          }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.content}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
            {movie.title}
          </Text>
          <Text variant="bodySmall" style={styles.year}>
            {new Date(movie.release_date).getFullYear()}
          </Text>
          <Text
            testID="movie-overview"
            variant="bodyMedium"
            numberOfLines={3}
            style={styles.overview}
          >
            {movie.overview}
          </Text>
          <View style={styles.rating}>
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              ★ {movie.vote_average.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 4,
    marginVertical: 8,
  },
  container: {
    flexDirection: 'row',
    padding: 8,
  },
  poster: {
    height: 200,
    width: '100%',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  year: {
    marginBottom: 8,
    opacity: 0.7,
  },
  overview: {
    fontSize: 14,
    marginTop: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 
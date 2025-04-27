import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, ActivityIndicator } from 'react-native-paper';
import { TMDBMovie } from '../types/tmdb';
import { movieService } from '../services/movieService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setLoading(true);
      try {
        const results = await movieService.searchMovies(query);
        setMovies(results);
      } catch (error) {
        console.error('Error searching movies:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setMovies([]);
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search movies..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );
}; 
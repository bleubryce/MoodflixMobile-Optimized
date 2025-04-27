import { ApiResponse } from '../types';
import { TMDBMovie, TMDBMovieDetails } from '../types/tmdb';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, TMDB_API_KEY } from '../config/env';
import { offlineService } from './offlineService';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchPopularMovies = async (): Promise<ApiResponse<TMDBMovie[]>> => {
  try {
    const isConnected = await offlineService.isConnected();
    
    if (!isConnected) {
      const cachedMovies = await offlineService.getCachedMovies();
      return { data: cachedMovies, error: null };
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    
    // Cache the results
    await offlineService.cacheMovies(data.results);
    
    return { data: data.results, error: null };
  } catch (error) {
    // Try to get cached data on error
    const cachedMovies = await offlineService.getCachedMovies();
    return { data: cachedMovies, error: 'Failed to fetch popular movies' };
  }
};

export const searchMovies = async (query: string): Promise<ApiResponse<TMDBMovie[]>> => {
  try {
    const isConnected = await offlineService.isConnected();
    
    if (!isConnected) {
      const cachedMovies = await offlineService.getCachedMovies();
      const filteredMovies = cachedMovies.filter(movie =>
        movie.title.toLowerCase().includes(query.toLowerCase())
      );
      return { data: filteredMovies, error: null };
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}`
    );
    const data = await response.json();
    
    // Cache the results
    await offlineService.cacheMovies(data.results);
    
    return { data: data.results, error: null };
  } catch (error) {
    // Try to get cached data on error
    const cachedMovies = await offlineService.getCachedMovies();
    const filteredMovies = cachedMovies.filter(movie =>
      movie.title.toLowerCase().includes(query.toLowerCase())
    );
    return { data: filteredMovies, error: 'Failed to search movies' };
  }
};

export const getMovieDetails = async (movieId: number): Promise<ApiResponse<TMDBMovieDetails | null>> => {
  try {
    const isConnected = await offlineService.isConnected();
    
    if (!isConnected) {
      const cachedMovies = await offlineService.getCachedMovies();
      const movie = cachedMovies.find(m => m.id === movieId);
      if (!movie) return { data: null, error: null };
      
      // Convert TMDBMovie to TMDBMovieDetails
      return {
        data: {
          ...movie,
          genres: movie.genre_ids.map(id => ({ id, name: 'Unknown' })),
          runtime: 0,
          tagline: '',
          status: 'Unknown',
        },
        error: null,
      };
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    
    // Cache the result
    await offlineService.cacheMovies([data]);
    
    return { data, error: null };
  } catch (error) {
    // Try to get cached data on error
    const cachedMovies = await offlineService.getCachedMovies();
    const movie = cachedMovies.find(m => m.id === movieId);
    if (!movie) return { data: null, error: 'Failed to fetch movie details' };
    
    // Convert TMDBMovie to TMDBMovieDetails
    return {
      data: {
        ...movie,
        genres: movie.genre_ids.map(id => ({ id, name: 'Unknown' })),
        runtime: 0,
        tagline: '',
        status: 'Unknown',
      },
      error: 'Failed to fetch movie details',
    };
  }
};

export const saveMovieMood = async (
  movieId: number,
  userId: string,
  mood: string
): Promise<ApiResponse<null>> => {
  try {
    const { error } = await supabase.from('watch_history').insert({
      movie_id: movieId,
      user_id: userId,
      mood,
      watched_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    console.error('Error saving movie mood:', error);
    return { data: null, error: 'Failed to save movie mood' };
  }
};

export const getWatchHistory = async (userId: string): Promise<ApiResponse<{ movie_id: number; mood: string }[]>> => {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select('movie_id, mood')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting watch history:', error);
    return { data: [], error: 'Failed to get watch history' };
  }
};

export const toggleFavorite = async (
  movieId: number,
  userId: string
): Promise<ApiResponse<null>> => {
  try {
    const { data: existingFavorite } = await supabase
      .from('favorites')
      .select()
      .eq('movie_id', movieId)
      .eq('user_id', userId)
      .single();

    if (existingFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('movie_id', movieId)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('favorites').insert({
        movie_id: movieId,
        user_id: userId,
        added_at: new Date().toISOString(),
      });

      if (error) throw error;
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { data: null, error: 'Failed to toggle favorite' };
  }
};

export const getFavorites = async (userId: string): Promise<ApiResponse<{ movie_id: number }[]>> => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('movie_id')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting favorites:', error);
    return { data: [], error: 'Failed to get favorites' };
  }
}; 
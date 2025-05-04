import { SUPABASE_URL, SUPABASE_ANON_KEY, TMDB_API_KEY } from "@config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createClient } from "@supabase/supabase-js";
import { TMDBMovie, TMDBMovieDetails } from "../types/tmdb";
import { NetworkError, ApiError, CacheError, DatabaseError } from "../types/errors";
import { ErrorHandler } from "../utils/errorHandler";
import { ApiResponse } from "../types";

import { offlineService } from "./offlineService";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const errorHandler = ErrorHandler.getInstance();

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const MOVIES_CACHE_KEY = "@movies_cache";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  genres?: Genre[];
}

export interface Genre {
  id: number;
  name: string;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface RealtimePayload {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: { id: string } & Record<string, unknown>;
  old: { id: string } & Record<string, unknown>;
}

interface MovieServiceType {
  subscription: any;
  fetchWithCache<T>(endpoint: string, cacheKey: string, forceRefresh?: boolean): Promise<T>;
  getPopularMovies(page?: number): Promise<{ results: Movie[]; total_pages: number }>;
  searchMovies(query: string, page?: number): Promise<{ results: Movie[]; total_pages: number }>;
  getMovieDetails(movieId: number): Promise<Movie>;
  getMovieRecommendations(movieId: number): Promise<{ results: Movie[] }>;
  getGenres(): Promise<{ genres: Genre[] }>;
  getMoodBasedMovies(mood: string, page?: number): Promise<{ results: Movie[]; total_pages: number }>;
  clearCache(): Promise<void>;
  invalidateCache(key: string): Promise<void>;
  setupRealtimeSubscription(): void;
  cleanup(): void;
}

export const movieService: MovieServiceType = {
  subscription: null,

  async fetchWithCache<T>(endpoint: string, cacheKey: string, forceRefresh = false): Promise<T> {
    try {
      // Check network connectivity first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected && !forceRefresh) {
        try {
          const cached = await AsyncStorage.getItem(`${MOVIES_CACHE_KEY}_${cacheKey}`);
          if (cached) {
            const { data, timestamp }: CacheItem<T> = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRY) {
              return data;
            }
          }
          throw new NetworkError("No network connection and no valid cache available");
        } catch (error) {
          if (error instanceof NetworkError) {
            throw error;
          }
          throw new CacheError(
            "Failed to read from cache",
            `${MOVIES_CACHE_KEY}_${cacheKey}`,
            "read"
          );
        }
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new ApiError(
          "Failed to fetch data from TMDB API",
          response.status,
          endpoint,
          "GET",
          response.statusText
        );
      }

      const data = await response.json();

      // Cache the response
      try {
        await AsyncStorage.setItem(
          `${MOVIES_CACHE_KEY}_${cacheKey}`,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (cacheError) {
        await errorHandler.handleError(
          new CacheError(
            "Failed to cache movie data",
            `${MOVIES_CACHE_KEY}_${cacheKey}`,
            "write"
          ),
          {
            componentName: "MovieService",
            action: "fetchWithCache_cache",
            severity: "warning"
          }
        );
      }

      return data;
    } catch (error) {
      await errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to fetch or cache data"),
        {
          componentName: "MovieService",
          action: "fetchWithCache",
          additionalInfo: { endpoint, cacheKey }
        }
      );
      throw error;
    }
  },

  async getPopularMovies(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    try {
      const endpoint = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
      return await this.fetchWithCache<{ results: Movie[]; total_pages: number }>(endpoint, `popular_${page}`);
    } catch (error) {
      throw new ApiError(
        'Failed to fetch popular movies',
        500,
        '/movie/popular',
        'GET',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },

  async searchMovies(query: string, page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    try {
      const endpoint = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`;
      return await this.fetchWithCache<{ results: Movie[]; total_pages: number }>(endpoint, `search_${query}_${page}`);
    } catch (error) {
      throw new ApiError(
        'Failed to search movies',
        500,
        '/search/movie',
        'GET',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },

  async getMovieDetails(movieId: number): Promise<Movie> {
    try {
      const endpoint = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`;
      return await this.fetchWithCache<Movie>(endpoint, `movie_${movieId}`);
    } catch (error) {
      throw new ApiError(
        'Failed to fetch movie details',
        500,
        `/movie/${movieId}`,
        'GET',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },

  async getMovieRecommendations(movieId: number): Promise<{ results: Movie[] }> {
    try {
      const endpoint = `${TMDB_BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
      return await this.fetchWithCache<{ results: Movie[] }>(endpoint, `recommendations_${movieId}`);
    } catch (error) {
      throw new ApiError(
        'Failed to fetch movie recommendations',
        500,
        `/movie/${movieId}/recommendations`,
        'GET',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },

  async getGenres(): Promise<{ genres: Genre[] }> {
    try {
      const endpoint = `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`;
      return await this.fetchWithCache<{ genres: Genre[] }>(endpoint, 'genres');
    } catch (error) {
      throw new ApiError(
        'Failed to fetch genres',
        500,
        '/genre/movie/list',
        'GET',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },

  async getMoodBasedMovies(mood: string, page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    try {
      const endpoint = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${encodeURIComponent(mood)}&page=${page}`;
      return await this.fetchWithCache<{ results: Movie[]; total_pages: number }>(endpoint, `mood_${mood}_${page}`);
    } catch (error) {
      throw new ApiError(
        'Failed to fetch mood-based movies',
        500,
        '/discover/movie',
        'GET',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const movieKeys = keys.filter(key => key.startsWith(MOVIES_CACHE_KEY));
      await AsyncStorage.multiRemove(movieKeys);
    } catch (error) {
      throw new CacheError(
        'Failed to clear cache',
        MOVIES_CACHE_KEY,
        'delete'
      );
    }
  },

  async invalidateCache(key: string): Promise<void> {
    const cacheKey = `${MOVIES_CACHE_KEY}_${key}`;
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      throw new CacheError(
        'Failed to invalidate cache',
        cacheKey,
        'delete'
      );
    }
  },

  setupRealtimeSubscription(): void {
    if (this.subscription) return;

    this.subscription = supabase
      .channel('movie_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'movies',
        },
        async (payload) => {
          try {
            await this.invalidateCache('movies');
          } catch (error) {
            if (error instanceof Error) {
              await errorHandler.handleError(error, {
                componentName: 'movieService',
                action: 'handleRealtimeUpdate',
                additionalInfo: { payload },
              });
            }
          }
        }
      )
      .subscribe();
  },

  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  },
};

export const fetchPopularMovies = async (): Promise<ApiResponse<TMDBMovie[]>> => {
  try {
    const isConnected = await offlineService.isConnected();

    if (!isConnected) {
      const cachedMovies = await offlineService.getCachedMovies();
      return { data: cachedMovies, error: null };
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`,
    );
    const data = await response.json();

    // Cache the results
    await offlineService.cacheMovies(data.results);

    return { data: data.results, error: null };
  } catch (error) {
    // Try to get cached data on error
    const cachedMovies = await offlineService.getCachedMovies();
    return { data: cachedMovies, error: "Failed to fetch popular movies" };
  }
};

export const searchMovies = async (
  query: string,
): Promise<ApiResponse<TMDBMovie[]>> => {
  try {
    const isConnected = await offlineService.isConnected();

    if (!isConnected) {
      const cachedMovies = await offlineService.getCachedMovies();
      const filteredMovies = cachedMovies.filter((movie: TMDBMovie) =>
        movie.title.toLowerCase().includes(query.toLowerCase()),
      );
      return { data: filteredMovies, error: null };
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query,
      )}`,
    );
    const data = await response.json();

    // Cache the results
    await offlineService.cacheMovies(data.results);

    return { data: data.results, error: null };
  } catch (error) {
    // Try to get cached data on error
    const cachedMovies = await offlineService.getCachedMovies();
    const filteredMovies = cachedMovies.filter((movie: TMDBMovie) =>
      movie.title.toLowerCase().includes(query.toLowerCase()),
    );
    return { data: filteredMovies, error: "Failed to search movies" };
  }
};

export const getMovieDetails = async (
  movieId: number,
): Promise<ApiResponse<TMDBMovieDetails | null>> => {
  try {
    const isConnected = await offlineService.isConnected();

    if (!isConnected) {
      const cachedMovies = await offlineService.getCachedMovies();
      const movie = cachedMovies.find((m: TMDBMovie) => m.id === movieId);
      if (!movie) return { data: null, error: null };

      // Convert TMDBMovie to TMDBMovieDetails
      return {
        data: {
          ...movie,
          genres: movie.genre_ids.map((id: number) => ({ id, name: "Unknown" })),
          runtime: 0,
          tagline: "",
          status: "Unknown",
        },
        error: null,
      };
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`,
    );
    const data = await response.json();

    // Cache the result
    await offlineService.cacheMovies([data]);

    return { data, error: null };
  } catch (error) {
    // Try to get cached data on error
    const cachedMovies = await offlineService.getCachedMovies();
    const movie = cachedMovies.find((m: TMDBMovie) => m.id === movieId);
    if (!movie) return { data: null, error: "Failed to fetch movie details" };

    // Convert TMDBMovie to TMDBMovieDetails
    return {
      data: {
        ...movie,
        genres: movie.genre_ids.map((id: number) => ({ id, name: "Unknown" })),
        runtime: 0,
        tagline: "",
        status: "Unknown",
      },
      error: "Failed to fetch movie details",
    };
  }
};

export const saveMovieMood = async (
  movieId: number,
  userId: string,
  mood: string,
): Promise<ApiResponse<null>> => {
  try {
    const { error } = await supabase.from("watch_history").insert({
      movie_id: movieId,
      user_id: userId,
      mood,
      watched_at: new Date().toISOString(),
    });

    if (error) {
      throw new DatabaseError(
        "Failed to save movie mood",
        "create",
        "watch_history",
        error
      );
    }
    return { data: null, error: null };
  } catch (error) {
    await errorHandler.handleError(
      error instanceof Error ? error : new Error("Failed to save movie mood"),
      {
        componentName: "MovieService",
        action: "saveMovieMood",
        additionalInfo: { movieId, userId, mood }
      }
    );
    return { data: null, error: "Failed to save movie mood" };
  }
};

export const getWatchHistory = async (
  userId: string,
): Promise<ApiResponse<{ movie_id: number; mood: string }[]>> => {
  try {
    const { data, error } = await supabase
      .from("watch_history")
      .select("movie_id, mood")
      .eq("user_id", userId)
      .order("watched_at", { ascending: false });

    if (error) {
      throw new DatabaseError(
        "Failed to get watch history",
        "read",
        "watch_history",
        error
      );
    }
    return { data: data || [], error: null };
  } catch (error) {
    await errorHandler.handleError(
      error instanceof Error ? error : new Error("Failed to get watch history"),
      {
        componentName: "MovieService",
        action: "getWatchHistory",
        additionalInfo: { userId }
      }
    );
    return { data: [], error: "Failed to get watch history" };
  }
};

export const toggleFavorite = async (
  movieId: number,
  userId: string,
): Promise<ApiResponse<null>> => {
  try {
    const { data: existingFavorite } = await supabase
      .from("favorites")
      .select()
      .eq("movie_id", movieId)
      .eq("user_id", userId)
      .single();

    if (existingFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("movie_id", movieId)
        .eq("user_id", userId);

      if (error) {
        throw new DatabaseError(
          "Failed to remove favorite",
          "delete",
          "favorites",
          error
        );
      }
    } else {
      const { error } = await supabase.from("favorites").insert({
        movie_id: movieId,
        user_id: userId,
        added_at: new Date().toISOString(),
      });

      if (error) {
        throw new DatabaseError(
          "Failed to add favorite",
          "create",
          "favorites",
          error
        );
      }
    }

    return { data: null, error: null };
  } catch (error) {
    await errorHandler.handleError(
      error instanceof Error ? error : new Error("Failed to toggle favorite"),
      {
        componentName: "MovieService",
        action: "toggleFavorite",
        additionalInfo: { movieId, userId }
      }
    );
    return { data: null, error: "Failed to toggle favorite" };
  }
};

export const getFavorites = async (
  userId: string,
): Promise<ApiResponse<{ movie_id: number }[]>> => {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("movie_id")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (error) {
      throw new DatabaseError(
        "Failed to get favorites",
        "read",
        "favorites",
        error
      );
    }
    return { data: data || [], error: null };
  } catch (error) {
    await errorHandler.handleError(
      error instanceof Error ? error : new Error("Failed to get favorites"),
      {
        componentName: "MovieService",
        action: "getFavorites",
        additionalInfo: { userId }
      }
    );
    return { data: [], error: "Failed to get favorites" };
  }
};

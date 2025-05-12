import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { CacheError, DatabaseError, ApiError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";
import { Movie, movieService } from './movieService';
import { Mood, MoodPreferences, MoodHistory } from '../types/mood';

const MOOD_CACHE_KEY = "@mood_cache";
const MOOD_HISTORY_KEY = "@mood_history";
const errorHandler = ErrorHandler.getInstance();

const moodPreferences: Record<Mood, MoodPreferences> = {
  happy: {
    genres: [35, 10751], // Comedy, Family
    keywords: ['happy', 'uplifting', 'feel-good'],
    minRating: 7.0,
  },
  sad: {
    genres: [18, 10749], // Drama, Romance
    keywords: ['emotional', 'heartfelt', 'dramatic'],
    minRating: 7.5,
  },
  excited: {
    genres: [28, 12, 878], // Action, Adventure, Sci-Fi
    keywords: ['thrilling', 'action-packed', 'adventure'],
    minRating: 7.0,
  },
  relaxed: {
    genres: [16, 14], // Animation, Fantasy
    keywords: ['calm', 'peaceful', 'serene'],
    minRating: 6.5,
  },
  thoughtful: {
    genres: [18, 9648], // Drama, Mystery
    keywords: ['thought-provoking', 'philosophical', 'deep'],
    minRating: 7.5,
  },
};

export const moodService = {
  async getRecommendations(mood: Mood): Promise<Movie[]> {
    try {
      const { results: movies } = await movieService.getMoodBasedMovies(mood);
      
      // Filter movies based on mood preferences
      const preferences = moodPreferences[mood];
      const recommendations = movies.filter((movie) => {
        const matchesGenre = movie.genre_ids.some(id => preferences.genres.includes(id));
        const matchesRating = movie.vote_average >= preferences.minRating;
        const matchesKeywords = preferences.keywords.some(keyword => 
          movie.title.toLowerCase().includes(keyword) || 
          movie.overview.toLowerCase().includes(keyword)
        );
        
        return matchesGenre && matchesRating && matchesKeywords;
      });

      // Cache the recommendations
      try {
        await AsyncStorage.setItem(
          `${MOOD_CACHE_KEY}_${mood}`,
          JSON.stringify({ recommendations, timestamp: Date.now() })
        );
      } catch (cacheError) {
        await errorHandler.handleError(
          new CacheError(
            'Failed to cache mood recommendations',
            `${MOOD_CACHE_KEY}_${mood}`,
            'write'
          ),
          {
            componentName: 'moodService',
            action: 'getRecommendations_cache',
            additionalInfo: { mood }
          }
        );
      }

      return recommendations;
    } catch (error) {
      await errorHandler.handleError(
        error instanceof Error ? error : new Error('Unknown error in getRecommendations'),
        {
          componentName: 'moodService',
          action: 'getRecommendations',
          additionalInfo: { mood }
        }
      );

      // Try to get cached recommendations if available
      try {
        const cached = await AsyncStorage.getItem(`${MOOD_CACHE_KEY}_${mood}`);
        if (cached) {
          const { recommendations } = JSON.parse(cached);
          return recommendations;
        }
      } catch (cacheError) {
        await errorHandler.handleError(
          new CacheError(
            'Failed to retrieve cached recommendations',
            `${MOOD_CACHE_KEY}_${mood}`,
            'read'
          ),
          {
            componentName: 'moodService',
            action: 'getRecommendations_cache',
            additionalInfo: { mood }
          }
        );
      }
      
      throw new ApiError(
        'Failed to get mood recommendations',
        500,
        '/recommendations',
        'GET',
        error
      );
    }
  },

  async saveMoodPreference(movieId: number, userId: string, mood: Mood): Promise<void> {
    try {
      const { error } = await supabase
        .from('movie_moods')
        .insert({
          movie_id: movieId,
          user_id: userId,
          mood,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update mood history in local storage
      try {
        const historyStr = await AsyncStorage.getItem(MOOD_HISTORY_KEY);
        const history: MoodHistory[] = historyStr ? JSON.parse(historyStr) : [];
        
        history.push({
          movieId,
          mood,
          timestamp: new Date().toISOString()
        });

        // Keep only last 50 entries
        const updatedHistory = history.slice(-50);
        await AsyncStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (cacheError) {
        await errorHandler.handleError(
          new CacheError(
            'Failed to update mood history cache',
            MOOD_HISTORY_KEY,
            'write'
          ),
          {
            componentName: 'moodService',
            action: 'saveMoodPreference_cache',
            additionalInfo: { movieId, userId, mood }
          }
        );
      }
    } catch (error) {
      await errorHandler.handleError(
        error instanceof Error ? error : new Error('Unknown error in saveMoodPreference'),
        {
          componentName: 'moodService',
          action: 'saveMoodPreference',
          additionalInfo: { movieId, userId, mood }
        }
      );
      throw new DatabaseError(
        'Failed to save mood preference',
        'create',
        'movie_moods',
        error
      );
    }
  },

  async getMoodHistory(): Promise<MoodHistory[]> {
    try {
      const historyStr = await AsyncStorage.getItem(MOOD_HISTORY_KEY);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (error) {
      await errorHandler.handleError(
        new CacheError(
          'Failed to retrieve mood history',
          MOOD_HISTORY_KEY,
          'read'
        ),
        {
          componentName: 'moodService',
          action: 'getMoodHistory',
        }
      );
      return [];
    }
  }
};

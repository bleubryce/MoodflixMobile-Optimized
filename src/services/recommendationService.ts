import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CacheError, DatabaseError, AuthenticationError, ApiError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";
import { moodService } from "./moodService";
import { Movie, movieService } from "./movieService";
import { Mood } from "../types/mood";

export interface RecommendationPreferences {
  genres: number[];
  excludedGenres: number[];
  minRating: number;
  maxRating: number;
  releaseYearStart?: number;
  releaseYearEnd?: number;
  includeWatched: boolean;
}

export interface RecommendationResult {
  movies: Movie[];
  score: number;
  reason: string;
}

interface WatchHistoryItem {
  movie_id: number;
  rating: number;
}

class RecommendationService {
  private readonly CACHE_KEY = "recommendations";
  private readonly PREFERENCES_KEY = "recommendation_preferences";
  private readonly errorHandler = ErrorHandler.getInstance();

  async getRecommendations(
    count: number = 10,
    mood?: Mood,
  ): Promise<RecommendationResult[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new AuthenticationError("User not authenticated", "auth", "supabase");

      // Try cache first
      try {
        const cached = await AsyncStorage.getItem(this.CACHE_KEY);
        if (cached) {
          const { recommendations, timestamp } = JSON.parse(cached);
          // Cache valid for 6 hours
          if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
            return recommendations;
          }
        }
      } catch (cacheError) {
        await this.errorHandler.handleError(
          new CacheError(
            "Failed to read recommendations cache",
            this.CACHE_KEY,
            "read"
          ),
          {
            componentName: "RecommendationService",
            action: "getRecommendations_cache",
          }
        );
      }

      // Get user's preferences
      const preferences = await this.getPreferences();

      // Get user's watch history
      const { data: watchHistory, error: watchHistoryError } = await supabase
        .from("watch_history")
        .select("movie_id, rating")
        .eq("user_id", user.id);

      if (watchHistoryError) {
        throw new DatabaseError(
          "Failed to fetch watch history",
          "read",
          "watch_history",
          watchHistoryError
        );
      }

      const watchedMovieIds = new Set((watchHistory as WatchHistoryItem[] || []).map((h) => h.movie_id));

      // Get user's mood history if no specific mood provided
      let targetMood = mood;
      if (!targetMood) {
        try {
          const recentMoods = await moodService.getMoodHistory();
          if (recentMoods.length > 0) {
            // Use most frequent recent mood
            const moodCounts: Record<Mood, number> = {
              happy: 0,
              sad: 0,
              excited: 0,
              relaxed: 0,
              thoughtful: 0,
            };
            recentMoods.forEach((entry) => {
              moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
            });
            targetMood = Object.entries(moodCounts).reduce((a, b) =>
              a[1] > b[1] ? a : b,
            )[0] as Mood;
          }
        } catch (error) {
          await this.errorHandler.handleError(
            error instanceof Error ? error : new Error("Failed to get mood history"),
            {
              componentName: "RecommendationService",
              action: "getRecommendations_mood",
            }
          );
          targetMood = "happy"; // Fallback to happy mood
        }
      }

      // Get base recommendations from mood
      const moodBasedMovies = await movieService.getMoodBasedMovies(
        targetMood || "happy",
      );

      // Filter and score recommendations
      const scoredMovies = moodBasedMovies.results
        .filter((movie) => {
          if (!preferences.includeWatched && watchedMovieIds.has(movie.id)) {
            return false;
          }

          const releaseYear = new Date(movie.release_date).getFullYear();
          if (
            preferences.releaseYearStart &&
            releaseYear < preferences.releaseYearStart
          ) {
            return false;
          }
          if (
            preferences.releaseYearEnd &&
            releaseYear > preferences.releaseYearEnd
          ) {
            return false;
          }

          if (
            movie.vote_average < preferences.minRating ||
            movie.vote_average > preferences.maxRating
          ) {
            return false;
          }

          const hasExcludedGenre = movie.genre_ids.some((id) =>
            preferences.excludedGenres.includes(id),
          );
          if (hasExcludedGenre) {
            return false;
          }

          return true;
        })
        .map((movie) => {
          // Calculate recommendation score
          let score = movie.vote_average * 10; // Base score from rating

          // Boost score for preferred genres
          const genreMatch = movie.genre_ids.filter((id) =>
            preferences.genres.includes(id),
          ).length;
          score += genreMatch * 5;

          // Boost score for recent releases
          const releaseYear = new Date(movie.release_date).getFullYear();
          const currentYear = new Date().getFullYear();
          if (releaseYear >= currentYear - 2) {
            score += 10;
          }

          // Generate recommendation reason
          let reason = "Recommended because ";
          if (targetMood) {
            reason += `it matches your ${targetMood} mood`;
          }
          if (genreMatch > 0) {
            reason += `${targetMood ? " and " : ""}it includes genres you like`;
          }
          if (!reason.endsWith(".")) {
            reason += ".";
          }

          return {
            movies: [movie],
            score,
            reason,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, count);

      // Cache recommendations
      try {
        await AsyncStorage.setItem(
          this.CACHE_KEY,
          JSON.stringify({
            recommendations: scoredMovies,
            timestamp: Date.now(),
          }),
        );
      } catch (cacheError) {
        await this.errorHandler.handleError(
          new CacheError(
            "Failed to cache recommendations",
            this.CACHE_KEY,
            "write"
          ),
          {
            componentName: "RecommendationService",
            action: "getRecommendations_cache",
          }
        );
      }

      return scoredMovies;
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to get recommendations"),
        {
          componentName: "RecommendationService",
          action: "getRecommendations",
          additionalInfo: { count, mood },
        }
      );
      throw error;
    }
  }

  async getPreferences(): Promise<RecommendationPreferences> {
    try {
      const cached = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      await this.errorHandler.handleError(
        new CacheError(
          "Failed to read recommendation preferences",
          this.PREFERENCES_KEY,
          "read"
        ),
        {
          componentName: "RecommendationService",
          action: "getPreferences",
        }
      );
    }

    // Default preferences
    return {
      genres: [],
      excludedGenres: [],
      minRating: 6.0,
      maxRating: 10.0,
      includeWatched: false,
    };
  }

  async updatePreferences(
    preferences: Partial<RecommendationPreferences>,
  ): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      
      // Save to local storage
      try {
        await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated));
      } catch (cacheError) {
        await this.errorHandler.handleError(
          new CacheError(
            "Failed to save recommendation preferences",
            this.PREFERENCES_KEY,
            "write"
          ),
          {
            componentName: "RecommendationService",
            action: "updatePreferences_cache",
          }
        );
      }

      // Update in database
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new AuthenticationError("User not authenticated", "auth", "supabase");

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ recommendation_preferences: updated })
        .eq("id", user.id);

      if (dbError) {
        throw new DatabaseError(
          "Failed to update recommendation preferences",
          "update",
          "profiles",
          dbError
        );
      }

      // Clear recommendations cache to force refresh with new preferences
      try {
        await AsyncStorage.removeItem(this.CACHE_KEY);
      } catch (cacheError) {
        await this.errorHandler.handleError(
          new CacheError(
            "Failed to clear recommendations cache",
            this.CACHE_KEY,
            "delete"
          ),
          {
            componentName: "RecommendationService",
            action: "updatePreferences_clearCache",
          }
        );
      }
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to update preferences"),
        {
          componentName: "RecommendationService",
          action: "updatePreferences",
          additionalInfo: { preferences },
        }
      );
      throw error;
    }
  }
}

export const recommendationService = new RecommendationService();

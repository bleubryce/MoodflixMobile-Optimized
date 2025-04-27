import { TMDBMovie } from '../types/tmdb';
import { fetchPopularMovies, getWatchHistory, getFavorites } from './movieService';
import { OfflineService } from './offlineService';
import { MoodService } from './moodService';

interface GenreWeight {
  id: number;
  weight: number;
}

interface MovieScore {
  movie: TMDBMovie;
  score: number;
  factors: {
    genreMatch: number;
    moodMatch: number;
    rating: number;
    popularity: number;
  };
}

export class RecommendationService {
  private static readonly CACHE_KEY = 'recommendations';
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<TMDBMovie[]> {
    try {
      // Try to get cached recommendations first
      const cached = await OfflineService.getCachedData<TMDBMovie[]>(
        this.CACHE_KEY,
        this.CACHE_TTL
      );
      if (cached) {
        return cached.slice(0, limit);
      }

      // Fetch necessary data
      const [watchHistory, favorites, popularMovies] = await Promise.all([
        getWatchHistory(userId),
        getFavorites(userId),
        fetchPopularMovies(),
      ]);

      // Calculate genre preferences
      const genreWeights = this.calculateGenreWeights(watchHistory, favorites);

      // Score movies based on multiple factors
      const scoredMovies = popularMovies.map((movie) => {
        const score = this.calculateMovieScore(movie, genreWeights, watchHistory);
        return { movie, score };
      });

      // Sort by score and get top recommendations
      const recommendations = scoredMovies
        .sort((a, b) => b.score.score - a.score.score)
        .map((item) => item.movie)
        .slice(0, limit);

      // Cache the results
      await OfflineService.cacheData(this.CACHE_KEY, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      // Fallback to cached data if available
      const cached = await OfflineService.getCachedData<TMDBMovie[]>(this.CACHE_KEY);
      return cached || [];
    }
  }

  private static calculateGenreWeights(
    watchHistory: TMDBMovie[],
    favorites: TMDBMovie[]
  ): GenreWeight[] {
    const genreCounts = new Map<number, number>();

    // Count genre occurrences in watch history and favorites
    [...watchHistory, ...favorites].forEach((movie) => {
      movie.genre_ids.forEach((genreId) => {
        genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
      });
    });

    // Convert to weights (normalize between 0 and 1)
    const maxCount = Math.max(...genreCounts.values());
    return Array.from(genreCounts.entries()).map(([id, count]) => ({
      id,
      weight: count / maxCount,
    }));
  }

  private static calculateMovieScore(
    movie: TMDBMovie,
    genreWeights: GenreWeight[],
    watchHistory: TMDBMovie[]
  ): MovieScore {
    // Calculate genre match score
    const genreMatch = this.calculateGenreMatch(movie, genreWeights);

    // Calculate mood match score
    const moodMatch = this.calculateMoodMatch(movie, watchHistory);

    // Normalize rating and popularity
    const rating = movie.vote_average / 10;
    const popularity = Math.min(movie.popularity / 100, 1);

    // Calculate final score with weighted factors
    const score = (
      genreMatch * 0.4 +
      moodMatch * 0.3 +
      rating * 0.2 +
      popularity * 0.1
    );

    return {
      movie,
      score,
      factors: {
        genreMatch,
        moodMatch,
        rating,
        popularity,
      },
    };
  }

  private static calculateGenreMatch(
    movie: TMDBMovie,
    genreWeights: GenreWeight[]
  ): number {
    if (!movie.genre_ids.length) return 0;

    const totalWeight = genreWeights.reduce(
      (sum, weight) => sum + weight.weight,
      0
    );

    const matchScore = movie.genre_ids.reduce((score, genreId) => {
      const weight = genreWeights.find((w) => w.id === genreId)?.weight || 0;
      return score + weight;
    }, 0);

    return matchScore / totalWeight;
  }

  private static calculateMoodMatch(
    movie: TMDBMovie,
    watchHistory: TMDBMovie[]
  ): number {
    if (!watchHistory.length) return 0.5; // Default score if no history

    // Get mood patterns from watch history
    const moodPatterns = MoodService.analyzeMoodPatterns(watchHistory);

    // Calculate mood match based on movie characteristics
    const moodMatch = MoodService.calculateMoodMatch(movie, moodPatterns);

    return moodMatch;
  }
} 
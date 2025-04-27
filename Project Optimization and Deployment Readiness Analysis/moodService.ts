import { Movie } from '../types/movie';
import { WatchHistory } from '../types';
import { fetchPopularMovies, saveMovieMood, getWatchHistory } from './movieService';
import { OfflineService } from './offlineService';

export type Mood = 'happy' | 'sad' | 'excited' | 'relaxed' | 'thoughtful';

interface MoodPreferences {
  genres: number[];
  keywords: string[];
  minRating: number;
}

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

export class MoodService {
  static async getRecommendations(mood: Mood): Promise<Movie[]> {
    try {
      const preferences = moodPreferences[mood];
      const response = await fetchPopularMovies();
      const movies = response.data || [];
      
      // Filter movies based on mood preferences
      const recommendations = movies.filter(movie => {
        const matchesGenre = movie.genre_ids.some(id => preferences.genres.includes(id));
        const matchesRating = movie.vote_average >= preferences.minRating;
        const matchesKeywords = preferences.keywords.some(keyword => 
          movie.title.toLowerCase().includes(keyword) || 
          movie.overview.toLowerCase().includes(keyword)
        );
        
        return matchesGenre && matchesRating && matchesKeywords;
      });

      // Cache the recommendations for offline access
      await OfflineService.cacheMovies(recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error getting mood recommendations:', error);
      // Try to get cached recommendations if available
      const cachedMovies = await OfflineService.getCachedMovies();
      return cachedMovies || [];
    }
  }

  static async saveMoodPreference(movieId: number, userId: string, mood: Mood): Promise<void> {
    try {
      await saveMovieMood(movieId, userId, mood);
    } catch (error) {
      console.error('Error saving mood preference:', error);
      throw error;
    }
  }

  static async getMoodHistory(userId: string): Promise<{ movieId: number; mood: Mood }[]> {
    try {
      const response = await getWatchHistory(userId);
      const history = response.data || [];
      return history.map(entry => ({
        movieId: entry.movie_id,
        mood: entry.mood as Mood,
      }));
    } catch (error) {
      console.error('Error getting mood history:', error);
      return [];
    }
  }
} 
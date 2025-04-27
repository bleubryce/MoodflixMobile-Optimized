import { RecommendationService } from '../recommendationService';
import { fetchPopularMovies, getWatchHistory, getFavorites } from '../movieService';
import { MoodService } from '../moodService';
import { OfflineService } from '../offlineService';
import { TMDBMovie } from '../../types/tmdb';

jest.mock('../movieService');
jest.mock('../moodService');
jest.mock('../offlineService');

describe('RecommendationService', () => {
  const mockMovies: TMDBMovie[] = [
    {
      id: 1,
      title: 'Action Movie',
      overview: 'An action-packed movie',
      genre_ids: [28, 12], // Action, Adventure
      vote_average: 7.5,
      popularity: 500,
      poster_path: '/path.jpg',
      backdrop_path: '/path.jpg',
      release_date: '2024-01-01',
      vote_count: 1000,
      original_language: 'en',
      original_title: 'Action Movie',
      adult: false,
      video: false,
    },
    {
      id: 2,
      title: 'Comedy Movie',
      overview: 'A funny movie',
      genre_ids: [35], // Comedy
      vote_average: 8.0,
      popularity: 300,
      poster_path: '/path.jpg',
      backdrop_path: '/path.jpg',
      release_date: '2024-01-01',
      vote_count: 1000,
      original_language: 'en',
      original_title: 'Comedy Movie',
      adult: false,
      video: false,
    },
  ];

  const mockWatchHistory = [
    { movie_id: 1, mood: 'excited' },
  ];

  const mockFavorites = [
    { movie_id: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPersonalizedRecommendations', () => {
    it('returns personalized recommendations based on user preferences', async () => {
      (fetchPopularMovies as jest.Mock).mockResolvedValue({
        data: mockMovies,
        error: null,
      });
      (getWatchHistory as jest.Mock).mockResolvedValue({
        data: mockWatchHistory,
        error: null,
      });
      (getFavorites as jest.Mock).mockResolvedValue({
        data: mockFavorites,
        error: null,
      });
      (MoodService.getRecommendations as jest.Mock).mockResolvedValue([mockMovies[0]]);

      const recommendations = await RecommendationService.getPersonalizedRecommendations(
        'user123',
        'excited'
      );

      expect(recommendations).toHaveLength(2);
      // Action movie should be first due to higher score (matches mood and favorites)
      expect(recommendations[0].id).toBe(1);
    });

    it('returns cached movies when offline or on error', async () => {
      (fetchPopularMovies as jest.Mock).mockRejectedValue(new Error('API Error'));
      (OfflineService.getCachedMovies as jest.Mock).mockResolvedValue(mockMovies);

      const recommendations = await RecommendationService.getPersonalizedRecommendations(
        'user123'
      );

      expect(recommendations).toEqual(mockMovies);
    });

    it('calculates scores correctly based on weights', async () => {
      (fetchPopularMovies as jest.Mock).mockResolvedValue({
        data: mockMovies,
        error: null,
      });
      (getWatchHistory as jest.Mock).mockResolvedValue({
        data: mockWatchHistory,
        error: null,
      });
      (getFavorites as jest.Mock).mockResolvedValue({
        data: mockFavorites,
        error: null,
      });
      (MoodService.getRecommendations as jest.Mock).mockResolvedValue([mockMovies[0]]);

      const recommendations = await RecommendationService.getPersonalizedRecommendations(
        'user123',
        'excited',
        1
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].id).toBe(1);
      expect(OfflineService.cacheMovies).toHaveBeenCalledWith(recommendations);
    });

    it('handles empty responses gracefully', async () => {
      (fetchPopularMovies as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      (getWatchHistory as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      (getFavorites as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const recommendations = await RecommendationService.getPersonalizedRecommendations(
        'user123'
      );

      expect(recommendations).toEqual([]);
    });
  });
}); 
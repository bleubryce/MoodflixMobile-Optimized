import { MoodService } from '../moodService';
import { fetchPopularMovies, saveMovieMood, getWatchHistory } from '../movieService';
import { OfflineService } from '../offlineService';
import { TMDBMovie } from '../../types/tmdb';

jest.mock('../movieService');
jest.mock('../offlineService');

describe('MoodService', () => {
  const mockMovies: TMDBMovie[] = [
    {
      id: 1,
      title: 'Happy Movie',
      overview: 'A feel-good uplifting story',
      genre_ids: [35, 10751], // Comedy, Family
      vote_average: 7.5,
      poster_path: '/path.jpg',
      backdrop_path: '/path.jpg',
      release_date: '2024-01-01',
      vote_count: 1000,
      popularity: 100,
      original_language: 'en',
      original_title: 'Happy Movie',
      adult: false,
      video: false,
    },
    {
      id: 2,
      title: 'Action Movie',
      overview: 'An exciting adventure',
      genre_ids: [28], // Action
      vote_average: 6.5,
      poster_path: '/path.jpg',
      backdrop_path: '/path.jpg',
      release_date: '2024-01-01',
      vote_count: 1000,
      popularity: 100,
      original_language: 'en',
      original_title: 'Action Movie',
      adult: false,
      video: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecommendations', () => {
    it('filters movies based on mood preferences', async () => {
      (fetchPopularMovies as jest.Mock).mockResolvedValue({
        data: mockMovies,
        error: null,
      });

      const recommendations = await MoodService.getRecommendations('happy');

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toBe('Happy Movie');
      expect(OfflineService.cacheMovies).toHaveBeenCalledWith(recommendations);
    });

    it('returns cached movies on error', async () => {
      (fetchPopularMovies as jest.Mock).mockRejectedValue(new Error('API Error'));
      (OfflineService.getCachedMovies as jest.Mock).mockResolvedValue(mockMovies);

      const recommendations = await MoodService.getRecommendations('happy');

      expect(recommendations).toHaveLength(2);
      expect(recommendations).toEqual(mockMovies);
    });
  });

  describe('saveMoodPreference', () => {
    it('saves mood preference successfully', async () => {
      (saveMovieMood as jest.Mock).mockResolvedValue({ data: null, error: null });

      await expect(
        MoodService.saveMoodPreference(1, 'user123', 'happy')
      ).resolves.not.toThrow();

      expect(saveMovieMood).toHaveBeenCalledWith(1, 'user123', 'happy');
    });

    it('throws error when saving fails', async () => {
      const error = new Error('Failed to save');
      (saveMovieMood as jest.Mock).mockRejectedValue(error);

      await expect(
        MoodService.saveMoodPreference(1, 'user123', 'happy')
      ).rejects.toThrow();
    });
  });

  describe('getMoodHistory', () => {
    it('returns mood history successfully', async () => {
      const mockHistory = [
        { movie_id: 1, mood: 'happy' },
        { movie_id: 2, mood: 'excited' },
      ];

      (getWatchHistory as jest.Mock).mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      const history = await MoodService.getMoodHistory('user123');

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({ movieId: 1, mood: 'happy' });
      expect(history[1]).toEqual({ movieId: 2, mood: 'excited' });
    });

    it('returns empty array on error', async () => {
      (getWatchHistory as jest.Mock).mockRejectedValue(new Error('API Error'));

      const history = await MoodService.getMoodHistory('user123');

      expect(history).toEqual([]);
    });
  });
}); 
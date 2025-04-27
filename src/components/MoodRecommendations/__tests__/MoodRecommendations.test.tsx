import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MoodRecommendations } from '../index';
import { MoodService } from '../../../services/moodService';
import { useOffline } from '../../../hooks/useOffline';

jest.mock('../../../services/moodService');
jest.mock('../../../hooks/useOffline');

const mockMovies = [
  {
    id: 1,
    title: 'Happy Movie',
    overview: 'A feel-good story',
    poster_path: '/path.jpg',
    backdrop_path: '/path.jpg',
    release_date: '2024-01-01',
    vote_average: 7.5,
    vote_count: 1000,
    genre_ids: [35],
    popularity: 100,
    original_language: 'en',
    original_title: 'Happy Movie',
    adult: false,
    video: false,
  },
];

describe('MoodRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useOffline as jest.Mock).mockReturnValue({ isConnected: true });
  });

  it('displays loading state initially', () => {
    const { getByTestId } = render(
      <MoodRecommendations mood="happy" />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays recommendations when loaded successfully', async () => {
    (MoodService.getRecommendations as jest.Mock).mockResolvedValue(mockMovies);

    const { getByText } = render(
      <MoodRecommendations mood="happy" />
    );

    await waitFor(() => {
      expect(getByText('Happy Movie')).toBeTruthy();
    });
  });

  it('displays error message when loading fails', async () => {
    (MoodService.getRecommendations as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    const { getByText } = render(
      <MoodRecommendations mood="happy" />
    );

    await waitFor(() => {
      expect(getByText('Failed to load recommendations')).toBeTruthy();
    });
  });

  it('displays offline message when not connected', async () => {
    (useOffline as jest.Mock).mockReturnValue({ isConnected: false });
    (MoodService.getRecommendations as jest.Mock).mockRejectedValue(
      new Error('Network Error')
    );

    const { getByText } = render(
      <MoodRecommendations mood="happy" />
    );

    await waitFor(() => {
      expect(
        getByText('You are offline. Please check your internet connection.')
      ).toBeTruthy();
    });
  });

  it('calls onMoviePress when a movie is pressed', async () => {
    (MoodService.getRecommendations as jest.Mock).mockResolvedValue(mockMovies);
    const onMoviePress = jest.fn();

    const { getByTestId } = render(
      <MoodRecommendations
        mood="happy"
        onMoviePress={onMoviePress}
      />
    );

    await waitFor(() => {
      const movieCard = getByTestId('movie-card-1');
      fireEvent.press(movieCard);
      expect(onMoviePress).toHaveBeenCalledWith(mockMovies[0]);
    });
  });

  it('displays empty state when no recommendations are found', async () => {
    (MoodService.getRecommendations as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <MoodRecommendations mood="happy" />
    );

    await waitFor(() => {
      expect(
        getByText('No recommendations found for your current mood.')
      ).toBeTruthy();
    });
  });
}); 
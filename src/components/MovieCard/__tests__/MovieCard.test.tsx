import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MovieCard } from '../index';

const mockMovie = {
  id: 1,
  title: 'Test Movie',
  overview: 'A test movie description',
  poster_path: '/test.jpg',
  backdrop_path: '/test.jpg',
  release_date: '2024-01-01',
  vote_average: 7.5,
  vote_count: 1000,
  genre_ids: [35],
  popularity: 100,
  original_language: 'en',
  original_title: 'Test Movie',
  adult: false,
  video: false,
};

describe('MovieCard', () => {
  it('renders movie information correctly', () => {
    const { getByText } = render(<MovieCard movie={mockMovie} />);

    expect(getByText('Test Movie')).toBeTruthy();
    expect(getByText('2024')).toBeTruthy();
    expect(getByText('A test movie description')).toBeTruthy();
    expect(getByText('★ 7.5')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MovieCard movie={mockMovie} onPress={onPress} testID="movie-card" />
    );

    fireEvent.press(getByTestId('movie-card'));
    expect(onPress).toHaveBeenCalledWith(mockMovie);
  });

  it('uses placeholder image when poster_path is null', () => {
    const movieWithoutPoster = { ...mockMovie, poster_path: null };
    const { getByTestId } = render(
      <MovieCard movie={movieWithoutPoster} testID="movie-card" />
    );

    const image = getByTestId('movie-poster');
    expect(image.props.source.uri).toBe('https://via.placeholder.com/500x750');
  });

  it('truncates long overview text', () => {
    const longOverview = 'A'.repeat(200);
    const movieWithLongOverview = { ...mockMovie, overview: longOverview };
    const { getByTestId } = render(
      <MovieCard movie={movieWithLongOverview} testID="movie-card" />
    );

    const overview = getByTestId('movie-overview');
    expect(overview.props.numberOfLines).toBe(3);
  });
}); 
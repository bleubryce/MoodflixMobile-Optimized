import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import SearchScreen from '../screens/SearchScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route for MovieDetailScreen
const mockRoute = {
  params: {
    movieId: 123,
  },
};

// Mock services
jest.mock('../services/movieService', () => ({
  getMovieDetails: jest.fn().mockResolvedValue({
    data: {
      id: 123,
      title: 'Test Movie',
      overview: 'Test overview',
      backdrop_path: 'test-path',
      poster_path: 'test-poster-path',
      vote_average: 8.5,
      release_date: '2023-01-01',
      genres: [{ id: 1, name: 'Action' }],
    },
  }),
  fetchPopularMovies: jest.fn().mockResolvedValue({
    data: [
      {
        id: 123,
        title: 'Test Movie',
        overview: 'Test overview',
        backdrop_path: 'test-path',
        poster_path: 'test-poster-path',
        vote_average: 8.5,
        release_date: '2023-01-01',
        genre_ids: [1],
      },
    ],
  }),
  searchMovies: jest.fn().mockResolvedValue({
    data: [
      {
        id: 123,
        title: 'Test Movie',
        overview: 'Test overview',
        backdrop_path: 'test-path',
        poster_path: 'test-poster-path',
        vote_average: 8.5,
        release_date: '2023-01-01',
        genre_ids: [1],
      },
    ],
  }),
}));

jest.mock('../services/moodService', () => ({
  MoodService: {
    getRecommendations: jest.fn().mockResolvedValue([
      {
        id: 123,
        title: 'Test Movie',
        overview: 'Test overview',
        backdrop_path: 'test-path',
        poster_path: 'test-poster-path',
        vote_average: 8.5,
        release_date: '2023-01-01',
        genre_ids: [1],
      },
    ]),
  },
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Wrapper component for providing context
const TestWrapper = ({ children }) => (
  <NavigationContainer>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </NavigationContainer>
);

describe('Core App Features', () => {
  test('HomeScreen renders correctly', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <HomeScreen navigation={mockNavigation} />
      </TestWrapper>
    );
    
    // Wait for movies to load
    await waitFor(() => {
      expect(getByText('Test Movie')).toBeTruthy();
    });
    
    // Check for UI elements
    expect(getByText('Popular Movies')).toBeTruthy();
    expect(queryByText('Loading...')).toBeFalsy();
  });
  
  test('MovieDetailScreen renders correctly', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <MovieDetailScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>
    );
    
    // Wait for movie details to load
    await waitFor(() => {
      expect(getByText('Test Movie')).toBeTruthy();
    });
    
    // Check for movie details
    expect(getByText('Test overview')).toBeTruthy();
    expect(getByText('8.5')).toBeTruthy();
    expect(getByText('2023')).toBeTruthy();
    expect(getByText('Action')).toBeTruthy();
  });
  
  test('SearchScreen renders correctly', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <TestWrapper>
        <SearchScreen navigation={mockNavigation} />
      </TestWrapper>
    );
    
    // Check for search input
    const searchInput = getByPlaceholderText('Search movies...');
    expect(searchInput).toBeTruthy();
    
    // Simulate search
    fireEvent.changeText(searchInput, 'Test');
    
    // Wait for search results
    await waitFor(() => {
      expect(getByText('Test Movie')).toBeTruthy();
    });
  });
});

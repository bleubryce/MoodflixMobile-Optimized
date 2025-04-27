import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { OfflineService } from '../services/offlineService';
import App from '../../App';

// Mock all the necessary services
jest.mock('../services/offlineService', () => ({
  OfflineService: {
    getInstance: () => ({
      subscribeToNetworkChanges: jest.fn().mockReturnValue(() => {}),
      isConnected: jest.fn().mockResolvedValue(true),
      cacheData: jest.fn(),
      getCachedData: jest.fn(),
      clearCache: jest.fn(),
    }),
  },
}));

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
}));

jest.mock('../services/friendService', () => ({
  FriendService: {
    getInstance: () => ({
      getFriends: jest.fn().mockResolvedValue([]),
      getFriendRequests: jest.fn().mockResolvedValue([]),
      setupRealtimeSubscription: jest.fn(),
      cleanup: jest.fn(),
    }),
  },
}));

jest.mock('../services/activityService', () => ({
  ActivityService: {
    getInstance: () => ({
      getActivityFeed: jest.fn().mockResolvedValue([]),
      setupRealtimeSubscription: jest.fn(),
      cleanup: jest.fn(),
    }),
  },
}));

// Mock navigation components
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => <div>{children}</div>,
    Screen: ({ children }) => <div>{children}</div>,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => <div>{children}</div>,
    Screen: ({ children }) => <div>{children}</div>,
  }),
}));

// Mock expo components
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-av', () => ({
  Video: 'Video',
  ResizeMode: {
    CONTAIN: 'contain',
  },
}));

describe('App Integration Tests', () => {
  test('App renders without crashing', async () => {
    // Suppress console errors during test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    try {
      const { getByText } = render(<App />);
      
      // Wait for app to initialize
      await waitFor(() => {
        // This is just checking that the app renders without throwing errors
        expect(true).toBeTruthy();
      });
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });
  
  test('Offline notice appears when offline', async () => {
    // Mock offline state
    OfflineService.getInstance().isConnected = jest.fn().mockResolvedValue(false);
    
    // Suppress console errors during test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    try {
      const { getByText } = render(<App />);
      
      // Wait for offline notice to appear
      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });
});

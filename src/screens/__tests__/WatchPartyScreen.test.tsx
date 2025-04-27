import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WatchPartyScreen } from '../WatchPartyScreen';
import { WatchPartyService } from '../../services/watchPartyService';
import { Video } from 'expo-av';
import { useRoute } from '@react-navigation/native';

jest.mock('../../services/watchPartyService');
jest.mock('expo-av', () => ({
  Video: jest.fn().mockImplementation(() => ({
    setPositionAsync: jest.fn(),
    getStatusAsync: jest.fn().mockResolvedValue({ positionMillis: 0 }),
  })),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: jest.fn(),
}));

describe('WatchPartyScreen', () => {
  const mockParty = {
    id: 'party-1',
    movieId: 1,
    movie: {
      id: 1,
      title: 'Test Movie',
      videoUrl: 'https://example.com/video.mp4',
    },
    hostId: 'user-1',
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    participants: [
      {
        userId: 'user-1',
        username: 'test@example.com',
        joinedAt: '2024-01-01T00:00:00Z',
        lastSeen: '2024-01-01T00:00:00Z',
        status: 'active' as const,
      },
    ],
    currentTime: 0,
    isPlaying: false,
    chatMessages: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRoute as jest.Mock).mockReturnValue({
      params: { partyId: 'party-1' },
    });
    (WatchPartyService.getInstance as jest.Mock).mockReturnValue({
      joinWatchParty: jest.fn().mockResolvedValue(mockParty),
      leaveWatchParty: jest.fn().mockResolvedValue(undefined),
      updatePlaybackState: jest.fn().mockResolvedValue(undefined),
      sendChatMessage: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('should render loading state initially', () => {
    const { getByText } = render(<WatchPartyScreen />);
    expect(getByText('Loading watch party...')).toBeTruthy();
  });

  it('should render watch party content after loading', async () => {
    const { getByText, getByTestId } = render(<WatchPartyScreen />);

    await waitFor(() => {
      expect(getByText('Participants')).toBeTruthy();
      expect(getByText('Chat')).toBeTruthy();
      expect(getByTestId('video-player')).toBeTruthy();
    });
  });

  it('should handle play/pause button press', async () => {
    const { getByTestId } = render(<WatchPartyScreen />);

    await waitFor(() => {
      const playButton = getByTestId('play-pause-button');
      fireEvent.press(playButton);
      expect(WatchPartyService.getInstance().updatePlaybackState).toHaveBeenCalledWith(
        true,
        0
      );
    });
  });

  it('should handle sending chat messages', async () => {
    const { getByPlaceholderText, getByText } = render(<WatchPartyScreen />);

    await waitFor(() => {
      const input = getByPlaceholderText('Type a message...');
      const sendButton = getByText('Send');

      fireEvent.changeText(input, 'Hello!');
      fireEvent.press(sendButton);

      expect(WatchPartyService.getInstance().sendChatMessage).toHaveBeenCalledWith(
        'Hello!'
      );
    });
  });

  it('should handle video position updates', async () => {
    const { getByTestId } = render(<WatchPartyScreen />);

    await waitFor(() => {
      const video = getByTestId('video-player');
      fireEvent(video, 'onPlaybackStatusUpdate', { isLoaded: true, positionMillis: 1000 });
      expect(WatchPartyService.getInstance().updatePlaybackState).toHaveBeenCalledWith(
        false,
        1000
      );
    });
  });

  it('should clean up on unmount', async () => {
    const { unmount } = render(<WatchPartyScreen />);

    unmount();

    expect(WatchPartyService.getInstance().leaveWatchParty).toHaveBeenCalled();
  });
}); 
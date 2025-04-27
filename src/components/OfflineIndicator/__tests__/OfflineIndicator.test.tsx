import React from 'react';
import { render, act } from '@testing-library/react-native';
import { OfflineIndicator } from '../index';
import { OfflineService } from '../../../services/offlineService';

jest.mock('../../../services/offlineService', () => ({
  OfflineService: {
    subscribeToNetworkChanges: jest.fn(),
  },
}));

describe('OfflineIndicator', () => {
  let mockCallback: (isConnected: boolean) => void;

  beforeEach(() => {
    mockCallback = jest.fn();
    (OfflineService.subscribeToNetworkChanges as jest.Mock).mockImplementation(
      (callback) => {
        mockCallback = callback;
        return () => {};
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when online', () => {
    const { queryByText } = render(<OfflineIndicator />);
    expect(queryByText('You are offline')).toBeNull();
  });

  it('should render when offline', () => {
    const { getByText } = render(<OfflineIndicator />);
    act(() => {
      mockCallback(false);
    });
    expect(getByText('You are offline')).toBeTruthy();
  });

  it('should subscribe to network changes on mount', () => {
    render(<OfflineIndicator />);
    expect(OfflineService.subscribeToNetworkChanges).toHaveBeenCalled();
  });
}); 
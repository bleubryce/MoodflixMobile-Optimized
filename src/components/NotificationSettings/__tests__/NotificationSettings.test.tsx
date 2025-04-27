import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationSettings } from '../index';
import { NotificationService } from '../../../services/notificationService';

jest.mock('../../../services/notificationService', () => ({
  NotificationService: {
    getNotificationSettings: jest.fn(),
    cancelAllNotifications: jest.fn(),
  },
}));

describe('NotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders permission message when notifications are not granted', () => {
    (NotificationService.getNotificationSettings as jest.Mock).mockResolvedValue({
      granted: false,
    });

    const { getByText } = render(<NotificationSettings />);
    expect(getByText('Please enable notifications in your device settings')).toBeTruthy();
  });

  it('renders notification settings when permissions are granted', () => {
    (NotificationService.getNotificationSettings as jest.Mock).mockResolvedValue({
      granted: true,
    });

    const { getByText } = render(<NotificationSettings />);
    expect(getByText('Movie Recommendations')).toBeTruthy();
    expect(getByText('Mood-based Suggestions')).toBeTruthy();
    expect(getByText('Watch Reminders')).toBeTruthy();
  });

  it('calls cancelAllNotifications when a setting is toggled off', async () => {
    (NotificationService.getNotificationSettings as jest.Mock).mockResolvedValue({
      granted: true,
    });

    const { getByTestId } = render(<NotificationSettings />);
    const switchElement = getByTestId('recommendations-switch');
    
    fireEvent(switchElement, 'valueChange', false);
    
    expect(NotificationService.cancelAllNotifications).toHaveBeenCalled();
  });
}); 
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationSettings } from '../index';
import { NotificationProvider } from '../../../contexts/notifications/NotificationContext';

jest.mock('../../../contexts/notifications/NotificationContext', () => ({
  useNotifications: () => ({
    preferences: {
      recommendations: true,
      moodSuggestions: false,
      watchReminders: true,
    },
    updatePreferences: jest.fn(),
  }),
}));

describe('NotificationSettings', () => {
  it('renders notification settings correctly', () => {
    const { getByText, getByTestId } = render(
      <NotificationProvider>
        <NotificationSettings />
      </NotificationProvider>
    );

    expect(getByText('Movie Recommendations')).toBeTruthy();
    expect(getByText('Mood-Based Suggestions')).toBeTruthy();
    expect(getByText('Watch Reminders')).toBeTruthy();

    const recommendationsSwitch = getByTestId('recommendations-switch');
    const moodSuggestionsSwitch = getByTestId('mood-suggestions-switch');
    const watchRemindersSwitch = getByTestId('watch-reminders-switch');

    expect(recommendationsSwitch.props.value).toBe(true);
    expect(moodSuggestionsSwitch.props.value).toBe(false);
    expect(watchRemindersSwitch.props.value).toBe(true);
  });

  it('toggles notification preferences', () => {
    const updatePreferences = jest.fn();
    jest.spyOn(require('../../../contexts/notifications/NotificationContext'), 'useNotifications')
      .mockImplementation(() => ({
        preferences: {
          recommendations: true,
          moodSuggestions: false,
          watchReminders: true,
        },
        updatePreferences,
      }));

    const { getByTestId } = render(
      <NotificationProvider>
        <NotificationSettings />
      </NotificationProvider>
    );

    const recommendationsSwitch = getByTestId('recommendations-switch');
    fireEvent(recommendationsSwitch, 'onValueChange', false);

    expect(updatePreferences).toHaveBeenCalledWith({
      recommendations: false,
      moodSuggestions: false,
      watchReminders: true,
    });
  });

  it('handles errors when updating preferences', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const updatePreferences = jest.fn().mockRejectedValue(new Error('Update failed'));
    
    jest.spyOn(require('../../../contexts/notifications/NotificationContext'), 'useNotifications')
      .mockImplementation(() => ({
        preferences: {
          recommendations: true,
          moodSuggestions: false,
          watchReminders: true,
        },
        updatePreferences,
      }));

    const { getByTestId } = render(
      <NotificationProvider>
        <NotificationSettings />
      </NotificationProvider>
    );

    const recommendationsSwitch = getByTestId('recommendations-switch');
    fireEvent(recommendationsSwitch, 'onValueChange', false);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error updating notification preferences:',
      expect.any(Error)
    );
  });
}); 
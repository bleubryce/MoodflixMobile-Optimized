import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, act, fireEvent } from '@testing-library/react-native';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { NotificationService } from '../../../services/notificationService';
import { useAuth } from '../../auth/AuthContext';

jest.mock('../../auth/AuthContext');
jest.mock('../../../services/notificationService');

const TestComponent = () => {
  const { preferences, updatePreferences } = useNotifications();
  return (
    <View>
      <Text testID="preferences">{JSON.stringify(preferences)}</Text>
      <TouchableOpacity
        onPress={() => updatePreferences({ recommendations: false })}
        testID="update-button"
      >
        <Text>Update</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('NotificationContext', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
  };

  const mockPreferences = {
    recommendations: true,
    moodSuggestions: false,
    watchReminders: true,
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (NotificationService.getPreferences as jest.Mock).mockResolvedValue(mockPreferences);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('provides notification preferences', async () => {
    const { getByTestId } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await act(async () => {
      expect(getByTestId('preferences').props.children).toBe(JSON.stringify(mockPreferences));
    });
  });

  it('updates notification preferences', async () => {
    const { getByTestId } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('update-button'));
    });

    expect(NotificationService.updatePreferences).toHaveBeenCalledWith(mockUser.id, {
      recommendations: false,
    });
  });

  it('throws error when used outside provider', () => {
    const TestComponent = () => {
      try {
        useNotifications();
        return null;
      } catch (error) {
        return <Text testID="error">{(error as Error).message}</Text>;
      }
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('error').props.children).toBe(
      'useNotifications must be used within a NotificationProvider'
    );
  });

  it('handles errors when updating preferences', async () => {
    (NotificationService.updatePreferences as jest.Mock).mockRejectedValue(
      new Error('Update failed')
    );

    const { getByTestId } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('update-button'));
    });

    expect(console.error).toHaveBeenCalledWith(
      'Error updating notification preferences:',
      expect.any(Error)
    );
  });
}); 
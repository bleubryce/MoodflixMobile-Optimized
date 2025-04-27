import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BiometricAuthScreen } from '../BiometricAuthScreen';
import { BiometricService } from '../../../services/biometricService';
import { useAuth } from '../../../contexts/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';

jest.mock('../../../services/biometricService');
jest.mock('../../../contexts/auth/AuthContext');
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

describe('BiometricAuthScreen', () => {
  const mockSignIn = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ signIn: mockSignIn });
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
  });

  it('shows loading state initially', () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);

    const { getByTestId } = render(<BiometricAuthScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('navigates to login when biometric is not available', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(false);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);

    render(<BiometricAuthScreen />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  it('navigates to login when biometric is not enabled', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);

    render(<BiometricAuthScreen />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  it('handles successful biometric authentication', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);
    (BiometricService.authenticate as jest.Mock).mockResolvedValue({ success: true });
    (BiometricService.getAuthToken as jest.Mock).mockResolvedValue('test-token');

    const { getByTestId } = render(<BiometricAuthScreen />);
    await waitFor(() => {
      fireEvent.press(getByTestId('biometric-button'));
    });

    expect(mockSignIn).toHaveBeenCalledWith('test-token');
  });

  it('shows error when authentication fails', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);
    (BiometricService.authenticate as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Authentication failed',
    });

    const { getByTestId, getByText } = render(<BiometricAuthScreen />);
    await waitFor(() => {
      fireEvent.press(getByTestId('biometric-button'));
    });

    expect(getByText('Authentication failed')).toBeTruthy();
  });

  it('navigates to login when using password', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);

    const { getByTestId } = render(<BiometricAuthScreen />);
    await waitFor(() => {
      fireEvent.press(getByTestId('password-button'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
}); 
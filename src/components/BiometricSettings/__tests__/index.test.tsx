import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BiometricSettings } from '../index';
import { BiometricService } from '../../../services/biometricService';

jest.mock('../../../services/biometricService');

describe('BiometricSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);

    const { getByTestId } = render(<BiometricSettings />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows not available message when biometric is not available', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(false);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);

    const { getByText } = render(<BiometricSettings />);
    await waitFor(() => {
      expect(getByText('Biometric authentication is not available on this device.')).toBeTruthy();
    });
  });

  it('renders biometric switch when available', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);

    const { getByTestId } = render(<BiometricSettings />);
    await waitFor(() => {
      expect(getByTestId('biometric-switch')).toBeTruthy();
    });
  });

  it('handles enabling biometric authentication', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);
    (BiometricService.authenticate as jest.Mock).mockResolvedValue({ success: true });
    (BiometricService.enableBiometric as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<BiometricSettings />);
    await waitFor(() => {
      const switchElement = getByTestId('biometric-switch');
      fireEvent(switchElement, 'onValueChange', true);
    });

    expect(BiometricService.authenticate).toHaveBeenCalled();
    expect(BiometricService.enableBiometric).toHaveBeenCalled();
  });

  it('handles disabling biometric authentication', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);
    (BiometricService.disableBiometric as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<BiometricSettings />);
    await waitFor(() => {
      const switchElement = getByTestId('biometric-switch');
      fireEvent(switchElement, 'onValueChange', false);
    });

    expect(BiometricService.disableBiometric).toHaveBeenCalled();
  });

  it('shows error when authentication fails', async () => {
    (BiometricService.isBiometricAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);
    (BiometricService.authenticate as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Authentication failed',
    });

    const { getByTestId, getByText } = render(<BiometricSettings />);
    await waitFor(() => {
      const switchElement = getByTestId('biometric-switch');
      fireEvent(switchElement, 'onValueChange', true);
    });

    expect(getByText('Authentication failed')).toBeTruthy();
  });
}); 
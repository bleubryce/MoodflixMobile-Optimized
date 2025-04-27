import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export class BiometricService {
  private static readonly BIOMETRIC_KEY = 'biometric_auth_enabled';
  private static readonly AUTH_TOKEN_KEY = 'auth_token';

  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  static async authenticate(): Promise<BiometricAuthResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access MoodFlix',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  static async enableBiometric(): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.BIOMETRIC_KEY, 'true');
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw new Error('Failed to enable biometric authentication');
    }
  }

  static async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
      await SecureStore.deleteItemAsync(this.AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw new Error('Failed to disable biometric authentication');
    }
  }

  static async storeAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  static async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }
} 
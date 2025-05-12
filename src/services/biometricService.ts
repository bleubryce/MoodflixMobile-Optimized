import { supabase } from "../lib/supabase";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { AuthenticationError, CacheError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export class BiometricServiceImpl {
  private static instance: BiometricServiceImpl | null = null;
  private static readonly BIOMETRIC_KEY = "biometric_auth_enabled";
  private static readonly AUTH_TOKEN_KEY = "auth_token";
  private readonly errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): BiometricServiceImpl {
    if (!BiometricServiceImpl.instance) {
      BiometricServiceImpl.instance = new BiometricServiceImpl();
    }
    return BiometricServiceImpl.instance;
  }

  async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "BiometricService",
          action: "isBiometricAvailable",
        });
      }
      return false;
    }
  }

  async authenticate(): Promise<BiometricAuthResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access MoodFlix",
        fallbackLabel: "Use Password",
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || "Authentication failed",
      };
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "BiometricService",
          action: "authenticate",
        });
      }
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BiometricServiceImpl.BIOMETRIC_KEY);
      return enabled === "true";
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "BiometricService",
          action: "isBiometricEnabled",
        });
      }
      return false;
    }
  }

  async enableBiometric(): Promise<void> {
    try {
      await SecureStore.setItemAsync(BiometricServiceImpl.BIOMETRIC_KEY, "true");
    } catch (error) {
      if (error instanceof Error) {
        const authError = new AuthenticationError(
          "Failed to enable biometric authentication",
          "biometric",
          "enable"
        );
        await this.errorHandler.handleError(authError, {
          componentName: "BiometricService",
          action: "enableBiometric",
        });
        throw authError;
      }
      throw error;
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BiometricServiceImpl.BIOMETRIC_KEY);
      await SecureStore.deleteItemAsync(BiometricServiceImpl.AUTH_TOKEN_KEY);
    } catch (error) {
      if (error instanceof Error) {
        const authError = new AuthenticationError(
          "Failed to disable biometric authentication",
          "biometric",
          "disable"
        );
        await this.errorHandler.handleError(authError, {
          componentName: "BiometricService",
          action: "disableBiometric",
        });
        throw authError;
      }
      throw error;
    }
  }

  async storeAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(BiometricServiceImpl.AUTH_TOKEN_KEY, token);
    } catch (error) {
      if (error instanceof Error) {
        const cacheError = new CacheError(
          "Failed to store authentication token",
          BiometricServiceImpl.AUTH_TOKEN_KEY,
          "write"
        );
        await this.errorHandler.handleError(cacheError, {
          componentName: "BiometricService",
          action: "storeAuthToken",
        });
        throw cacheError;
      }
      throw error;
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(BiometricServiceImpl.AUTH_TOKEN_KEY);
    } catch (error) {
      if (error instanceof Error) {
        const cacheError = new CacheError(
          "Failed to retrieve authentication token",
          BiometricServiceImpl.AUTH_TOKEN_KEY,
          "read"
        );
        await this.errorHandler.handleError(cacheError, {
          componentName: "BiometricService",
          action: "getAuthToken",
          severity: "warning"
        });
      }
      return null;
    }
  }
}

export const BiometricService = BiometricServiceImpl;

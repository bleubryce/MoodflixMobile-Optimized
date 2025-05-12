import { ENV } from "@config/env";
import NetInfo from "@react-native-community/netinfo";
import * as Sentry from "@sentry/react-native";
import type { SeverityLevel } from "@sentry/types";
import { Platform } from "react-native";

import { NetworkError, ApiError, CacheError, AuthenticationError, DatabaseError, NotificationError } from "@errors/errors";

type ErrorSeverity = SeverityLevel;

interface ErrorMetadata {
  componentName?: string;
  action?: string;
  additionalInfo?: Record<string, unknown>;
  userId?: string;
  severity?: SeverityLevel;
}

interface ErrorLogEntry {
  timestamp: string;
  error: Error;
  metadata?: ErrorMetadata;
  handled: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private isInitialized = false;
  private errorLog: ErrorLogEntry[] = [];
  private readonly MAX_LOG_SIZE = 100;

  private constructor() {
    this.initializeErrorTracking();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private initializeErrorTracking(): void {
    if (this.isInitialized) return;

    Sentry.init({
      dsn: ENV.SENTRY_DSN,
      enableAutoSessionTracking: true,
      debug: ENV.APP_ENV === "development",
      tracesSampleRate: ENV.APP_ENV === "production" ? 0.2 : 1.0,
      enabled: ENV.APP_ENV !== "test",
      integrations: [
        new Sentry.ReactNativeTracing({
          routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          tracingOrigins: ["localhost", /^https:\/\//],
        }),
      ],
      beforeSend(event) {
        if (ENV.APP_ENV === "development") {
          return null;
        }
        return event;
      },
    });

    this.isInitialized = true;
  }

  public setUser(userId: string | null, email?: string): void {
    if (userId) {
      Sentry.setUser({ id: userId, email });
    } else {
      Sentry.setUser(null);
    }
  }

  private getSeverity(error: Error): ErrorSeverity {
    if (error instanceof AuthenticationError) return "error";
    if (error instanceof DatabaseError) return "error";
    if (error instanceof NetworkError) return "warning";
    if (error instanceof ApiError) return "warning";
    if (error instanceof CacheError) return "info";
    if (error instanceof NotificationError) return "info";
    return "error";
  }

  private logError(entry: ErrorLogEntry): void {
    this.errorLog.unshift(entry);
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog.pop();
    }
  }

  public async handleError(
    error: Error,
    metadata?: ErrorMetadata,
  ): Promise<void> {
    const severity = this.getSeverity(error);
    const timestamp = new Date().toISOString();

    // Log locally
    this.logError({
      timestamp,
      error,
      metadata,
      handled: true,
    });

    // Log to console in development
    if (ENV.APP_ENV === "development") {
      if (severity === "error" || severity === "fatal") {
        console.error("[ErrorHandler]", error);
      } else {
        console.warn("[ErrorHandler]", error);
      }
    }

    const errorContext = {
      ...metadata,
      timestamp,
      platform: Platform.OS,
      version: Platform.Version,
      appVersion: ENV.APP_VERSION,
      severity,
    };

    // Set error scope
    Sentry.withScope((scope) => {
      scope.setLevel(metadata?.severity || "error");

      if (metadata?.componentName) {
        scope.setTag("component", metadata.componentName);
      }

      if (metadata?.action) {
        scope.setTag("action", metadata.action);
      }

      scope.setContext("error_context", errorContext);

      // Handle specific error types
      if (error instanceof NetworkError) {
        void this.handleNetworkError(error, errorContext);
      } else if (error instanceof ApiError) {
        void this.handleApiError(error, errorContext);
      } else if (error instanceof CacheError) {
        void this.handleCacheError(error, errorContext);
      } else if (error instanceof AuthenticationError) {
        void this.handleAuthError(error, errorContext);
      } else if (error instanceof DatabaseError) {
        void this.handleDatabaseError(error, errorContext);
      } else if (error instanceof NotificationError) {
        void this.handleNotificationError(error, errorContext);
      } else {
        void this.handleUnknownError(error, errorContext);
      }

      Sentry.captureException(error);
    });
  }

  private async handleNetworkError(
    error: NetworkError,
    context: ErrorMetadata,
  ): Promise<void> {
    const netInfo = await NetInfo.fetch();
    Sentry.setContext("network_state", {
      isConnected: netInfo.isConnected,
      type: netInfo.type,
      details: netInfo.details,
    });
  }

  private async handleApiError(
    error: ApiError,
    context: ErrorMetadata,
  ): Promise<void> {
    Sentry.setContext("api_error", {
      status: error.status,
      endpoint: error.endpoint,
      method: error.method,
    });
  }

  private async handleCacheError(
    error: CacheError,
    context: ErrorMetadata,
  ): Promise<void> {
    Sentry.setContext("cache_error", {
      key: error.key,
      operation: error.operation,
    });
  }

  private async handleAuthError(
    error: AuthenticationError,
    context: ErrorMetadata,
  ): Promise<void> {
    Sentry.setContext("auth_error", {
      code: error.code,
      provider: error.provider,
    });
  }

  private async handleDatabaseError(
    error: DatabaseError,
    context: ErrorMetadata,
  ): Promise<void> {
    Sentry.setContext("database_error", {
      operation: error.operation,
      table: error.table,
    });
  }

  private async handleNotificationError(
    error: NotificationError,
    context: ErrorMetadata,
  ): Promise<void> {
    Sentry.setContext("notification_error", {
      type: error.type,
      deviceToken: error.deviceToken,
    });
  }

  private async handleUnknownError(
    error: Error,
    context: ErrorMetadata,
  ): Promise<void> {
    Sentry.setContext("unknown_error", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  public addBreadcrumb(
    message: string,
    category?: string,
    level: SeverityLevel = "info",
  ): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
    });
  }

  public getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }
}

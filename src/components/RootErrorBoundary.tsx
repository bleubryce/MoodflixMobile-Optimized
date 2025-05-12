import NetInfo from "@react-native-community/netinfo";
import React, { Component, ReactNode } from "react";
import { View, Text, Button, StyleSheet } from "react-native";

import { NetworkError, ApiError, CacheError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  isOffline: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export class RootErrorBoundary extends Component<Props, State> {
  private errorHandler: ErrorHandler;
  private networkListener: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0,
      isOffline: false,
    };
    this.errorHandler = ErrorHandler.getInstance();
  }

  componentDidMount() {
    // Set up network status listener
    this.networkListener = NetInfo.addEventListener((state) => {
      this.setState({ isOffline: !state.isConnected });
    });
  }

  componentWillUnmount() {
    if (this.networkListener) {
      this.networkListener();
    }
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRetrying: false,
      retryCount: 0,
      isOffline: false,
    };
  }

  public async componentDidCatch(error: Error, errorInfo: any) {
    // Log error to error handling service
    await this.errorHandler.handleError(error, {
      componentName: "RootErrorBoundary",
      action: "component_error",
      additionalInfo: errorInfo,
    });
  }

  private getErrorMessage(error: Error): string {
    if (error instanceof NetworkError) {
      return this.state.isOffline
        ? "You are currently offline. Please check your internet connection."
        : "Unable to connect to the server. Please try again later.";
    } else if (error instanceof ApiError) {
      return `Server error (${error.status}). Our team has been notified and is working on it.`;
    } else if (error instanceof CacheError) {
      return "Unable to access local data. Please restart the app.";
    }
    return "An unexpected error occurred. Please try again.";
  }

  private getErrorAction(error: Error): string {
    if (error instanceof NetworkError) {
      return this.state.isOffline ? "Check Connection" : "Try Again";
    } else if (error instanceof ApiError) {
      return error.status === 401 ? "Login Again" : "Try Again";
    } else if (error instanceof CacheError) {
      return "Clear Cache";
    }
    return "Try Again";
  }

  private async handleRetry() {
    const { retryCount, error } = this.state;

    if (retryCount >= MAX_RETRIES) {
      this.setState({
        hasError: true,
        error: new Error(
          "Maximum retry attempts reached. Please restart the app.",
        ),
        isRetrying: false,
      });
      return;
    }

    this.setState({ isRetrying: true });

    // For network errors, check connectivity before retrying
    if (error instanceof NetworkError) {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        this.setState({
          isRetrying: false,
          error: new NetworkError("Still no network connection available"),
        });
        return;
      }
    }

    // Add a small delay before retrying
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

    this.setState(
      (prevState) => ({
        hasError: false,
        error: null,
        isRetrying: false,
        retryCount: prevState.retryCount + 1,
      }),
      () => {
        // Call onReset prop if provided
        this.props.onReset?.();
      },
    );
  }

  private handleErrorAction = async () => {
    const { error } = this.state;

    if (error instanceof NetworkError) {
      if (this.state.isOffline) {
        // Open device settings
        // Implement based on platform
      } else {
        await this.handleRetry();
      }
    } else if (error instanceof ApiError) {
      if (error.status === 401) {
        // Handle logout/login flow
      } else {
        await this.handleRetry();
      }
    } else if (error instanceof CacheError) {
      // Clear app cache
      // Implement cache clearing
      await this.handleRetry();
    } else {
      await this.handleRetry();
    }
  };

  public render() {
    const { hasError, error, isRetrying, isOffline } = this.state;

    if (hasError && error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.message}>{this.getErrorMessage(error)}</Text>
          {isOffline && (
            <Text style={styles.offlineMessage}>
              You are currently offline. Some features may be unavailable.
            </Text>
          )}
          <Button
            title={isRetrying ? "Retrying..." : this.getErrorAction(error)}
            onPress={this.handleErrorAction}
            disabled={isRetrying}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
    lineHeight: 22,
  },
  offlineMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#ff6b6b",
    fontStyle: "italic",
  },
});

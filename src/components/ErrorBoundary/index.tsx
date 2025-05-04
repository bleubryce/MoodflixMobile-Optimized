import NetInfo from "@react-native-community/netinfo";
import React, { Component, ReactNode } from "react";
import { View, Text, Button, StyleSheet } from "react-native";

import {
  NetworkError,
  ApiError,
  CacheError,
} from "../../services/movieService";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isRetrying: false,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRetrying: false,
      retryCount: 0,
    };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
    this.props.onError?.(error);
  }

  private getErrorMessage(error: Error): string {
    if (error instanceof NetworkError) {
      return "Unable to connect to the network. Please check your internet connection.";
    } else if (error instanceof ApiError) {
      return `Server error (${error.status}). Please try again later.`;
    } else if (error instanceof CacheError) {
      return "Unable to load cached data. Please try again.";
    }
    return error.message || "Something went wrong";
  }

  private async handleRetry() {
    const { retryCount } = this.state;

    if (retryCount >= MAX_RETRIES) {
      this.setState({
        hasError: true,
        error: new Error("Maximum retry attempts reached"),
        isRetrying: false,
      });
      return;
    }

    this.setState({ isRetrying: true });

    // For network errors, check connectivity before retrying
    if (this.state.error instanceof NetworkError) {
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
        this.props.onRetry?.();
      },
    );
  }

  public render() {
    const { hasError, error, isRetrying } = this.state;

    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.message}>{this.getErrorMessage(error!)}</Text>
          <Button
            title={isRetrying ? "Retrying..." : "Try again"}
            onPress={() => this.handleRetry()}
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
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
});

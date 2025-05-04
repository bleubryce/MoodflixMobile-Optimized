import NetInfo from "@react-native-community/netinfo";
import {
  QueryClient,
  Query,
  Mutation,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";

import {
  NetworkError,
  AuthenticationError,
  DatabaseError,
} from "../types/errors";
import { ErrorHandler } from "../utils/errorHandler";

const errorHandler = ErrorHandler.getInstance();

const handleError = (error: unknown, context: { type: string }): void => {
  if (error instanceof Error) {
    errorHandler.handleError(error, {
      componentName: "ReactQuery",
      action: `${context.type}`,
    });
  }
};

// Create and configure the query client
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => handleError(error, { type: "query_error" }),
  }),
  mutationCache: new MutationCache({
    onError: (error) => handleError(error, { type: "mutation_error" }),
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount: number, error: unknown) => {
        // Only retry network errors, not business logic errors
        if (error instanceof NetworkError && failureCount < 3) {
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      throwOnError: (error: unknown) => {
        // Only throw errors that should trigger error boundary
        return (
          error instanceof Error &&
          (error instanceof AuthenticationError ||
            error instanceof DatabaseError ||
            error instanceof NetworkError)
        );
      },
    },
    mutations: {
      retry: false,
      throwOnError: (error: unknown) => {
        // Only throw errors that should trigger error boundary
        return (
          error instanceof Error &&
          (error instanceof AuthenticationError ||
            error instanceof DatabaseError ||
            error instanceof NetworkError)
        );
      },
    },
  },
});

// Add network status monitoring
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    // Refetch failed queries when connection is restored
    void queryClient.resumePausedMutations();
    void queryClient.invalidateQueries();
  }
});

import { ENV } from "@config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, PostgrestError, AuthError } from "@supabase/supabase-js";

import { ApiError, DatabaseError, AuthenticationError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";

const errorHandler = ErrorHandler.getInstance();

// Create Supabase client with custom storage and error handling
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "x-app-version": ENV.APP_VERSION,
    },
  },
});

// Wrapper for Supabase database operations with error handling
export const safeQueryBuilder = <T>(
  table: string,
  operation: "create" | "read" | "update" | "delete",
) => {
  const query = supabase.from(table);

  const handleDatabaseError = (error: PostgrestError | null, operation: string): never => {
    if (error) {
      throw new DatabaseError(error.message, operation as any, table, error);
    }
    throw new DatabaseError("Unknown database error", operation as any, table);
  };

  return {
    async select(columns = "*", options = {}): Promise<T[]> {
      try {
        const { data, error, status } = await query.select(columns, options);
        if (error) {
          handleDatabaseError(error, "read");
        }
        return data as T[];
      } catch (error) {
        if (error instanceof Error) {
          errorHandler.handleError(error, {
            componentName: "safeQueryBuilder",
            action: `${operation}_select`,
          });
        }
        throw error;
      }
    },

    async insert(values: Partial<T>, options = {}): Promise<T> {
      try {
        const { data, error, status } = await query.insert(values, options);
        if (error) {
          handleDatabaseError(error, "create");
        }
        return data as T;
      } catch (error) {
        if (error instanceof Error) {
          errorHandler.handleError(error, {
            componentName: "safeQueryBuilder",
            action: `${operation}_insert`,
          });
        }
        throw error;
      }
    },

    async update(values: Partial<T>, options = {}): Promise<T> {
      try {
        const { data, error, status } = await query.update(values, options);
        if (error) {
          handleDatabaseError(error, "update");
        }
        return data as T;
      } catch (error) {
        if (error instanceof Error) {
          errorHandler.handleError(error, {
            componentName: "safeQueryBuilder",
            action: `${operation}_update`,
          });
        }
        throw error;
      }
    },

    async delete(options = {}): Promise<T> {
      try {
        const { data, error, status } = await query.delete(options);
        if (error) {
          handleDatabaseError(error, "delete");
        }
        return data as T;
      } catch (error) {
        if (error instanceof Error) {
          errorHandler.handleError(error, {
            componentName: "safeQueryBuilder",
            action: `${operation}_delete`,
          });
        }
        throw error;
      }
    },
  };
};

// Wrapper for Supabase auth operations with error handling
export const safeAuth = {
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new AuthenticationError(
          error.message,
          error.status?.toString() || "unknown",
          "email",
        );
      }
      return data;
    } catch (error) {
      if (error instanceof Error) {
        errorHandler.handleError(error, {
          componentName: "safeAuth",
          action: "signIn",
        });
      }
      throw error;
    }
  },

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        throw new AuthenticationError(
          error.message,
          error.status?.toString() || "unknown",
          "email",
        );
      }
      return data;
    } catch (error) {
      if (error instanceof Error) {
        errorHandler.handleError(error, {
          componentName: "safeAuth",
          action: "signUp",
        });
      }
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new AuthenticationError(
          error.message,
          error.status?.toString() || "unknown",
          "signout",
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        errorHandler.handleError(error, {
          componentName: "safeAuth",
          action: "signOut",
        });
      }
      throw error;
    }
  },

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw new AuthenticationError(
          error.message,
          error.status?.toString() || "unknown",
          "reset",
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        errorHandler.handleError(error, {
          componentName: "safeAuth",
          action: "resetPassword",
        });
      }
      throw error;
    }
  },

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    try {
      return supabase.auth.onAuthStateChange(callback);
    } catch (error) {
      if (error instanceof Error) {
        errorHandler.handleError(error, {
          componentName: "safeAuth",
          action: "onAuthStateChange",
        });
      }
      throw error;
    }
  },
};

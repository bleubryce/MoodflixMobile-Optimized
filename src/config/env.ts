import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";

interface Config {
  APP_ENV: string;
  APP_VERSION: string;
  BUILD_NUMBER: string;
  ENABLE_DARK_MODE: string;
  API_URL: string;
  EXPO_PUBLIC_API_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  TMDB_API_KEY: string;
  TMDB_API_URL: string;
  TMDB_IMAGE_URL: string;
  SENTRY_DSN: string;
  SENTRY_ENVIRONMENT: string;
}

// Default values for development
const DEFAULT_CONFIG: Config = {
  APP_ENV: "development",
  APP_VERSION: Application.nativeApplicationVersion ?? "1.0.0",
  BUILD_NUMBER: Application.nativeBuildVersion ?? "1",
  ENABLE_DARK_MODE: "true",
  API_URL: "http://localhost:3000",
  EXPO_PUBLIC_API_URL: "http://localhost:3000",
  SUPABASE_URL: "", // Will be overridden by .env
  SUPABASE_ANON_KEY: "", // Will be overridden by .env
  TMDB_API_KEY: "", // Will be overridden by .env
  TMDB_API_URL: "https://api.themoviedb.org/3",
  TMDB_IMAGE_URL: "https://image.tmdb.org/t/p",
  SENTRY_DSN: "", // Will be overridden by .env
  SENTRY_ENVIRONMENT: "development",
};

// Get the extra field from app.config.js
const extra = Constants.expoConfig?.extra || {};

// Environment variables
export const ENV: Config = {
  APP_ENV: process.env.APP_ENV || extra.APP_ENV || DEFAULT_CONFIG.APP_ENV,
  APP_VERSION: DEFAULT_CONFIG.APP_VERSION,
  BUILD_NUMBER: DEFAULT_CONFIG.BUILD_NUMBER,
  ENABLE_DARK_MODE:
    process.env.ENABLE_DARK_MODE ||
    extra.ENABLE_DARK_MODE ||
    DEFAULT_CONFIG.ENABLE_DARK_MODE,
  API_URL: process.env.API_URL || extra.API_URL || DEFAULT_CONFIG.API_URL,
  EXPO_PUBLIC_API_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    extra.EXPO_PUBLIC_API_URL ||
    DEFAULT_CONFIG.EXPO_PUBLIC_API_URL,
  SUPABASE_URL:
    process.env.SUPABASE_URL ||
    extra.SUPABASE_URL ||
    DEFAULT_CONFIG.SUPABASE_URL,
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ||
    extra.SUPABASE_ANON_KEY ||
    DEFAULT_CONFIG.SUPABASE_ANON_KEY,
  TMDB_API_KEY:
    process.env.TMDB_API_KEY ||
    extra.TMDB_API_KEY ||
    DEFAULT_CONFIG.TMDB_API_KEY,
  TMDB_API_URL:
    process.env.TMDB_API_URL ||
    extra.TMDB_API_URL ||
    DEFAULT_CONFIG.TMDB_API_URL,
  TMDB_IMAGE_URL:
    process.env.TMDB_IMAGE_URL ||
    extra.TMDB_IMAGE_URL ||
    DEFAULT_CONFIG.TMDB_IMAGE_URL,
  SENTRY_DSN:
    process.env.SENTRY_DSN || extra.SENTRY_DSN || DEFAULT_CONFIG.SENTRY_DSN,
  SENTRY_ENVIRONMENT:
    process.env.SENTRY_ENVIRONMENT ||
    extra.SENTRY_ENVIRONMENT ||
    DEFAULT_CONFIG.SENTRY_ENVIRONMENT,
};

// Validate required environment variables
const requiredVars: (keyof Config)[] = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "TMDB_API_KEY",
  // "SENTRY_DSN", // Remove from always-required
];

requiredVars.forEach((varName) => {
  if (!ENV[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// SENTRY_DSN: Only required in production
if (!ENV.SENTRY_DSN) {
  if (ENV.APP_ENV === "production") {
    throw new Error("Missing required environment variable: SENTRY_DSN");
  } else {
    // eslint-disable-next-line no-console
    console.warn("[env] SENTRY_DSN not set; Sentry will be disabled in development.");
  }
}

export const {
  APP_ENV,
  APP_VERSION,
  BUILD_NUMBER,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TMDB_API_KEY,
  TMDB_API_URL,
  TMDB_IMAGE_URL,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
} = ENV;

// Type definitions
export type Environment = typeof ENV;

// Environment type guard
export const isEnvironment = (env: string): env is keyof typeof ENV => {
  return env in ENV;
};

// Validate environment
Object.keys(ENV).forEach((key) => {
  if (ENV[key as keyof Environment] === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
});

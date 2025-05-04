import '@testing-library/react-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock DeviceInfo
jest.mock('react-native-device-info', () => mockRNDeviceInfo);

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-key',
      SENTRY_DSN: 'https://test@sentry.io/123',
      TMDB_API_KEY: 'test-key',
    },
  },
}));

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '1',
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn(callback => callback({ setTag: jest.fn(), setExtra: jest.fn() })),
  addBreadcrumb: jest.fn(),
  ReactNavigationInstrumentation: jest.fn(),
  ReactNativeTracing: jest.fn(),
  Severity: {
    Fatal: 'fatal',
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
    Debug: 'debug',
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock the Supabase client
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Setup fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })
);

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Console error/warn override to fail tests on warnings/errors
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  originalConsoleError(...args);
  throw new Error(args.join(' '));
};

console.warn = (...args) => {
  // Ignore specific warnings
  const ignoredWarnings = [
    'Animated: `useNativeDriver`',
    'RCTBridge required dispatch_sync',
  ];
  
  if (!ignoredWarnings.some(warning => args[0]?.includes(warning))) {
    originalConsoleWarn(...args);
    throw new Error(args.join(' '));
  }
}; 
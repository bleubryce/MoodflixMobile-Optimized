process.env.APP_ENV = 'test';
process.env.ENABLE_DARK_MODE = 'true';
process.env.API_URL = 'http://localhost:3000';
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

// Mock Expo modules
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-constants');
jest.mock('expo-linking');
jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
); 
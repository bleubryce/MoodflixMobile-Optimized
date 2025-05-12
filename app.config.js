module.exports = {
  name: 'MoodflixMobile',
  slug: 'moodflixmobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.moodflix.mobile",
    requireFullScreen: true
  },
  android: {
    package: "com.moodflix.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    }
  },
  plugins: [
    "expo-screen-orientation",
    "expo-updates"
  ],
  extra: {
    APP_ENV: process.env.APP_ENV,
    ENABLE_DARK_MODE: process.env.ENABLE_DARK_MODE,
    API_URL: process.env.API_URL,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "your-project-id"
    }
  }
}; 
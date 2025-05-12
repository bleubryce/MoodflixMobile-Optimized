# MoodflixMobile

A React Native mobile application that provides movie recommendations based on user moods.

## Features

### Core Features
- **User Authentication**: Login, registration, and profile management
- **Movie Browsing**: Browse popular movies and search for specific titles
- **Movie Details**: View detailed information about movies
- **Mood-Based Recommendations**: Get movie recommendations based on your current mood
- **Personalized Recommendations**: Receive recommendations based on watch history and preferences
- **Offline Mode**: Access cached content when offline
- **Dark/Light Theme Support**: Toggle between dark and light themes

### Social Features
- **Friend System**: Add friends, manage friend requests, and view friend profiles
- **Activity Feed**: See what movies your friends are watching and their reactions
- **Profile Sharing**: Share your profile with others

### Watch Party Feature
- **Synchronized Playback**: Watch movies together with friends in real-time
- **Chat Functionality**: Chat with participants during the watch party
- **Participant Management**: See who's watching and invite friends to join

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- React Native development environment set up
- Expo CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/MoodflixMobile.git
cd MoodflixMobile
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npx expo start
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:
```
TMDB_API_KEY=your_tmdb_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SENTRY_DSN=your_sentry_dsn
```

## Project Structure

- `/src/components`: Reusable UI components
- `/src/contexts`: React Context providers for state management
- `/src/screens`: Screen components for the application
- `/src/services`: Service classes for API interactions and business logic
- `/src/hooks`: Custom React hooks
- `/src/navigation`: Navigation configuration
- `/src/types`: TypeScript type definitions
- `/src/constants`: Application constants
- `/src/config`: Configuration files
- `/src/features`: Feature-specific components and logic

## Testing

Run tests with:
```bash
npm test
# or
yarn test
```

## Building for Production

### iOS
```bash
npx react-native build-ios --mode=release
```

### Android
```bash
npx react-native build-android --mode=release
```

## Deployment

See the [App Store Preparation Guide](./app_store_preparation.md) for detailed instructions on deploying to the App Store and Google Play Store.

## Documentation

For detailed documentation, see the [Documentation](./documentation.md) file.

## Error Handling & Logging

- All errors are routed through a centralized ErrorHandler, which logs to Sentry in production and only logs to the console in development.
- Custom error classes (e.g., CacheError, DatabaseError, CacheNotConfiguredError, UnknownEntityError) are used for more granular error handling.
- User-facing errors are surfaced in a friendly way via error boundaries and UI notifications.
- Console logs are suppressed in production builds.
- Sentry DSN is required in the environment for error reporting.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for providing the movie data API
- [Supabase](https://supabase.io/) for backend services
- [React Native Paper](https://callstack.github.io/react-native-paper/) for UI components
- [Expo](https://expo.dev/) for development tools

## Troubleshooting

### Expo Simulator Timeout (xcrun code 60)

**Issue:**

xcrun exited with non-zero code: 60 – The iOS simulator timed out when attempting to open the Expo URL.

**Resolution Steps:**

1. Restarted the iOS simulator:
   ```sh
   xcrun simctl shutdown all
   xcrun simctl boot "iPhone 16 Pro"
   ```
2. Verified no stale processes on port 8081:
   ```sh
   lsof -i :8081
   ```
3. Restarted Metro with a clean cache:
   ```sh
   npx expo start --clear
   ```

**Outcome:**

Metro started successfully; no further timeout or port conflicts observed. The app is now ready to launch with `i` from the Expo CLI.

**Next Steps:**
- Press `i` in the Expo CLI to open the app in the iOS Simulator.
- If any error reappears, capture the full stack trace for further troubleshooting.

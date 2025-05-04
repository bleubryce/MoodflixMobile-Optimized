#!/bin/bash

# Create necessary directories
mkdir -p src/generated

# Install missing dependencies
npm install --save \
  expo-screen-orientation \
  expo-constants \
  react-native-svg-transformer \
  jest-expo

# Install dev dependencies
npm install --save-dev \
  @types/react \
  @types/react-native \
  @types/jest \
  @testing-library/react-native \
  @testing-library/jest-native

# Clean install
rm -rf node_modules
npm install

# iOS specific setup
if [[ "$OSTYPE" == "darwin"* ]]; then
  cd ios
  pod install
  cd ..
fi

# Create necessary mock directories if they don't exist
mkdir -p __mocks__

# Create environment files if they don't exist
if [ ! -f .env ]; then
  echo "APP_ENV=development
ENABLE_DARK_MODE=true
API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3000" > .env
fi

if [ ! -f .env.production ]; then
  echo "APP_ENV=production
ENABLE_DARK_MODE=true
API_URL=https://api.moodflix.com
EXPO_PUBLIC_API_URL=https://api.moodflix.com" > .env.production
fi

# Make the script executable
chmod +x scripts/setup.sh

echo "Setup complete! Please run 'npm start' to start the development server." 
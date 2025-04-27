# App Store Preparation Guide for MoodflixMobile

This guide outlines the steps needed to prepare MoodflixMobile for submission to the Android and iOS app stores.

## 1. App Icons and Splash Screens

### iOS App Icons
- Create icons in the following sizes:
  - iPhone: 60x60, 120x120, 180x180 pixels
  - iPad: 76x76, 152x152, 167x167 pixels
  - App Store: 1024x1024 pixels

### Android App Icons
- Create icons in the following sizes:
  - mdpi: 48x48 pixels
  - hdpi: 72x72 pixels
  - xhdpi: 96x96 pixels
  - xxhdpi: 144x144 pixels
  - xxxhdpi: 192x192 pixels
  - Play Store: 512x512 pixels

### Splash Screens
- Create splash screens in the following sizes:
  - iOS:
    - iPhone Portrait: 640x960, 640x1136, 750x1334, 1242x2208 pixels
    - iPad Portrait: 768x1024, 1536x2048, 1668x2224, 2048x2732 pixels
  - Android:
    - mdpi: 320x480 pixels
    - hdpi: 480x800 pixels
    - xhdpi: 720x1280 pixels
    - xxhdpi: 960x1600 pixels
    - xxxhdpi: 1280x1920 pixels

## 2. App Metadata

### iOS App Store
- App name (30 characters max)
- Subtitle (30 characters max)
- Description (4000 characters max)
- Keywords (100 characters max)
- Support URL
- Marketing URL (optional)
- Privacy Policy URL
- App Store screenshots (6.5", 5.5", 12.9", and 12.9" screenshots)
- App preview videos (optional)

### Google Play Store
- App name (50 characters max)
- Short description (80 characters max)
- Full description (4000 characters max)
- Feature graphic (1024x500 pixels)
- Promo graphic (180x120 pixels)
- Screenshots (minimum 2, maximum 8)
- Promo video (optional)
- Content rating questionnaire
- Privacy policy URL

## 3. App Configuration

### iOS Configuration
- Update Info.plist with:
  - Required device capabilities
  - Supported interface orientations
  - Privacy usage descriptions
  - App Transport Security settings

### Android Configuration
- Update AndroidManifest.xml with:
  - Required permissions
  - Supported screen sizes
  - Minimum SDK version (API level 21 recommended)
  - Target SDK version (latest stable recommended)

## 4. App Signing

### iOS App Signing
- Create an App ID in the Apple Developer Portal
- Create a distribution certificate
- Create a provisioning profile
- Configure app signing in Xcode

### Android App Signing
- Create a keystore file
- Configure app signing in build.gradle
- Prepare for Play App Signing

## 5. Building for Release

### iOS Build
```bash
# Install dependencies
npm install

# Build iOS app
npx react-native build-ios --mode=release

# Archive app in Xcode
# Open Xcode > Product > Archive
```

### Android Build
```bash
# Install dependencies
npm install

# Build Android app
npx react-native build-android --mode=release

# The APK will be in android/app/build/outputs/apk/release/
```

## 6. Testing Before Submission

- Test the release build on actual devices
- Verify all features work as expected
- Check for any performance issues
- Ensure proper error handling
- Test offline functionality
- Verify deep linking works correctly

## 7. Submission Process

### iOS App Store Submission
- Log in to App Store Connect
- Create a new app version
- Upload the build using Xcode or Transporter
- Fill in all required metadata
- Submit for review

### Google Play Store Submission
- Log in to Google Play Console
- Create a new app or update existing app
- Upload the APK or AAB file
- Fill in all required metadata
- Submit for review

## 8. Post-Submission

- Monitor the review process
- Be prepared to address any issues raised by reviewers
- Plan for updates and maintenance
- Set up crash reporting and analytics
- Prepare marketing materials for launch

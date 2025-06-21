# FAMAPP Mobile

React Native app for FAMAPP - Family organization and management.

## 📱 Overview

This is the iOS and Android version of FAMAPP that shares the same Firebase backend with the web application. Built with React Native and TypeScript, it provides a native mobile experience while maintaining data synchronization across all platforms.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Yarn package manager
- iOS development: macOS with Xcode 12+
- Android development: Android Studio with SDK 28+

### Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **iOS setup (macOS only):**
   ```bash
   cd ios
   pod install
   ```

3. **Configure Firebase:**
   - Follow the complete guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Replace template files with your actual Firebase configuration

4. **Verify setup:**
   ```bash
   node setup.js
   ```

### Development

```bash
# Start Metro bundler
yarn start

# Run iOS app (macOS only)
yarn ios

# Run Android app
yarn android

# Run on connected device
yarn ios --device
yarn android --device
```

## 🛠 Development Scripts

### Quick Commands

| Command | Description |
|---------|-------------|
| `yarn start` | Start Metro bundler |
| `yarn ios` | Run iOS simulator |
| `yarn android` | Run Android emulator |
| `yarn test` | Run test suite |
| `yarn lint` | Run ESLint |
| `yarn type-check` | Run TypeScript check |

### Advanced Scripts

Use the mobile development helper script:

```bash
# General commands
./scripts/mobile-dev.sh start     # Start Metro
./scripts/mobile-dev.sh ios       # Run iOS
./scripts/mobile-dev.sh android   # Run Android

# Development tools
./scripts/mobile-dev.sh clean     # Clean cache
./scripts/mobile-dev.sh reset     # Reset everything
./scripts/mobile-dev.sh pods      # Update iOS pods

# Device testing
./scripts/mobile-dev.sh device-ios     # Run on iOS device
./scripts/mobile-dev.sh device-android # Run on Android device

# Debugging
./scripts/mobile-dev.sh logs-ios       # View iOS logs
./scripts/mobile-dev.sh logs-android   # View Android logs
./scripts/mobile-dev.sh firebase       # Check Firebase config
```

## 📁 Project Structure

```
packages/mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Main app screens
│   │   ├── LoginScreen.tsx
│   │   ├── TodosScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── GroceriesScreen.tsx
│   │   └── DocumentsScreen.tsx
│   ├── navigation/         # Navigation configuration
│   ├── services/          # Platform-specific services
│   ├── config/           # App configuration
│   └── App.tsx          # Main app component
├── android/             # Android-specific files
├── ios/                # iOS-specific files
├── __tests__/         # Test files
└── scripts/          # Development scripts
```

## 🔥 Firebase Integration

The mobile app uses the same Firebase project as the web application:

- **Authentication**: Email/password login shared with web
- **Firestore**: Real-time data sync across all platforms
- **Storage**: Document access and management
- **Security**: Uses same security rules as web app

### Configuration Files

- `ios/FAMAPPMobile/GoogleService-Info.plist` - iOS Firebase config
- `android/app/google-services.json` - Android Firebase config

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete setup instructions.

## 📋 Features

### Core Functionality

- ✅ **Authentication**: Email/password login
- ✅ **Todos**: Create, edit, complete, and assign tasks
- ✅ **Calendar**: View and manage family events
- ✅ **Groceries**: Shared shopping lists with purchase tracking
- ✅ **Documents**: View and access family documents

### Technical Features

- 🔄 **Real-time sync**: Live updates across all devices
- 📱 **Native navigation**: Platform-specific navigation patterns
- 🎨 **Native UI**: iOS and Android design guidelines
- 🔒 **Secure**: Same security model as web app
- 📦 **Shared codebase**: Business logic shared with web app
- 🧪 **Well-tested**: Comprehensive test suite

## 🧪 Testing

### Running Tests

```bash
# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Run in watch mode
yarn test --watch

# Run specific test file
yarn test TodosScreen.test.tsx
```

### Test Structure

- **Unit tests**: Component and service testing
- **Integration tests**: Firebase integration
- **Snapshot tests**: UI consistency
- **E2E tests**: Critical user flows

## 📦 Building for Production

### iOS Build

1. Open `ios/FAMAPPMobile.xcworkspace` in Xcode
2. Select "FAMAPPMobile" scheme
3. Choose "Generic iOS Device" destination
4. Build for release: Product → Archive
5. Upload to App Store Connect

### Android Build

```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# Generate signed AAB (recommended)
./gradlew bundleRelease
```

The built files will be in:
- APK: `android/app/build/outputs/apk/release/`
- AAB: `android/app/build/outputs/bundle/release/`

## 🛠 Troubleshooting

### Common Issues

**Metro bundler won't start:**
```bash
yarn start --reset-cache
```

**iOS build fails:**
```bash
cd ios
pod deintegrate
pod install
```

**Android build fails:**
```bash
cd android
./gradlew clean
cd ..
yarn android
```

**Firebase not working:**
```bash
node setup.js  # Check configuration
```

### Platform-Specific Issues

**iOS:**
- Ensure Xcode is up to date
- Check provisioning profiles
- Verify bundle identifier matches Firebase config

**Android:**
- Check Android Studio SDK installation
- Verify emulator is running
- Confirm `google-services.json` is in correct location

## 🚀 Deployment

### App Store (iOS)

1. **App Store Connect**: Create app with bundle ID `com.famapp.mobile`
2. **Certificates**: Create distribution certificate
3. **Provisioning**: Create production provisioning profile
4. **Build**: Archive in Xcode for distribution
5. **Upload**: Upload to App Store Connect
6. **Review**: Submit for App Store review

### Google Play Store (Android)

1. **Play Console**: Create new app
2. **Signing**: Generate upload key and configure signing
3. **Build**: Create signed AAB file
4. **Upload**: Upload to Play Console
5. **Review**: Submit for Play Store review

## 📚 Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md) - Complete Firebase configuration
- [Monorepo Guide](../../README.md) - Overall project structure
- [React Native Docs](https://reactnative.dev/) - React Native documentation
- [React Navigation](https://reactnavigation.org/) - Navigation library docs

## 🤝 Contributing

1. Follow existing code patterns
2. Write tests for new features
3. Use TypeScript for type safety
4. Follow React Native best practices
5. Test on both iOS and Android

## 📄 License

Same license as the main FAMAPP project.

---

**Need help?** Check the troubleshooting section above or refer to the main project documentation.
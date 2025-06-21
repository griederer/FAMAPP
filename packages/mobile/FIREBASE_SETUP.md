# Firebase Configuration for FAMAPP Mobile

## Prerequisites

1. **Existing Firebase Project**: This mobile app uses the same Firebase project as the web application
2. **Firebase Console Access**: You need access to the Firebase Console for your existing project

## iOS Configuration

### Step 1: Add iOS App to Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing FAMAPP project
3. Click "Add app" and select iOS
4. Enter the following details:
   - **iOS bundle ID**: `com.famapp.mobile`
   - **App nickname**: `FAMAPP Mobile`
   - **App Store ID**: (leave empty for now)

### Step 2: Download GoogleService-Info.plist

1. After registering the iOS app, download the `GoogleService-Info.plist` file
2. Replace the template file at:
   ```
   /packages/mobile/ios/FAMAPPMobile/GoogleService-Info.plist
   ```
3. Make sure the file contains your actual Firebase configuration

### Step 3: Add iOS App to Xcode Project

1. Open Xcode and navigate to your project
2. Right-click on the project name in the navigator
3. Select "Add Files to [ProjectName]"
4. Choose the `GoogleService-Info.plist` file
5. Make sure "Add to target" is checked for your main app target

## Android Configuration

### Step 1: Add Android App to Firebase Project

1. In Firebase Console, click "Add app" and select Android
2. Enter the following details:
   - **Android package name**: `com.famapp.mobile`
   - **App nickname**: `FAMAPP Mobile Android`
   - **Debug signing certificate SHA-1**: (get this from your debug keystore)

### Step 2: Download google-services.json

1. Download the `google-services.json` file
2. Replace the template file at:
   ```
   /packages/mobile/android/app/google-services.json
   ```

### Step 3: Get Debug SHA-1 (for development)

Run this command in your terminal:
```bash
cd packages/mobile/android
./gradlew signingReport
```

Copy the SHA-1 from the debug keystore and add it to your Firebase Android app configuration.

## Firebase Services Configuration

### Required Services

Ensure these services are enabled in your Firebase Console:

1. **Authentication**
   - Email/Password provider should be enabled
   - Same as your web app configuration

2. **Firestore Database**
   - Use the same database as your web app
   - No additional configuration needed

3. **Storage**
   - Use the same storage bucket as your web app
   - No additional configuration needed

### Security Rules

The mobile app will use the same Firestore security rules as your web application. No changes needed.

## Installation and Setup

### Step 1: Install Dependencies

```bash
# From the root of the monorepo
cd packages/mobile

# Install React Native dependencies
yarn install

# For iOS, install CocoaPods dependencies
cd ios
pod install
cd ..
```

### Step 2: Start Metro Bundler

```bash
# From packages/mobile directory
yarn start
```

### Step 3: Run on iOS

```bash
# From packages/mobile directory
yarn ios
```

### Step 4: Run on Android

```bash
# From packages/mobile directory
yarn android
```

## Testing Firebase Connection

### Verify Authentication

1. Launch the app
2. Try to log in with the same credentials you use for the web app
3. Check Firebase Console > Authentication to see if the user session appears

### Verify Firestore

1. After logging in, navigate to the Todos screen
2. Try creating a new todo
3. Check Firebase Console > Firestore to see if the document was created
4. Verify the todo appears in your web app as well

### Verify Storage (if using document uploads)

1. Navigate to the Documents screen
2. The documents from your web app should appear
3. Try opening a document to test storage access

## Troubleshooting

### iOS Issues

1. **Build Errors**: Run `cd ios && pod install` to ensure CocoaPods dependencies are installed
2. **Firebase not initialized**: Check that `GoogleService-Info.plist` is properly added to Xcode project
3. **Signing issues**: Make sure you have a valid Apple Developer account and provisioning profile

### Android Issues

1. **Build Errors**: Check that `google-services.json` is in the correct location
2. **Firebase not initialized**: Verify the Google Services plugin is applied in `build.gradle`
3. **SHA-1 Issues**: Make sure you've added the debug SHA-1 to Firebase Console

### Common Issues

1. **Network Errors**: Check your internet connection and Firebase project status
2. **Permission Errors**: Verify Firestore security rules allow the operations you're trying to perform
3. **Version Conflicts**: Ensure all Firebase SDK versions are compatible

## Production Deployment

### iOS App Store

1. **App Store Connect**: Create a new app in App Store Connect
2. **Bundle ID**: Use `com.famapp.mobile` (must match Firebase configuration)
3. **Provisioning**: Create production provisioning profiles
4. **Build**: Create a release build in Xcode
5. **Upload**: Upload to App Store Connect for review

### Google Play Store

1. **Google Play Console**: Create a new app
2. **Package Name**: Use `com.famapp.mobile`
3. **Signing Key**: Generate a production signing key
4. **SHA-1**: Add the production SHA-1 to Firebase Console
5. **Build**: Create a signed APK or AAB
6. **Upload**: Upload to Google Play Console

## Security Considerations

1. **API Keys**: The GoogleService-Info.plist and google-services.json files contain API keys
2. **Version Control**: These files should be gitignored in production
3. **Environment Variables**: Consider using different Firebase projects for development/production
4. **Security Rules**: Ensure Firestore rules properly restrict access based on authentication

## Next Steps

After completing the Firebase setup:

1. Test all app functionality
2. Verify data synchronization with web app
3. Run the test suite to ensure everything works
4. Prepare for deployment to app stores

For issues or questions, refer to the [Firebase Documentation](https://firebase.google.com/docs) or [React Native Firebase Documentation](https://rnfirebase.io/).
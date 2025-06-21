// Firebase configuration for React Native
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { setFirebaseServices } from '@famapp/shared';

// The Firebase app is automatically initialized by the React Native Firebase library
// using the configuration files (GoogleService-Info.plist for iOS, google-services.json for Android)

// Get Firebase service instances
const authInstance = auth();
const firestoreInstance = firestore();
const storageInstance = storage();

// Set Firebase services for shared package
setFirebaseServices({
  db: firestoreInstance,
  auth: authInstance,
  storage: storageInstance,
  googleProvider: null, // Not available in React Native, will handle differently
  initializeApp: () => {}, // Already initialized by React Native Firebase
});

// Export for direct use if needed
export { authInstance as auth, firestoreInstance as db, storageInstance as storage };
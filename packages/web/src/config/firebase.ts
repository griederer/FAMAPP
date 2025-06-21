// Firebase configuration for web platform
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { setFirebaseServices } from '@famapp/shared';

// Your Firebase config object
const firebaseConfig = {
  // Note: These values need to be set in environment variables
  // Get them from Firebase Console > Project Settings > General
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "famapp-e80ff",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: "890760804458",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Set Firebase services for shared package
setFirebaseServices({
  db,
  auth,
  storage,
  googleProvider,
  initializeApp,
});

// Export for backward compatibility if needed
export { auth, db, storage, googleProvider };
export default app;
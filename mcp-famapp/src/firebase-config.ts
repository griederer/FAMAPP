import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

// Verify connection
export async function verifyFirebaseConnection(): Promise<boolean> {
  try {
    // Simple test to verify Firestore is accessible
    const { collection, getDocs, limit, query } = await import('firebase/firestore');
    const testQuery = query(collection(db, 'todos'), limit(1));
    await getDocs(testQuery);
    return true;
  } catch (error) {
    console.error('Firebase connection error:', error);
    return false;
  }
}
// Firebase configuration interface for platform-agnostic services

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Firebase services interface - to be implemented by platform-specific code
export interface FirebaseServices {
  // Firestore
  db: any;
  
  // Auth
  auth: any;
  googleProvider?: any;
  
  // Storage
  storage: any;
  
  // Functions for platform abstraction
  initializeApp(config: FirebaseConfig): any;
  connectAuthEmulator?(auth: any, url: string): void;
  connectFirestoreEmulator?(db: any, host: string, port: number): void;
  connectStorageEmulator?(storage: any, host: string, port: number): void;
}

// Global Firebase services instance - to be set by platform-specific code
let firebaseServices: FirebaseServices | null = null;

export function setFirebaseServices(services: FirebaseServices): void {
  firebaseServices = services;
}

export function getFirebaseServices(): FirebaseServices {
  if (!firebaseServices) {
    throw new Error('Firebase services not initialized. Call setFirebaseServices() first.');
  }
  return firebaseServices;
}

// Re-export commonly used Firebase types
export type { Unsubscribe } from 'firebase/firestore';
// Authentication service for FAMAPP - shared between web and mobile
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { userWhitelistService } from './userWhitelistService';
import type { User, FamilyMember } from '../types/core';

class AuthService {
  private get auth() {
    return getFirebaseServices().auth;
  }

  private get googleProvider() {
    return getFirebaseServices().googleProvider;
  }

  private get db() {
    return getFirebaseServices().db;
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      if (!this.googleProvider) {
        throw new Error('Google provider not available on this platform');
      }

      const result = await signInWithPopup(this.auth, this.googleProvider);
      const firebaseUser = result.user;
      
      // Check if user is authorized using whitelist service
      const isAuthorized = await userWhitelistService.isEmailAuthorized(firebaseUser.email!);
      if (!isAuthorized) {
        await this.signOut();
        throw new Error('Unauthorized: Only family members can access this app');
      }

      // Create or update user document
      const user = await this.createOrUpdateUser(firebaseUser);
      return user;
    } catch (error: unknown) {
      console.error('Sign-in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error: unknown) {
      console.error('Sign-out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Check if email is authorized (async version using whitelist service)
   */
  async isAuthorizedEmail(email: string | null): Promise<boolean> {
    if (!email) return false;
    return await userWhitelistService.isEmailAuthorized(email);
  }

  /**
   * Get family member name from email (async version using whitelist service)
   */
  async getFamilyMemberFromEmail(email: string): Promise<FamilyMember | null> {
    return await userWhitelistService.getFamilyMemberFromEmail(email);
  }

  /**
   * Create or update user document in Firestore
   */
  private async createOrUpdateUser(firebaseUser: FirebaseUser): Promise<User> {
    const familyMember = await this.getFamilyMemberFromEmail(firebaseUser.email!);
    
    if (!familyMember) {
      throw new Error('Unable to determine family member for this email');
    }

    const userRef = doc(this.db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    const now = new Date();
    
    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        lastLoginAt: now,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      });
      
      return {
        ...userSnap.data(),
        lastLoginAt: now
      } as User;
    } else {
      // Create new user
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || familyMember,
        photoURL: firebaseUser.photoURL || undefined,
        familyMember,
        createdAt: now,
        lastLoginAt: now
      };
      
      await setDoc(userRef, newUser);
      return newUser;
    }
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser && await this.isAuthorizedEmail(firebaseUser.email)) {
        try {
          const user = await this.createOrUpdateUser(firebaseUser);
          callback(user);
        } catch (error) {
          console.error('Error creating/updating user:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }
}

export const authService = new AuthService();
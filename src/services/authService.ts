// Authentication service for FAMAPP
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import type { User, FamilyMember } from '../types';

// Authorized family email addresses
const AUTHORIZED_EMAILS = [
  // TODO: Replace with actual family emails
  'gonzalo@example.com',
  'mpaz@example.com', 
  'borja@example.com',
  'melody@example.com'
];

// Map emails to family member names
const EMAIL_TO_FAMILY_MEMBER: Record<string, FamilyMember> = {
  'gonzalo@example.com': 'Gonzalo',
  'mpaz@example.com': 'Mpaz',
  'borja@example.com': 'Borja', 
  'melody@example.com': 'Melody'
};

class AuthService {
  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if user is authorized
      if (!this.isAuthorizedEmail(firebaseUser.email)) {
        await this.signOut();
        throw new Error('Unauthorized: Only family members can access this app');
      }

      // Create or update user document
      const user = await this.createOrUpdateUser(firebaseUser);
      return user;
    } catch (error: any) {
      console.error('Sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign-out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Check if email is authorized
   */
  isAuthorizedEmail(email: string | null): boolean {
    if (!email) return false;
    return AUTHORIZED_EMAILS.includes(email.toLowerCase());
  }

  /**
   * Get family member name from email
   */
  getFamilyMemberFromEmail(email: string): FamilyMember | null {
    return EMAIL_TO_FAMILY_MEMBER[email.toLowerCase()] || null;
  }

  /**
   * Create or update user document in Firestore
   */
  private async createOrUpdateUser(firebaseUser: FirebaseUser): Promise<User> {
    const familyMember = this.getFamilyMemberFromEmail(firebaseUser.email!);
    
    if (!familyMember) {
      throw new Error('Unable to determine family member for this email');
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
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
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && this.isAuthorizedEmail(firebaseUser.email)) {
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
    return auth.currentUser;
  }
}

export const authService = new AuthService();
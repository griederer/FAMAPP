// User whitelist service for managing authorized family members
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FamilyMember } from '../types';

export interface AuthorizedUser {
  email: string;
  familyMember: FamilyMember;
  isActive: boolean;
  addedAt: Date;
  addedBy: string;
}

export interface WhitelistConfig {
  version: string;
  updatedAt: Date;
  updatedBy: string;
  authorizedUsers: AuthorizedUser[];
}

class UserWhitelistService {
  private readonly WHITELIST_DOC_ID = 'family-whitelist';
  private readonly CONFIG_COLLECTION = 'config';

  /**
   * Initialize the whitelist with default family members
   */
  async initializeWhitelist(): Promise<void> {
    const whitelistRef = doc(db, this.CONFIG_COLLECTION, this.WHITELIST_DOC_ID);
    const whitelistSnap = await getDoc(whitelistRef);

    if (!whitelistSnap.exists()) {
      const defaultConfig: WhitelistConfig = {
        version: '1.0.0',
        updatedAt: new Date(),
        updatedBy: 'system',
        authorizedUsers: [
          {
            email: 'gonzalo@example.com', // TODO: Replace with actual email
            familyMember: 'Gonzalo',
            isActive: true,
            addedAt: new Date(),
            addedBy: 'system'
          },
          {
            email: 'mpaz@example.com', // TODO: Replace with actual email
            familyMember: 'Mpaz',
            isActive: true,
            addedAt: new Date(),
            addedBy: 'system'
          },
          {
            email: 'borja@example.com', // TODO: Replace with actual email
            familyMember: 'Borja',
            isActive: true,
            addedAt: new Date(),
            addedBy: 'system'
          },
          {
            email: 'melody@example.com', // TODO: Replace with actual email
            familyMember: 'Melody',
            isActive: true,
            addedAt: new Date(),
            addedBy: 'system'
          }
        ]
      };

      await setDoc(whitelistRef, defaultConfig);
      console.log('Whitelist initialized with default family members');
    }
  }

  /**
   * Get the current whitelist configuration
   */
  async getWhitelist(): Promise<WhitelistConfig | null> {
    try {
      const whitelistRef = doc(db, this.CONFIG_COLLECTION, this.WHITELIST_DOC_ID);
      const whitelistSnap = await getDoc(whitelistRef);
      
      if (whitelistSnap.exists()) {
        const data = whitelistSnap.data();
        // Convert Firestore timestamps to Date objects
        return {
          ...data,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          authorizedUsers: data.authorizedUsers?.map((user: any) => ({
            ...user,
            addedAt: user.addedAt?.toDate() || new Date()
          })) || []
        } as WhitelistConfig;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching whitelist:', error);
      return null;
    }
  }

  /**
   * Check if an email is authorized
   */
  async isEmailAuthorized(email: string): Promise<boolean> {
    try {
      const whitelist = await this.getWhitelist();
      if (!whitelist) {
        // If no whitelist exists, initialize with defaults
        await this.initializeWhitelist();
        return this.isEmailAuthorized(email); // Retry after initialization
      }

      return whitelist.authorizedUsers.some(
        user => user.email.toLowerCase() === email.toLowerCase() && user.isActive
      );
    } catch (error) {
      console.error('Error checking email authorization:', error);
      return false;
    }
  }

  /**
   * Get family member name from email
   */
  async getFamilyMemberFromEmail(email: string): Promise<FamilyMember | null> {
    try {
      const whitelist = await this.getWhitelist();
      if (!whitelist) return null;

      const user = whitelist.authorizedUsers.find(
        user => user.email.toLowerCase() === email.toLowerCase() && user.isActive
      );

      return user?.familyMember || null;
    } catch (error) {
      console.error('Error getting family member from email:', error);
      return null;
    }
  }

  /**
   * Add a new authorized user (admin function)
   */
  async addAuthorizedUser(
    email: string, 
    familyMember: FamilyMember, 
    addedBy: string
  ): Promise<boolean> {
    try {
      const whitelist = await this.getWhitelist();
      if (!whitelist) {
        await this.initializeWhitelist();
        return this.addAuthorizedUser(email, familyMember, addedBy);
      }

      // Check if user already exists
      const existingUser = whitelist.authorizedUsers.find(
        user => user.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        // Reactivate if inactive
        if (!existingUser.isActive) {
          existingUser.isActive = true;
          existingUser.addedAt = new Date();
          existingUser.addedBy = addedBy;
        } else {
          return false; // User already active
        }
      } else {
        // Add new user
        whitelist.authorizedUsers.push({
          email: email.toLowerCase(),
          familyMember,
          isActive: true,
          addedAt: new Date(),
          addedBy
        });
      }

      whitelist.updatedAt = new Date();
      whitelist.updatedBy = addedBy;

      const whitelistRef = doc(db, this.CONFIG_COLLECTION, this.WHITELIST_DOC_ID);
      await setDoc(whitelistRef, whitelist);

      return true;
    } catch (error) {
      console.error('Error adding authorized user:', error);
      return false;
    }
  }

  /**
   * Deactivate an authorized user (admin function)
   */
  async deactivateUser(email: string, deactivatedBy: string): Promise<boolean> {
    try {
      const whitelist = await this.getWhitelist();
      if (!whitelist) return false;

      const user = whitelist.authorizedUsers.find(
        user => user.email.toLowerCase() === email.toLowerCase()
      );

      if (user && user.isActive) {
        user.isActive = false;
        whitelist.updatedAt = new Date();
        whitelist.updatedBy = deactivatedBy;

        const whitelistRef = doc(db, this.CONFIG_COLLECTION, this.WHITELIST_DOC_ID);
        await setDoc(whitelistRef, whitelist);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return false;
    }
  }

  /**
   * Get all authorized users (admin function)
   */
  async getAllAuthorizedUsers(): Promise<AuthorizedUser[]> {
    try {
      const whitelist = await this.getWhitelist();
      return whitelist?.authorizedUsers || [];
    } catch (error) {
      console.error('Error getting all authorized users:', error);
      return [];
    }
  }

  /**
   * Update user's family member assignment
   */
  async updateUserFamilyMember(
    email: string, 
    newFamilyMember: FamilyMember, 
    updatedBy: string
  ): Promise<boolean> {
    try {
      const whitelist = await this.getWhitelist();
      if (!whitelist) return false;

      const user = whitelist.authorizedUsers.find(
        user => user.email.toLowerCase() === email.toLowerCase()
      );

      if (user) {
        user.familyMember = newFamilyMember;
        whitelist.updatedAt = new Date();
        whitelist.updatedBy = updatedBy;

        const whitelistRef = doc(db, this.CONFIG_COLLECTION, this.WHITELIST_DOC_ID);
        await setDoc(whitelistRef, whitelist);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating user family member:', error);
      return false;
    }
  }
}

export const userWhitelistService = new UserWhitelistService();
// Core data types shared between web and mobile apps

export type FamilyMember = 'gonzalo' | 'mpaz' | 'borja' | 'melody';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  familyMember: FamilyMember;
  createdAt: Date;
  lastLoginAt: Date;
}

// Common UI state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  code: string;
  message: string;
}

// Theme and language configuration
export type Theme = 'light' | 'dark' | 'system';

export interface AppTheme {
  mode: Theme;
}

export interface AppLanguage {
  locale: 'en' | 'es';
}
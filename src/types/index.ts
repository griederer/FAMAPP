// Type definitions for FAMAPP

export type FamilyMember = 'Gonzalo' | 'Mpaz' | 'Borja' | 'Melody';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  familyMember: FamilyMember;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  assignees: FamilyMember[];
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string; // User UID
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  assignees: FamilyMember[];
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  createdBy: string; // User UID
}

export interface GroceryItem {
  name: string;
  emoji: string;
  checked: boolean;
}

export interface GroceryList {
  id: string;
  date: Date;
  items: GroceryItem[];
  isTemplate: boolean;
  templateName?: string;
  createdAt: Date;
  createdBy: string; // User UID
}

// UI State types
export interface AppTheme {
  mode: 'light' | 'dark' | 'system';
}

export interface AppLanguage {
  locale: 'en' | 'es';
}

// Common types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  code: string;
  message: string;
}
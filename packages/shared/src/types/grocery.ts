// Grocery types shared between web and mobile apps
import type { FamilyMember } from './core';

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: boolean;
  price?: number;
  notes?: string;
  addedBy: string;
  checkedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  checkedAt?: Date;
}

export interface GroceryList {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  assignedTo?: FamilyMember;
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
  completedAt?: Date;
  items: GroceryItem[];
}

export interface CreateGroceryListData {
  name: string;
  description?: string;
  assignedTo?: FamilyMember;
}

export interface CreateGroceryItemData {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price?: number;
  notes?: string;
}

export interface UpdateGroceryItemData {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  notes?: string;
  checked?: boolean;
}

export interface GroceryStats {
  totalLists: number;
  activeLists: number;
  completedLists: number;
  totalItems: number;
  checkedItems: number;
}

// Constants
export const GROCERY_CATEGORIES = [
  'Fruits & Vegetables',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Pantry & Canned',
  'Frozen',
  'Snacks',
  'Beverages',
  'Personal Care',
  'Household',
  'Other'
] as const;

export const GROCERY_UNITS = [
  'pcs', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'gal', 'qt', 'pt', 'cup', 'tbsp', 'tsp', 'pack', 'bottle', 'can', 'box'
] as const;

export type GroceryCategory = typeof GROCERY_CATEGORIES[number];
export type GroceryUnit = typeof GROCERY_UNITS[number];

// Service layer interface
export interface GroceryService {
  // List operations
  createGroceryList(data: CreateGroceryListData): Promise<string>;
  updateGroceryList(id: string, data: Partial<CreateGroceryListData>): Promise<void>;
  deleteGroceryList(id: string): Promise<void>;
  toggleGroceryListCompletion(id: string): Promise<void>;
  
  // Item operations
  addGroceryItem(listId: string, data: CreateGroceryItemData): Promise<string>;
  updateGroceryItem(id: string, data: UpdateGroceryItemData): Promise<void>;
  deleteGroceryItem(id: string): Promise<void>;
  toggleGroceryItem(id: string): Promise<void>;
  
  // Real-time subscriptions
  subscribeToGroceryLists(callback: (lists: GroceryList[]) => void): () => void;
  subscribeToGroceryItems(listId: string, callback: (items: GroceryItem[]) => void): () => void;
  
  // Statistics
  getShoppingStats(): Promise<GroceryStats>;
}
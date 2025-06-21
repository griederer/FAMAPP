// Grocery service for Firebase operations
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { authService } from './authService';
import type { Unsubscribe } from 'firebase/firestore';
import type { FamilyMember } from '../types/theme';

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

class GroceryService {
  private readonly LISTS_COLLECTION = 'grocery_lists';
  private readonly ITEMS_COLLECTION = 'grocery_items';

  // Create a new grocery list
  async createGroceryList(data: CreateGroceryListData): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create grocery lists');
    }

    try {
      // Clean the data to remove undefined fields
      const cleanData: any = {
        name: data.name,
        createdBy: user.uid,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (data.description) {
        cleanData.description = data.description;
      }
      if (data.assignedTo) {
        cleanData.assignedTo = data.assignedTo;
      }

      const docRef = await addDoc(collection(db, this.LISTS_COLLECTION), cleanData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating grocery list:', error);
      throw error;
    }
  }

  // Update grocery list
  async updateGroceryList(id: string, data: Partial<CreateGroceryListData>): Promise<void> {
    try {
      const listRef = doc(db, this.LISTS_COLLECTION, id);
      
      // Clean the data to remove undefined fields
      const cleanData: any = {
        updatedAt: serverTimestamp(),
      };

      // Only add fields that have values
      if (data.name !== undefined) {
        cleanData.name = data.name;
      }
      if (data.description !== undefined && data.description !== '') {
        cleanData.description = data.description;
      }
      if (data.assignedTo !== undefined && data.assignedTo) {
        cleanData.assignedTo = data.assignedTo;
      }

      await updateDoc(listRef, cleanData);
    } catch (error) {
      console.error('Error updating grocery list:', error);
      throw error;
    }
  }

  // Delete grocery list
  async deleteGroceryList(id: string): Promise<void> {
    try {
      // First delete all items in the list
      const itemsQuery = query(
        collection(db, this.ITEMS_COLLECTION),
        where('listId', '==', id)
      );
      const itemsSnapshot = await getDocs(itemsQuery);
      
      const deletePromises = itemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Then delete the list
      await deleteDoc(doc(db, this.LISTS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting grocery list:', error);
      throw error;
    }
  }

  // Toggle grocery list completion
  async toggleGroceryListCompletion(id: string): Promise<void> {
    try {
      const listRef = doc(db, this.LISTS_COLLECTION, id);
      
      // Get current state
      const listSnapshot = await getDocs(query(collection(db, this.LISTS_COLLECTION), where('__name__', '==', id)));
      if (listSnapshot.empty) throw new Error('List not found');
      
      const currentList = listSnapshot.docs[0].data();
      const newCompleted = !currentList.completed;
      
      await updateDoc(listRef, {
        completed: newCompleted,
        completedAt: newCompleted ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error toggling grocery list completion:', error);
      throw error;
    }
  }

  // Add item to grocery list
  async addGroceryItem(listId: string, data: CreateGroceryItemData): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to add grocery items');
    }

    try {
      // Clean the data to remove undefined fields
      const cleanData: any = {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        listId,
        checked: false,
        addedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (data.price !== undefined) {
        cleanData.price = data.price;
      }
      if (data.notes) {
        cleanData.notes = data.notes;
      }

      const docRef = await addDoc(collection(db, this.ITEMS_COLLECTION), cleanData);
      
      // Update list timestamp
      await updateDoc(doc(db, this.LISTS_COLLECTION, listId), {
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding grocery item:', error);
      throw error;
    }
  }

  // Update grocery item
  async updateGroceryItem(id: string, data: UpdateGroceryItemData): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to update grocery items');
    }

    try {
      // Clean the data to remove undefined fields
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      // Only add fields that have values
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.category !== undefined) {
        updateData.category = data.category;
      }
      if (data.quantity !== undefined) {
        updateData.quantity = data.quantity;
      }
      if (data.unit !== undefined) {
        updateData.unit = data.unit;
      }
      if (data.price !== undefined) {
        updateData.price = data.price;
      }
      if (data.notes !== undefined && data.notes !== '') {
        updateData.notes = data.notes;
      }
      if (data.checked !== undefined) {
        updateData.checked = data.checked;
      }
      
      if (data.checked === true) {
        updateData.checkedBy = user.uid;
        updateData.checkedAt = serverTimestamp();
      } else if (data.checked === false) {
        updateData.checkedBy = null;
        updateData.checkedAt = null;
      }

      await updateDoc(doc(db, this.ITEMS_COLLECTION, id), updateData);
    } catch (error) {
      console.error('Error updating grocery item:', error);
      throw error;
    }
  }

  // Delete grocery item
  async deleteGroceryItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.ITEMS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting grocery item:', error);
      throw error;
    }
  }

  // Toggle grocery item checked status
  async toggleGroceryItem(id: string): Promise<void> {
    try {
      // Get current item state
      const itemsQuery = query(
        collection(db, this.ITEMS_COLLECTION),
        where('__name__', '==', id)
      );
      const itemSnapshot = await getDocs(itemsQuery);
      
      if (itemSnapshot.empty) throw new Error('Item not found');
      
      const currentItem = itemSnapshot.docs[0].data();
      const newChecked = !currentItem.checked;
      const listId = currentItem.listId;
      
      await this.updateGroceryItem(id, { checked: newChecked });
      
      // Also update the list's updatedAt to trigger subscription
      if (listId) {
        await updateDoc(doc(db, this.LISTS_COLLECTION, listId), {
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error toggling grocery item:', error);
      throw error;
    }
  }

  // Subscribe to grocery lists
  subscribeToGroceryLists(callback: (lists: GroceryList[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.LISTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      try {
        const lists: GroceryList[] = [];
        
        for (const listDoc of snapshot.docs) {
          const listData = listDoc.data();
          
          try {
            // Get items for this list
            const itemsQuery = query(
              collection(db, this.ITEMS_COLLECTION),
              where('listId', '==', listDoc.id),
              orderBy('createdAt', 'asc')
            );
            
            const itemsSnapshot = await getDocs(itemsQuery);
            const items: GroceryItem[] = itemsSnapshot.docs.map(itemDoc => ({
              id: itemDoc.id,
              ...itemDoc.data(),
              createdAt: itemDoc.data().createdAt?.toDate() || new Date(),
              updatedAt: itemDoc.data().updatedAt?.toDate() || new Date(),
              checkedAt: itemDoc.data().checkedAt?.toDate(),
            } as GroceryItem));
            
            lists.push({
              id: listDoc.id,
              ...listData,
              items,
              createdAt: listData.createdAt?.toDate() || new Date(),
              updatedAt: listData.updatedAt?.toDate() || new Date(),
              completedAt: listData.completedAt?.toDate(),
            } as GroceryList);
          } catch (itemsError: any) {
            if (itemsError.code === 'failed-precondition' && itemsError.message.includes('index')) {
              console.log('Firestore grocery items index is building, using fallback query...');
              // Fallback query without orderBy during index building
              const fallbackQuery = query(
                collection(db, this.ITEMS_COLLECTION),
                where('listId', '==', listDoc.id)
              );
              
              try {
                const itemsSnapshot = await getDocs(fallbackQuery);
                const items: GroceryItem[] = itemsSnapshot.docs.map(itemDoc => ({
                  id: itemDoc.id,
                  ...itemDoc.data(),
                  createdAt: itemDoc.data().createdAt?.toDate() || new Date(),
                  updatedAt: itemDoc.data().updatedAt?.toDate() || new Date(),
                  checkedAt: itemDoc.data().checkedAt?.toDate(),
                } as GroceryItem));
                
                // Sort manually since we can't use orderBy
                items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                
                lists.push({
                  id: listDoc.id,
                  ...listData,
                  items,
                  createdAt: listData.createdAt?.toDate() || new Date(),
                  updatedAt: listData.updatedAt?.toDate() || new Date(),
                  completedAt: listData.completedAt?.toDate(),
                } as GroceryList);
              } catch (fallbackError) {
                console.error('Fallback query also failed:', fallbackError);
                // Add list without items if both queries fail
                lists.push({
                  id: listDoc.id,
                  ...listData,
                  items: [],
                  createdAt: listData.createdAt?.toDate() || new Date(),
                  updatedAt: listData.updatedAt?.toDate() || new Date(),
                  completedAt: listData.completedAt?.toDate(),
                } as any);
              }
            } else {
              console.error('Error fetching items for list:', itemsError);
              // Add list without items if there's an error
              lists.push({
                id: listDoc.id,
                ...listData,
                items: [],
                createdAt: listData.createdAt?.toDate() || new Date(),
                updatedAt: listData.updatedAt?.toDate() || new Date(),
                completedAt: listData.completedAt?.toDate(),
              } as any);
            }
          }
        }
        
        callback(lists);
      } catch (error: any) {
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.log('Firestore grocery lists index is building, using fallback query...');
          // Fallback query without orderBy
          const fallbackQ = query(collection(db, this.LISTS_COLLECTION));
          
          return onSnapshot(fallbackQ, async (fallbackSnapshot) => {
            try {
              const lists: GroceryList[] = [];
              
              for (const listDoc of fallbackSnapshot.docs) {
                const listData = listDoc.data();
                
                // For fallback, get items without ordering
                const itemsQuery = query(
                  collection(db, this.ITEMS_COLLECTION),
                  where('listId', '==', listDoc.id)
                );
                
                try {
                  const itemsSnapshot = await getDocs(itemsQuery);
                  const items: GroceryItem[] = itemsSnapshot.docs.map(itemDoc => ({
                    id: itemDoc.id,
                    ...itemDoc.data(),
                    createdAt: itemDoc.data().createdAt?.toDate() || new Date(),
                    updatedAt: itemDoc.data().updatedAt?.toDate() || new Date(),
                    checkedAt: itemDoc.data().checkedAt?.toDate(),
                  } as GroceryItem));
                  
                  // Sort manually
                  items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                  
                  lists.push({
                    id: listDoc.id,
                    ...listData,
                    items,
                    createdAt: listData.createdAt?.toDate() || new Date(),
                    updatedAt: listData.updatedAt?.toDate() || new Date(),
                    completedAt: listData.completedAt?.toDate(),
                  } as GroceryList);
                } catch (itemError) {
                  // Add list without items if items query fails
                  lists.push({
                    id: listDoc.id,
                    ...listData,
                    items: [],
                    createdAt: listData.createdAt?.toDate() || new Date(),
                    updatedAt: listData.updatedAt?.toDate() || new Date(),
                    completedAt: listData.completedAt?.toDate(),
                  } as any);
                }
              }
              
              // Sort lists manually since we can't use orderBy
              lists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
              callback(lists);
            } catch (fallbackError) {
              console.error('Fallback grocery lists query failed:', fallbackError);
              callback([]);
            }
          });
        } else {
          console.error('Error fetching grocery lists:', error);
          callback([]);
        }
      }
    });
  }

  // Subscribe to items for a specific list
  subscribeToGroceryItems(listId: string, callback: (items: GroceryItem[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.ITEMS_COLLECTION),
      where('listId', '==', listId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const items: GroceryItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        checkedAt: doc.data().checkedAt?.toDate(),
      } as GroceryItem));
      
      callback(items);
    }, (error: any) => {
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.log('Firestore grocery items index is building, using fallback query...');
        // Fallback query without orderBy during index building
        const fallbackQ = query(
          collection(db, this.ITEMS_COLLECTION),
          where('listId', '==', listId)
        );
        
        return onSnapshot(fallbackQ, (fallbackSnapshot) => {
          const items: GroceryItem[] = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            checkedAt: doc.data().checkedAt?.toDate(),
          } as GroceryItem));
          
          // Sort manually since we can't use orderBy
          items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          callback(items);
        }, (fallbackError) => {
          console.error('Fallback grocery items query failed:', fallbackError);
          callback([]);
        });
      } else {
        console.error('Error fetching grocery items:', error);
        callback([]);
      }
    });
  }

  // Get shopping stats
  async getShoppingStats(): Promise<{
    totalLists: number;
    activeLists: number;
    completedLists: number;
    totalItems: number;
    checkedItems: number;
  }> {
    try {
      const listsSnapshot = await getDocs(collection(db, this.LISTS_COLLECTION));
      const itemsSnapshot = await getDocs(collection(db, this.ITEMS_COLLECTION));
      
      const lists = listsSnapshot.docs.map(doc => doc.data());
      const items = itemsSnapshot.docs.map(doc => doc.data());
      
      return {
        totalLists: lists.length,
        activeLists: lists.filter(list => !list.completed).length,
        completedLists: lists.filter(list => list.completed).length,
        totalItems: items.length,
        checkedItems: items.filter(item => item.checked).length,
      };
    } catch (error) {
      console.error('Error getting shopping stats:', error);
      throw error;
    }
  }
}

export const groceryService = new GroceryService();
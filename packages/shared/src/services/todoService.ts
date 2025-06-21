// Todo service for Firestore operations - shared between web and mobile
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  QueryConstraint,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { authService } from './authService';
import type {
  Todo,
  TodoDocument,
  CreateTodoData,
  UpdateTodoData,
  TodoFilters,
  TodoStats,
  TodoService as ITodoService,
} from '../types/todo';
import type { FamilyMember } from '../types/core';

class TodoService implements ITodoService {
  private readonly collectionName = 'todos';

  private get db() {
    return getFirebaseServices().db;
  }

  // Convert Firestore document to Todo object
  private documentToTodo(id: string, docData: any): Todo {
    return {
      id,
      title: docData.title,
      description: docData.description || undefined,
      completed: docData.completed,
      priority: docData.priority,
      assignedTo: docData.assignedTo as FamilyMember | null,
      createdBy: docData.createdBy,
      createdAt: docData.createdAt?.toDate() || new Date(),
      updatedAt: docData.updatedAt?.toDate() || new Date(),
      completedAt: docData.completedAt?.toDate() || null,
      dueDate: docData.dueDate?.toDate() || null,
      tags: docData.tags || [],
      archivedAt: docData.archivedAt?.toDate() || null,
    };
  }

  // Convert Todo object to Firestore document
  private todoToDocument(todo: CreateTodoData | UpdateTodoData): any {
    const now = Timestamp.now();
    const user = authService.getCurrentUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create todos');
    }

    const baseDoc: any = {
      updatedAt: now,
    };

    if ('title' in todo && todo.title !== undefined) {
      baseDoc.title = todo.title;
    }

    if ('description' in todo) {
      baseDoc.description = todo.description || null;
    }

    if ('completed' in todo && todo.completed !== undefined) {
      baseDoc.completed = todo.completed;
      baseDoc.completedAt = todo.completed ? now : null;
    }

    if ('priority' in todo) {
      baseDoc.priority = todo.priority || 'medium';
    }

    if ('assignedTo' in todo) {
      baseDoc.assignedTo = todo.assignedTo || null;
    }

    if ('dueDate' in todo) {
      baseDoc.dueDate = todo.dueDate ? Timestamp.fromDate(todo.dueDate) : null;
    }

    if ('tags' in todo) {
      baseDoc.tags = todo.tags || [];
    }

    return baseDoc;
  }

  // Build query constraints based on filters
  private buildQueryConstraints(filters?: TodoFilters): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];

    if (filters?.assignedTo !== undefined) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }

    if (filters?.completed !== undefined) {
      constraints.push(where('completed', '==', filters.completed));
    }

    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }

    if (filters?.createdBy) {
      constraints.push(where('createdBy', '==', filters.createdBy));
    }

    if (filters?.archived !== undefined) {
      if (filters.archived) {
        constraints.push(where('archivedAt', '!=', null));
      } else {
        constraints.push(where('archivedAt', '==', null));
      }
    }

    // Default ordering by creation date (newest first)
    constraints.push(orderBy('createdAt', 'desc'));

    return constraints;
  }

  // Create a new todo
  async createTodo(data: CreateTodoData): Promise<Todo> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create todos');
    }

    try {
      const now = Timestamp.now();
      const todoDoc: any = {
        ...this.todoToDocument(data),
        createdBy: user.uid,
        createdAt: now,
        completed: false,
        archivedAt: null,
      };

      const docRef = await addDoc(collection(this.db, this.collectionName), todoDoc);
      
      // Return the created todo
      return this.documentToTodo(docRef.id, {
        ...todoDoc,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  }

  // Get all todos with optional filters
  async getTodos(filters?: TodoFilters): Promise<Todo[]> {
    try {
      const constraints = this.buildQueryConstraints(filters);
      const q = query(collection(this.db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      let todos = querySnapshot.docs.map(doc => 
        this.documentToTodo(doc.id, doc.data())
      );

      // Apply client-side search filter if provided
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        todos = todos.filter(todo =>
          todo.title.toLowerCase().includes(searchTerm) ||
          (todo.description && todo.description.toLowerCase().includes(searchTerm)) ||
          todo.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      return todos;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  }

  // Get a single todo by ID
  async getTodo(id: string): Promise<Todo | null> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.documentToTodo(id, docSnap.data());
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching todo:', error);
      throw error;
    }
  }

  // Update an existing todo
  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const updateData = this.todoToDocument(data);
      
      await updateDoc(docRef, updateData);
      
      // Fetch and return the updated todo
      const updatedTodo = await this.getTodo(id);
      if (!updatedTodo) {
        throw new Error('Todo not found after update');
      }
      
      return updatedTodo;
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  }

  // Delete a todo
  async deleteTodo(id: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  }

  // Toggle todo completion status
  async toggleComplete(id: string): Promise<Todo> {
    try {
      const todo = await this.getTodo(id);
      if (!todo) {
        throw new Error('Todo not found');
      }

      return await this.updateTodo(id, { completed: !todo.completed });
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      throw error;
    }
  }

  // Archive a todo
  async archiveTodo(id: string): Promise<Todo> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const updatedTodo = await this.getTodo(id);
      if (!updatedTodo) {
        throw new Error('Todo not found after archiving');
      }

      return updatedTodo;
    } catch (error) {
      console.error('Error archiving todo:', error);
      throw error;
    }
  }

  // Unarchive a todo
  async unarchiveTodo(id: string): Promise<Todo> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        archivedAt: null,
        updatedAt: serverTimestamp(),
      });

      const updatedTodo = await this.getTodo(id);
      if (!updatedTodo) {
        throw new Error('Todo not found after unarchiving');
      }

      return updatedTodo;
    } catch (error) {
      console.error('Error unarchiving todo:', error);
      throw error;
    }
  }

  // Subscribe to todos with real-time updates
  subscribeTodos(
    filters: TodoFilters | undefined,
    callback: (todos: Todo[]) => void
  ): () => void {
    try {
      const constraints = this.buildQueryConstraints(filters);
      const q = query(collection(this.db, this.collectionName), ...constraints);

      return onSnapshot(q, (querySnapshot) => {
        let todos = querySnapshot.docs.map(doc => 
          this.documentToTodo(doc.id, doc.data())
        );

        // Apply client-side search filter if provided
        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          todos = todos.filter(todo =>
            todo.title.toLowerCase().includes(searchTerm) ||
            (todo.description && todo.description.toLowerCase().includes(searchTerm)) ||
            todo.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        }

        callback(todos);
      }, (error) => {
        console.error('Error in todos subscription:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error subscribing to todos:', error);
      return () => {
        // Cleanup function for error case
      };
    }
  }

  // Get todo statistics
  async getTodoStats(filters?: TodoFilters): Promise<TodoStats> {
    try {
      const todos = await this.getTodos(filters);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const stats: TodoStats = {
        total: todos.length,
        completed: 0,
        pending: 0,
        overdue: 0,
        dueToday: 0,
        byPriority: { high: 0, medium: 0, low: 0 },
        byAssignee: { gonzalo: 0, mpaz: 0, borja: 0, melody: 0 },
      };

      todos.forEach(todo => {
        if (todo.completed) {
          stats.completed++;
        } else {
          stats.pending++;
        }

        // Check due dates
        if (todo.dueDate && !todo.completed) {
          const dueDate = new Date(todo.dueDate.getFullYear(), todo.dueDate.getMonth(), todo.dueDate.getDate());
          if (dueDate < today) {
            stats.overdue++;
          } else if (dueDate.getTime() === today.getTime()) {
            stats.dueToday++;
          }
        }

        // Count by priority
        stats.byPriority[todo.priority]++;

        // Count by assignee
        if (todo.assignedTo) {
          stats.byAssignee[todo.assignedTo]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculating todo stats:', error);
      throw error;
    }
  }

  // Bulk complete todos
  async bulkComplete(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);
      const now = serverTimestamp();

      ids.forEach(id => {
        const docRef = doc(this.db, this.collectionName, id);
        batch.update(docRef, {
          completed: true,
          completedAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk completing todos:', error);
      throw error;
    }
  }

  // Bulk delete todos
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      ids.forEach(id => {
        const docRef = doc(this.db, this.collectionName, id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk deleting todos:', error);
      throw error;
    }
  }

  // Bulk archive todos
  async bulkArchive(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);
      const now = serverTimestamp();

      ids.forEach(id => {
        const docRef = doc(this.db, this.collectionName, id);
        batch.update(docRef, {
          archivedAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk archiving todos:', error);
      throw error;
    }
  }

  // Auto-archive completed todos after 3 days
  async autoArchiveCompleted(): Promise<number> {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const q = query(
        collection(this.db, this.collectionName),
        where('completed', '==', true),
        where('completedAt', '<=', Timestamp.fromDate(threeDaysAgo)),
        where('archivedAt', '==', null)
      );

      const querySnapshot = await getDocs(q);
      const ids = querySnapshot.docs.map(doc => doc.id);

      if (ids.length > 0) {
        await this.bulkArchive(ids);
      }

      return ids.length;
    } catch (error) {
      console.error('Error auto-archiving completed todos:', error);
      throw error;
    }
  }
}

export const todoService = new TodoService();
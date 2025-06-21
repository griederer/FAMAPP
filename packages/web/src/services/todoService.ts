// Todo service for Firestore operations
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
} from 'firebase/firestore';
import { db } from '../config/firebase';
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
import type { FamilyMember } from '../types/theme';

class TodoService implements ITodoService {
  private readonly collection = 'todos';

  // Convert Firestore document to Todo object
  private documentToTodo(id: string, doc: TodoDocument): Todo {
    return {
      id,
      title: doc.title,
      description: doc.description || undefined,
      completed: doc.completed,
      priority: doc.priority,
      assignedTo: doc.assignedTo as FamilyMember | null,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt.toDate(),
      updatedAt: doc.updatedAt.toDate(),
      completedAt: doc.completedAt?.toDate() || null,
      dueDate: doc.dueDate?.toDate() || null,
      tags: doc.tags || [],
      archivedAt: doc.archivedAt?.toDate() || null,
    };
  }

  // Convert Todo object to Firestore document
  private todoToDocument(todo: CreateTodoData | UpdateTodoData): Partial<TodoDocument> {
    const now = Timestamp.now();
    const user = authService.getCurrentUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create todos');
    }

    const baseDoc: Partial<TodoDocument> = {
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

    if (filters) {
      if (filters.assignedTo !== undefined) {
        constraints.push(where('assignedTo', '==', filters.assignedTo));
      }

      if (filters.completed !== undefined) {
        constraints.push(where('completed', '==', filters.completed));
      }

      if (filters.priority) {
        constraints.push(where('priority', '==', filters.priority));
      }

      if (filters.createdBy) {
        constraints.push(where('createdBy', '==', filters.createdBy));
      }

      if (filters.archived !== undefined) {
        if (filters.archived) {
          constraints.push(where('archivedAt', '!=', null));
        } else {
          constraints.push(where('archivedAt', '==', null));
        }
      }
    }

    // Default ordering
    constraints.push(orderBy('createdAt', 'desc'));
    
    return constraints;
  }

  // Filter todos by search term (client-side)
  private filterBySearch(todos: Todo[], searchTerm: string): Todo[] {
    if (!searchTerm.trim()) return todos;
    
    const term = searchTerm.toLowerCase();
    return todos.filter(todo => 
      todo.title.toLowerCase().includes(term) ||
      todo.description?.toLowerCase().includes(term) ||
      todo.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }

  async createTodo(data: CreateTodoData): Promise<Todo> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create todos');
    }

    const now = Timestamp.now();
    const todoDoc: TodoDocument = {
      title: data.title,
      description: data.description || null,
      completed: false,
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo || null,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      tags: data.tags || [],
      archivedAt: null,
    };

    const docRef = await addDoc(collection(db, this.collection), todoDoc);
    return this.documentToTodo(docRef.id, todoDoc);
  }

  async getTodos(filters?: TodoFilters): Promise<Todo[]> {
    const constraints = this.buildQueryConstraints(filters);
    const q = query(collection(db, this.collection), ...constraints);
    
    const snapshot = await getDocs(q);
    let todos = snapshot.docs.map(doc => 
      this.documentToTodo(doc.id, doc.data() as TodoDocument)
    );

    // Apply search filter client-side
    if (filters?.search) {
      todos = this.filterBySearch(todos, filters.search);
    }

    return todos;
  }

  async getTodo(id: string): Promise<Todo | null> {
    const docRef = doc(db, this.collection, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    return this.documentToTodo(snapshot.id, snapshot.data() as TodoDocument);
  }

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
    const docRef = doc(db, this.collection, id);
    const updateData = this.todoToDocument(data);
    
    await updateDoc(docRef, updateData);
    
    const updatedTodo = await this.getTodo(id);
    if (!updatedTodo) {
      throw new Error('Failed to retrieve updated todo');
    }
    
    return updatedTodo;
  }

  async deleteTodo(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }

  async toggleComplete(id: string): Promise<Todo> {
    const todo = await this.getTodo(id);
    if (!todo) {
      throw new Error('Todo not found');
    }

    return this.updateTodo(id, { completed: !todo.completed });
  }

  async archiveTodo(id: string): Promise<Todo> {
    return this.updateTodo(id, { archivedAt: new Date() } as any);
  }

  async unarchiveTodo(id: string): Promise<Todo> {
    return this.updateTodo(id, { archivedAt: null } as any);
  }

  subscribeTodos(
    filters: TodoFilters | undefined,
    callback: (todos: Todo[]) => void
  ): () => void {
    const constraints = this.buildQueryConstraints(filters);
    const q = query(collection(db, this.collection), ...constraints);
    
    return onSnapshot(q, 
      (snapshot) => {
        let todos = snapshot.docs.map(doc => 
          this.documentToTodo(doc.id, doc.data() as TodoDocument)
        );

        // Apply search filter client-side
        if (filters?.search) {
          todos = this.filterBySearch(todos, filters.search);
        }

        callback(todos);
      },
      (error) => {
        console.error('Error in todos subscription:', error);
        
        // Handle index building errors gracefully
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.log('Firestore indexes are building, trying fallback query...');
          
          // Use a simpler query without archive filter as fallback
          const fallbackQ = query(
            collection(db, this.collection), 
            orderBy('createdAt', 'desc')
          );
          
          return onSnapshot(fallbackQ, (snapshot) => {
            let todos = snapshot.docs.map(doc => 
              this.documentToTodo(doc.id, doc.data() as TodoDocument)
            ).filter(todo => !todo.archivedAt); // Filter archived client-side

            if (filters?.search) {
              todos = this.filterBySearch(todos, filters.search);
            }

            callback(todos);
          });
        }
        
        // For other errors, return empty array
        callback([]);
      }
    );
  }

  async getTodoStats(filters?: TodoFilters): Promise<TodoStats> {
    const todos = await this.getTodos(filters);
    
    const stats: TodoStats = {
      total: todos.length,
      completed: 0,
      pending: 0,
      overdue: 0,
      dueToday: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
      byAssignee: {} as Record<FamilyMember, number>,
    };

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    todos.forEach(todo => {
      // Completion status
      if (todo.completed) {
        stats.completed++;
      } else {
        stats.pending++;
      }

      // Due date analysis
      if (todo.dueDate && !todo.completed) {
        const dueDate = new Date(todo.dueDate);
        if (dueDate < new Date()) {
          stats.overdue++;
        } else if (dueDate <= today) {
          stats.dueToday++;
        }
      }

      // Priority breakdown
      stats.byPriority[todo.priority]++;

      // Assignee breakdown
      if (todo.assignedTo) {
        stats.byAssignee[todo.assignedTo] = (stats.byAssignee[todo.assignedTo] || 0) + 1;
      }
    });

    return stats;
  }

  async bulkComplete(ids: string[]): Promise<void> {
    const batch = writeBatch(db);
    const now = Timestamp.now();

    ids.forEach(id => {
      const docRef = doc(db, this.collection, id);
      batch.update(docRef, {
        completed: true,
        completedAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const batch = writeBatch(db);

    ids.forEach(id => {
      const docRef = doc(db, this.collection, id);
      batch.delete(docRef);
    });

    await batch.commit();
  }

  async bulkArchive(ids: string[]): Promise<void> {
    const batch = writeBatch(db);
    const now = Timestamp.now();

    ids.forEach(id => {
      const docRef = doc(db, this.collection, id);
      batch.update(docRef, {
        archivedAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  async autoArchiveCompleted(): Promise<number> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const q = query(
      collection(db, this.collection),
      where('completed', '==', true),
      where('completedAt', '<=', Timestamp.fromDate(threeDaysAgo)),
      where('archivedAt', '==', null),
      limit(100) // Process in batches
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 0;
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        archivedAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
    return snapshot.size;
  }
}

export const todoService = new TodoService();
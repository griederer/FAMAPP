// Todo types shared between web and mobile apps
import type { FamilyMember } from './core';

export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'pending' | 'completed' | 'archived';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TodoPriority;
  assignedTo?: FamilyMember | null; // Family member ID or null for unassigned
  createdBy: string; // User ID of creator
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  dueDate?: Date | null;
  tags?: string[];
  archivedAt?: Date | null;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: TodoPriority;
  assignedTo?: FamilyMember | null;
  dueDate?: Date | null;
  tags?: string[];
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: TodoPriority;
  assignedTo?: FamilyMember | null;
  dueDate?: Date | null;
  tags?: string[];
}

export interface TodoFilters {
  assignedTo?: FamilyMember | null;
  completed?: boolean;
  priority?: TodoPriority;
  createdBy?: string;
  archived?: boolean;
  search?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueToday: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byAssignee: Record<FamilyMember, number>;
}

// Firestore document structure (for server communication)
export interface TodoDocument {
  title: string;
  description: string | null;
  completed: boolean;
  priority: TodoPriority;
  assignedTo: string | null; // Firebase User ID or family member ID
  createdBy: string; // Firebase User ID
  createdAt: import('firebase/firestore').Timestamp;
  updatedAt: import('firebase/firestore').Timestamp;
  completedAt: import('firebase/firestore').Timestamp | null;
  dueDate: import('firebase/firestore').Timestamp | null;
  tags: string[];
  archivedAt: import('firebase/firestore').Timestamp | null;
}

// Service layer interfaces
export interface TodoService {
  // CRUD operations
  createTodo(data: CreateTodoData): Promise<Todo>;
  getTodos(filters?: TodoFilters): Promise<Todo[]>;
  getTodo(id: string): Promise<Todo | null>;
  updateTodo(id: string, data: UpdateTodoData): Promise<Todo>;
  deleteTodo(id: string): Promise<void>;
  
  // Specialized operations
  toggleComplete(id: string): Promise<Todo>;
  archiveTodo(id: string): Promise<Todo>;
  unarchiveTodo(id: string): Promise<Todo>;
  
  // Real-time subscriptions
  subscribeTodos(
    filters: TodoFilters | undefined,
    callback: (todos: Todo[]) => void
  ): () => void; // Returns unsubscribe function
  
  // Statistics
  getTodoStats(filters?: TodoFilters): Promise<TodoStats>;
  
  // Bulk operations
  bulkComplete(ids: string[]): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
  bulkArchive(ids: string[]): Promise<void>;
  
  // Auto-archive completed todos after 3 days
  autoArchiveCompleted(): Promise<number>; // Returns count of archived todos
}
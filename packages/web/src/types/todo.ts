// TypeScript types for Todo functionality
import type { FamilyMember } from './theme';

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

// Component prop types
export interface TodoItemProps {
  todo: Todo;
  onToggleComplete?: (id: string) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
  onAssign?: (id: string, assignedTo: FamilyMember | null) => void;
  compact?: boolean;
  showAssignee?: boolean;
  showPriority?: boolean;
  showDueDate?: boolean;
  className?: string;
}

export interface TodoListProps {
  todos: Todo[];
  loading?: boolean;
  error?: string | null;
  onToggleComplete?: (id: string) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
  onAssign?: (id: string, assignedTo: FamilyMember | null) => void;
  emptyMessage?: string;
  compact?: boolean;
  className?: string;
}

export interface TodoFormProps {
  todo?: Todo; // For editing existing todo
  onSubmit: (data: CreateTodoData | UpdateTodoData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export interface TodoFiltersProps {
  filters: TodoFilters;
  onFiltersChange: (filters: TodoFilters) => void;
  stats?: TodoStats;
  className?: string;
}

// Hook return types
export interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  createTodo: (data: CreateTodoData) => Promise<void>;
  updateTodo: (id: string, data: UpdateTodoData) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  refreshTodos: () => Promise<void>;
}

export interface UseTodoFiltersReturn {
  filters: TodoFilters;
  setFilters: (filters: TodoFilters) => void;
  clearFilters: () => void;
  filteredTodos: Todo[];
  stats: TodoStats;
}
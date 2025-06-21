// Web-specific types that extend shared types
import type { Todo, CreateTodoData, UpdateTodoData, TodoFilters, TodoStats, FamilyMember } from '@famapp/shared';

// Component prop types (web-specific)
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

// Hook return types (web-specific)
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

// Layout types (web-specific)
export interface LayoutProps {
  children: React.ReactNode;
  currentModule?: string;
}

// Re-export shared types for convenience
export * from '@famapp/shared';
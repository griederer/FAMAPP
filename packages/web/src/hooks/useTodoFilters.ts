// Custom hook for managing todo filters and statistics
import { useState, useEffect, useMemo } from 'react';
import type {
  Todo,
  TodoFilters,
  TodoStats,
  UseTodoFiltersReturn,
} from '../types';

const defaultFilters: TodoFilters = {
  completed: undefined,
  assignedTo: undefined,
  priority: undefined,
  createdBy: undefined,
  archived: false, // Don't show archived by default
  search: '',
};

export function useTodoFilters(
  todos: Todo[],
  initialFilters: TodoFilters = defaultFilters
): UseTodoFiltersReturn {
  const [filters, setFilters] = useState<TodoFilters>(initialFilters);
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    dueToday: 0,
    byPriority: { high: 0, medium: 0, low: 0 },
    byAssignee: {} as any,
  });

  // Filter todos based on current filters
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // Filter by completion status
    if (filters.completed !== undefined) {
      result = result.filter(todo => todo.completed === filters.completed);
    }

    // Filter by assigned family member
    if (filters.assignedTo !== undefined) {
      result = result.filter(todo => todo.assignedTo === filters.assignedTo);
    }

    // Filter by priority
    if (filters.priority) {
      result = result.filter(todo => todo.priority === filters.priority);
    }

    // Filter by creator
    if (filters.createdBy) {
      result = result.filter(todo => todo.createdBy === filters.createdBy);
    }

    // Filter by archived status
    if (filters.archived !== undefined) {
      if (filters.archived) {
        result = result.filter(todo => todo.archivedAt !== null);
      } else {
        result = result.filter(todo => todo.archivedAt === null);
      }
    }

    // Filter by search term
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm) ||
        todo.description?.toLowerCase().includes(searchTerm) ||
        todo.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return result;
  }, [todos, filters]);

  // Calculate statistics based on filtered todos
  useEffect(() => {
    const calculateStats = (todoList: Todo[]): TodoStats => {
      const newStats: TodoStats = {
        total: todoList.length,
        completed: 0,
        pending: 0,
        overdue: 0,
        dueToday: 0,
        byPriority: { high: 0, medium: 0, low: 0 },
        byAssignee: {} as any,
      };

      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      const now = new Date();

      todoList.forEach(todo => {
        // Completion status
        if (todo.completed) {
          newStats.completed++;
        } else {
          newStats.pending++;

          // Due date analysis (only for pending todos)
          if (todo.dueDate) {
            const dueDate = new Date(todo.dueDate);
            if (dueDate < now) {
              newStats.overdue++;
            } else if (dueDate <= today) {
              newStats.dueToday++;
            }
          }
        }

        // Priority breakdown
        newStats.byPriority[todo.priority]++;

        // Assignee breakdown
        if (todo.assignedTo) {
          newStats.byAssignee[todo.assignedTo] = 
            (newStats.byAssignee[todo.assignedTo] || 0) + 1;
        }
      });

      return newStats;
    };

    setStats(calculateStats(filteredTodos));
  }, [filteredTodos]);

  // Update filters
  const updateFilters = (newFilters: TodoFilters) => {
    setFilters(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters(defaultFilters);
  };


  return {
    filters,
    setFilters: updateFilters,
    clearFilters,
    filteredTodos,
    stats,
  };
}
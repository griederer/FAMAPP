// Custom hook for managing todos with real-time updates
import { useState, useEffect, useCallback } from 'react';
import { todoService } from '@famapp/shared';
import type {
  Todo,
  CreateTodoData,
  UpdateTodoData,
  TodoFilters,
  UseTodosReturn,
} from '../types';

export function useTodos(filters?: TodoFilters): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load todos initially and set up real-time subscription
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = todoService.subscribeTodos(filters, (updatedTodos) => {
      setTodos(updatedTodos);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [filters]);

  // Create a new todo
  const createTodo = useCallback(async (data: CreateTodoData): Promise<void> => {
    try {
      setError(null);
      await todoService.createTodo(data);
      // Real-time subscription will update the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create todo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Update an existing todo
  const updateTodo = useCallback(async (id: string, data: UpdateTodoData): Promise<void> => {
    try {
      setError(null);
      await todoService.updateTodo(id, data);
      // Real-time subscription will update the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update todo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Delete a todo
  const deleteTodo = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await todoService.deleteTodo(id);
      // Real-time subscription will update the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete todo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Toggle todo completion status
  const toggleComplete = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await todoService.toggleComplete(id);
      // Real-time subscription will update the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle todo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Refresh todos manually (force reload)
  const refreshTodos = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedTodos = await todoService.getTodos(filters);
      setTodos(updatedTodos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh todos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    refreshTodos,
  };
}
// Todo module with add/edit/delete functionality
import { useState, useMemo } from 'react';
import { cn } from '../../styles/components';
import { Button, Modal, ErrorMessage } from '../ui';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';
import { FamilyMemberFilter } from './FamilyMemberFilter';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useI18n, useTodos } from '../../hooks';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import type { Todo, CreateTodoData, UpdateTodoData, TodoFilters } from '../../types/todo';
import type { FamilyMember } from '../../types/theme';

export interface TodoModuleProps {
  className?: string;
}

export const TodoModule = ({ className }: TodoModuleProps) => {
  const { t } = useI18n();
  
  // Filter state
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  
  // Build filters for real-time subscription
  const filters = useMemo((): TodoFilters | undefined => {
    if (!selectedMember) return { archived: false }; // Show only non-archived todos
    
    return {
      assignedTo: selectedMember === ('unassigned' as FamilyMember) ? null : selectedMember,
      archived: false,
    };
  }, [selectedMember]);
  
  const { todos, loading, error, toggleComplete, createTodo, updateTodo, deleteTodo } = useTodos(filters);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const openCreateModal = () => {
    setEditingTodo(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
    setFormError(null);
    setFormLoading(false);
  };

  const handleCreateTodo = async (data: CreateTodoData) => {
    setFormLoading(true);
    setFormError(null);
    
    try {
      await createTodo(data);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create todo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTodo = async (data: UpdateTodoData) => {
    if (!editingTodo) return;
    
    setFormLoading(true);
    setFormError(null);
    
    try {
      await updateTodo(editingTodo.id, data);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update todo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitForm = async (data: CreateTodoData | UpdateTodoData) => {
    if (editingTodo) {
      await handleUpdateTodo(data as UpdateTodoData);
    } else {
      await handleCreateTodo(data as CreateTodoData);
    }
  };

  const handleToggleComplete = async (todoId: string) => {
    try {
      await toggleComplete(todoId);
    } catch (err) {
      console.error('Failed to toggle todo completion:', err);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await deleteTodo(todoId);
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  const handleAssignTodo = async (todoId: string, assignedTo: FamilyMember | null) => {
    try {
      await updateTodo(todoId, { assignedTo });
    } catch (err) {
      console.error('Failed to assign todo:', err);
    }
  };

  // Separate todos by completion status
  const pendingTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  // Calculate member counts for filter (need to get all todos, not just filtered ones)
  const { todos: allTodos } = useTodos({ archived: false });
  const memberCounts = useMemo(() => {
    return allTodos.reduce((acc, todo) => {
      if (todo.assignedTo) {
        acc[todo.assignedTo] = (acc[todo.assignedTo] || 0) + 1;
      } else {
        acc['unassigned'] = (acc['unassigned'] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [allTodos]);

  // Define keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      key: 'n',
      metaKey: true,
      action: openCreateModal,
      description: 'Create new todo',
    },
    {
      key: 'f',
      metaKey: true,
      action: () => setSelectedMember(null),
      description: 'Clear filters',
    },
    {
      key: '1',
      metaKey: true,
      action: () => setSelectedMember('gonzalo'),
      description: 'Filter by Gonzalo',
    },
    {
      key: '2',
      metaKey: true,
      action: () => setSelectedMember('mpaz'),
      description: 'Filter by Mpaz',
    },
    {
      key: '3',
      metaKey: true,
      action: () => setSelectedMember('borja'),
      description: 'Filter by Borja',
    },
    {
      key: '4',
      metaKey: true,
      action: () => setSelectedMember('melody'),
      description: 'Filter by Melody',
    },
    {
      key: '?',
      metaKey: true,
      action: () => setShowShortcutsHelp(true),
      description: 'Show keyboard shortcuts',
    },
    {
      key: 'Escape',
      action: () => {
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        } else if (isModalOpen) {
          closeModal();
        } else {
          setSelectedMember(null);
        }
      },
      description: 'Close modal or clear filters',
    },
  ], [isModalOpen, showShortcutsHelp]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts,
    enabled: true, // Always enabled, we handle modal states in the actions
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('todos.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {pendingTodos.length} {t('todos.pending')} • {completedTodos.length} {t('todos.completed')}
            {selectedMember && (
              <span className="ml-2 text-primary-600 font-medium">
                ({selectedMember === ('unassigned' as FamilyMember) ? t('common.none') : t(`family.${selectedMember}`)})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowShortcutsHelp(true)}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
            title="Keyboard shortcuts (⌘+?)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Button>
          <Button
            onClick={openCreateModal}
            variant="primary"
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {t('todos.addTask')}
          </Button>
        </div>
      </div>

      {/* Family Member Filter */}
      {todos.length > 0 && (
        <FamilyMemberFilter
          selectedMember={selectedMember}
          onMemberSelect={setSelectedMember}
          showCounts={true}
          memberCounts={memberCounts}
        />
      )}

      {/* Error state */}
      {error && (
        <ErrorMessage
          title={t('todos.errorLoading')}
          message={error}
        />
      )}

      {/* Todo Lists */}
      <div className="space-y-6">
        {/* Pending todos */}
        {pendingTodos.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              {t('todos.pending')} ({pendingTodos.length})
            </h2>
            <TodoList
              todos={pendingTodos}
              onToggleComplete={handleToggleComplete}
              onEdit={openEditModal}
              onDelete={handleDeleteTodo}
              onAssign={handleAssignTodo}
              loading={loading}
            />
          </div>
        )}

        {/* Completed todos */}
        {completedTodos.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-500 mb-3">
              {t('todos.completed')} ({completedTodos.length})
            </h2>
            <TodoList
              todos={completedTodos}
              onToggleComplete={handleToggleComplete}
              onEdit={openEditModal}
              onDelete={handleDeleteTodo}
              onAssign={handleAssignTodo}
              loading={loading}
              compact={true}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && todos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedMember ? t('todos.emptyFilterTitle') : t('todos.emptyTitle')}
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {selectedMember ? t('todos.emptyFilterDescription') : t('todos.emptyDescription')}
            </p>
            {!selectedMember && (
              <Button onClick={openCreateModal} variant="primary">
                {t('todos.createFirst')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Todo Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTodo ? t('common.edit') + ' ' + t('nav.todos') : t('todos.addTask')}
        size="lg"
      >
        <TodoForm
          todo={editingTodo || undefined}
          onSubmit={handleSubmitForm}
          onCancel={closeModal}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
};
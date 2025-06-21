// TodoList component for displaying a list of todos
import { cn } from '../../styles/components';
import { TodoItem } from './TodoItem';
import { LoadingState, EmptyState, ErrorMessage } from '../ui';
import { useI18n } from '../../hooks';
import type { TodoListProps } from '../../types/todo';

export const TodoList = ({
  todos,
  loading = false,
  error = null,
  onToggleComplete,
  onEdit,
  onDelete,
  onAssign,
  emptyMessage,
  compact = false,
  className,
}: TodoListProps) => {
  const { t } = useI18n();

  if (loading) {
    return <LoadingState variant="section" />;
  }

  if (error) {
    return (
      <ErrorMessage
        variant="card"
        severity="error"
        title={t('todos.errorLoading')}
        message={error}
      />
    );
  }

  if (todos.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        }
        title={t('todos.emptyTitle')}
        description={emptyMessage || t('todos.emptyDescription')}
        action={{
          label: t('todos.createFirst'),
          onClick: () => onEdit?.(undefined as any),
        }}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onAssign={onAssign}
          compact={compact}
        />
      ))}
    </div>
  );
};
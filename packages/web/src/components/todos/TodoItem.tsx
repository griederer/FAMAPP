// TodoItem component for displaying individual todo items
import { useState, useEffect } from 'react';
import { cn } from '../../styles/components';
import { Button, StatusBadge } from '../ui';
import { QuickAssign } from './QuickAssign';
import { useI18n } from '../../hooks';
import type { TodoItemProps } from '../../types/todo';
import type { FamilyMember } from '../../types/theme';

export const TodoItem = ({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
  onAssign,
  compact = false,
  showAssignee = true,
  showPriority = true,
  showDueDate = true,
  className,
}: TodoItemProps) => {
  const { t, formatDate } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleToggleComplete = async () => {
    if (isToggling) return; // Prevent double-clicks
    
    setIsToggling(true);
    
    // Show immediate visual feedback
    const wasCompleted = todo.completed;
    
    // If completing task, show celebration
    if (!wasCompleted) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 600);
    }
    
    try {
      await onToggleComplete?.(todo.id);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      // Could add error toast here
    } finally {
      // Small delay to ensure smooth animation
      setTimeout(() => setIsToggling(false), 200);
    }
  };

  const handleEdit = () => {
    onEdit?.(todo);
  };

  const handleDelete = () => {
    if (window.confirm(t('todos.confirmDelete'))) {
      onDelete?.(todo.id);
    }
  };

  const handleAssign = (member: FamilyMember | null) => {
    onAssign?.(todo.id, member);
  };

  const priorityColors = {
    low: 'info',
    medium: 'warning',
    high: 'error',
  } as const;

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
  
  // Animation effect for completion celebration
  useEffect(() => {
    if (showCelebration) {
      // Trigger any additional celebration effects here
      const timer = setTimeout(() => setShowCelebration(false), 600);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  return (
    <div
      className={cn(
        'group relative bg-white rounded-xl border transition-all duration-300 ease-in-out',
        'transform hover:translate-y-0.5 hover:shadow-md',
        todo.completed
          ? 'border-gray-200 opacity-80 scale-98'
          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm scale-100',
        isToggling && 'scale-102 shadow-lg',
        showCelebration && 'ring-2 ring-green-200 shadow-green-100',
        compact ? 'p-3' : 'p-4',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Animated Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isToggling}
          className={cn(
            'relative mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'transform hover:scale-110 active:scale-95',
            isToggling && 'animate-pulse',
            showCelebration && 'animate-bounce',
            todo.completed
              ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
              : 'bg-white border-gray-300 hover:border-primary-400 hover:shadow-sm'
          )}
          aria-label={todo.completed ? t('todos.markIncomplete') : t('todos.markComplete')}
        >
          {/* Checkmark with animation */}
          <svg
            className={cn(
              'w-3 h-3 mx-auto transition-all duration-200',
              todo.completed 
                ? 'opacity-100 scale-100 rotate-0' 
                : 'opacity-0 scale-50 rotate-12'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          
          {/* Celebration sparkle effect */}
          {showCelebration && (
            <div className="absolute -top-1 -right-1 text-yellow-400 animate-ping">
              ✨
            </div>
          )}
        </button>

        {/* Content with completion animations */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3
                className={cn(
                  'text-base font-medium transition-all duration-500 ease-in-out',
                  todo.completed
                    ? 'text-gray-500 line-through opacity-75 transform translate-x-1'
                    : 'text-gray-900 opacity-100 transform translate-x-0',
                  isToggling && 'transition-all duration-300'
                )}
              >
                {todo.title}
              </h3>

              {todo.description && !compact && (
                <p
                  className={cn(
                    'mt-1 text-sm transition-all duration-500 ease-in-out',
                    todo.completed 
                      ? 'text-gray-400 opacity-60 transform translate-x-1' 
                      : 'text-gray-600 opacity-100 transform translate-x-0'
                  )}
                >
                  {todo.description}
                </p>
              )}

              {/* Metadata with fade animation */}
              <div className={cn(
                'mt-2 flex flex-wrap items-center gap-2 transition-all duration-500',
                todo.completed ? 'opacity-50' : 'opacity-100'
              )}>
                {showAssignee && (
                  <QuickAssign
                    currentAssignee={todo.assignedTo}
                    onAssign={handleAssign}
                    compact={compact}
                    disabled={todo.completed}
                  />
                )}

                {showPriority && (
                  <StatusBadge
                    variant={priorityColors[todo.priority]}
                  >
                    {t(`todos.priority.${todo.priority}`)}
                  </StatusBadge>
                )}

                {showDueDate && todo.dueDate && (
                  <span
                    className={cn(
                      'text-xs',
                      isOverdue
                        ? 'text-error-600 font-medium'
                        : 'text-gray-500'
                    )}
                  >
                    {isOverdue && '⚠️ '}
                    {formatDate(new Date(todo.dueDate), { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                )}

                {todo.tags && todo.tags.length > 0 && (
                  <div className="flex gap-1">
                    {todo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {(isHovered || compact) && (
              <div className="flex items-center gap-1 ml-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t('common.edit')}
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-error-600 hover:text-error-700"
                    aria-label={t('common.delete')}
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completed state overlay with animation */}
      <div className={cn(
        'absolute inset-0 bg-gray-100 rounded-xl pointer-events-none transition-all duration-500',
        todo.completed ? 'opacity-10' : 'opacity-0'
      )} />
      
      {/* Completion celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl pointer-events-none animate-pulse opacity-20" />
      )}
    </div>
  );
};
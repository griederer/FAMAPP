// Bulk actions component for todos
import { useState } from 'react';
import { cn } from '../../styles/components';
import { Button, Modal } from '../ui';
import { FamilyMemberFilter } from './FamilyMemberFilter';
import { useI18n } from '../../hooks';
import type { FamilyMember } from '../../types/theme';
import type { Todo } from '../../types/todo';

export interface BulkActionsProps {
  selectedTodos: Todo[];
  onBulkAssign: (todoIds: string[], assignedTo: FamilyMember | null) => Promise<void>;
  onBulkComplete: (todoIds: string[], completed: boolean) => Promise<void>;
  onBulkDelete: (todoIds: string[]) => Promise<void>;
  onClearSelection: () => void;
  loading?: boolean;
  className?: string;
}

export const BulkActions = ({
  selectedTodos,
  onBulkAssign,
  onBulkComplete,
  onBulkDelete,
  onClearSelection,
  loading = false,
  className,
}: BulkActionsProps) => {
  const { t } = useI18n();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedIds = selectedTodos.map(todo => todo.id);
  const completedCount = selectedTodos.filter(todo => todo.completed).length;
  const pendingCount = selectedTodos.length - completedCount;

  const handleBulkAssign = async (member: FamilyMember | null) => {
    setIsLoading(true);
    try {
      await onBulkAssign(selectedIds, member);
      setIsAssignModalOpen(false);
      onClearSelection();
    } catch (err) {
      console.error('Failed to bulk assign:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkComplete = async () => {
    setIsLoading(true);
    try {
      await onBulkComplete(selectedIds, true);
      onClearSelection();
    } catch (err) {
      console.error('Failed to bulk complete:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkIncomplete = async () => {
    setIsLoading(true);
    try {
      await onBulkComplete(selectedIds, false);
      onClearSelection();
    } catch (err) {
      console.error('Failed to bulk mark incomplete:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      t('todos.confirmBulkDelete', { count: selectedTodos.length })
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await onBulkDelete(selectedIds);
      onClearSelection();
    } catch (err) {
      console.error('Failed to bulk delete:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedTodos.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn(
        'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40',
        'bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3',
        'flex items-center gap-3',
        className
      )}>
        {/* Selection info */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">{selectedTodos.length}</span> selected
        </div>

        <div className="h-4 w-px bg-gray-300" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Assign */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            disabled={loading || isLoading}
            className="text-xs"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Assign
          </Button>

          {/* Complete */}
          {pendingCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkComplete}
              disabled={loading || isLoading}
              className="text-xs text-green-600 hover:text-green-700"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Complete
            </Button>
          )}

          {/* Mark incomplete */}
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkIncomplete}
              disabled={loading || isLoading}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Reopen
            </Button>
          )}

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkDelete}
            disabled={loading || isLoading}
            className="text-xs text-error-600 hover:text-error-700"
          >
            <svg
              className="w-4 h-4 mr-1"
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
            Delete
          </Button>

          <div className="h-4 w-px bg-gray-300" />

          {/* Clear selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={loading || isLoading}
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign ${selectedTodos.length} todo${selectedTodos.length > 1 ? 's' : ''}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a family member to assign to the selected todos:
          </p>
          
          <FamilyMemberFilter
            selectedMember={null}
            onMemberSelect={handleBulkAssign}
            showCounts={false}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
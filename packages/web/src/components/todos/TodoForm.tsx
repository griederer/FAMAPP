// TodoForm component for creating and editing todos
import { useState, useEffect } from 'react';
import { cn } from '../../styles/components';
import { Button, Input, FamilySelector, LoadingSpinner } from '../ui';
import { useI18n } from '../../hooks';
import type { TodoFormProps, CreateTodoData, UpdateTodoData, TodoPriority } from '../../types/todo';
import type { FamilyMember } from '../../types/theme';

export const TodoForm = ({
  todo,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  className,
}: TodoFormProps) => {
  const { t } = useI18n();
  const isEditing = !!todo;

  // Form state
  const [formData, setFormData] = useState({
    title: todo?.title || '',
    description: todo?.description || '',
    priority: todo?.priority || 'medium' as TodoPriority,
    assignedTo: todo?.assignedTo ? [todo.assignedTo] : [] as FamilyMember[],
    dueDate: todo?.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
    tags: todo?.tags?.join(', ') || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when todo changes
  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title,
        description: todo.description || '',
        priority: todo.priority,
        assignedTo: todo.assignedTo ? [todo.assignedTo] : [],
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
        tags: todo.tags?.join(', ') || '',
      });
    }
  }, [todo]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = t('todos.validation.titleRequired');
    } else if (formData.title.length > 200) {
      errors.title = t('todos.validation.titleTooLong');
    }

    if (formData.description.length > 1000) {
      errors.description = t('todos.validation.descriptionTooLong');
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date(new Date().toDateString())) {
      errors.dueDate = t('todos.validation.dueDatePast');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: CreateTodoData | UpdateTodoData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      assignedTo: formData.assignedTo[0] || null,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    };

    try {
      await onSubmit(data);
    } catch (err) {
      // Error handling is done by the parent component
    }
  };

  const priorityOptions: { value: TodoPriority; label: string; color: string }[] = [
    { value: 'low', label: t('todos.priority.low'), color: 'text-blue-600' },
    { value: 'medium', label: t('todos.priority.medium'), color: 'text-yellow-600' },
    { value: 'high', label: t('todos.priority.high'), color: 'text-red-600' },
  ];

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Title */}
      <div>
        <Input
          label={t('todos.form.title')}
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={validationErrors.title}
          placeholder={t('todos.form.titlePlaceholder')}
          required
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description-input" className="block text-sm font-medium text-gray-700 mb-1">
          {t('todos.form.description')}
        </label>
        <textarea
          id="description-input"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={t('todos.form.descriptionPlaceholder')}
          rows={3}
          disabled={loading}
          className={cn(
            'w-full px-4 py-2 border rounded-xl transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            validationErrors.description
              ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
              : 'border-gray-300 hover:border-gray-400'
          )}
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-error-600" role="alert">
            {validationErrors.description}
          </p>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('todos.form.priority')}
        </label>
        <div className="flex gap-2">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('priority', option.value)}
              disabled={loading}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl border-2 font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                formData.priority === option.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 focus:ring-primary-500'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:ring-gray-500',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className={cn('mr-1', option.color)}>
                {option.value === 'high' ? '🔴' : option.value === 'medium' ? '🟡' : '🔵'}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assign to */}
      <div>
        <FamilySelector
          label={t('todos.form.assignTo')}
          selected={formData.assignedTo}
          onSelectionChange={(members) => handleInputChange('assignedTo', members)}
          variant="grid"
          disabled={loading}
        />
      </div>

      {/* Due date */}
      <div>
        <Input
          type="date"
          label={t('todos.form.dueDate')}
          value={formData.dueDate}
          onChange={(e) => handleInputChange('dueDate', e.target.value)}
          error={validationErrors.dueDate}
          min={new Date().toISOString().split('T')[0]}
          disabled={loading}
        />
      </div>

      {/* Tags */}
      <div>
        <Input
          label={t('todos.form.tags')}
          value={formData.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          placeholder={t('todos.form.tagsPlaceholder')}
          helperText={t('todos.form.tagsHelper')}
          disabled={loading}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-xl">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              {isEditing ? t('todos.form.saving') : t('todos.form.creating')}
            </>
          ) : (
            isEditing ? t('todos.form.save') : t('todos.form.create')
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
};
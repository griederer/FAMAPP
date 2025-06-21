// TodoForm component tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { TodoForm } from './TodoForm';
import type { Todo } from '../../types/todo';

const mockTodo: Todo = {
  id: '1',
  title: 'Test Todo',
  description: 'Test description',
  completed: false,
  priority: 'medium',
  assignedTo: 'gonzalo',
  dueDate: new Date('2024-12-31'),
  tags: ['test', 'example'],
  createdBy: 'gonzalo',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TodoForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <TodoForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/priority/i)).toBeInTheDocument();
    expect(screen.getByText(/create todo/i)).toBeInTheDocument();
  });

  it('renders edit form with existing todo', () => {
    render(
      <TodoForm
        todo={mockTodo}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByDisplayValue('Test Todo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByText(/save changes/i)).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    render(
      <TodoForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const titleInput = screen.getByLabelText(/title/i);
    const submitButton = screen.getByText(/create todo/i);

    fireEvent.change(titleInput, { target: { value: 'New Todo' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Todo',
        description: undefined,
        priority: 'medium',
        assignedTo: null,
        dueDate: null,
        tags: [],
      });
    });
  });

  it('shows validation error for empty title', async () => {
    render(
      <TodoForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    // Try to submit form with empty title
    const submitButton = screen.getByText(/create todo/i);
    fireEvent.click(submitButton);

    // Wait for validation error to appear
    await waitFor(() => {
      // Look for the validation error text directly
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles cancel button click', () => {
    render(
      <TodoForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(
      <TodoForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />,
    );

    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeDisabled();
  });

  it('shows error message', () => {
    const errorMessage = 'Something went wrong';
    
    render(
      <TodoForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        error={errorMessage}
      />,
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles priority selection', () => {
    render(
      <TodoForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const highPriorityButton = screen.getByText(/high/i);
    fireEvent.click(highPriorityButton);

    // Check if high priority button is selected (has primary styling)
    expect(highPriorityButton).toHaveClass('border-primary-500');
  });

  it('handles tags input', async () => {
    render(
      <TodoForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const titleInput = screen.getByLabelText(/title/i);
    const tagsInput = screen.getByLabelText(/tags/i);
    const submitButton = screen.getByText(/create todo/i);

    fireEvent.change(titleInput, { target: { value: 'Test Todo' } });
    fireEvent.change(tagsInput, { target: { value: 'urgent, work, home' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['urgent', 'work', 'home'],
        })
      );
    });
  });
});
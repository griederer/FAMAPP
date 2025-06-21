// TodoItem component tests focusing on animations and toggle functionality
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { TodoItem } from './TodoItem';
import type { Todo } from '../../types/todo';

const mockTodo: Todo = {
  id: '1',
  title: 'Test Todo',
  description: 'Test description',
  completed: false,
  priority: 'medium',
  assignedTo: 'gonzalo',
  dueDate: new Date('2024-12-31'),
  tags: ['test'],
  createdBy: 'gonzalo',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const completedTodo: Todo = {
  ...mockTodo,
  completed: true,
};

describe('TodoItem Animations', () => {
  const mockOnToggleComplete = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnAssign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders incomplete todo correctly', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    expect(screen.getByText('Test Todo')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByLabelText(/mark as complete/i)).toBeInTheDocument();
  });

  it('renders completed todo with different styling', () => {
    render(
      <TodoItem
        todo={completedTodo}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    const title = screen.getByText('Test Todo');
    expect(title).toHaveClass('line-through');
    expect(title).toHaveClass('text-gray-500');
    expect(screen.getByLabelText(/mark as incomplete/i)).toBeInTheDocument();
  });

  it('calls onToggleComplete when checkbox is clicked', async () => {
    mockOnToggleComplete.mockResolvedValue(undefined);
    
    render(
      <TodoItem
        todo={mockTodo}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    const checkbox = screen.getByLabelText(/mark as complete/i);
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnToggleComplete).toHaveBeenCalledWith('1');
    });
  });

  it('shows celebration animation when completing todo', async () => {
    mockOnToggleComplete.mockResolvedValue(undefined);
    
    render(
      <TodoItem
        todo={mockTodo}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    const checkbox = screen.getByLabelText(/mark as complete/i);
    fireEvent.click(checkbox);

    // Check if celebration sparkle appears
    await waitFor(() => {
      expect(screen.getByText('✨')).toBeInTheDocument();
    });
  });

  it('prevents double clicks during toggle operation', async () => {
    // Simulate slow async operation
    mockOnToggleComplete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <TodoItem
        todo={mockTodo}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    const checkbox = screen.getByLabelText(/mark as complete/i);
    
    // Click multiple times quickly
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);

    // Should only call once
    await waitFor(() => {
      expect(mockOnToggleComplete).toHaveBeenCalledTimes(1);
    });
  });
});
// TodoModule component tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { TodoModule } from './TodoModule';
import * as useTodosModule from '../../hooks/useTodos';

// Mock the useTodos hook
const mockUseTodos = vi.fn();
vi.mock('../../hooks/useTodos', () => ({
  useTodos: (filters?: any) => mockUseTodos(filters),
}));

describe('TodoModule', () => {
  const mockTodos = [
    {
      id: '1',
      title: 'Todo 1',
      completed: false,
      assignedTo: 'gonzalo',
      priority: 'medium',
      createdBy: 'gonzalo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Todo 2',
      completed: false,
      assignedTo: 'mpaz',
      priority: 'high',
      createdBy: 'mpaz',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockUseTodos.mockReturnValue({
      todos: mockTodos,
      loading: false,
      error: null,
      createTodo: vi.fn(),
      updateTodo: vi.fn(),
      deleteTodo: vi.fn(),
      toggleComplete: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render todos correctly', () => {
    render(<TodoModule />);
    
    expect(screen.getByText('Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Todo 2')).toBeInTheDocument();
  });

  it('should apply filters when family member is selected', async () => {
    render(<TodoModule />);
    
    // Click on a family member filter
    const gonzaloFilter = screen.getByText('Gonzalo');
    fireEvent.click(gonzaloFilter);
    
    // Verify that useTodos was called with the correct filter
    await waitFor(() => {
      expect(mockUseTodos).toHaveBeenCalledWith({
        assignedTo: 'gonzalo',
        archived: false,
      });
    });
  });

  it('should show empty state when no todos match filter', () => {
    // Mock empty todos
    mockUseTodos.mockReturnValue({
      todos: [],
      loading: false,
      error: null,
      createTodo: vi.fn(),
      updateTodo: vi.fn(),
      deleteTodo: vi.fn(),
      toggleComplete: vi.fn(),
    });

    render(<TodoModule />);
    
    expect(screen.getByText('No todos yet')).toBeInTheDocument();
  });
});
// Tests for TodoItem component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { TodoItem } from './TodoItem';
import type { Todo } from '../../types/todo';

const mockTodo: Todo = {
  id: '1',
  title: 'Test todo item',
  description: 'This is a test description',
  completed: false,
  priority: 'medium',
  assignedTo: 'gonzalo',
  createdBy: 'user123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  dueDate: new Date('2024-01-15'),
  tags: ['test', 'sample'],
};

describe('TodoItem', () => {
  const mockHandlers = {
    onToggleComplete: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAssign: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render todo item with title', () => {
    render(<TodoItem todo={mockTodo} />);
    
    expect(screen.getByText('Test todo item')).toBeInTheDocument();
  });

  it('should render description when not compact', () => {
    render(<TodoItem todo={mockTodo} />);
    
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should not render description when compact', () => {
    render(<TodoItem todo={mockTodo} compact />);
    
    expect(screen.queryByText('This is a test description')).not.toBeInTheDocument();
  });

  it('should show assignee tag', () => {
    render(<TodoItem todo={mockTodo} />);
    
    expect(screen.getByText('Gonzalo')).toBeInTheDocument();
  });

  it('should show priority badge', () => {
    render(<TodoItem todo={mockTodo} />);
    
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should show due date', () => {
    render(<TodoItem todo={mockTodo} />);
    
    expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
  });

  it('should show tags', () => {
    render(<TodoItem todo={mockTodo} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('sample')).toBeInTheDocument();
  });

  it('should handle toggle complete', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    const checkbox = screen.getByLabelText(/mark as complete/i);
    fireEvent.click(checkbox);
    
    expect(mockHandlers.onToggleComplete).toHaveBeenCalledWith('1');
  });

  it('should show completed state', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(<TodoItem todo={completedTodo} />);
    
    const title = screen.getByText('Test todo item');
    expect(title).toHaveClass('line-through', 'text-gray-500');
  });

  it('should show edit button on hover', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    const container = screen.getByText('Test todo item').closest('.group');
    fireEvent.mouseEnter(container!);
    
    const editButton = screen.getByLabelText(/edit/i);
    expect(editButton).toBeInTheDocument();
    
    fireEvent.click(editButton);
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTodo);
  });

  it('should show delete button on hover', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    const container = screen.getByText('Test todo item').closest('.group');
    fireEvent.mouseEnter(container!);
    
    const deleteButton = screen.getByLabelText(/delete/i);
    expect(deleteButton).toBeInTheDocument();
  });

  it('should confirm before deleting', () => {
    window.confirm = vi.fn().mockReturnValue(true);
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    const container = screen.getByText('Test todo item').closest('.group');
    fireEvent.mouseEnter(container!);
    
    const deleteButton = screen.getByLabelText(/delete/i);
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this todo?');
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
  });

  it('should cancel delete when not confirmed', () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    const container = screen.getByText('Test todo item').closest('.group');
    fireEvent.mouseEnter(container!);
    
    const deleteButton = screen.getByLabelText(/delete/i);
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockHandlers.onDelete).not.toHaveBeenCalled();
  });

  it('should show overdue indicator', () => {
    const overdueTodo = { 
      ...mockTodo, 
      dueDate: new Date('2020-01-01'), // Past date
      completed: false 
    };
    render(<TodoItem todo={overdueTodo} />);
    
    const dueDateText = screen.getByText(/Jan 1/);
    expect(dueDateText).toHaveClass('text-error-600');
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should not show overdue for completed todos', () => {
    const completedOverdueTodo = { 
      ...mockTodo, 
      dueDate: new Date('2020-01-01'), 
      completed: true 
    };
    render(<TodoItem todo={completedOverdueTodo} />);
    
    const dueDateText = screen.getByText(/Jan 1/);
    expect(dueDateText).not.toHaveClass('text-error-600');
  });

  it('should apply custom className', () => {
    render(<TodoItem todo={mockTodo} className="custom-class" />);
    
    const container = screen.getByText('Test todo item').closest('.group');
    expect(container).toHaveClass('custom-class');
  });

  it('should hide elements based on props', () => {
    render(
      <TodoItem 
        todo={mockTodo} 
        showAssignee={false}
        showPriority={false}
        showDueDate={false}
      />
    );
    
    expect(screen.queryByText('Gonzalo')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();
    expect(screen.queryByText(/Jan 15/)).not.toBeInTheDocument();
  });
});
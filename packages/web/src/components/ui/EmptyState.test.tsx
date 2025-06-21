// Tests for EmptyState component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('should render with default content', () => {
    render(<EmptyState />);
    
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    
    // Should have default icon
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('should render with custom title and description', () => {
    render(
      <EmptyState 
        title="No items found" 
        description="Try adding some items to get started." 
      />
    );
    
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adding some items to get started.')).toBeInTheDocument();
  });

  it('should render custom icon', () => {
    const customIcon = <div data-testid="custom-icon">📁</div>;
    
    render(
      <EmptyState 
        icon={customIcon}
        title="Custom Empty State" 
      />
    );
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('should render different variants', () => {
    const { rerender } = render(
      <EmptyState 
        title="Empty" 
        variant="default" 
      />
    );
    
    let container = screen.getByRole('status');
    expect(container).toHaveClass('min-h-[300px]');

    rerender(
      <EmptyState 
        title="Empty" 
        variant="minimal" 
      />
    );
    
    container = screen.getByRole('status');
    expect(container).toHaveClass('min-h-[200px]');

    rerender(
      <EmptyState 
        title="Empty" 
        variant="illustration" 
      />
    );
    
    container = screen.getByRole('status');
    expect(container).toHaveClass('min-h-[400px]');
  });

  it('should render action button', () => {
    const mockAction = vi.fn();
    
    render(
      <EmptyState 
        title="No items"
        action={{
          label: 'Add Item',
          onClick: mockAction,
          variant: 'primary'
        }}
      />
    );
    
    const button = screen.getByText('Add Item');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary-600', 'text-white');
    
    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should render secondary action button', () => {
    const mockAction = vi.fn();
    
    render(
      <EmptyState 
        title="No items"
        action={{
          label: 'Learn More',
          onClick: mockAction,
          variant: 'secondary'
        }}
      />
    );
    
    const button = screen.getByText('Learn More');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-gray-100', 'text-gray-700');
    
    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should apply different text sizes based on variant', () => {
    const { rerender } = render(
      <EmptyState 
        title="Test Title" 
        description="Test description"
        variant="minimal" 
      />
    );
    
    expect(screen.getByText('Test Title')).toHaveClass('text-base');
    expect(screen.getByText('Test description')).toHaveClass('text-sm');

    rerender(
      <EmptyState 
        title="Test Title" 
        description="Test description"
        variant="default" 
      />
    );
    
    expect(screen.getByText('Test Title')).toHaveClass('text-lg');
    expect(screen.getByText('Test description')).toHaveClass('text-base');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <EmptyState 
        title="No data" 
        description="Nothing to show here" 
      />
    );
    
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'No data');
  });

  it('should apply custom className', () => {
    render(
      <EmptyState 
        title="Empty" 
        className="custom-empty-state" 
      />
    );
    
    expect(screen.getByRole('status')).toHaveClass('custom-empty-state');
  });

  it('should handle illustration variant with custom styling', () => {
    render(
      <EmptyState 
        title="No items" 
        variant="illustration"
      />
    );
    
    // Should have larger container
    const container = screen.getByRole('status');
    expect(container).toHaveClass('min-h-[400px]', 'p-12');
    
    // Icon should be in a rounded background
    const iconContainer = container.querySelector('.w-24.h-24.bg-gray-100.rounded-full');
    expect(iconContainer).toBeInTheDocument();
  });
});
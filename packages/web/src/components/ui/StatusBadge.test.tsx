// Tests for StatusBadge component
import { render, screen } from '../../utils/testUtils';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('should render badge with default props', () => {
    render(<StatusBadge>Default</StatusBadge>);
    
    const badge = screen.getByText('Default');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should render different variants', () => {
    const { rerender } = render(<StatusBadge variant="success">Success</StatusBadge>);
    
    let badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-success-100', 'text-success-800');

    rerender(<StatusBadge variant="warning">Warning</StatusBadge>);
    badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-warning-100', 'text-warning-800');

    rerender(<StatusBadge variant="error">Error</StatusBadge>);
    badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-error-100', 'text-error-800');

    rerender(<StatusBadge variant="info">Info</StatusBadge>);
    badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');

    rerender(<StatusBadge variant="neutral">Neutral</StatusBadge>);
    badge = screen.getByText('Neutral');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should render different sizes', () => {
    const { rerender } = render(<StatusBadge size="sm">Small</StatusBadge>);
    
    let badge = screen.getByText('Small');
    expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5');

    rerender(<StatusBadge size="md">Medium</StatusBadge>);
    badge = screen.getByText('Medium');
    expect(badge).toHaveClass('text-xs', 'px-2.5', 'py-1');

    rerender(<StatusBadge size="lg">Large</StatusBadge>);
    badge = screen.getByText('Large');
    expect(badge).toHaveClass('text-sm', 'px-3', 'py-1.5');
  });

  it('should render with icon', () => {
    const icon = <span data-testid="test-icon">🎉</span>;
    render(<StatusBadge icon={icon}>With Icon</StatusBadge>);
    
    expect(screen.getByText('With Icon')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('should render as dot variant', () => {
    render(<StatusBadge dot variant="success">Dot Badge</StatusBadge>);
    
    const badge = screen.getByText('Dot Badge');
    expect(badge).toBeInTheDocument();
    
    // Should have a dot indicator
    const dotContainer = badge.closest('span');
    const dot = dotContainer?.querySelector('.w-2.h-2');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('bg-success-500');
  });

  it('should apply custom className', () => {
    render(<StatusBadge className="custom-badge">Custom</StatusBadge>);
    
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-badge');
  });

  it('should handle different content types', () => {
    const { rerender } = render(<StatusBadge>Text Content</StatusBadge>);
    
    expect(screen.getByText('Text Content')).toBeInTheDocument();

    rerender(
      <StatusBadge>
        <span>Complex Content</span>
      </StatusBadge>
    );
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument();
  });

  it('should have proper accessibility', () => {
    render(<StatusBadge variant="error">Error Status</StatusBadge>);
    
    const badge = screen.getByText('Error Status');
    expect(badge).toBeInTheDocument();
    
    // Should be readable by screen readers
    expect(badge).toHaveTextContent('Error Status');
  });

  it('should combine dot and icon properly', () => {
    const icon = <span data-testid="icon">⚠️</span>;
    render(
      <StatusBadge 
        variant="warning" 
        dot 
        icon={icon}
      >
        Warning with dot and icon
      </StatusBadge>
    );
    
    expect(screen.getByText('Warning with dot and icon')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    
    // Should have both dot and icon
    const container = screen.getByText('Warning with dot and icon').closest('span');
    const dot = container?.querySelector('.w-2.h-2');
    expect(dot).toBeInTheDocument();
  });

  it('should render empty badge with just dot', () => {
    render(<StatusBadge variant="success" dot />);
    
    // Should render just the dot without text
    const dot = document.querySelector('.w-2.h-2.bg-success-500');
    expect(dot).toBeInTheDocument();
  });
});
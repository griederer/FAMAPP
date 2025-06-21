// Tests for LoadingSpinner component
import { render, screen } from '../../utils/testUtils';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render default spinner variant', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should render dots variant', () => {
    render(<LoadingSpinner variant="dots" />);
    
    const status = screen.getByRole('status', { name: /loading/i });
    expect(status).toBeInTheDocument();
    
    // Should have 3 dots
    const dots = status.querySelectorAll('div > div');
    expect(dots).toHaveLength(3);
  });

  it('should render pulse variant', () => {
    render(<LoadingSpinner variant="pulse" />);
    
    const spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-pulse');
  });

  it('should render bars variant', () => {
    render(<LoadingSpinner variant="bars" />);
    
    const status = screen.getByRole('status', { name: /loading/i });
    expect(status).toBeInTheDocument();
    
    // Should have 4 bars
    const bars = status.querySelectorAll('div > div');
    expect(bars).toHaveLength(4);
  });

  it('should handle different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="xs" />);
    expect(screen.getByRole('status')).toHaveClass('w-3', 'h-3');

    rerender(<LoadingSpinner size="xl" />);
    expect(screen.getByRole('status')).toHaveClass('w-12', 'h-12');
  });

  it('should handle different colors', () => {
    const { rerender } = render(<LoadingSpinner color="white" />);
    expect(screen.getByRole('status')).toHaveClass('text-white');

    rerender(<LoadingSpinner color="gray" />);
    expect(screen.getByRole('status')).toHaveClass('text-gray-600');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });
});
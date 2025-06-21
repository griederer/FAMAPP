// Tests for LoadingState component
import { render, screen } from '../../utils/testUtils';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('should render default loading state', () => {
    render(<LoadingState />);
    
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render different variants', () => {
    const { rerender } = render(<LoadingState variant="page" />);
    
    let container = screen.getByRole('status');
    expect(container).toHaveClass('min-h-screen');

    rerender(<LoadingState variant="section" />);
    container = screen.getByRole('status');
    expect(container).toHaveClass('min-h-[200px]');

    rerender(<LoadingState variant="overlay" />);
    container = screen.getByRole('status');
    expect(container).toHaveClass('absolute', 'inset-0', 'z-50');
  });

  it('should render custom message', () => {
    render(<LoadingState message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should hide message when showMessage is false', () => {
    render(<LoadingState showMessage={false} />);
    
    const textElement = screen.queryByText(/loading/i);
    expect(textElement).not.toBeInTheDocument();
  });

  it('should render skeleton loader when skeleton is true', () => {
    render(<LoadingState skeleton={true} />);
    
    // Skeleton doesn't have role="status", just check for the animate-pulse class
    const skeletonContainer = document.querySelector('.animate-pulse');
    expect(skeletonContainer).toBeInTheDocument();
    expect(skeletonContainer).toHaveClass('animate-pulse');
  });

  it('should handle different sizes', () => {
    const { rerender } = render(<LoadingState size="sm" />);
    
    // Spinner should be present for all sizes
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingState size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LoadingState className="custom-loading" />);
    
    const status = screen.getByRole('status');
    expect(status).toHaveClass('custom-loading');
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingState message="Loading content" />);
    
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'Loading content');
  });

  describe('SkeletonLoader', () => {
    it('should render skeleton content', () => {
      render(<LoadingState skeleton={true} variant="section" />);
      
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('animate-pulse');
      
      // Should have skeleton elements (gray backgrounds)
      const skeletonElements = container?.querySelectorAll('.bg-gray-200');
      expect(skeletonElements).toBeDefined();
      expect(skeletonElements!.length).toBeGreaterThan(0);
    });

    it('should render different skeleton variants', () => {
      const { rerender } = render(<LoadingState skeleton={true} variant="page" />);
      
      let container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('min-h-screen');

      rerender(<LoadingState skeleton={true} variant="overlay" />);
      container = document.querySelector('.absolute.inset-0.z-50');
      expect(container).toBeInTheDocument();
    });
  });
});
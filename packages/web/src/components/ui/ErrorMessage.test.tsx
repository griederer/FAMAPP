// Tests for ErrorMessage component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('should render with title and message', () => {
    render(
      <ErrorMessage 
        title="Error Title" 
        message="Error message description" 
      />
    );
    
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error message description')).toBeInTheDocument();
  });

  it('should render different severity variants', () => {
    const { rerender } = render(
      <ErrorMessage 
        message="Test message" 
        severity="error" 
      />
    );
    
    let alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-error-50', 'border-error-200');

    rerender(
      <ErrorMessage 
        message="Test message" 
        severity="warning" 
      />
    );
    
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-warning-50', 'border-warning-200');

    rerender(
      <ErrorMessage 
        message="Test message" 
        severity="info" 
      />
    );
    
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-primary-50', 'border-primary-200');
  });

  it('should render different variants', () => {
    const { rerender } = render(
      <ErrorMessage 
        message="Test message" 
        variant="inline" 
      />
    );
    
    let alert = screen.getByRole('alert');
    expect(alert).toHaveClass('p-3');

    rerender(
      <ErrorMessage 
        message="Test message" 
        variant="card" 
      />
    );
    
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('p-4', 'shadow-sm');

    rerender(
      <ErrorMessage 
        message="Test message" 
        variant="banner" 
      />
    );
    
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('p-4', 'rounded-none', 'border-x-0');
  });

  it('should hide icon when showIcon is false', () => {
    render(
      <ErrorMessage 
        message="Test message" 
        showIcon={false} 
      />
    );
    
    const icon = screen.queryByRole('img', { hidden: true });
    expect(icon).not.toBeInTheDocument();
  });

  it('should render action buttons', () => {
    const mockAction1 = vi.fn();
    const mockAction2 = vi.fn();

    render(
      <ErrorMessage 
        message="Test message"
        actions={[
          { label: 'Retry', onClick: mockAction1, variant: 'primary' },
          { label: 'Cancel', onClick: mockAction2, variant: 'secondary' }
        ]}
      />
    );
    
    const retryButton = screen.getByText('Retry');
    const cancelButton = screen.getByText('Cancel');
    
    expect(retryButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    fireEvent.click(cancelButton);
    
    expect(mockAction1).toHaveBeenCalledTimes(1);
    expect(mockAction2).toHaveBeenCalledTimes(1);
  });

  it('should render dismiss button when dismissable', () => {
    const mockDismiss = vi.fn();

    render(
      <ErrorMessage 
        message="Test message"
        dismissable={true}
        onDismiss={mockDismiss}
      />
    );
    
    const dismissButton = screen.getByLabelText(/dismiss/i);
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ErrorMessage 
        title="Error" 
        message="Something went wrong" 
      />
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('should apply custom className', () => {
    render(
      <ErrorMessage 
        message="Test message" 
        className="custom-class" 
      />
    );
    
    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });
});
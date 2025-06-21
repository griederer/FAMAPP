// Tests for Input component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { Input } from './Input';

describe('Input', () => {
  it('should render input with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('border-gray-300');
  });

  it('should render with label', () => {
    render(<Input label="Username" />);
    
    const label = screen.getByText('Username');
    const input = screen.getByLabelText('Username');
    
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });

  it('should render with placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('should handle value changes', () => {
    const handleChange = vi.fn();
    render(<Input value="" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'test value'
        })
      })
    );
  });

  it('should render different input types', () => {
    const { rerender } = render(<Input type="email" />);
    
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    input = screen.getByLabelText(/password/i) || screen.getByDisplayValue('') || document.querySelector('input[type="password"]');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input type="number" />);
    input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should show error state', () => {
    render(<Input error="This field is required" />);
    
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByText('This field is required');
    
    expect(input).toHaveClass('border-error-300');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-error-600');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should render different sizes', () => {
    const { rerender } = render(<Input size="sm" />);
    
    let input = screen.getByRole('textbox');
    expect(input).toHaveClass('text-sm', 'px-3', 'py-1.5');

    rerender(<Input size="md" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('text-base', 'px-4', 'py-2');

    rerender(<Input size="lg" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('text-lg', 'px-5', 'py-3');
  });

  it('should render with helper text', () => {
    render(<Input helperText="This is a helper message" />);
    
    const helperText = screen.getByText('This is a helper message');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-gray-600');
  });

  it('should apply custom className', () => {
    render(<Input className="custom-input" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('should handle focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should be required when required prop is true', () => {
    render(<Input required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Input 
        label="Email" 
        error="Invalid email" 
        helperText="Enter your email address"
        required
      />
    );
    
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByText('Invalid email');
    
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });
});
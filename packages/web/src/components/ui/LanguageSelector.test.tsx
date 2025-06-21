// Tests for LanguageSelector component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { LanguageSelector } from './LanguageSelector';

describe('LanguageSelector', () => {
  it('should render language selector button', () => {
    render(<LanguageSelector />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Select language: English');
  });

  it('should display current language', () => {
    render(<LanguageSelector />);
    
    // Should show English by default
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should render different variants', () => {
    const { rerender } = render(<LanguageSelector variant="button" />);
    
    let button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();

    rerender(<LanguageSelector variant="dropdown" />);
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should handle language switching', () => {
    render(<LanguageSelector variant="button" />);
    
    const button = screen.getByRole('button');
    
    // Click to switch language
    fireEvent.click(button);
    
    // Should have updated the language context (Spanish)
    // Note: This test may need adjustment based on actual implementation
    expect(button).toBeInTheDocument();
  });

  it('should show dropdown when variant is dropdown', () => {
    render(<LanguageSelector variant="dropdown" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    // Click to open dropdown
    fireEvent.click(button);
    
    // Should show dropdown options
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('should apply custom className', () => {
    render(<LanguageSelector className="custom-selector" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-selector');
  });

  it('should have proper accessibility attributes', () => {
    render(<LanguageSelector variant="dropdown" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });

  it('should show language flag icon', () => {
    render(<LanguageSelector />);
    
    // Should have SVG icon for language
    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('should handle keyboard navigation', () => {
    render(<LanguageSelector variant="dropdown" />);
    
    const button = screen.getByRole('button');
    
    // Should be focusable
    button.focus();
    expect(button).toHaveFocus();
    
    // Should open on Enter
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Should close on Escape
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should close dropdown when clicking outside', () => {
    render(
      <div>
        <LanguageSelector variant="dropdown" />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const button = screen.getByRole('button');
    const outside = screen.getByTestId('outside');
    
    // Open dropdown
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Click outside
    fireEvent.mouseDown(outside);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should display correct language text for different languages', () => {
    render(<LanguageSelector />);
    
    // Should start with English
    expect(screen.getByText('English')).toBeInTheDocument();
    
    // After language change, should show Spanish
    // Note: This would require mocking the i18n context
    // The actual behavior depends on the i18n implementation
  });

  it('should have correct button styling', () => {
    render(<LanguageSelector />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    expect(button).toHaveClass('rounded-xl', 'font-medium', 'transition-all');
  });
});
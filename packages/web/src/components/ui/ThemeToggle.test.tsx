// Tests for ThemeToggle component
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, // Default to light mode
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
  });

  it('should render button variant by default', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
  });

  it('should render dropdown variant', () => {
    renderWithTheme(<ThemeToggle variant="dropdown" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveAttribute('aria-label', 'Select theme');
  });

  it('should cycle through themes when button is clicked', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Initial state should be system (with light resolved)
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('System'));
    
    // Click to go to light
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Light'));
    
    // Click to go to dark
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Dark'));
    
    // Click to go back to system
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('System'));
  });

  it('should handle dropdown selection', () => {
    renderWithTheme(<ThemeToggle variant="dropdown" />);
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    // Change to dark
    fireEvent.change(select, { target: { value: 'dark' } });
    expect(select.value).toBe('dark');
    
    // Change to light
    fireEvent.change(select, { target: { value: 'light' } });
    expect(select.value).toBe('light');
  });

  it('should show correct icon for light theme', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Click to get to light theme
    fireEvent.click(button);
    
    // Should contain sun icon (light theme icon)
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should show system indicator when in system mode', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Initial state should be system
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('System'));
    
    // Should have indicator dot for system mode
    const indicator = button.querySelector('.bg-primary-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should include screen reader text for themes', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Should have descriptive aria-label
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Current theme'));
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Click to cycle'));
  });

  it('should apply custom className', () => {
    renderWithTheme(<ThemeToggle className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should show theme name on larger screens', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    const hiddenText = button.querySelector('.hidden.sm\\:inline');
    
    expect(hiddenText).toBeInTheDocument();
  });
});
// Tests for Navigation component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { Navigation } from './Navigation';

describe('Navigation', () => {
  const mockOnModuleChange = vi.fn();

  beforeEach(() => {
    mockOnModuleChange.mockClear();
  });

  it('should render all navigation items', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockOnModuleChange} 
      />
    );

    expect(screen.getByText('To-Do')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should highlight current module', () => {
    render(
      <Navigation 
        currentModule="calendar" 
        onModuleChange={mockOnModuleChange} 
      />
    );

    const calendarButton = screen.getByRole('button', { name: /calendar/i });
    expect(calendarButton).toHaveAttribute('aria-current', 'page');
  });

  it('should call onModuleChange when navigation item is clicked', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockOnModuleChange} 
      />
    );

    const calendarButton = screen.getByRole('button', { name: /calendar/i });
    fireEvent.click(calendarButton);

    expect(mockOnModuleChange).toHaveBeenCalledWith('calendar');
  });

  it('should show badges for navigation items', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockOnModuleChange} 
      />
    );

    // Check for todo badge (should show 3)
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Check for calendar badge (should show 1)
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should handle disabled navigation items', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockOnModuleChange} 
      />
    );

    // All navigation items should be enabled by default in our current setup
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should render desktop and mobile versions', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockOnModuleChange} 
      />
    );

    // Desktop navigation should be hidden on mobile (md:flex class)
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // Should render navigation items for both desktop and mobile
    const todoButtons = screen.getAllByText('To-Do');
    expect(todoButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('should show correct icons for each module', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockOnModuleChange} 
      />
    );

    // All navigation items should have SVG icons
    const svgs = screen.getAllByRole('img', { hidden: true });
    expect(svgs.length).toBeGreaterThanOrEqual(3); // At least 3 icons for 3 modules
  });

  it('should apply custom className', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockOnModuleChange}
        className="custom-nav-class"
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-nav-class');
  });
});
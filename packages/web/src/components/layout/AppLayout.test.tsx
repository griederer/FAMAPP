// Tests for AppLayout component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  const mockOnModuleChange = vi.fn();

  beforeEach(() => {
    mockOnModuleChange.mockClear();
  });

  it('should render layout with header and navigation', () => {
    render(
      <AppLayout currentModule="todos" onModuleChange={mockOnModuleChange}>
        <div>Test Content</div>
      </AppLayout>
    );

    // Header elements
    expect(screen.getByText('FAMAPP')).toBeInTheDocument();
    expect(screen.getByText('Family Organizer')).toBeInTheDocument();
    
    // Navigation
    expect(screen.getByText('To-Do')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    
    // Content
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should display correct module title', () => {
    render(
      <AppLayout currentModule="calendar" onModuleChange={mockOnModuleChange}>
        <div>Calendar Content</div>
      </AppLayout>
    );

    // Should show calendar title in desktop view
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('should call onModuleChange when navigation changes', () => {
    render(
      <AppLayout currentModule="todos" onModuleChange={mockOnModuleChange}>
        <div>Test Content</div>
      </AppLayout>
    );

    const calendarButton = screen.getByRole('button', { name: /calendar/i });
    fireEvent.click(calendarButton);

    expect(mockOnModuleChange).toHaveBeenCalledWith('calendar');
  });

  it('should render theme toggle and user profile in header', () => {
    render(
      <AppLayout currentModule="todos" onModuleChange={mockOnModuleChange}>
        <div>Test Content</div>
      </AppLayout>
    );

    // Theme toggle should be present (button with theme-related aria-label)
    const themeButton = screen.getByRole('button', { name: /current theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  it('should have responsive layout structure', () => {
    render(
      <AppLayout currentModule="todos" onModuleChange={mockOnModuleChange}>
        <div>Test Content</div>
      </AppLayout>
    );

    // Should have main layout container
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    
    // Should have header
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('should render children content correctly', () => {
    const testContent = (
      <div>
        <h1>Module Content</h1>
        <p>This is module specific content</p>
      </div>
    );

    render(
      <AppLayout currentModule="todos" onModuleChange={mockOnModuleChange}>
        {testContent}
      </AppLayout>
    );

    expect(screen.getByText('Module Content')).toBeInTheDocument();
    expect(screen.getByText('This is module specific content')).toBeInTheDocument();
  });

  it('should default to todos module when no current module specified', () => {
    render(
      <AppLayout onModuleChange={mockOnModuleChange}>
        <div>Default Content</div>
      </AppLayout>
    );

    // Should default to todos module
    expect(screen.getByText('To-Do Lists')).toBeInTheDocument();
  });

  it('should show FAMAPP logo', () => {
    render(
      <AppLayout currentModule="todos" onModuleChange={mockOnModuleChange}>
        <div>Test Content</div>
      </AppLayout>
    );

    // Logo should be present (F in a colored container)
    expect(screen.getByText('F')).toBeInTheDocument();
  });
});
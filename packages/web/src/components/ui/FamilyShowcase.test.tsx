// Tests for FamilyShowcase component
import { render, screen } from '../../utils/testUtils';
import { FamilyShowcase } from './FamilyShowcase';

describe('FamilyShowcase', () => {
  it('should render all family components', () => {
    render(<FamilyShowcase />);
    
    // Should render the showcase container
    const showcase = screen.getByText(/family components showcase/i);
    expect(showcase).toBeInTheDocument();
  });

  it('should display family tags section', () => {
    render(<FamilyShowcase />);
    
    // Should show section heading
    expect(screen.getByText(/family tags/i)).toBeInTheDocument();
    
    // Should show family member tags
    expect(screen.getByText(/gonzalo/i)).toBeInTheDocument();
    expect(screen.getByText(/mpaz/i)).toBeInTheDocument();
  });

  it('should display family avatars section', () => {
    render(<FamilyShowcase />);
    
    // Should show section heading
    expect(screen.getByText(/family avatars/i)).toBeInTheDocument();
    
    // Should show avatars with different types
    const avatars = screen.getAllByRole('img', { hidden: true });
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('should display family selector section', () => {
    render(<FamilyShowcase />);
    
    // Should show section heading
    expect(screen.getByText(/family selector/i)).toBeInTheDocument();
    
    // Should show selector components
    const selectors = screen.getAllByRole('button');
    expect(selectors.length).toBeGreaterThan(0);
  });

  it('should show different tag variants', () => {
    render(<FamilyShowcase />);
    
    // Should show different tag styles
    const showcase = document.querySelector('.space-y-8');
    expect(showcase).toBeInTheDocument();
    
    // Should have multiple tag examples
    const tags = screen.getAllByText(/gonzalo/i);
    expect(tags.length).toBeGreaterThan(1); // Multiple variants
  });

  it('should show different avatar variants', () => {
    render(<FamilyShowcase />);
    
    // Should show emoji avatars
    expect(screen.getByText('👨‍💻')).toBeInTheDocument();
    expect(screen.getByText('👩‍🏫')).toBeInTheDocument();
    
    // Should show different sizes
    const avatarContainers = document.querySelectorAll('.w-6, .w-8, .w-10, .w-12');
    expect(avatarContainers.length).toBeGreaterThan(0);
  });

  it('should show different selector variants', () => {
    render(<FamilyShowcase />);
    
    // Should show grid selector
    const gridSelector = document.querySelector('.grid');
    expect(gridSelector).toBeInTheDocument();
    
    // Should show family member selection options
    const familyButtons = screen.getAllByRole('button');
    const familyMemberButtons = familyButtons.filter(button => 
      button.textContent?.includes('Gonzalo') || 
      button.textContent?.includes('Mpaz') ||
      button.textContent?.includes('Melody') ||
      button.textContent?.includes('Borja')
    );
    expect(familyMemberButtons.length).toBeGreaterThan(0);
  });

  it('should be responsive and well-structured', () => {
    render(<FamilyShowcase />);
    
    // Should have proper spacing and layout
    const sections = document.querySelectorAll('.space-y-4, .space-y-6, .space-y-8');
    expect(sections.length).toBeGreaterThan(0);
    
    // Should have grid layouts for responsive design
    const grids = document.querySelectorAll('.grid');
    expect(grids.length).toBeGreaterThan(0);
  });

  it('should display proper headings and descriptions', () => {
    render(<FamilyShowcase />);
    
    // Should have main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
    
    // Should have section headings
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings.length).toBeGreaterThan(2);
  });

  it('should showcase interactive elements', () => {
    render(<FamilyShowcase />);
    
    // Should have clickable elements
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Interactive tags should be present
    const interactiveElements = document.querySelectorAll('[role="button"]');
    expect(interactiveElements.length).toBeGreaterThan(0);
  });

  it('should have proper accessibility', () => {
    render(<FamilyShowcase />);
    
    // Should have proper heading structure
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    
    // Should have proper ARIA labels
    const avatars = screen.getAllByRole('img', { hidden: true });
    avatars.forEach(avatar => {
      expect(avatar).toHaveAttribute('aria-label');
    });
  });
});
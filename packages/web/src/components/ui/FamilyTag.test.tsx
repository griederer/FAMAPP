// Tests for FamilyTag component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { FamilyTag } from './FamilyTag';

describe('FamilyTag', () => {
  it('should render family member name', () => {
    render(<FamilyTag member="gonzalo" />);
    
    expect(screen.getByText('Gonzalo')).toBeInTheDocument();
  });

  it('should show avatar by default', () => {
    render(<FamilyTag member="mpaz" />);
    
    expect(screen.getByRole('img', { name: /mpaz avatar/i })).toBeInTheDocument();
  });

  it('should hide avatar when showAvatar is false', () => {
    render(<FamilyTag member="borja" showAvatar={false} />);
    
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Borja')).toBeInTheDocument();
  });

  it('should show role when showRole is true', () => {
    render(<FamilyTag member="melody" showRole />);
    
    expect(screen.getByText('Melody')).toBeInTheDocument();
    expect(screen.getByText('Daughter')).toBeInTheDocument();
  });

  it('should handle different variants', () => {
    const { rerender } = render(<FamilyTag member="gonzalo" variant="compact" />);
    let tag = screen.getByText('Gonzalo').closest('span');
    expect(tag).toHaveClass('bg-gray-100');

    rerender(<FamilyTag member="gonzalo" variant="pill" />);
    tag = screen.getByText('Gonzalo').closest('span');
    expect(tag).toHaveClass('rounded-full');

    rerender(<FamilyTag member="gonzalo" variant="minimal" />);
    tag = screen.getByText('Gonzalo').closest('span');
    expect(tag).toHaveClass('bg-transparent');
  });

  it('should be interactive when specified', () => {
    const handleClick = vi.fn();
    render(
      <FamilyTag 
        member="gonzalo" 
        interactive 
        onClick={handleClick}
      />
    );
    
    const tag = screen.getByRole('button');
    fireEvent.click(tag);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should support keyboard interaction', () => {
    const handleClick = vi.fn();
    render(
      <FamilyTag 
        member="mpaz" 
        interactive 
        onClick={handleClick}
      />
    );
    
    const tag = screen.getByRole('button');
    fireEvent.keyDown(tag, { key: 'Enter' });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle different avatar types', () => {
    render(<FamilyTag member="gonzalo" avatarType="initials" />);
    
    // Should find the avatar with initials
    expect(screen.getByText('GO')).toBeInTheDocument();
  });

  it('should handle different sizes', () => {
    const { rerender } = render(<FamilyTag member="borja" size="sm" />);
    let tag = screen.getByText('Borja').closest('span');
    expect(tag).toHaveClass('text-xs', 'px-1.5', 'py-0.5');

    rerender(<FamilyTag member="borja" size="lg" />);
    tag = screen.getByText('Borja').closest('span');
    expect(tag).toHaveClass('text-sm', 'px-2.5', 'py-1.5');
  });

  it('should show emoji in minimal variant when avatar is enabled', () => {
    render(<FamilyTag member="melody" variant="minimal" showAvatar />);
    
    expect(screen.getByRole('img', { name: /melody avatar/i })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<FamilyTag member="gonzalo" className="custom-tag" />);
    
    const tag = screen.getByText('Gonzalo').closest('span');
    expect(tag).toHaveClass('custom-tag');
  });

  it('should return null for invalid member', () => {
    render(<FamilyTag member={'invalid' as any} />);
    
    expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
  });

  it('should have proper aria-label', () => {
    render(<FamilyTag member="gonzalo" showRole />);
    
    expect(screen.getByLabelText('Gonzalo - Dad')).toBeInTheDocument();
  });

  it('should not be interactive by default', () => {
    render(<FamilyTag member="mpaz" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
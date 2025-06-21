// Tests for FamilyAvatar component
import { render, screen, fireEvent } from '../../utils/testUtils';
import { FamilyAvatar } from './FamilyAvatar';

describe('FamilyAvatar', () => {
  it('should render emoji avatar by default', () => {
    render(<FamilyAvatar member="gonzalo" />);
    
    expect(screen.getByRole('img', { name: /gonzalo avatar/i })).toBeInTheDocument();
  });

  it('should render initials avatar', () => {
    render(<FamilyAvatar member="gonzalo" type="initials" />);
    
    expect(screen.getByText('GO')).toBeInTheDocument();
  });

  it('should render photo placeholder', () => {
    render(<FamilyAvatar member="mpaz" type="photo" />);
    
    // Photo type renders an SVG placeholder
    const svg = screen.getByRole('img').parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should show status indicator when enabled', () => {
    render(<FamilyAvatar member="borja" showStatus status="online" />);
    
    const statusIndicator = screen.getByTitle('Status: online');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('bg-success-500');
  });

  it('should handle different sizes correctly', () => {
    const { rerender } = render(<FamilyAvatar member="melody" size="xs" />);
    let avatar = screen.getByLabelText(/melody/i);
    expect(avatar).toHaveClass('w-6', 'h-6');

    rerender(<FamilyAvatar member="melody" size="2xl" />);
    avatar = screen.getByLabelText(/melody/i);
    expect(avatar).toHaveClass('w-20', 'h-20');
  });

  it('should be clickable when onClick is provided', () => {
    const handleClick = vi.fn();
    render(<FamilyAvatar member="gonzalo" onClick={handleClick} />);
    
    const avatar = screen.getByRole('button');
    fireEvent.click(avatar);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should support keyboard navigation when clickable', () => {
    const handleClick = vi.fn();
    render(<FamilyAvatar member="gonzalo" onClick={handleClick} />);
    
    const avatar = screen.getByRole('button');
    fireEvent.keyDown(avatar, { key: 'Enter' });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should display member role in aria-label', () => {
    render(<FamilyAvatar member="mpaz" />);
    
    expect(screen.getByLabelText('Mpaz (Mom)')).toBeInTheDocument();
  });

  it('should return null for invalid member', () => {
    // TypeScript would prevent this, but testing runtime safety
    render(<FamilyAvatar member={'invalid' as any} />);
    
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<FamilyAvatar member="borja" className="custom-avatar" />);
    
    const avatar = screen.getByLabelText(/borja/i);
    expect(avatar).toHaveClass('custom-avatar');
  });

  it('should show different status colors', () => {
    const { rerender } = render(
      <FamilyAvatar member="gonzalo" showStatus status="online" />
    );
    expect(screen.getByTitle('Status: online')).toHaveClass('bg-success-500');

    rerender(<FamilyAvatar member="gonzalo" showStatus status="busy" />);
    expect(screen.getByTitle('Status: busy')).toHaveClass('bg-error-500');

    rerender(<FamilyAvatar member="gonzalo" showStatus status="away" />);
    expect(screen.getByTitle('Status: away')).toHaveClass('bg-warning-500');

    rerender(<FamilyAvatar member="gonzalo" showStatus status="offline" />);
    expect(screen.getByTitle('Status: offline')).toHaveClass('bg-gray-400');
  });
});
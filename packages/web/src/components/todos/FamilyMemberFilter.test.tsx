// FamilyMemberFilter component tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../utils/testUtils';
import { FamilyMemberFilter } from './FamilyMemberFilter';
import type { FamilyMember } from '../../types/theme';

describe('FamilyMemberFilter', () => {
  const mockOnMemberSelect = vi.fn();
  const mockMemberCounts = {
    gonzalo: 3,
    mpaz: 2,
    borja: 1,
    melody: 0,
    unassigned: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all family members', () => {
    render(
      <FamilyMemberFilter
        onMemberSelect={mockOnMemberSelect}
        showCounts={true}
        memberCounts={mockMemberCounts}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Gonzalo')).toBeInTheDocument();
    expect(screen.getByText('Mpaz')).toBeInTheDocument();
    expect(screen.getByText('Borja')).toBeInTheDocument();
    expect(screen.getByText('Melody')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('shows counts when enabled', () => {
    render(
      <FamilyMemberFilter
        onMemberSelect={mockOnMemberSelect}
        showCounts={true}
        memberCounts={mockMemberCounts}
      />
    );

    expect(screen.getByText('(3)')).toBeInTheDocument(); // Gonzalo
    expect(screen.getAllByText('(2)')).toHaveLength(2); // Mpaz and unassigned
    expect(screen.getByText('(1)')).toBeInTheDocument(); // Borja
    expect(screen.getByText('(0)')).toBeInTheDocument(); // Melody
  });

  it('calls onMemberSelect when family member is clicked', () => {
    render(
      <FamilyMemberFilter
        onMemberSelect={mockOnMemberSelect}
        memberCounts={mockMemberCounts}
      />
    );

    const gonzaloButton = screen.getByText('Gonzalo').closest('button');
    fireEvent.click(gonzaloButton!);

    expect(mockOnMemberSelect).toHaveBeenCalledWith('gonzalo');
  });

  it('calls onMemberSelect with null when All is clicked', () => {
    render(
      <FamilyMemberFilter
        onMemberSelect={mockOnMemberSelect}
        memberCounts={mockMemberCounts}
      />
    );

    const allButton = screen.getByText('All').closest('button');
    fireEvent.click(allButton!);

    expect(mockOnMemberSelect).toHaveBeenCalledWith(null);
  });

  it('shows selected member with different styling', () => {
    render(
      <FamilyMemberFilter
        selectedMember={'gonzalo' as FamilyMember}
        onMemberSelect={mockOnMemberSelect}
        memberCounts={mockMemberCounts}
      />
    );

    const gonzaloButton = screen.getByText('Gonzalo').closest('button');
    expect(gonzaloButton).toHaveClass('bg-primary-100');
  });

  it('disables members with zero count', () => {
    render(
      <FamilyMemberFilter
        onMemberSelect={mockOnMemberSelect}
        showCounts={true}
        memberCounts={mockMemberCounts}
      />
    );

    const melodyButton = screen.getByText('Melody').closest('button');
    expect(melodyButton).toBeDisabled();
    expect(melodyButton).toHaveClass('opacity-50');
  });

  it('deselects member when same member is clicked again', () => {
    render(
      <FamilyMemberFilter
        selectedMember={'gonzalo' as FamilyMember}
        onMemberSelect={mockOnMemberSelect}
        memberCounts={mockMemberCounts}
      />
    );

    const gonzaloButton = screen.getByText('Gonzalo').closest('button');
    fireEvent.click(gonzaloButton!);

    expect(mockOnMemberSelect).toHaveBeenCalledWith(null);
  });
});
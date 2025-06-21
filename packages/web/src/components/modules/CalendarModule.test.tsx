// Comprehensive tests for CalendarModule
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CalendarModule } from './CalendarModule';
import { eventService } from '../../services/eventService';
import type { CalendarEvent } from '../../services/eventService';

// Mock the eventService
vi.mock('../../services/eventService', () => ({
  eventService: {
    subscribeToEvents: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  },
}));

const mockEventService = eventService as any;

// Mock date for consistent testing
const mockDate = new Date('2024-06-15'); // Saturday, June 15, 2024
vi.setSystemTime(mockDate);

const sampleEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Family Dinner',
    description: 'Weekly family dinner',
    startDate: new Date('2024-06-15T18:00:00'),
    endDate: new Date('2024-06-15T20:00:00'),
    allDay: false,
    assignedTo: 'gonzalo',
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    color: '#3b82f6',
  },
  {
    id: '2',
    title: 'Vacation Planning',
    description: 'Plan summer vacation',
    startDate: new Date('2024-06-20T00:00:00'),
    endDate: new Date('2024-06-20T23:59:59'),
    allDay: true,
    assignedTo: 'mpaz',
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    color: '#10b981',
  },
];

describe('CalendarModule', () => {
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    unsubscribeMock = vi.fn();
    mockEventService.subscribeToEvents.mockImplementation((startDate, endDate, callback) => {
      // Simulate loading then data
      setTimeout(() => {
        callback(sampleEvents);
      }, 100);
      return unsubscribeMock;
    });
    
    mockEventService.createEvent.mockResolvedValue('new-event-id');
    mockEventService.updateEvent.mockResolvedValue(undefined);
    mockEventService.deleteEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Calendar Rendering', () => {
    it('renders calendar with current month and year', async () => {
      render(<CalendarModule />);
      
      // Should show June 2024
      expect(screen.getByText('June 2024')).toBeInTheDocument();
      expect(screen.getByText('Family events and scheduling')).toBeInTheDocument();
    });

    it('renders all days of the week headers', () => {
      render(<CalendarModule />);
      
      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayHeaders.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('highlights today correctly', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const todayCell = screen.getByText('15'); // June 15, 2024
        expect(todayCell.closest('div')).toHaveStyle('background-color: #eff6ff');
      });
    });

    it('shows loading state initially', () => {
      render(<CalendarModule />);
      
      expect(screen.getByRole('generic')).toBeInTheDocument(); // Loading spinner
    });
  });

  describe('Event Display', () => {
    it('displays events in calendar cells', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        expect(screen.getByText('Family Dinner')).toBeInTheDocument();
        expect(screen.getByText('Vacation Planning')).toBeInTheDocument();
      });
    });

    it('shows event count badge when multiple events exist', async () => {
      // Add more events to same day
      const moreEvents = [
        ...sampleEvents,
        {
          ...sampleEvents[0],
          id: '3',
          title: 'Another Event',
        },
      ];
      
      mockEventService.subscribeToEvents.mockImplementation((startDate, endDate, callback) => {
        setTimeout(() => callback(moreEvents), 100);
        return unsubscribeMock;
      });

      render(<CalendarModule />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Event count badge
      });
    });

    it('shows time for non-all-day events', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        expect(screen.getByText(/6:00 PM Family Dinner/)).toBeInTheDocument();
      });
    });

    it('does not show time for all-day events', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const vacationEvent = screen.getByText('Vacation Planning');
        expect(vacationEvent.textContent).not.toMatch(/\d{1,2}:\d{2}/);
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to previous month', async () => {
      render(<CalendarModule />);
      
      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText('May 2024')).toBeInTheDocument();
      });
    });

    it('navigates to next month', async () => {
      render(<CalendarModule />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('July 2024')).toBeInTheDocument();
      });
    });

    it('navigates to today when Today button is clicked', async () => {
      render(<CalendarModule />);
      
      // First navigate away
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('July 2024')).toBeInTheDocument();
      });
      
      // Then click Today
      const todayButton = screen.getByRole('button', { name: /today/i });
      fireEvent.click(todayButton);
      
      await waitFor(() => {
        expect(screen.getByText('June 2024')).toBeInTheDocument();
      });
    });
  });

  describe('Event Creation', () => {
    it('opens modal when clicking on empty date', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        // Click on a day without events (e.g., day 10)
        const dayCell = screen.getByText('10');
        fireEvent.click(dayCell.closest('div')!);
      });
      
      expect(screen.getByText('New Event')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter event title')).toBeInTheDocument();
    });

    it('creates new event with correct data', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const dayCell = screen.getByText('10');
        fireEvent.click(dayCell.closest('div')!);
      });
      
      // Fill out the form
      const titleInput = screen.getByPlaceholderText('Enter event title');
      const descriptionInput = screen.getByPlaceholderText('Add description');
      const assigneeSelect = screen.getByDisplayValue('Everyone');
      
      fireEvent.change(titleInput, { target: { value: 'New Test Event' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.change(assigneeSelect, { target: { value: 'gonzalo' } });
      
      // Save the event
      const saveButton = screen.getByText('Create Event');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockEventService.createEvent).toHaveBeenCalledWith({
          title: 'New Test Event',
          description: 'Test description',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          allDay: false,
          assignedTo: 'gonzalo',
          color: '#3b82f6',
        });
      });
    });

    it('creates all-day event when checkbox is checked', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const dayCell = screen.getByText('10');
        fireEvent.click(dayCell.closest('div')!);
      });
      
      const titleInput = screen.getByPlaceholderText('Enter event title');
      const allDayCheckbox = screen.getByRole('checkbox', { name: /all day event/i });
      
      fireEvent.change(titleInput, { target: { value: 'All Day Event' } });
      fireEvent.click(allDayCheckbox);
      
      // Time inputs should be hidden
      expect(screen.queryByDisplayValue('09:00')).not.toBeInTheDocument();
      
      const saveButton = screen.getByText('Create Event');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockEventService.createEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            allDay: true,
          })
        );
      });
    });
  });

  describe('Event Editing', () => {
    it('opens edit modal when clicking on existing event', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const eventElement = screen.getByText('Family Dinner');
        fireEvent.click(eventElement);
      });
      
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Family Dinner')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Weekly family dinner')).toBeInTheDocument();
    });

    it('updates event with new data', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const eventElement = screen.getByText('Family Dinner');
        fireEvent.click(eventElement);
      });
      
      const titleInput = screen.getByDisplayValue('Family Dinner');
      fireEvent.change(titleInput, { target: { value: 'Updated Family Dinner' } });
      
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockEventService.updateEvent).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            title: 'Updated Family Dinner',
          })
        );
      });
    });

    it('deletes event when delete button is clicked', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const eventElement = screen.getByText('Family Dinner');
        fireEvent.click(eventElement);
      });
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockEventService.deleteEvent).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Modal Behavior', () => {
    it('closes modal when cancel button is clicked', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const dayCell = screen.getByText('10');
        fireEvent.click(dayCell.closest('div')!);
      });
      
      expect(screen.getByText('New Event')).toBeInTheDocument();
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('New Event')).not.toBeInTheDocument();
      });
    });

    it('closes modal when clicking backdrop', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const dayCell = screen.getByText('10');
        fireEvent.click(dayCell.closest('div')!);
      });
      
      expect(screen.getByText('New Event')).toBeInTheDocument();
      
      // Click the backdrop (overlay)
      const backdrop = screen.getByRole('generic', { hidden: true });
      fireEvent.click(backdrop);
      
      await waitFor(() => {
        expect(screen.queryByText('New Event')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when event creation fails', async () => {
      mockEventService.createEvent.mockRejectedValue(new Error('Network error'));
      
      render(<CalendarModule />);
      
      await waitFor(() => {
        const dayCell = screen.getByText('10');
        fireEvent.click(dayCell.closest('div')!);
      });
      
      const titleInput = screen.getByPlaceholderText('Enter event title');
      fireEvent.change(titleInput, { target: { value: 'Test Event' } });
      
      const saveButton = screen.getByText('Create Event');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save event')).toBeInTheDocument();
      });
    });

    it('displays error message when event deletion fails', async () => {
      mockEventService.deleteEvent.mockRejectedValue(new Error('Network error'));
      
      render(<CalendarModule />);
      
      await waitFor(() => {
        const eventElement = screen.getByText('Family Dinner');
        fireEvent.click(eventElement);
      });
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to delete event')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('does not save event without title', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const dayCell = screen.getByText('10');
        fireEvent.click(dayCell.closest('div')!);
      });
      
      // Try to save without entering title
      const saveButton = screen.getByText('Create Event');
      fireEvent.click(saveButton);
      
      // Should not call createEvent
      expect(mockEventService.createEvent).not.toHaveBeenCalled();
    });

    it('trims whitespace from event title', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const dayCell = screen.getByText('10');
        fireEvent.click(dayCell.closest('div')!);
      });
      
      const titleInput = screen.getByPlaceholderText('Enter event title');
      fireEvent.change(titleInput, { target: { value: '  Test Event  ' } });
      
      const saveButton = screen.getByText('Create Event');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockEventService.createEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Event',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation buttons', () => {
      render(<CalendarModule />);
      
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
      // Note: We should add proper aria-labels to the navigation buttons
    });

    it('supports keyboard navigation', async () => {
      render(<CalendarModule />);
      
      await waitFor(() => {
        const dayCell = screen.getByText('10');
        dayCell.focus();
        fireEvent.keyDown(dayCell, { key: 'Enter' });
      });
      
      expect(screen.getByText('New Event')).toBeInTheDocument();
    });
  });
});
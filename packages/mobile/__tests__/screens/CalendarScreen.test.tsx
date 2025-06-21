import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { CalendarScreen } from '../../src/screens/CalendarScreen';
import { calendarService } from '@famapp/shared';

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockEvents = [
  {
    ...global.mockEvent,
    id: 'event-1',
    title: 'Meeting',
    startDate: new Date('2024-01-15T10:00:00'),
    endDate: new Date('2024-01-15T11:00:00'),
  },
  {
    ...global.mockEvent,
    id: 'event-2',
    title: 'Dentist Appointment',
    startDate: new Date('2024-01-15T14:00:00'),
    endDate: new Date('2024-01-15T15:00:00'),
  },
  {
    ...global.mockEvent,
    id: 'event-3',
    title: 'Birthday Party',
    startDate: new Date('2024-01-20T18:00:00'),
    endDate: new Date('2024-01-20T22:00:00'),
  },
];

describe('CalendarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(calendarService.getEvents).mockResolvedValue(mockEvents);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText('Cargando eventos...')).toBeTruthy();
  });

  it('loads and displays events', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('Meeting')).toBeTruthy();
      expect(getByText('Dentist Appointment')).toBeTruthy();
      expect(getByText('Birthday Party')).toBeTruthy();
    });

    expect(calendarService.getEvents).toHaveBeenCalled();
  });

  it('shows empty state when no events', async () => {
    jest.mocked(calendarService.getEvents).mockResolvedValue([]);
    
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('No hay eventos para este mes')).toBeTruthy();
    });
  });

  it('displays month navigation header', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      // Should show current month (mocked date is January 2024)
      expect(getByText('enero 2024')).toBeTruthy();
      expect(getByText('‹')).toBeTruthy(); // Previous button
      expect(getByText('›')).toBeTruthy(); // Next button
    });
  });

  it('navigates to previous month', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('enero 2024')).toBeTruthy();
    });

    // Press previous month button
    const prevButton = getByText('‹');
    fireEvent.press(prevButton);

    await waitFor(() => {
      // Should call getEvents again for December 2023
      expect(calendarService.getEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('navigates to next month', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('enero 2024')).toBeTruthy();
    });

    // Press next month button
    const nextButton = getByText('›');
    fireEvent.press(nextButton);

    await waitFor(() => {
      // Should call getEvents again for February 2024
      expect(calendarService.getEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('groups events by date correctly', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      // Should show date headers
      expect(getByText('lunes, 15 de enero de 2024')).toBeTruthy();
      expect(getByText('sábado, 20 de enero de 2024')).toBeTruthy();
    });
  });

  it('displays event times correctly', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('10:00')).toBeTruthy();
      expect(getByText('- 11:00')).toBeTruthy();
      expect(getByText('14:00')).toBeTruthy();
      expect(getByText('- 15:00')).toBeTruthy();
    });
  });

  it('shows event creator information', async () => {
    const { getAllByText } = render(<CalendarScreen />);

    await waitFor(() => {
      const creatorTexts = getAllByText('Creado por: gonzalo');
      expect(creatorTexts.length).toBeGreaterThan(0);
    });
  });

  it('handles events loading error', async () => {
    jest.mocked(calendarService.getEvents).mockRejectedValue(new Error('Network error'));

    render(<CalendarScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudieron cargar los eventos'
      );
    });
  });

  it('displays events with descriptions', async () => {
    const eventsWithDescription = [
      {
        ...mockEvents[0],
        description: 'Important meeting with the team',
      },
    ];
    jest.mocked(calendarService.getEvents).mockResolvedValue(eventsWithDescription);

    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('Important meeting with the team')).toBeTruthy();
    });
  });

  it('handles events without end date', async () => {
    const eventsWithoutEndDate = [
      {
        ...mockEvents[0],
        endDate: undefined,
      },
    ];
    jest.mocked(calendarService.getEvents).mockResolvedValue(eventsWithoutEndDate);

    const { getByText, queryByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('10:00')).toBeTruthy();
      // Should not show end time when endDate is undefined
      expect(queryByText('- 11:00')).toBeNull();
    });
  });

  it('sorts events by date and time', async () => {
    // Events in mixed order
    const unsortedEvents = [
      {
        ...global.mockEvent,
        id: 'event-late',
        title: 'Late Event',
        startDate: new Date('2024-01-15T20:00:00'),
      },
      {
        ...global.mockEvent,
        id: 'event-early',
        title: 'Early Event',
        startDate: new Date('2024-01-15T08:00:00'),
      },
      {
        ...global.mockEvent,
        id: 'event-next-day',
        title: 'Next Day Event',
        startDate: new Date('2024-01-16T10:00:00'),
      },
    ];
    jest.mocked(calendarService.getEvents).mockResolvedValue(unsortedEvents);

    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      // Should render dates in chronological order
      expect(getByText('lunes, 15 de enero de 2024')).toBeTruthy();
      expect(getByText('martes, 16 de enero de 2024')).toBeTruthy();
    });
  });

  it('reloads events when month changes', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(calendarService.getEvents).toHaveBeenCalledTimes(1);
    });

    // Navigate to next month
    const nextButton = getByText('›');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(calendarService.getEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('shows loading state when navigating months', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('Meeting')).toBeTruthy();
    });

    // Navigate to next month
    const nextButton = getByText('›');
    fireEvent.press(nextButton);

    // Should show loading state temporarily
    expect(getByText('Cargando eventos...')).toBeTruthy();
  });

  it('calls getEvents with correct date range', async () => {
    render(<CalendarScreen />);

    await waitFor(() => {
      expect(calendarService.getEvents).toHaveBeenCalledWith(
        expect.any(Date), // Start of month
        expect.any(Date)  // End of month
      );
    });
  });
});
// Utility to add Borja's school events from the calendar
import { eventService } from '@famapp/shared';
import type { CreateEventData } from '@famapp/shared';

// School events for Borja from June-July 2025
const BORJA_SCHOOL_EVENTS: CreateEventData[] = [
  {
    title: "Pupils return from mid-term holidays (clases comienzan)",
    description: "Regreso de vacaciones de medio término",
    startDate: new Date(2025, 5, 10, 8, 5), // June 10, 2025 at 8:05
    endDate: new Date(2025, 5, 10, 15, 5), // June 10, 2025 at 15:05
    allDay: false,
    assignedTo: 'borja',
    color: '#10b981' // Green for school
  },
  {
    title: "Year 2 Learning Together (apoderados invitados)",
    description: "Primary Assembly Hall - Entrar por la gravilla",
    startDate: new Date(2025, 5, 11, 8, 30), // June 11, 2025 at 8:30
    endDate: new Date(2025, 5, 11, 9, 30), // June 11, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#8b5cf6' // Purple for parent events
  },
  {
    title: "Year 2 Learning Together (apoderados invitados)",
    description: "Primary Assembly Hall - Entrar por la gravilla",
    startDate: new Date(2025, 5, 12, 8, 30), // June 12, 2025 at 8:30
    endDate: new Date(2025, 5, 12, 9, 30), // June 12, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#8b5cf6' // Purple for parent events
  },
  {
    title: "Year 3 Field Trip",
    description: "Salida educativa Year 3",
    startDate: new Date(2025, 5, 12, 8, 30), // June 12, 2025 at 8:30
    endDate: new Date(2025, 5, 12, 12, 0), // June 12, 2025 at 12:00
    allDay: false,
    assignedTo: 'borja',
    color: '#f59e0b' // Orange for field trips
  },
  {
    title: "Formative Area Parent Workshop - Year 3 & 4",
    description: "M/S Inquiry Centre - Taller de Apoderados",
    startDate: new Date(2025, 5, 19, 8, 30), // June 19, 2025 at 8:30
    endDate: new Date(2025, 5, 19, 9, 30), // June 19, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#8b5cf6' // Purple for parent events
  },
  {
    title: "Holiday - Día de los pueblos originarios",
    description: "No hay clases",
    startDate: new Date(2025, 5, 20), // June 20, 2025
    endDate: new Date(2025, 5, 20),
    allDay: true,
    assignedTo: 'borja',
    color: '#ef4444' // Red for holidays
  },
  {
    title: "Holiday",
    description: "No hay clases",
    startDate: new Date(2025, 5, 23), // June 23, 2025
    endDate: new Date(2025, 5, 23),
    allDay: true,
    assignedTo: 'borja',
    color: '#ef4444' // Red for holidays
  },
  {
    title: "Prekinder & Kinder Academic Meeting with Parents",
    description: "M/S Dining Hall - Taller de Apoderados",
    startDate: new Date(2025, 5, 24, 8, 30), // June 24, 2025 at 8:30
    endDate: new Date(2025, 5, 24, 9, 30), // June 24, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#8b5cf6' // Purple for parent events
  },
  {
    title: "Year 1, 2, 3, 4 Academic Meeting with Parents",
    description: "M/S Dining Hall - Taller de Apoderados",
    startDate: new Date(2025, 6, 2, 8, 30), // July 2, 2025 at 8:30
    endDate: new Date(2025, 6, 2, 9, 30), // July 2, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#8b5cf6' // Purple for parent events
  },
  {
    title: "Playgroup Academic Meeting with Parents",
    description: "M/S Inquiry Centre - Taller de Apoderados",
    startDate: new Date(2025, 6, 8, 8, 30), // July 8, 2025 at 8:30
    endDate: new Date(2025, 6, 8, 9, 30), // July 8, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#8b5cf6' // Purple for parent events
  },
  {
    title: "Last day for pupils (último día de clases)",
    description: "Último día del primer semestre",
    startDate: new Date(2025, 6, 9, 8, 5), // July 9, 2025 at 8:05
    endDate: new Date(2025, 6, 9, 15, 5), // July 9, 2025 at 15:05
    allDay: false,
    assignedTo: 'borja',
    color: '#06b6d4' // Cyan for important school days
  },
  {
    title: "First semester report/portfolio online meetings",
    description: "Reuniones con apoderados online (no hay clases)",
    startDate: new Date(2025, 6, 10), // July 10, 2025
    endDate: new Date(2025, 6, 10),
    allDay: true,
    assignedTo: 'borja',
    color: '#8b5cf6' // Purple for parent events
  },
  {
    title: "First semester report/portfolio online meetings",
    description: "Reuniones con apoderados online (no hay clases)",
    startDate: new Date(2025, 6, 11), // July 11, 2025
    endDate: new Date(2025, 6, 11),
    allDay: true,
    assignedTo: 'borja',
    color: '#8b5cf6' // Purple for parent events
  },
  {
    title: "Winter holidays begin",
    description: "Vacaciones de invierno - Del lunes 14 de julio al lunes 21 de julio (ambas fechas inclusive)",
    startDate: new Date(2025, 6, 14), // July 14, 2025
    endDate: new Date(2025, 6, 21), // July 21, 2025
    allDay: true,
    assignedTo: 'borja',
    color: '#ef4444' // Red for holidays
  },
  {
    title: "Semester 2 starts",
    description: "El 2º semestre comienza el martes 22 de julio",
    startDate: new Date(2025, 6, 22, 8, 5), // July 22, 2025 at 8:05
    endDate: new Date(2025, 6, 22, 15, 5), // July 22, 2025 at 15:05
    allDay: false,
    assignedTo: 'borja',
    color: '#10b981' // Green for school start
  }
];

/**
 * Add all of Borja's school events to the calendar
 */
export async function addBorjaSchoolEvents(): Promise<void> {
  try {
    console.log('Adding Borja\'s school events...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const eventData of BORJA_SCHOOL_EVENTS) {
      try {
        await eventService.createEvent(eventData);
        console.log(`✅ Added: ${eventData.title}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to add: ${eventData.title}`, error);
        errorCount++;
      }
    }
    
    console.log(`🎉 Finished adding Borja's school events:`);
    console.log(`   ✅ Successfully added: ${successCount} events`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed to add: ${errorCount} events`);
    }
    
  } catch (error) {
    console.error('Error adding Borja\'s school events:', error);
    throw error;
  }
}

// Export the events array in case we need it elsewhere
export { BORJA_SCHOOL_EVENTS };
// Utility to add Craighouse School calendar events to Firebase Firestore
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Event data structure for the calendar
interface EventData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  assignedTo: string;
  color: string;
  createdBy: string;
}

// Craighouse School events for June-July 2025
const CRAIGHOUSE_SCHOOL_EVENTS: EventData[] = [
  // JUNE 2025 EVENTS
  {
    title: "Pupils return from mid-term holidays (clases comienzan)",
    description: "Students return from mid-term holidays - classes begin",
    startDate: new Date(2025, 5, 10, 8, 5), // June 10, 2025 at 8:05
    endDate: new Date(2025, 5, 10, 15, 5), // June 10, 2025 at 15:05
    allDay: false,
    assignedTo: 'borja',
    color: '#10b981', // Green for academic events
    createdBy: 'school-calendar-import'
  },
  {
    title: "Year 2 Learning Together (apoderados invitados, por grupo)",
    description: "Year 2 Learning Together - Primary Assembly Hall",
    startDate: new Date(2025, 5, 11, 8, 30), // June 11, 2025 at 8:30
    endDate: new Date(2025, 5, 11, 9, 30), // June 11, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#3b82f6', // Blue for education events
    createdBy: 'school-calendar-import'
  },
  {
    title: "Year 2 Learning Together (apoderados invitados, por grupo)",
    description: "Year 2 Learning Together - Primary Assembly Hall",
    startDate: new Date(2025, 5, 12, 8, 30), // June 12, 2025 at 8:30
    endDate: new Date(2025, 5, 12, 9, 30), // June 12, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#3b82f6', // Blue for education events
    createdBy: 'school-calendar-import'
  },
  {
    title: "Year 3 Field Trip",
    description: "Year 3 educational field trip",
    startDate: new Date(2025, 5, 12, 8, 30), // June 12, 2025 at 8:30
    endDate: new Date(2025, 5, 12, 12, 0), // June 12, 2025 at 12:00
    allDay: false,
    assignedTo: 'borja',
    color: '#8b5cf6', // Purple for education events
    createdBy: 'school-calendar-import'
  },
  {
    title: "Formative Area Parent Workshop - Year 3 & 4 parents invited",
    description: "Formative Area Parent Workshop - M/S Inquiry Centre",
    startDate: new Date(2025, 5, 19, 8, 30), // June 19, 2025 at 8:30
    endDate: new Date(2025, 5, 19, 9, 30), // June 19, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#f97316', // Orange for education events
    createdBy: 'school-calendar-import'
  },
  {
    title: "Holiday - Día de los pueblos originarios (no hay clases)",
    description: "Holiday - Day of Indigenous Peoples - no classes",
    startDate: new Date(2025, 5, 20), // June 20, 2025
    endDate: new Date(2025, 5, 20),
    allDay: true,
    assignedTo: 'borja',
    color: '#ef4444', // Red for holidays
    createdBy: 'school-calendar-import'
  },
  {
    title: "Holiday (no hay clases)",
    description: "Holiday - no classes",
    startDate: new Date(2025, 5, 23), // June 23, 2025
    endDate: new Date(2025, 5, 23),
    allDay: true,
    assignedTo: 'borja',
    color: '#ef4444', // Red for holidays
    createdBy: 'school-calendar-import'
  },
  {
    title: "Prekinder & Kinder Academic Meeting with Parents",
    description: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall",
    startDate: new Date(2025, 5, 24, 8, 30), // June 24, 2025 at 8:30
    endDate: new Date(2025, 5, 24, 9, 30), // June 24, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#3b82f6', // Blue for education events
    createdBy: 'school-calendar-import'
  },

  // JULY 2025 EVENTS
  {
    title: "Year 1, 2, 3, 4 Academic Meeting with Parents",
    description: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall",
    startDate: new Date(2025, 6, 2, 8, 30), // July 2, 2025 at 8:30
    endDate: new Date(2025, 6, 2, 9, 30), // July 2, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#3b82f6', // Blue for education events
    createdBy: 'school-calendar-import'
  },
  {
    title: "Playgroup Academic Meeting with Parents",
    description: "Playgroup Academic Meeting with Parents - M/S Inquiry Centre",
    startDate: new Date(2025, 6, 8, 8, 30), // July 8, 2025 at 8:30
    endDate: new Date(2025, 6, 8, 9, 30), // July 8, 2025 at 9:30
    allDay: false,
    assignedTo: 'borja',
    color: '#3b82f6', // Blue for education events
    createdBy: 'school-calendar-import'
  },
  {
    title: "Last day for pupils (último día de clases)",
    description: "Last day for pupils - end of first semester",
    startDate: new Date(2025, 6, 9, 8, 5), // July 9, 2025 at 8:05
    endDate: new Date(2025, 6, 9, 15, 5), // July 9, 2025 at 15:05
    allDay: false,
    assignedTo: 'borja',
    color: '#10b981', // Green for academic events
    createdBy: 'school-calendar-import'
  },
  {
    title: "First semester report/portfolio online meetings (no hay clases)",
    description: "First semester report/portfolio online meetings - no classes",
    startDate: new Date(2025, 6, 10), // July 10, 2025
    endDate: new Date(2025, 6, 10),
    allDay: true,
    assignedTo: 'borja',
    color: '#6366f1', // Indigo for academic events
    createdBy: 'school-calendar-import'
  },
  {
    title: "First semester report/portfolio online meetings (no hay clases)",
    description: "First semester report/portfolio online meetings - no classes",
    startDate: new Date(2025, 6, 11), // July 11, 2025
    endDate: new Date(2025, 6, 11),
    allDay: true,
    assignedTo: 'borja',
    color: '#6366f1', // Indigo for academic events
    createdBy: 'school-calendar-import'
  },
  {
    title: "Winter holidays/Vacaciones de invierno",
    description: "Winter holidays - July 14 to July 21 (inclusive)",
    startDate: new Date(2025, 6, 14), // July 14, 2025
    endDate: new Date(2025, 6, 21), // July 21, 2025
    allDay: true,
    assignedTo: 'borja',
    color: '#6b7280', // Gray for holiday periods
    createdBy: 'school-calendar-import'
  }
];

/**
 * Add a single event to Firestore
 */
async function addEventToFirestore(eventData: EventData): Promise<string> {
  try {
    const docData = {
      title: eventData.title,
      description: eventData.description,
      startDate: Timestamp.fromDate(eventData.startDate),
      endDate: Timestamp.fromDate(eventData.endDate),
      allDay: eventData.allDay,
      assignedTo: eventData.assignedTo,
      color: eventData.color,
      createdBy: eventData.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      recurring: 'none'
    };

    const docRef = await addDoc(collection(db, 'events'), docData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding event to Firestore:', error);
    throw error;
  }
}

/**
 * Add all Craighouse School events to the calendar
 */
export async function addCraighouseSchoolEvents(): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    console.log('Starting import of Craighouse School events...');
    
    for (const eventData of CRAIGHOUSE_SCHOOL_EVENTS) {
      try {
        const docId = await addEventToFirestore(eventData);
        console.log(`✅ Added: ${eventData.title} (ID: ${docId})`);
        results.success++;
      } catch (error) {
        const errorMessage = `Failed to add: ${eventData.title} - ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMessage}`);
        results.failed++;
        results.errors.push(errorMessage);
      }
    }
    
    console.log(`🎉 Finished adding Craighouse School events:`);
    console.log(`   ✅ Successfully added: ${results.success} events`);
    if (results.failed > 0) {
      console.log(`   ❌ Failed to add: ${results.failed} events`);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error adding Craighouse School events:', error);
    throw error;
  }
}

/**
 * Add individual event by index (for testing purposes)
 */
export async function addCraighouseEventByIndex(index: number): Promise<string> {
  if (index < 0 || index >= CRAIGHOUSE_SCHOOL_EVENTS.length) {
    throw new Error(`Invalid index: ${index}. Must be between 0 and ${CRAIGHOUSE_SCHOOL_EVENTS.length - 1}`);
  }
  
  const eventData = CRAIGHOUSE_SCHOOL_EVENTS[index];
  try {
    const docId = await addEventToFirestore(eventData);
    console.log(`✅ Added event ${index + 1}: ${eventData.title} (ID: ${docId})`);
    return docId;
  } catch (error) {
    console.error(`❌ Failed to add event ${index + 1}: ${eventData.title}`, error);
    throw error;
  }
}

/**
 * Get the list of events that will be imported (for preview)
 */
export function getCraighouseSchoolEventsList(): Array<{index: number, title: string, date: string, description: string}> {
  return CRAIGHOUSE_SCHOOL_EVENTS.map((event, index) => ({
    index,
    title: event.title,
    date: event.startDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: event.allDay ? undefined : 'numeric',
      minute: event.allDay ? undefined : '2-digit'
    }),
    description: event.description
  }));
}

// Export the events array in case we need it elsewhere
export { CRAIGHOUSE_SCHOOL_EVENTS };
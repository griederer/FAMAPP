// Calendar Event Validation Service
// Ensures data consistency and validates event integrity

import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CalendarEvent } from './eventService';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  eventCount: number;
  duplicates: DuplicateEvent[];
}

export interface ValidationError {
  eventId: string;
  eventTitle: string;
  errorType: 'MISSING_DATE' | 'INVALID_DATE' | 'MISSING_TITLE' | 'INVALID_ASSIGNED_TO';
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ValidationWarning {
  eventId: string;
  eventTitle: string;
  warningType: 'POTENTIAL_DUPLICATE' | 'UNUSUAL_TIME' | 'FAR_FUTURE_DATE';
  message: string;
}

export interface DuplicateEvent {
  events: { id: string; title: string; date: string }[];
  reason: string;
}

// Official canonical events for validation
const CANONICAL_EVENTS = {
  'holiday-june-23': {
    title: 'Holiday',
    date: new Date(2025, 5, 23), // June 23, 2025 (Monday)
    allDay: true,
    assignedTo: 'borja'
  },
  'prekinder-meeting-june-24': {
    title: 'Prekinder & Kinder Academic Meeting with Parents',
    date: new Date(2025, 5, 24, 8, 30), // June 24, 2025 at 8:30 (Tuesday)
    allDay: false,
    assignedTo: 'borja'
  },
  'year-meeting-july-2': {
    title: 'Year 1, 2, 3, 4 Academic Meeting with Parents',
    date: new Date(2025, 6, 2, 8, 30), // July 2, 2025 at 8:30 (Wednesday)
    allDay: false,
    assignedTo: 'borja'
  }
};

export class CalendarValidationService {
  
  /**
   * Validate all calendar events against canonical source
   */
  async validateAllEvents(): Promise<ValidationResult> {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
      }));

      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      const duplicates: DuplicateEvent[] = [];

      // Validate individual events
      events.forEach(event => {
        this.validateIndividualEvent(event, errors, warnings);
      });

      // Check for duplicates
      this.checkForDuplicates(events, duplicates, warnings);

      // Validate against canonical events
      this.validateAgainstCanonical(events, errors, warnings);

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        eventCount: events.length,
        duplicates
      };

      return result;
    } catch (error) {
      console.error('Calendar validation failed:', error);
      throw new Error(`Calendar validation failed: ${error}`);
    }
  }

  /**
   * Validate a single event
   */
  private validateIndividualEvent(
    event: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check required fields
    if (!event.title || event.title.trim() === '') {
      errors.push({
        eventId: event.id,
        eventTitle: event.title || 'Untitled',
        errorType: 'MISSING_TITLE',
        message: 'Event is missing a title',
        severity: 'high'
      });
    }

    if (!event.startDate) {
      errors.push({
        eventId: event.id,
        eventTitle: event.title || 'Untitled',
        errorType: 'MISSING_DATE',
        message: 'Event is missing start date',
        severity: 'high'
      });
    } else if (isNaN(event.startDate.getTime())) {
      errors.push({
        eventId: event.id,
        eventTitle: event.title,
        errorType: 'INVALID_DATE',
        message: 'Event has invalid start date',
        severity: 'high'
      });
    }

    // Check for reasonable dates (not too far in the future)
    if (event.startDate && event.startDate.getFullYear() > 2026) {
      warnings.push({
        eventId: event.id,
        eventTitle: event.title,
        warningType: 'FAR_FUTURE_DATE',
        message: `Event is scheduled for ${event.startDate.getFullYear()}, which seems unusually far in the future`
      });
    }

    // Check assigned to field
    const validAssignees = ['gonzalo', 'mpaz', 'borja', 'melody'];
    if (event.assignedTo && !validAssignees.includes(event.assignedTo)) {
      errors.push({
        eventId: event.id,
        eventTitle: event.title,
        errorType: 'INVALID_ASSIGNED_TO',
        message: `Invalid assignedTo value: ${event.assignedTo}. Must be one of: ${validAssignees.join(', ')}`,
        severity: 'medium'
      });
    }
  }

  /**
   * Check for duplicate events
   */
  private checkForDuplicates(
    events: any[], 
    duplicates: DuplicateEvent[], 
    warnings: ValidationWarning[]
  ): void {
    const titleGroups = new Map<string, any[]>();

    // Group events by similar titles
    events.forEach(event => {
      const normalizedTitle = event.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!titleGroups.has(normalizedTitle)) {
        titleGroups.set(normalizedTitle, []);
      }
      titleGroups.get(normalizedTitle)!.push(event);
    });

    // Find groups with multiple events
    titleGroups.forEach((eventGroup, normalizedTitle) => {
      if (eventGroup.length > 1) {
        // Check if they're actually duplicates (same date)
        const dateGroups = new Map<string, any[]>();
        
        eventGroup.forEach(event => {
          const dateKey = event.startDate ? event.startDate.toDateString() : 'no-date';
          if (!dateGroups.has(dateKey)) {
            dateGroups.set(dateKey, []);
          }
          dateGroups.get(dateKey)!.push(event);
        });

        dateGroups.forEach((duplicateGroup, dateKey) => {
          if (duplicateGroup.length > 1) {
            duplicates.push({
              events: duplicateGroup.map(e => ({
                id: e.id,
                title: e.title,
                date: e.startDate ? e.startDate.toLocaleDateString() : 'No date'
              })),
              reason: `Multiple events with title "${normalizedTitle}" on ${dateKey}`
            });

            // Add warnings for each duplicate event
            duplicateGroup.forEach(event => {
              warnings.push({
                eventId: event.id,
                eventTitle: event.title,
                warningType: 'POTENTIAL_DUPLICATE',
                message: `This event may be a duplicate of other events with similar title and date`
              });
            });
          }
        });
      }
    });
  }

  /**
   * Validate against canonical events
   */
  private validateAgainstCanonical(
    events: any[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check Holiday event (June 23)
    const holidayEvents = events.filter(e => 
      e.title.toLowerCase().includes('holiday') && 
      e.startDate && 
      e.startDate.getMonth() === 5 && // June
      e.startDate.getDate() >= 20 && 
      e.startDate.getDate() <= 25
    );

    holidayEvents.forEach(event => {
      const canonical = CANONICAL_EVENTS['holiday-june-23'];
      if (event.startDate.getDate() !== canonical.date.getDate()) {
        errors.push({
          eventId: event.id,
          eventTitle: event.title,
          errorType: 'INVALID_DATE',
          message: `Holiday should be on June 23 (Monday), but found on ${event.startDate.toLocaleDateString()}`,
          severity: 'high'
        });
      }
    });

    // Check Prekinder meeting (June 24)
    const prekinderEvents = events.filter(e => 
      e.title.toLowerCase().includes('prekinder') && 
      e.startDate && 
      e.startDate.getMonth() === 5 // June
    );

    prekinderEvents.forEach(event => {
      const canonical = CANONICAL_EVENTS['prekinder-meeting-june-24'];
      if (event.startDate.getDate() !== canonical.date.getDate()) {
        errors.push({
          eventId: event.id,
          eventTitle: event.title,
          errorType: 'INVALID_DATE',
          message: `Prekinder meeting should be on June 24 (Tuesday), but found on ${event.startDate.toLocaleDateString()}`,
          severity: 'high'
        });
      }
    });

    // Check Year 1-4 meeting (July 2)
    const yearEvents = events.filter(e => 
      e.title.toLowerCase().includes('year') && 
      (e.title.includes('1') || e.title.includes('2') || e.title.includes('3') || e.title.includes('4')) &&
      e.startDate && 
      e.startDate.getMonth() === 6 // July
    );

    yearEvents.forEach(event => {
      const canonical = CANONICAL_EVENTS['year-meeting-july-2'];
      if (event.startDate.getDate() !== canonical.date.getDate()) {
        errors.push({
          eventId: event.id,
          eventTitle: event.title,
          errorType: 'INVALID_DATE',
          message: `Year 1-4 meeting should be on July 2 (Wednesday), but found on ${event.startDate.toLocaleDateString()}`,
          severity: 'high'
        });
      }
    });
  }

  /**
   * Generate validation report
   */
  generateReport(result: ValidationResult): string {
    let report = `\n📊 CALENDAR VALIDATION REPORT\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `📈 Summary:\n`;
    report += `  Total Events: ${result.eventCount}\n`;
    report += `  Validation Status: ${result.isValid ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `  Errors: ${result.errors.length}\n`;
    report += `  Warnings: ${result.warnings.length}\n`;
    report += `  Duplicates: ${result.duplicates.length}\n\n`;

    if (result.errors.length > 0) {
      report += `❌ ERRORS (${result.errors.length}):\n`;
      result.errors.forEach((error, index) => {
        report += `  ${index + 1}. [${error.severity.toUpperCase()}] ${error.eventTitle}\n`;
        report += `     ${error.message}\n`;
        report += `     Event ID: ${error.eventId}\n\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += `⚠️  WARNINGS (${result.warnings.length}):\n`;
      result.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning.eventTitle}\n`;
        report += `     ${warning.message}\n`;
        report += `     Event ID: ${warning.eventId}\n\n`;
      });
    }

    if (result.duplicates.length > 0) {
      report += `🔄 DUPLICATES (${result.duplicates.length}):\n`;
      result.duplicates.forEach((duplicate, index) => {
        report += `  ${index + 1}. ${duplicate.reason}\n`;
        duplicate.events.forEach(event => {
          report += `     - ${event.title} (${event.date}) [${event.id}]\n`;
        });
        report += '\n';
      });
    }

    if (result.isValid) {
      report += `✅ All calendar events are valid and consistent!\n`;
    } else {
      report += `❌ Calendar validation failed. Please fix the errors above.\n`;
    }

    return report;
  }
}

export const calendarValidationService = new CalendarValidationService();
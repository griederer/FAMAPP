// Event Synchronization Service
// Ensures calendar events stay synchronized and handles conflicts

import { eventService, type CalendarEvent } from './eventService';
import { calendarValidationService, type ValidationResult } from './calendarValidationService';
import { getDataCacheService } from '@famapp/shared';

export interface SyncResult {
  success: boolean;
  message: string;
  eventsProcessed: number;
  errors: string[];
  warnings: string[];
  validationResult?: ValidationResult;
}

export interface ConflictResolution {
  strategy: 'keep_existing' | 'use_canonical' | 'merge' | 'manual';
  reasoning: string;
  action: string;
}

// Official canonical events that should match the school calendar
const CANONICAL_EVENTS = [
  {
    id: 'holiday-june-23-2025',
    title: 'Holiday',
    startDate: new Date(2025, 5, 23), // June 23, 2025 (Monday)
    endDate: new Date(2025, 5, 23),
    allDay: true,
    assignedTo: 'borja',
    description: 'School holiday - no classes',
    source: 'Official school calendar PDF'
  },
  {
    id: 'prekinder-meeting-june-24-2025',
    title: 'Prekinder & Kinder Academic Meeting with Parents',
    startDate: new Date(2025, 5, 24, 8, 30), // June 24, 2025 at 8:30 (Tuesday)
    endDate: new Date(2025, 5, 24, 9, 30),
    allDay: false,
    assignedTo: 'borja',
    description: 'M/S Dining Hall - Taller de Apoderados',
    location: 'M/S Dining Hall',
    source: 'Official school calendar PDF'
  },
  {
    id: 'year-meeting-july-2-2025',
    title: 'Year 1, 2, 3, 4 Academic Meeting with Parents',
    startDate: new Date(2025, 6, 2, 8, 30), // July 2, 2025 at 8:30 (Wednesday)
    endDate: new Date(2025, 6, 2, 9, 30),
    allDay: false,
    assignedTo: 'borja',
    description: 'M/S Dining Hall - Taller de Apoderados',
    location: 'M/S Dining Hall',
    source: 'Official school calendar PDF'
  }
];

export class EventSyncService {
  private cacheService = getDataCacheService();

  /**
   * Synchronize all events with canonical source
   */
  async syncWithCanonicalSource(): Promise<SyncResult> {
    try {
      console.log('🔄 Starting event synchronization with canonical source...');
      
      // Step 1: Validate current events
      const validationResult = await calendarValidationService.validateAllEvents();
      
      if (validationResult.isValid) {
        console.log('✅ All events are already synchronized!');
        return {
          success: true,
          message: 'All events are already synchronized with canonical source',
          eventsProcessed: validationResult.eventCount,
          errors: [],
          warnings: [],
          validationResult
        };
      }

      // Step 2: Identify conflicts and resolve them
      const errors: string[] = [];
      const warnings: string[] = [];
      let eventsProcessed = 0;

      // Handle each canonical event
      for (const canonicalEvent of CANONICAL_EVENTS) {
        try {
          const resolution = await this.resolveEventConflict(canonicalEvent);
          console.log(`📋 ${canonicalEvent.title}: ${resolution.action}`);
          eventsProcessed++;
        } catch (error) {
          const errorMsg = `Failed to process ${canonicalEvent.title}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Step 3: Clear cache to force refresh
      this.cacheService.clearCalendarCache();

      // Step 4: Re-validate after sync
      const postSyncValidation = await calendarValidationService.validateAllEvents();

      const result: SyncResult = {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully synchronized ${eventsProcessed} events with canonical source`
          : `Synchronization completed with ${errors.length} errors`,
        eventsProcessed,
        errors,
        warnings,
        validationResult: postSyncValidation
      };

      console.log(result.success ? '✅ Synchronization completed successfully' : '⚠️ Synchronization completed with issues');
      return result;

    } catch (error) {
      console.error('❌ Event synchronization failed:', error);
      return {
        success: false,
        message: `Synchronization failed: ${error}`,
        eventsProcessed: 0,
        errors: [String(error)],
        warnings: []
      };
    }
  }

  /**
   * Resolve conflicts for a specific canonical event
   */
  private async resolveEventConflict(canonicalEvent: any): Promise<ConflictResolution> {
    const now = new Date();
    const startDate = new Date(canonicalEvent.startDate);
    const endDate = new Date(canonicalEvent.endDate);

    // Get events in the date range
    const existingEvents = await eventService.getEventsInRange(
      new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before
      new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000)   // 1 week after
    );

    // Find conflicts
    const conflicts = existingEvents.filter(event => 
      this.isConflictingEvent(event, canonicalEvent)
    );

    if (conflicts.length === 0) {
      // No conflicts, create the canonical event
      await eventService.createEvent({
        title: canonicalEvent.title,
        description: canonicalEvent.description,
        startDate: canonicalEvent.startDate,
        endDate: canonicalEvent.endDate,
        allDay: canonicalEvent.allDay,
        assignedTo: canonicalEvent.assignedTo,
        color: this.getEventColor(canonicalEvent.title)
      });

      return {
        strategy: 'use_canonical',
        reasoning: 'No existing events found, created canonical event',
        action: 'Created new event'
      };
    }

    if (conflicts.length === 1) {
      const conflict = conflicts[0];
      
      // Check if it's exactly the same event
      if (this.isExactMatch(conflict, canonicalEvent)) {
        return {
          strategy: 'keep_existing',
          reasoning: 'Existing event matches canonical event exactly',
          action: 'No changes needed'
        };
      }

      // Update the existing event to match canonical
      await eventService.updateEvent(conflict.id, {
        title: canonicalEvent.title,
        description: canonicalEvent.description,
        startDate: canonicalEvent.startDate,
        endDate: canonicalEvent.endDate,
        allDay: canonicalEvent.allDay,
        assignedTo: canonicalEvent.assignedTo
      });

      return {
        strategy: 'use_canonical',
        reasoning: 'Updated existing event to match canonical source',
        action: 'Updated existing event'
      };
    }

    // Multiple conflicts - remove all and create canonical
    for (const conflict of conflicts) {
      await eventService.deleteEvent(conflict.id);
    }

    await eventService.createEvent({
      title: canonicalEvent.title,
      description: canonicalEvent.description,
      startDate: canonicalEvent.startDate,
      endDate: canonicalEvent.endDate,
      allDay: canonicalEvent.allDay,
      assignedTo: canonicalEvent.assignedTo,
      color: this.getEventColor(canonicalEvent.title)
    });

    return {
      strategy: 'use_canonical',
      reasoning: `Removed ${conflicts.length} conflicting events and created canonical event`,
      action: `Replaced ${conflicts.length} events`
    };
  }

  /**
   * Check if an event conflicts with a canonical event
   */
  private isConflictingEvent(event: CalendarEvent, canonical: any): boolean {
    const eventTitle = event.title.toLowerCase();
    const canonicalTitle = canonical.title.toLowerCase();

    // Check for title similarity
    if (canonicalTitle.includes('holiday') && eventTitle.includes('holiday')) {
      return this.isDatesOverlapping(event.startDate, event.endDate, canonical.startDate, canonical.endDate);
    }

    if (canonicalTitle.includes('prekinder') && eventTitle.includes('prekinder')) {
      return this.isDatesOverlapping(event.startDate, event.endDate, canonical.startDate, canonical.endDate);
    }

    if (canonicalTitle.includes('year') && eventTitle.includes('year')) {
      return this.isDatesOverlapping(event.startDate, event.endDate, canonical.startDate, canonical.endDate);
    }

    return false;
  }

  /**
   * Check if an event exactly matches a canonical event
   */
  private isExactMatch(event: CalendarEvent, canonical: any): boolean {
    return (
      event.title === canonical.title &&
      event.startDate.getTime() === canonical.startDate.getTime() &&
      event.endDate.getTime() === canonical.endDate.getTime() &&
      event.allDay === canonical.allDay &&
      event.assignedTo === canonical.assignedTo
    );
  }

  /**
   * Check if date ranges overlap
   */
  private isDatesOverlapping(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 <= end2 && start2 <= end1;
  }

  /**
   * Get appropriate color for event type
   */
  private getEventColor(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('holiday')) {
      return '#ef4444'; // Red for holidays
    } else if (titleLower.includes('meeting') || titleLower.includes('academic')) {
      return '#8b5cf6'; // Purple for meetings
    } else if (titleLower.includes('school') || titleLower.includes('education')) {
      return '#3b82f6'; // Blue for school events
    } else {
      return '#10b981'; // Green for general events
    }
  }

  /**
   * Perform a full calendar health check
   */
  async performHealthCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
    validationResult: ValidationResult;
  }> {
    try {
      const validationResult = await calendarValidationService.validateAllEvents();
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check for validation errors
      if (validationResult.errors.length > 0) {
        issues.push(`${validationResult.errors.length} validation errors found`);
        recommendations.push('Run event synchronization to fix validation errors');
      }

      // Check for duplicates
      if (validationResult.duplicates.length > 0) {
        issues.push(`${validationResult.duplicates.length} duplicate events found`);
        recommendations.push('Remove duplicate events to avoid confusion');
      }

      // Check for warnings
      if (validationResult.warnings.length > 0) {
        issues.push(`${validationResult.warnings.length} warnings found`);
        recommendations.push('Review warnings for potential issues');
      }

      const isHealthy = issues.length === 0;

      if (isHealthy) {
        recommendations.push('Calendar is healthy! Consider regular validation checks.');
      }

      return {
        isHealthy,
        issues,
        recommendations,
        validationResult
      };

    } catch (error) {
      return {
        isHealthy: false,
        issues: [`Health check failed: ${error}`],
        recommendations: ['Fix underlying system issues and retry health check'],
        validationResult: {
          isValid: false,
          errors: [],
          warnings: [],
          eventCount: 0,
          duplicates: []
        }
      };
    }
  }

  /**
   * Get sync status report
   */
  async getSyncStatusReport(): Promise<string> {
    const healthCheck = await this.performHealthCheck();
    
    let report = '\n📊 CALENDAR SYNCHRONIZATION STATUS\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `🏥 Health Status: ${healthCheck.isHealthy ? '✅ HEALTHY' : '❌ ISSUES FOUND'}\n\n`;
    
    if (healthCheck.issues.length > 0) {
      report += `🚨 Issues Found (${healthCheck.issues.length}):\n`;
      healthCheck.issues.forEach((issue, index) => {
        report += `  ${index + 1}. ${issue}\n`;
      });
      report += '\n';
    }
    
    if (healthCheck.recommendations.length > 0) {
      report += `💡 Recommendations (${healthCheck.recommendations.length}):\n`;
      healthCheck.recommendations.forEach((rec, index) => {
        report += `  ${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }
    
    // Add validation details
    const validation = healthCheck.validationResult;
    report += `📋 Validation Details:\n`;
    report += `  Total Events: ${validation.eventCount}\n`;
    report += `  Errors: ${validation.errors.length}\n`;
    report += `  Warnings: ${validation.warnings.length}\n`;
    report += `  Duplicates: ${validation.duplicates.length}\n\n`;
    
    if (!healthCheck.isHealthy) {
      report += `🔧 Quick Fix:\n`;
      report += `  Run: eventSyncService.syncWithCanonicalSource()\n`;
      report += `  This will automatically resolve conflicts and synchronize with the official calendar.\n`;
    }
    
    return report;
  }
}

export const eventSyncService = new EventSyncService();
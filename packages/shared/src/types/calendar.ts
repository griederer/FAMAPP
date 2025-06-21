// Calendar types shared between web and mobile apps
import type { FamilyMember } from './core';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  assignedTo?: FamilyMember;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder?: number; // minutes before event
}

export interface CreateEventData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  assignedTo?: FamilyMember;
  color?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder?: number;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  allDay?: boolean;
  assignedTo?: FamilyMember;
  color?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder?: number;
}

// Service layer interface
export interface EventService {
  // CRUD operations
  createEvent(data: CreateEventData): Promise<string>;
  updateEvent(id: string, data: UpdateEventData): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  
  // Query operations
  getEventsInRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  getUpcomingEvents(limit?: number): Promise<CalendarEvent[]>;
  
  // Real-time subscriptions
  subscribeToEvents(
    startDate: Date,
    endDate: Date,
    callback: (events: CalendarEvent[]) => void
  ): () => void; // Returns unsubscribe function
}
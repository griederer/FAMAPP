// Event service for Firebase operations
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { authService } from './authService';
import type { Unsubscribe } from 'firebase/firestore';
import type { FamilyMember } from '../types/theme';

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

class EventService {
  private readonly COLLECTION_NAME = 'events';

  // Create a new event
  async createEvent(data: CreateEventData): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create events');
    }

    try {
      const eventData: any = {
        title: data.title,
        description: data.description || null,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        allDay: data.allDay || false,
        recurring: data.recurring || 'none',
        color: data.color || '#3b82f6',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add assignedTo if it's not undefined
      if (data.assignedTo) {
        eventData.assignedTo = data.assignedTo;
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), eventData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Update an existing event
  async updateEvent(id: string, data: UpdateEventData): Promise<void> {
    try {
      const eventRef = doc(db, this.COLLECTION_NAME, id);
      const updateData: any = { 
        updatedAt: serverTimestamp()
      };

      // Only add fields that are not undefined
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.allDay !== undefined) updateData.allDay = data.allDay;
      if (data.recurring !== undefined) updateData.recurring = data.recurring;
      if (data.color !== undefined) updateData.color = data.color;
      
      if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
      }

      // Handle assignedTo field carefully
      if (data.assignedTo !== undefined) {
        if (data.assignedTo) {
          updateData.assignedTo = data.assignedTo;
        } else {
          // Use deleteField() to remove the field entirely
          updateData.assignedTo = null;
        }
      }

      await updateDoc(eventRef, updateData);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Delete an event
  async deleteEvent(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Get events for a date range
  async getEventsInRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as CalendarEvent));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  // Subscribe to events (real-time updates)
  subscribeToEvents(
    startDate: Date,
    endDate: Date,
    callback: (events: CalendarEvent[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('startDate', '>=', Timestamp.fromDate(startDate)),
      where('startDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('startDate', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const events: CalendarEvent[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as CalendarEvent));
      
      callback(events);
    }, (error) => {
      console.error('Error fetching events:', error);
    });
  }

  // Get upcoming events
  async getUpcomingEvents(limit: number = 5): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('startDate', '>=', Timestamp.fromDate(now)),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as CalendarEvent));

      return events.slice(0, limit);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
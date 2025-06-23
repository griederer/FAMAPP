import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import type { CalendarEvent } from '../types.js';

export class EventService {
  private readonly collectionName = 'events';

  async getAllEvents(): Promise<CalendarEvent[]> {
    try {
      const eventsRef = collection(db, this.collectionName);
      const q = query(eventsRef, orderBy('startDate', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent));
    } catch (error) {
      throw new Error(`Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEventById(id: string): Promise<CalendarEvent | null> {
    try {
      const eventDoc = await getDoc(doc(db, this.collectionName, id));
      
      if (!eventDoc.exists()) {
        return null;
      }
      
      return {
        id: eventDoc.id,
        ...eventDoc.data()
      } as CalendarEvent;
    } catch (error) {
      throw new Error(`Failed to get event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createEvent(data: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
    try {
      const eventData = {
        ...data,
        startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate,
        endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : data.endDate,
        createdAt: Timestamp.now(),
        createdBy: data.createdBy || 'mcp-famapp',
        allDay: data.allDay || false,
        recurring: data.recurring || false
      };

      const docRef = await addDoc(collection(db, this.collectionName), eventData);
      
      return {
        id: docRef.id,
        ...eventData,
        startDate: eventData.startDate instanceof Timestamp ? eventData.startDate.toDate() : eventData.startDate,
        endDate: eventData.endDate instanceof Timestamp ? eventData.endDate.toDate() : eventData.endDate,
        createdAt: new Date()
      } as unknown as CalendarEvent;
    } catch (error) {
      throw new Error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const eventRef = doc(db, this.collectionName, id);
      
      // Remove id from update data if present
      const { id: _, ...updateData } = data;
      
      // Convert dates to Timestamps if needed
      if (updateData.startDate instanceof Date) {
        (updateData as any).startDate = Timestamp.fromDate(updateData.startDate);
      }
      if (updateData.endDate instanceof Date) {
        (updateData as any).endDate = Timestamp.fromDate(updateData.endDate);
      }
      
      await updateDoc(eventRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
      
      // Return updated event
      const updated = await this.getEventById(id);
      if (!updated) {
        throw new Error('Event not found after update');
      }
      
      return updated;
    } catch (error) {
      throw new Error(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return true;
    } catch (error) {
      throw new Error(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUpcomingEvents(days: number = 14): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const eventsRef = collection(db, this.collectionName);
      const q = query(
        eventsRef,
        where('startDate', '>=', Timestamp.fromDate(now)),
        where('startDate', '<=', Timestamp.fromDate(futureDate)),
        orderBy('startDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent));
    } catch (error) {
      throw new Error(`Failed to get upcoming events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEventsByAssignee(assignee: string): Promise<CalendarEvent[]> {
    try {
      const eventsRef = collection(db, this.collectionName);
      const q = query(
        eventsRef,
        where('assignedTo', '==', assignee),
        orderBy('startDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent));
    } catch (error) {
      throw new Error(`Failed to get events by assignee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
// Data Aggregation Service for AI Dashboard - shared between web and mobile
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { authService } from './authService';
import type { FamilyMember } from '../types/core';
import type { Todo } from '../types/todo';
import type { CalendarEvent } from '../types/calendar';
import type { GroceryItem } from '../types/grocery';
import type { FamilyDocument } from '../types/document';
import type {
  AggregatedFamilyData,
  MemberEventStats,
  GroceryCategoryStats,
  DocumentTypeStats,
  DataFreshness,
  FamilyMemberInfo,
  MemberTodoStats,
  WeeklyTrends,
  EventType,
  DocumentType
} from '../types/ai';

// Re-export interfaces from AI types for backward compatibility
export type { AggregatedFamilyData, MemberEventStats, GroceryCategoryStats as CategoryStats, DocumentTypeStats, DataFreshness, FamilyMemberInfo as MemberInfo, MemberTodoStats as MemberStats, WeeklyTrends };

// Configuration for data aggregation
export interface AggregationConfig {
  daysForRecent: number;
  daysForUpcoming: number;
  maxItemsPerCategory: number;
  includeCompleted: boolean;
  calculateTrends: boolean;
}

// Error handling for data aggregation
export class DataAggregationError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DataAggregationError';
  }
}

export class DataAggregationService {
  private readonly DEFAULT_CONFIG: AggregationConfig = {
    daysForRecent: 7,
    daysForUpcoming: 14,
    maxItemsPerCategory: 50,
    includeCompleted: true,
    calculateTrends: true,
  };

  private get db() {
    try {
      const services = getFirebaseServices();
      if (!services || !services.db) {
        throw new Error('Firebase services not initialized or database not available');
      }
      return services.db;
    } catch (error) {
      console.error('Failed to get Firebase database:', error);
      throw new Error(`Firebase database not available: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Main method to aggregate all family data for AI processing
  async aggregateFamilyData(config?: Partial<AggregationConfig>): Promise<AggregatedFamilyData> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const user = authService.getCurrentUser();
    
    if (!user) {
      throw new DataAggregationError(
        'User must be authenticated to aggregate family data',
        'USER_NOT_AUTHENTICATED'
      );
    }

    try {
      const startTime = Date.now();

      // Fetch all data in parallel for performance
      let todosData, eventsData, groceriesData, documentsData, familyMembers;
      
      try {
        [
          todosData,
          eventsData,
          groceriesData,
          documentsData,
          familyMembers
        ] = await Promise.all([
          this.aggregateTodos(fullConfig).catch(err => {
            console.error('Failed to aggregate todos:', err);
            throw new Error(`Todos aggregation failed: ${err.message}`);
          }),
          this.aggregateEvents(fullConfig).catch(err => {
            console.error('Failed to aggregate events:', err);
            throw new Error(`Events aggregation failed: ${err.message}`);
          }),
          this.aggregateGroceries(fullConfig).catch(err => {
            console.error('Failed to aggregate groceries:', err);
            throw new Error(`Groceries aggregation failed: ${err.message}`);
          }),
          this.aggregateDocuments(fullConfig).catch(err => {
            console.error('Failed to aggregate documents:', err);
            throw new Error(`Documents aggregation failed: ${err.message}`);
          }),
          this.getFamilyMembers().catch(err => {
            console.error('Failed to get family members:', err);
            throw new Error(`Family members retrieval failed: ${err.message}`);
          })
        ]);
      } catch (error) {
        console.error('Promise.all failed in data aggregation:', error);
        throw error;
      }

      const endTime = Date.now();
      const aggregationTime = endTime - startTime;

      // Log performance warning if aggregation is slow
      if (aggregationTime > 3000) {
        console.warn(`Data aggregation took ${aggregationTime}ms - consider optimization`);
      }

      // Calculate summary statistics
      const summary = this.calculateSummary(
        todosData,
        eventsData,
        groceriesData,
        documentsData,
        aggregationTime
      );

      return {
        todos: todosData,
        events: eventsData,
        groceries: groceriesData,
        documents: documentsData,
        familyMembers,
        summary
      };
    } catch (error) {
      console.error('Data aggregation error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        config: fullConfig
      });
      
      throw new DataAggregationError(
        `Failed to aggregate family data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AGGREGATION_FAILED',
        error
      );
    }
  }

  // Aggregate todo data with statistics
  private async aggregateTodos(config: AggregationConfig): Promise<AggregatedFamilyData['todos']> {
    try {
      const now = new Date();
      const recentCutoff = new Date(now.getTime() - config.daysForRecent * 24 * 60 * 60 * 1000);

      // Fetch all todos
      const todosQuery = query(
        collection(this.db, 'todos'),
        orderBy('createdAt', 'desc'),
        limit(config.maxItemsPerCategory)
      );

      const todosSnapshot = await getDocs(todosQuery);
      const allTodos: Todo[] = todosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Todo));

      // Categorize todos
      const pending = allTodos.filter(todo => !todo.completed);
      const overdue = pending.filter(todo => 
        todo.dueDate && new Date(todo.dueDate) < now
      );
      const completedRecent = config.includeCompleted 
        ? allTodos.filter(todo => 
            todo.completed && 
            todo.completedAt && 
            new Date(todo.completedAt) >= recentCutoff
          )
        : [];

      // Calculate completion rate
      const totalCompleted = allTodos.filter(todo => todo.completed).length;
      const completionRate = allTodos.length > 0 
        ? (totalCompleted / allTodos.length) * 100 
        : 0;

      // Calculate member statistics
      const memberStats = await this.calculateMemberTodoStats(allTodos, recentCutoff);

      return {
        pending,
        overdue,
        completedRecent,
        totalCount: allTodos.length,
        completionRate,
        memberStats
      };
    } catch (error) {
      console.error('Todo aggregation error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      
      throw new DataAggregationError(
        `Failed to aggregate todo data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TODO_AGGREGATION_FAILED',
        error
      );
    }
  }

  // Aggregate event data with upcoming and weekly views
  private async aggregateEvents(config: AggregationConfig): Promise<AggregatedFamilyData['events']> {
    try {
      const now = new Date();
      const upcomingCutoff = new Date(now.getTime() + config.daysForUpcoming * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Fetch all events (remove date filter temporarily to debug)
      const eventsQuery = query(
        collection(this.db, 'events'),
        limit(config.maxItemsPerCategory)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      
      // ENHANCED date extraction with validation and timezone handling
      const getEventDate = (event: any) => {
        // Use ONLY startDate to avoid confusion - this is the standard field
        const dateValue = event.startDate;
        if (dateValue) {
          let eventDate: Date;
          
          // Handle Firestore Timestamp
          if (dateValue.toDate) {
            eventDate = dateValue.toDate();
          } else {
            // Handle string dates as fallback
            eventDate = new Date(dateValue);
          }
          
          // Validate the date
          if (isNaN(eventDate.getTime())) {
            console.error('Invalid date extracted from event:', {
              title: event.title,
              id: event.id,
              startDate: dateValue,
              extractedDate: eventDate
            });
            return null;
          }
          
          // Log for debugging in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Date extracted:', {
              title: event.title,
              originalDate: dateValue,
              extractedDate: eventDate,
              formatted: eventDate.toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })
            });
          }
          
          return eventDate;
        }
        console.warn('Event missing startDate field:', event.title || event.id);
        return null;
      };
      
      // Events loaded successfully from Firebase
      
      const allEvents: CalendarEvent[] = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent));
      
      const upcoming = allEvents.filter(event => {
        const eventDate = getEventDate(event);
        return eventDate && eventDate >= now && eventDate <= upcomingCutoff;
      });
      
      const thisWeek = allEvents.filter(event => {
        const eventDate = getEventDate(event);
        return eventDate && eventDate >= now && eventDate <= weekEnd;
      });
      const nextWeek = allEvents.filter(event => {
        const eventDate = getEventDate(event);
        return eventDate && eventDate > weekEnd && eventDate <= nextWeekEnd;
      });

      // Calculate member event statistics
      const memberEvents = this.calculateMemberEventStats(allEvents);

      return {
        upcoming,
        thisWeek,
        nextWeek,
        totalCount: allEvents.length,
        memberEvents
      };
    } catch (error) {
      console.error('Event aggregation error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      
      throw new DataAggregationError(
        `Failed to aggregate event data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EVENT_AGGREGATION_FAILED',
        error
      );
    }
  }

  // Aggregate grocery data with categories and urgency
  private async aggregateGroceries(config: AggregationConfig): Promise<AggregatedFamilyData['groceries']> {
    try {
      const now = new Date();
      const recentCutoff = new Date(now.getTime() - config.daysForRecent * 24 * 60 * 60 * 1000);

      // Fetch all grocery items
      const groceriesQuery = query(
        collection(this.db, 'grocery_items'),
        orderBy('createdAt', 'desc'),
        limit(config.maxItemsPerCategory)
      );

      const groceriesSnapshot = await getDocs(groceriesQuery);
      const allGroceries: GroceryItem[] = groceriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GroceryItem));

      // Categorize groceries (using 'checked' instead of 'completed')
      const pending = allGroceries.filter(item => !item.checked);
      const urgentItems = pending.filter(item => 
        item.notes?.includes('urgent') || item.notes?.includes('high priority')
      );
      const completedRecent = config.includeCompleted
        ? allGroceries.filter(item => 
            item.checked && 
            item.checkedAt && 
            new Date(item.checkedAt) >= recentCutoff
          )
        : [];

      // Calculate completion rate
      const totalCompleted = allGroceries.filter(item => item.checked).length;
      const completionRate = allGroceries.length > 0 
        ? (totalCompleted / allGroceries.length) * 100 
        : 0;

      // Calculate category statistics
      const categoryStats = this.calculateGroceryCategoryStats(allGroceries);

      return {
        pending,
        urgentItems,
        completedRecent,
        totalCount: allGroceries.length,
        completionRate,
        categoryStats
      };
    } catch (error) {
      console.error('Grocery aggregation error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      
      throw new DataAggregationError(
        `Failed to aggregate grocery data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GROCERY_AGGREGATION_FAILED',
        error
      );
    }
  }

  // Aggregate document data with recent uploads
  private async aggregateDocuments(config: AggregationConfig): Promise<AggregatedFamilyData['documents']> {
    try {
      const now = new Date();
      const recentCutoff = new Date(now.getTime() - config.daysForRecent * 24 * 60 * 60 * 1000);

      // Fetch recent documents
      const documentsQuery = query(
        collection(this.db, 'family_documents'),
        orderBy('uploadedAt', 'desc'),
        limit(config.maxItemsPerCategory)
      );

      const documentsSnapshot = await getDocs(documentsQuery);
      const allDocuments: FamilyDocument[] = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FamilyDocument));

      // Get recent documents (using 'createdAt' since 'uploadedAt' doesn't exist)
      const recent = allDocuments.filter(doc => 
        new Date(doc.createdAt) >= recentCutoff
      );

      // Calculate type statistics
      const typeStats = this.calculateDocumentTypeStats(allDocuments, recentCutoff);

      return {
        recent,
        totalCount: allDocuments.length,
        typeStats
      };
    } catch (error) {
      throw new DataAggregationError(
        'Failed to aggregate document data',
        'DOCUMENT_AGGREGATION_FAILED',
        error
      );
    }
  }

  // Get family members list
  private async getFamilyMembers(): Promise<FamilyMemberInfo[]> {
    try {
      // Note: Family members are typically stored in user profile or separate collection
      // For now, we'll extract from existing data or use a default set
      // This should be updated based on your actual family member storage strategy
      
      const familyMembers: FamilyMemberInfo[] = [
        { id: 'gonzalo', name: 'Gonzalo', email: 'gonzalo@famapp.com' },
        { id: 'mpaz', name: 'Mpaz', email: 'mpaz@famapp.com' },
        { id: 'borja', name: 'Borja', email: 'borja@famapp.com' },
        { id: 'melody', name: 'Melody', email: 'melody@famapp.com' }
      ];

      return familyMembers;
    } catch (error) {
      throw new DataAggregationError(
        'Failed to get family members',
        'FAMILY_MEMBERS_FAILED',
        error
      );
    }
  }

  // Calculate member todo statistics
  private calculateMemberTodoStats(todos: Todo[], recentCutoff: Date): MemberTodoStats[] {
    const memberMap = new Map<string, MemberTodoStats>();

    // Initialize stats for all family members
    const familyMembers: FamilyMemberInfo[] = [
      { id: 'gonzalo', name: 'Gonzalo', email: 'gonzalo@famapp.com' },
      { id: 'mpaz', name: 'Mpaz', email: 'mpaz@famapp.com' },
      { id: 'borja', name: 'Borja', email: 'borja@famapp.com' },
      { id: 'melody', name: 'Melody', email: 'melody@famapp.com' }
    ];

    familyMembers.forEach(member => {
      memberMap.set(member.id, {
        member,
        pendingTodos: 0,
        overdueTodos: 0,
        completedThisWeek: 0,
        completionRate: 0,
        productivity: 'medium'
      });
    });

    // Calculate stats for each member
    todos.forEach(todo => {
      if (todo.assignedTo) {
        const stats = memberMap.get(todo.assignedTo);
        if (stats) {
          if (!todo.completed) {
            stats.pendingTodos++;
            if (todo.dueDate && new Date(todo.dueDate) < new Date()) {
              stats.overdueTodos++;
            }
          } else if (todo.completedAt && new Date(todo.completedAt) >= recentCutoff) {
            stats.completedThisWeek++;
          }
        }
      }
    });

    // Calculate completion rates and productivity
    memberMap.forEach(stats => {
      const totalTodos = stats.pendingTodos + stats.completedThisWeek;
      stats.completionRate = totalTodos > 0 
        ? (stats.completedThisWeek / totalTodos) * 100 
        : 0;

      // Determine productivity level
      if (stats.completionRate >= 80 && stats.overdueTodos === 0) {
        stats.productivity = 'high';
      } else if (stats.completionRate < 50 || stats.overdueTodos > 2) {
        stats.productivity = 'low';
      } else {
        stats.productivity = 'medium';
      }
    });

    return Array.from(memberMap.values());
  }

  // Calculate member event statistics
  private calculateMemberEventStats(events: CalendarEvent[]): MemberEventStats[] {
    const memberMap = new Map<string, MemberEventStats>();
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    events.forEach(event => {
      if (event.assignedTo) {
        const member: FamilyMemberInfo = { id: event.assignedTo, name: event.assignedTo, email: '' };
        
        if (!memberMap.has(event.assignedTo)) {
          memberMap.set(event.assignedTo, {
            member,
            upcomingEvents: 0,
            eventsThisWeek: 0,
            eventTypes: [],
            busyDays: []
          });
        }

        const stats = memberMap.get(event.assignedTo)!;
        stats.upcomingEvents++;
        
        if (new Date(event.startDate) <= weekEnd) {
          stats.eventsThisWeek++;
        }

        // Add busy days (dates with events)
        const eventDate = new Date(event.startDate);
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const exists = stats.busyDays.some(date => 
          date.getTime() === eventDateOnly.getTime()
        );
        if (!exists) {
          stats.busyDays.push(eventDateOnly);
        }

        // For now, we'll use a simplified event type based on title keywords
        const eventType = this.inferEventType(event.title);
        if (eventType && !stats.eventTypes.includes(eventType)) {
          stats.eventTypes.push(eventType);
        }
      }
    });

    return Array.from(memberMap.values());
  }

  // Calculate grocery category statistics
  private calculateGroceryCategoryStats(groceries: GroceryItem[]): GroceryCategoryStats[] {
    const categoryMap = new Map<string, GroceryCategoryStats>();

    groceries.forEach(item => {
      const category = item.category || 'Other';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          pendingItems: 0,
          totalItems: 0,
          urgentItems: 0
        });
      }

      const stats = categoryMap.get(category)!;
      stats.totalItems++;
      
      if (!item.checked) {
        stats.pendingItems++;
        if (item.notes?.includes('urgent') || item.notes?.includes('high priority')) {
          stats.urgentItems++;
        }
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.totalItems - a.totalItems);
  }

  // Calculate document type statistics
  private calculateDocumentTypeStats(documents: FamilyDocument[], recentCutoff: Date): DocumentTypeStats[] {
    const typeMap = new Map<string, { stats: DocumentTypeStats; totalSize: number }>();

    documents.forEach(doc => {
      // Infer document type from file extension or name
      const type = this.inferDocumentType(doc.fileName);
      
      if (!typeMap.has(type)) {
        typeMap.set(type, {
          stats: {
            type,
            count: 0,
            recentCount: 0,
            averageSize: 0,
            lastUploaded: undefined
          },
          totalSize: 0
        });
      }

      const entry = typeMap.get(type)!;
      entry.stats.count++;
      entry.totalSize += doc.fileSize || 0;
      
      // Update last uploaded date
      const docDate = new Date(doc.createdAt);
      if (!entry.stats.lastUploaded || docDate > entry.stats.lastUploaded) {
        entry.stats.lastUploaded = docDate;
      }
      
      if (new Date(doc.createdAt) >= recentCutoff) {
        entry.stats.recentCount++;
      }
    });

    // Calculate average sizes and return final stats
    return Array.from(typeMap.values())
      .map(entry => ({
        ...entry.stats,
        averageSize: entry.stats.count > 0 ? entry.totalSize / entry.stats.count : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Calculate overall summary statistics
  private calculateSummary(
    todos: AggregatedFamilyData['todos'],
    events: AggregatedFamilyData['events'],
    groceries: AggregatedFamilyData['groceries'],
    documents: AggregatedFamilyData['documents'],
    aggregationTime: number
  ): AggregatedFamilyData['summary'] {
    const now = new Date();
    
    // Calculate total active tasks
    const totalActiveTasks = todos.pending.length + groceries.pending.length;
    
    // Calculate urgent items count
    const urgentItemsCount = todos.overdue.length + groceries.urgentItems.length;
    
    // Calculate health score (0-100)
    let healthScore = 100;
    
    // Deduct for overdue items
    healthScore -= todos.overdue.length * 5;
    
    // Deduct for low completion rates
    if (todos.completionRate < 70) {
      healthScore -= (70 - todos.completionRate) * 0.5;
    }
    
    // Deduct for urgent grocery items
    healthScore -= groceries.urgentItems.length * 3;
    
    // Ensure health score stays within bounds
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Determine data freshness
    const dataFreshness: DataFreshness = {
      todos: now,
      events: now,
      groceries: now,
      documents: now,
      overallStatus: aggregationTime < 2000 ? 'fresh' : aggregationTime < 5000 ? 'stale' : 'outdated'
    };

    // Create weekly trends placeholder (would be calculated from historical data)
    const weeklyTrends: WeeklyTrends = {
      todoCompletion: { currentWeek: todos.completionRate, previousWeek: todos.completionRate, change: 0, trend: 'stable' },
      eventScheduling: { currentWeek: events.totalCount, previousWeek: events.totalCount, change: 0, trend: 'stable' },
      groceryShopping: { currentWeek: groceries.completionRate, previousWeek: groceries.completionRate, change: 0, trend: 'stable' },
      documentActivity: { currentWeek: documents.totalCount, previousWeek: documents.totalCount, change: 0, trend: 'stable' }
    };

    return {
      generatedAt: now,
      dataFreshness,
      totalActiveTasks,
      urgentItemsCount,
      healthScore,
      weeklyTrends,
      recommendations: [] // Placeholder for AI-generated recommendations
    };
  }

  // Helper function to infer event type from title
  private inferEventType(title: string): EventType {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('school') || titleLower.includes('meeting') || titleLower.includes('pta')) {
      return 'education';
    } else if (titleLower.includes('doctor') || titleLower.includes('medical') || titleLower.includes('appointment')) {
      return 'medical';
    } else if (titleLower.includes('birthday') || titleLower.includes('party') || titleLower.includes('celebration')) {
      return 'social';
    } else if (titleLower.includes('work') || titleLower.includes('office') || titleLower.includes('business')) {
      return 'work';
    } else if (titleLower.includes('sport') || titleLower.includes('gym') || titleLower.includes('exercise')) {
      return 'fitness';
    } else {
      return 'general';
    }
  }

  // Helper function to infer document type from filename
  private inferDocumentType(fileName: string): DocumentType {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(extension)) {
      return 'PDF';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'Word Document';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'Spreadsheet';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return 'Image';
    } else if (['mp4', 'avi', 'mov'].includes(extension)) {
      return 'Video';
    } else {
      return 'Other';
    }
  }

  // Health check for data aggregation service
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic Firestore connectivity
      const testQuery = query(
        collection(this.db, 'todos'),
        limit(1)
      );
      
      await getDocs(testQuery);
      return true;
    } catch (error) {
      console.error('Data aggregation health check failed:', error);
      return false;
    }
  }
}
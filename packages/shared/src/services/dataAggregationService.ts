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

// Aggregated family data interface for AI processing
export interface AggregatedFamilyData {
  todos: {
    pending: Todo[];
    overdue: Todo[];
    completedRecent: Todo[];
    totalCount: number;
    completionRate: number;
    memberStats: MemberStats[];
  };
  events: {
    upcoming: CalendarEvent[];
    thisWeek: CalendarEvent[];
    nextWeek: CalendarEvent[];
    totalCount: number;
    memberEvents: MemberEventStats[];
  };
  groceries: {
    pending: GroceryItem[];
    urgentItems: GroceryItem[];
    completedRecent: GroceryItem[];
    totalCount: number;
    completionRate: number;
    categoryStats: CategoryStats[];
  };
  documents: {
    recent: FamilyDocument[];
    totalCount: number;
    typeStats: DocumentTypeStats[];
  };
  familyMembers: MemberInfo[];
  summary: {
    generatedAt: Date;
    dataFreshness: DataFreshness;
    totalActiveTasks: number;
    urgentItemsCount: number;
    healthScore: number;
  };
}

// Supporting interfaces for aggregated data
export interface MemberInfo {
  id: FamilyMember;
  name: string;
  email: string;
}

export interface MemberStats {
  member: MemberInfo;
  pendingTodos: number;
  overdueTodos: number;
  completedThisWeek: number;
  completionRate: number;
  productivity: 'high' | 'medium' | 'low';
}

export interface MemberEventStats {
  member: MemberInfo;
  upcomingEvents: number;
  eventsThisWeek: number;
  eventTypes: string[];
}

export interface CategoryStats {
  category: string;
  pendingItems: number;
  totalItems: number;
  urgentItems: number;
}

export interface DocumentTypeStats {
  type: string;
  count: number;
  recentCount: number;
}

export interface DataFreshness {
  todos: Date;
  events: Date;
  groceries: Date;
  documents: Date;
  overallStatus: 'fresh' | 'stale' | 'outdated';
}

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
    return getFirebaseServices().db;
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
      const [
        todosData,
        eventsData,
        groceriesData,
        documentsData,
        familyMembers
      ] = await Promise.all([
        this.aggregateTodos(fullConfig),
        this.aggregateEvents(fullConfig),
        this.aggregateGroceries(fullConfig),
        this.aggregateDocuments(fullConfig),
        this.getFamilyMembers()
      ]);

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
      throw new DataAggregationError(
        'Failed to aggregate family data',
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
        collection(this.db, 'family_todos'),
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
      throw new DataAggregationError(
        'Failed to aggregate todo data',
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

      // Fetch upcoming events
      const eventsQuery = query(
        collection(this.db, 'family_events'),
        where('date', '>=', Timestamp.fromDate(now)),
        orderBy('date', 'asc'),
        limit(config.maxItemsPerCategory)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const allEvents: CalendarEvent[] = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent));

      // Categorize events
      const upcoming = allEvents.filter(event => 
        new Date(event.startDate) <= upcomingCutoff
      );
      const thisWeek = allEvents.filter(event => 
        new Date(event.startDate) <= weekEnd
      );
      const nextWeek = allEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate > weekEnd && eventDate <= nextWeekEnd;
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
      throw new DataAggregationError(
        'Failed to aggregate event data',
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
        collection(this.db, 'family_groceries'),
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
      throw new DataAggregationError(
        'Failed to aggregate grocery data',
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
  private async getFamilyMembers(): Promise<MemberInfo[]> {
    try {
      // Note: Family members are typically stored in user profile or separate collection
      // For now, we'll extract from existing data or use a default set
      // This should be updated based on your actual family member storage strategy
      
      const familyMembers: MemberInfo[] = [
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
  private calculateMemberTodoStats(todos: Todo[], recentCutoff: Date): MemberStats[] {
    const memberMap = new Map<string, MemberStats>();

    // Initialize stats for all family members
    const familyMembers: MemberInfo[] = [
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
        const member: MemberInfo = { id: event.assignedTo, name: event.assignedTo, email: '' };
        
        if (!memberMap.has(event.assignedTo)) {
          memberMap.set(event.assignedTo, {
            member,
            upcomingEvents: 0,
            eventsThisWeek: 0,
            eventTypes: []
          });
        }

        const stats = memberMap.get(event.assignedTo)!;
        stats.upcomingEvents++;
        
        if (new Date(event.startDate) <= weekEnd) {
          stats.eventsThisWeek++;
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
  private calculateGroceryCategoryStats(groceries: GroceryItem[]): CategoryStats[] {
    const categoryMap = new Map<string, CategoryStats>();

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
    const typeMap = new Map<string, DocumentTypeStats>();

    documents.forEach(doc => {
      // Infer document type from file extension or name
      const type = this.inferDocumentType(doc.fileName);
      
      if (!typeMap.has(type)) {
        typeMap.set(type, {
          type,
          count: 0,
          recentCount: 0
        });
      }

      const stats = typeMap.get(type)!;
      stats.count++;
      
      if (new Date(doc.createdAt) >= recentCutoff) {
        stats.recentCount++;
      }
    });

    return Array.from(typeMap.values()).sort((a, b) => b.count - a.count);
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

    return {
      generatedAt: now,
      dataFreshness,
      totalActiveTasks,
      urgentItemsCount,
      healthScore
    };
  }

  // Helper function to infer event type from title
  private inferEventType(title: string): string {
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
  private inferDocumentType(fileName: string): string {
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
        collection(this.db, 'family_todos'),
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
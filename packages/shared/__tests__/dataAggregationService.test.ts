import {
  DataAggregationService,
  DataAggregationError,
  type AggregationConfig,
  type AggregatedFamilyData,
  type MemberInfo,
  type MemberStats
} from '../src/services/dataAggregationService';
import { authService } from '../src/services/authService';
import { getFirebaseServices } from '../src/services/firebase';
import type { Todo } from '../src/types/todo';
import type { CalendarEvent } from '../src/types/calendar';
import type { GroceryItem } from '../src/types/grocery';
import type { FamilyDocument } from '../src/types/document';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

// Mock Firebase services
jest.mock('../src/services/firebase', () => ({
  getFirebaseServices: jest.fn(),
}));

// Mock auth service
jest.mock('../src/services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

import { getDocs } from 'firebase/firestore';

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockGetFirebaseServices = getFirebaseServices as jest.MockedFunction<typeof getFirebaseServices>;
const mockGetCurrentUser = authService.getCurrentUser as jest.MockedFunction<typeof authService.getCurrentUser>;

describe('DataAggregationService', () => {
  let service: DataAggregationService;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase services
    mockDb = {
      collection: jest.fn(),
    };
    
    mockGetFirebaseServices.mockReturnValue({
      db: mockDb,
      auth: {},
      storage: {},
      initializeApp: jest.fn(),
    } as any);

    // Mock authenticated user
    mockGetCurrentUser.mockReturnValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      familyMember: 'gonzalo',
    } as any);

    service = new DataAggregationService();
  });

  describe('Constructor', () => {
    it('should create data aggregation service', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DataAggregationService);
    });
  });

  describe('aggregateFamilyData', () => {
    it('should aggregate all family data successfully', async () => {
      // Mock data for all collections
      const mockTodos: Todo[] = [
        {
          id: 'todo1',
          title: 'Buy groceries',
          description: 'Get food for the week',
          completed: false,
          assignedTo: 'gonzalo',
          createdBy: 'test-user',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in the future
          priority: 'medium',
          tags: []
        } as Todo,
        {
          id: 'todo2',
          title: 'Doctor appointment',
          description: 'Annual checkup',
          completed: true,
          assignedTo: 'mpaz',
          createdBy: 'test-user',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          priority: 'high',
          tags: []
        } as Todo
      ];

      const mockEvents: CalendarEvent[] = [
        {
          id: 'event1',
          title: 'School meeting',
          description: 'PTA meeting',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-15'),
          allDay: false,
          assignedTo: 'borja',
          createdBy: 'test-user',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      const mockGroceries: GroceryItem[] = [
        {
          id: 'grocery1',
          name: 'Milk',
          category: 'Dairy',
          quantity: 1,
          unit: 'liter',
          checked: false,
          addedBy: 'test-user',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          notes: 'urgent'
        }
      ];

      const mockDocuments: FamilyDocument[] = [
        {
          id: 'doc1',
          name: 'Test Document',
          description: 'A test document',
          category: 'General',
          tags: [],
          fileUrl: 'https://example.com/doc.pdf',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedBy: 'test-user',
          sharedWith: ['gonzalo'],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ];

      // Mock Firestore responses
      mockGetDocs
        .mockResolvedValueOnce({
          docs: mockTodos.map(todo => ({
            id: todo.id,
            data: () => todo
          }))
        } as any)
        .mockResolvedValueOnce({
          docs: mockEvents.map(event => ({
            id: event.id,
            data: () => event
          }))
        } as any)
        .mockResolvedValueOnce({
          docs: mockGroceries.map(grocery => ({
            id: grocery.id,
            data: () => grocery
          }))
        } as any)
        .mockResolvedValueOnce({
          docs: mockDocuments.map(doc => ({
            id: doc.id,
            data: () => doc
          }))
        } as any);

      const result = await service.aggregateFamilyData();

      expect(result).toBeDefined();
      expect(result.todos).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.groceries).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.familyMembers).toBeDefined();
      expect(result.summary).toBeDefined();

      // Verify todos aggregation
      expect(result.todos.pending).toHaveLength(1);
      expect(result.todos.pending[0].title).toBe('Buy groceries');
      expect(result.todos.completedRecent).toHaveLength(1);
      expect(result.todos.totalCount).toBe(2);
      expect(result.todos.completionRate).toBe(50);

      // Verify events aggregation
      expect(result.events.upcoming).toHaveLength(1);
      expect(result.events.totalCount).toBe(1);

      // Verify groceries aggregation
      expect(result.groceries.pending).toHaveLength(1);
      expect(result.groceries.urgentItems).toHaveLength(1);
      expect(result.groceries.totalCount).toBe(1);

      // Verify documents aggregation
      expect(result.documents.recent).toHaveLength(1);
      expect(result.documents.totalCount).toBe(1);

      // Verify family members
      expect(result.familyMembers).toHaveLength(4);

      // Verify summary
      expect(result.summary.generatedAt).toBeInstanceOf(Date);
      expect(result.summary.totalActiveTasks).toBe(2); // 1 pending todo + 1 pending grocery
      expect(result.summary.urgentItemsCount).toBe(1); // 1 urgent grocery
      expect(typeof result.summary.healthScore).toBe('number');
    });

    it('should use custom configuration', async () => {
      const customConfig: Partial<AggregationConfig> = {
        daysForRecent: 14,
        maxItemsPerCategory: 10,
        includeCompleted: false
      };

      // Mock empty responses
      mockGetDocs.mockResolvedValue({
        docs: []
      } as any);

      const result = await service.aggregateFamilyData(customConfig);

      expect(result).toBeDefined();
      expect(result.todos.completedRecent).toHaveLength(0); // includeCompleted: false
    });

    it('should throw error when user is not authenticated', async () => {
      mockGetCurrentUser.mockReturnValue(null);

      await expect(service.aggregateFamilyData()).rejects.toThrow(DataAggregationError);
      await expect(service.aggregateFamilyData()).rejects.toThrow('User must be authenticated');
    });

    it('should handle aggregation errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      await expect(service.aggregateFamilyData()).rejects.toThrow(DataAggregationError);
      await expect(service.aggregateFamilyData()).rejects.toThrow('Failed to aggregate family data');
    });

    it('should warn on slow aggregation', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock slow response
      mockGetDocs.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ docs: [] } as any), 3500)
        )
      );

      await service.aggregateFamilyData();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Data aggregation took')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Todo Aggregation', () => {
    it('should categorize todos correctly', async () => {
      const now = new Date();
      const pastDue = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const recentCompletion = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      const mockTodos: Todo[] = [
        {
          id: 'overdue',
          title: 'Overdue task',
          completed: false,
          assignedTo: 'gonzalo',
          dueDate: pastDue,
          createdBy: 'test',
          createdAt: now,
          updatedAt: now,
          priority: 'high',
          tags: []
        } as Todo,
        {
          id: 'pending',
          title: 'Pending task',
          completed: false,
          assignedTo: 'mpaz',
          createdBy: 'test',
          createdAt: now,
          updatedAt: now,
          priority: 'medium',
          tags: []
        } as Todo,
        {
          id: 'completed',
          title: 'Completed task',
          completed: true,
          assignedTo: 'borja',
          completedAt: recentCompletion,
          createdBy: 'test',
          createdAt: now,
          updatedAt: now,
          priority: 'low',
          tags: []
        } as Todo
      ];

      mockGetDocs
        .mockResolvedValueOnce({
          docs: mockTodos.map(todo => ({ id: todo.id, data: () => todo }))
        } as any)
        .mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      expect(result.todos.pending).toHaveLength(2);
      expect(result.todos.overdue).toHaveLength(1);
      expect(result.todos.overdue[0].title).toBe('Overdue task');
      expect(result.todos.completedRecent).toHaveLength(1);
      expect(result.todos.completionRate).toBeCloseTo(33.33, 1);
    });

    it('should calculate member statistics correctly', async () => {
      const mockTodos: Todo[] = [
        {
          id: 'todo1',
          title: 'Task 1',
          completed: false,
          assignedTo: 'gonzalo',
          createdBy: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: 'high',
          tags: []
        } as Todo,
        {
          id: 'todo2',
          title: 'Task 2',
          completed: true,
          assignedTo: 'gonzalo',
          completedAt: new Date(),
          createdBy: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: 'medium',
          tags: []
        } as Todo
      ];

      mockGetDocs
        .mockResolvedValueOnce({
          docs: mockTodos.map(todo => ({ id: todo.id, data: () => todo }))
        } as any)
        .mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      const gonzaloStats = result.todos.memberStats.find(stat => stat.member.id === 'gonzalo');
      expect(gonzaloStats).toBeDefined();
      expect(gonzaloStats!.pendingTodos).toBe(1);
      expect(gonzaloStats!.completedThisWeek).toBe(1);
      expect(gonzaloStats!.completionRate).toBe(50);
      expect(gonzaloStats!.productivity).toBe('medium');
    });
  });

  describe('Event Aggregation', () => {
    it('should categorize events by time periods', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

      const mockEvents: CalendarEvent[] = [
        {
          id: 'event1',
          title: 'Tomorrow event',
          startDate: tomorrow,
          endDate: tomorrow,
          allDay: false,
          assignedTo: 'gonzalo',
          createdBy: 'test',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'event2',
          title: 'Next week event',
          startDate: nextWeek,
          endDate: nextWeek,
          allDay: false,
          assignedTo: 'mpaz',
          createdBy: 'test',
          createdAt: now,
          updatedAt: now
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({
          docs: mockEvents.map(event => ({ id: event.id, data: () => event }))
        } as any)
        .mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      expect(result.events.upcoming).toHaveLength(2);
      expect(result.events.thisWeek).toHaveLength(1);
      expect(result.events.nextWeek).toHaveLength(1);
      expect(result.events.totalCount).toBe(2);
    });

    it('should calculate member event statistics', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockEvents: CalendarEvent[] = [
        {
          id: 'event1',
          title: 'School meeting',
          startDate: tomorrow,
          endDate: tomorrow,
          allDay: false,
          assignedTo: 'gonzalo',
          createdBy: 'test',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'event2',
          title: 'Doctor appointment',
          startDate: tomorrow,
          endDate: tomorrow,
          allDay: false,
          assignedTo: 'gonzalo',
          createdBy: 'test',
          createdAt: now,
          updatedAt: now
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({
          docs: mockEvents.map(event => ({ id: event.id, data: () => event }))
        } as any)
        .mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      const gonzaloEvents = result.events.memberEvents.find(stat => stat.member.id === 'gonzalo');
      expect(gonzaloEvents).toBeDefined();
      expect(gonzaloEvents!.upcomingEvents).toBe(2);
      expect(gonzaloEvents!.eventsThisWeek).toBe(2);
      expect(gonzaloEvents!.eventTypes).toContain('education');
      expect(gonzaloEvents!.eventTypes).toContain('medical');
    });
  });

  describe('Grocery Aggregation', () => {
    it('should categorize groceries correctly', async () => {
      const now = new Date();
      const recentCheck = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const mockGroceries: GroceryItem[] = [
        {
          id: 'grocery1',
          name: 'Milk',
          category: 'Dairy',
          quantity: 1,
          unit: 'liter',
          checked: false,
          addedBy: 'test',
          createdAt: now,
          updatedAt: now,
          notes: 'urgent priority'
        },
        {
          id: 'grocery2',
          name: 'Bread',
          category: 'Bakery',
          quantity: 1,
          unit: 'loaf',
          checked: false,
          addedBy: 'test',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'grocery3',
          name: 'Eggs',
          category: 'Dairy',
          quantity: 12,
          unit: 'pcs',
          checked: true,
          checkedAt: recentCheck,
          addedBy: 'test',
          createdAt: now,
          updatedAt: now
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({
          docs: mockGroceries.map(grocery => ({ id: grocery.id, data: () => grocery }))
        } as any)
        .mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      expect(result.groceries.pending).toHaveLength(2);
      expect(result.groceries.urgentItems).toHaveLength(1);
      expect(result.groceries.urgentItems[0].name).toBe('Milk');
      expect(result.groceries.completedRecent).toHaveLength(1);
      expect(result.groceries.completionRate).toBeCloseTo(33.33, 1);
    });

    it('should calculate category statistics', async () => {
      const mockGroceries: GroceryItem[] = [
        {
          id: 'dairy1',
          name: 'Milk',
          category: 'Dairy',
          quantity: 1,
          unit: 'liter',
          checked: false,
          addedBy: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
          notes: 'urgent'
        },
        {
          id: 'dairy2',
          name: 'Cheese',
          category: 'Dairy',
          quantity: 1,
          unit: 'pack',
          checked: true,
          addedBy: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({
          docs: mockGroceries.map(grocery => ({ id: grocery.id, data: () => grocery }))
        } as any)
        .mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      const dairyStats = result.groceries.categoryStats.find(stat => stat.category === 'Dairy');
      expect(dairyStats).toBeDefined();
      expect(dairyStats!.totalItems).toBe(2);
      expect(dairyStats!.pendingItems).toBe(1);
      expect(dairyStats!.urgentItems).toBe(1);
    });
  });

  describe('Document Aggregation', () => {
    it('should categorize documents by type', async () => {
      const now = new Date();

      const mockDocuments: FamilyDocument[] = [
        {
          id: 'doc1',
          name: 'Report',
          description: 'PDF report',
          category: 'Reports',
          tags: [],
          fileUrl: 'url1',
          fileName: 'report.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedBy: 'test',
          sharedWith: ['gonzalo'],
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'doc2',
          name: 'Image',
          description: 'Family photo',
          category: 'Photos',
          tags: [],
          fileUrl: 'url2',
          fileName: 'photo.jpg',
          fileSize: 2048,
          fileType: 'image/jpeg',
          uploadedBy: 'test',
          sharedWith: ['mpaz'],
          createdAt: now,
          updatedAt: now
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({
          docs: mockDocuments.map(doc => ({ id: doc.id, data: () => doc }))
        } as any);

      const result = await service.aggregateFamilyData();

      expect(result.documents.totalCount).toBe(2);
      expect(result.documents.recent).toHaveLength(2);

      const pdfStats = result.documents.typeStats.find(stat => stat.type === 'PDF');
      const imageStats = result.documents.typeStats.find(stat => stat.type === 'Image');

      expect(pdfStats).toBeDefined();
      expect(pdfStats!.count).toBe(1);
      expect(imageStats).toBeDefined();
      expect(imageStats!.count).toBe(1);
    });
  });

  describe('Helper Functions', () => {
    it('should infer event types correctly', async () => {
      const events: CalendarEvent[] = [
        {
          id: 'school',
          title: 'School PTA meeting',
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          assignedTo: 'gonzalo',
          createdBy: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'medical',
          title: 'Doctor appointment',
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          assignedTo: 'mpaz',
          createdBy: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'birthday',
          title: 'Birthday party',
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          assignedTo: 'borja',
          createdBy: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({
          docs: events.map(event => ({ id: event.id, data: () => event }))
        } as any)
        .mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      const gonzaloEvents = result.events.memberEvents.find(m => m.member.id === 'gonzalo');
      const mpazEvents = result.events.memberEvents.find(m => m.member.id === 'mpaz');
      const borjaEvents = result.events.memberEvents.find(m => m.member.id === 'borja');

      expect(gonzaloEvents?.eventTypes).toContain('education');
      expect(mpazEvents?.eventTypes).toContain('medical');
      expect(borjaEvents?.eventTypes).toContain('social');
    });

    it('should infer document types correctly', async () => {
      const documents: FamilyDocument[] = [
        {
          id: 'pdf',
          name: 'Document',
          description: 'PDF file',
          category: 'General',
          tags: [],
          fileUrl: 'url',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedBy: 'test',
          sharedWith: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'word',
          name: 'Document',
          description: 'Word file',
          category: 'General',
          tags: [],
          fileUrl: 'url',
          fileName: 'document.docx',
          fileSize: 1024,
          fileType: 'application/docx',
          uploadedBy: 'test',
          sharedWith: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'excel',
          name: 'Spreadsheet',
          description: 'Excel file',
          category: 'General',
          tags: [],
          fileUrl: 'url',
          fileName: 'data.xlsx',
          fileSize: 1024,
          fileType: 'application/xlsx',
          uploadedBy: 'test',
          sharedWith: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({
          docs: documents.map(doc => ({ id: doc.id, data: () => doc }))
        } as any);

      const result = await service.aggregateFamilyData();

      const typeNames = result.documents.typeStats.map(stat => stat.type);
      expect(typeNames).toContain('PDF');
      expect(typeNames).toContain('Word Document');
      expect(typeNames).toContain('Spreadsheet');
    });
  });

  describe('Summary Calculation', () => {
    it('should calculate health score correctly', async () => {
      const now = new Date();
      const pastDue = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockTodos: Todo[] = [
        {
          id: 'overdue1',
          title: 'Overdue 1',
          completed: false,
          assignedTo: 'gonzalo',
          dueDate: pastDue,
          createdBy: 'test',
          createdAt: now,
          updatedAt: now,
          priority: 'high',
          tags: []
        } as Todo,
        {
          id: 'overdue2',
          title: 'Overdue 2',
          completed: false,
          assignedTo: 'mpaz',
          dueDate: pastDue,
          createdBy: 'test',
          createdAt: now,
          updatedAt: now,
          priority: 'high',
          tags: []
        } as Todo
      ];

      const mockGroceries: GroceryItem[] = [
        {
          id: 'urgent1',
          name: 'Urgent item',
          category: 'Other',
          quantity: 1,
          unit: 'pcs',
          checked: false,
          addedBy: 'test',
          createdAt: now,
          updatedAt: now,
          notes: 'urgent'
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({
          docs: mockTodos.map(todo => ({ id: todo.id, data: () => todo }))
        } as any)
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockResolvedValueOnce({
          docs: mockGroceries.map(grocery => ({ id: grocery.id, data: () => grocery }))
        } as any)
        .mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      // Health score should be penalized for overdue todos and urgent groceries
      expect(result.summary.healthScore).toBeLessThan(100);
      expect(result.summary.totalActiveTasks).toBe(3); // 2 overdue todos + 1 pending grocery
      expect(result.summary.urgentItemsCount).toBe(3); // 2 overdue todos + 1 urgent grocery
    });

    it('should set data freshness status correctly', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      expect(result.summary.dataFreshness.overallStatus).toBe('fresh');
      expect(result.summary.dataFreshness.todos).toBeInstanceOf(Date);
      expect(result.summary.dataFreshness.events).toBeInstanceOf(Date);
      expect(result.summary.dataFreshness.groceries).toBeInstanceOf(Date);
      expect(result.summary.dataFreshness.documents).toBeInstanceOf(Date);
    });
  });

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] } as any);

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false for failed health check', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.healthCheck();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data aggregation health check failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore query errors', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Query failed'));

      await expect(service.aggregateFamilyData()).rejects.toThrow(DataAggregationError);
      await expect(service.aggregateFamilyData()).rejects.toThrow('Failed to aggregate family data');
    });

    it('should handle individual aggregation method errors', async () => {
      // Mock first call (todos) to succeed, second call (events) to fail
      mockGetDocs
        .mockResolvedValueOnce({ docs: [] } as any)
        .mockRejectedValueOnce(new Error('Events query failed'));

      await expect(service.aggregateFamilyData()).rejects.toThrow(DataAggregationError);
    });
  });

  describe('DataAggregationError', () => {
    it('should create error with message and code', () => {
      const error = new DataAggregationError('Test message', 'TEST_CODE');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('DataAggregationError');
      expect(error.originalError).toBeUndefined();
    });

    it('should create error with original error', () => {
      const originalError = new Error('Original error');
      const error = new DataAggregationError('Test message', 'TEST_CODE', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('Configuration Handling', () => {
    it('should use default configuration when none provided', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData();

      expect(result).toBeDefined();
      // Default config should be used (includeCompleted: true)
      expect(result.todos.completedRecent).toBeDefined();
    });

    it('should merge custom configuration with defaults', async () => {
      const customConfig: Partial<AggregationConfig> = {
        maxItemsPerCategory: 5
      };

      mockGetDocs.mockResolvedValue({ docs: [] } as any);

      const result = await service.aggregateFamilyData(customConfig);

      expect(result).toBeDefined();
      // Should still use default includeCompleted: true
      expect(result.todos.completedRecent).toBeDefined();
    });
  });
});
// Test Smart Alerts Service functionality
import { SmartAlertsService } from '../src/services/smartAlertsService';
import type { AggregatedFamilyData, Todo, CalendarEvent } from '../src/types';

// Mock AI service
jest.mock('../src/services/aiService', () => ({
  getAIService: () => ({
    generateAlerts: jest.fn().mockResolvedValue({
      content: 'AI alert response',
      metadata: {
        suggestions: [
          {
            actionType: 'create_todo',
            description: 'Consider creating a task for organizing documents.',
            targetItems: ['doc1']
          }
        ]
      },
      confidence: 0.85
    })
  })
}));

// Mock cache service
jest.mock('../src/services/dataCacheService', () => ({
  getDataCacheService: () => ({
    get: jest.fn(),
    set: jest.fn()
  })
}));

describe('SmartAlertsService', () => {
  let alertsService: SmartAlertsService;
  let mockFamilyData: AggregatedFamilyData;

  beforeEach(() => {
    alertsService = new SmartAlertsService({
      enableAIAlerts: true,
      enableRuleBasedAlerts: true,
      enablePatternDetection: false, // Disable for simpler testing
      alertRetentionDays: 1,
      maxAlertsPerCategory: 5
    });

    // Mock family data
    const overdueTodo: Todo = {
      id: 'todo1',
      title: 'Overdue Task',
      completed: false,
      assignedTo: 'gonzalo' as any,
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      priority: 'medium' as any,
      createdBy: 'test' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const urgentTodo: Todo = {
      id: 'todo2',
      title: 'Urgent Task',
      completed: false,
      assignedTo: 'mpaz' as any,
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      priority: 'high' as any,
      createdBy: 'test' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockFamilyData = {
      todos: {
        pending: [urgentTodo],
        overdue: [overdueTodo],
        completedRecent: [],
        totalCount: 2,
        completionRate: 0.3,
        memberStats: [
          {
            member: { id: 'gonzalo', name: 'Gonzalo', email: 'g@test.com' } as any,
            pendingTodos: 10,
            overdueTodos: 1,
            completedThisWeek: 2,
            completionRate: 0.3,
            productivity: 'low' as const
          }
        ]
      },
      events: {
        upcoming: [],
        thisWeek: [],
        nextWeek: [],
        totalCount: 0,
        memberEvents: []
      },
      groceries: {
        pending: [],
        urgentItems: [
          { id: 'grocery1', name: 'Milk', urgent: true } as any
        ],
        completedRecent: [],
        totalCount: 1,
        completionRate: 0.9,
        categoryStats: []
      },
      documents: {
        recent: [],
        totalCount: 0,
        typeStats: []
      },
      familyMembers: [],
      summary: {
        generatedAt: new Date(),
        dataFreshness: {
          todos: new Date(),
          events: new Date(),
          groceries: new Date(),
          documents: new Date(),
          overallStatus: 'fresh' as const
        },
        totalActiveTasks: 2,
        urgentItemsCount: 1,
        healthScore: 70,
        weeklyTrends: {
          todoCompletion: { currentWeek: 0.3, previousWeek: 0.4, change: -0.1, trend: 'down' as const },
          eventScheduling: { currentWeek: 0.9, previousWeek: 0.8, change: 0.1, trend: 'up' as const },
          groceryShopping: { currentWeek: 0.9, previousWeek: 0.8, change: 0.1, trend: 'up' as const },
          documentActivity: { currentWeek: 0.5, previousWeek: 0.4, change: 0.1, trend: 'up' as const }
        },
        recommendations: []
      }
    };
  });

  afterEach(() => {
    alertsService.clearAllAlerts();
  });

  describe('Rule-based Alerts', () => {
    test('should generate overdue tasks alert', async () => {
      const alerts = await alertsService.generateAlerts(mockFamilyData);
      
      const overdueAlert = alerts.find(a => a.category === 'overdue_task');
      expect(overdueAlert).toBeDefined();
      expect(overdueAlert?.title).toContain('1 Overdue Task');
      expect(overdueAlert?.priority).toBe('high');
      expect(overdueAlert?.affectedMembers).toContain('gonzalo');
    });

    test('should generate upcoming deadline alert', async () => {
      const alerts = await alertsService.generateAlerts(mockFamilyData);
      
      const deadlineAlert = alerts.find(a => a.category === 'upcoming_deadline');
      expect(deadlineAlert).toBeDefined();
      expect(deadlineAlert?.title).toBe('Tasks Due Tomorrow');
      expect(deadlineAlert?.priority).toBe('high');
    });

    test('should generate urgent groceries alert', async () => {
      const alerts = await alertsService.generateAlerts(mockFamilyData);
      
      const groceryAlert = alerts.find(a => a.category === 'grocery_urgent');
      expect(groceryAlert).toBeDefined();
      expect(groceryAlert?.title).toBe('Urgent Grocery Items');
      expect(groceryAlert?.message).toContain('1 items marked as urgent');
    });

    test('should generate low productivity alert', async () => {
      // Create a service with only rule-based alerts for this test
      const ruleOnlyService = new SmartAlertsService({
        enableAIAlerts: false,
        enableRuleBasedAlerts: true,
        enablePatternDetection: false,
        alertRetentionDays: 1,
        maxAlertsPerCategory: 5
      });
      
      // Create test data that triggers low productivity alert (completion rate < 0.3 AND > 10 pending)
      const lowProductivityData = {
        ...mockFamilyData,
        todos: {
          ...mockFamilyData.todos,
          pending: Array.from({ length: 15 }, (_, i) => ({
            id: `pending${i}`,
            title: `Pending Task ${i}`,
            completed: false,
            assignedTo: 'gonzalo' as any,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            priority: 'medium' as any,
            createdBy: 'test' as any,
            createdAt: new Date(),
            updatedAt: new Date()
          })),
          completionRate: 0.25 // Below 0.3 threshold
        }
      };
      
      const alerts = await ruleOnlyService.generateAlerts(lowProductivityData);
      
      const productivityAlert = alerts.find(a => a.category === 'productivity_insight');
      expect(productivityAlert).toBeDefined();
      expect(productivityAlert?.title).toBe('Productivity Alert');
      expect(productivityAlert?.message).toContain('25%');
    });

    test('should respect cooldown periods', async () => {
      // Create a service with only rule-based alerts and short cooldown for testing
      const cooldownService = new SmartAlertsService({
        enableAIAlerts: false, // Disable AI to test only rule-based cooldowns
        enableRuleBasedAlerts: true,
        enablePatternDetection: false,
        alertRetentionDays: 1,
        maxAlertsPerCategory: 5
      });
      
      // Generate alerts first time
      const alerts1 = await cooldownService.generateAlerts(mockFamilyData);
      const initialCount = alerts1.length;
      
      // Generate again immediately - should not create duplicates due to cooldown
      const alerts2 = await cooldownService.generateAlerts(mockFamilyData);
      expect(alerts2.length).toBeLessThanOrEqual(initialCount);
    });
  });

  describe('Schedule Conflict Detection', () => {
    test('should detect overlapping events', async () => {
      const conflictingEvents: CalendarEvent[] = [
        {
          id: 'event1',
          title: 'Meeting 1',
          startDate: new Date('2024-01-15T10:00:00'),
          endDate: new Date('2024-01-15T11:00:00'),
          assignedTo: 'gonzalo' as any,
          allDay: false,
          createdBy: 'test' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'event2',
          title: 'Meeting 2',
          startDate: new Date('2024-01-15T10:30:00'),
          endDate: new Date('2024-01-15T11:30:00'),
          assignedTo: 'gonzalo' as any,
          allDay: false,
          createdBy: 'test' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const dataWithConflicts = {
        ...mockFamilyData,
        events: {
          ...mockFamilyData.events,
          upcoming: conflictingEvents
        }
      };

      const alerts = await alertsService.generateAlerts(dataWithConflicts);
      
      const conflictAlert = alerts.find(a => a.category === 'schedule_conflict');
      expect(conflictAlert).toBeDefined();
      expect(conflictAlert?.priority).toBe('critical');
      expect(conflictAlert?.title).toBe('Schedule Conflict Detected');
    });

    test('should not detect conflicts for different members', async () => {
      const nonConflictingEvents: CalendarEvent[] = [
        {
          id: 'event1',
          title: 'Meeting 1',
          startDate: new Date('2024-01-15T10:00:00'),
          endDate: new Date('2024-01-15T11:00:00'),
          assignedTo: 'gonzalo' as any,
          allDay: false,
          createdBy: 'test' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'event2',
          title: 'Meeting 2',
          startDate: new Date('2024-01-15T10:30:00'),
          endDate: new Date('2024-01-15T11:30:00'),
          assignedTo: 'mpaz' as any, // Different member
          allDay: false,
          createdBy: 'test' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const dataWithEvents = {
        ...mockFamilyData,
        events: {
          ...mockFamilyData.events,
          upcoming: nonConflictingEvents
        }
      };

      const alerts = await alertsService.generateAlerts(dataWithEvents);
      
      const conflictAlert = alerts.find(a => a.category === 'schedule_conflict');
      expect(conflictAlert).toBeUndefined();
    });
  });

  describe('Alert Management', () => {
    test('should mark alert as read', async () => {
      const alerts = await alertsService.generateAlerts(mockFamilyData);
      const alert = alerts[0];
      
      expect(alert.isRead).toBe(false);
      
      alertsService.markAsRead(alert.id);
      
      const activeAlerts = alertsService.getActiveAlerts();
      const updatedAlert = activeAlerts.find(a => a.id === alert.id);
      expect(updatedAlert?.isRead).toBe(true);
    });

    test('should dismiss alert', async () => {
      const alerts = await alertsService.generateAlerts(mockFamilyData);
      const alert = alerts[0];
      const initialCount = alertsService.getActiveAlerts().length;
      
      alertsService.dismissAlert(alert.id);
      
      const activeAlerts = alertsService.getActiveAlerts();
      expect(activeAlerts.length).toBe(initialCount - 1);
      expect(activeAlerts.find(a => a.id === alert.id)).toBeUndefined();
    });

    test('should clear all alerts', async () => {
      await alertsService.generateAlerts(mockFamilyData);
      expect(alertsService.getActiveAlerts().length).toBeGreaterThan(0);
      
      alertsService.clearAllAlerts();
      
      expect(alertsService.getActiveAlerts().length).toBe(0);
    });

    test('should get unread count', async () => {
      await alertsService.generateAlerts(mockFamilyData);
      const activeAlerts = alertsService.getActiveAlerts();
      
      expect(alertsService.getUnreadCount()).toBe(activeAlerts.length);
      
      // Mark one as read
      if (activeAlerts.length > 0) {
        alertsService.markAsRead(activeAlerts[0].id);
        expect(alertsService.getUnreadCount()).toBe(activeAlerts.length - 1);
      }
    });

    test('should get critical alerts', async () => {
      // Add conflicting events to trigger critical alert
      const dataWithConflicts = {
        ...mockFamilyData,
        events: {
          ...mockFamilyData.events,
          upcoming: [
            {
              id: 'event1',
              title: 'Meeting 1',
              startDate: new Date('2024-01-15T10:00:00'),
              endDate: new Date('2024-01-15T11:00:00'),
              assignedTo: 'gonzalo' as any,
              allDay: false,
              createdBy: 'test' as any,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'event2',
              title: 'Meeting 2',
              startDate: new Date('2024-01-15T10:30:00'),
              endDate: new Date('2024-01-15T11:30:00'),
              assignedTo: 'gonzalo' as any,
              allDay: false,
              createdBy: 'test' as any,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      };

      await alertsService.generateAlerts(dataWithConflicts);
      const criticalAlerts = alertsService.getCriticalAlerts();
      
      expect(criticalAlerts.length).toBeGreaterThan(0);
      expect(criticalAlerts[0].priority).toBe('critical');
    });
  });

  describe('Alert Filtering', () => {
    test('should get alerts by category', async () => {
      await alertsService.generateAlerts(mockFamilyData);
      
      const overdueAlerts = alertsService.getAlertsByCategory('overdue_task');
      expect(overdueAlerts.length).toBeGreaterThan(0);
      expect(overdueAlerts.every(a => a.category === 'overdue_task')).toBe(true);
    });

    test('should get alerts by member', async () => {
      await alertsService.generateAlerts(mockFamilyData);
      
      const gonzaloAlerts = alertsService.getAlertsByMember('gonzalo' as any);
      expect(gonzaloAlerts.length).toBeGreaterThan(0);
      expect(gonzaloAlerts.every(a => a.affectedMembers.includes('gonzalo' as any))).toBe(true);
    });
  });

  describe('Alert Actions', () => {
    test('should generate appropriate actions for overdue tasks', async () => {
      const alerts = await alertsService.generateAlerts(mockFamilyData);
      const overdueAlert = alerts.find(a => a.category === 'overdue_task');
      
      expect(overdueAlert?.actions).toBeDefined();
      expect(overdueAlert?.actions.length).toBeGreaterThan(0);
      
      const completeAction = overdueAlert?.actions.find(a => a.type === 'complete');
      expect(completeAction).toBeDefined();
      expect(completeAction?.targetType).toBe('todo');
    });

    test('should generate reschedule actions for conflicts', async () => {
      const dataWithConflicts = {
        ...mockFamilyData,
        events: {
          ...mockFamilyData.events,
          upcoming: [
            {
              id: 'event1',
              title: 'Meeting 1',
              startDate: new Date('2024-01-15T10:00:00'),
              endDate: new Date('2024-01-15T11:00:00'),
              assignedTo: 'gonzalo' as any,
              allDay: false,
              createdBy: 'test' as any,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'event2',
              title: 'Meeting 2',
              startDate: new Date('2024-01-15T10:30:00'),
              endDate: new Date('2024-01-15T11:30:00'),
              assignedTo: 'gonzalo' as any,
              allDay: false,
              createdBy: 'test' as any,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      };

      const alerts = await alertsService.generateAlerts(dataWithConflicts);
      const conflictAlert = alerts.find(a => a.category === 'schedule_conflict');
      
      expect(conflictAlert?.actions).toBeDefined();
      expect(conflictAlert?.actions.length).toBeGreaterThan(0);
      
      const rescheduleAction = conflictAlert?.actions.find(a => a.type === 'reschedule');
      expect(rescheduleAction).toBeDefined();
    });
  });

  describe('Configuration', () => {
    test('should respect max alerts per category', async () => {
      const limitedService = new SmartAlertsService({
        maxAlertsPerCategory: 1
      });

      // Generate lots of overdue tasks
      const manyOverdueTodos = Array.from({ length: 5 }, (_, i) => ({
        id: `todo${i}`,
        title: `Overdue Task ${i}`,
        completed: false,
        assignedTo: 'gonzalo' as any,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        priority: 'medium' as any,
        createdBy: 'test' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const dataWithManyTodos = {
        ...mockFamilyData,
        todos: {
          ...mockFamilyData.todos,
          overdue: manyOverdueTodos
        }
      };

      await limitedService.generateAlerts(dataWithManyTodos);
      const overdueAlerts = limitedService.getAlertsByCategory('overdue_task');
      
      expect(overdueAlerts.length).toBeLessThanOrEqual(1);
    });
  });

  describe('AI Alert Integration', () => {
    test('should parse AI suggestions into alerts', async () => {
      const alerts = await alertsService.generateAlerts(mockFamilyData);
      
      // Should include AI-generated alerts from mocked response
      const aiAlert = alerts.find(a => a.metadata.source === 'ai');
      expect(aiAlert).toBeDefined();
      expect(aiAlert?.metadata.confidence).toBe(0.85);
      expect(aiAlert?.metadata.aiInsight).toContain('organizing documents');
    });
  });
});
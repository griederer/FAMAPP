// Test Family Analytics Service functionality
const { FamilyAnalyticsService } = require('../src/services/familyAnalyticsService');

// Mock AI service
jest.mock('../src/services/aiService', () => ({
  getAIService: () => ({
    generateSummary: jest.fn().mockResolvedValue({
      content: 'Family productivity is showing positive trends with 85% completion rate.',
      metadata: {
        suggestions: [
          {
            actionType: 'optimize_scheduling',
            description: 'Consider consolidating similar tasks to improve efficiency.',
            targetItems: ['task1', 'task2']
          }
        ]
      },
      confidence: 0.88,
      model: 'claude-3-sonnet'
    })
  })
}));

// Mock cache service
jest.mock('../src/services/dataCacheService', () => ({
  getDataCacheService: () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(void 0)
  })
}));

describe('FamilyAnalyticsService', () => {
  let analyticsService;
  let mockFamilyData;

  beforeEach(() => {
    analyticsService = new FamilyAnalyticsService({
      enablePredictiveInsights: true,
      enableAIAnalysis: true,
      historicalDataDays: 30,
      cacheTTL: 5 * 60 * 1000, // 5 minutes for testing
      significanceThreshold: 0.1,
      goalTracking: true
    });

    // Create comprehensive mock family data
    const familyMembers = [
      { id: 'member1', name: 'Alex', email: 'alex@family.com' },
      { id: 'member2', name: 'Sam', email: 'sam@family.com' }
    ];

    const todos = [
      {
        id: 'todo1',
        title: 'Complete project',
        completed: true,
        assignedTo: 'member1',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        priority: 'high',
        createdBy: 'member1',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'todo2',
        title: 'Buy groceries',
        completed: false,
        assignedTo: 'member2',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        priority: 'medium',
        createdBy: 'member1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'todo3',
        title: 'Overdue task',
        completed: false,
        assignedTo: 'member1',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        priority: 'low',
        createdBy: 'member2',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];

    const events = [
      {
        id: 'event1',
        title: 'Team Meeting',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        assignedTo: 'member1',
        allDay: false,
        createdBy: 'member1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Created 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'event2',
        title: 'Doctor Appointment',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        assignedTo: 'member2',
        allDay: false,
        createdBy: 'member2',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    mockFamilyData = {
      todos: {
        pending: [todos[1]], // Buy groceries
        overdue: [todos[2]], // Overdue task
        completedRecent: [todos[0]], // Completed project
        totalCount: 3,
        completionRate: 0.67, // 2/3 tasks completed or pending vs overdue
        memberStats: [
          {
            member: familyMembers[0],
            pendingTodos: 0,
            overdueTodos: 1,
            completedThisWeek: 1,
            completionRate: 0.5,
            productivity: 'medium'
          },
          {
            member: familyMembers[1],
            pendingTodos: 1,
            overdueTodos: 0,
            completedThisWeek: 0,
            completionRate: 0.0,
            productivity: 'low'
          }
        ]
      },
      events: {
        upcoming: events,
        thisWeek: [],
        nextWeek: events,
        totalCount: 2,
        memberEvents: [
          { member: familyMembers[0], events: [events[0]] },
          { member: familyMembers[1], events: [events[1]] }
        ]
      },
      groceries: {
        pending: [
          { id: 'grocery1', name: 'Milk', urgent: false },
          { id: 'grocery2', name: 'Bread', urgent: true }
        ],
        urgentItems: [
          { id: 'grocery2', name: 'Bread', urgent: true }
        ],
        completedRecent: [
          { id: 'grocery3', name: 'Apples', urgent: false }
        ],
        totalCount: 3,
        completionRate: 0.67,
        categoryStats: [
          { category: 'dairy', count: 1 },
          { category: 'bakery', count: 1 },
          { category: 'produce', count: 1 }
        ]
      },
      documents: {
        recent: [],
        totalCount: 0,
        typeStats: []
      },
      familyMembers,
      summary: {
        generatedAt: new Date(),
        dataFreshness: {
          todos: new Date(),
          events: new Date(),
          groceries: new Date(),
          documents: new Date(),
          overallStatus: 'fresh'
        },
        totalActiveTasks: 2,
        urgentItemsCount: 1,
        healthScore: 75,
        weeklyTrends: {
          todoCompletion: { currentWeek: 0.67, previousWeek: 0.5, change: 0.17, trend: 'up' },
          eventScheduling: { currentWeek: 2, previousWeek: 1, change: 1, trend: 'up' },
          groceryShopping: { currentWeek: 0.67, previousWeek: 0.8, change: -0.13, trend: 'down' },
          documentActivity: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' }
        },
        recommendations: []
      }
    };
  });

  afterEach(() => {
    analyticsService.dispose();
  });

  describe('Analytics Report Generation', () => {
    test('should generate comprehensive analytics report', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      expect(report).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.period).toBe('weekly');
      expect(report.dataCompleteness).toBeGreaterThan(0);
      
      // Check core metrics exist
      expect(report.productivity).toBeDefined();
      expect(report.events).toBeDefined();
      expect(report.groceries).toBeDefined();
      expect(report.health).toBeDefined();
      
      // Check member analytics
      expect(report.memberAnalytics).toHaveLength(2);
      expect(report.memberAnalytics[0].memberId).toBe('member1');
      expect(report.memberAnalytics[1].memberId).toBe('member2');
    });

    test('should calculate productivity metrics correctly', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      const productivity = report.productivity;
      expect(productivity.familyCompletionRate.value).toBe(0.67);
      expect(productivity.averageTasksPerMember.value).toBe(1.5); // 3 tasks / 2 members
      expect(productivity.overdueTasksRate.value).toBe(0.33); // 1 overdue / 3 total
      expect(productivity.efficiencyScore.value).toBeGreaterThan(0);
    });

    test('should calculate event analytics correctly', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      const events = report.events;
      expect(events.schedulingEfficiency.value).toBe(100); // No conflicts
      expect(events.conflictRate.value).toBe(0); // No conflicts detected
      expect(events.planningLeadTime.value).toBeGreaterThan(0); // Has planning lead time
      expect(events.eventDistribution).toBeDefined();
    });

    test('should calculate grocery analytics correctly', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      const groceries = report.groceries;
      expect(groceries.urgentItemsRate.value).toBe(0.33); // 1 urgent / 3 total
      expect(groceries.categoryPreferences).toBeDefined();
      expect(groceries.categoryPreferences.dairy).toBe(1);
      expect(groceries.categoryPreferences.bakery).toBe(1);
    });

    test('should calculate family health metrics', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      const health = report.health;
      expect(health.organizationScore).toBeGreaterThan(0);
      expect(health.organizationScore).toBeLessThanOrEqual(100);
      expect(health.communicationIndex).toBeGreaterThan(0);
      expect(health.planningEffectiveness).toBeGreaterThan(0);
      expect(Array.isArray(health.stressIndicators)).toBe(true);
      expect(Array.isArray(health.improvementAreas)).toBe(true);
      expect(Array.isArray(health.strengths)).toBe(true);
    });
  });

  describe('Member Analytics', () => {
    test('should generate member-specific analytics', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      const member1Analytics = report.memberAnalytics.find(m => m.memberId === 'member1');
      const member2Analytics = report.memberAnalytics.find(m => m.memberId === 'member2');
      
      expect(member1Analytics).toBeDefined();
      expect(member2Analytics).toBeDefined();
      
      // Member 1 has completed tasks and overdue tasks
      expect(member1Analytics.memberName).toBe('Alex');
      expect(member1Analytics.productivityScore).toBeGreaterThan(0);
      expect(member1Analytics.completionRate).toBeDefined();
      
      // Member 2 has pending tasks
      expect(member2Analytics.memberName).toBe('Sam');
      expect(member2Analytics.productivityScore).toBeGreaterThan(0);
      expect(member2Analytics.tasksCompleted).toBeDefined();
    });

    test('should calculate member productivity scores', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      report.memberAnalytics.forEach(member => {
        expect(member.productivityScore).toBeGreaterThanOrEqual(0);
        expect(member.productivityScore).toBeLessThanOrEqual(100);
        expect(member.collaborationScore).toBeGreaterThanOrEqual(0);
        expect(member.consistencyScore).toBeGreaterThanOrEqual(0);
      });
    });

    test('should identify preferred categories and peak hours', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      report.memberAnalytics.forEach(member => {
        expect(Array.isArray(member.preferredTaskCategories)).toBe(true);
        expect(Array.isArray(member.peakProductivityHours)).toBe(true);
        expect(member.peakProductivityHours.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Predictive Insights', () => {
    test('should generate predictive insights', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      expect(Array.isArray(report.insights)).toBe(true);
      
      if (report.insights.length > 0) {
        const insight = report.insights[0];
        expect(insight.type).toMatch(/warning|opportunity|recommendation|celebration/);
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.confidence).toBeGreaterThan(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
        expect(Array.isArray(insight.suggestedActions)).toBe(true);
        expect(insight.impact).toMatch(/low|medium|high/);
      }
    });

    test('should identify stress indicators', async () => {
      // Create data with stress indicators
      const stressfulData = {
        ...mockFamilyData,
        todos: {
          ...mockFamilyData.todos,
          overdue: Array.from({ length: 8 }, (_, i) => ({
            id: `overdue${i}`,
            title: `Overdue Task ${i}`,
            completed: false,
            assignedTo: 'member1',
            dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            priority: 'high',
            createdBy: 'member1',
            createdAt: new Date(),
            updatedAt: new Date()
          })),
          completionRate: 0.2
        }
      };

      const report = await analyticsService.generateAnalyticsReport(stressfulData, 'weekly');
      
      expect(report.health.stressIndicators).toContain('High number of overdue tasks');
      expect(report.health.stressIndicators).toContain('Low task completion rate');
    });

    test('should identify opportunities for improvement', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      expect(Array.isArray(report.health.improvementAreas)).toBe(true);
      expect(Array.isArray(report.health.strengths)).toBe(true);
    });
  });

  describe('Trend Analysis', () => {
    test('should analyze trends across metrics', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      expect(report.trends).toBeDefined();
      expect(report.trends.productivity).toBeDefined();
      expect(report.trends.taskVelocity).toBeDefined();
      expect(report.trends.eventScheduling).toBeDefined();
      
      Object.values(report.trends).forEach(trend => {
        expect(trend.period).toBe('weekly');
        expect(Array.isArray(trend.dataPoints)).toBe(true);
        expect(trend.direction).toMatch(/up|down|stable/);
        expect(trend.significance).toBeGreaterThanOrEqual(0);
      });
    });

    test('should detect trend directions correctly', async () => {
      const service = new FamilyAnalyticsService({ significanceThreshold: 0.05 });
      
      // Test stable trend
      const stableTrend = service['analyzeTrend']([
        { date: new Date(), value: 10 },
        { date: new Date(), value: 10.1 },
        { date: new Date(), value: 9.9 },
        { date: new Date(), value: 10.05 }
      ], 'daily');
      
      expect(stableTrend.direction).toBe('stable');
      
      service.dispose();
    });
  });

  describe('Event Conflict Detection', () => {
    test('should detect scheduling conflicts', async () => {
      // Create conflicting events
      const conflictingEvents = [
        {
          id: 'event1',
          title: 'Meeting 1',
          startDate: new Date('2024-01-15T10:00:00'),
          endDate: new Date('2024-01-15T11:00:00'),
          assignedTo: 'member1',
          allDay: false,
          createdBy: 'member1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'event2',
          title: 'Meeting 2',
          startDate: new Date('2024-01-15T10:30:00'),
          endDate: new Date('2024-01-15T11:30:00'),
          assignedTo: 'member1', // Same member = conflict
          allDay: false,
          createdBy: 'member1',
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

      const report = await analyticsService.generateAnalyticsReport(dataWithConflicts, 'weekly');
      
      expect(report.events.conflictRate.value).toBeGreaterThan(0);
      expect(report.events.schedulingEfficiency.value).toBeLessThan(100);
    });

    test('should not detect conflicts for different members', async () => {
      const nonConflictingEvents = [
        {
          id: 'event1',
          title: 'Meeting 1',
          startDate: new Date('2024-01-15T10:00:00'),
          endDate: new Date('2024-01-15T11:00:00'),
          assignedTo: 'member1',
          allDay: false,
          createdBy: 'member1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'event2',
          title: 'Meeting 2',
          startDate: new Date('2024-01-15T10:30:00'),
          endDate: new Date('2024-01-15T11:30:00'),
          assignedTo: 'member2', // Different member = no conflict
          allDay: false,
          createdBy: 'member2',
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

      const report = await analyticsService.generateAnalyticsReport(dataWithEvents, 'weekly');
      
      expect(report.events.conflictRate.value).toBe(0);
    });
  });

  describe('Goals and Achievements', () => {
    test('should track family goals', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      expect(Array.isArray(report.goals)).toBe(true);
      // Goals would be populated from actual goal tracking system
    });

    test('should identify achievements', async () => {
      // Create high-performing data
      const excellentData = {
        ...mockFamilyData,
        todos: {
          ...mockFamilyData.todos,
          completionRate: 0.98 // Excellent completion rate
        }
      };

      const report = await analyticsService.generateAnalyticsReport(excellentData, 'weekly');
      
      expect(Array.isArray(report.achievements)).toBe(true);
      
      if (report.achievements.length > 0) {
        const achievement = report.achievements[0];
        expect(achievement.title).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.date).toBeInstanceOf(Date);
        expect(achievement.category).toBeDefined();
      }
    });
  });

  describe('AI Integration', () => {
    test('should generate AI summary when enabled', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      expect(report.aiSummary).toBeDefined();
      expect(report.aiSummary.content).toContain('productivity');
      expect(report.aiSummary.confidence).toBeGreaterThan(0);
    });

    test('should skip AI summary when disabled', async () => {
      const serviceWithoutAI = new FamilyAnalyticsService({
        enableAIAnalysis: false
      });

      const report = await serviceWithoutAI.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      expect(report.aiSummary).toBeUndefined();
      
      serviceWithoutAI.dispose();
    });
  });

  describe('Configuration', () => {
    test('should respect configuration settings', async () => {
      const customConfig = {
        enablePredictiveInsights: false,
        enableAIAnalysis: false,
        significanceThreshold: 0.2
      };

      const customService = new FamilyAnalyticsService(customConfig);
      const report = await customService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      // Should have empty insights when disabled
      expect(report.insights).toHaveLength(0);
      expect(report.aiSummary).toBeUndefined();
      
      customService.dispose();
    });

    test('should calculate data completeness correctly', async () => {
      const report = await analyticsService.generateAnalyticsReport(mockFamilyData, 'weekly');
      
      // Should have high completeness with todos, events, groceries, and members
      expect(report.dataCompleteness).toBe(100);
    });

    test('should handle incomplete data gracefully', async () => {
      const incompleteData = {
        ...mockFamilyData,
        todos: { ...mockFamilyData.todos, totalCount: 0, pending: [], overdue: [], completedRecent: [] },
        events: { ...mockFamilyData.events, totalCount: 0, upcoming: [] },
        groceries: { ...mockFamilyData.groceries, totalCount: 0, pending: [], urgentItems: [] }
      };

      const report = await analyticsService.generateAnalyticsReport(incompleteData, 'weekly');
      
      expect(report.dataCompleteness).toBeLessThan(100);
      expect(report.productivity).toBeDefined();
      expect(report.memberAnalytics).toHaveLength(2); // Still has members
    });
  });

  describe('Performance and Cleanup', () => {
    test('should dispose resources properly', () => {
      expect(() => analyticsService.dispose()).not.toThrow();
    });

    test('should handle errors gracefully', async () => {
      // Test with invalid data
      const invalidData = {
        ...mockFamilyData,
        familyMembers: [] // Empty members array
      };

      const report = await analyticsService.generateAnalyticsReport(invalidData, 'weekly');
      
      expect(report).toBeDefined();
      expect(report.memberAnalytics).toHaveLength(0);
    });
  });

  describe('Public API Methods', () => {
    test('should provide productivity trends', async () => {
      const trends = await analyticsService.getProductivityTrends('weekly');
      
      expect(trends).toBeDefined();
      expect(trends.period).toBe('weekly');
      expect(trends.direction).toMatch(/up|down|stable/);
    });

    test('should handle member performance queries', async () => {
      const performance = await analyticsService.getMemberPerformance('member1');
      
      // Currently returns null in simplified implementation
      expect(performance).toBeNull();
    });

    test('should handle goal progress updates', async () => {
      await expect(analyticsService.updateGoalProgress('goal1', 75))
        .resolves
        .not.toThrow();
    });
  });
});
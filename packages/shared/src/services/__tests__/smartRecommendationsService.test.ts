// Smart Recommendations Service Tests
import { SmartRecommendationsService, getSmartRecommendationsService } from '../smartRecommendationsService';
import type { AggregatedFamilyData } from '../../types';

// Mock dependencies
jest.mock('../aiService', () => ({
  getAIService: () => ({
    generateSummary: jest.fn().mockResolvedValue({
      content: 'Test AI recommendation: Optimize your task management by breaking down large tasks into smaller, manageable steps. This will improve completion rates and reduce stress.',
      confidence: 0.85,
      model: 'claude-3'
    })
  })
}));

jest.mock('../dataCacheService', () => ({
  getDataCacheService: () => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  })
}));

jest.mock('../familyAnalyticsService', () => ({
  getFamilyAnalyticsService: () => ({
    generateAnalyticsReport: jest.fn()
  })
}));

jest.mock('../goalTrackingService', () => ({
  getGoalTrackingService: () => ({
    getActiveGoals: jest.fn().mockReturnValue([
      {
        id: 'goal1',
        title: 'Improve Task Completion',
        progress: 30,
        status: 'active'
      }
    ])
  })
}));

// Mock family data
const mockFamilyData: AggregatedFamilyData = {
  todos: {
    pending: [
      { id: '1', title: 'Task 1', completed: false, assignedTo: 'user1', priority: 'medium' as any }
    ],
    overdue: [
      { id: '2', title: 'Overdue Task', completed: false, assignedTo: 'user1', priority: 'high' as any },
      { id: '3', title: 'Another Overdue', completed: false, assignedTo: 'user2', priority: 'high' as any },
      { id: '4', title: 'Third Overdue', completed: false, assignedTo: 'user1', priority: 'medium' as any },
      { id: '5', title: 'Fourth Overdue', completed: false, assignedTo: 'user2', priority: 'low' as any }
    ],
    completedRecent: [],
    totalCount: 5,
    completionRate: 0.5,
    memberStats: []
  },
  events: {
    upcoming: [
      { id: 'e1', title: 'Event 1', startDate: new Date(), endDate: new Date(), assignedTo: 'user1', allDay: false, createdBy: 'user1', createdAt: new Date(), updatedAt: new Date() },
      { id: 'e2', title: 'Event 2', startDate: new Date(), endDate: new Date(), assignedTo: 'user2', allDay: false, createdBy: 'user2', createdAt: new Date(), updatedAt: new Date() },
      { id: 'e3', title: 'Event 3', startDate: new Date(), endDate: new Date(), assignedTo: 'user1', allDay: false, createdBy: 'user1', createdAt: new Date(), updatedAt: new Date() },
      { id: 'e4', title: 'Event 4', startDate: new Date(), endDate: new Date(), assignedTo: 'user2', allDay: false, createdBy: 'user2', createdAt: new Date(), updatedAt: new Date() },
      { id: 'e5', title: 'Event 5', startDate: new Date(), endDate: new Date(), assignedTo: 'user1', allDay: false, createdBy: 'user1', createdAt: new Date(), updatedAt: new Date() },
      { id: 'e6', title: 'Event 6', startDate: new Date(), endDate: new Date(), assignedTo: 'user2', allDay: false, createdBy: 'user2', createdAt: new Date(), updatedAt: new Date() }
    ],
    thisWeek: [],
    nextWeek: [],
    totalCount: 6,
    memberEvents: []
  },
  groceries: {
    pending: [],
    urgentItems: [],
    completedRecent: [],
    totalCount: 0,
    completionRate: 1.0,
    categoryStats: []
  },
  documents: {
    recent: [],
    totalCount: 0,
    typeStats: []
  },
  familyMembers: [
    { id: 'user1', name: 'User 1', email: 'user1@test.com' },
    { id: 'user2', name: 'User 2', email: 'user2@test.com' }
  ],
  summary: {
    generatedAt: new Date(),
    dataFreshness: {
      todos: new Date(),
      events: new Date(),
      groceries: new Date(),
      documents: new Date(),
      overallStatus: 'fresh' as const
    },
    totalActiveTasks: 5,
    urgentItemsCount: 0,
    healthScore: 45,
    weeklyTrends: {
      todoCompletion: { currentWeek: 0.5, previousWeek: 0.6, change: -0.1, trend: 'down' as const },
      eventScheduling: { currentWeek: 6, previousWeek: 3, change: 3, trend: 'up' as const },
      groceryShopping: { currentWeek: 1.0, previousWeek: 0.8, change: 0.2, trend: 'up' as const },
      documentActivity: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' as const }
    },
    recommendations: []
  }
};

describe('SmartRecommendationsService', () => {
  let service: SmartRecommendationsService;

  beforeEach(() => {
    service = new SmartRecommendationsService({
      enableAIRecommendations: true,
      enablePatternDetection: true,
      minimumConfidenceThreshold: 0.6
    });
  });

  afterEach(() => {
    service.dispose();
  });

  describe('Service Initialization', () => {
    test('creates service with default configuration', () => {
      const defaultService = new SmartRecommendationsService();
      expect(defaultService).toBeInstanceOf(SmartRecommendationsService);
      defaultService.dispose();
    });

    test('creates service with custom configuration', () => {
      const customService = new SmartRecommendationsService({
        enableAIRecommendations: false,
        maxActiveRecommendations: 5
      });
      expect(customService).toBeInstanceOf(SmartRecommendationsService);
      customService.dispose();
    });

    test('singleton pattern works correctly', () => {
      const service1 = getSmartRecommendationsService();
      const service2 = getSmartRecommendationsService();
      expect(service1).toBe(service2);
    });
  });

  describe('Recommendation Generation', () => {
    test('generates recommendations based on family data', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('generates AI-powered recommendations', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      const aiRecommendations = recommendations.filter(r => 
        r.triggeredBy.some(trigger => trigger.type === 'ai_insight')
      );
      
      expect(aiRecommendations.length).toBeGreaterThan(0);
    });

    test('filters recommendations by confidence threshold', async () => {
      const highConfidenceService = new SmartRecommendationsService({
        minimumConfidenceThreshold: 0.9
      });
      
      const recommendations = await highConfidenceService.generateRecommendations(mockFamilyData);
      
      recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThanOrEqual(0.9);
      });
      
      highConfidenceService.dispose();
    });

    test('limits recommendations to max active count', async () => {
      const limitedService = new SmartRecommendationsService({
        maxActiveRecommendations: 3
      });
      
      const recommendations = await limitedService.generateRecommendations(mockFamilyData);
      
      expect(recommendations.length).toBeLessThanOrEqual(3);
      limitedService.dispose();
    });

    test('prioritizes recommendations correctly', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      // Should have critical priority recommendations due to multiple overdue tasks
      const criticalRecommendations = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Detection', () => {
    test('detects low completion rate pattern', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      // Should detect pattern and create recommendation for low completion rate
      const taskOptimizationRecs = recommendations.filter(r => 
        r.type === 'task_optimization'
      );
      
      expect(taskOptimizationRecs.length).toBeGreaterThan(0);
    });

    test('detects schedule overload pattern', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      // Should detect pattern for many upcoming events
      const scheduleRecs = recommendations.filter(r => 
        r.type === 'schedule_improvement'
      );
      
      expect(scheduleRecs.length).toBeGreaterThan(0);
    });

    test('analyzes family context correctly', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      recommendations.forEach(rec => {
        expect(rec.familyContext).toBeDefined();
        expect(rec.familyContext.familySize).toBe(2);
        expect(rec.familyContext.activeTaskLoad).toBe(5);
        expect(rec.familyContext.upcomingEvents).toBe(6);
      });
    });
  });

  describe('Recommendation Management', () => {
    test('retrieves active recommendations', async () => {
      await service.generateRecommendations(mockFamilyData);
      const activeRecommendations = service.getActiveRecommendations();
      
      expect(activeRecommendations).toBeInstanceOf(Array);
      activeRecommendations.forEach(rec => {
        expect(['pending', 'viewed'].includes(rec.status)).toBe(true);
      });
    });

    test('accepts recommendations', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      const recommendationId = recommendations[0].id;
      
      const result = await service.acceptRecommendation(recommendationId, 'user1');
      expect(result).toBe(true);
      
      const updatedRec = service.getRecommendationById(recommendationId);
      expect(updatedRec?.status).toBe('accepted');
    });

    test('dismisses recommendations', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      const recommendationId = recommendations[0].id;
      
      const result = await service.dismissRecommendation(recommendationId, 'Not relevant');
      expect(result).toBe(true);
      
      const updatedRec = service.getRecommendationById(recommendationId);
      expect(updatedRec?.status).toBe('dismissed');
    });

    test('marks recommendations as implemented', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      const recommendationId = recommendations[0].id;
      
      const feedback = {
        helpfulness: 5,
        implementationDifficulty: 3,
        actualImpact: 4,
        comments: 'Very helpful recommendation',
        suggestedImprovements: [],
        submittedBy: mockFamilyData.familyMembers[0],
        submittedAt: new Date()
      };
      
      const result = await service.markRecommendationImplemented(recommendationId, feedback);
      expect(result).toBe(true);
      
      const updatedRec = service.getRecommendationById(recommendationId);
      expect(updatedRec?.status).toBe('implemented');
      expect(updatedRec?.implementedAt).toBeDefined();
      expect(updatedRec?.feedback).toEqual(feedback);
    });

    test('handles non-existent recommendation IDs', async () => {
      const result1 = await service.acceptRecommendation('non-existent', 'user1');
      expect(result1).toBe(false);
      
      const result2 = await service.dismissRecommendation('non-existent', 'reason');
      expect(result2).toBe(false);
      
      const result3 = await service.markRecommendationImplemented('non-existent', {});
      expect(result3).toBe(false);
    });
  });

  describe('Analytics Generation', () => {
    test('generates recommendation analytics', async () => {
      await service.generateRecommendations(mockFamilyData);
      
      // Accept and implement some recommendations
      const recommendations = service.getActiveRecommendations();
      if (recommendations.length > 0) {
        await service.acceptRecommendation(recommendations[0].id, 'user1');
        if (recommendations.length > 1) {
          await service.markRecommendationImplemented(recommendations[1].id, {
            helpfulness: 4,
            actualImpact: 3,
            submittedBy: mockFamilyData.familyMembers[0],
            submittedAt: new Date()
          });
        }
      }
      
      const analytics = await service.generateAnalytics();
      
      expect(analytics).toBeDefined();
      expect(analytics.totalRecommendations).toBeGreaterThan(0);
      expect(analytics.acceptanceRate).toBeGreaterThanOrEqual(0);
      expect(analytics.implementationRate).toBeGreaterThanOrEqual(0);
      expect(analytics.categoryStats).toBeDefined();
      expect(analytics.trends).toBeDefined();
    });

    test('calculates acceptance rate correctly', async () => {
      await service.generateRecommendations(mockFamilyData);
      const recommendations = service.getActiveRecommendations();
      
      if (recommendations.length >= 2) {
        await service.acceptRecommendation(recommendations[0].id, 'user1');
        await service.dismissRecommendation(recommendations[1].id, 'Not needed');
        
        const analytics = await service.generateAnalytics();
        expect(analytics.acceptanceRate).toBeGreaterThan(0);
        expect(analytics.acceptanceRate).toBeLessThanOrEqual(1);
      }
    });

    test('calculates category statistics', async () => {
      await service.generateRecommendations(mockFamilyData);
      const analytics = await service.generateAnalytics();
      
      expect(analytics.categoryStats).toBeDefined();
      
      const categoryKeys = Object.keys(analytics.categoryStats);
      expect(categoryKeys.length).toBeGreaterThan(0);
      
      categoryKeys.forEach(category => {
        const stats = analytics.categoryStats[category as any];
        expect(stats.count).toBeGreaterThanOrEqual(0);
        expect(stats.acceptanceRate).toBeGreaterThanOrEqual(0);
        expect(stats.acceptanceRate).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Recommendation Content', () => {
    test('generates actionable steps', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      recommendations.forEach(rec => {
        expect(rec.actionSteps).toBeInstanceOf(Array);
        expect(rec.actionSteps.length).toBeGreaterThan(0);
        
        rec.actionSteps.forEach((step, index) => {
          expect(step.id).toBeDefined();
          expect(step.description).toBeDefined();
          expect(step.order).toBe(index + 1);
          expect(step.estimatedTime).toBeGreaterThan(0);
          expect(typeof step.completed).toBe('boolean');
        });
      });
    });

    test('includes expected impact information', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      recommendations.forEach(rec => {
        expect(rec.expectedImpact).toBeDefined();
        expect(rec.expectedImpact.category).toBeDefined();
        expect(rec.expectedImpact.estimatedValue).toBeGreaterThan(0);
        expect(rec.expectedImpact.unit).toBeDefined();
        expect(rec.expectedImpact.timeframe).toBeDefined();
        expect(rec.expectedImpact.affectedMembers).toBeInstanceOf(Array);
        expect(rec.expectedImpact.confidenceLevel).toBeGreaterThan(0);
        expect(rec.expectedImpact.confidenceLevel).toBeLessThanOrEqual(1);
      });
    });

    test('includes AI reasoning', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      recommendations.forEach(rec => {
        expect(rec.aiReasoning).toBeDefined();
        expect(typeof rec.aiReasoning).toBe('string');
        expect(rec.aiReasoning.length).toBeGreaterThan(0);
      });
    });

    test('includes trigger information', async () => {
      const recommendations = await service.generateRecommendations(mockFamilyData);
      
      recommendations.forEach(rec => {
        expect(rec.triggeredBy).toBeInstanceOf(Array);
        expect(rec.triggeredBy.length).toBeGreaterThan(0);
        
        rec.triggeredBy.forEach(trigger => {
          expect(trigger.type).toBeDefined();
          expect(trigger.description).toBeDefined();
          expect(trigger.confidence).toBeGreaterThan(0);
          expect(trigger.confidence).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('handles AI service failures gracefully', async () => {
      const failingService = new SmartRecommendationsService();
      
      // Mock AI service to fail
      jest.spyOn(require('../aiService'), 'getAIService').mockReturnValue({
        generateSummary: jest.fn().mockRejectedValue(new Error('AI service unavailable'))
      });
      
      const recommendations = await failingService.generateRecommendations(mockFamilyData);
      
      // Should still return some recommendations (pattern-based)
      expect(recommendations).toBeInstanceOf(Array);
      
      failingService.dispose();
    });

    test('handles empty family data', async () => {
      const emptyData = {
        ...mockFamilyData,
        todos: { pending: [], overdue: [], completedRecent: [], totalCount: 0, completionRate: 1.0, memberStats: [] },
        events: { upcoming: [], thisWeek: [], nextWeek: [], totalCount: 0, memberEvents: [] },
        familyMembers: []
      };
      
      const recommendations = await service.generateRecommendations(emptyData);
      
      expect(recommendations).toBeInstanceOf(Array);
      // Should still work with empty data
    });
  });

  describe('Service Configuration', () => {
    test('respects disabled AI recommendations', async () => {
      const noAIService = new SmartRecommendationsService({
        enableAIRecommendations: false
      });
      
      const recommendations = await noAIService.generateRecommendations(mockFamilyData);
      
      // Should have no AI-generated recommendations
      const aiRecommendations = recommendations.filter(r => 
        r.triggeredBy.some(trigger => trigger.type === 'ai_insight')
      );
      
      expect(aiRecommendations.length).toBe(0);
      
      noAIService.dispose();
    });

    test('respects disabled pattern detection', async () => {
      const noPatternService = new SmartRecommendationsService({
        enablePatternDetection: false
      });
      
      const recommendations = await noPatternService.generateRecommendations(mockFamilyData);
      
      // Should have no pattern-based recommendations
      const patternRecommendations = recommendations.filter(r => 
        r.triggeredBy.some(trigger => trigger.type === 'pattern_detection')
      );
      
      expect(patternRecommendations.length).toBe(0);
      
      noPatternService.dispose();
    });
  });

  describe('Cleanup', () => {
    test('disposes service correctly', () => {
      service.dispose();
      
      const activeRecommendations = service.getActiveRecommendations();
      expect(activeRecommendations).toEqual([]);
    });
  });
});
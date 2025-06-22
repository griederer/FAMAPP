// Simple test for Family Analytics Service
const { FamilyAnalyticsService } = require('../src/services/familyAnalyticsService');

describe('FamilyAnalyticsService - Basic', () => {
  test('should create service instance', () => {
    const service = new FamilyAnalyticsService();
    expect(service).toBeDefined();
    expect(typeof service.generateAnalyticsReport).toBe('function');
    service.dispose();
  });

  test('should handle basic configuration', () => {
    const service = new FamilyAnalyticsService({
      enablePredictiveInsights: false,
      enableAIAnalysis: false
    });
    expect(service).toBeDefined();
    service.dispose();
  });
});
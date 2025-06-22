// Test Real-time Refresh Service functionality
import { RealTimeRefreshService } from '../src/services/realTimeRefreshService';
import { DataAggregationService } from '../src/services/dataAggregationService';

// Mock DataAggregationService
jest.mock('../src/services/dataAggregationService');
const MockedDataAggregationService = DataAggregationService as jest.MockedClass<typeof DataAggregationService>;

// Mock data cache service
jest.mock('../src/services/dataCacheService', () => ({
  getDataCacheService: () => ({
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn(),
    invalidatePattern: jest.fn(),
    getEntryInfo: jest.fn(),
    getStats: jest.fn().mockReturnValue({
      hits: 10,
      misses: 2,
      hitRate: 0.83,
      totalEntries: 5
    }),
    addEventListener: jest.fn()
  })
}));

describe('RealTimeRefreshService', () => {
  let refreshService: RealTimeRefreshService;
  let mockDataAggregationService: jest.Mocked<DataAggregationService>;
  let mockFamilyData: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock family data
    mockFamilyData = {
      todos: { totalCount: 5 },
      events: { totalCount: 3 },
      groceries: { totalCount: 8 },
      documents: { totalCount: 2 },
      summary: { healthScore: 85 }
    };

    // Setup mock service
    mockDataAggregationService = {
      aggregateFamilyData: jest.fn().mockResolvedValue(mockFamilyData)
    } as any;

    MockedDataAggregationService.mockImplementation(() => mockDataAggregationService);

    // Create service with test configuration
    refreshService = new RealTimeRefreshService({
      familyDataInterval: 100, // 100ms for faster tests
      enableAutoRefresh: false, // Start manually in tests
      staleThreshold: 200, // 200ms
      maxRetries: 2,
      retryDelay: 50,
      enableSmartRefresh: true
    });
  });

  afterEach(() => {
    refreshService.dispose();
  });

  describe('Service Lifecycle', () => {
    test('should start and stop refresh service', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      refreshService.start();
      expect(consoleSpy).toHaveBeenCalledWith('Starting real-time refresh service...');
      
      refreshService.stop();
      
      consoleSpy.mockRestore();
    });

    test('should prevent multiple starts', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      refreshService.start();
      refreshService.start(); // Second start should warn
      
      expect(consoleSpy).toHaveBeenCalledWith('Real-time refresh service is already running');
      
      refreshService.stop();
      consoleSpy.mockRestore();
    });
  });

  describe('Data Fetching', () => {
    test('should fetch family data successfully', async () => {
      const data = await refreshService.getFamilyData();
      
      expect(data).toEqual(mockFamilyData);
      expect(mockDataAggregationService.aggregateFamilyData).toHaveBeenCalledTimes(1);
    });

    test('should force refresh when requested', async () => {
      // Mock cache service get method
      const mockCacheService = require('../src/services/dataCacheService').getDataCacheService();
      mockCacheService.get.mockResolvedValue(mockFamilyData);
      
      const data = await refreshService.getFamilyData(true);
      
      expect(mockCacheService.invalidate).toHaveBeenCalled();
      expect(data).toEqual(mockFamilyData);
    });
  });

  describe('Data Change Detection', () => {
    test('should detect when data changes', async () => {
      // First call - establish baseline
      await refreshService.detectDataChanges();
      
      // Change data
      mockFamilyData.todos.totalCount = 10;
      mockDataAggregationService.aggregateFamilyData.mockResolvedValue(mockFamilyData);
      
      // Second call - should detect changes
      const hasChanges = await refreshService.detectDataChanges();
      expect(hasChanges).toBe(true);
    });

    test('should not detect changes when data is the same', async () => {
      // First call
      await refreshService.detectDataChanges();
      
      // Second call with same data
      const hasChanges = await refreshService.detectDataChanges();
      expect(hasChanges).toBe(false);
    });

    test('should handle detection errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDataAggregationService.aggregateFamilyData.mockRejectedValue(new Error('Network error'));
      
      const hasChanges = await refreshService.detectDataChanges();
      expect(hasChanges).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error detecting data changes:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Refresh Status', () => {
    test('should track refresh status', () => {
      const status = refreshService.getStatus();
      
      expect(status).toMatchObject({
        isRefreshing: false,
        lastRefresh: null,
        nextRefresh: null,
        errors: [],
        refreshCount: 0,
        successRate: 1.0
      });
    });

    test('should update status after successful refresh', async () => {
      const eventListener = jest.fn();
      refreshService.addEventListener(eventListener);
      
      await refreshService.getFamilyData();
      
      const status = refreshService.getStatus();
      expect(status.refreshCount).toBeGreaterThan(0);
      expect(status.lastRefresh).toBeInstanceOf(Date);
      
      expect(eventListener).toHaveBeenCalledWith('completed', mockFamilyData);
    });
  });

  describe('Event System', () => {
    test('should emit refresh events', async () => {
      const eventListener = jest.fn();
      refreshService.addEventListener(eventListener);
      
      await refreshService.getFamilyData();
      
      expect(eventListener).toHaveBeenCalledWith('started');
      expect(eventListener).toHaveBeenCalledWith('completed', mockFamilyData);
      expect(eventListener).toHaveBeenCalledWith('cache_updated', { 
        key: 'family_data', 
        data: mockFamilyData 
      });
      
      refreshService.removeEventListener(eventListener);
    });

    test('should emit error events on failure', async () => {
      const eventListener = jest.fn();
      const error = new Error('Fetch failed');
      
      refreshService.addEventListener(eventListener);
      mockDataAggregationService.aggregateFamilyData.mockRejectedValue(error);
      
      await refreshService.getFamilyData();
      
      expect(eventListener).toHaveBeenCalledWith('failed', null, error);
    });

    test('should emit data change events', async () => {
      const eventListener = jest.fn();
      refreshService.addEventListener(eventListener);
      
      // Establish baseline
      await refreshService.detectDataChanges();
      
      // Change data and detect
      mockFamilyData.todos.totalCount = 15;
      await refreshService.detectDataChanges();
      
      expect(eventListener).toHaveBeenCalledWith('data_changed', expect.objectContaining({
        signature: expect.objectContaining({
          todoCount: 15
        })
      }));
    });
  });

  describe('Error Handling and Retries', () => {
    test('should retry on failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Fail first two attempts, succeed on third
      mockDataAggregationService.aggregateFamilyData
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce(mockFamilyData);
      
      const data = await refreshService.getFamilyData();
      
      expect(data).toEqual(mockFamilyData);
      expect(mockDataAggregationService.aggregateFamilyData).toHaveBeenCalledTimes(3);
      
      const status = refreshService.getStatus();
      expect(status.errors).toHaveLength(2);
      
      consoleSpy.mockRestore();
    });

    test('should fail after max retries', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Fail all attempts
      mockDataAggregationService.aggregateFamilyData.mockRejectedValue(new Error('Persistent failure'));
      
      const data = await refreshService.getFamilyData();
      
      expect(data).toBeNull();
      expect(mockDataAggregationService.aggregateFamilyData).toHaveBeenCalledTimes(3); // 1 + 2 retries
      
      const status = refreshService.getStatus();
      expect(status.errors.length).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Updates', () => {
    test('should update refresh configuration', () => {
      refreshService.updateConfig({
        familyDataInterval: 5000,
        enableAutoRefresh: true,
        maxRetries: 5
      });
      
      // Configuration is internal, but we can test that it doesn't throw
      expect(() => refreshService.getStatus()).not.toThrow();
    });

    test('should restart service when interval changes', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      refreshService.start();
      refreshService.updateConfig({ familyDataInterval: 5000 });
      
      // Should see stop and start messages
      expect(consoleSpy).toHaveBeenCalledWith('Real-time refresh service stopped');
      expect(consoleSpy).toHaveBeenCalledWith('Starting real-time refresh service...');
      
      refreshService.stop();
      consoleSpy.mockRestore();
    });
  });

  describe('Scheduled Operations', () => {
    test('should schedule one-time refresh', async () => {
      const eventListener = jest.fn();
      refreshService.addEventListener(eventListener);
      
      refreshService.scheduleRefresh(50); // 50ms delay
      
      // Wait for scheduled refresh
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventListener).toHaveBeenCalledWith('completed', mockFamilyData);
    });
  });

  describe('Cache Integration', () => {
    test('should integrate with cache service', () => {
      const cacheStats = refreshService.getCacheStats();
      
      expect(cacheStats).toMatchObject({
        hits: 10,
        misses: 2,
        hitRate: 0.83,
        totalEntries: 5
      });
    });

    test('should provide data freshness information', () => {
      const freshness = refreshService.getDataFreshness();
      
      expect(freshness).toHaveProperty('familyData');
      expect(freshness).toHaveProperty('aiSummary');
      expect(freshness).toHaveProperty('memberStats');
      expect(freshness).toHaveProperty('trends');
    });
  });

  describe('Stale Data Detection', () => {
    test('should detect stale data', () => {
      // Mock cache entry info to show old data
      const mockCacheService = require('../src/services/dataCacheService').getDataCacheService();
      mockCacheService.getEntryInfo.mockReturnValue({
        age: 300000, // 5 minutes old
        remainingTTL: 0
      });
      
      const isStale = refreshService.isDataStale();
      expect(isStale).toBe(true);
    });

    test('should detect fresh data', () => {
      const mockCacheService = require('../src/services/dataCacheService').getDataCacheService();
      mockCacheService.getEntryInfo.mockReturnValue({
        age: 30000, // 30 seconds old
        remainingTTL: 270000
      });
      
      const isStale = refreshService.isDataStale();
      expect(isStale).toBe(false);
    });
  });

  describe('Force Refresh Operations', () => {
    test('should force refresh all data', async () => {
      const mockCacheService = require('../src/services/dataCacheService').getDataCacheService();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const data = await refreshService.forceRefresh();
      
      expect(consoleSpy).toHaveBeenCalledWith('Force refreshing all data...');
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith(
        /^(family_data|ai_summary|member_stats|trends_data)/,
        'forced'
      );
      expect(data).toEqual(mockFamilyData);
      
      consoleSpy.mockRestore();
    });
  });
});
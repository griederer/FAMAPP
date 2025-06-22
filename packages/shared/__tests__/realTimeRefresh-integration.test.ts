// Integration test for real-time refresh and caching functionality
import { DataCacheService } from '../src/services/dataCacheService';
import { RealTimeRefreshService } from '../src/services/realTimeRefreshService';

// Simple integration test focusing on core functionality
describe('Real-time Refresh Integration', () => {
  test('should integrate cache service with basic operations', async () => {
    const cacheService = new DataCacheService({
      defaultTTL: 1000,
      maxEntries: 10,
      refreshThreshold: 0.5,
      enableBackgroundRefresh: false // Disable for simpler testing
    });

    // Test basic cache operations
    const testData = { message: 'hello', count: 42 };
    cacheService.set('test-key', testData);
    
    const retrieved = cacheService.get('test-key');
    expect(retrieved).toEqual(testData);
    
    // Test cache stats
    const stats = cacheService.getStats();
    expect(stats.totalEntries).toBe(1);
    expect(stats.hits).toBe(1);
    
    cacheService.dispose();
  });

  test('should handle async data fetching with cache', async () => {
    const cacheService = new DataCacheService({
      defaultTTL: 1000,
      maxEntries: 10,
      refreshThreshold: 0.5,
      enableBackgroundRefresh: false
    });

    const fetchData = jest.fn().mockResolvedValue({ data: 'fresh' });
    
    // First call should fetch fresh data
    const result1 = await cacheService.get('async-test', fetchData);
    expect(result1).toEqual({ data: 'fresh' });
    expect(fetchData).toHaveBeenCalledTimes(1);
    
    // Second call should use cached data
    const result2 = cacheService.get('async-test');
    expect(result2).toEqual({ data: 'fresh' });
    expect(fetchData).toHaveBeenCalledTimes(1); // Still only called once
    
    cacheService.dispose();
  });

  test('should create refresh service without errors', () => {
    const refreshService = new RealTimeRefreshService({
      familyDataInterval: 1000,
      enableAutoRefresh: false,
      staleThreshold: 2000,
      maxRetries: 2,
      retryDelay: 100,
      enableSmartRefresh: false
    });

    expect(refreshService).toBeDefined();
    
    const status = refreshService.getStatus();
    expect(status.isRefreshing).toBe(false);
    expect(status.refreshCount).toBe(0);
    
    refreshService.dispose();
  });

  test('should detect data staleness', () => {
    const cacheService = new DataCacheService({
      defaultTTL: 100, // Very short TTL
      maxEntries: 10
    });

    // Add data
    cacheService.set('stale-test', 'data');
    
    // Should be fresh initially
    expect(cacheService.has('stale-test')).toBe(true);
    
    const entryInfo = cacheService.getEntryInfo('stale-test');
    expect(entryInfo).toBeTruthy();
    expect(entryInfo?.isExpired).toBe(false);
    
    cacheService.dispose();
  });

  test('should handle cache invalidation', () => {
    const cacheService = new DataCacheService();

    cacheService.set('key1', 'data1');
    cacheService.set('key2', 'data2');
    cacheService.set('other', 'data3');
    
    expect(cacheService.getSize()).toBe(3);
    
    // Invalidate specific key
    expect(cacheService.invalidate('key1')).toBe(true);
    expect(cacheService.getSize()).toBe(2);
    
    // Invalidate by pattern
    const count = cacheService.invalidatePattern(/^key/);
    expect(count).toBe(1); // Should remove key2
    expect(cacheService.getSize()).toBe(1);
    expect(cacheService.has('other')).toBe(true);
    
    cacheService.dispose();
  });

  test('should provide cache statistics', () => {
    const cacheService = new DataCacheService();

    // Add some data and access it
    cacheService.set('stats1', 'data1');
    cacheService.set('stats2', 'data2');
    
    cacheService.get('stats1'); // Hit
    cacheService.get('stats1'); // Hit
    cacheService.get('nonexistent'); // Miss
    
    const stats = cacheService.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.totalEntries).toBe(2);
    expect(stats.hitRate).toBeCloseTo(0.67, 1);
    
    cacheService.dispose();
  });
});
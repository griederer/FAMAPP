// Test Data Cache Service functionality
import { DataCacheService } from '../src/services/dataCacheService';

describe('DataCacheService', () => {
  let cacheService: DataCacheService;

  beforeEach(() => {
    cacheService = new DataCacheService({
      defaultTTL: 1000, // 1 second for faster tests
      maxEntries: 5,
      refreshThreshold: 0.5, // Refresh at 50% of TTL
      enableBackgroundRefresh: true
    });
  });

  afterEach(() => {
    cacheService.dispose();
  });

  describe('Basic Cache Operations', () => {
    test('should store and retrieve data', () => {
      const testData = { name: 'test', value: 42 };
      cacheService.set('test-key', testData);
      
      const retrieved = cacheService.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    test('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    test('should check if key exists in cache', () => {
      cacheService.set('exists', 'data');
      
      expect(cacheService.has('exists')).toBe(true);
      expect(cacheService.has('not-exists')).toBe(false);
    });

    test('should get cache size and keys', () => {
      cacheService.set('key1', 'data1');
      cacheService.set('key2', 'data2');
      
      expect(cacheService.getSize()).toBe(2);
      expect(cacheService.getKeys()).toEqual(['key1', 'key2']);
    });
  });

  describe('TTL and Expiration', () => {
    test('should expire data after TTL', async () => {
      cacheService.set('expire-test', 'data', 100); // 100ms TTL
      
      expect(cacheService.has('expire-test')).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cacheService.has('expire-test')).toBe(false);
    });

    test('should use refresh function when data is expired', async () => {
      const refreshFn = jest.fn().mockResolvedValue('fresh-data');
      
      // First call should use refresh function
      const result1 = await cacheService.get('refresh-test', refreshFn, 100);
      expect(result1).toBe('fresh-data');
      expect(refreshFn).toHaveBeenCalledTimes(1);
      
      // Second call should use cached data
      const result2 = await cacheService.get('refresh-test', refreshFn, 100);
      expect(result2).toBe('fresh-data');
      expect(refreshFn).toHaveBeenCalledTimes(1); // Should not call again
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Third call should refresh again
      refreshFn.mockResolvedValue('newer-data');
      const result3 = await cacheService.get('refresh-test', refreshFn, 100);
      expect(result3).toBe('newer-data');
      expect(refreshFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate specific entries', () => {
      cacheService.set('key1', 'data1');
      cacheService.set('key2', 'data2');
      
      expect(cacheService.invalidate('key1')).toBe(true);
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(true);
      
      expect(cacheService.invalidate('key1')).toBe(false); // Already deleted
    });

    test('should invalidate entries by pattern', () => {
      cacheService.set('user:1:profile', 'data1');
      cacheService.set('user:2:profile', 'data2');
      cacheService.set('system:config', 'data3');
      
      const count = cacheService.invalidatePattern(/^user:/);
      expect(count).toBe(2);
      
      expect(cacheService.has('user:1:profile')).toBe(false);
      expect(cacheService.has('user:2:profile')).toBe(false);
      expect(cacheService.has('system:config')).toBe(true);
    });

    test('should clear entire cache', () => {
      cacheService.set('key1', 'data1');
      cacheService.set('key2', 'data2');
      
      cacheService.clear();
      
      expect(cacheService.getSize()).toBe(0);
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    test('should track hits and misses', async () => {
      const refreshFn = jest.fn().mockResolvedValue('data');
      
      // Miss (no data)
      await cacheService.get('stats-test', refreshFn);
      
      // Hit (data exists)
      await cacheService.get('stats-test');
      await cacheService.get('stats-test');
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.67, 1);
    });

    test('should track refreshes and evictions', async () => {
      const refreshFn = jest.fn().mockResolvedValue('data');
      
      // Cause refresh
      await cacheService.get('refresh-stats', refreshFn);
      
      // Cause eviction by exceeding max entries
      for (let i = 0; i < 6; i++) {
        cacheService.set(`key${i}`, `data${i}`);
      }
      
      const stats = cacheService.getStats();
      expect(stats.refreshes).toBeGreaterThan(0);
      expect(stats.evictions).toBeGreaterThan(0);
      expect(stats.totalEntries).toBeLessThanOrEqual(5);
    });
  });

  describe('Background Refresh', () => {
    test('should trigger background refresh when threshold is reached', async () => {
      const refreshFn = jest.fn()
        .mockResolvedValueOnce('initial-data')
        .mockResolvedValueOnce('refreshed-data');
      
      // Initial load
      const result1 = await cacheService.get('bg-refresh-test', refreshFn, 200);
      expect(result1).toBe('initial-data');
      expect(refreshFn).toHaveBeenCalledTimes(1);
      
      // Wait for refresh threshold (50% of 200ms = 100ms)
      await new Promise(resolve => setTimeout(resolve, 120));
      
      // Should return cached data but trigger background refresh
      const result2 = await cacheService.get('bg-refresh-test', refreshFn, 200);
      expect(result2).toBe('initial-data'); // Still cached data
      
      // Wait for background refresh to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should now have refreshed data
      const result3 = await cacheService.get('bg-refresh-test', refreshFn, 200);
      expect(result3).toBe('refreshed-data');
      expect(refreshFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Entry Information', () => {
    test('should provide detailed entry information', () => {
      cacheService.set('info-test', 'data', 1000);
      
      const info = cacheService.getEntryInfo('info-test');
      expect(info).toBeDefined();
      expect(info.key).toBe('info-test');
      expect(info.ttl).toBe(1000);
      expect(info.age).toBeGreaterThanOrEqual(0);
      expect(info.remainingTTL).toBeLessThanOrEqual(1000);
      expect(info.hits).toBe(0);
      expect(info.version).toBe(1);
      expect(info.isExpired).toBe(false);
    });

    test('should return null for non-existent entry info', () => {
      const info = cacheService.getEntryInfo('non-existent');
      expect(info).toBeNull();
    });
  });

  describe('Scheduled Refresh', () => {
    test('should schedule periodic refresh', async () => {
      const refreshFn = jest.fn()
        .mockResolvedValueOnce('data1')
        .mockResolvedValueOnce('data2');
      
      // Schedule refresh every 100ms
      cacheService.scheduleRefresh('scheduled-test', refreshFn, 100);
      
      // Wait for first refresh
      await new Promise(resolve => setTimeout(resolve, 120));
      
      const data1 = await cacheService.get('scheduled-test');
      expect(data1).toBe('data1');
      
      // Wait for second refresh
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data2 = await cacheService.get('scheduled-test');
      expect(data2).toBe('data2');
      
      expect(refreshFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Force Refresh', () => {
    test('should force refresh even with valid cache', async () => {
      const refreshFn = jest.fn()
        .mockResolvedValueOnce('original')
        .mockResolvedValueOnce('forced');
      
      // Initial data
      cacheService.set('force-test', 'original');
      cacheService.scheduleRefresh('force-test', refreshFn, 1000);
      
      // Force refresh
      const result = await cacheService.forceRefresh('force-test');
      expect(result).toBe('forced');
      expect(refreshFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event System', () => {
    test('should emit cache events', async () => {
      const eventListener = jest.fn();
      cacheService.addEventListener(eventListener);
      
      const refreshFn = jest.fn().mockResolvedValue('data');
      
      // Trigger various events
      cacheService.set('event-test', 'data'); // write event
      await cacheService.get('event-test'); // hit event
      await cacheService.get('miss-test', refreshFn); // miss + refresh events
      cacheService.invalidate('event-test'); // eviction event
      
      expect(eventListener).toHaveBeenCalledWith('write', 'event-test', 'data');
      expect(eventListener).toHaveBeenCalledWith('hit', 'event-test', 'data');
      expect(eventListener).toHaveBeenCalledWith('miss', 'miss-test');
      expect(eventListener).toHaveBeenCalledWith('refresh', 'miss-test', 'data');
      expect(eventListener).toHaveBeenCalledWith('eviction', 'event-test', { reason: 'manual' });
      
      cacheService.removeEventListener(eventListener);
    });
  });

  describe('Error Handling', () => {
    test('should handle refresh function errors gracefully', async () => {
      const refreshFn = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      
      const result = await cacheService.get('error-test', refreshFn);
      expect(result).toBeNull();
      expect(refreshFn).toHaveBeenCalledTimes(1);
    });

    test('should return stale data on refresh error if available', async () => {
      cacheService.set('stale-test', 'stale-data', 50);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));
      
      const refreshFn = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      const result = await cacheService.get('stale-test', refreshFn);
      
      expect(result).toBe('stale-data'); // Should return stale data
    });
  });
});
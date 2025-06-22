// Real-time Data Cache Service for AI Dashboard
import type { AggregatedFamilyData } from '../types/ai';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
  version: number;
  hits: number;
}

// Cache configuration
interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxEntries: number;
  refreshThreshold: number; // percentage of TTL when refresh should start
  enableBackgroundRefresh: boolean;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  refreshes: number;
  evictions: number;
  totalEntries: number;
  hitRate: number;
  averageAge: number;
}

// Refresh strategy types
type RefreshStrategy = 'immediate' | 'background' | 'lazy' | 'scheduled';

// Cache event types
type CacheEvent = 'hit' | 'miss' | 'refresh' | 'eviction' | 'write';

// Cache event listener
type CacheEventListener = (event: CacheEvent, key: string, data?: any) => void;

// Cache invalidation reasons
type InvalidationReason = 'ttl_expired' | 'manual' | 'data_changed' | 'memory_pressure' | 'forced';

// Data Cache Service for intelligent caching and real-time refresh
export class DataCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private stats: CacheStats;
  private refreshQueue = new Set<string>();
  private refreshCallbacks = new Map<string, () => Promise<any>>();
  private eventListeners: CacheEventListener[] = [];
  private refreshIntervals = new Map<string, NodeJS.Timeout>();
  private isRefreshing = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxEntries: 100,
      refreshThreshold: 0.8, // Refresh when 80% of TTL has passed
      enableBackgroundRefresh: true,
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      refreshes: 0,
      evictions: 0,
      totalEntries: 0,
      hitRate: 0,
      averageAge: 0
    };

    // Start background cleanup
    this.startBackgroundCleanup();
  }

  // Get data from cache with intelligent refresh logic
  get<T>(key: string): T | null;
  get<T>(key: string, refreshFn: () => Promise<T>, ttl?: number): Promise<T | null>;
  get<T>(
    key: string, 
    refreshFn?: () => Promise<T>, 
    ttl: number = this.config.defaultTTL
  ): T | null | Promise<T | null> {
    const entry = this.cache.get(key);
    const now = new Date();

    // Cache hit - data exists and is valid
    if (entry && now < entry.expiresAt) {
      entry.hits++;
      this.stats.hits++;
      this.updateHitRate();
      this.emitEvent('hit', key, entry.data);

      // Check if we should background refresh
      if (refreshFn) {
        const age = now.getTime() - entry.timestamp.getTime();
        const maxAge = ttl * this.config.refreshThreshold;
        
        if (this.config.enableBackgroundRefresh && age > maxAge && !this.refreshQueue.has(key)) {
          this.backgroundRefresh(key, refreshFn, ttl);
        }
      }

      return entry.data as T;
    }

    // Cache miss
    this.stats.misses++;
    this.updateHitRate();
    this.emitEvent('miss', key);

    // If no refresh function provided, return null
    if (!refreshFn) {
      return null;
    }

    // Store refresh function for potential forceRefresh later
    this.refreshCallbacks.set(key, refreshFn);
    
    // Fetch fresh data (async path)
    return this.fetchFreshData(key, refreshFn, ttl, entry);
  }

  // Separate async method for fresh data fetching
  private async fetchFreshData<T>(
    key: string, 
    refreshFn: () => Promise<T>, 
    ttl: number, 
    staleEntry?: CacheEntry<any>
  ): Promise<T | null> {
    try {
      const data = await refreshFn();
      this.set(key, data, ttl);
      this.stats.refreshes++;
      this.emitEvent('refresh', key, data);
      return data;
    } catch (error) {
      console.error(`Failed to refresh cache for key: ${key}`, error);
      // Return stale data if available
      return staleEntry ? staleEntry.data as T : null;
    }
  }

  // Set data in cache
  set<T>(key: string, data: T, ttl: number = this.config.defaultTTL): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      version: (this.cache.get(key)?.version || 0) + 1,
      hits: 0
    };

    this.cache.set(key, entry);
    this.stats.totalEntries = this.cache.size;
    this.emitEvent('write', key, data);
  }

  // Invalidate specific cache entry
  invalidate(key: string, reason: InvalidationReason = 'manual'): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.refreshQueue.delete(key);
      this.clearRefreshInterval(key);
      this.stats.totalEntries = this.cache.size;
      this.emitEvent('eviction', key, { reason });
    }
    return deleted;
  }

  // Invalidate multiple entries by pattern
  invalidatePattern(pattern: RegExp, reason: InvalidationReason = 'manual'): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        if (this.invalidate(key, reason)) {
          count++;
        }
      }
    }
    return count;
  }

  // Clear entire cache
  clear(reason: InvalidationReason = 'manual'): void {
    const keyCount = this.cache.size;
    this.cache.clear();
    this.refreshQueue.clear();
    this.clearAllRefreshIntervals();
    this.stats.totalEntries = 0;
    this.stats.evictions += keyCount;
    console.log(`Cache cleared: ${keyCount} entries removed (${reason})`);
  }

  // Get cache statistics
  getStats(): CacheStats {
    this.updateAverageAge();
    return { ...this.stats };
  }

  // Check if key exists in cache and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = new Date();
    if (now >= entry.expiresAt) {
      this.invalidate(key, 'ttl_expired');
      return false;
    }
    
    return true;
  }

  // Get cache entry info (for debugging)
  getEntryInfo(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();
    const ttl = entry.expiresAt.getTime() - entry.timestamp.getTime();
    const remainingTTL = entry.expiresAt.getTime() - now.getTime();

    return {
      key,
      age: age,
      ttl: ttl,
      remainingTTL: Math.max(0, remainingTTL),
      hits: entry.hits,
      version: entry.version,
      isExpired: now >= entry.expiresAt,
      shouldRefresh: age > (ttl * this.config.refreshThreshold)
    };
  }

  // Schedule periodic refresh for a key
  scheduleRefresh(
    key: string, 
    refreshFn: () => Promise<any>, 
    interval: number,
    ttl?: number
  ): void {
    // Clear existing interval
    this.clearRefreshInterval(key);

    // Set up new interval
    const intervalId = setInterval(async () => {
      try {
        const data = await refreshFn();
        this.set(key, data, ttl);
        this.stats.refreshes++;
        this.emitEvent('refresh', key, data);
      } catch (error) {
        console.error(`Scheduled refresh failed for key: ${key}`, error);
      }
    }, interval);

    this.refreshIntervals.set(key, intervalId);
    this.refreshCallbacks.set(key, refreshFn);
  }

  // Add event listener
  addEventListener(listener: CacheEventListener): void {
    this.eventListeners.push(listener);
  }

  // Remove event listener
  removeEventListener(listener: CacheEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Get all cache keys
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache size
  getSize(): number {
    return this.cache.size;
  }

  // Force refresh of a specific key
  async forceRefresh<T>(key: string): Promise<T | null> {
    const refreshFn = this.refreshCallbacks.get(key);
    if (!refreshFn) {
      console.warn(`No refresh function available for key: ${key}`);
      return null;
    }

    try {
      const data = await refreshFn();
      this.set(key, data);
      this.stats.refreshes++;
      this.emitEvent('refresh', key, data);
      return data as T;
    } catch (error) {
      console.error(`Force refresh failed for key: ${key}`, error);
      return null;
    }
  }

  // Private methods

  private async backgroundRefresh(key: string, refreshFn: () => Promise<any>, ttl: number): Promise<void> {
    if (this.refreshQueue.has(key)) return;
    
    this.refreshQueue.add(key);
    
    try {
      const data = await refreshFn();
      this.set(key, data, ttl);
      this.stats.refreshes++;
      this.emitEvent('refresh', key, data);
    } catch (error) {
      console.error(`Background refresh failed for key: ${key}`, error);
    } finally {
      this.refreshQueue.delete(key);
    }
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.invalidate(leastUsedKey, 'memory_pressure');
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private updateAverageAge(): void {
    if (this.cache.size === 0) {
      this.stats.averageAge = 0;
      return;
    }

    const now = new Date();
    let totalAge = 0;

    for (const entry of this.cache.values()) {
      totalAge += now.getTime() - entry.timestamp.getTime();
    }

    this.stats.averageAge = totalAge / this.cache.size;
  }

  private emitEvent(event: CacheEvent, key: string, data?: any): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event, key, data);
      } catch (error) {
        console.error('Cache event listener error:', error);
      }
    }
  }

  private startBackgroundCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.invalidate(key, 'ttl_expired');
    }

    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  private clearRefreshInterval(key: string): void {
    const intervalId = this.refreshIntervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.refreshIntervals.delete(key);
    }
  }

  private clearAllRefreshIntervals(): void {
    for (const intervalId of this.refreshIntervals.values()) {
      clearInterval(intervalId);
    }
    this.refreshIntervals.clear();
    this.refreshCallbacks.clear();
  }

  // Cleanup method for proper disposal
  dispose(): void {
    this.clear('forced');
    this.clearAllRefreshIntervals();
    this.eventListeners.length = 0;
  }
}

// Singleton instance for global use
let cacheServiceInstance: DataCacheService | null = null;

export function getDataCacheService(): DataCacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new DataCacheService({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxEntries: 50,
      refreshThreshold: 0.75, // Refresh at 75% of TTL
      enableBackgroundRefresh: true
    });
  }
  return cacheServiceInstance;
}

export function setDataCacheService(service: DataCacheService): void {
  cacheServiceInstance = service;
}

// Export types
export type { CacheConfig, CacheStats, RefreshStrategy, CacheEvent, CacheEventListener, InvalidationReason };
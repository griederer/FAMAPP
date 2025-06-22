// Real-time Data Refresh Service for AI Dashboard
import { DataAggregationService } from './dataAggregationService';
import { getDataCacheService, type DataCacheService } from './dataCacheService';
import type { AggregatedFamilyData } from '../types/ai';

// Refresh configuration
interface RefreshConfig {
  familyDataInterval: number; // milliseconds
  enableAutoRefresh: boolean;
  staleThreshold: number; // milliseconds - when data is considered stale
  maxRetries: number;
  retryDelay: number; // milliseconds
  enableSmartRefresh: boolean; // Only refresh when data might have changed
}

// Refresh event types
type RefreshEvent = 'started' | 'completed' | 'failed' | 'data_changed' | 'cache_updated';

// Refresh event listener
type RefreshEventListener = (event: RefreshEvent, data?: any, error?: Error) => void;

// Data change detection
interface DataChangeSignature {
  todoCount: number;
  eventCount: number;
  groceryCount: number;
  documentCount: number;
  lastModified: Date;
  checksum: string;
}

// Refresh status
interface RefreshStatus {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  errors: Array<{ timestamp: Date; error: string; retryCount: number }>;
  refreshCount: number;
  successRate: number;
}

// Real-time Refresh Service for intelligent data updates
export class RealTimeRefreshService {
  private config: RefreshConfig;
  private cacheService: DataCacheService;
  private dataAggregationService: DataAggregationService;
  private refreshInterval: NodeJS.Timeout | null = null;
  private eventListeners: RefreshEventListener[] = [];
  private status: RefreshStatus;
  private lastDataSignature: DataChangeSignature | null = null;
  private isRefreshing = false;
  private refreshQueue: Set<string> = new Set();

  // Cache keys for different data types
  private static readonly CACHE_KEYS = {
    FAMILY_DATA: 'family_data',
    AI_SUMMARY: 'ai_summary',
    MEMBER_STATS: 'member_stats',
    TRENDS: 'trends_data'
  } as const;

  constructor(config: Partial<RefreshConfig> = {}) {
    this.config = {
      familyDataInterval: 5 * 60 * 1000, // 5 minutes
      enableAutoRefresh: true,
      staleThreshold: 10 * 60 * 1000, // 10 minutes
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      enableSmartRefresh: true,
      ...config
    };

    this.cacheService = getDataCacheService();
    this.dataAggregationService = new DataAggregationService();

    this.status = {
      isRefreshing: false,
      lastRefresh: null,
      nextRefresh: null,
      errors: [],
      refreshCount: 0,
      successRate: 1.0
    };

    // Set up cache event monitoring
    this.setupCacheEventMonitoring();
  }

  // Start real-time refresh service
  start(): void {
    if (this.refreshInterval) {
      console.warn('Real-time refresh service is already running');
      return;
    }

    console.log('Starting real-time refresh service...');
    
    // Initial data load
    this.refreshFamilyData();

    // Set up periodic refresh
    if (this.config.enableAutoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.refreshFamilyData();
      }, this.config.familyDataInterval);

      this.updateNextRefreshTime();
    }

    this.emitEvent('started');
  }

  // Stop real-time refresh service
  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Real-time refresh service stopped');
    }
  }

  // Force immediate refresh of all data
  async forceRefresh(): Promise<AggregatedFamilyData | null> {
    console.log('Force refreshing all data...');
    
    // Clear relevant cache entries
    this.cacheService.invalidatePattern(/^(family_data|ai_summary|member_stats|trends_data)/, 'forced');
    
    return this.refreshFamilyData(true);
  }

  // Get fresh family data with intelligent caching
  async getFamilyData(forceRefresh = false): Promise<AggregatedFamilyData | null> {
    const cacheKey = RealTimeRefreshService.CACHE_KEYS.FAMILY_DATA;

    if (forceRefresh) {
      this.cacheService.invalidate(cacheKey, 'forced');
    }

    // Try to get from cache with refresh function
    return this.cacheService.get(
      cacheKey,
      async () => {
        console.log('Fetching fresh family data...');
        return this.dataAggregationService.aggregateFamilyData();
      },
      this.config.familyDataInterval
    );
  }

  // Check if data is stale
  isDataStale(): boolean {
    const familyDataInfo = this.cacheService.getEntryInfo(RealTimeRefreshService.CACHE_KEYS.FAMILY_DATA);
    
    if (!familyDataInfo) return true;
    
    return familyDataInfo.age > this.config.staleThreshold;
  }

  // Get refresh status
  getStatus(): RefreshStatus {
    return { ...this.status };
  }

  // Add event listener
  addEventListener(listener: RefreshEventListener): void {
    this.eventListeners.push(listener);
  }

  // Remove event listener
  removeEventListener(listener: RefreshEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Get cache statistics
  getCacheStats() {
    return this.cacheService.getStats();
  }

  // Manually trigger data change detection
  async detectDataChanges(): Promise<boolean> {
    try {
      const currentData = await this.dataAggregationService.aggregateFamilyData();
      const currentSignature = this.generateDataSignature(currentData);
      
      if (!this.lastDataSignature) {
        this.lastDataSignature = currentSignature;
        return true; // First time, assume data changed
      }

      const hasChanged = !this.signaturesEqual(this.lastDataSignature, currentSignature);
      
      if (hasChanged) {
        console.log('Data changes detected:', {
          previous: this.lastDataSignature,
          current: currentSignature
        });
        this.lastDataSignature = currentSignature;
        this.emitEvent('data_changed', { signature: currentSignature });
      }

      return hasChanged;
    } catch (error) {
      console.error('Error detecting data changes:', error);
      return false;
    }
  }

  // Schedule a one-time refresh
  scheduleRefresh(delay: number): void {
    setTimeout(() => {
      this.refreshFamilyData();
    }, delay);
  }

  // Configure refresh settings
  updateConfig(newConfig: Partial<RefreshConfig>): void {
    const oldInterval = this.config.familyDataInterval;
    this.config = { ...this.config, ...newConfig };

    // Restart if interval changed and service is running
    if (this.refreshInterval && oldInterval !== this.config.familyDataInterval) {
      this.stop();
      this.start();
    }
  }

  // Get data freshness information
  getDataFreshness() {
    return {
      familyData: this.cacheService.getEntryInfo(RealTimeRefreshService.CACHE_KEYS.FAMILY_DATA),
      aiSummary: this.cacheService.getEntryInfo(RealTimeRefreshService.CACHE_KEYS.AI_SUMMARY),
      memberStats: this.cacheService.getEntryInfo(RealTimeRefreshService.CACHE_KEYS.MEMBER_STATS),
      trends: this.cacheService.getEntryInfo(RealTimeRefreshService.CACHE_KEYS.TRENDS)
    };
  }

  // Private methods

  private async refreshFamilyData(force = false): Promise<AggregatedFamilyData | null> {
    if (this.isRefreshing && !force) {
      console.log('Refresh already in progress, skipping...');
      return null;
    }

    this.isRefreshing = true;
    this.status.isRefreshing = true;
    this.emitEvent('started');

    let retryCount = 0;
    const maxRetries = this.config.maxRetries;

    while (retryCount <= maxRetries) {
      try {
        // Smart refresh - check if data actually changed
        if (this.config.enableSmartRefresh && !force && retryCount === 0) {
          const hasChanges = await this.detectDataChanges();
          if (!hasChanges) {
            console.log('No data changes detected, skipping refresh');
            this.completeRefresh(null);
            return this.cacheService.get(RealTimeRefreshService.CACHE_KEYS.FAMILY_DATA);
          }
        }

        // Fetch fresh data
        const familyData = await this.dataAggregationService.aggregateFamilyData();
        
        // Update cache
        this.cacheService.set(
          RealTimeRefreshService.CACHE_KEYS.FAMILY_DATA, 
          familyData, 
          this.config.familyDataInterval
        );

        // Update data signature
        this.lastDataSignature = this.generateDataSignature(familyData);

        this.completeRefresh(familyData);
        this.emitEvent('completed', familyData);
        this.emitEvent('cache_updated', { key: RealTimeRefreshService.CACHE_KEYS.FAMILY_DATA });

        return familyData;

      } catch (error) {
        retryCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.error(`Refresh attempt ${retryCount} failed:`, errorMessage);
        
        this.status.errors.push({
          timestamp: new Date(),
          error: errorMessage,
          retryCount
        });

        // Keep only last 10 errors
        if (this.status.errors.length > 10) {
          this.status.errors = this.status.errors.slice(-10);
        }

        if (retryCount <= maxRetries) {
          console.log(`Retrying in ${this.config.retryDelay}ms...`);
          await this.delay(this.config.retryDelay);
        } else {
          this.completeRefresh(null, error as Error);
          this.emitEvent('failed', null, error as Error);
          break;
        }
      }
    }

    return null;
  }

  private completeRefresh(data: AggregatedFamilyData | null, error?: Error): void {
    this.isRefreshing = false;
    this.status.isRefreshing = false;
    this.status.lastRefresh = new Date();
    this.status.refreshCount++;

    // Update success rate
    const recentErrors = this.status.errors.filter(
      e => Date.now() - e.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );
    const recentAttempts = Math.max(1, this.status.refreshCount % 10 || 10);
    this.status.successRate = Math.max(0, (recentAttempts - recentErrors.length) / recentAttempts);

    this.updateNextRefreshTime();
  }

  private updateNextRefreshTime(): void {
    if (this.config.enableAutoRefresh) {
      this.status.nextRefresh = new Date(Date.now() + this.config.familyDataInterval);
    } else {
      this.status.nextRefresh = null;
    }
  }

  private generateDataSignature(data: AggregatedFamilyData): DataChangeSignature {
    const signature = {
      todoCount: data.todos.totalCount,
      eventCount: data.events.totalCount,
      groceryCount: data.groceries.totalCount,
      documentCount: data.documents.totalCount,
      lastModified: new Date(),
      checksum: this.generateChecksum(data)
    };

    return signature;
  }

  private generateChecksum(data: AggregatedFamilyData): string {
    // Simple checksum based on key data points
    const checkString = `${data.todos.totalCount}-${data.events.totalCount}-${data.groceries.totalCount}-${data.documents.totalCount}`;
    return btoa(checkString).substring(0, 16);
  }

  private signaturesEqual(sig1: DataChangeSignature, sig2: DataChangeSignature): boolean {
    return (
      sig1.todoCount === sig2.todoCount &&
      sig1.eventCount === sig2.eventCount &&
      sig1.groceryCount === sig2.groceryCount &&
      sig1.documentCount === sig2.documentCount &&
      sig1.checksum === sig2.checksum
    );
  }

  private setupCacheEventMonitoring(): void {
    this.cacheService.addEventListener((event, key, data) => {
      if (event === 'refresh' && key === RealTimeRefreshService.CACHE_KEYS.FAMILY_DATA) {
        console.log('Family data cache updated via background refresh');
        this.emitEvent('cache_updated', { key, data });
      }
    });
  }

  private emitEvent(event: RefreshEvent, data?: any, error?: Error): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event, data, error);
      } catch (err) {
        console.error('Refresh event listener error:', err);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup method
  dispose(): void {
    this.stop();
    this.eventListeners.length = 0;
    this.refreshQueue.clear();
  }
}

// Singleton instance for global use
let refreshServiceInstance: RealTimeRefreshService | null = null;

export function getRealTimeRefreshService(): RealTimeRefreshService {
  if (!refreshServiceInstance) {
    refreshServiceInstance = new RealTimeRefreshService({
      familyDataInterval: 5 * 60 * 1000, // 5 minutes
      enableAutoRefresh: true,
      staleThreshold: 10 * 60 * 1000, // 10 minutes
      maxRetries: 3,
      retryDelay: 5000,
      enableSmartRefresh: true
    });
  }
  return refreshServiceInstance;
}

export function setRealTimeRefreshService(service: RealTimeRefreshService): void {
  refreshServiceInstance = service;
}

// Export types
export type { RefreshConfig, RefreshEvent, RefreshEventListener, RefreshStatus, DataChangeSignature };
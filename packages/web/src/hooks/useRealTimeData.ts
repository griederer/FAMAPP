// React hook for real-time data with caching and refresh strategies
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getRealTimeRefreshService, 
  type RealTimeRefreshService,
  type RefreshEvent,
  type RefreshStatus 
} from '@famapp/shared';
import type { AggregatedFamilyData } from '@famapp/shared';

// Hook configuration
interface UseRealTimeDataConfig {
  enableAutoRefresh: boolean;
  refreshInterval: number; // milliseconds
  staleThreshold: number; // milliseconds
  enableBackgroundRefresh: boolean;
  onDataChange?: (data: AggregatedFamilyData) => void;
  onError?: (error: Error) => void;
  onRefreshStart?: () => void;
  onRefreshComplete?: () => void;
}

// Hook return type
interface UseRealTimeDataReturn {
  // Data state
  familyData: AggregatedFamilyData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefresh: Date | null;
  isStale: boolean;
  
  // Control methods
  refresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  clearError: () => void;
  
  // Status and stats
  refreshStatus: RefreshStatus;
  cacheStats: any;
  dataFreshness: any;
  
  // Configuration
  updateConfig: (config: Partial<UseRealTimeDataConfig>) => void;
}

// Default configuration
const DEFAULT_CONFIG: UseRealTimeDataConfig = {
  enableAutoRefresh: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  staleThreshold: 10 * 60 * 1000, // 10 minutes
  enableBackgroundRefresh: true
};

// Custom hook for real-time data management
export function useRealTimeData(config: Partial<UseRealTimeDataConfig> = {}): UseRealTimeDataReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const refreshService = useRef<RealTimeRefreshService>(getRealTimeRefreshService());
  
  // Component state
  const [familyData, setFamilyData] = useState<AggregatedFamilyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>(() => refreshService.current.getStatus());
  const [cacheStats, setCacheStats] = useState<any>({});
  const [dataFreshness, setDataFreshness] = useState<any>({});

  // Callbacks refs to avoid stale closures
  const configRef = useRef(mergedConfig);
  configRef.current = mergedConfig;

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await refreshService.current.getFamilyData();
      if (data) {
        setFamilyData(data);
        setLastRefresh(new Date());
        configRef.current.onDataChange?.(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      configRef.current.onError?.(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      configRef.current.onRefreshStart?.();
      
      const data = await refreshService.current.getFamilyData(false);
      if (data) {
        setFamilyData(data);
        setLastRefresh(new Date());
        configRef.current.onDataChange?.(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refresh failed';
      setError(errorMessage);
      configRef.current.onError?.(err as Error);
    } finally {
      setIsRefreshing(false);
      configRef.current.onRefreshComplete?.();
    }
  }, []);

  // Force refresh (bypass cache)
  const forceRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      configRef.current.onRefreshStart?.();
      
      const data = await refreshService.current.forceRefresh();
      if (data) {
        setFamilyData(data);
        setLastRefresh(new Date());
        configRef.current.onDataChange?.(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Force refresh failed';
      setError(errorMessage);
      configRef.current.onError?.(err as Error);
    } finally {
      setIsRefreshing(false);
      configRef.current.onRefreshComplete?.();
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<UseRealTimeDataConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
    
    // Update refresh service config
    refreshService.current.updateConfig({
      familyDataInterval: configRef.current.refreshInterval,
      enableAutoRefresh: configRef.current.enableAutoRefresh,
      staleThreshold: configRef.current.staleThreshold
    });
  }, []);

  // Update stats periodically
  const updateStats = useCallback(() => {
    setRefreshStatus(refreshService.current.getStatus());
    setCacheStats(refreshService.current.getCacheStats());
    setDataFreshness(refreshService.current.getDataFreshness());
  }, []);

  // Check if data is stale
  const isStale = refreshService.current.isDataStale();

  // Set up refresh service event listeners
  useEffect(() => {
    const handleRefreshEvent = (event: RefreshEvent, data?: any, error?: Error) => {
      switch (event) {
        case 'started':
          setIsRefreshing(true);
          configRef.current.onRefreshStart?.();
          break;
          
        case 'completed':
          setIsRefreshing(false);
          if (data) {
            setFamilyData(data);
            setLastRefresh(new Date());
            configRef.current.onDataChange?.(data);
          }
          configRef.current.onRefreshComplete?.();
          break;
          
        case 'failed':
          setIsRefreshing(false);
          if (error) {
            const errorMessage = error.message || 'Refresh failed';
            setError(errorMessage);
            configRef.current.onError?.(error);
          }
          configRef.current.onRefreshComplete?.();
          break;
          
        case 'data_changed':
          console.log('Data changes detected, updating state...');
          break;
          
        case 'cache_updated':
          // Update stats when cache changes
          updateStats();
          break;
      }
    };

    refreshService.current.addEventListener(handleRefreshEvent);

    return () => {
      refreshService.current.removeEventListener(handleRefreshEvent);
    };
  }, [updateStats]);

  // Initialize refresh service and load data
  useEffect(() => {
    // Configure refresh service
    refreshService.current.updateConfig({
      familyDataInterval: mergedConfig.refreshInterval,
      enableAutoRefresh: mergedConfig.enableAutoRefresh,
      staleThreshold: mergedConfig.staleThreshold
    });

    // Start service and load initial data
    refreshService.current.start();
    loadInitialData();

    // Set up stats update interval
    const statsInterval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => {
      clearInterval(statsInterval);
      // Note: Don't stop the refresh service as other components might be using it
    };
  }, []); // Only run once on mount

  // Update stats on first render and when dependencies change
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  return {
    // Data state
    familyData,
    isLoading,
    isRefreshing,
    error,
    lastRefresh,
    isStale,
    
    // Control methods
    refresh,
    forceRefresh,
    clearError,
    
    // Status and stats
    refreshStatus,
    cacheStats,
    dataFreshness,
    
    // Configuration
    updateConfig
  };
}

// Hook for cache statistics only (lightweight)
export function useCacheStats() {
  const [stats, setStats] = useState({});
  const refreshService = getRealTimeRefreshService();

  useEffect(() => {
    const updateStats = () => {
      setStats(refreshService.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [refreshService]);

  return stats;
}

// Hook for refresh status only (lightweight)
export function useRefreshStatus() {
  const [status, setStatus] = useState<RefreshStatus>(() => getRealTimeRefreshService().getStatus());
  const refreshService = getRealTimeRefreshService();

  useEffect(() => {
    const handleRefreshEvent = (event: RefreshEvent) => {
      if (event === 'started' || event === 'completed' || event === 'failed') {
        setStatus(refreshService.getStatus());
      }
    };

    refreshService.addEventListener(handleRefreshEvent);
    
    return () => {
      refreshService.removeEventListener(handleRefreshEvent);
    };
  }, [refreshService]);

  return status;
}

// Export types
export type { UseRealTimeDataConfig, UseRealTimeDataReturn };
// Performance monitoring hook for tracking component load times and optimization metrics
import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  renderTime: number;
  memoryUsed?: number;
  bundleSize?: number;
}

interface PerformanceReport {
  metrics: PerformanceMetrics[];
  averageLoadTime: number;
  totalMemoryUsed: number;
  warnings: string[];
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  enableMemoryTracking?: boolean;
  warnThreshold?: number; // milliseconds
  logToConsole?: boolean;
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions) => {
  const {
    componentName,
    enableMemoryTracking = true,
    warnThreshold = 1000, // 1 second
    logToConsole = process.env.NODE_ENV === 'development'
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const renderStartRef = useRef<number>(0);

  // Track component mount time
  useEffect(() => {
    const mountTime = performance.now() - startTimeRef.current;
    
    // Get memory usage if available
    let memoryUsed: number | undefined;
    if (enableMemoryTracking && 'memory' in performance) {
      memoryUsed = (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
    }

    const newMetrics: PerformanceMetrics = {
      componentName,
      loadTime: mountTime,
      renderTime: 0, // Will be updated in render tracking
      memoryUsed
    };

    setMetrics(newMetrics);

    // Log performance warning if threshold exceeded
    if (mountTime > warnThreshold) {
      console.warn(
        `⚠️ Performance Warning: ${componentName} took ${mountTime.toFixed(2)}ms to load (threshold: ${warnThreshold}ms)`
      );
    }

    // Log to console in development
    if (logToConsole) {
      console.log(
        `📊 Performance: ${componentName} loaded in ${mountTime.toFixed(2)}ms` +
        (memoryUsed ? ` | Memory: ${memoryUsed.toFixed(2)}MB` : '')
      );
    }
  }, [componentName, enableMemoryTracking, warnThreshold, logToConsole]);

  // Track render time
  const startRenderTracking = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRenderTracking = useCallback(() => {
    if (renderStartRef.current > 0) {
      const renderTime = performance.now() - renderStartRef.current;
      setMetrics(prev => prev ? { ...prev, renderTime } : null);
      
      if (logToConsole) {
        console.log(`📊 Render time for ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  }, [componentName, logToConsole]);

  // Get performance report
  const getReport = useCallback((): PerformanceReport => {
    if (!metrics) {
      return {
        metrics: [],
        averageLoadTime: 0,
        totalMemoryUsed: 0,
        warnings: []
      };
    }

    const warnings: string[] = [];
    
    if (metrics.loadTime > warnThreshold) {
      warnings.push(`Component load time (${metrics.loadTime.toFixed(2)}ms) exceeds threshold`);
    }
    
    if (metrics.memoryUsed && metrics.memoryUsed > 50) {
      warnings.push(`High memory usage detected (${metrics.memoryUsed.toFixed(2)}MB)`);
    }

    return {
      metrics: [metrics],
      averageLoadTime: metrics.loadTime,
      totalMemoryUsed: metrics.memoryUsed || 0,
      warnings
    };
  }, [metrics, warnThreshold]);

  return {
    metrics,
    startRenderTracking,
    endRenderTracking,
    getReport
  };
};

// Global performance tracker for aggregating metrics
class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  addMetrics(metrics: PerformanceMetrics): void {
    const componentMetrics = this.metrics.get(metrics.componentName) || [];
    componentMetrics.push(metrics);
    this.metrics.set(metrics.componentName, componentMetrics);
  }

  getComponentMetrics(componentName: string): PerformanceMetrics[] {
    return this.metrics.get(componentName) || [];
  }

  getAllMetrics(): Map<string, PerformanceMetrics[]> {
    return new Map(this.metrics);
  }

  getAggregateReport(): {
    totalComponents: number;
    averageLoadTime: number;
    slowestComponents: Array<{ name: string; loadTime: number }>;
    totalMemoryUsed: number;
  } {
    let totalLoadTime = 0;
    let totalMemory = 0;
    let componentCount = 0;
    const componentLoadTimes: Array<{ name: string; loadTime: number }> = [];

    this.metrics.forEach((metricsList, componentName) => {
      if (metricsList.length > 0) {
        const avgLoadTime = metricsList.reduce((sum, m) => sum + m.loadTime, 0) / metricsList.length;
        totalLoadTime += avgLoadTime;
        componentCount++;
        componentLoadTimes.push({ name: componentName, loadTime: avgLoadTime });
        
        const avgMemory = metricsList.reduce((sum, m) => sum + (m.memoryUsed || 0), 0) / metricsList.length;
        totalMemory += avgMemory;
      }
    });

    // Sort by load time descending
    componentLoadTimes.sort((a, b) => b.loadTime - a.loadTime);

    return {
      totalComponents: componentCount,
      averageLoadTime: componentCount > 0 ? totalLoadTime / componentCount : 0,
      slowestComponents: componentLoadTimes.slice(0, 5),
      totalMemoryUsed: totalMemory
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Export singleton instance getter
export const getPerformanceTracker = () => PerformanceTracker.getInstance();

// Performance optimization hook for code splitting
export const useCodeSplitPerformance = (chunkName: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const loadStartTime = useRef<number>(0);

  const trackChunkLoad = useCallback(() => {
    loadStartTime.current = performance.now();
  }, []);

  const trackChunkLoaded = useCallback(() => {
    const loadTime = performance.now() - loadStartTime.current;
    setIsLoaded(true);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Chunk "${chunkName}" loaded in ${loadTime.toFixed(2)}ms`);
    }

    // Add to performance tracker
    getPerformanceTracker().addMetrics({
      componentName: `chunk:${chunkName}`,
      loadTime,
      renderTime: 0
    });
  }, [chunkName]);

  const trackChunkError = useCallback((error: Error) => {
    setLoadError(error);
    console.error(`❌ Failed to load chunk "${chunkName}":`, error);
  }, [chunkName]);

  return {
    isLoaded,
    loadError,
    trackChunkLoad,
    trackChunkLoaded,
    trackChunkError
  };
};
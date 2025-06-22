// Performance Monitor Hook Tests
import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitor, getPerformanceTracker, useCodeSplitPerformance } from '../usePerformanceMonitor';

// Mock performance API
const mockPerformance = {
  now: jest.fn(),
  memory: {
    usedJSHeapSize: 50 * 1048576 // 50MB in bytes
  },
  getEntriesByType: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn()
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('usePerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  test('tracks component load time correctly', () => {
    mockPerformance.now
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(150); // Mount time

    const { result } = renderHook(() =>
      usePerformanceMonitor({
        componentName: 'TestComponent',
        logToConsole: false
      })
    );

    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics?.componentName).toBe('TestComponent');
    expect(result.current.metrics?.loadTime).toBe(150);
  });

  test('tracks memory usage when enabled', () => {
    const { result } = renderHook(() =>
      usePerformanceMonitor({
        componentName: 'TestComponent',
        enableMemoryTracking: true,
        logToConsole: false
      })
    );

    expect(result.current.metrics?.memoryUsed).toBe(50); // 50MB
  });

  test('disables memory tracking when requested', () => {
    const { result } = renderHook(() =>
      usePerformanceMonitor({
        componentName: 'TestComponent',
        enableMemoryTracking: false,
        logToConsole: false
      })
    );

    expect(result.current.metrics?.memoryUsed).toBeUndefined();
  });

  test('warns about slow loading components', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(2000); // 2 seconds

    renderHook(() =>
      usePerformanceMonitor({
        componentName: 'SlowComponent',
        warnThreshold: 1000,
        logToConsole: true
      })
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Performance Warning: SlowComponent took 2000.00ms to load')
    );

    consoleSpy.mockRestore();
  });

  test('tracks render time with start and end methods', () => {
    mockPerformance.now
      .mockReturnValueOnce(0) // Mount start
      .mockReturnValueOnce(100) // Mount end
      .mockReturnValueOnce(200) // Render start
      .mockReturnValueOnce(250); // Render end

    const { result } = renderHook(() =>
      usePerformanceMonitor({
        componentName: 'TestComponent',
        logToConsole: false
      })
    );

    act(() => {
      result.current.startRenderTracking();
    });

    act(() => {
      result.current.endRenderTracking();
    });

    expect(result.current.metrics?.renderTime).toBe(50);
  });

  test('generates performance report with warnings', () => {
    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1500); // Slow load time

    const { result } = renderHook(() =>
      usePerformanceMonitor({
        componentName: 'SlowComponent',
        warnThreshold: 1000,
        logToConsole: false
      })
    );

    const report = result.current.getReport();

    expect(report.warnings).toContain(
      expect.stringContaining('Component load time (1500.00ms) exceeds threshold')
    );
    expect(report.averageLoadTime).toBe(1500);
  });

  test('generates memory usage warnings', () => {
    // Mock high memory usage
    Object.defineProperty(mockPerformance, 'memory', {
      value: { usedJSHeapSize: 100 * 1048576 }, // 100MB
      writable: true
    });

    const { result } = renderHook(() =>
      usePerformanceMonitor({
        componentName: 'MemoryHeavyComponent',
        enableMemoryTracking: true,
        logToConsole: false
      })
    );

    const report = result.current.getReport();

    expect(report.warnings).toContain(
      expect.stringContaining('High memory usage detected (100.00MB)')
    );
  });
});

describe('PerformanceTracker', () => {
  beforeEach(() => {
    getPerformanceTracker().clearMetrics();
  });

  test('aggregates metrics from multiple components', () => {
    const tracker = getPerformanceTracker();

    tracker.addMetrics({
      componentName: 'Component1',
      loadTime: 100,
      renderTime: 20,
      memoryUsed: 10
    });

    tracker.addMetrics({
      componentName: 'Component2',
      loadTime: 200,
      renderTime: 30,
      memoryUsed: 15
    });

    const report = tracker.getAggregateReport();

    expect(report.totalComponents).toBe(2);
    expect(report.averageLoadTime).toBe(150);
    expect(report.totalMemoryUsed).toBe(25);
    expect(report.slowestComponents[0].name).toBe('Component2');
  });

  test('tracks component metrics separately', () => {
    const tracker = getPerformanceTracker();

    tracker.addMetrics({
      componentName: 'TestComponent',
      loadTime: 150,
      renderTime: 25
    });

    const componentMetrics = tracker.getComponentMetrics('TestComponent');
    expect(componentMetrics).toHaveLength(1);
    expect(componentMetrics[0].loadTime).toBe(150);
  });

  test('handles empty metrics gracefully', () => {
    const tracker = getPerformanceTracker();
    const report = tracker.getAggregateReport();

    expect(report.totalComponents).toBe(0);
    expect(report.averageLoadTime).toBe(0);
    expect(report.slowestComponents).toEqual([]);
  });
});

describe('useCodeSplitPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPerformanceTracker().clearMetrics();
  });

  test('tracks chunk loading performance', () => {
    mockPerformance.now
      .mockReturnValueOnce(100) // Load start
      .mockReturnValueOnce(300); // Load end

    const { result } = renderHook(() =>
      useCodeSplitPerformance('dashboard-chunk')
    );

    act(() => {
      result.current.trackChunkLoad();
    });

    act(() => {
      result.current.trackChunkLoaded();
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.loadError).toBeNull();

    // Check if metrics were added to tracker
    const tracker = getPerformanceTracker();
    const chunkMetrics = tracker.getComponentMetrics('chunk:dashboard-chunk');
    expect(chunkMetrics).toHaveLength(1);
    expect(chunkMetrics[0].loadTime).toBe(200);
  });

  test('handles chunk loading errors', () => {
    const { result } = renderHook(() =>
      useCodeSplitPerformance('failing-chunk')
    );

    const testError = new Error('Chunk load failed');

    act(() => {
      result.current.trackChunkError(testError);
    });

    expect(result.current.loadError).toBe(testError);
    expect(result.current.isLoaded).toBe(false);
  });

  test('logs chunk performance in development', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock development environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    mockPerformance.now
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(250);

    const { result } = renderHook(() =>
      useCodeSplitPerformance('test-chunk')
    );

    act(() => {
      result.current.trackChunkLoad();
    });

    act(() => {
      result.current.trackChunkLoaded();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Chunk "test-chunk" loaded in 150.00ms')
    );

    // Restore environment
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });
});

describe('Performance API compatibility', () => {
  test('handles missing performance.memory gracefully', () => {
    // Remove memory property
    const originalMemory = mockPerformance.memory;
    delete (mockPerformance as any).memory;

    const { result } = renderHook(() =>
      usePerformanceMonitor({
        componentName: 'TestComponent',
        enableMemoryTracking: true,
        logToConsole: false
      })
    );

    expect(result.current.metrics?.memoryUsed).toBeUndefined();

    // Restore memory property
    mockPerformance.memory = originalMemory;
  });

  test('works with basic performance.now only', () => {
    // Mock minimal performance API
    const minimalPerformance = {
      now: jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(100)
    };

    Object.defineProperty(global, 'performance', {
      value: minimalPerformance,
      writable: true
    });

    const { result } = renderHook(() =>
      usePerformanceMonitor({
        componentName: 'MinimalComponent',
        enableMemoryTracking: false,
        logToConsole: false
      })
    );

    expect(result.current.metrics?.loadTime).toBe(100);
    expect(result.current.metrics?.memoryUsed).toBeUndefined();

    // Restore full mock
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true
    });
  });
});
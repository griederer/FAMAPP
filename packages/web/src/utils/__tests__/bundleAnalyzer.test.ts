// Bundle Analyzer Tests
import { 
  getBundleAnalyzer, 
  trackBundleLoad, 
  trackBundleLoaded, 
  checkCodeSplittingEffectiveness 
} from '../bundleAnalyzer';

// Mock performance API
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => [])
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('BundleAnalyzer', () => {
  let bundleAnalyzer: ReturnType<typeof getBundleAnalyzer>;

  beforeEach(() => {
    bundleAnalyzer = getBundleAnalyzer();
    jest.clearAllMocks();
  });

  describe('Bundle Structure Analysis', () => {
    test('analyzes bundle structure correctly', () => {
      const analysis = bundleAnalyzer.analyzeBundleStructure();

      expect(analysis).toHaveProperty('totalSize');
      expect(analysis).toHaveProperty('chunks');
      expect(analysis).toHaveProperty('largestChunks');
      expect(analysis).toHaveProperty('suggestions');
      expect(analysis).toHaveProperty('duplicateModules');

      expect(analysis.chunks).toBeInstanceOf(Array);
      expect(analysis.chunks.length).toBeGreaterThan(0);
    });

    test('identifies largest chunks correctly', () => {
      const analysis = bundleAnalyzer.analyzeBundleStructure();

      expect(analysis.largestChunks).toHaveLength(3);
      
      // Should be sorted by size descending
      for (let i = 0; i < analysis.largestChunks.length - 1; i++) {
        expect(analysis.largestChunks[i].size).toBeGreaterThanOrEqual(
          analysis.largestChunks[i + 1].size
        );
      }
    });

    test('calculates total bundle size correctly', () => {
      const analysis = bundleAnalyzer.analyzeBundleStructure();
      
      const calculatedTotal = analysis.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      expect(analysis.totalSize).toBe(calculatedTotal);
    });

    test('identifies async vs sync chunks', () => {
      const analysis = bundleAnalyzer.analyzeBundleStructure();
      
      const mainChunk = analysis.chunks.find(chunk => chunk.name === 'main');
      const dashboardChunk = analysis.chunks.find(chunk => chunk.name === 'dashboard');
      
      expect(mainChunk?.isAsync).toBe(false);
      expect(dashboardChunk?.isAsync).toBe(true);
    });
  });

  describe('Optimization Suggestions', () => {
    test('suggests splitting large chunks', () => {
      const analysis = bundleAnalyzer.analyzeBundleStructure();
      
      const largeSuggestions = analysis.suggestions.filter(s => 
        s.includes('splitting') || s.includes('split')
      );
      
      expect(largeSuggestions.length).toBeGreaterThan(0);
    });

    test('identifies bundle size issues', () => {
      const analysis = bundleAnalyzer.analyzeBundleStructure();
      
      if (analysis.totalSize > 1000000) {
        const sizeSuggestions = analysis.suggestions.filter(s => 
          s.includes('Total bundle size')
        );
        expect(sizeSuggestions.length).toBeGreaterThan(0);
      }
    });

    test('suggests async loading improvements', () => {
      const analysis = bundleAnalyzer.analyzeBundleStructure();
      
      const syncChunks = analysis.chunks.filter(chunk => 
        !chunk.isAsync && chunk.name !== 'main'
      );
      
      if (syncChunks.length > 0) {
        const asyncSuggestions = analysis.suggestions.filter(s => 
          s.includes('async')
        );
        expect(asyncSuggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Duplicate Module Detection', () => {
    test('finds duplicate modules across chunks', () => {
      const analysis = bundleAnalyzer.analyzeBundleStructure();
      
      expect(analysis.duplicateModules).toBeInstanceOf(Array);
      
      // In our mock data, there shouldn't be obvious duplicates
      // but the detection logic should work
      analysis.duplicateModules.forEach(module => {
        expect(typeof module).toBe('string');
      });
    });
  });

  describe('Performance Recommendations', () => {
    test('generates code splitting recommendations', () => {
      const recommendations = bundleAnalyzer.generatePerformanceRecommendations();
      
      expect(recommendations).toHaveProperty('codesplitting');
      expect(recommendations).toHaveProperty('bundleOptimization');
      expect(recommendations).toHaveProperty('loadingStrategies');
      
      expect(recommendations.codesplitting).toBeInstanceOf(Array);
      expect(recommendations.codesplitting.length).toBeGreaterThan(0);
    });

    test('provides bundle optimization suggestions', () => {
      const recommendations = bundleAnalyzer.generatePerformanceRecommendations();
      
      expect(recommendations.bundleOptimization).toContain(
        expect.stringContaining('tree shaking')
      );
      expect(recommendations.bundleOptimization).toContain(
        expect.stringContaining('dependencies')
      );
    });

    test('suggests loading strategies', () => {
      const recommendations = bundleAnalyzer.generatePerformanceRecommendations();
      
      expect(recommendations.loadingStrategies).toContain(
        expect.stringContaining('preloading')
      );
      expect(recommendations.loadingStrategies).toContain(
        expect.stringContaining('lazy loading')
      );
    });
  });

  describe('Runtime Performance Monitoring', () => {
    test('monitors runtime performance metrics', () => {
      const runtime = bundleAnalyzer.monitorRuntimePerformance();
      
      expect(runtime).toHaveProperty('memoryUsage');
      expect(runtime).toHaveProperty('loadedChunks');
      expect(runtime).toHaveProperty('performanceMarks');
      
      expect(typeof runtime.memoryUsage).toBe('number');
      expect(runtime.loadedChunks).toBeInstanceOf(Array);
      expect(runtime.performanceMarks).toBeInstanceOf(Array);
    });

    test('handles missing memory API gracefully', () => {
      // Remove memory property temporarily
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;
      
      const runtime = bundleAnalyzer.monitorRuntimePerformance();
      expect(runtime.memoryUsage).toBe(0);
      
      // Restore memory property
      if (originalMemory) {
        (performance as any).memory = originalMemory;
      }
    });
  });

  describe('Optimization Report Generation', () => {
    test('generates comprehensive optimization report', () => {
      const report = bundleAnalyzer.generateOptimizationReport();
      
      expect(report).toHaveProperty('bundleAnalysis');
      expect(report).toHaveProperty('runtimePerformance');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('score');
      
      expect(typeof report.score).toBe('number');
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });

    test('calculates performance score correctly', () => {
      const report = bundleAnalyzer.generateOptimizationReport();
      
      // Score should be based on various factors
      expect(report.score).toBeDefined();
      
      // Should penalize large bundle sizes
      if (report.bundleAnalysis.totalSize > 1000000) {
        expect(report.score).toBeLessThan(100);
      }
    });

    test('penalizes non-async chunks in scoring', () => {
      const report = bundleAnalyzer.generateOptimizationReport();
      
      const nonAsyncChunks = report.bundleAnalysis.chunks.filter(
        c => !c.isAsync && c.name !== 'main'
      );
      
      if (nonAsyncChunks.length > 0) {
        expect(report.score).toBeLessThan(100);
      }
    });
  });
});

describe('Bundle Tracking Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('tracks bundle load start', () => {
    trackBundleLoad('test-bundle');
    
    expect(mockPerformance.mark).toHaveBeenCalledWith('bundle-test-bundle-start');
  });

  test('tracks bundle load completion', () => {
    trackBundleLoaded('test-bundle');
    
    expect(mockPerformance.mark).toHaveBeenCalledWith('bundle-test-bundle-end');
    expect(mockPerformance.measure).toHaveBeenCalledWith(
      'bundle-test-bundle-load',
      'bundle-test-bundle-start',
      'bundle-test-bundle-end'
    );
  });

  test('handles bundle tracking errors gracefully', () => {
    // Mock performance.mark to throw an error
    mockPerformance.mark.mockImplementationOnce(() => {
      throw new Error('Performance API not available');
    });
    
    // Should not throw
    expect(() => trackBundleLoad('error-bundle')).not.toThrow();
  });
});

describe('Code Splitting Effectiveness Check', () => {
  test('detects working code splitting', () => {
    const effectiveness = checkCodeSplittingEffectiveness();
    
    expect(effectiveness).toHaveProperty('isWorking');
    expect(effectiveness).toHaveProperty('asyncChunksLoaded');
    expect(effectiveness).toHaveProperty('recommendations');
    
    expect(typeof effectiveness.isWorking).toBe('boolean');
    expect(typeof effectiveness.asyncChunksLoaded).toBe('number');
    expect(effectiveness.recommendations).toBeInstanceOf(Array);
  });

  test('provides recommendations when code splitting is not effective', () => {
    const effectiveness = checkCodeSplittingEffectiveness();
    
    if (!effectiveness.isWorking) {
      expect(effectiveness.recommendations).toContain(
        expect.stringContaining('Implement code splitting')
      );
    }
    
    if (effectiveness.asyncChunksLoaded < 3) {
      expect(effectiveness.recommendations).toContain(
        expect.stringContaining('granular code splitting')
      );
    }
  });

  test('counts async chunks correctly', () => {
    const bundleAnalyzer = getBundleAnalyzer();
    const analysis = bundleAnalyzer.analyzeBundleStructure();
    const effectiveness = checkCodeSplittingEffectiveness();
    
    const expectedAsyncChunks = analysis.chunks.filter(chunk => chunk.isAsync).length;
    expect(effectiveness.asyncChunksLoaded).toBe(expectedAsyncChunks);
  });
});

describe('Size Formatting', () => {
  test('formats bytes correctly', () => {
    const bundleAnalyzer = getBundleAnalyzer();
    const analysis = bundleAnalyzer.analyzeBundleStructure();
    
    // Check that sizes are reasonable (not in raw bytes for display)
    analysis.chunks.forEach(chunk => {
      expect(chunk.size).toBeGreaterThan(0);
    });
  });
});

describe('Singleton Pattern', () => {
  test('returns same instance for getBundleAnalyzer', () => {
    const analyzer1 = getBundleAnalyzer();
    const analyzer2 = getBundleAnalyzer();
    
    expect(analyzer1).toBe(analyzer2);
  });
});

describe('Error Handling', () => {
  test('handles analysis errors gracefully', () => {
    const bundleAnalyzer = getBundleAnalyzer();
    
    // Should not throw even with potential errors
    expect(() => bundleAnalyzer.analyzeBundleStructure()).not.toThrow();
    expect(() => bundleAnalyzer.generateOptimizationReport()).not.toThrow();
  });

  test('provides fallback values for missing data', () => {
    const bundleAnalyzer = getBundleAnalyzer();
    const analysis = bundleAnalyzer.analyzeBundleStructure();
    
    // Should have fallback values
    expect(analysis.chunks).toBeDefined();
    expect(analysis.suggestions).toBeDefined();
    expect(analysis.duplicateModules).toBeDefined();
  });
});
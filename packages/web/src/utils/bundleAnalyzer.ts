// Bundle analysis utilities for identifying optimization opportunities
interface BundleChunk {
  name: string;
  size: number;
  modules: string[];
  isAsync: boolean;
  dependencies: string[];
}

interface BundleAnalysis {
  totalSize: number;
  chunks: BundleChunk[];
  largestChunks: BundleChunk[];
  suggestions: string[];
  duplicateModules: string[];
}

class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  
  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  // Analyze current bundle structure
  analyzeBundleStructure(): BundleAnalysis {
    // In a real implementation, this would analyze webpack stats
    // For now, we'll provide simulated analysis based on our code structure
    
    const chunks: BundleChunk[] = [
      {
        name: 'main',
        size: 250000, // ~250KB
        modules: ['App', 'AuthProvider', 'ThemeProvider', 'I18nProvider'],
        isAsync: false,
        dependencies: ['react', 'react-dom']
      },
      {
        name: 'dashboard',
        size: 180000, // ~180KB
        modules: ['AIDashboard', 'SmartCards', 'ChatInterface'],
        isAsync: true,
        dependencies: ['@anthropic-ai/sdk']
      },
      {
        name: 'modules',
        size: 150000, // ~150KB
        modules: ['TodoModule', 'CalendarModule', 'GroceriesModule', 'DocumentsModule'],
        isAsync: true,
        dependencies: ['firebase']
      },
      {
        name: 'analytics',
        size: 90000, // ~90KB
        modules: ['AnalyticsPanel', 'SmartAlerts', 'GoalTracker'],
        isAsync: true,
        dependencies: []
      },
      {
        name: 'recommendations',
        size: 75000, // ~75KB
        modules: ['SmartRecommendations', 'SmartRecommendationsService'],
        isAsync: true,
        dependencies: []
      }
    ];

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const largestChunks = [...chunks].sort((a, b) => b.size - a.size).slice(0, 3);
    
    const suggestions = this.generateOptimizationSuggestions(chunks, totalSize);
    const duplicateModules = this.findDuplicateModules(chunks);

    return {
      totalSize,
      chunks,
      largestChunks,
      suggestions,
      duplicateModules
    };
  }

  private generateOptimizationSuggestions(chunks: BundleChunk[], totalSize: number): string[] {
    const suggestions: string[] = [];

    // Check for oversized chunks
    chunks.forEach(chunk => {
      if (chunk.size > 200000) { // 200KB threshold
        suggestions.push(`Consider splitting "${chunk.name}" chunk (${this.formatSize(chunk.size)}) into smaller pieces`);
      }
    });

    // Check total bundle size
    if (totalSize > 1000000) { // 1MB threshold
      suggestions.push(`Total bundle size (${this.formatSize(totalSize)}) is large. Consider implementing more aggressive code splitting`);
    }

    // Check for non-async chunks
    const synchronousChunks = chunks.filter(chunk => !chunk.isAsync && chunk.name !== 'main');
    if (synchronousChunks.length > 0) {
      suggestions.push('Convert synchronous chunks to async loading: ' + synchronousChunks.map(c => c.name).join(', '));
    }

    // Check for dependency optimization
    const heavyDependencies = ['@anthropic-ai/sdk', 'firebase'];
    heavyDependencies.forEach(dep => {
      const chunksWithDep = chunks.filter(chunk => chunk.dependencies.includes(dep));
      if (chunksWithDep.length > 1) {
        suggestions.push(`"${dep}" is loaded in multiple chunks. Consider consolidating or lazy loading.`);
      }
    });

    return suggestions;
  }

  private findDuplicateModules(chunks: BundleChunk[]): string[] {
    const moduleCount = new Map<string, number>();
    
    chunks.forEach(chunk => {
      chunk.modules.forEach(module => {
        moduleCount.set(module, (moduleCount.get(module) || 0) + 1);
      });
    });

    return Array.from(moduleCount.entries())
      .filter(([, count]) => count > 1)
      .map(([module]) => module);
  }

  private formatSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Generate performance recommendations
  generatePerformanceRecommendations(): {
    codesplitting: string[];
    bundleOptimization: string[];
    loadingStrategies: string[];
  } {
    return {
      codesplitting: [
        'Implement route-based code splitting for main modules',
        'Use dynamic imports for heavy components (charts, editors)',
        'Split vendor libraries into separate chunks',
        'Lazy load dashboard sections based on user interaction'
      ],
      bundleOptimization: [
        'Use tree shaking to eliminate unused code',
        'Implement dead code elimination',
        'Optimize dependencies by importing only needed functions',
        'Use webpack bundle analyzer to identify optimization opportunities',
        'Compress assets using gzip/brotli'
      ],
      loadingStrategies: [
        'Implement component preloading for likely next actions',
        'Use service workers for caching strategies',
        'Implement progressive loading for data-heavy components',
        'Use Intersection Observer for lazy loading below-fold content',
        'Implement skeleton screens for better perceived performance'
      ]
    };
  }

  // Monitor real-time performance
  monitorRuntimePerformance(): {
    memoryUsage: number;
    loadedChunks: string[];
    performanceMarks: PerformanceMark[];
  } {
    // Get memory usage if available
    let memoryUsage = 0;
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576; // MB
    }

    // Get performance marks
    const performanceMarks = performance.getEntriesByType('mark') as PerformanceMark[];

    // Simulate loaded chunks (in real implementation, this would come from webpack runtime)
    const loadedChunks = ['main', 'dashboard']; // Simplified

    return {
      memoryUsage,
      loadedChunks,
      performanceMarks
    };
  }

  // Generate optimization report
  generateOptimizationReport(): {
    bundleAnalysis: BundleAnalysis;
    runtimePerformance: ReturnType<BundleAnalyzer['monitorRuntimePerformance']>;
    recommendations: ReturnType<BundleAnalyzer['generatePerformanceRecommendations']>;
    score: number;
  } {
    const bundleAnalysis = this.analyzeBundleStructure();
    const runtimePerformance = this.monitorRuntimePerformance();
    const recommendations = this.generatePerformanceRecommendations();

    // Calculate performance score (0-100)
    let score = 100;

    // Deduct points for large bundle size
    if (bundleAnalysis.totalSize > 1000000) score -= 20;
    else if (bundleAnalysis.totalSize > 500000) score -= 10;

    // Deduct points for non-async chunks
    const nonAsyncChunks = bundleAnalysis.chunks.filter(c => !c.isAsync && c.name !== 'main');
    score -= nonAsyncChunks.length * 10;

    // Deduct points for duplicate modules
    score -= bundleAnalysis.duplicateModules.length * 5;

    // Deduct points for high memory usage
    if (runtimePerformance.memoryUsage > 100) score -= 15;
    else if (runtimePerformance.memoryUsage > 50) score -= 10;

    score = Math.max(0, Math.min(100, score));

    return {
      bundleAnalysis,
      runtimePerformance,
      recommendations,
      score
    };
  }
}

// Export singleton instance
export const getBundleAnalyzer = () => BundleAnalyzer.getInstance();

// Performance monitoring functions
export const trackBundleLoad = (bundleName: string) => {
  performance.mark(`bundle-${bundleName}-start`);
};

export const trackBundleLoaded = (bundleName: string) => {
  performance.mark(`bundle-${bundleName}-end`);
  performance.measure(
    `bundle-${bundleName}-load`,
    `bundle-${bundleName}-start`,
    `bundle-${bundleName}-end`
  );
};

// Utility to check if code splitting is working
export const checkCodeSplittingEffectiveness = (): {
  isWorking: boolean;
  asyncChunksLoaded: number;
  recommendations: string[];
} => {
  const analyzer = getBundleAnalyzer();
  const analysis = analyzer.analyzeBundleStructure();
  
  const asyncChunks = analysis.chunks.filter(chunk => chunk.isAsync);
  const isWorking = asyncChunks.length > 0;
  
  const recommendations: string[] = [];
  
  if (!isWorking) {
    recommendations.push('No async chunks detected. Implement code splitting.');
  }
  
  if (asyncChunks.length < 3) {
    recommendations.push('Consider implementing more granular code splitting.');
  }

  return {
    isWorking,
    asyncChunksLoaded: asyncChunks.length,
    recommendations
  };
};
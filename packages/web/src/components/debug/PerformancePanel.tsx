// Performance monitoring panel for development and optimization insights
import React, { useState, useEffect, useCallback } from 'react';
import { usePerformanceMonitor, getPerformanceTracker } from '../../hooks/usePerformanceMonitor';
import { getBundleAnalyzer, checkCodeSplittingEffectiveness } from '../../utils/bundleAnalyzer';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import './PerformancePanel.css';

interface PerformancePanelProps {
  className?: string;
  showInProduction?: boolean;
}

interface PerformanceData {
  bundleAnalysis: any;
  runtimeMetrics: any;
  optimizationScore: number;
  codeSplittingStatus: any;
  loadedComponents: string[];
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  className = '',
  showInProduction = false
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bundles' | 'components' | 'recommendations'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const { metrics: panelMetrics } = usePerformanceMonitor({
    componentName: 'PerformancePanel',
    logToConsole: false
  });

  // Only show in development unless explicitly enabled for production
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  // Load performance data
  const loadPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const bundleAnalyzer = getBundleAnalyzer();
      const performanceTracker = getPerformanceTracker();
      
      const bundleAnalysis = bundleAnalyzer.analyzeBundleStructure();
      const runtimeMetrics = bundleAnalyzer.monitorRuntimePerformance();
      const optimizationReport = bundleAnalyzer.generateOptimizationReport();
      const codeSplittingStatus = checkCodeSplittingEffectiveness();
      
      const allMetrics = performanceTracker.getAllMetrics();
      const loadedComponents = Array.from(allMetrics.keys());

      setPerformanceData({
        bundleAnalysis,
        runtimeMetrics,
        optimizationScore: optimizationReport.score,
        codeSplittingStatus,
        loadedComponents
      });
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shouldShow && isVisible) {
      loadPerformanceData();
    }
  }, [shouldShow, isVisible, loadPerformanceData]);

  // Format file size
  const formatSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  // Render overview tab
  const renderOverview = () => {
    if (!performanceData) return null;

    return (
      <div className="performance-overview">
        <div className="metrics-grid">
          <Card className="metric-card">
            <div className="metric-value" style={{ color: getScoreColor(performanceData.optimizationScore) }}>
              {performanceData.optimizationScore}
            </div>
            <div className="metric-label">Performance Score</div>
          </Card>
          
          <Card className="metric-card">
            <div className="metric-value">
              {formatSize(performanceData.bundleAnalysis.totalSize)}
            </div>
            <div className="metric-label">Total Bundle Size</div>
          </Card>
          
          <Card className="metric-card">
            <div className="metric-value">
              {performanceData.runtimeMetrics.memoryUsage.toFixed(1)} MB
            </div>
            <div className="metric-label">Memory Usage</div>
          </Card>
          
          <Card className="metric-card">
            <div className="metric-value">
              {performanceData.codeSplittingStatus.asyncChunksLoaded}
            </div>
            <div className="metric-label">Async Chunks</div>
          </Card>
        </div>

        <Card className="status-card">
          <h3>Code Splitting Status</h3>
          <div className={`status-indicator ${performanceData.codeSplittingStatus.isWorking ? 'working' : 'not-working'}`}>
            {performanceData.codeSplittingStatus.isWorking ? '✅ Working' : '❌ Not Working'}
          </div>
          {performanceData.codeSplittingStatus.recommendations.map((rec, index) => (
            <div key={index} className="recommendation">
              💡 {rec}
            </div>
          ))}
        </Card>
      </div>
    );
  };

  // Render bundles tab
  const renderBundles = () => {
    if (!performanceData) return null;

    return (
      <div className="bundles-analysis">
        <div className="bundles-grid">
          {performanceData.bundleAnalysis.chunks.map((chunk: any) => (
            <Card key={chunk.name} className="bundle-card">
              <div className="bundle-header">
                <h4>{chunk.name}</h4>
                <span className={`bundle-type ${chunk.isAsync ? 'async' : 'sync'}`}>
                  {chunk.isAsync ? 'Async' : 'Sync'}
                </span>
              </div>
              <div className="bundle-size">{formatSize(chunk.size)}</div>
              <div className="bundle-modules">
                <strong>Modules:</strong>
                <ul>
                  {chunk.modules.map((module: string) => (
                    <li key={module}>{module}</li>
                  ))}
                </ul>
              </div>
              {chunk.dependencies.length > 0 && (
                <div className="bundle-dependencies">
                  <strong>Dependencies:</strong>
                  <ul>
                    {chunk.dependencies.map((dep: string) => (
                      <li key={dep}>{dep}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>

        {performanceData.bundleAnalysis.suggestions.length > 0 && (
          <Card className="suggestions-card">
            <h3>Optimization Suggestions</h3>
            <ul className="suggestions-list">
              {performanceData.bundleAnalysis.suggestions.map((suggestion: string, index: number) => (
                <li key={index}>💡 {suggestion}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  };

  // Render components tab
  const renderComponents = () => {
    if (!performanceData) return null;

    const performanceTracker = getPerformanceTracker();
    const aggregateReport = performanceTracker.getAggregateReport();

    return (
      <div className="components-analysis">
        <div className="components-summary">
          <Card className="summary-card">
            <h3>Component Performance Summary</h3>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total Components:</span>
                <span className="stat-value">{aggregateReport.totalComponents}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Average Load Time:</span>
                <span className="stat-value">{aggregateReport.averageLoadTime.toFixed(2)}ms</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Memory:</span>
                <span className="stat-value">{aggregateReport.totalMemoryUsed.toFixed(2)}MB</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="slowest-components">
          <h3>Slowest Components</h3>
          <div className="components-list">
            {aggregateReport.slowestComponents.map((component, index) => (
              <div key={component.name} className="component-item">
                <div className="component-rank">#{index + 1}</div>
                <div className="component-name">{component.name}</div>
                <div className="component-time">{component.loadTime.toFixed(2)}ms</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="loaded-components">
          <h3>Loaded Components</h3>
          <div className="components-tags">
            {performanceData.loadedComponents.map((component) => (
              <span key={component} className="component-tag">
                {component}
              </span>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // Render recommendations tab
  const renderRecommendations = () => {
    const bundleAnalyzer = getBundleAnalyzer();
    const recommendations = bundleAnalyzer.generatePerformanceRecommendations();

    return (
      <div className="recommendations-analysis">
        <Card className="recommendations-section">
          <h3>Code Splitting Recommendations</h3>
          <ul className="recommendations-list">
            {recommendations.codesplitting.map((rec, index) => (
              <li key={index}>🚀 {rec}</li>
            ))}
          </ul>
        </Card>

        <Card className="recommendations-section">
          <h3>Bundle Optimization</h3>
          <ul className="recommendations-list">
            {recommendations.bundleOptimization.map((rec, index) => (
              <li key={index}>📦 {rec}</li>
            ))}
          </ul>
        </Card>

        <Card className="recommendations-section">
          <h3>Loading Strategies</h3>
          <ul className="recommendations-list">
            {recommendations.loadingStrategies.map((rec, index) => (
              <li key={index}>⚡ {rec}</li>
            ))}
          </ul>
        </Card>
      </div>
    );
  };

  // Don't render in production unless explicitly enabled
  if (!shouldShow) {
    return null;
  }

  return (
    <>
      {/* Performance Toggle Button */}
      <button
        className="performance-toggle"
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle Performance Panel"
      >
        📊
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className={`performance-panel ${className}`}>
          <Card className="performance-panel-card">
            <div className="panel-header">
              <h2>Performance Monitor</h2>
              <div className="header-actions">
                <Button onClick={loadPerformanceData} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
                <Button variant="ghost" onClick={() => setIsVisible(false)}>
                  ✕
                </Button>
              </div>
            </div>

            <div className="panel-tabs">
              <button
                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`tab-button ${activeTab === 'bundles' ? 'active' : ''}`}
                onClick={() => setActiveTab('bundles')}
              >
                Bundles
              </button>
              <button
                className={`tab-button ${activeTab === 'components' ? 'active' : ''}`}
                onClick={() => setActiveTab('components')}
              >
                Components
              </button>
              <button
                className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
              >
                Recommendations
              </button>
            </div>

            <div className="panel-content">
              {isLoading ? (
                <div className="loading-state">Loading performance data...</div>
              ) : (
                <>
                  {activeTab === 'overview' && renderOverview()}
                  {activeTab === 'bundles' && renderBundles()}
                  {activeTab === 'components' && renderComponents()}
                  {activeTab === 'recommendations' && renderRecommendations()}
                </>
              )}
            </div>

            {panelMetrics && (
              <div className="panel-footer">
                Panel Load Time: {panelMetrics.loadTime.toFixed(2)}ms
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default PerformancePanel;
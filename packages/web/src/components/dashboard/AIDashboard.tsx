// AI-powered Dashboard component with real-time family insights and intelligent caching
import React, { useEffect, useState, useCallback } from 'react';
import { useAI } from '../../hooks/useAI';
import { useI18n } from '../../hooks/useI18n';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import type { AggregatedFamilyData, AIResponse } from '@famapp/shared';
import { initializeAIService } from '../../config/ai';
import { LoadingState } from '../ui/LoadingState';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SmartCards } from './SmartCards';
import { ChatInterface } from './ChatInterface';
import { SmartAlerts } from './SmartAlerts';
import { AnalyticsPanel } from './AnalyticsPanel';
import { GoalTracker } from './GoalTracker';
import { SmartRecommendations } from './SmartRecommendations';
import './AIDashboard.css';

// Component props
interface AIDashboardProps {
  className?: string;
}

// Dashboard sections
type DashboardSection = 'summary' | 'insights' | 'alerts' | 'analytics' | 'recommendations' | 'chat' | 'goals';

// Component state interface
interface DashboardState {
  aiSummary: AIResponse | null;
  aiLoading: boolean;
  aiError: string | null;
  activeSection: DashboardSection;
  showCacheStats: boolean;
}

// AI Dashboard component with real-time data refresh and intelligent caching
export const AIDashboard: React.FC<AIDashboardProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const { generateSummary, isHealthy, isLoading: globalAiLoading, error: globalAiError } = useAI();
  
  // Real-time data hook with caching
  const {
    familyData,
    isLoading: dataLoading,
    isRefreshing,
    error: dataError,
    lastRefresh,
    isStale,
    refresh,
    forceRefresh,
    clearError,
    refreshStatus,
    cacheStats,
    dataFreshness
  } = useRealTimeData({
    enableAutoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    staleThreshold: 10 * 60 * 1000, // 10 minutes
    enableBackgroundRefresh: true,
    onDataChange: handleDataChange,
    onError: handleDataError,
    onRefreshStart: () => console.log('Dashboard data refresh started'),
    onRefreshComplete: () => console.log('Dashboard data refresh completed')
  });
  
  // Component state (reduced since data management is in useRealTimeData)
  const [state, setState] = useState<DashboardState>({
    aiSummary: null,
    aiLoading: false,
    aiError: null,
    activeSection: 'summary',
    showCacheStats: false
  });

  // Callback functions for real-time data hook
  function handleDataChange(data: AggregatedFamilyData) {
    console.log('Family data updated:', {
      todos: data.todos.totalCount,
      events: data.events.totalCount,
      groceries: data.groceries.totalCount
    });
    
    // Generate new AI summary when data changes
    if (isHealthy && data) {
      generateAISummary(data);
    }
  }
  
  function handleDataError(error: Error) {
    console.error('Real-time data error:', error);
    setState(prev => ({ ...prev, aiError: error.message }));
  }
  
  // Generate AI summary
  const generateAISummary = useCallback(async (data: AggregatedFamilyData) => {
    if (!isHealthy || !data) return;
    
    setState(prev => ({ ...prev, aiLoading: true, aiError: null }));
    
    try {
      const aiSummary = await generateSummary(data);
      setState(prev => ({
        ...prev,
        aiSummary,
        aiLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI summary';
      setState(prev => ({
        ...prev,
        aiLoading: false,
        aiError: errorMessage
      }));
    }
  }, [isHealthy, generateSummary]);

  // Ensure AI service is initialized on component mount
  useEffect(() => {
    const ensureAIService = async () => {
      try {
        console.log('🤖 Ensuring AI Service is initialized for Dashboard...');
        await initializeAIService();
        console.log('✅ AI Service ready for Dashboard');
      } catch (error) {
        console.error('❌ Failed to initialize AI Service for Dashboard:', error);
      }
    };
    
    ensureAIService();
  }, []);

  // Generate AI summary when family data is available and AI is healthy
  useEffect(() => {
    if (familyData && isHealthy && !state.aiSummary) {
      generateAISummary(familyData);
    }
  }, [familyData, isHealthy, state.aiSummary, generateAISummary]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);
  
  // Handle force refresh (bypass cache)
  const handleForceRefresh = useCallback(() => {
    forceRefresh();
  }, [forceRefresh]);
  
  // Clear errors
  const handleClearError = useCallback(() => {
    clearError();
    setState(prev => ({ ...prev, aiError: null }));
  }, [clearError]);
  
  // Toggle cache stats display
  const toggleCacheStats = useCallback(() => {
    setState(prev => ({ ...prev, showCacheStats: !prev.showCacheStats }));
  }, []);

  // Handle section change
  const handleSectionChange = (section: DashboardSection) => {
    setState(prev => ({ ...prev, activeSection: section }));
  };

  // Render status indicator
  const renderStatusIndicator = () => (
    <div className="status-indicator">
      <div className={`status-dot ${isDataRefreshing ? 'refreshing' : 'idle'}`}></div>
      <span className="status-text">
        {isDataRefreshing ? t('dashboard.refreshing') : t('dashboard.ready')}
      </span>
      {lastRefresh && (
        <span className="last-refresh">
          {t('dashboard.lastRefresh')}: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  );

  // Render cache statistics
  const renderCacheStats = () => {
    if (!state.showCacheStats || !cacheStats) return null;

    return (
      <div className="cache-stats-panel">
        <div className="cache-stats-header">
          <h3>{t('dashboard.cacheStats')}</h3>
          <Button 
            variant="ghost" 
            size="small" 
            onClick={toggleCacheStats}
          >
            ✕
          </Button>
        </div>
        <div className="cache-stats-grid">
          <div className="cache-stat">
            <span className="stat-label">{t('dashboard.cacheHits')}</span>
            <span className="stat-value">{cacheStats.hits || 0}</span>
          </div>
          <div className="cache-stat">
            <span className="stat-label">{t('dashboard.cacheMisses')}</span>
            <span className="stat-value">{cacheStats.misses || 0}</span>
          </div>
          <div className="cache-stat">
            <span className="stat-label">{t('dashboard.cacheSize')}</span>
            <span className="stat-value">{cacheStats.size || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  // Compute combined loading and error states
  const isLoading = dataLoading || globalAiLoading;
  const combinedError = dataError || globalAiError || state.aiError;
  const isDataRefreshing = isRefreshing || state.aiLoading;
  
  // Render loading state
  if (isLoading) {
    return (
      <div className={`ai-dashboard ${className}`}>
        <LoadingState 
          message={t('dashboard.loading')} 
        />
      </div>
    );
  }

  // Render error state
  if (combinedError && !familyData) {
    return (
      <div className={`ai-dashboard ${className}`}>
        <ErrorMessage 
          message={combinedError}
          onRetry={handleClearError}
        />
      </div>
    );
  }

  // Render dashboard sections
  const renderContent = () => {
    const aiSummary = state.aiSummary;
    
    switch (state.activeSection) {
      case 'summary':
        return (
          <div className="dashboard-summary">
            {aiSummary && (
              <div className="ai-content">
                <div className="ai-response">{aiSummary.content}</div>
                <div className="ai-metadata">
                  <span className="confidence">
                    {t('dashboard.confidence')}: {Math.round((aiSummary.confidence || 0) * 100)}%
                  </span>
                  <span className="model">{aiSummary.model}</span>
                </div>
              </div>
            )}
            
            {/* Smart Cards for visual insights */}
            {familyData && (
              <SmartCards 
                familyData={familyData} 
                aiResponse={aiSummary}
                className="dashboard-smart-cards"
              />
            )}
          </div>
        );
      
      case 'insights':
        return (
          <div className="dashboard-insights">
            <h3>{t('dashboard.insights.title')}</h3>
            {aiSummary?.metadata?.suggestions && aiSummary.metadata.suggestions.length > 0 ? (
              <ul className="insights-list">
                {aiSummary.metadata.suggestions.map((suggestion, index) => (
                  <li key={index} className="insight-item">
                    <span className="insight-icon">💡</span>
                    <span className="insight-text">{suggestion.description}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-insights">{t('dashboard.insights.none')}</p>
            )}
          </div>
        );
      
      case 'alerts':
        return (
          <div className="dashboard-alerts">
            {familyData && (
              <SmartAlerts 
                familyData={familyData}
                className="dashboard-smart-alerts"
                maxDisplayAlerts={15}
                enableActions={true}
              />
            )}
          </div>
        );
      
      case 'analytics':
        return (
          <div className="dashboard-analytics">
            {familyData && (
              <AnalyticsPanel 
                familyData={familyData}
                className="dashboard-analytics-panel"
                period="weekly"
                showDetailedView={true}
              />
            )}
          </div>
        );
      
      case 'recommendations':
        return (
          <div className="dashboard-recommendations">
            {familyData && (
              <SmartRecommendations 
                familyData={familyData}
                className="dashboard-smart-recommendations"
                maxDisplayRecommendations={12}
                enableActions={true}
              />
            )}
          </div>
        );
      
      case 'chat':
        return (
          <div className="dashboard-chat">
            {familyData && (
              <ChatInterface 
                familyData={familyData}
                className="dashboard-chat-interface"
              />
            )}
          </div>
        );
      
      case 'goals':
        return (
          <div className="dashboard-goals">
            {familyData && (
              <GoalTracker 
                familyData={familyData}
                className="dashboard-goal-tracker"
              />
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`ai-dashboard ${className}`}>
      {/* Dashboard Header with Real-time Status */}
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        {renderStatusIndicator()}
      </div>
      
      {/* Cache Statistics Panel */}
      {renderCacheStats()}
      
      {/* Error Messages */}
      {combinedError && familyData && (
        <div className="error-banner">
          <ErrorMessage 
            message={combinedError}
            onRetry={handleClearError}
            severity="warning"
          />
        </div>
      )}

      {/* Section Navigation */}
      <div className="dashboard-nav">
        <button
          className={`nav-button ${state.activeSection === 'summary' ? 'active' : ''}`}
          onClick={() => handleSectionChange('summary')}
        >
          {t('dashboard.nav.summary')}
        </button>
        <button
          className={`nav-button ${state.activeSection === 'insights' ? 'active' : ''}`}
          onClick={() => handleSectionChange('insights')}
        >
          {t('dashboard.nav.insights')}
        </button>
        <button
          className={`nav-button ${state.activeSection === 'alerts' ? 'active' : ''}`}
          onClick={() => handleSectionChange('alerts')}
        >
          {t('dashboard.nav.alerts')}
        </button>
        <button
          className={`nav-button ${state.activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => handleSectionChange('analytics')}
        >
          {t('dashboard.nav.analytics')}
        </button>
        <button
          className={`nav-button ${state.activeSection === 'recommendations' ? 'active' : ''}`}
          onClick={() => handleSectionChange('recommendations')}
        >
          {t('dashboard.nav.recommendations')}
        </button>
        <button
          className={`nav-button ${state.activeSection === 'chat' ? 'active' : ''}`}
          onClick={() => handleSectionChange('chat')}
        >
          {t('dashboard.nav.chat')}
        </button>
        <button
          className={`nav-button ${state.activeSection === 'goals' ? 'active' : ''}`}
          onClick={() => handleSectionChange('goals')}
        >
          {t('dashboard.nav.goals')}
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {renderContent()}
      </div>

      {/* AI Status Indicator */}
      {!isHealthy && (
        <div className="ai-status-warning">
          <span className="warning-icon">⚠️</span>
          <span>{t('dashboard.ai.limited')}</span>
        </div>
      )}
    </div>
  );
};

// Export component
export default AIDashboard;
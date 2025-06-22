// AI-powered Dashboard component with real-time family insights and intelligent caching
import React, { useEffect, useState, useCallback } from 'react';
import { useAI } from '../../hooks/useAI';
import { useI18n } from '../../hooks/useI18n';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import type { AggregatedFamilyData, AIResponse } from '@famapp/shared';
import { LoadingState } from '../ui/LoadingState';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SmartCards } from './SmartCards';
import { ChatInterface } from './ChatInterface';
import { SmartAlerts } from './SmartAlerts';
import './AIDashboard.css';

// Component props
interface AIDashboardProps {
  className?: string;
}

// Dashboard sections
type DashboardSection = 'summary' | 'insights' | 'alerts' | 'recommendations' | 'chat';

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
  if (state.error || (!isHealthy && !state.aiSummary)) {
    return (
      <div className={`ai-dashboard ${className}`}>
        <ErrorMessage 
          message={state.error || aiError || t('dashboard.ai.unavailable')}
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
      
      case 'recommendations':
        return (
          <div className="dashboard-recommendations">
            <h3>{t('dashboard.recommendations.title')}</h3>
            {familyData?.summary?.recommendations && familyData.summary.recommendations.length > 0 ? (
              <div className="recommendations-grid">
                {familyData.summary.recommendations.map((rec, index) => (
                  <Card key={index} className="recommendation-card">
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                    {rec.estimatedImpact && (
                      <div className="recommendation-impact">
                        <span className="impact-label">{t('dashboard.impact')}:</span>
                        <span className="impact-value">{rec.estimatedImpact}</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="no-recommendations">{t('dashboard.recommendations.none')}</p>
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
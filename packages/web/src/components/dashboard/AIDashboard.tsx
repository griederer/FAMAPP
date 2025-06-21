// AI-powered Dashboard component with real-time family insights
import React, { useEffect, useState } from 'react';
import { useAI } from '../../hooks/useAI';
import { useI18n } from '../../hooks/useI18n';
import { DataAggregationService, type AggregatedFamilyData, type AIResponse } from '@famapp/shared';
import { LoadingState } from '../ui/LoadingState';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SmartCards } from './SmartCards';
import { ChatInterface } from './ChatInterface';
import './AIDashboard.css';

// Component props
interface AIDashboardProps {
  className?: string;
}

// Dashboard sections
type DashboardSection = 'summary' | 'insights' | 'alerts' | 'recommendations' | 'chat';

// Component state interface
interface DashboardState {
  familyData: AggregatedFamilyData | null;
  aiSummary: AIResponse | null;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  activeSection: DashboardSection;
}

// AI Dashboard component with loading states
export const AIDashboard: React.FC<AIDashboardProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const { generateSummary, isHealthy, isLoading: aiLoading, error: aiError } = useAI();
  
  // Component state
  const [state, setState] = useState<DashboardState>({
    familyData: null,
    aiSummary: null,
    loading: true,
    error: null,
    lastRefresh: null,
    activeSection: 'summary'
  });

  // Load family data and generate AI summary
  const loadDashboardData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Aggregate family data
      const dataAggregationService = new DataAggregationService();
      const familyData = await dataAggregationService.aggregateFamilyData();
      
      // Generate AI summary if service is healthy
      let aiSummary: AIResponse | null = null;
      if (isHealthy) {
        aiSummary = await generateSummary(familyData);
      }
      
      setState(prev => ({
        ...prev,
        familyData,
        aiSummary,
        loading: false,
        lastRefresh: new Date(),
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [isHealthy]); // Re-load if AI health status changes

  // Handle refresh
  const handleRefresh = () => {
    loadDashboardData();
  };

  // Handle section change
  const handleSectionChange = (section: DashboardSection) => {
    setState(prev => ({ ...prev, activeSection: section }));
  };

  // Render loading state
  if (state.loading || aiLoading) {
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
    const { familyData, aiSummary } = state;
    
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
            <h3>{t('dashboard.alerts.title')}</h3>
            {/* Alerts could be derived from AI response content or family data */}
            <p className="no-alerts">{t('dashboard.alerts.none')}</p>
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
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <div className="dashboard-actions">
          {state.lastRefresh && (
            <span className="last-refresh">
              {t('dashboard.lastRefresh')}: {state.lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={handleRefresh}
            variant="secondary"
            disabled={state.loading}
          >
            {t('dashboard.refresh')}
          </Button>
        </div>
      </div>

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
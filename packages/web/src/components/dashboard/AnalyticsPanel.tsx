// Analytics Panel Component for Family Insights
import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { AggregatedFamilyData } from '@famapp/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingState } from '../ui/LoadingState';
import { ErrorMessage } from '../ui/ErrorMessage';
import './AnalyticsPanel.css';

// Simplified analytics interfaces for component use
interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'percentage' | 'number' | 'decimal';
}

interface AnalyticsInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface AnalyticsPanelProps {
  familyData: AggregatedFamilyData;
  className?: string;
  period?: 'daily' | 'weekly' | 'monthly';
  showDetailedView?: boolean;
}

// Analytics calculation helper functions
const calculateProductivityMetrics = (data: AggregatedFamilyData): AnalyticsMetric[] => {
  const completionRate = data.todos.completionRate;
  const overdueRate = data.todos.overdue.length / Math.max(data.todos.totalCount, 1);
  const taskVelocity = data.todos.completedRecent.length;
  const avgTasksPerMember = data.todos.totalCount / Math.max(data.familyMembers.length, 1);

  return [
    {
      label: 'Completion Rate',
      value: completionRate * 100,
      change: data.summary.weeklyTrends.todoCompletion.change * 100,
      trend: data.summary.weeklyTrends.todoCompletion.trend,
      format: 'percentage'
    },
    {
      label: 'Overdue Tasks',
      value: overdueRate * 100,
      change: -5, // Mock previous period comparison
      trend: overdueRate > 0.2 ? 'up' : 'down',
      format: 'percentage'
    },
    {
      label: 'Task Velocity',
      value: taskVelocity,
      change: 2, // Mock change
      trend: taskVelocity > 5 ? 'up' : 'stable',
      format: 'number'
    },
    {
      label: 'Tasks per Member',
      value: avgTasksPerMember,
      change: 0.5, // Mock change
      trend: 'stable',
      format: 'decimal'
    }
  ];
};

const generateInsights = (data: AggregatedFamilyData): AnalyticsInsight[] => {
  const insights: AnalyticsInsight[] = [];

  // Productivity insights
  if (data.todos.completionRate > 0.8) {
    insights.push({
      type: 'success',
      title: 'Excellent Productivity',
      description: `Family completion rate of ${Math.round(data.todos.completionRate * 100)}% is outstanding!`,
      actionable: false,
      priority: 'low'
    });
  } else if (data.todos.completionRate < 0.5) {
    insights.push({
      type: 'warning',
      title: 'Low Completion Rate',
      description: `Only ${Math.round(data.todos.completionRate * 100)}% of tasks are being completed. Consider reviewing task assignments.`,
      actionable: true,
      priority: 'high'
    });
  }

  // Overdue task insights
  if (data.todos.overdue.length > 5) {
    insights.push({
      type: 'error',
      title: 'Too Many Overdue Tasks',
      description: `${data.todos.overdue.length} tasks are overdue. This may be causing stress for family members.`,
      actionable: true,
      priority: 'high'
    });
  }

  // Event planning insights
  if (data.events.totalCount === 0) {
    insights.push({
      type: 'info',
      title: 'No Upcoming Events',
      description: 'Consider planning some family activities or important appointments.',
      actionable: true,
      priority: 'medium'
    });
  }

  // Grocery management insights
  if (data.groceries.urgentItems.length > 3) {
    insights.push({
      type: 'warning',
      title: 'Multiple Urgent Items',
      description: `${data.groceries.urgentItems.length} grocery items are marked as urgent. Plan a shopping trip soon.`,
      actionable: true,
      priority: 'medium'
    });
  }

  // Family health insights
  const healthScore = data.summary.healthScore;
  if (healthScore > 80) {
    insights.push({
      type: 'success',
      title: 'Great Family Organization',
      description: `Health score of ${healthScore}/100 shows excellent organization!`,
      actionable: false,
      priority: 'low'
    });
  } else if (healthScore < 60) {
    insights.push({
      type: 'warning',
      title: 'Organization Needs Attention',
      description: `Health score of ${healthScore}/100 suggests room for improvement in family coordination.`,
      actionable: true,
      priority: 'high'
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

const calculateMemberPerformance = (data: AggregatedFamilyData) => {
  return data.todos.memberStats.map(stat => ({
    member: stat.member.name,
    completionRate: stat.completionRate,
    pendingTasks: stat.pendingTodos,
    overdueTasks: stat.overdueTodos,
    productivity: stat.productivity,
    score: Math.round(stat.completionRate * 100)
  }));
};

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  familyData,
  className = '',
  period = 'weekly',
  showDetailedView = false
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'members'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate analytics data
  const [analytics, setAnalytics] = useState<{
    metrics: AnalyticsMetric[];
    insights: AnalyticsInsight[];
    memberPerformance: any[];
  } | null>(null);

  const calculateAnalytics = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      const metrics = calculateProductivityMetrics(familyData);
      const insights = generateInsights(familyData);
      const memberPerformance = calculateMemberPerformance(familyData);

      setAnalytics({
        metrics,
        insights,
        memberPerformance
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate analytics');
    } finally {
      setIsLoading(false);
    }
  }, [familyData]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  const formatMetricValue = (metric: AnalyticsMetric): string => {
    switch (metric.format) {
      case 'percentage':
        return `${metric.value.toFixed(1)}%`;
      case 'decimal':
        return metric.value.toFixed(1);
      case 'number':
      default:
        return Math.round(metric.value).toString();
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
      default:
        return '→';
    }
  };

  const getInsightIcon = (type: string): string => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  if (isLoading) {
    return (
      <div className={`analytics-panel ${className}`}>
        <LoadingState message={t('analytics.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`analytics-panel ${className}`}>
        <ErrorMessage message={error} onRetry={calculateAnalytics} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`analytics-panel ${className}`}>
        <div className="no-data">
          <p>{t('analytics.noData')}</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="analytics-overview">
      <div className="metrics-grid">
        {analytics.metrics.map((metric, index) => (
          <Card key={index} className="metric-card">
            <div className="metric-header">
              <h4 className="metric-label">{metric.label}</h4>
              <span className="metric-trend">
                {getTrendIcon(metric.trend)}
              </span>
            </div>
            <div className="metric-value">
              {formatMetricValue(metric)}
            </div>
            <div className={`metric-change ${metric.trend}`}>
              {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}
              {metric.format === 'percentage' ? 'pp' : ''}
            </div>
          </Card>
        ))}
      </div>

      {/* Key Performance Indicators */}
      <Card className="kpi-card">
        <h3>{t('analytics.keyMetrics')}</h3>
        <div className="kpi-grid">
          <div className="kpi-item">
            <span className="kpi-label">{t('analytics.healthScore')}</span>
            <span className="kpi-value">{familyData.summary.healthScore}/100</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">{t('analytics.activeTasks')}</span>
            <span className="kpi-value">{familyData.summary.totalActiveTasks}</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">{t('analytics.urgentItems')}</span>
            <span className="kpi-value">{familyData.summary.urgentItemsCount}</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderInsights = () => (
    <div className="analytics-insights">
      {analytics.insights.length === 0 ? (
        <Card className="no-insights">
          <p>{t('analytics.noInsights')}</p>
        </Card>
      ) : (
        <div className="insights-list">
          {analytics.insights.map((insight, index) => (
            <Card key={index} className={`insight-card insight-${insight.type}`}>
              <div className="insight-header">
                <span className="insight-icon">{getInsightIcon(insight.type)}</span>
                <h4 className="insight-title">{insight.title}</h4>
                <span className={`insight-priority priority-${insight.priority}`}>
                  {insight.priority}
                </span>
              </div>
              <p className="insight-description">{insight.description}</p>
              {insight.actionable && (
                <div className="insight-actions">
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => console.log('Take action for:', insight.title)}
                  >
                    {t('analytics.takeAction')}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderMemberPerformance = () => (
    <div className="member-performance">
      {analytics.memberPerformance.length === 0 ? (
        <Card className="no-members">
          <p>{t('analytics.noMembers')}</p>
        </Card>
      ) : (
        <div className="members-grid">
          {analytics.memberPerformance.map((member, index) => (
            <Card key={index} className="member-card">
              <div className="member-header">
                <h4 className="member-name">{member.member}</h4>
                <span className={`productivity-badge ${member.productivity}`}>
                  {member.productivity}
                </span>
              </div>
              <div className="member-stats">
                <div className="stat-item">
                  <span className="stat-label">{t('analytics.completionRate')}</span>
                  <span className="stat-value">{member.score}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('analytics.pendingTasks')}</span>
                  <span className="stat-value">{member.pendingTasks}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('analytics.overdueTasks')}</span>
                  <span className="stat-value">{member.overdueTasks}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`analytics-panel ${className}`}>
      {/* Analytics Header */}
      <div className="analytics-header">
        <h2>{t('analytics.title')}</h2>
        <div className="analytics-controls">
          <select 
            value={period} 
            onChange={(e) => console.log('Period changed:', e.target.value)}
            className="period-selector"
          >
            <option value="daily">{t('analytics.daily')}</option>
            <option value="weekly">{t('analytics.weekly')}</option>
            <option value="monthly">{t('analytics.monthly')}</option>
          </select>
          <Button 
            variant="outline" 
            size="small" 
            onClick={calculateAnalytics}
          >
            {t('analytics.refresh')}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t('analytics.overview')}
        </button>
        <button
          className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          {t('analytics.insights')}
        </button>
        <button
          className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          {t('analytics.members')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="analytics-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'members' && renderMemberPerformance()}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
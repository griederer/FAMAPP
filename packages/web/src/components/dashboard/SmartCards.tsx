// SmartCards component for visual insights display
import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { Card } from '../ui/Card';
import type { AggregatedFamilyData, AIResponse } from '@famapp/shared';
import './SmartCards.css';

// Component props
interface SmartCardsProps {
  familyData: AggregatedFamilyData;
  aiResponse?: AIResponse | null;
  className?: string;
}

// Individual card data structure
interface SmartCardData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    label: string;
  };
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
  priority: 'high' | 'medium' | 'low';
}

// SmartCards component
export const SmartCards: React.FC<SmartCardsProps> = ({ 
  familyData, 
  aiResponse, 
  className = '' 
}) => {
  const { t } = useI18n();

  // Calculate trend direction and percentage
  const calculateTrend = (current: number, previous: number): SmartCardData['trend'] => {
    if (previous === 0) return undefined;
    
    const change = ((current - previous) / previous) * 100;
    const direction = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
    
    return {
      direction,
      percentage: Math.abs(change),
      label: change > 0 ? t('smartcards.trend.increase') : t('smartcards.trend.decrease')
    };
  };

  // Generate smart cards from family data
  const generateSmartCards = (): SmartCardData[] => {
    const cards: SmartCardData[] = [];
    const trends = familyData.summary?.weeklyTrends;

    // Task completion card
    cards.push({
      id: 'todos-completion',
      title: t('smartcards.todos.title'),
      value: `${Math.round(familyData.todos.completionRate * 100)}%`,
      subtitle: t('smartcards.todos.subtitle', { 
        pending: familyData.todos.pending.length,
        total: familyData.todos.totalCount
      }),
      trend: trends ? calculateTrend(
        trends.todoCompletion.currentWeek, 
        trends.todoCompletion.previousWeek
      ) : undefined,
      icon: '✅',
      color: familyData.todos.completionRate > 0.7 ? 'success' : 
             familyData.todos.completionRate > 0.4 ? 'warning' : 'error',
      priority: familyData.todos.overdue.length > 0 ? 'high' : 'medium'
    });

    // Overdue tasks card (if any)
    if (familyData.todos.overdue.length > 0) {
      cards.push({
        id: 'todos-overdue',
        title: t('smartcards.overdue.title'),
        value: familyData.todos.overdue.length,
        subtitle: t('smartcards.overdue.subtitle'),
        icon: '⚠️',
        color: 'error',
        priority: 'high'
      });
    }

    // Upcoming events card
    cards.push({
      id: 'events-upcoming',
      title: t('smartcards.events.title'),
      value: familyData.events.thisWeek.length,
      subtitle: t('smartcards.events.subtitle'),
      trend: trends ? calculateTrend(
        trends.eventScheduling.currentWeek,
        trends.eventScheduling.previousWeek
      ) : undefined,
      icon: '📅',
      color: familyData.events.thisWeek.length > 10 ? 'warning' : 'info',
      priority: 'medium'
    });

    // Grocery urgency card
    const urgentGroceries = familyData.groceries.urgentItems.length;
    if (urgentGroceries > 0) {
      cards.push({
        id: 'groceries-urgent',
        title: t('smartcards.groceries.title'),
        value: urgentGroceries,
        subtitle: t('smartcards.groceries.subtitle'),
        icon: '🛒',
        color: urgentGroceries > 5 ? 'error' : 'warning',
        priority: urgentGroceries > 5 ? 'high' : 'medium'
      });
    }

    // Family health score card
    if (familyData.summary?.healthScore) {
      cards.push({
        id: 'health-score',
        title: t('smartcards.health.title'),
        value: `${familyData.summary.healthScore}%`,
        subtitle: t('smartcards.health.subtitle'),
        icon: '💚',
        color: familyData.summary.healthScore > 80 ? 'success' :
               familyData.summary.healthScore > 60 ? 'warning' : 'error',
        priority: familyData.summary.healthScore < 60 ? 'high' : 'low'
      });
    }

    // Productivity card based on member stats
    const avgProductivity = familyData.todos.memberStats.reduce((acc, member) => 
      acc + (member.completionRate || 0), 0) / (familyData.todos.memberStats.length || 1);
    
    if (familyData.todos.memberStats.length > 0) {
      cards.push({
        id: 'productivity',
        title: t('smartcards.productivity.title'),
        value: `${Math.round(avgProductivity * 100)}%`,
        subtitle: t('smartcards.productivity.subtitle'),
        icon: '⚡',
        color: avgProductivity > 0.8 ? 'success' : 
               avgProductivity > 0.6 ? 'primary' : 'warning',
        priority: 'low'
      });
    }

    // Document activity card
    if (familyData.documents.recent.length > 0) {
      cards.push({
        id: 'documents',
        title: t('smartcards.documents.title'),
        value: familyData.documents.recent.length,
        subtitle: t('smartcards.documents.subtitle'),
        trend: trends ? calculateTrend(
          trends.documentActivity.currentWeek,
          trends.documentActivity.previousWeek
        ) : undefined,
        icon: '📄',
        color: 'info',
        priority: 'low'
      });
    }

    // Sort by priority: high > medium > low
    return cards.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Render trend indicator
  const renderTrend = (trend: SmartCardData['trend']) => {
    if (!trend) return null;

    const trendIcon = trend.direction === 'up' ? '↗️' : 
                     trend.direction === 'down' ? '↘️' : '➡️';
    const trendColor = trend.direction === 'up' ? 'trend-up' : 
                      trend.direction === 'down' ? 'trend-down' : 'trend-stable';

    return (
      <div className={`trend-indicator ${trendColor}`}>
        <span className="trend-icon">{trendIcon}</span>
        <span className="trend-percentage">{trend.percentage.toFixed(1)}%</span>
        <span className="trend-label">{trend.label}</span>
      </div>
    );
  };

  // Render individual smart card
  const renderCard = (card: SmartCardData) => (
    <Card 
      key={card.id} 
      className={`smart-card smart-card--${card.color} smart-card--${card.priority}`}
      data-testid={`smart-card-${card.id}`}
    >
      <div className="smart-card__header">
        <div className="smart-card__icon">{card.icon}</div>
        <div className="smart-card__priority">
          {card.priority === 'high' && <span className="priority-badge priority-high">!</span>}
        </div>
      </div>
      
      <div className="smart-card__content">
        <h3 className="smart-card__title">{card.title}</h3>
        <div className="smart-card__value" data-testid={`card-value-${card.id}`}>{card.value}</div>
        {card.subtitle && (
          <p className="smart-card__subtitle">{card.subtitle}</p>
        )}
        {renderTrend(card.trend)}
      </div>
    </Card>
  );

  // Generate and render cards
  const smartCards = generateSmartCards();

  // Check if we should show empty state (no meaningful data)
  const hasNoMeaningfulData = familyData.todos.totalCount === 0 && 
                             familyData.events.totalCount === 0 && 
                             familyData.groceries.totalCount === 0 && 
                             familyData.documents.totalCount === 0;

  // If no meaningful data to display
  if (hasNoMeaningfulData) {
    return (
      <div className={`smart-cards-empty ${className}`}>
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>{t('smartcards.empty.title')}</h3>
          <p>{t('smartcards.empty.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`smart-cards ${className}`}>
      <div className="smart-cards__header">
        <h2>{t('smartcards.title')}</h2>
        <p className="smart-cards__subtitle">{t('smartcards.subtitle')}</p>
      </div>
      
      <div className="smart-cards__grid">
        {smartCards.map(renderCard)}
      </div>
      
      {aiResponse && aiResponse.metadata?.suggestions && aiResponse.metadata.suggestions.length > 0 && (
        <div className="smart-cards__ai-insights" data-testid="ai-suggestions-section">
          <h3>{t('smartcards.ai.title')}</h3>
          <div className="ai-insights-content">
            {aiResponse.metadata.suggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} className="ai-suggestion">
                <span className="suggestion-icon">💡</span>
                <span className="suggestion-text">{suggestion.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="smart-cards__footer">
        <p className="update-time">
          {t('smartcards.lastUpdated')}: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

// Export component and types
export default SmartCards;
export type { SmartCardsProps, SmartCardData };
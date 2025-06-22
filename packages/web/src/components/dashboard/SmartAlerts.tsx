// Smart Alerts Component for AI Dashboard
import React, { useState, useEffect, useCallback } from 'react';
import { getSmartAlertsService, type SmartAlert, type AlertAction, type AlertCategory, type AlertPriority } from '@famapp/shared';
import { useI18n } from '../../hooks/useI18n';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './SmartAlerts.css';

// Component props
interface SmartAlertsProps {
  className?: string;
  familyData?: any; // AggregatedFamilyData
  maxDisplayAlerts?: number;
  showOnlyUnread?: boolean;
  enableActions?: boolean;
}

// Alert display mode
type AlertDisplayMode = 'all' | 'unread' | 'critical' | 'category';

// Smart Alerts Component
export const SmartAlerts: React.FC<SmartAlertsProps> = ({ 
  className = '',
  familyData,
  maxDisplayAlerts = 10,
  showOnlyUnread = false,
  enableActions = true
}) => {
  const { t } = useI18n();
  const alertsService = getSmartAlertsService();
  
  // Component state
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<AlertDisplayMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory>('overdue_task');
  const [unreadCount, setUnreadCount] = useState(0);

  // Load alerts
  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate fresh alerts if we have family data
      if (familyData) {
        await alertsService.generateAlerts(familyData);
      }

      // Get alerts based on display mode
      let alertsToShow: SmartAlert[] = [];
      
      switch (displayMode) {
        case 'all':
          alertsToShow = alertsService.getActiveAlerts();
          break;
        case 'unread':
          alertsToShow = alertsService.getActiveAlerts().filter(a => !a.isRead);
          break;
        case 'critical':
          alertsToShow = alertsService.getCriticalAlerts();
          break;
        case 'category':
          alertsToShow = alertsService.getAlertsByCategory(selectedCategory);
          break;
      }

      // Apply show only unread filter
      if (showOnlyUnread) {
        alertsToShow = alertsToShow.filter(a => !a.isRead);
      }

      // Limit number of alerts
      alertsToShow = alertsToShow.slice(0, maxDisplayAlerts);

      setAlerts(alertsToShow);
      setUnreadCount(alertsService.getUnreadCount());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [familyData, displayMode, selectedCategory, showOnlyUnread, maxDisplayAlerts, alertsService]);

  // Load alerts on mount and data changes
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Handle alert actions
  const handleAlertAction = useCallback(async (alert: SmartAlert, action: AlertAction) => {
    try {
      // Mark as read when action is taken
      alertsService.markAsRead(alert.id);

      // Handle different action types
      switch (action.type) {
        case 'complete':
          if (action.targetId && action.targetType === 'todo') {
            // TODO: Integrate with todo service to complete task
            console.log('Complete todo:', action.targetId);
          }
          break;
          
        case 'navigate':
          // TODO: Navigate to relevant section
          console.log('Navigate:', action.targetType);
          break;
          
        case 'reschedule':
          if (action.targetId && action.targetType === 'event') {
            // TODO: Open reschedule dialog
            console.log('Reschedule event:', action.targetId);
          }
          break;
          
        case 'assign':
          if (action.targetId) {
            // TODO: Open assignment dialog
            console.log('Assign:', action.targetId);
          }
          break;
          
        case 'custom':
          // Handle custom actions based on metadata
          console.log('Custom action:', action.metadata);
          break;
      }

      // Reload alerts to reflect changes
      await loadAlerts();
    } catch (err) {
      console.error('Failed to handle alert action:', err);
    }
  }, [alertsService, loadAlerts]);

  // Mark alert as read
  const handleMarkAsRead = useCallback((alertId: string) => {
    alertsService.markAsRead(alertId);
    loadAlerts();
  }, [alertsService, loadAlerts]);

  // Dismiss alert
  const handleDismissAlert = useCallback((alertId: string) => {
    alertsService.dismissAlert(alertId);
    loadAlerts();
  }, [alertsService, loadAlerts]);

  // Clear all alerts
  const handleClearAll = useCallback(() => {
    alertsService.clearAllAlerts();
    loadAlerts();
  }, [alertsService, loadAlerts]);

  // Get alert icon based on category and priority
  const getAlertIcon = (category: AlertCategory, priority: AlertPriority): string => {
    const categoryIcons = {
      overdue_task: '⏰',
      upcoming_deadline: '📅',
      schedule_conflict: '⚠️',
      grocery_urgent: '🛒',
      productivity_insight: '📊',
      family_coordination: '👥',
      budget_warning: '💰',
      health_reminder: '🏥',
      achievement: '🎉',
      trend_alert: '📈'
    };

    const priorityModifiers = {
      critical: '🚨',
      high: '❗',
      medium: '',
      low: ''
    };

    const baseIcon = categoryIcons[category] || '📋';
    const modifier = priorityModifiers[priority];
    
    return modifier ? `${modifier} ${baseIcon}` : baseIcon;
  };

  // Get alert priority class
  const getPriorityClass = (priority: AlertPriority): string => {
    return `alert-${priority}`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`smart-alerts loading ${className}`}>
        <div className="alerts-header">
          <h3>{t('alerts.title')}</h3>
        </div>
        <div className="alerts-loading">
          <div className="loading-spinner"></div>
          <span>{t('alerts.loading')}</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`smart-alerts error ${className}`}>
        <div className="alerts-header">
          <h3>{t('alerts.title')}</h3>
        </div>
        <div className="alerts-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <Button onClick={loadAlerts} variant="secondary" size="sm">
            {t('alerts.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`smart-alerts ${className}`}>
      {/* Alerts Header */}
      <div className="alerts-header">
        <h3>{t('alerts.title')}</h3>
        <div className="alerts-controls">
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
          
          {/* Display Mode Toggle */}
          <div className="display-mode-toggle">
            <button
              className={displayMode === 'all' ? 'active' : ''}
              onClick={() => setDisplayMode('all')}
            >
              {t('alerts.modes.all')}
            </button>
            <button
              className={displayMode === 'unread' ? 'active' : ''}
              onClick={() => setDisplayMode('unread')}
            >
              {t('alerts.modes.unread')} ({unreadCount})
            </button>
            <button
              className={displayMode === 'critical' ? 'active' : ''}
              onClick={() => setDisplayMode('critical')}
            >
              {t('alerts.modes.critical')}
            </button>
          </div>

          {/* Clear All Button */}
          {alerts.length > 0 && (
            <Button
              onClick={handleClearAll}
              variant="secondary"
              size="sm"
              className="clear-all-button"
            >
              {t('alerts.clearAll')}
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter (when in category mode) */}
      {displayMode === 'category' && (
        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as AlertCategory)}
            className="category-select"
          >
            <option value="overdue_task">{t('alerts.categories.overdue_task')}</option>
            <option value="upcoming_deadline">{t('alerts.categories.upcoming_deadline')}</option>
            <option value="schedule_conflict">{t('alerts.categories.schedule_conflict')}</option>
            <option value="grocery_urgent">{t('alerts.categories.grocery_urgent')}</option>
            <option value="productivity_insight">{t('alerts.categories.productivity_insight')}</option>
            <option value="family_coordination">{t('alerts.categories.family_coordination')}</option>
            <option value="budget_warning">{t('alerts.categories.budget_warning')}</option>
            <option value="health_reminder">{t('alerts.categories.health_reminder')}</option>
            <option value="achievement">{t('alerts.categories.achievement')}</option>
            <option value="trend_alert">{t('alerts.categories.trend_alert')}</option>
          </select>
        </div>
      )}

      {/* Alerts List */}
      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">✅</div>
            <h4>{t('alerts.noAlerts.title')}</h4>
            <p>{t('alerts.noAlerts.description')}</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`alert-card ${getPriorityClass(alert.priority)} ${!alert.isRead ? 'unread' : ''}`}
            >
              <div className="alert-content">
                <div className="alert-header">
                  <div className="alert-icon">
                    {getAlertIcon(alert.category, alert.priority)}
                  </div>
                  <div className="alert-info">
                    <h4 className="alert-title">{alert.title}</h4>
                    <div className="alert-meta">
                      <span className="alert-time">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="alert-priority">
                        {t(`alerts.priority.${alert.priority}`)}
                      </span>
                      {alert.metadata.source && (
                        <span className="alert-source">
                          {alert.metadata.source === 'ai' ? '🤖' : '📋'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="alert-controls">
                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="mark-read-button"
                        title={t('alerts.markAsRead')}
                      >
                        👁️
                      </button>
                    )}
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="dismiss-button"
                      title={t('alerts.dismiss')}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="alert-message">
                  {alert.message}
                </div>

                {/* AI Insight */}
                {alert.metadata.aiInsight && alert.metadata.aiInsight !== alert.message && (
                  <div className="alert-insight">
                    <span className="insight-label">💡 {t('alerts.aiInsight')}:</span>
                    <span className="insight-text">{alert.metadata.aiInsight}</span>
                  </div>
                )}

                {/* Affected Members */}
                {alert.affectedMembers.length > 0 && (
                  <div className="alert-members">
                    <span className="members-label">{t('alerts.affectedMembers')}:</span>
                    <div className="members-list">
                      {alert.affectedMembers.map((member, index) => (
                        <span key={index} className="member-badge">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alert Actions */}
                {enableActions && alert.actions.length > 0 && (
                  <div className="alert-actions">
                    {alert.actions.map((action) => (
                      <Button
                        key={action.id}
                        onClick={() => handleAlertAction(alert, action)}
                        variant="primary"
                        size="sm"
                        className="alert-action-button"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Confidence Score (for AI alerts) */}
                {alert.metadata.source === 'ai' && alert.metadata.confidence && (
                  <div className="alert-confidence">
                    <span className="confidence-label">{t('alerts.confidence')}:</span>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ width: `${alert.metadata.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="confidence-value">
                      {Math.round(alert.metadata.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Show More Button */}
      {alerts.length === maxDisplayAlerts && (
        <div className="alerts-footer">
          <Button
            onClick={() => setDisplayMode('all')}
            variant="secondary"
            className="show-more-button"
          >
            {t('alerts.showMore')}
          </Button>
        </div>
      )}
    </div>
  );
};

// Export component
export default SmartAlerts;
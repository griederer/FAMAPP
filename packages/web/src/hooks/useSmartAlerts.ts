// React hook for Smart Alerts management
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getSmartAlertsService, 
  type SmartAlert, 
  type AlertCategory, 
  type AlertPriority,
  type SmartAlertsService 
} from '@famapp/shared';
import type { AggregatedFamilyData } from '@famapp/shared';

// Hook configuration
interface UseSmartAlertsConfig {
  enableAutoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  enableNotifications?: boolean;
  maxAlerts?: number;
  filterCategories?: AlertCategory[];
  filterPriorities?: AlertPriority[];
  onNewAlert?: (alert: SmartAlert) => void;
  onCriticalAlert?: (alert: SmartAlert) => void;
}

// Hook return type
interface UseSmartAlertsReturn {
  // Alerts data
  alerts: SmartAlert[];
  unreadCount: number;
  criticalCount: number;
  
  // Loading states
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  
  // Actions
  generateAlerts: (familyData: AggregatedFamilyData) => Promise<void>;
  refreshAlerts: () => Promise<void>;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Filtering
  getAlertsByCategory: (category: AlertCategory) => SmartAlert[];
  getAlertsByPriority: (priority: AlertPriority) => SmartAlert[];
  getCriticalAlerts: () => SmartAlert[];
  getUnreadAlerts: () => SmartAlert[];
  
  // Configuration
  updateConfig: (config: Partial<UseSmartAlertsConfig>) => void;
}

// Default configuration
const DEFAULT_CONFIG: UseSmartAlertsConfig = {
  enableAutoRefresh: false,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  enableNotifications: true,
  maxAlerts: 50
};

// Custom hook for Smart Alerts management
export function useSmartAlerts(
  familyData?: AggregatedFamilyData,
  config: UseSmartAlertsConfig = {}
): UseSmartAlertsReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const alertsService = useRef<SmartAlertsService>(getSmartAlertsService());
  
  // Component state
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAlertIds, setLastAlertIds] = useState<Set<string>>(new Set());

  // Configuration ref to avoid stale closures
  const configRef = useRef(mergedConfig);
  configRef.current = mergedConfig;

  // Load alerts from service
  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const activeAlerts = alertsService.current.getActiveAlerts();
      
      // Apply filters if configured
      let filteredAlerts = activeAlerts;
      
      if (configRef.current.filterCategories?.length) {
        filteredAlerts = filteredAlerts.filter(alert => 
          configRef.current.filterCategories!.includes(alert.category)
        );
      }
      
      if (configRef.current.filterPriorities?.length) {
        filteredAlerts = filteredAlerts.filter(alert => 
          configRef.current.filterPriorities!.includes(alert.priority)
        );
      }
      
      // Limit number of alerts
      if (configRef.current.maxAlerts) {
        filteredAlerts = filteredAlerts.slice(0, configRef.current.maxAlerts);
      }
      
      // Detect new alerts for notifications
      const currentAlertIds = new Set(filteredAlerts.map(a => a.id));
      const newAlerts = filteredAlerts.filter(alert => !lastAlertIds.has(alert.id));
      
      // Trigger callbacks for new alerts
      newAlerts.forEach(alert => {
        configRef.current.onNewAlert?.(alert);
        
        if (alert.priority === 'critical') {
          configRef.current.onCriticalAlert?.(alert);
        }
        
        // Show browser notification if enabled
        if (configRef.current.enableNotifications && 'Notification' in window) {
          requestNotification(alert);
        }
      });
      
      setAlerts(filteredAlerts);
      setLastAlertIds(currentAlertIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [lastAlertIds]);

  // Generate alerts from family data
  const generateAlerts = useCallback(async (data: AggregatedFamilyData) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      await alertsService.current.generateAlerts(data);
      await loadAlerts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate alerts';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [loadAlerts]);

  // Refresh alerts manually
  const refreshAlerts = useCallback(async () => {
    await loadAlerts();
  }, [loadAlerts]);

  // Mark single alert as read
  const markAsRead = useCallback((alertId: string) => {
    alertsService.current.markAsRead(alertId);
    loadAlerts();
  }, [loadAlerts]);

  // Mark all alerts as read
  const markAllAsRead = useCallback(() => {
    alerts.forEach(alert => {
      if (!alert.isRead) {
        alertsService.current.markAsRead(alert.id);
      }
    });
    loadAlerts();
  }, [alerts, loadAlerts]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    alertsService.current.dismissAlert(alertId);
    loadAlerts();
  }, [loadAlerts]);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    alertsService.current.clearAllAlerts();
    loadAlerts();
  }, [loadAlerts]);

  // Filter helpers
  const getAlertsByCategory = useCallback((category: AlertCategory): SmartAlert[] => {
    return alerts.filter(alert => alert.category === category);
  }, [alerts]);

  const getAlertsByPriority = useCallback((priority: AlertPriority): SmartAlert[] => {
    return alerts.filter(alert => alert.priority === priority);
  }, [alerts]);

  const getCriticalAlerts = useCallback((): SmartAlert[] => {
    return alerts.filter(alert => alert.priority === 'critical');
  }, [alerts]);

  const getUnreadAlerts = useCallback((): SmartAlert[] => {
    return alerts.filter(alert => !alert.isRead);
  }, [alerts]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<UseSmartAlertsConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
  }, []);

  // Computed values
  const unreadCount = alerts.filter(alert => !alert.isRead).length;
  const criticalCount = alerts.filter(alert => alert.priority === 'critical').length;

  // Auto-generate alerts when family data changes
  useEffect(() => {
    if (familyData) {
      generateAlerts(familyData);
    }
  }, [familyData, generateAlerts]);

  // Auto-refresh alerts
  useEffect(() => {
    if (!configRef.current.enableAutoRefresh) return;

    const interval = setInterval(() => {
      if (familyData) {
        generateAlerts(familyData);
      } else {
        loadAlerts();
      }
    }, configRef.current.refreshInterval);

    return () => clearInterval(interval);
  }, [familyData, generateAlerts, loadAlerts]);

  // Initial load
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Browser notification helper
  const requestNotification = useCallback((alert: SmartAlert) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: alert.id,
        requireInteraction: alert.priority === 'critical',
        silent: alert.priority === 'low'
      });

      // Auto-close after 5 seconds for non-critical alerts
      if (alert.priority !== 'critical') {
        setTimeout(() => notification.close(), 5000);
      }

      notification.onclick = () => {
        window.focus();
        markAsRead(alert.id);
        notification.close();
      };
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          requestNotification(alert);
        }
      });
    }
  }, [markAsRead]);

  return {
    // Alerts data
    alerts,
    unreadCount,
    criticalCount,
    
    // Loading states
    isLoading,
    isGenerating,
    error,
    
    // Actions
    generateAlerts,
    refreshAlerts,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    clearAllAlerts,
    
    // Filtering
    getAlertsByCategory,
    getAlertsByPriority,
    getCriticalAlerts,
    getUnreadAlerts,
    
    // Configuration
    updateConfig
  };
}

// Hook for alerts notifications/badge count only (lightweight)
export function useAlertsCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const alertsService = getSmartAlertsService();

  useEffect(() => {
    const updateCounts = () => {
      setUnreadCount(alertsService.getUnreadCount());
      setCriticalCount(alertsService.getCriticalAlerts().length);
    };

    updateCounts();
    
    // Update counts every 30 seconds
    const interval = setInterval(updateCounts, 30000);
    
    return () => clearInterval(interval);
  }, [alertsService]);

  return { unreadCount, criticalCount };
}

// Hook for specific alert category monitoring
export function useCategoryAlerts(category: AlertCategory) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const alertsService = getSmartAlertsService();

  useEffect(() => {
    const updateAlerts = () => {
      setAlerts(alertsService.getAlertsByCategory(category));
    };

    updateAlerts();
    
    // Update every minute for category-specific alerts
    const interval = setInterval(updateAlerts, 60000);
    
    return () => clearInterval(interval);
  }, [category, alertsService]);

  return alerts;
}

// Export types
export type { UseSmartAlertsConfig, UseSmartAlertsReturn };
// AI-powered Smart Alerts Service for proactive family notifications
import { getAIService, type AIService } from './aiService';
import type { AIResponse } from '../types/ai';
import { getDataCacheService } from './dataCacheService';
import type { 
  AggregatedFamilyData, 
  AIRecommendation,
  FamilyMember,
  Todo,
  CalendarEvent,
  GroceryItem
} from '../types';

// Alert types and priorities
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertCategory = 
  | 'overdue_task' 
  | 'upcoming_deadline' 
  | 'schedule_conflict'
  | 'grocery_urgent'
  | 'productivity_insight'
  | 'family_coordination'
  | 'budget_warning'
  | 'health_reminder'
  | 'achievement'
  | 'trend_alert';

// Smart Alert interface
export interface SmartAlert {
  id: string;
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  message: string;
  timestamp: Date;
  expiresAt?: Date;
  affectedMembers: FamilyMember[];
  relatedItems: {
    todos?: string[];
    events?: string[];
    groceries?: string[];
    documents?: string[];
  };
  actions: AlertAction[];
  metadata: {
    confidence: number;
    source: 'ai' | 'rule' | 'pattern';
    triggerReason?: string;
    aiInsight?: string;
  };
  isRead: boolean;
  isDismissed: boolean;
}

// Alert action interface
export interface AlertAction {
  id: string;
  type: 'navigate' | 'complete' | 'reschedule' | 'assign' | 'custom';
  label: string;
  description?: string;
  targetId?: string;
  targetType?: 'todo' | 'event' | 'grocery' | 'member';
  metadata?: Record<string, any>;
}

// Alert rule interface for rule-based alerts
interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  condition: (data: AggregatedFamilyData) => boolean;
  generateAlert: (data: AggregatedFamilyData) => Omit<SmartAlert, 'id' | 'timestamp' | 'isRead' | 'isDismissed'> | null;
  cooldownMinutes?: number; // Prevent duplicate alerts
}

// Alert pattern detection
interface AlertPattern {
  id: string;
  name: string;
  category: AlertCategory;
  detect: (data: AggregatedFamilyData, history: AggregatedFamilyData[]) => boolean;
  generateInsight: (data: AggregatedFamilyData, history: AggregatedFamilyData[]) => string;
}

// Alert service configuration
interface AlertsConfig {
  enableAIAlerts: boolean;
  enableRuleBasedAlerts: boolean;
  enablePatternDetection: boolean;
  alertRetentionDays: number;
  maxAlertsPerCategory: number;
  cooldownDefaults: Record<AlertCategory, number>; // minutes
}

// Smart Alerts Service
export class SmartAlertsService {
  private aiService: AIService;
  private cacheService = getDataCacheService();
  private config: AlertsConfig;
  private alerts: Map<string, SmartAlert> = new Map();
  private lastAlertTimes: Map<string, Date> = new Map();
  private rules: AlertRule[] = [];
  private patterns: AlertPattern[] = [];

  constructor(config: Partial<AlertsConfig> = {}) {
    this.aiService = getAIService();
    this.config = {
      enableAIAlerts: true,
      enableRuleBasedAlerts: true,
      enablePatternDetection: true,
      alertRetentionDays: 7,
      maxAlertsPerCategory: 10,
      cooldownDefaults: {
        overdue_task: 60,
        upcoming_deadline: 120,
        schedule_conflict: 30,
        grocery_urgent: 240,
        productivity_insight: 1440, // 24 hours
        family_coordination: 180,
        budget_warning: 720,
        health_reminder: 360,
        achievement: 1440,
        trend_alert: 720
      },
      ...config
    };

    this.initializeRules();
    this.initializePatterns();
  }

  // Generate smart alerts based on family data
  async generateAlerts(familyData: AggregatedFamilyData): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = [];

    // Generate rule-based alerts
    if (this.config.enableRuleBasedAlerts) {
      const ruleAlerts = this.generateRuleBasedAlerts(familyData);
      alerts.push(...ruleAlerts);
    }

    // Generate AI-powered alerts
    if (this.config.enableAIAlerts) {
      const aiAlerts = await this.generateAIAlerts(familyData);
      alerts.push(...aiAlerts);
    }

    // Pattern detection alerts (requires historical data)
    if (this.config.enablePatternDetection) {
      const patternAlerts = await this.generatePatternAlerts(familyData);
      alerts.push(...patternAlerts);
    }

    // Store and deduplicate alerts
    this.storeAlerts(alerts);
    this.cleanupOldAlerts();

    return this.getActiveAlerts();
  }

  // Generate rule-based alerts
  private generateRuleBasedAlerts(data: AggregatedFamilyData): SmartAlert[] {
    const alerts: SmartAlert[] = [];

    for (const rule of this.rules) {
      // Check cooldown
      if (!this.shouldGenerateAlert(rule.id, rule.cooldownMinutes)) {
        continue;
      }

      // Check condition
      if (rule.condition(data)) {
        const alertData = rule.generateAlert(data);
        if (alertData) {
          const alert: SmartAlert = {
            id: this.generateAlertId(),
            timestamp: new Date(),
            isRead: false,
            isDismissed: false,
            ...alertData
          };

          alerts.push(alert);
          this.updateLastAlertTime(rule.id);
        }
      }
    }

    return alerts;
  }

  // Generate AI-powered alerts
  private async generateAIAlerts(data: AggregatedFamilyData): Promise<SmartAlert[]> {
    try {
      const aiResponse = await this.aiService.generateAlerts(data);
      return this.parseAIAlerts(aiResponse, data);
    } catch (error) {
      console.error('Failed to generate AI alerts:', error);
      return [];
    }
  }

  // Generate pattern-based alerts
  private async generatePatternAlerts(data: AggregatedFamilyData): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = [];
    
    // Get historical data from cache
    const historicalData = await this.getHistoricalData();
    
    if (historicalData.length < 2) {
      return alerts; // Need at least 2 data points for pattern detection
    }

    for (const pattern of this.patterns) {
      if (!this.shouldGenerateAlert(pattern.id, 720)) { // 12 hour cooldown for patterns
        continue;
      }

      if (pattern.detect(data, historicalData)) {
        const insight = pattern.generateInsight(data, historicalData);
        
        const alert: SmartAlert = {
          id: this.generateAlertId(),
          category: pattern.category,
          priority: 'medium',
          title: pattern.name,
          message: insight,
          timestamp: new Date(),
          affectedMembers: [],
          relatedItems: {},
          actions: [],
          metadata: {
            confidence: 0.75,
            source: 'pattern',
            triggerReason: pattern.name
          },
          isRead: false,
          isDismissed: false
        };

        alerts.push(alert);
        this.updateLastAlertTime(pattern.id);
      }
    }

    return alerts;
  }

  // Initialize rule-based alerts
  private initializeRules() {
    this.rules = [
      // Overdue tasks alert
      {
        id: 'overdue-tasks',
        name: 'Overdue Tasks Alert',
        category: 'overdue_task',
        condition: (data) => data.todos.overdue.length > 0,
        generateAlert: (data) => ({
          category: 'overdue_task',
          priority: data.todos.overdue.length > 3 ? 'critical' : 'high',
          title: `${data.todos.overdue.length} Overdue Task${data.todos.overdue.length > 1 ? 's' : ''}`,
          message: this.generateOverdueTasksMessage(data.todos.overdue),
          affectedMembers: this.extractAffectedMembers(data.todos.overdue),
          relatedItems: {
            todos: data.todos.overdue.map(t => t.id)
          },
          actions: this.generateOverdueTaskActions(data.todos.overdue),
          metadata: {
            confidence: 1.0,
            source: 'rule',
            triggerReason: 'Tasks past due date'
          }
        }),
        cooldownMinutes: 60
      },

      // Upcoming deadlines alert
      {
        id: 'upcoming-deadlines',
        name: 'Upcoming Deadlines',
        category: 'upcoming_deadline',
        condition: (data) => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return data.todos.pending.some(todo => 
            todo.dueDate && new Date(todo.dueDate) <= tomorrow
          );
        },
        generateAlert: (data) => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const urgentTodos = data.todos.pending.filter(todo => 
            todo.dueDate && new Date(todo.dueDate) <= tomorrow
          );

          return {
            category: 'upcoming_deadline',
            priority: 'high',
            title: 'Tasks Due Tomorrow',
            message: `${urgentTodos.length} task${urgentTodos.length > 1 ? 's' : ''} due within 24 hours`,
            affectedMembers: this.extractAffectedMembers(urgentTodos),
            relatedItems: {
              todos: urgentTodos.map(t => t.id)
            },
            actions: urgentTodos.map(todo => ({
              id: `complete-${todo.id}`,
              type: 'complete' as const,
              label: `Complete: ${todo.title}`,
              targetId: todo.id,
              targetType: 'todo' as const
            })),
            metadata: {
              confidence: 1.0,
              source: 'rule',
              triggerReason: 'Tasks due within 24 hours'
            }
          };
        },
        cooldownMinutes: 120
      },

      // Schedule conflicts alert
      {
        id: 'schedule-conflicts',
        name: 'Schedule Conflicts',
        category: 'schedule_conflict',
        condition: (data) => this.detectScheduleConflicts(data.events.upcoming).length > 0,
        generateAlert: (data) => {
          const conflicts = this.detectScheduleConflicts(data.events.upcoming);
          return {
            category: 'schedule_conflict',
            priority: 'critical',
            title: 'Schedule Conflict Detected',
            message: `${conflicts.length} overlapping events found`,
            affectedMembers: this.extractAffectedMembersFromEvents(conflicts.flatMap(c => c.events)),
            relatedItems: {
              events: conflicts.flatMap(c => c.events.map(e => e.id))
            },
            actions: conflicts.map(conflict => ({
              id: `resolve-${conflict.events[0].id}`,
              type: 'reschedule' as const,
              label: 'Resolve Conflict',
              description: conflict.events.map(e => e.title).join(' vs '),
              metadata: { conflictingEvents: conflict.events.map(e => e.id) }
            })),
            metadata: {
              confidence: 1.0,
              source: 'rule',
              triggerReason: 'Overlapping events detected'
            }
          };
        },
        cooldownMinutes: 30
      },

      // Urgent groceries alert
      {
        id: 'urgent-groceries',
        name: 'Urgent Groceries',
        category: 'grocery_urgent',
        condition: (data) => data.groceries.urgentItems.length > 0,
        generateAlert: (data) => ({
          category: 'grocery_urgent',
          priority: data.groceries.urgentItems.length > 5 ? 'high' : 'medium',
          title: 'Urgent Grocery Items',
          message: `${data.groceries.urgentItems.length} items marked as urgent`,
          affectedMembers: [],
          relatedItems: {
            groceries: data.groceries.urgentItems.map(g => g.id)
          },
          actions: [{
            id: 'view-grocery-list',
            type: 'navigate' as const,
            label: 'View Shopping List',
            targetType: 'grocery' as const
          }],
          metadata: {
            confidence: 1.0,
            source: 'rule',
            triggerReason: 'Items marked as urgent'
          }
        }),
        cooldownMinutes: 240
      },

      // Low productivity alert
      {
        id: 'low-productivity',
        name: 'Low Productivity Alert',
        category: 'productivity_insight',
        condition: (data) => data.todos.completionRate < 0.3 && data.todos.pending.length > 10,
        generateAlert: (data) => ({
          category: 'productivity_insight',
          priority: 'medium',
          title: 'Productivity Alert',
          message: `Task completion rate is ${Math.round(data.todos.completionRate * 100)}% with ${data.todos.pending.length} pending tasks`,
          affectedMembers: [],
          relatedItems: {},
          actions: [{
            id: 'view-productivity',
            type: 'navigate' as const,
            label: 'View Productivity Dashboard'
          }],
          metadata: {
            confidence: 0.8,
            source: 'rule',
            triggerReason: 'Low completion rate detected'
          }
        }),
        cooldownMinutes: 1440
      }
    ];
  }

  // Initialize pattern detection
  private initializePatterns() {
    this.patterns = [
      // Procrastination pattern
      {
        id: 'procrastination-pattern',
        name: 'Task Procrastination Pattern',
        category: 'productivity_insight',
        detect: (data, history) => {
          // Check if tasks are repeatedly moved without completion
          const currentOverdue = data.todos.overdue.length;
          const avgOverdue = history.reduce((sum, h) => sum + h.todos.overdue.length, 0) / history.length;
          return currentOverdue > avgOverdue * 1.5;
        },
        generateInsight: (data, history) => {
          const trend = this.calculateTrend(history.map(h => h.todos.overdue.length));
          return `Task procrastination trend detected. Overdue tasks have increased by ${Math.round(trend * 100)}% over the past week.`;
        }
      },

      // Shopping pattern
      {
        id: 'shopping-pattern',
        name: 'Shopping Frequency Pattern',
        category: 'grocery_urgent',
        detect: (data, history) => {
          // Detect if grocery completion is irregular
          const completionRates = history.map(h => h.groceries.completionRate);
          const variance = this.calculateVariance(completionRates);
          return variance > 0.2;
        },
        generateInsight: (data, history) => {
          return 'Irregular shopping patterns detected. Consider establishing a regular shopping schedule.';
        }
      },

      // Family coordination pattern
      {
        id: 'coordination-pattern',
        name: 'Family Coordination Pattern',
        category: 'family_coordination',
        detect: (data, history) => {
          // Check if certain members are overloaded
          const memberStats = data.todos.memberStats;
          if (memberStats.length === 0) return false;
          
          const maxTasks = Math.max(...memberStats.map(m => m.pendingTodos));
          const avgTasks = memberStats.reduce((sum, m) => sum + m.pendingTodos, 0) / memberStats.length;
          return maxTasks > avgTasks * 2;
        },
        generateInsight: (data) => {
          const memberStats = data.todos.memberStats;
          const overloaded = memberStats.find(m => m.pendingTodos === Math.max(...memberStats.map(s => s.pendingTodos)));
          return `Task distribution is uneven. ${overloaded?.member.name || 'One member'} has significantly more tasks than others.`;
        }
      }
    ];
  }

  // Helper methods

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldGenerateAlert(ruleId: string, cooldownMinutes?: number): boolean {
    const lastAlert = this.lastAlertTimes.get(ruleId);
    if (!lastAlert) return true;

    const cooldown = cooldownMinutes || 60;
    const elapsed = (Date.now() - lastAlert.getTime()) / 1000 / 60;
    return elapsed >= cooldown;
  }

  private updateLastAlertTime(ruleId: string): void {
    this.lastAlertTimes.set(ruleId, new Date());
  }

  private generateOverdueTasksMessage(overdueTasks: Todo[]): string {
    const byMember = this.groupByMember(overdueTasks);
    const memberMessages = Object.entries(byMember)
      .map(([member, tasks]) => `${member}: ${tasks.length}`)
      .join(', ');
    
    return `Overdue tasks need attention (${memberMessages}). The oldest is ${this.getDaysOverdue(overdueTasks[0])} days overdue.`;
  }

  private generateOverdueTaskActions(tasks: Todo[]): AlertAction[] {
    const actions: AlertAction[] = [];

    // Add complete actions for top 3 tasks
    tasks.slice(0, 3).forEach(task => {
      actions.push({
        id: `complete-${task.id}`,
        type: 'complete',
        label: `Complete: ${task.title}`,
        targetId: task.id,
        targetType: 'todo'
      });
    });

    // Add bulk reschedule action if many tasks
    if (tasks.length > 3) {
      actions.push({
        id: 'bulk-reschedule',
        type: 'custom',
        label: 'Reschedule All',
        metadata: { taskIds: tasks.map(t => t.id) }
      });
    }

    return actions;
  }

  private extractAffectedMembers(todos: Todo[]): FamilyMember[] {
    const members = new Set<FamilyMember>();
    todos.forEach(todo => {
      if (todo.assignedTo) {
        members.add(todo.assignedTo);
      }
    });
    return Array.from(members);
  }

  private extractAffectedMembersFromEvents(events: CalendarEvent[]): FamilyMember[] {
    const members = new Set<FamilyMember>();
    events.forEach(event => {
      if (event.assignedTo) {
        members.add(event.assignedTo);
      }
    });
    return Array.from(members);
  }

  private detectScheduleConflicts(events: CalendarEvent[]): Array<{ events: CalendarEvent[] }> {
    const conflicts: Array<{ events: CalendarEvent[] }> = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (this.eventsOverlap(events[i], events[j])) {
          conflicts.push({ events: [events[i], events[j]] });
        }
      }
    }

    return conflicts;
  }

  private eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
    // Skip if different members
    if (event1.assignedTo !== event2.assignedTo) return false;
    
    const start1 = new Date(event1.startDate);
    const end1 = new Date(event1.endDate);
    const start2 = new Date(event2.startDate);
    const end2 = new Date(event2.endDate);

    return start1 < end2 && start2 < end1;
  }

  private groupByMember(todos: Todo[]): Record<string, Todo[]> {
    const grouped: Record<string, Todo[]> = {};
    
    todos.forEach(todo => {
      const member = todo.assignedTo || 'Unassigned';
      if (!grouped[member]) {
        grouped[member] = [];
      }
      grouped[member].push(todo);
    });

    return grouped;
  }

  private getDaysOverdue(todo: Todo): number {
    if (!todo.dueDate) return 0;
    const due = new Date(todo.dueDate);
    const now = new Date();
    const diff = now.getTime() - due.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / first;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private async getHistoricalData(): Promise<AggregatedFamilyData[]> {
    // This would fetch from a historical data store
    // For now, return empty array
    return [];
  }

  private parseAIAlerts(aiResponse: AIResponse, data: AggregatedFamilyData): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    
    // Parse AI response content for alerts
    // This is a simplified version - in production, you'd have more sophisticated parsing
    if (aiResponse.metadata?.suggestions) {
      aiResponse.metadata.suggestions.forEach((suggestion: any, index: number) => {
        const alert: SmartAlert = {
          id: this.generateAlertId(),
          category: this.mapSuggestionToCategory(suggestion.actionType),
          priority: 'medium',
          title: suggestion.description.split('.')[0], // First sentence as title
          message: suggestion.description,
          timestamp: new Date(),
          affectedMembers: [],
          relatedItems: {
            todos: suggestion.targetItems
          },
          actions: [{
            id: `ai-action-${index}`,
            type: 'custom',
            label: this.getActionLabel(suggestion.actionType),
            metadata: { suggestion }
          }],
          metadata: {
            confidence: aiResponse.confidence || 0.8,
            source: 'ai',
            aiInsight: suggestion.description
          },
          isRead: false,
          isDismissed: false
        };

        alerts.push(alert);
      });
    }

    return alerts;
  }

  private mapSuggestionToCategory(actionType: string): AlertCategory {
    const mapping: Record<string, AlertCategory> = {
      'create_todo': 'productivity_insight',
      'reschedule_event': 'schedule_conflict',
      'buy_groceries': 'grocery_urgent',
      'organize_documents': 'productivity_insight',
      'contact_member': 'family_coordination',
      'review_budget': 'budget_warning'
    };

    return mapping[actionType] || 'productivity_insight';
  }

  private getActionLabel(actionType: string): string {
    const labels: Record<string, string> = {
      'create_todo': 'Create Task',
      'reschedule_event': 'Reschedule',
      'buy_groceries': 'Add to List',
      'organize_documents': 'Organize',
      'contact_member': 'Contact',
      'review_budget': 'Review Budget'
    };

    return labels[actionType] || 'Take Action';
  }

  private storeAlerts(alerts: SmartAlert[]): void {
    alerts.forEach(alert => {
      // Don't store if we already have max alerts for this category
      const categoryAlerts = Array.from(this.alerts.values())
        .filter(a => a.category === alert.category && !a.isDismissed);
      
      if (categoryAlerts.length >= this.config.maxAlertsPerCategory) {
        // Remove oldest alert of this category
        const oldest = categoryAlerts.sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        )[0];
        this.alerts.delete(oldest.id);
      }

      this.alerts.set(alert.id, alert);
    });
  }

  private cleanupOldAlerts(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.alertRetentionDays);

    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoffDate || (alert.expiresAt && alert.expiresAt < new Date())) {
        this.alerts.delete(id);
      }
    }
  }

  // Public API methods

  getActiveAlerts(): SmartAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.isDismissed)
      .sort((a, b) => {
        // Sort by priority then timestamp
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  getAlertsByCategory(category: AlertCategory): SmartAlert[] {
    return this.getActiveAlerts().filter(alert => alert.category === category);
  }

  getAlertsByMember(member: FamilyMember): SmartAlert[] {
    return this.getActiveAlerts().filter(alert => 
      alert.affectedMembers.includes(member)
    );
  }

  markAsRead(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isRead = true;
    }
  }

  dismissAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isDismissed = true;
    }
  }

  clearAllAlerts(): void {
    this.alerts.clear();
  }

  getUnreadCount(): number {
    return this.getActiveAlerts().filter(alert => !alert.isRead).length;
  }

  getCriticalAlerts(): SmartAlert[] {
    return this.getActiveAlerts().filter(alert => alert.priority === 'critical');
  }

  // Cache integration
  async getCachedAlerts(): Promise<SmartAlert[]> {
    const cached = await this.cacheService.get<SmartAlert[]>('smart-alerts');
    return cached || [];
  }

  async cacheAlerts(): Promise<void> {
    const alerts = this.getActiveAlerts();
    this.cacheService.set('smart-alerts', alerts, 5 * 60 * 1000); // Cache for 5 minutes
  }
}

// Singleton instance
let alertsServiceInstance: SmartAlertsService | null = null;

export function getSmartAlertsService(): SmartAlertsService {
  if (!alertsServiceInstance) {
    alertsServiceInstance = new SmartAlertsService();
  }
  return alertsServiceInstance;
}

export function setSmartAlertsService(service: SmartAlertsService): void {
  alertsServiceInstance = service;
}

// Export types
export type { AlertsConfig };
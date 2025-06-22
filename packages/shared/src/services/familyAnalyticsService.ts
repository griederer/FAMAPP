// Advanced Family Analytics and Insights Engine
import { getAIService } from './aiService';
import { getDataCacheService } from './dataCacheService';
import { 
  AggregatedFamilyData, 
  FamilyMember,
  Todo, 
  CalendarEvent, 
  GroceryItem,
  AIResponse 
} from '../types';

// Analytics time periods
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type TrendDirection = 'up' | 'down' | 'stable';

// Analytics metric types
export interface MetricValue {
  value: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
  previousValue: number;
}

// Productivity metrics
export interface ProductivityMetrics {
  familyCompletionRate: MetricValue;
  averageTasksPerMember: MetricValue;
  overdueTasksRate: MetricValue;
  taskVelocity: MetricValue; // Tasks completed per week
  efficiencyScore: MetricValue; // Composite score
}

// Member analytics
export interface MemberAnalytics {
  memberId: string;
  memberName: string;
  productivityScore: number;
  completionRate: MetricValue;
  tasksCompleted: MetricValue;
  averageCompletionTime: MetricValue; // Days to complete
  preferredTaskCategories: string[];
  peakProductivityHours: number[];
  collaborationScore: number; // How well they work with others
  consistencyScore: number; // Regular completion pattern
}

// Event analytics
export interface EventAnalytics {
  schedulingEfficiency: MetricValue;
  conflictRate: MetricValue;
  attendanceRate: MetricValue;
  eventDistribution: Record<string, number>; // By type/category
  planningLeadTime: MetricValue; // Average days ahead planned
}

// Grocery analytics
export interface GroceryAnalytics {
  shoppingFrequency: MetricValue;
  averageBasketSize: MetricValue;
  urgentItemsRate: MetricValue;
  categoryPreferences: Record<string, number>;
  wasteReduction: MetricValue; // Items bought vs consumed
}

// Family health metrics
export interface FamilyHealthMetrics {
  organizationScore: number; // 0-100
  communicationIndex: number; // Based on task assignments
  planningEffectiveness: number;
  stressIndicators: string[];
  improvementAreas: string[];
  strengths: string[];
}

// Predictive insights
export interface PredictiveInsight {
  type: 'warning' | 'opportunity' | 'recommendation' | 'celebration';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  actionable: boolean;
  suggestedActions: string[];
  impact: 'low' | 'medium' | 'high';
}

// Trend analysis
export interface TrendAnalysis {
  period: AnalyticsPeriod;
  dataPoints: Array<{
    date: Date;
    value: number;
    label?: string;
  }>;
  direction: TrendDirection;
  significance: number; // Statistical significance
  seasonality?: {
    detected: boolean;
    pattern: string;
    strength: number;
  };
}

// Goal tracking
export interface FamilyGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  category: 'productivity' | 'organization' | 'communication' | 'custom';
  progress: number; // 0-100
  onTrack: boolean;
  milestones: Array<{
    date: Date;
    description: string;
    achieved: boolean;
  }>;
}

// Comprehensive analytics report
export interface FamilyAnalyticsReport {
  generatedAt: Date;
  period: AnalyticsPeriod;
  dataCompleteness: number; // 0-100
  
  // Core metrics
  productivity: ProductivityMetrics;
  events: EventAnalytics;
  groceries: GroceryAnalytics;
  health: FamilyHealthMetrics;
  
  // Member-specific
  memberAnalytics: MemberAnalytics[];
  
  // Insights and predictions
  insights: PredictiveInsight[];
  trends: Record<string, TrendAnalysis>;
  
  // Goals and achievements
  goals: FamilyGoal[];
  achievements: Array<{
    title: string;
    description: string;
    date: Date;
    category: string;
  }>;
  
  // AI-generated summary
  aiSummary?: AIResponse;
}

// Analytics service configuration
interface AnalyticsConfig {
  enablePredictiveInsights: boolean;
  enableAIAnalysis: boolean;
  historicalDataDays: number;
  cacheTTL: number; // milliseconds
  significanceThreshold: number; // For trend detection
  goalTracking: boolean;
}

// Family Analytics Service
export class FamilyAnalyticsService {
  private aiService = getAIService();
  private cacheService = getDataCacheService();
  private config: AnalyticsConfig;
  private historicalData: Map<string, AggregatedFamilyData[]> = new Map();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enablePredictiveInsights: true,
      enableAIAnalysis: true,
      historicalDataDays: 90,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      significanceThreshold: 0.1, // 10% change threshold
      goalTracking: true,
      ...config
    };
  }

  // Generate comprehensive analytics report
  async generateAnalyticsReport(
    currentData: AggregatedFamilyData,
    period: AnalyticsPeriod = 'weekly'
  ): Promise<FamilyAnalyticsReport> {
    const cacheKey = `analytics-report-${period}-${Date.now()}`;
    
    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached as FamilyAnalyticsReport;

    const historical = await this.getHistoricalData(period);
    const dataCompleteness = this.calculateDataCompleteness(currentData, historical);

    const report: FamilyAnalyticsReport = {
      generatedAt: new Date(),
      period,
      dataCompleteness,
      
      // Generate core metrics
      productivity: await this.calculateProductivityMetrics(currentData, historical),
      events: await this.calculateEventAnalytics(currentData, historical),
      groceries: await this.calculateGroceryAnalytics(currentData, historical),
      health: await this.calculateFamilyHealth(currentData, historical),
      
      // Member analytics
      memberAnalytics: await this.calculateMemberAnalytics(currentData, historical),
      
      // Advanced insights
      insights: await this.generatePredictiveInsights(currentData, historical),
      trends: await this.analyzeTrends(currentData, historical, period),
      
      // Goals
      goals: await this.trackGoals(currentData),
      achievements: await this.identifyAchievements(currentData, historical)
    };

    // Generate AI summary if enabled
    if (this.config.enableAIAnalysis) {
      report.aiSummary = await this.generateAISummary(report, currentData);
    }

    // Cache the report
    await this.cacheService.set(cacheKey, report, this.config.cacheTTL);

    return report;
  }

  // Calculate productivity metrics
  private async calculateProductivityMetrics(
    current: AggregatedFamilyData,
    historical: AggregatedFamilyData[]
  ): Promise<ProductivityMetrics> {
    const previousPeriod = this.getPreviousPeriodData(historical);
    
    return {
      familyCompletionRate: this.calculateMetricValue(
        current.todos.completionRate,
        previousPeriod?.todos.completionRate || 0
      ),
      
      averageTasksPerMember: this.calculateMetricValue(
        current.todos.totalCount / Math.max(current.familyMembers.length, 1),
        (previousPeriod?.todos.totalCount || 0) / Math.max(previousPeriod?.familyMembers.length || 1, 1)
      ),
      
      overdueTasksRate: this.calculateMetricValue(
        current.todos.overdue.length / Math.max(current.todos.totalCount, 1),
        (previousPeriod?.todos.overdue.length || 0) / Math.max(previousPeriod?.todos.totalCount || 1, 1)
      ),
      
      taskVelocity: this.calculateMetricValue(
        current.todos.completedRecent.length,
        previousPeriod?.todos.completedRecent.length || 0
      ),
      
      efficiencyScore: this.calculateMetricValue(
        this.calculateEfficiencyScore(current),
        this.calculateEfficiencyScore(previousPeriod || current)
      )
    };
  }

  // Calculate event analytics
  private async calculateEventAnalytics(
    current: AggregatedFamilyData,
    historical: AggregatedFamilyData[]
  ): Promise<EventAnalytics> {
    const previousPeriod = this.getPreviousPeriodData(historical);
    
    return {
      schedulingEfficiency: this.calculateMetricValue(
        this.calculateSchedulingEfficiency(current),
        this.calculateSchedulingEfficiency(previousPeriod || current)
      ),
      
      conflictRate: this.calculateMetricValue(
        this.detectEventConflicts(current.events.upcoming).length / Math.max(current.events.totalCount, 1),
        this.detectEventConflicts(previousPeriod?.events.upcoming || []).length / Math.max(previousPeriod?.events.totalCount || 1, 1)
      ),
      
      attendanceRate: this.calculateMetricValue(0.95, 0.90), // Mock data - would come from actual attendance
      
      eventDistribution: this.calculateEventDistribution(current.events.upcoming),
      
      planningLeadTime: this.calculateMetricValue(
        this.calculatePlanningLeadTime(current.events.upcoming),
        this.calculatePlanningLeadTime(previousPeriod?.events.upcoming || [])
      )
    };
  }

  // Calculate grocery analytics
  private async calculateGroceryAnalytics(
    current: AggregatedFamilyData,
    historical: AggregatedFamilyData[]
  ): Promise<GroceryAnalytics> {
    const previousPeriod = this.getPreviousPeriodData(historical);
    
    return {
      shoppingFrequency: this.calculateMetricValue(
        this.calculateShoppingFrequency(current),
        this.calculateShoppingFrequency(previousPeriod || current)
      ),
      
      averageBasketSize: this.calculateMetricValue(
        current.groceries.totalCount / Math.max(this.getShoppingTrips(current), 1),
        (previousPeriod?.groceries.totalCount || 0) / Math.max(this.getShoppingTrips(previousPeriod || current), 1)
      ),
      
      urgentItemsRate: this.calculateMetricValue(
        current.groceries.urgentItems.length / Math.max(current.groceries.totalCount, 1),
        (previousPeriod?.groceries.urgentItems.length || 0) / Math.max(previousPeriod?.groceries.totalCount || 1, 1)
      ),
      
      categoryPreferences: this.calculateCategoryPreferences(current.groceries.categoryStats),
      
      wasteReduction: this.calculateMetricValue(0.85, 0.80) // Mock data - would track actual consumption
    };
  }

  // Calculate family health metrics
  private async calculateFamilyHealth(
    current: AggregatedFamilyData,
    historical: AggregatedFamilyData[]
  ): Promise<FamilyHealthMetrics> {
    const organizationScore = this.calculateOrganizationScore(current);
    const communicationIndex = this.calculateCommunicationIndex(current);
    const planningEffectiveness = this.calculatePlanningEffectiveness(current);
    
    return {
      organizationScore,
      communicationIndex,
      planningEffectiveness,
      stressIndicators: this.identifyStressIndicators(current),
      improvementAreas: this.identifyImprovementAreas(current, historical),
      strengths: this.identifyStrengths(current, historical)
    };
  }

  // Calculate member-specific analytics
  private async calculateMemberAnalytics(
    current: AggregatedFamilyData,
    historical: AggregatedFamilyData[]
  ): Promise<MemberAnalytics[]> {
    return current.familyMembers.map(member => {
      const memberTodos = this.getMemberTodos(current, member.id);
      const historicalMemberData = this.getMemberHistoricalData(historical, member.id);
      
      return {
        memberId: member.id,
        memberName: member.name,
        productivityScore: this.calculateMemberProductivity(memberTodos),
        completionRate: this.calculateMemberCompletionRate(memberTodos, historicalMemberData),
        tasksCompleted: this.calculateMemberTasksCompleted(memberTodos, historicalMemberData),
        averageCompletionTime: this.calculateAverageCompletionTime(memberTodos),
        preferredTaskCategories: this.getPreferredCategories(memberTodos),
        peakProductivityHours: this.calculatePeakHours(memberTodos),
        collaborationScore: this.calculateCollaborationScore(member, current),
        consistencyScore: this.calculateConsistencyScore(historicalMemberData)
      };
    });
  }

  // Generate predictive insights using AI and statistical analysis
  private async generatePredictiveInsights(
    current: AggregatedFamilyData,
    historical: AggregatedFamilyData[]
  ): Promise<PredictiveInsight[]> {
    if (!this.config.enablePredictiveInsights) return [];

    const insights: PredictiveInsight[] = [];

    // Statistical pattern analysis
    insights.push(...this.analyzeStatisticalPatterns(current, historical));
    
    // AI-powered insights
    if (this.config.enableAIAnalysis) {
      insights.push(...await this.generateAIInsights(current, historical));
    }

    // Risk assessment
    insights.push(...this.assessRisks(current, historical));
    
    // Opportunity identification
    insights.push(...this.identifyOpportunities(current, historical));

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  // Analyze trends across different metrics
  private async analyzeTrends(
    current: AggregatedFamilyData,
    historical: AggregatedFamilyData[],
    period: AnalyticsPeriod
  ): Promise<Record<string, TrendAnalysis>> {
    const trends: Record<string, TrendAnalysis> = {};
    
    // Productivity trends
    trends.productivity = this.analyzeTrend(
      historical.map((data, index) => ({
        date: this.getDateForIndex(index, period),
        value: data.todos.completionRate,
        label: 'Completion Rate'
      })),
      period
    );
    
    // Task velocity trends
    trends.taskVelocity = this.analyzeTrend(
      historical.map((data, index) => ({
        date: this.getDateForIndex(index, period),
        value: data.todos.completedRecent.length,
        label: 'Tasks Completed'
      })),
      period
    );
    
    // Event scheduling trends
    trends.eventScheduling = this.analyzeTrend(
      historical.map((data, index) => ({
        date: this.getDateForIndex(index, period),
        value: data.events.totalCount,
        label: 'Events Scheduled'
      })),
      period
    );

    return trends;
  }

  // Helper methods for calculations
  private calculateMetricValue(current: number, previous: number): MetricValue {
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
    const trend: TrendDirection = Math.abs(changePercent) < this.config.significanceThreshold 
      ? 'stable' 
      : changePercent > 0 ? 'up' : 'down';

    return {
      value: current,
      change,
      changePercent,
      trend,
      previousValue: previous
    };
  }

  private calculateEfficiencyScore(data: AggregatedFamilyData): number {
    const completionRate = data.todos.completionRate;
    const overdueRate = data.todos.overdue.length / Math.max(data.todos.totalCount, 1);
    const eventUtilization = data.events.totalCount > 0 ? 0.8 : 0.5; // Mock calculation
    
    return (completionRate * 0.5 + (1 - overdueRate) * 0.3 + eventUtilization * 0.2) * 100;
  }

  private calculateSchedulingEfficiency(data: AggregatedFamilyData): number {
    const conflicts = this.detectEventConflicts(data.events.upcoming);
    const conflictRate = conflicts.length / Math.max(data.events.totalCount, 1);
    return Math.max(0, 1 - conflictRate) * 100;
  }

  private detectEventConflicts(events: CalendarEvent[]): Array<{events: CalendarEvent[], conflictType: string}> {
    const conflicts: Array<{events: CalendarEvent[], conflictType: string}> = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        if (event1.assignedTo === event2.assignedTo && this.eventsOverlap(event1, event2)) {
          conflicts.push({
            events: [event1, event2],
            conflictType: 'time_overlap'
          });
        }
      }
    }
    
    return conflicts;
  }

  private eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
    const start1 = new Date(event1.startDate).getTime();
    const end1 = new Date(event1.endDate).getTime();
    const start2 = new Date(event2.startDate).getTime();
    const end2 = new Date(event2.endDate).getTime();
    
    return start1 < end2 && start2 < end1;
  }

  private calculatePlanningLeadTime(events: CalendarEvent[]): number {
    if (events.length === 0) return 0;
    
    const leadTimes = events.map(event => {
      const eventDate = new Date(event.startDate).getTime();
      const createdDate = new Date(event.createdAt).getTime();
      return (eventDate - createdDate) / (1000 * 60 * 60 * 24); // Days
    });
    
    return leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length;
  }

  private calculateEventDistribution(events: CalendarEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    events.forEach(event => {
      // This would ideally use event categories from the data model
      const category = 'general'; // Simplified for now
      distribution[category] = (distribution[category] || 0) + 1;
    });
    
    return distribution;
  }

  private calculateShoppingFrequency(data: AggregatedFamilyData): number {
    // Mock calculation - would track actual shopping events
    return data.groceries.completedRecent.length;
  }

  private getShoppingTrips(data: AggregatedFamilyData): number {
    // Mock calculation - would track actual shopping trips
    return Math.max(1, Math.ceil(data.groceries.totalCount / 15)); // Assume 15 items per trip
  }

  private calculateCategoryPreferences(categoryStats: any[]): Record<string, number> {
    const preferences: Record<string, number> = {};
    
    categoryStats.forEach(stat => {
      preferences[stat.category] = stat.count;
    });
    
    return preferences;
  }

  private calculateOrganizationScore(data: AggregatedFamilyData): number {
    const completionRate = data.todos.completionRate;
    const overdueRate = data.todos.overdue.length / Math.max(data.todos.totalCount, 1);
    const eventPlanning = Math.min(data.events.totalCount / 5, 1); // Normalized
    
    return Math.round((completionRate * 40 + (1 - overdueRate) * 40 + eventPlanning * 20) * 100);
  }

  private calculateCommunicationIndex(data: AggregatedFamilyData): number {
    // Mock calculation based on task assignment distribution
    const memberStats = data.todos.memberStats;
    if (memberStats.length === 0) return 50;
    
    const variance = this.calculateVariance(memberStats.map(m => m.pendingTodos));
    const normalized = Math.max(0, 100 - variance * 10);
    
    return Math.round(normalized);
  }

  private calculatePlanningEffectiveness(data: AggregatedFamilyData): number {
    const hasEvents = data.events.totalCount > 0;
    const hasStructure = data.todos.totalCount > 0;
    const completion = data.todos.completionRate;
    
    return Math.round((hasEvents ? 30 : 0) + (hasStructure ? 30 : 0) + (completion * 40));
  }

  private identifyStressIndicators(data: AggregatedFamilyData): string[] {
    const indicators: string[] = [];
    
    if (data.todos.overdue.length > 5) {
      indicators.push('High number of overdue tasks');
    }
    
    if (data.todos.completionRate < 0.3) {
      indicators.push('Low task completion rate');
    }
    
    if (this.detectEventConflicts(data.events.upcoming).length > 0) {
      indicators.push('Scheduling conflicts detected');
    }
    
    return indicators;
  }

  private identifyImprovementAreas(current: AggregatedFamilyData, historical: AggregatedFamilyData[]): string[] {
    const areas: string[] = [];
    
    if (current.todos.completionRate < 0.6) {
      areas.push('Task completion efficiency');
    }
    
    if (current.todos.overdue.length > 3) {
      areas.push('Time management');
    }
    
    if (current.events.totalCount < 2) {
      areas.push('Family event planning');
    }
    
    return areas;
  }

  private identifyStrengths(current: AggregatedFamilyData, historical: AggregatedFamilyData[]): string[] {
    const strengths: string[] = [];
    
    if (current.todos.completionRate > 0.8) {
      strengths.push('Excellent task completion');
    }
    
    if (current.groceries.completionRate > 0.9) {
      strengths.push('Efficient grocery management');
    }
    
    if (this.detectEventConflicts(current.events.upcoming).length === 0) {
      strengths.push('Well-coordinated scheduling');
    }
    
    return strengths;
  }

  // Additional helper methods would continue here...
  // Due to length constraints, I'll implement the core structure and key methods

  private async getHistoricalData(period: AnalyticsPeriod): Promise<AggregatedFamilyData[]> {
    // This would fetch actual historical data from storage
    // For now, return empty array
    return [];
  }

  private calculateDataCompleteness(current: AggregatedFamilyData, historical: AggregatedFamilyData[]): number {
    // Calculate completeness based on available data points
    let score = 0;
    const maxScore = 100;
    
    // Check current data completeness
    if (current.todos.totalCount > 0) score += 25;
    if (current.events.totalCount > 0) score += 25;
    if (current.groceries.totalCount > 0) score += 25;
    if (current.familyMembers.length > 0) score += 25;
    
    return score;
  }

  private getPreviousPeriodData(historical: AggregatedFamilyData[]): AggregatedFamilyData | null {
    return historical.length > 0 ? historical[historical.length - 1] : null;
  }

  private getMemberTodos(data: AggregatedFamilyData, memberId: string): Todo[] {
    return [...data.todos.pending, ...data.todos.overdue, ...data.todos.completedRecent]
      .filter(todo => todo.assignedTo === memberId);
  }

  private getMemberHistoricalData(historical: AggregatedFamilyData[], memberId: string): Todo[][] {
    return historical.map(data => this.getMemberTodos(data, memberId));
  }

  private calculateMemberProductivity(todos: Todo[]): number {
    if (todos.length === 0) return 50;
    
    const completed = todos.filter(t => t.completed).length;
    const overdue = todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    
    return Math.round(((completed / todos.length) * 70 + (1 - overdue / todos.length) * 30) * 100);
  }

  private calculateMemberCompletionRate(todos: Todo[], historical: Todo[][]): MetricValue {
    const currentRate = todos.length > 0 ? todos.filter(t => t.completed).length / todos.length : 0;
    const previousRate = historical.length > 0 && historical[0].length > 0 
      ? historical[0].filter(t => t.completed).length / historical[0].length 
      : 0;
    
    return this.calculateMetricValue(currentRate, previousRate);
  }

  private calculateMemberTasksCompleted(todos: Todo[], historical: Todo[][]): MetricValue {
    const current = todos.filter(t => t.completed).length;
    const previous = historical.length > 0 ? historical[0].filter(t => t.completed).length : 0;
    
    return this.calculateMetricValue(current, previous);
  }

  private calculateAverageCompletionTime(todos: Todo[]): MetricValue {
    const completedTodos = todos.filter(t => t.completed && t.dueDate);
    if (completedTodos.length === 0) {
      return this.calculateMetricValue(0, 0);
    }
    
    const avgTime = completedTodos.reduce((sum, todo) => {
      const dueDate = new Date(todo.dueDate!).getTime();
      const completedDate = new Date(todo.updatedAt).getTime();
      return sum + Math.max(0, (completedDate - dueDate) / (1000 * 60 * 60 * 24));
    }, 0) / completedTodos.length;
    
    return this.calculateMetricValue(avgTime, avgTime); // Simplified
  }

  private getPreferredCategories(todos: Todo[]): string[] {
    // This would analyze task categories - simplified for now
    return ['general'];
  }

  private calculatePeakHours(todos: Todo[]): number[] {
    // This would analyze completion times - simplified for now
    return [9, 14, 19]; // 9 AM, 2 PM, 7 PM
  }

  private calculateCollaborationScore(member: FamilyMember, data: AggregatedFamilyData): number {
    // This would analyze shared tasks and interactions
    return 75; // Mock score
  }

  private calculateConsistencyScore(historical: Todo[][]): number {
    // This would analyze completion patterns over time
    return 80; // Mock score
  }

  private analyzeStatisticalPatterns(current: AggregatedFamilyData, historical: AggregatedFamilyData[]): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];
    
    // Example pattern analysis
    if (current.todos.completionRate < 0.5 && historical.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Declining Task Completion Trend',
        description: 'Family task completion rate has been declining over recent periods',
        confidence: 0.85,
        timeframe: 'Next 2 weeks',
        actionable: true,
        suggestedActions: [
          'Review task assignments',
          'Simplify task descriptions',
          'Set up reminder notifications'
        ],
        impact: 'medium'
      });
    }
    
    return insights;
  }

  private async generateAIInsights(current: AggregatedFamilyData, historical: AggregatedFamilyData[]): Promise<PredictiveInsight[]> {
    // This would use AI to generate insights from patterns
    return []; // Simplified for now
  }

  private assessRisks(current: AggregatedFamilyData, historical: AggregatedFamilyData[]): PredictiveInsight[] {
    const risks: PredictiveInsight[] = [];
    
    if (current.todos.overdue.length > 10) {
      risks.push({
        type: 'warning',
        title: 'High Overdue Task Risk',
        description: 'Large number of overdue tasks may lead to family stress',
        confidence: 0.90,
        timeframe: 'Immediate',
        actionable: true,
        suggestedActions: ['Prioritize urgent tasks', 'Redistribute workload'],
        impact: 'high'
      });
    }
    
    return risks;
  }

  private identifyOpportunities(current: AggregatedFamilyData, historical: AggregatedFamilyData[]): PredictiveInsight[] {
    const opportunities: PredictiveInsight[] = [];
    
    if (current.todos.completionRate > 0.9) {
      opportunities.push({
        type: 'celebration',
        title: 'Outstanding Family Productivity',
        description: 'Your family is achieving excellent task completion rates',
        confidence: 0.95,
        timeframe: 'Current',
        actionable: false,
        suggestedActions: ['Maintain current practices'],
        impact: 'high'
      });
    }
    
    return opportunities;
  }

  private analyzeTrend(dataPoints: Array<{date: Date; value: number; label?: string}>, period: AnalyticsPeriod): TrendAnalysis {
    if (dataPoints.length < 2) {
      return {
        period,
        dataPoints,
        direction: 'stable',
        significance: 0
      };
    }
    
    // Simple linear regression for trend direction
    const values = dataPoints.map(d => d.value);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const changePercent = Math.abs(change / firstAvg) * 100;
    
    return {
      period,
      dataPoints,
      direction: changePercent < this.config.significanceThreshold * 100 
        ? 'stable' 
        : change > 0 ? 'up' : 'down',
      significance: changePercent / 100
    };
  }

  private getDateForIndex(index: number, period: AnalyticsPeriod): Date {
    const now = new Date();
    const days = period === 'daily' ? index : 
                 period === 'weekly' ? index * 7 :
                 period === 'monthly' ? index * 30 :
                 index * 90;
    
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private async trackGoals(current: AggregatedFamilyData): Promise<FamilyGoal[]> {
    // This would load and update family goals
    return []; // Simplified for now
  }

  private async identifyAchievements(current: AggregatedFamilyData, historical: AggregatedFamilyData[]): Promise<Array<{title: string; description: string; date: Date; category: string}>> {
    const achievements: Array<{title: string; description: string; date: Date; category: string}> = [];
    
    if (current.todos.completionRate > 0.95) {
      achievements.push({
        title: 'Perfect Week',
        description: 'Achieved 95%+ task completion rate',
        date: new Date(),
        category: 'productivity'
      });
    }
    
    return achievements;
  }

  private async generateAISummary(report: FamilyAnalyticsReport, currentData: AggregatedFamilyData): Promise<AIResponse> {
    try {
      const prompt = `Analyze this family analytics report and provide insights and recommendations:
      
      Productivity: ${report.productivity.familyCompletionRate.value * 100}% completion rate
      Health Score: ${report.health.organizationScore}/100
      Trends: ${Object.keys(report.trends).join(', ')}
      Insights: ${report.insights.length} insights identified
      
      Provide a friendly, actionable summary with specific recommendations.`;
      
      return await this.aiService.generateSummary(currentData, {
        customPrompt: prompt,
        focusAreas: ['analytics', 'recommendations', 'trends'],
        tone: 'analytical'
      });
    } catch (error) {
      console.error('Failed to generate AI summary for analytics:', error);
      throw error;
    }
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  // Public methods for external access
  public async getProductivityTrends(period: AnalyticsPeriod = 'weekly'): Promise<TrendAnalysis> {
    const historical = await this.getHistoricalData(period);
    return this.analyzeTrend(
      historical.map((data, index) => ({
        date: this.getDateForIndex(index, period),
        value: data.todos.completionRate,
        label: 'Completion Rate'
      })),
      period
    );
  }

  public async getMemberPerformance(memberId: string): Promise<MemberAnalytics | null> {
    // This would return cached or calculated member analytics
    return null; // Simplified for now
  }

  public async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    // This would update goal progress in storage
    console.log(`Goal ${goalId} progress updated to ${progress}%`);
  }

  // Dispose method for cleanup
  public dispose(): void {
    this.historicalData.clear();
  }
}

// Singleton instance
let analyticsServiceInstance: FamilyAnalyticsService | null = null;

export function getFamilyAnalyticsService(config?: Partial<AnalyticsConfig>): FamilyAnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new FamilyAnalyticsService(config);
  }
  return analyticsServiceInstance;
}

export function setFamilyAnalyticsService(service: FamilyAnalyticsService): void {
  analyticsServiceInstance = service;
}

// Export types
export type { 
  AnalyticsPeriod, 
  FamilyAnalyticsReport, 
  ProductivityMetrics,
  MemberAnalytics,
  PredictiveInsight,
  TrendAnalysis,
  FamilyGoal,
  AnalyticsConfig
};
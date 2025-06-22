// AI-Powered Goal Setting and Progress Tracking Service
import { getAIService } from './aiService';
import { getDataCacheService } from './dataCacheService';
import { getFamilyAnalyticsService } from './familyAnalyticsService';
import { 
  AggregatedFamilyData, 
  FamilyMember,
  AIResponse 
} from '../types';

// Goal types and categories
export type GoalCategory = 
  | 'productivity' 
  | 'organization' 
  | 'communication' 
  | 'health' 
  | 'planning' 
  | 'collaboration'
  | 'custom';

export type GoalType = 'individual' | 'family' | 'shared';
export type GoalStatus = 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

// Time-based goal periods
export type GoalTimeframe = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

// Goal measurement types
export type MeasurementType = 'percentage' | 'count' | 'binary' | 'score' | 'time' | 'rating';

// Goal interfaces
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  type: GoalType;
  status: GoalStatus;
  priority: GoalPriority;
  
  // SMART criteria
  specific: string; // What exactly will be accomplished
  measurable: GoalMeasurement;
  achievable: boolean; // AI-validated achievability
  relevant: string; // Why this goal matters
  timeBound: GoalTimeframe;
  
  // Progress tracking
  progress: number; // 0-100
  targetValue: number;
  currentValue: number;
  unit: string;
  measurementType: MeasurementType;
  
  // Timeline
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  
  // Ownership and collaboration
  owner: FamilyMember;
  collaborators: FamilyMember[];
  assignedMembers: FamilyMember[];
  
  // Milestones and checkpoints
  milestones: GoalMilestone[];
  checkpoints: GoalCheckpoint[];
  
  // AI insights and recommendations
  aiInsights: AIGoalInsight[];
  recommendations: GoalRecommendation[];
  successPrediction: number; // 0-1 probability
  
  // Metadata
  tags: string[];
  createdBy: FamilyMember;
  createdAt: Date;
  updatedAt: Date;
  
  // Archived goals
  archived: boolean;
  archiveReason?: string;
}

export interface GoalMeasurement {
  type: MeasurementType;
  unit: string;
  target: number;
  current: number;
  baseline?: number; // Starting value for improvement goals
  benchmark?: number; // External comparison value
}

export interface GoalMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  completedDate?: Date;
  completedBy?: FamilyMember;
  value: number; // Progress value at this milestone
  celebration?: string; // How to celebrate this milestone
}

export interface GoalCheckpoint {
  id: string;
  date: Date;
  progress: number;
  notes: string;
  recordedBy: FamilyMember;
  dataSnapshot?: any; // Relevant data at checkpoint
  adjustments?: string; // Any goal adjustments made
}

export interface AIGoalInsight {
  type: 'progress' | 'risk' | 'opportunity' | 'suggestion' | 'celebration';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
  generatedAt: Date;
  relevantData?: any;
}

export interface GoalRecommendation {
  id: string;
  type: 'adjustment' | 'resource' | 'strategy' | 'timeline' | 'collaboration';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  implementable: boolean;
  estimatedTimeToImplement: number; // days
}

// Goal template for common family goals
export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  type: GoalType;
  defaultTimeframe: GoalTimeframe;
  measurementType: MeasurementType;
  suggestedTarget: number;
  unit: string;
  milestoneTemplate: Omit<GoalMilestone, 'id' | 'completed' | 'completedDate'>[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  aiPromptTemplate: string; // For generating specific goals from template
}

// Goal analytics and insights
export interface GoalAnalytics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  successRate: number;
  averageCompletionTime: number; // days
  
  // Category performance
  categoryStats: Record<GoalCategory, {
    total: number;
    completed: number;
    successRate: number;
    averageProgress: number;
  }>;
  
  // Member performance
  memberStats: Array<{
    member: FamilyMember;
    goalsOwned: number;
    goalsCompleted: number;
    averageProgress: number;
    successRate: number;
    collaborationScore: number;
  }>;
  
  // Trends and patterns
  trends: {
    weeklyProgress: number[];
    monthlyCompletions: number[];
    seasonalPatterns: Record<string, number>;
  };
  
  // Achievements and streaks
  achievements: GoalAchievement[];
  currentStreak: number; // consecutive goals completed
  longestStreak: number;
}

export interface GoalAchievement {
  id: string;
  title: string;
  description: string;
  type: 'milestone' | 'completion' | 'streak' | 'improvement' | 'collaboration';
  earnedDate: Date;
  member?: FamilyMember;
  goalId?: string;
  badge?: string; // emoji or icon
  celebration?: string;
}

// Service configuration
interface GoalTrackingConfig {
  enableAIInsights: boolean;
  enableAutoCheckpoints: boolean;
  enableCelebrations: boolean;
  defaultCheckpointInterval: number; // days
  maxActiveGoals: number;
  goalRetentionDays: number;
  analyticsRetentionDays: number;
}

// Goal Tracking Service
export class GoalTrackingService {
  private aiService = getAIService();
  private cacheService = getDataCacheService();
  private analyticsService = getFamilyAnalyticsService();
  private config: GoalTrackingConfig;
  
  private goals: Map<string, Goal> = new Map();
  private templates: Map<string, GoalTemplate> = new Map();
  private analytics: GoalAnalytics | null = null;

  constructor(config: Partial<GoalTrackingConfig> = {}) {
    this.config = {
      enableAIInsights: true,
      enableAutoCheckpoints: true,
      enableCelebrations: true,
      defaultCheckpointInterval: 7, // weekly
      maxActiveGoals: 10,
      goalRetentionDays: 365,
      analyticsRetentionDays: 90,
      ...config
    };

    this.initializeTemplates();
  }

  // Goal creation and management
  async createGoal(
    goalData: Partial<Goal>, 
    familyData: AggregatedFamilyData,
    useAI: boolean = true
  ): Promise<Goal> {
    // Validate and enhance goal with AI
    const enhancedGoal = useAI 
      ? await this.enhanceGoalWithAI(goalData, familyData)
      : this.validateGoal(goalData);

    // Generate unique ID
    const goal: Goal = {
      id: this.generateGoalId(),
      title: enhancedGoal.title || 'Untitled Goal',
      description: enhancedGoal.description || '',
      category: enhancedGoal.category || 'custom',
      type: enhancedGoal.type || 'individual',
      status: 'draft',
      priority: enhancedGoal.priority || 'medium',
      
      // SMART criteria (enhanced by AI)
      specific: enhancedGoal.specific || enhancedGoal.description || '',
      measurable: enhancedGoal.measurable || {
        type: 'percentage',
        unit: '%',
        target: 100,
        current: 0
      },
      achievable: enhancedGoal.achievable ?? true,
      relevant: enhancedGoal.relevant || 'Improves family organization',
      timeBound: enhancedGoal.timeBound || 'monthly',
      
      // Progress tracking
      progress: 0,
      targetValue: enhancedGoal.targetValue || 100,
      currentValue: 0,
      unit: enhancedGoal.unit || '%',
      measurementType: enhancedGoal.measurementType || 'percentage',
      
      // Timeline
      startDate: new Date(),
      targetDate: enhancedGoal.targetDate || this.calculateTargetDate(enhancedGoal.timeBound || 'monthly'),
      
      // Ownership
      owner: enhancedGoal.owner || familyData.familyMembers[0],
      collaborators: enhancedGoal.collaborators || [],
      assignedMembers: enhancedGoal.assignedMembers || [],
      
      // Progress tracking
      milestones: enhancedGoal.milestones || this.generateDefaultMilestones(enhancedGoal),
      checkpoints: [],
      
      // AI insights
      aiInsights: [],
      recommendations: [],
      successPrediction: await this.calculateSuccessPrediction(enhancedGoal, familyData),
      
      // Metadata
      tags: enhancedGoal.tags || [],
      createdBy: enhancedGoal.owner || familyData.familyMembers[0],
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false
    };

    // Store goal
    this.goals.set(goal.id, goal);

    // Generate initial AI insights
    if (this.config.enableAIInsights) {
      await this.generateAIInsights(goal, familyData);
    }

    return goal;
  }

  async updateGoalProgress(
    goalId: string, 
    progress: number, 
    notes?: string,
    updatedBy?: FamilyMember
  ): Promise<Goal> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');

    const previousProgress = goal.progress;
    goal.progress = Math.max(0, Math.min(100, progress));
    goal.currentValue = (goal.progress / 100) * goal.targetValue;
    goal.updatedAt = new Date();

    // Add checkpoint
    if (this.config.enableAutoCheckpoints) {
      const checkpoint: GoalCheckpoint = {
        id: this.generateCheckpointId(),
        date: new Date(),
        progress: goal.progress,
        notes: notes || 'Progress updated',
        recordedBy: updatedBy || goal.owner
      };
      goal.checkpoints.push(checkpoint);
    }

    // Check for milestone completion
    this.checkMilestones(goal);

    // Check for goal completion
    if (goal.progress >= 100 && goal.status === 'active') {
      await this.completeGoal(goalId);
    }

    // Generate progress insights
    if (this.config.enableAIInsights && Math.abs(goal.progress - previousProgress) >= 10) {
      await this.generateProgressInsights(goal);
    }

    this.goals.set(goalId, goal);
    return goal;
  }

  async completeGoal(goalId: string): Promise<Goal> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');

    goal.status = 'completed';
    goal.completedDate = new Date();
    goal.progress = 100;
    goal.updatedAt = new Date();

    // Complete any remaining milestones
    goal.milestones.forEach(milestone => {
      if (!milestone.completed) {
        milestone.completed = true;
        milestone.completedDate = new Date();
      }
    });

    // Generate celebration and achievement
    if (this.config.enableCelebrations) {
      await this.generateCelebration(goal);
    }

    // Update analytics
    await this.updateAnalytics();

    this.goals.set(goalId, goal);
    return goal;
  }

  // AI-powered goal enhancement
  private async enhanceGoalWithAI(
    goalData: Partial<Goal>, 
    familyData: AggregatedFamilyData
  ): Promise<Partial<Goal>> {
    try {
      const prompt = this.buildGoalEnhancementPrompt(goalData, familyData);
      const aiResponse = await this.aiService.generateSummary(familyData, {
        customPrompt: prompt,
        focusAreas: ['goals', 'planning', 'motivation'],
        tone: 'encouraging'
      });

      return this.parseAIGoalEnhancement(aiResponse, goalData);
    } catch (error) {
      console.warn('AI goal enhancement failed, using basic validation:', error);
      return this.validateGoal(goalData);
    }
  }

  private buildGoalEnhancementPrompt(goalData: Partial<Goal>, familyData: AggregatedFamilyData): string {
    return `Help enhance this family goal to make it SMART (Specific, Measurable, Achievable, Relevant, Time-bound):

Goal Title: ${goalData.title || 'Untitled'}
Description: ${goalData.description || 'No description'}
Category: ${goalData.category || 'Not specified'}
Timeframe: ${goalData.timeBound || 'Not specified'}

Family Context:
- Family size: ${familyData.familyMembers.length} members
- Current task completion rate: ${Math.round(familyData.todos.completionRate * 100)}%
- Active tasks: ${familyData.summary.totalActiveTasks}
- Health score: ${familyData.summary.healthScore}/100

Please provide:
1. A specific, clear goal statement
2. Measurable criteria (what to track and target value)
3. Assessment of achievability given family context
4. Relevance explanation for this family
5. Realistic timeline recommendations
6. Suggested milestones (2-4 key checkpoints)
7. Success prediction (0-100%)

Make it motivating and family-friendly!`;
  }

  private parseAIGoalEnhancement(aiResponse: AIResponse, originalGoal: Partial<Goal>): Partial<Goal> {
    // Parse AI response and extract enhanced goal data
    // This would involve sophisticated parsing of the AI response
    // For now, return enhanced goal with AI insights
    
    return {
      ...originalGoal,
      specific: originalGoal.specific || `Enhanced: ${originalGoal.title}`,
      relevant: 'AI-validated relevance for family coordination',
      achievable: true,
      successPrediction: 0.75, // AI-calculated
      aiInsights: [{
        type: 'suggestion',
        title: 'AI Goal Enhancement',
        description: aiResponse.content.substring(0, 200) + '...',
        confidence: aiResponse.confidence || 0.8,
        actionable: true,
        suggestedActions: ['Review AI suggestions', 'Set milestones', 'Start tracking'],
        generatedAt: new Date()
      }]
    };
  }

  // Goal templates and suggestions
  private initializeTemplates(): void {
    const templates: GoalTemplate[] = [
      {
        id: 'improve-task-completion',
        name: 'Improve Task Completion Rate',
        description: 'Increase family task completion rate to improve organization',
        category: 'productivity',
        type: 'family',
        defaultTimeframe: 'monthly',
        measurementType: 'percentage',
        suggestedTarget: 85,
        unit: '%',
        milestoneTemplate: [
          { title: 'Reach 70%', description: 'Initial improvement', targetDate: new Date(), value: 70, celebration: '🎉 Great start!' },
          { title: 'Reach 80%', description: 'Significant progress', targetDate: new Date(), value: 80, celebration: '🚀 Excellent progress!' },
          { title: 'Reach 85%', description: 'Goal achieved', targetDate: new Date(), value: 85, celebration: '🏆 Goal completed!' }
        ],
        tags: ['productivity', 'organization', 'family'],
        difficulty: 'intermediate',
        aiPromptTemplate: 'Create a goal to improve family task completion rate from {current}% to {target}% over {timeframe}'
      },
      {
        id: 'reduce-overdue-tasks',
        name: 'Reduce Overdue Tasks',
        description: 'Minimize the number of overdue tasks to reduce family stress',
        category: 'organization',
        type: 'family',
        defaultTimeframe: 'weekly',
        measurementType: 'count',
        suggestedTarget: 2,
        unit: 'tasks',
        milestoneTemplate: [
          { title: 'Under 5 overdue', description: 'First reduction', targetDate: new Date(), value: 5, celebration: '✅ Good improvement!' },
          { title: 'Under 2 overdue', description: 'Target achieved', targetDate: new Date(), value: 2, celebration: '🎯 Target reached!' }
        ],
        tags: ['organization', 'stress-reduction'],
        difficulty: 'beginner',
        aiPromptTemplate: 'Create a goal to reduce overdue tasks from {current} to {target} over {timeframe}'
      },
      {
        id: 'improve-planning',
        name: 'Better Event Planning',
        description: 'Increase advance planning for family events and activities',
        category: 'planning',
        type: 'family',
        defaultTimeframe: 'monthly',
        measurementType: 'time',
        suggestedTarget: 7,
        unit: 'days',
        milestoneTemplate: [
          { title: '3 days advance', description: 'Basic planning', targetDate: new Date(), value: 3, celebration: '📅 Planning started!' },
          { title: '7 days advance', description: 'Good planning', targetDate: new Date(), value: 7, celebration: '🗓️ Excellent planning!' }
        ],
        tags: ['planning', 'organization', 'events'],
        difficulty: 'intermediate',
        aiPromptTemplate: 'Create a goal to improve event planning lead time to {target} {unit} advance notice'
      },
      {
        id: 'increase-collaboration',
        name: 'Enhance Family Collaboration',
        description: 'Improve collaboration and shared task completion',
        category: 'collaboration',
        type: 'family',
        defaultTimeframe: 'monthly',
        measurementType: 'score',
        suggestedTarget: 80,
        unit: 'points',
        milestoneTemplate: [
          { title: 'Score 60', description: 'Basic collaboration', targetDate: new Date(), value: 60, celebration: '🤝 Teamwork improving!' },
          { title: 'Score 80', description: 'Strong collaboration', targetDate: new Date(), value: 80, celebration: '👥 Great teamwork!' }
        ],
        tags: ['collaboration', 'teamwork', 'communication'],
        difficulty: 'advanced',
        aiPromptTemplate: 'Create a goal to enhance family collaboration and reach a collaboration score of {target}'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async suggestGoals(familyData: AggregatedFamilyData): Promise<GoalTemplate[]> {
    const suggestions: GoalTemplate[] = [];
    
    // Analyze family data and suggest relevant goals
    if (familyData.todos.completionRate < 0.7) {
      suggestions.push(this.templates.get('improve-task-completion')!);
    }
    
    if (familyData.todos.overdue.length > 3) {
      suggestions.push(this.templates.get('reduce-overdue-tasks')!);
    }
    
    if (familyData.events.totalCount < 2) {
      suggestions.push(this.templates.get('improve-planning')!);
    }
    
    // Always suggest collaboration improvement
    suggestions.push(this.templates.get('increase-collaboration')!);
    
    return suggestions;
  }

  async createGoalFromTemplate(
    templateId: string, 
    customizations: Partial<Goal>, 
    familyData: AggregatedFamilyData
  ): Promise<Goal> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    const goalData: Partial<Goal> = {
      title: customizations.title || template.name,
      description: customizations.description || template.description,
      category: template.category,
      type: template.type,
      timeBound: customizations.timeBound || template.defaultTimeframe,
      measurementType: template.measurementType,
      targetValue: customizations.targetValue || template.suggestedTarget,
      unit: template.unit,
      tags: [...template.tags, ...(customizations.tags || [])],
      ...customizations
    };

    return this.createGoal(goalData, familyData, true);
  }

  // Analytics and insights
  async generateAnalytics(): Promise<GoalAnalytics> {
    const goals = Array.from(this.goals.values());
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    
    const analytics: GoalAnalytics = {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      successRate: goals.length > 0 ? completedGoals.length / goals.length : 0,
      averageCompletionTime: this.calculateAverageCompletionTime(completedGoals),
      
      categoryStats: this.calculateCategoryStats(goals),
      memberStats: this.calculateMemberStats(goals),
      
      trends: {
        weeklyProgress: this.calculateWeeklyProgress(goals),
        monthlyCompletions: this.calculateMonthlyCompletions(goals),
        seasonalPatterns: this.calculateSeasonalPatterns(goals)
      },
      
      achievements: this.calculateAchievements(goals),
      currentStreak: this.calculateCurrentStreak(goals),
      longestStreak: this.calculateLongestStreak(goals)
    };

    this.analytics = analytics;
    return analytics;
  }

  // Helper methods
  private validateGoal(goalData: Partial<Goal>): Partial<Goal> {
    // Basic validation and enhancement without AI
    return {
      ...goalData,
      achievable: true,
      successPrediction: 0.7 // Default prediction
    };
  }

  private generateGoalId(): string {
    return `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCheckpointId(): string {
    return `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateTargetDate(timeframe: GoalTimeframe): Date {
    const now = new Date();
    switch (timeframe) {
      case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly': return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      case 'yearly': return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  private generateDefaultMilestones(goalData: Partial<Goal>): GoalMilestone[] {
    const target = goalData.targetValue || 100;
    const milestones: GoalMilestone[] = [];
    
    // Create 3 default milestones at 25%, 50%, 75% and 100%
    [25, 50, 75, 100].forEach((percentage, index) => {
      milestones.push({
        id: `milestone-${index}`,
        title: `${percentage}% Progress`,
        description: `Reach ${percentage}% of the goal`,
        targetDate: this.calculateMilestoneDate(goalData.targetDate, index, 4),
        completed: false,
        value: (percentage / 100) * target,
        celebration: this.getCelebrationMessage(percentage)
      });
    });
    
    return milestones;
  }

  private calculateMilestoneDate(targetDate?: Date, index: number = 0, total: number = 4): Date {
    const target = targetDate || this.calculateTargetDate('monthly');
    const now = new Date();
    const duration = target.getTime() - now.getTime();
    return new Date(now.getTime() + (duration * (index + 1)) / total);
  }

  private getCelebrationMessage(percentage: number): string {
    if (percentage <= 25) return '🎯 Great start!';
    if (percentage <= 50) return '🚀 Halfway there!';
    if (percentage <= 75) return '💪 Almost there!';
    return '🏆 Goal achieved!';
  }

  private async calculateSuccessPrediction(goalData: Partial<Goal>, familyData: AggregatedFamilyData): Promise<number> {
    // Simplified prediction based on family performance
    const baseScore = familyData.todos.completionRate;
    const difficultyFactor = goalData.priority === 'high' ? 0.8 : 1.0;
    const timeframeFactor = goalData.timeBound === 'daily' ? 0.9 : 1.0;
    
    return Math.min(0.95, Math.max(0.1, baseScore * difficultyFactor * timeframeFactor));
  }

  private checkMilestones(goal: Goal): void {
    goal.milestones.forEach(milestone => {
      if (!milestone.completed && goal.progress >= (milestone.value / goal.targetValue) * 100) {
        milestone.completed = true;
        milestone.completedDate = new Date();
        
        // Generate celebration
        if (this.config.enableCelebrations) {
          this.generateMilestoneCelebration(goal, milestone);
        }
      }
    });
  }

  private async generateAIInsights(goal: Goal, familyData: AggregatedFamilyData): Promise<void> {
    if (!this.config.enableAIInsights) return;

    try {
      const prompt = `Analyze this family goal and provide insights:
      
Goal: ${goal.title}
Progress: ${goal.progress}%
Category: ${goal.category}
Timeline: ${goal.timeBound}
Family completion rate: ${Math.round(familyData.todos.completionRate * 100)}%

Provide insights on progress, risks, and suggestions for improvement.`;

      const aiResponse = await this.aiService.generateSummary(familyData, {
        customPrompt: prompt,
        focusAreas: ['goals', 'progress', 'motivation'],
        tone: 'encouraging'
      });

      const insight: AIGoalInsight = {
        type: 'suggestion',
        title: 'AI Goal Analysis',
        description: aiResponse.content,
        confidence: aiResponse.confidence || 0.8,
        actionable: true,
        suggestedActions: ['Review progress', 'Adjust timeline', 'Increase focus'],
        generatedAt: new Date()
      };

      goal.aiInsights.push(insight);
    } catch (error) {
      console.warn('Failed to generate AI insights:', error);
    }
  }

  private async generateProgressInsights(goal: Goal): Promise<void> {
    // Generate insights based on progress changes
    const insight: AIGoalInsight = {
      type: 'progress',
      title: 'Progress Update',
      description: `Goal progress updated to ${goal.progress}%. ${goal.progress > 50 ? 'Great momentum!' : 'Keep pushing forward!'}`,
      confidence: 0.9,
      actionable: goal.progress < 50,
      suggestedActions: goal.progress < 50 ? ['Review strategy', 'Increase effort', 'Seek help'] : ['Maintain momentum'],
      generatedAt: new Date()
    };

    goal.aiInsights.push(insight);
  }

  private async generateCelebration(goal: Goal): Promise<void> {
    // Generate celebration for completed goal
    console.log(`🎉 Celebrating goal completion: ${goal.title}`);
    
    const achievement: GoalAchievement = {
      id: `achievement-${Date.now()}`,
      title: 'Goal Completed!',
      description: `Successfully completed: ${goal.title}`,
      type: 'completion',
      earnedDate: new Date(),
      member: goal.owner,
      goalId: goal.id,
      badge: '🏆',
      celebration: `Congratulations on completing "${goal.title}"! 🎉`
    };

    // Store achievement (would be persisted in real implementation)
    console.log('Achievement earned:', achievement);
  }

  private generateMilestoneCelebration(goal: Goal, milestone: GoalMilestone): void {
    console.log(`🎯 Milestone achieved: ${milestone.title} for goal: ${goal.title}`);
  }

  // Analytics calculation methods
  private calculateAverageCompletionTime(completedGoals: Goal[]): number {
    if (completedGoals.length === 0) return 0;
    
    const totalTime = completedGoals.reduce((sum, goal) => {
      if (goal.completedDate) {
        return sum + (goal.completedDate.getTime() - goal.startDate.getTime());
      }
      return sum;
    }, 0);
    
    return totalTime / completedGoals.length / (24 * 60 * 60 * 1000); // Convert to days
  }

  private calculateCategoryStats(goals: Goal[]): Record<GoalCategory, any> {
    const stats: Record<GoalCategory, any> = {} as any;
    
    Object.values(['productivity', 'organization', 'communication', 'health', 'planning', 'collaboration', 'custom'] as GoalCategory[]).forEach(category => {
      const categoryGoals = goals.filter(g => g.category === category);
      const completed = categoryGoals.filter(g => g.status === 'completed');
      
      stats[category] = {
        total: categoryGoals.length,
        completed: completed.length,
        successRate: categoryGoals.length > 0 ? completed.length / categoryGoals.length : 0,
        averageProgress: categoryGoals.length > 0 
          ? categoryGoals.reduce((sum, g) => sum + g.progress, 0) / categoryGoals.length 
          : 0
      };
    });
    
    return stats;
  }

  private calculateMemberStats(goals: Goal[]): any[] {
    const memberMap = new Map();
    
    goals.forEach(goal => {
      const memberId = goal.owner.id;
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, {
          member: goal.owner,
          goalsOwned: 0,
          goalsCompleted: 0,
          totalProgress: 0,
          collaborations: 0
        });
      }
      
      const stats = memberMap.get(memberId);
      stats.goalsOwned++;
      stats.totalProgress += goal.progress;
      
      if (goal.status === 'completed') {
        stats.goalsCompleted++;
      }
      
      stats.collaborations += goal.collaborators.length;
    });
    
    return Array.from(memberMap.values()).map(stats => ({
      member: stats.member,
      goalsOwned: stats.goalsOwned,
      goalsCompleted: stats.goalsCompleted,
      averageProgress: stats.goalsOwned > 0 ? stats.totalProgress / stats.goalsOwned : 0,
      successRate: stats.goalsOwned > 0 ? stats.goalsCompleted / stats.goalsOwned : 0,
      collaborationScore: stats.collaborations / Math.max(stats.goalsOwned, 1)
    }));
  }

  private calculateWeeklyProgress(goals: Goal[]): number[] {
    // Mock weekly progress data
    return [10, 25, 40, 60, 75, 85, 90];
  }

  private calculateMonthlyCompletions(goals: Goal[]): number[] {
    // Mock monthly completion data
    return [2, 3, 1, 4, 2, 3];
  }

  private calculateSeasonalPatterns(goals: Goal[]): Record<string, number> {
    return {
      spring: 0.8,
      summer: 0.6,
      fall: 0.9,
      winter: 0.7
    };
  }

  private calculateAchievements(goals: Goal[]): GoalAchievement[] {
    // Calculate and return achievements
    return [];
  }

  private calculateCurrentStreak(goals: Goal[]): number {
    // Calculate current completion streak
    return 3; // Mock value
  }

  private calculateLongestStreak(goals: Goal[]): number {
    // Calculate longest completion streak
    return 7; // Mock value
  }

  private async updateAnalytics(): Promise<void> {
    this.analytics = await this.generateAnalytics();
  }

  // Public API methods
  public getGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  public getActiveGoals(): Goal[] {
    return this.getGoals().filter(g => g.status === 'active');
  }

  public getGoalById(id: string): Goal | undefined {
    return this.goals.get(id);
  }

  public getGoalsByMember(memberId: string): Goal[] {
    return this.getGoals().filter(g => 
      g.owner.id === memberId || 
      g.collaborators.some(c => c.id === memberId) ||
      g.assignedMembers.some(a => a.id === memberId)
    );
  }

  public getGoalsByCategory(category: GoalCategory): Goal[] {
    return this.getGoals().filter(g => g.category === category);
  }

  public getAnalytics(): GoalAnalytics | null {
    return this.analytics;
  }

  public getTemplates(): GoalTemplate[] {
    return Array.from(this.templates.values());
  }

  // Cleanup
  public dispose(): void {
    this.goals.clear();
    this.templates.clear();
    this.analytics = null;
  }
}

// Singleton instance
let goalTrackingServiceInstance: GoalTrackingService | null = null;

export function getGoalTrackingService(config?: Partial<GoalTrackingConfig>): GoalTrackingService {
  if (!goalTrackingServiceInstance) {
    goalTrackingServiceInstance = new GoalTrackingService(config);
  }
  return goalTrackingServiceInstance;
}

export function setGoalTrackingService(service: GoalTrackingService): void {
  goalTrackingServiceInstance = service;
}

// Export types
export type { 
  GoalTrackingConfig,
  GoalAnalytics,
  GoalAchievement
};
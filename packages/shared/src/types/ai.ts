// AI-related TypeScript interfaces for the FAMAPP Dashboard
import type { FamilyMember } from './core';
import type { Todo } from './todo';
import type { CalendarEvent } from './calendar';
import type { GroceryItem } from './grocery';
import type { FamilyDocument } from './document';

// ===== CORE AI INTERFACES =====

// Enhanced AI Request interface with strict typing
export interface AIRequest {
  prompt: string;
  context?: FamilyContext;
  maxTokens?: number;
  temperature?: number;
  type?: AIRequestType; // Optional for backward compatibility
}

// AI Request types for different use cases
export type AIRequestType = 
  | 'family_summary'
  | 'question_answer'
  | 'alerts_generation'
  | 'trend_analysis'
  | 'general_chat';

// Enhanced AI Response interface
export interface AIResponse {
  content: string;
  type: AIRequestType;
  usage?: TokenUsage;
  model: string;
  timestamp: Date;
  confidence?: number; // 0-1 score for response confidence
  metadata?: AIResponseMetadata;
}

// Token usage information
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost?: number; // USD cost estimate
}

// Additional metadata for AI responses
export interface AIResponseMetadata {
  processingTime: number; // milliseconds
  dataFreshness: Date;
  relevantItems?: string[]; // IDs of items that influenced the response
  suggestions?: ActionSuggestion[];
}

// ===== FAMILY CONTEXT INTERFACES =====

// Comprehensive family context for AI processing
export interface FamilyContext {
  familyData: AggregatedFamilyData;
  userPreferences?: UserPreferences;
  sessionContext?: SessionContext;
  timeContext: TimeContext;
}

// Aggregated family data structure (matches dataAggregationService)
export interface AggregatedFamilyData {
  todos: TodosContext;
  events: EventsContext;
  groceries: GroceriesContext;
  documents: DocumentsContext;
  familyMembers: FamilyMemberInfo[];
  summary: FamilySummary;
}

// Todo context for AI
export interface TodosContext {
  pending: Todo[];
  overdue: Todo[];
  completedRecent: Todo[];
  totalCount: number;
  completionRate: number;
  memberStats: MemberTodoStats[];
  trends?: TodoTrends;
}

// Events context for AI
export interface EventsContext {
  upcoming: CalendarEvent[];
  thisWeek: CalendarEvent[];
  nextWeek: CalendarEvent[];
  totalCount: number;
  memberEvents: MemberEventStats[];
  conflicts?: EventConflict[];
}

// Groceries context for AI
export interface GroceriesContext {
  pending: GroceryItem[];
  urgentItems: GroceryItem[];
  completedRecent: GroceryItem[];
  totalCount: number;
  completionRate: number;
  categoryStats: GroceryCategoryStats[];
  budgetInsights?: BudgetInsights;
}

// Documents context for AI
export interface DocumentsContext {
  recent: FamilyDocument[];
  totalCount: number;
  typeStats: DocumentTypeStats[];
  accessPatterns?: DocumentAccessPattern[];
}

// ===== FAMILY MEMBER INTERFACES =====

// Enhanced family member information
export interface FamilyMemberInfo {
  id: FamilyMember;
  name: string;
  email: string;
  avatar?: string;
  role?: FamilyRole;
  preferences?: MemberPreferences;
}

// Family roles for context
export type FamilyRole = 'parent' | 'child' | 'guardian' | 'other';

// Member preferences
export interface MemberPreferences {
  language: 'en' | 'es';
  timezone: string;
  notificationSettings: NotificationSettings;
  aiPersonality: AIPersonality;
}

// ===== STATISTICS INTERFACES =====

// Member todo statistics
export interface MemberTodoStats {
  member: FamilyMemberInfo;
  pendingTodos: number;
  overdueTodos: number;
  completedThisWeek: number;
  completionRate: number;
  productivity: ProductivityLevel;
  averageCompletionTime?: number; // days
}

// Member event statistics
export interface MemberEventStats {
  member: FamilyMemberInfo;
  upcomingEvents: number;
  eventsThisWeek: number;
  eventTypes: EventType[];
  busyDays: Date[];
}

// Grocery category statistics
export interface GroceryCategoryStats {
  category: string;
  pendingItems: number;
  totalItems: number;
  urgentItems: number;
  averageCost?: number;
  lastPurchase?: Date;
}

// Document type statistics
export interface DocumentTypeStats {
  type: DocumentType;
  count: number;
  recentCount: number;
  averageSize: number;
  lastUploaded?: Date;
}

// ===== INSIGHTS & ANALYTICS INTERFACES =====

// Family summary with AI insights
export interface FamilySummary {
  generatedAt: Date;
  dataFreshness: DataFreshness;
  totalActiveTasks: number;
  urgentItemsCount: number;
  healthScore: number;
  weeklyTrends: WeeklyTrends;
  recommendations: AIRecommendation[];
}

// Data freshness tracking
export interface DataFreshness {
  todos: Date;
  events: Date;
  groceries: Date;
  documents: Date;
  overallStatus: FreshnessStatus;
}

// Weekly trends analysis
export interface WeeklyTrends {
  todoCompletion: TrendData;
  eventScheduling: TrendData;
  groceryShopping: TrendData;
  documentActivity: TrendData;
}

// Trend data structure
export interface TrendData {
  currentWeek: number;
  previousWeek: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'stable';
}

// AI recommendations
export interface AIRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  action: ActionSuggestion;
  priority: 'low' | 'medium' | 'high';
  relevantMembers: FamilyMember[];
  estimatedImpact: 'low' | 'medium' | 'high';
  deadline?: Date;
}

// Action suggestions from AI
export interface ActionSuggestion {
  actionType: ActionType;
  description: string;
  targetItems: string[]; // IDs of items to act on
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
}

// ===== SPECIALIZED INTERFACES =====

// Event conflicts detection
export interface EventConflict {
  conflictId: string;
  events: CalendarEvent[];
  type: ConflictType;
  severity: 'minor' | 'major' | 'critical';
  suggestion: string;
}

// Budget insights for groceries
export interface BudgetInsights {
  weeklyAverage: number;
  monthlyProjection: number;
  categoryBreakdown: CategoryBudget[];
  savingsOpportunities: SavingsOpportunity[];
}

// Category budget breakdown
export interface CategoryBudget {
  category: string;
  spent: number;
  budget?: number;
  trend: 'over' | 'on_track' | 'under';
}

// Savings opportunities
export interface SavingsOpportunity {
  description: string;
  estimatedSavings: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Document access patterns
export interface DocumentAccessPattern {
  documentId: string;
  accessCount: number;
  lastAccessed: Date;
  accessedBy: FamilyMember[];
  popularity: 'high' | 'medium' | 'low';
}

// Todo trends analysis
export interface TodoTrends {
  completionVelocity: number; // todos per day
  averageCompletionTime: number; // days
  procrastinationScore: number; // 0-100
  peakProductivityHours: number[];
}

// ===== CONTEXT INTERFACES =====

// User preferences for AI interactions
export interface UserPreferences {
  language: 'en' | 'es';
  tone: AITone;
  detailLevel: 'brief' | 'standard' | 'detailed';
  focusAreas: FocusArea[];
  notificationFrequency: 'high' | 'medium' | 'low';
}

// Session context for continuity
export interface SessionContext {
  sessionId: string;
  startTime: Date;
  previousQuestions: string[];
  userIntent: UserIntent;
  conversationHistory: ConversationMessage[];
}

// Time context for AI responses
export interface TimeContext {
  currentTime: Date;
  timezone: string;
  dayOfWeek: number;
  isWeekend: boolean;
  timeOfDay: TimeOfDay;
}

// Conversation history
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: Partial<FamilyContext>;
}

// Notification settings
export interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  frequency: NotificationFrequency;
  quietHours: QuietHours;
}

// Quiet hours configuration
export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
}

// ===== ENUMS AND UNION TYPES =====

// Productivity levels
export type ProductivityLevel = 'high' | 'medium' | 'low';

// Event types (inferred from titles)
export type EventType = 
  | 'education'
  | 'medical'
  | 'social'
  | 'work'
  | 'fitness'
  | 'general';

// Document types (inferred from extensions)
export type DocumentType = 
  | 'PDF'
  | 'Word Document'
  | 'Spreadsheet'
  | 'Image'
  | 'Video'
  | 'Other';

// Data freshness status
export type FreshnessStatus = 'fresh' | 'stale' | 'outdated';

// Recommendation types
export type RecommendationType = 
  | 'todo_optimization'
  | 'schedule_conflict'
  | 'budget_alert'
  | 'document_organization'
  | 'family_coordination'
  | 'health_reminder';

// Action types for suggestions
export type ActionType = 
  | 'create_todo'
  | 'reschedule_event'
  | 'buy_groceries'
  | 'organize_documents'
  | 'contact_member'
  | 'review_budget';

// Conflict types for events
export type ConflictType = 
  | 'time_overlap'
  | 'location_conflict'
  | 'resource_conflict'
  | 'member_overload';

// AI personality types
export type AIPersonality = 
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'motivational'
  | 'analytical';

// AI tone preferences
export type AITone = 
  | 'formal'
  | 'casual'
  | 'encouraging'
  | 'direct'
  | 'empathetic';

// Focus areas for AI attention
export type FocusArea = 
  | 'productivity'
  | 'family_time'
  | 'health'
  | 'budget'
  | 'organization'
  | 'planning';

// User intent categories
export type UserIntent = 
  | 'information_seeking'
  | 'task_management'
  | 'planning'
  | 'analysis'
  | 'casual_chat';

// Time of day categories
export type TimeOfDay = 
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night';

// Notification channels
export type NotificationChannel = 
  | 'email'
  | 'push'
  | 'sms'
  | 'in_app';

// Notification frequency
export type NotificationFrequency = 
  | 'instant'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'never';

// ===== UTILITY TYPES =====

// Generic AI error response
export interface AIErrorResponse {
  error: true;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// AI health check response
export interface AIHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number;
  model: string;
  features: AIFeatureStatus[];
}

// AI feature status
export interface AIFeatureStatus {
  feature: string;
  status: 'available' | 'limited' | 'unavailable';
  lastTested: Date;
}

// Performance metrics for AI operations
export interface AIPerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  tokenUsage: {
    total: number;
    average: number;
    peak: number;
  };
  costMetrics: {
    totalCost: number;
    averageCostPerRequest: number;
    dailyBudgetUsed: number;
  };
}

// ===== TYPE GUARDS =====

// Type guard for AI responses
export function isAIResponse(obj: any): obj is AIResponse {
  return obj && 
    typeof obj.content === 'string' &&
    typeof obj.model === 'string' &&
    obj.timestamp instanceof Date;
}

// Type guard for AI errors
export function isAIErrorResponse(obj: any): obj is AIErrorResponse {
  return obj && 
    obj.error === true &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string';
}

// ===== FACTORY INTERFACES =====

// Factory interface for creating AI contexts
export interface AIContextFactory {
  createFamilyContext(data: any): FamilyContext;
  createUserPreferences(member: FamilyMember): UserPreferences;
  createTimeContext(): TimeContext;
}

// Factory interface for AI responses
export interface AIResponseFactory {
  createSummaryResponse(data: AggregatedFamilyData): AIResponse;
  createQuestionResponse(question: string, context: FamilyContext): AIResponse;
  createAlertsResponse(context: FamilyContext): AIResponse;
}
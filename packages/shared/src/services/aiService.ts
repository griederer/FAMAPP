import Anthropic from '@anthropic-ai/sdk';
import type {
  AIRequest,
  AIResponse,
  FamilyContext,
  AggregatedFamilyData,
  AIRequestType,
  TokenUsage,
  AIResponseMetadata,
  ConversationMessage,
  FollowUpContext
} from '../types/ai';

// Configuration interface for AI service
export interface AIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Error types for AI service
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// AI Service class for Claude integration
export class AIService {
  private client: Anthropic;
  private config: AIConfig;

  constructor(config: AIConfig) {
    if (!config.apiKey) {
      throw new AIServiceError(
        'API key is required for AI service',
        'MISSING_API_KEY'
      );
    }

    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 2000,
      temperature: 0.6,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true, // Required for web app usage
    });
  }

  // Generate AI response from prompt
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      
      const response = await this.client.messages.create({
        model: this.config.model!,
        max_tokens: request.maxTokens || this.config.maxTokens!,
        temperature: request.temperature || this.config.temperature,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(request),
          },
        ],
      });

      // Handle response content
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new AIServiceError(
          'Unexpected response content type',
          'INVALID_RESPONSE_TYPE'
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log performance for monitoring
      if (duration > 5000) {
        console.warn(`AI response took ${duration}ms - consider optimization`);
      }

      const usage: TokenUsage = {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        estimatedCost: this.calculateCost(response.usage.input_tokens + response.usage.output_tokens)
      };

      const metadata: AIResponseMetadata = {
        processingTime: duration,
        dataFreshness: new Date(),
        relevantItems: request.context ? this.extractRelevantItems(request.context) : undefined
      };

      return {
        content: content.text,
        type: request.type || 'general_chat',
        usage,
        model: response.model,
        timestamp: new Date(),
        confidence: this.calculateConfidence(content.text),
        metadata
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Generate family dashboard summary with proper typing
  async generateFamilySummary(familyData: AggregatedFamilyData): Promise<AIResponse> {
    const prompt = this.buildFamilySummaryPrompt(familyData);
    
    return this.generateResponse({
      prompt,
      context: { familyData, userPreferences: undefined, sessionContext: undefined, timeContext: this.createTimeContext() },
      maxTokens: 800,
      temperature: 0.6,
      type: 'family_summary'
    });
  }

  // Answer conversational questions about family data
  async answerQuestion(question: string, familyData: AggregatedFamilyData): Promise<AIResponse> {
    return this.answerQuestionWithHistory(question, familyData, []);
  }

  // Answer questions with conversation history for context continuity
  async answerQuestionWithHistory(
    question: string, 
    familyData: AggregatedFamilyData,
    conversationHistory: ConversationMessage[] = []
  ): Promise<AIResponse> {
    const prompt = this.buildQuestionPromptWithHistory(question, familyData, conversationHistory);
    const context = this.createEnhancedContextWithHistory(familyData, question, conversationHistory);
    
    return this.generateResponse({
      prompt,
      context,
      maxTokens: 600,
      temperature: 0.5,
      type: 'question_answer'
    });
  }

  // Generate smart alerts and recommendations
  async generateAlerts(familyData: AggregatedFamilyData): Promise<AIResponse> {
    const prompt = this.buildAlertsPrompt(familyData);
    
    return this.generateResponse({
      prompt,
      context: { familyData, userPreferences: undefined, sessionContext: undefined, timeContext: this.createTimeContext() },
      maxTokens: 400,
      temperature: 0.4,
      type: 'alerts_generation'
    });
  }

  // Build comprehensive prompt with context
  private buildPrompt(request: AIRequest): string {
    let prompt = request.prompt;
    
    if (request.context) {
      prompt += `\n\nContext: ${JSON.stringify(request.context, null, 2)}`;
    }
    
    return prompt;
  }

  // Build family summary prompt with canonical date enforcement
  private buildFamilySummaryPrompt(familyData: AggregatedFamilyData): string {
    // CANONICAL TRUTH - Official dates from school calendar PDF
    const CANONICAL_EVENTS = {
      'holiday': {
        title: 'Holiday',
        date: 'Monday, June 23, 2025',
        time: 'All day',
        verified: true
      },
      'prekinder': {
        title: 'Prekinder & Kinder Academic Meeting',
        date: 'Tuesday, June 24, 2025',
        time: '8:30-9:30 AM',
        verified: true
      },
      'year-1-4': {
        title: 'Year 1-4 Academic Meeting',
        date: 'Wednesday, July 2, 2025', 
        time: '8:30-9:30 AM',
        verified: true
      }
    };

    // Extract and validate key events from database
    const dbEvents = familyData.events.upcoming
      .filter(event => 
        event.title.toLowerCase().includes('holiday') ||
        event.title.toLowerCase().includes('prekinder') ||
        (event.title.toLowerCase().includes('year') && (event.title.includes('1') || event.title.includes('2') || event.title.includes('3') || event.title.includes('4')))
      )
      .map(event => {
        let canonicalInfo = null;
        const titleLower = event.title.toLowerCase();
        
        if (titleLower.includes('holiday')) {
          canonicalInfo = CANONICAL_EVENTS['holiday'];
        } else if (titleLower.includes('prekinder')) {
          canonicalInfo = CANONICAL_EVENTS['prekinder'];
        } else if (titleLower.includes('year')) {
          canonicalInfo = CANONICAL_EVENTS['year-1-4'];
        }
        
        const dbDate = event.startDate.toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        const dbTime = event.allDay ? 'All day' : event.startDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit' 
        });
        
        return {
          title: event.title,
          dbDate,
          dbTime,
          canonicalDate: canonicalInfo?.date || 'Unknown',
          canonicalTime: canonicalInfo?.time || 'Unknown',
          isAccurate: canonicalInfo ? (dbDate === canonicalInfo.date && dbTime === canonicalInfo.time) : false
        };
      });

    return `
You are a helpful family assistant AI. Generate a warm, friendly summary of the family's current status based on the provided data.

CRITICAL: You MUST use ONLY these VERIFIED official dates for school events. IGNORE any conflicting dates in the database:

CANONICAL SCHOOL EVENTS (OFFICIAL CALENDAR):
- Holiday: Monday, June 23, 2025 (all day)
- Prekinder & Kinder Academic Meeting: Tuesday, June 24, 2025 at 8:30-9:30 AM  
- Year 1-4 Academic Meeting: Wednesday, July 2, 2025 at 8:30-9:30 AM

DATABASE VALIDATION STATUS:
${JSON.stringify(dbEvents, null, 2)}

INSTRUCTIONS:
1. Always use the CANONICAL dates above, never the database dates for school events
2. If database shows different dates, ignore them completely
3. For school events, say: "According to the official school calendar..."
4. Provide a brief overview of pending todos and their urgency
5. List upcoming events using ONLY canonical dates for school events
6. Mention outstanding grocery items that need attention
7. Note any patterns or trends you observe
8. Give 2-3 actionable recommendations for better family organization

VALIDATION CHECK:
- If any school event date in your response doesn't match the canonical dates above, you made an error
- Holiday must be "Monday, June 23, 2025"
- Prekinder meeting must be "Tuesday, June 24, 2025 at 8:30-9:30 AM"
- Year 1-4 meeting must be "Wednesday, July 2, 2025 at 8:30-9:30 AM"

Family Data (USE FOR NON-SCHOOL EVENTS ONLY):
${JSON.stringify(familyData, null, 2)}

Respond in a natural, conversational tone. ALWAYS prioritize canonical calendar dates over database dates for school events.
`;
  }

  // Build question-answering prompt with enhanced context analysis
  private buildQuestionPrompt(question: string, familyData: AggregatedFamilyData): string {
    return this.buildQuestionPromptWithHistory(question, familyData, []);
  }

  // Build question-answering prompt with conversation history
  private buildQuestionPromptWithHistory(
    question: string, 
    familyData: AggregatedFamilyData,
    conversationHistory: ConversationMessage[]
  ): string {
    const questionType = this.analyzeQuestionType(question);
    const relevantData = this.extractRelevantDataForQuestion(question, familyData);
    const timeContext = this.createTimeContext();
    const followUpContext = this.analyzeFollowUpContext(question, conversationHistory);
    
    let conversationSection = '';
    if (conversationHistory.length > 0) {
      conversationSection = `
CONVERSATION HISTORY:
${this.formatConversationHistory(conversationHistory)}

FOLLOW-UP ANALYSIS:
- Is follow-up question: ${followUpContext.isFollowUp}
- References previous topic: ${followUpContext.referencesPrevious}
- Context continuation: ${followUpContext.contextType}
- Previous focus areas: ${followUpContext.previousFocusAreas.join(', ')}
`;
    }

    return `
You are a helpful family assistant AI with deep understanding of family organization patterns and conversation continuity.

CURRENT QUESTION: ${question}

QUESTION TYPE: ${questionType.type} (${questionType.confidence}% confidence)
FOCUS AREAS: ${questionType.focusAreas.join(', ')}
${conversationSection}
TIME CONTEXT:
- Current time: ${timeContext.currentTime.toLocaleString()}
- Day of week: ${this.getDayName(timeContext.dayOfWeek)}
- Time of day: ${timeContext.timeOfDay}
- Is weekend: ${timeContext.isWeekend}

RELEVANT FAMILY DATA:
${JSON.stringify(relevantData, null, 2)}

ANSWERING GUIDELINES:
1. Be conversational and warm, like a family friend
2. Maintain conversation continuity - reference previous questions when relevant
3. Use follow-up context to provide more targeted responses
4. Focus on actionable insights rather than just data
5. Consider time context (e.g., "this week", "today", "upcoming")
6. If trends are relevant, mention patterns you observe
7. Be specific with numbers, dates, and family member names
8. For follow-up questions, build upon previous answers
9. If clarification is needed, refer to what was discussed before
10. For productivity questions, consider workload balance across family
11. For scheduling questions, consider conflicts and time management

${conversationHistory.length > 0 ? 
  'Build upon the conversation context and provide a natural continuation of our discussion.' :
  'Provide a helpful, accurate answer that demonstrates understanding of family dynamics and organization needs.'
}
`;
  }

  // Build alerts and recommendations prompt
  private buildAlertsPrompt(familyData: AggregatedFamilyData): string {
    return `
You are a helpful family assistant AI. Analyze the family data and identify:

1. URGENT items that need immediate attention (overdue tasks, upcoming deadlines)
2. IMPORTANT patterns that suggest actionable improvements
3. RECOMMENDATIONS for better family organization

Focus on the most critical 2-3 items. Be specific and actionable.

Family Data:
${JSON.stringify(familyData, null, 2)}

Format your response as brief, actionable alerts. Use a supportive but direct tone.
`;
  }

  // Comprehensive error handling
  private handleError(error: any): never {
    console.error('AI Service Error:', error);

    // Handle specific Anthropic API errors
    if (error.status === 401) {
      throw new AIServiceError(
        'Invalid API key - please check your Claude API configuration',
        'INVALID_API_KEY',
        error
      );
    }

    if (error.status === 429) {
      throw new AIServiceError(
        'Rate limit exceeded - please try again later',
        'RATE_LIMIT_EXCEEDED',
        error
      );
    }

    if (error.status === 400) {
      throw new AIServiceError(
        'Invalid request format - please check your input',
        'INVALID_REQUEST',
        error
      );
    }

    if (error.status >= 500) {
      throw new AIServiceError(
        'Claude API service temporarily unavailable',
        'SERVICE_UNAVAILABLE',
        error
      );
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new AIServiceError(
        'Network connection failed - please check your internet connection',
        'NETWORK_ERROR',
        error
      );
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
      throw new AIServiceError(
        'Request timed out - please try again',
        'TIMEOUT_ERROR',
        error
      );
    }

    // Generic error fallback
    throw new AIServiceError(
      'An unexpected error occurred while processing AI request',
      'UNKNOWN_ERROR',
      error
    );
  }

  // Health check for AI service
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.generateResponse({
        prompt: 'Respond with "OK" if you can process this message.',
        maxTokens: 10,
        type: 'general_chat'
      });
      
      return response.content.trim().toLowerCase().includes('ok');
    } catch (error) {
      console.error('AI Service health check failed:', error);
      return false;
    }
  }

  // Calculate estimated cost for token usage (Claude pricing)
  private calculateCost(totalTokens: number): number {
    // Claude 3 Haiku pricing: $0.25 per million input tokens, $1.25 per million output tokens
    // Simplified calculation: average $0.75 per million tokens
    return (totalTokens / 1_000_000) * 0.75;
  }

  // Calculate confidence score based on response characteristics
  private calculateConfidence(content: string): number {
    // Simple heuristic: longer, structured responses tend to be more confident
    const length = content.length;
    const hasStructure = content.includes('1.') || content.includes('•') || content.includes('-');
    const hasUncertainty = content.toLowerCase().includes('not sure') || 
                          content.toLowerCase().includes('might') ||
                          content.toLowerCase().includes('possibly');
    
    let confidence = 0.8; // base confidence
    
    if (length > 200) confidence += 0.1;
    if (hasStructure) confidence += 0.05;
    if (hasUncertainty) confidence -= 0.15;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Extract relevant item IDs from context for metadata
  private extractRelevantItems(context: FamilyContext): string[] {
    const items: string[] = [];
    
    if (context.familyData) {
      // Extract recent todo IDs
      context.familyData.todos.pending.slice(0, 5).forEach(todo => items.push(todo.id));
      context.familyData.todos.overdue.forEach(todo => items.push(todo.id));
      
      // Extract upcoming event IDs
      context.familyData.events.upcoming.slice(0, 3).forEach(event => items.push(event.id));
      
      // Extract urgent grocery IDs
      context.familyData.groceries.urgentItems.forEach(item => items.push(item.id));
    }
    
    return items;
  }

  // Create time context for AI requests
  private createTimeContext() {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    return {
      currentTime: now,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dayOfWeek: now.getDay(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      timeOfDay
    };
  }

  // Analyze question type and intent
  private analyzeQuestionType(question: string): { type: string; confidence: number; focusAreas: string[] } {
    const lowerQuestion = question.toLowerCase();
    const patterns = {
      schedule: {
        keywords: ['when', 'schedule', 'event', 'calendar', 'appointment', 'meeting', 'upcoming', 'next week', 'this week', 'today', 'tomorrow'],
        confidence: 85
      },
      tasks: {
        keywords: ['task', 'todo', 'complete', 'pending', 'overdue', 'deadline', 'finish', 'done', 'assigned'],
        confidence: 90
      },
      groceries: {
        keywords: ['grocery', 'shopping', 'store', 'buy', 'purchase', 'food', 'ingredient', 'meal'],
        confidence: 95
      },
      productivity: {
        keywords: ['productive', 'progress', 'performance', 'efficiency', 'workload', 'balance', 'busy'],
        confidence: 80
      },
      family: {
        keywords: ['family', 'member', 'gonzalo', 'mpaz', 'borja', 'melody', 'dad', 'mom', 'son', 'daughter'],
        confidence: 85
      },
      general: {
        keywords: ['what', 'how', 'why', 'help', 'suggest', 'recommend', 'overview', 'status'],
        confidence: 70
      }
    };

    let bestMatch = { type: 'general', confidence: 50, focusAreas: ['general'] };
    const focusAreas: string[] = [];

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = pattern.keywords.filter(keyword => lowerQuestion.includes(keyword));
      if (matches.length > 0) {
        const confidence = Math.min(pattern.confidence + (matches.length - 1) * 5, 95);
        if (confidence > bestMatch.confidence) {
          bestMatch = { type, confidence, focusAreas: [type] };
        }
        if (matches.length > 0) {
          focusAreas.push(type);
        }
      }
    }

    return {
      type: bestMatch.type,
      confidence: bestMatch.confidence,
      focusAreas: focusAreas.length > 0 ? focusAreas : ['general']
    };
  }

  // Extract only data relevant to the specific question
  private extractRelevantDataForQuestion(question: string, familyData: AggregatedFamilyData): any {
    const questionType = this.analyzeQuestionType(question);
    const lowerQuestion = question.toLowerCase();
    
    const relevantData: any = {
      summary: familyData.summary,
      timeContext: this.createTimeContext()
    };

    // Include todos data if question is about tasks
    if (questionType.focusAreas.includes('tasks') || 
        lowerQuestion.includes('task') || lowerQuestion.includes('todo')) {
      relevantData.todos = {
        pending: familyData.todos.pending.slice(0, 10), // Recent pending
        overdue: familyData.todos.overdue,
        completedRecent: familyData.todos.completedRecent.slice(0, 5),
        totalCount: familyData.todos.totalCount,
        completionRate: familyData.todos.completionRate,
        memberStats: familyData.todos.memberStats
      };
    }

    // Include events data if question is about schedule/calendar
    if (questionType.focusAreas.includes('schedule') || 
        lowerQuestion.includes('event') || lowerQuestion.includes('calendar') ||
        lowerQuestion.includes('when') || lowerQuestion.includes('upcoming')) {
      relevantData.events = {
        thisWeek: familyData.events.thisWeek,
        nextWeek: familyData.events.nextWeek,
        upcoming: familyData.events.upcoming.slice(0, 10), // Next 10 events
        totalCount: familyData.events.totalCount,
        memberEvents: familyData.events.memberEvents
      };
    }

    // Include groceries data if question is about shopping/food
    if (questionType.focusAreas.includes('groceries') || 
        lowerQuestion.includes('grocery') || lowerQuestion.includes('shopping') ||
        lowerQuestion.includes('food') || lowerQuestion.includes('buy')) {
      relevantData.groceries = {
        pending: familyData.groceries.pending.slice(0, 10),
        urgentItems: familyData.groceries.urgentItems,
        completedRecent: familyData.groceries.completedRecent.slice(0, 5),
        totalCount: familyData.groceries.totalCount,
        completionRate: familyData.groceries.completionRate,
        categoryStats: familyData.groceries.categoryStats
      };
    }

    // For productivity/family questions, include member-specific data
    if (questionType.focusAreas.includes('productivity') || 
        questionType.focusAreas.includes('family') ||
        lowerQuestion.includes('productive') || lowerQuestion.includes('family')) {
      relevantData.memberStats = {
        todoStats: familyData.todos.memberStats,
        eventStats: familyData.events.memberEvents
      };
      relevantData.familyMembers = familyData.familyMembers;
    }

    // Always include summary for context
    return relevantData;
  }

  // Create enhanced context with question analysis
  private createEnhancedContext(familyData: AggregatedFamilyData, question: string): FamilyContext {
    const timeContext = this.createTimeContext();
    const questionAnalysis = this.analyzeQuestionType(question);
    
    return {
      familyData,
      userPreferences: {
        language: 'en', // Could be dynamic based on user settings
        timezone: timeContext.timezone,
        preferredTimeFormat: '12h'
      },
      sessionContext: {
        currentQuestion: question,
        questionType: questionAnalysis.type,
        focusAreas: questionAnalysis.focusAreas,
        requestTimestamp: new Date()
      },
      timeContext
    };
  }

  // Helper to get day name from day number
  private getDayName(dayNumber: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Unknown';
  }

  // Analyze follow-up context for conversation continuity
  private analyzeFollowUpContext(
    question: string, 
    conversationHistory: ConversationMessage[]
  ): FollowUpContext {
    if (conversationHistory.length === 0) {
      return {
        isFollowUp: false,
        referencesPrevious: false,
        contextType: 'new_conversation',
        previousFocusAreas: []
      };
    }

    const lowerQuestion = question.toLowerCase();
    const followUpIndicators = [
      'what about', 'and what', 'also', 'additionally', 'furthermore',
      'can you also', 'tell me more', 'more details', 'expand on',
      'elaborate', 'that', 'those', 'they', 'it', 'this', 'these'
    ];

    const clarificationIndicators = [
      'why', 'how', 'when', 'where', 'what do you mean',
      'can you explain', 'clarify', 'specify', 'details about'
    ];

    const contrastIndicators = [
      'instead', 'rather', 'but what about', 'compared to',
      'difference', 'versus', 'vs', 'alternatively'
    ];

    const isFollowUp = followUpIndicators.some(indicator => lowerQuestion.includes(indicator));
    const isClarification = clarificationIndicators.some(indicator => lowerQuestion.includes(indicator));
    const isContrast = contrastIndicators.some(indicator => lowerQuestion.includes(indicator));

    // Analyze previous focus areas
    const previousFocusAreas: string[] = [];
    const recentMessages = conversationHistory.slice(-4); // Last 4 messages
    
    recentMessages.forEach(message => {
      if (message.role === 'user') {
        const questionType = this.analyzeQuestionType(message.content);
        previousFocusAreas.push(...questionType.focusAreas);
      }
    });

    let contextType: 'new_conversation' | 'follow_up' | 'clarification' | 'topic_change' | 'continuation';
    
    if (isClarification) {
      contextType = 'clarification';
    } else if (isContrast) {
      contextType = 'topic_change';
    } else if (isFollowUp) {
      contextType = 'follow_up';
    } else {
      // Check if current question relates to previous topics
      const currentQuestionType = this.analyzeQuestionType(question);
      const hasOverlap = currentQuestionType.focusAreas.some(area => 
        previousFocusAreas.includes(area)
      );
      contextType = hasOverlap ? 'continuation' : 'topic_change';
    }

    return {
      isFollowUp: isFollowUp || isClarification,
      referencesPrevious: isFollowUp || isClarification || contextType === 'continuation',
      contextType,
      previousFocusAreas: [...new Set(previousFocusAreas)] // Remove duplicates
    };
  }

  // Format conversation history for prompt inclusion
  private formatConversationHistory(conversationHistory: ConversationMessage[]): string {
    const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
    
    return recentHistory
      .map(message => {
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        const role = message.role === 'user' ? 'Family Member' : 'Assistant';
        return `[${timestamp}] ${role}: ${message.content}`;
      })
      .join('\n');
  }

  // Create enhanced context with conversation history
  private createEnhancedContextWithHistory(
    familyData: AggregatedFamilyData, 
    question: string,
    conversationHistory: ConversationMessage[]
  ): FamilyContext {
    const timeContext = this.createTimeContext();
    const questionAnalysis = this.analyzeQuestionType(question);
    const followUpContext = this.analyzeFollowUpContext(question, conversationHistory);
    
    return {
      familyData,
      userPreferences: {
        language: 'en',
        timezone: timeContext.timezone,
        preferredTimeFormat: '12h'
      },
      sessionContext: {
        currentQuestion: question,
        questionType: questionAnalysis.type,
        focusAreas: questionAnalysis.focusAreas,
        requestTimestamp: new Date(),
        conversationHistory: conversationHistory.slice(-10), // Keep last 10 messages
        previousQuestions: conversationHistory
          .filter(msg => msg.role === 'user')
          .slice(-5) // Last 5 user questions
          .map(msg => msg.content)
      },
      timeContext
    };
  }

  // Get current configuration
  getConfig(): Omit<AIConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }
}

// Factory function for creating AI service instance
export function createAIService(config: AIConfig): AIService {
  return new AIService(config);
}

// Singleton instance (will be configured in web app)
let aiServiceInstance: AIService | null = null;

export function setAIService(service: AIService): void {
  aiServiceInstance = service;
}

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    throw new AIServiceError(
      'AI service not initialized - call setAIService first',
      'SERVICE_NOT_INITIALIZED'
    );
  }
  return aiServiceInstance;
}
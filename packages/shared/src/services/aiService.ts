import Anthropic from '@anthropic-ai/sdk';

// Configuration interface for AI service
export interface AIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Request interface for AI prompts
export interface AIRequest {
  prompt: string;
  context?: any;
  maxTokens?: number;
  temperature?: number;
}

// Response interface for AI completions
export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  timestamp: Date;
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
      model: 'claude-3-haiku-20240307',
      maxTokens: 1000,
      temperature: 0.7,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
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

      return {
        content: content.text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        model: response.model,
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Generate family dashboard summary
  async generateFamilySummary(familyData: any): Promise<AIResponse> {
    const prompt = this.buildFamilySummaryPrompt(familyData);
    
    return this.generateResponse({
      prompt,
      context: familyData,
      maxTokens: 800,
      temperature: 0.6,
    });
  }

  // Answer conversational questions about family data
  async answerQuestion(question: string, familyData: any): Promise<AIResponse> {
    const prompt = this.buildQuestionPrompt(question, familyData);
    
    return this.generateResponse({
      prompt,
      context: { question, familyData },
      maxTokens: 600,
      temperature: 0.5,
    });
  }

  // Generate smart alerts and recommendations
  async generateAlerts(familyData: any): Promise<AIResponse> {
    const prompt = this.buildAlertsPrompt(familyData);
    
    return this.generateResponse({
      prompt,
      context: familyData,
      maxTokens: 400,
      temperature: 0.4,
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

  // Build family summary prompt
  private buildFamilySummaryPrompt(familyData: any): string {
    return `
You are a helpful family assistant AI. Generate a warm, friendly summary of the family's current status based on the provided data.

Please analyze the family data and provide:
1. A brief overview of pending todos and their urgency
2. Upcoming events in the next 2 weeks
3. Outstanding grocery items that need attention
4. Any patterns or trends you notice
5. 2-3 actionable recommendations for better family organization

Keep the tone casual and supportive, like a family friend helping out. Focus on what's most important and actionable.

Family Data:
${JSON.stringify(familyData, null, 2)}

Respond in a natural, conversational tone as if speaking directly to the family.
`;
  }

  // Build question-answering prompt
  private buildQuestionPrompt(question: string, familyData: any): string {
    return `
You are a helpful family assistant AI. Answer the following question about the family's data.

Question: ${question}

Family Data:
${JSON.stringify(familyData, null, 2)}

Provide a helpful, accurate answer based only on the available data. If you don't have enough information, say so politely and suggest what additional information might be helpful.

Keep your response conversational and friendly.
`;
  }

  // Build alerts and recommendations prompt
  private buildAlertsPrompt(familyData: any): string {
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
      });
      
      return response.content.trim().toLowerCase().includes('ok');
    } catch (error) {
      console.error('AI Service health check failed:', error);
      return false;
    }
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
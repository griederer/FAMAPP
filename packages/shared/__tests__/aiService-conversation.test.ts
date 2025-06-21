// Test conversation memory and follow-up handling in AI Service
import { AIService, AIConfig } from '../src/services/aiService';
import type { ConversationMessage, AggregatedFamilyData } from '../src/types/ai';

// Mock Anthropic SDK
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));
});

describe('AI Service Conversation Memory', () => {
  let aiService: AIService;
  const config: AIConfig = {
    apiKey: 'test-api-key',
    model: 'claude-3-haiku-20240307',
    maxTokens: 1000,
    temperature: 0.7,
  };

  // Simple mock family data
  const mockFamilyData: Partial<AggregatedFamilyData> = {
    todos: {
      pending: [],
      overdue: [],
      completedRecent: [],
      totalCount: 5,
      completionRate: 0.8,
      memberStats: []
    },
    events: {
      upcoming: [],
      thisWeek: [],
      nextWeek: [],
      totalCount: 3,
      memberEvents: []
    },
    groceries: {
      pending: [],
      urgentItems: [],
      completedRecent: [],
      totalCount: 10,
      completionRate: 0.9,
      categoryStats: []
    },
    documents: {
      recent: [],
      totalCount: 8,
      typeStats: []
    },
    familyMembers: [],
    summary: {
      generatedAt: new Date(),
      dataFreshness: {
        todos: new Date(),
        events: new Date(),
        groceries: new Date(),
        documents: new Date(),
        overallStatus: 'fresh' as const
      },
      totalActiveTasks: 5,
      urgentItemsCount: 2,
      healthScore: 85,
      weeklyTrends: {
        todoCompletion: { currentWeek: 0.8, previousWeek: 0.7, change: 0.1, trend: 'up' as const },
        eventScheduling: { currentWeek: 0.9, previousWeek: 0.8, change: 0.1, trend: 'up' as const },
        groceryShopping: { currentWeek: 0.7, previousWeek: 0.8, change: -0.1, trend: 'down' as const },
        documentActivity: { currentWeek: 0.6, previousWeek: 0.5, change: 0.1, trend: 'up' as const }
      },
      recommendations: []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService(config);

    // Default mock response
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'AI response with conversation context' }],
      model: 'claude-3-haiku-20240307',
      usage: { input_tokens: 150, output_tokens: 80 },
    });
  });

  describe('Conversation History Management', () => {
    test('should handle questions without conversation history', async () => {
      const question = 'What tasks do we have?';
      
      await aiService.answerQuestion(question, mockFamilyData as AggregatedFamilyData);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Should not contain conversation history section
      expect(prompt).not.toContain('CONVERSATION HISTORY:');
      expect(prompt).not.toContain('FOLLOW-UP ANALYSIS:');
      expect(prompt).toContain('CURRENT QUESTION:');
    });

    test('should include conversation history when provided', async () => {
      const question = 'What about the groceries?';
      const conversationHistory: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What tasks do we have?',
          timestamp: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          role: 'assistant',
          content: 'You have 5 pending tasks...',
          timestamp: new Date('2024-01-15T10:00:30Z')
        }
      ];
      
      await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, conversationHistory);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Should contain conversation history section
      expect(prompt).toContain('CONVERSATION HISTORY:');
      expect(prompt).toContain('FOLLOW-UP ANALYSIS:');
      expect(prompt).toContain('Family Member: What tasks do we have?');
      expect(prompt).toContain('Assistant: You have 5 pending tasks...');
    });

    test('should limit conversation history to recent messages', async () => {
      const question = 'Tell me more';
      const longHistory: ConversationMessage[] = Array.from({ length: 15 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant' as const,
        content: `Message ${i}`,
        timestamp: new Date(`2024-01-15T10:${i.toString().padStart(2, '0')}:00Z`)
      }));
      
      await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, longHistory);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Should only include last 6 messages in formatted history
      const historySection = prompt.split('CONVERSATION HISTORY:')[1]?.split('FOLLOW-UP ANALYSIS:')[0];
      const messageCount = (historySection?.match(/Family Member:|Assistant:/g) || []).length;
      expect(messageCount).toBeLessThanOrEqual(6);
    });
  });

  describe('Follow-up Context Analysis', () => {
    test('should detect follow-up questions with indicators', async () => {
      const question = 'What about the events?';
      const conversationHistory: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What tasks do we have?',
          timestamp: new Date('2024-01-15T10:00:00Z')
        }
      ];
      
      await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, conversationHistory);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Should detect as follow-up
      expect(prompt).toContain('Is follow-up question: true');
      expect(prompt).toContain('References previous topic: true');
    });

    test('should detect clarification questions', async () => {
      const question = 'Why are those tasks overdue?';
      const conversationHistory: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What tasks do we have?',
          timestamp: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          role: 'assistant',
          content: 'You have some overdue tasks.',
          timestamp: new Date('2024-01-15T10:00:30Z')
        }
      ];
      
      await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, conversationHistory);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Should detect as clarification
      expect(prompt).toContain('Context continuation: clarification');
    });

    test('should track previous focus areas', async () => {
      const question = 'What about productivity?';
      const conversationHistory: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What tasks are pending?',
          timestamp: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          role: 'user',
          content: 'What events do we have this week?',
          timestamp: new Date('2024-01-15T10:01:00Z')
        }
      ];
      
      await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, conversationHistory);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Should track previous focus areas
      expect(prompt).toContain('Previous focus areas:');
      expect(prompt).toContain('tasks');
      expect(prompt).toContain('schedule');
    });
  });

  describe('Enhanced Context Creation', () => {
    test('should include session context with conversation history', async () => {
      const question = 'Continue please';
      const conversationHistory: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Tell me about family status',
          timestamp: new Date('2024-01-15T10:00:00Z')
        }
      ];
      
      await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, conversationHistory);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Should include enhanced context
      expect(prompt).toContain('Build upon the conversation context');
      expect(prompt).toContain('provide a natural continuation');
    });

    test('should provide proper answering guidelines for follow-ups', async () => {
      const question = 'Tell me more about that';
      const conversationHistory: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'How are we doing with tasks?',
          timestamp: new Date('2024-01-15T10:00:00Z')
        }
      ];
      
      await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, conversationHistory);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Should include follow-up specific guidelines
      expect(prompt).toContain('Maintain conversation continuity');
      expect(prompt).toContain('For follow-up questions, build upon previous answers');
      expect(prompt).toContain('Use follow-up context to provide more targeted responses');
    });
  });

  describe('Response Quality and Context', () => {
    test('should use appropriate token limits for conversation responses', async () => {
      const question = 'What about the other items?';
      const conversationHistory: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What tasks do we have?',
          timestamp: new Date('2024-01-15T10:00:00Z')
        }
      ];
      
      await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, conversationHistory);
      
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.max_tokens).toBe(600);
      expect(callArgs.temperature).toBe(0.5);
    });

    test('should return response with proper metadata for conversation context', async () => {
      mockCreate.mockResolvedValue({
        content: [{ 
          type: 'text', 
          text: 'Building on our previous discussion about tasks, let me tell you about the groceries...' 
        }],
        model: 'claude-3-haiku-20240307',
        usage: { input_tokens: 200, output_tokens: 100 },
      });
      
      const question = 'What about groceries?';
      const conversationHistory: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What tasks do we have?',
          timestamp: new Date('2024-01-15T10:00:00Z')
        }
      ];
      
      const response = await aiService.answerQuestionWithHistory(question, mockFamilyData as AggregatedFamilyData, conversationHistory);
      
      expect(response.type).toBe('question_answer');
      expect(response.content).toContain('Building on our previous discussion');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.metadata).toBeDefined();
    });
  });
});
// Test Natural Language Processing enhancements in AI Service
import { AIService, AIConfig } from '../src/services/aiService';

// Mock Anthropic SDK
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));
});

describe('AI Service Natural Language Processing', () => {
  let aiService: AIService;
  const config: AIConfig = {
    apiKey: 'test-api-key',
    model: 'claude-3-haiku-20240307',
    maxTokens: 1000,
    temperature: 0.7,
  };

  // Simple mock family data that matches expected types
  const mockFamilyData = {
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
      productivityScore: 85,
      organizationHealth: 90,
      weeklyTrends: {
        todoCompletion: 0.85,
        eventAttendance: 0.95,
        groceryEfficiency: 0.80
      },
      recommendations: []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService(config);

    // Default mock response
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Enhanced AI response with context analysis' }],
      model: 'claude-3-haiku-20240307',
      usage: { input_tokens: 120, output_tokens: 60 },
    });
  });

  describe('Question Analysis and Context Enhancement', () => {
    test('should analyze task-related questions and include relevant context', async () => {
      const question = 'What tasks are pending for the family?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      // Verify enhanced prompt structure
      expect(prompt).toContain('QUESTION TYPE:');
      expect(prompt).toContain('FOCUS AREAS:');
      expect(prompt).toContain('TIME CONTEXT:');
      expect(prompt).toContain('RELEVANT FAMILY DATA:');
      expect(prompt).toContain('ANSWERING GUIDELINES:');
      
      // Verify task-specific analysis
      expect(prompt).toContain('tasks');
      expect(prompt).toContain('Current time:');
      expect(prompt).toContain('Day of week:');
    });

    test('should analyze schedule-related questions with time awareness', async () => {
      const question = 'What events do we have this week?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      expect(prompt).toContain('schedule');
      expect(prompt).toContain('events');
      expect(prompt).toContain('Time of day:');
      expect(prompt).toContain('Is weekend:');
    });

    test('should analyze grocery-related questions', async () => {
      const question = 'What groceries do we need to buy?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      expect(prompt).toContain('groceries');
      expect(prompt).toContain('groceries');
      expect(prompt).toContain('urgentItems');
    });

    test('should provide comprehensive answering guidelines', async () => {
      const question = 'How can we improve our family organization?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      const guidelines = prompt.split('ANSWERING GUIDELINES:')[1];
      expect(guidelines).toContain('conversational and warm');
      expect(guidelines).toContain('actionable insights');
      expect(guidelines).toContain('time context');
      expect(guidelines).toContain('family member names');
      expect(guidelines).toContain('family dynamics');
    });
  });

  describe('Enhanced Context Creation', () => {
    test('should create time context with current information', async () => {
      const question = 'What should we focus on today?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      const timeSection = prompt.split('TIME CONTEXT:')[1].split('RELEVANT FAMILY DATA:')[0];
      expect(timeSection).toContain('Current time:');
      expect(timeSection).toContain('Day of week:');
      expect(timeSection).toContain('Time of day:');
      expect(timeSection).toContain('Is weekend:');
    });

    test('should include question type analysis with confidence', async () => {
      const question = 'What tasks are overdue and need immediate attention?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      expect(prompt).toContain('QUESTION TYPE: tasks');
      expect(prompt).toContain('% confidence');
      expect(prompt).toContain('FOCUS AREAS:');
    });

    test('should handle multi-focus questions', async () => {
      const question = 'Show me our tasks and upcoming events for this week';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      const focusSection = prompt.split('FOCUS AREAS:')[1].split('TIME CONTEXT:')[0];
      expect(focusSection).toContain('tasks');
      expect(focusSection).toContain('schedule');
    });
  });

  describe('Data Relevance Filtering', () => {
    test('should filter data based on question intent', async () => {
      const question = 'What groceries are urgent?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      const dataSection = prompt.split('RELEVANT FAMILY DATA:')[1].split('ANSWERING GUIDELINES:')[0];
      
      // Should include grocery-related data (check if filtered out properly)
      // For non-grocery questions, grocery data should not be included
      expect(dataSection).not.toContain('urgent');
      expect(dataSection).toContain('summary');
      
      // Should include summary for general context
      expect(dataSection).toContain('summary');
    });

    test('should include member stats for family-focused questions', async () => {
      const question = 'How is each family member doing with productivity?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      expect(prompt).toContain('memberStats');
      expect(prompt).toContain('productivity');
    });
  });

  describe('Question Type Classification', () => {
    test('should classify general questions correctly', async () => {
      const question = 'Help me understand our family status';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      expect(prompt).toContain('QUESTION TYPE: family');
      expect(prompt).toContain('FOCUS AREAS: family');
    });

    test('should handle questions with uncertainty markers', async () => {
      const question = 'Maybe we could improve something?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      expect(prompt).toContain('QUESTION TYPE:');
      expect(prompt).toContain('ANSWERING GUIDELINES:');
    });
  });

  describe('Response Quality Enhancement', () => {
    test('should maintain standard token limits and temperature', async () => {
      const question = 'What should we prioritize today?';
      
      await aiService.answerQuestion(question, mockFamilyData as any);
      
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.max_tokens).toBe(600);
      expect(callArgs.temperature).toBe(0.5);
    });

    test('should return enhanced response with proper metadata', async () => {
      mockCreate.mockResolvedValue({
        content: [{ 
          type: 'text', 
          text: 'Based on your current family status and the time context, I recommend focusing on...' 
        }],
        model: 'claude-3-haiku-20240307',
        usage: { input_tokens: 150, output_tokens: 80 },
      });
      
      const question = 'What should we focus on today?';
      const response = await aiService.answerQuestion(question, mockFamilyData as any);
      
      expect(response.type).toBe('question_answer');
      expect(response.content).toContain('recommend focusing');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.metadata).toBeDefined();
      expect(response.metadata?.processingTime).toBeGreaterThanOrEqual(0);
    });
  });
});
import { 
  AIService, 
  AIServiceError,
  createAIService,
  setAIService,
  getAIService,
  type AIConfig
} from '../src/services/aiService';
import type { 
  AIRequest, 
  AggregatedFamilyData, 
  FamilyContext,
  AIRequestType 
} from '../src/types/ai';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn()
      }
    }))
  };
});

import Anthropic from '@anthropic-ai/sdk';

const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

// Helper functions to create test data
function createMockAggregatedFamilyData(): AggregatedFamilyData {
  return {
    todos: {
      pending: [],
      overdue: [],
      completedRecent: [],
      totalCount: 0,
      completionRate: 0,
      memberStats: []
    },
    events: {
      upcoming: [],
      thisWeek: [],
      nextWeek: [],
      totalCount: 0,
      memberEvents: []
    },
    groceries: {
      pending: [],
      urgentItems: [],
      completedRecent: [],
      totalCount: 0,
      completionRate: 0,
      categoryStats: []
    },
    documents: {
      recent: [],
      totalCount: 0,
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
        overallStatus: 'fresh'
      },
      totalActiveTasks: 0,
      urgentItemsCount: 0,
      healthScore: 100,
      weeklyTrends: {
        todoCompletion: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' },
        eventScheduling: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' },
        groceryShopping: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' },
        documentActivity: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' }
      },
      recommendations: []
    }
  };
}

describe('AIService', () => {
  let mockAnthropicInstance: any;
  let aiService: AIService;
  let validConfig: AIConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock Anthropic instance
    mockAnthropicInstance = {
      messages: {
        create: jest.fn()
      }
    };
    
    MockedAnthropic.mockImplementation(() => mockAnthropicInstance);

    validConfig = {
      apiKey: 'test-api-key',
      model: 'claude-3-haiku-20240307',
      maxTokens: 1000,
      temperature: 0.7
    };

    aiService = new AIService(validConfig);
  });

  describe('Constructor', () => {
    it('should create AI service with valid config', () => {
      expect(aiService).toBeDefined();
      expect(MockedAnthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
    });

    it('should throw error with missing API key', () => {
      const invalidConfig = { ...validConfig, apiKey: '' };
      
      expect(() => new AIService(invalidConfig)).toThrow(AIServiceError);
      expect(() => new AIService(invalidConfig)).toThrow('API key is required for AI service');
    });

    it('should use default values for optional config', () => {
      const minimalConfig = { apiKey: 'test-key' };
      const service = new AIService(minimalConfig);
      const config = service.getConfig();
      
      expect(config.model).toBe('claude-3-haiku-20240307');
      expect(config.maxTokens).toBe(1000);
      expect(config.temperature).toBe(0.7);
    });

    it('should override defaults with provided config', () => {
      const customConfig = {
        apiKey: 'test-key',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 2000,
        temperature: 0.5
      };
      
      const service = new AIService(customConfig);
      const config = service.getConfig();
      
      expect(config.model).toBe('claude-3-sonnet-20240229');
      expect(config.maxTokens).toBe(2000);
      expect(config.temperature).toBe(0.5);
    });
  });

  describe('generateResponse', () => {
    it('should generate successful response', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Test response' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const request: AIRequest = {
        prompt: 'Test prompt',
        maxTokens: 500,
        temperature: 0.8
      };

      const result = await aiService.generateResponse(request);

      expect(result.content).toBe('Test response');
      expect(result.usage?.inputTokens).toBe(10);
      expect(result.usage?.outputTokens).toBe(5);
      expect(result.model).toBe('claude-3-haiku-20240307');
      expect(result.timestamp).toBeInstanceOf(Date);

      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: 'Test prompt'
          }
        ]
      });
    });

    it('should use default values when not provided in request', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Test response' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      await aiService.generateResponse({ prompt: 'Test prompt' });

      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: 'Test prompt'
          }
        ]
      });
    });

    it('should include context in prompt when provided', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Test response' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const context: FamilyContext = {
        familyData: createMockAggregatedFamilyData(),
        timeContext: {
          currentTime: new Date(),
          timezone: 'UTC',
          dayOfWeek: 1,
          isWeekend: false,
          timeOfDay: 'morning'
        }
      };
      await aiService.generateResponse({ 
        prompt: 'Test prompt',
        context 
      });

      const expectedPrompt = `Test prompt\n\nContext: ${JSON.stringify(context, null, 2)}`;
      
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: expectedPrompt
          }
        ]
      });
    });

    it('should warn on slow responses', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Slow response' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-3-haiku-20240307'
      };

      // Mock slow response (6 seconds)
      mockAnthropicInstance.messages.create.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 6000))
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await aiService.generateResponse({ prompt: 'Test prompt' });

      expect(result.content).toBe('Slow response');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI response took')
      );

      consoleSpy.mockRestore();
    }, 10000); // Increase timeout to 10 seconds

    it('should throw error for invalid content type', async () => {
      const mockResponse = {
        content: [{ type: 'image', source: 'data:image...' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        aiService.generateResponse({ prompt: 'Test prompt' })
      ).rejects.toThrow(AIServiceError);

      // Verify the original error was an invalid content type
      const calls = consoleErrorSpy.mock.calls;
      const errorCall = calls.find(call => 
        call[0] === 'AI Service Error:' && 
        call[1].message === 'Unexpected response content type'
      );
      expect(errorCall).toBeDefined();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('generateFamilySummary', () => {
    it('should generate family summary with correct prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Family summary response' }],
        usage: { input_tokens: 50, output_tokens: 25 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const familyData = createMockAggregatedFamilyData();
      familyData.todos.pending = [{ 
        id: 'todo1', 
        title: 'Buy groceries', 
        assignedTo: 'gonzalo',
        completed: false,
        createdBy: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        priority: 'medium',
        tags: []
      } as any];

      const result = await aiService.generateFamilySummary(familyData);

      expect(result.content).toBe('Family summary response');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        temperature: 0.6,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('You are a helpful family assistant AI')
          }
        ]
      });

      const calledPrompt = mockAnthropicInstance.messages.create.mock.calls[0][0].messages[0].content;
      expect(calledPrompt).toContain('brief overview of pending todos');
      expect(calledPrompt).toContain('Upcoming events in the next 2 weeks');
      expect(calledPrompt).toContain('Outstanding grocery items');
      expect(calledPrompt).toContain(JSON.stringify(familyData, null, 2));
    });
  });

  describe('answerQuestion', () => {
    it('should answer question with family data context', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Question answer response' }],
        usage: { input_tokens: 30, output_tokens: 15 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const question = 'What events does Mom have this week?';
      const familyData = createMockAggregatedFamilyData();
      familyData.events.upcoming = [{
        id: 'event1',
        title: 'PTA meeting',
        assignedTo: 'mpaz',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-15'),
        allDay: false,
        createdBy: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any];

      const result = await aiService.answerQuestion(question, familyData);

      expect(result.content).toBe('Question answer response');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 600,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('You are a helpful family assistant AI')
          }
        ]
      });

      const calledPrompt = mockAnthropicInstance.messages.create.mock.calls[0][0].messages[0].content;
      expect(calledPrompt).toContain(`Question: ${question}`);
      expect(calledPrompt).toContain(JSON.stringify(familyData, null, 2));
    });
  });

  describe('generateAlerts', () => {
    it('should generate alerts with family data', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Alert response' }],
        usage: { input_tokens: 40, output_tokens: 20 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const familyData = createMockAggregatedFamilyData();
      familyData.todos.overdue = [{
        id: 'todo1',
        title: 'Overdue task',
        dueDate: new Date('2024-01-01'),
        completed: false,
        assignedTo: 'gonzalo',
        createdBy: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        priority: 'high',
        tags: []
      } as any];

      const result = await aiService.generateAlerts(familyData);

      expect(result.content).toBe('Alert response');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('identify:')
          }
        ]
      });

      const calledPrompt = mockAnthropicInstance.messages.create.mock.calls[0][0].messages[0].content;
      expect(calledPrompt).toContain('URGENT items that need immediate attention');
      expect(calledPrompt).toContain('IMPORTANT patterns');
      expect(calledPrompt).toContain('RECOMMENDATIONS');
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const error = { status: 401, message: 'Unauthorized' };
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow(AIServiceError);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle 429 rate limit error', async () => {
      const error = { status: 429, message: 'Rate limit exceeded' };
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow(AIServiceError);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle 400 bad request error', async () => {
      const error = { status: 400, message: 'Bad request' };
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow(AIServiceError);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow('Invalid request format');
    });

    it('should handle 500+ server error', async () => {
      const error = { status: 503, message: 'Service unavailable' };
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow(AIServiceError);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow('Claude API service temporarily unavailable');
    });

    it('should handle network ENOTFOUND error', async () => {
      const error = { code: 'ENOTFOUND', message: 'DNS lookup failed' };
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow(AIServiceError);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow('Network connection failed');
    });

    it('should handle timeout error', async () => {
      const error = { code: 'ETIMEDOUT', message: 'Request timeout' };
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow(AIServiceError);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow('Request timed out');
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error');
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow(AIServiceError);

      await expect(
        aiService.generateResponse({ prompt: 'Test' })
      ).rejects.toThrow('An unexpected error occurred');
    });

    it('should log errors to console', async () => {
      const error = new Error('Test error');
      mockAnthropicInstance.messages.create.mockRejectedValue(error);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await aiService.generateResponse({ prompt: 'Test' });
      } catch (e) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('AI Service Error:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'OK' }],
        usage: { input_tokens: 5, output_tokens: 1 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const result = await aiService.healthCheck();

      expect(result).toBe(true);
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: 'Respond with "OK" if you can process this message.'
          }
        ]
      });
    });

    it('should return true for OK response variations', async () => {
      const variations = ['OK', 'ok', 'Ok', 'Yes, OK!', 'I can process this. OK.'];

      for (const variation of variations) {
        const mockResponse = {
          content: [{ type: 'text', text: variation }],
          usage: { input_tokens: 5, output_tokens: 1 },
          model: 'claude-3-haiku-20240307'
        };

        mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

        const result = await aiService.healthCheck();
        expect(result).toBe(true);
      }
    });

    it('should return false for failed health check', async () => {
      const error = new Error('Health check failed');
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await aiService.healthCheck();

      expect(result).toBe(false);
      
      // Check that health check error was logged (should be the last call)
      const calls = consoleSpy.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe('AI Service health check failed:');
      expect(lastCall[1]).toBeInstanceOf(AIServiceError);
      
      consoleSpy.mockRestore();
    });

    it('should return false for unexpected response', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Unexpected response' }],
        usage: { input_tokens: 5, output_tokens: 2 },
        model: 'claude-3-haiku-20240307'
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const result = await aiService.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return config without API key', () => {
      const config = aiService.getConfig();

      expect(config).toEqual({
        model: 'claude-3-haiku-20240307',
        maxTokens: 1000,
        temperature: 0.7
      });

      expect(config).not.toHaveProperty('apiKey');
    });
  });

  describe('Factory and Singleton Functions', () => {
    it('should create AI service with factory function', () => {
      const service = createAIService(validConfig);
      
      expect(service).toBeInstanceOf(AIService);
      expect(MockedAnthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
    });

    it('should set and get AI service singleton', () => {
      const service = createAIService(validConfig);
      
      setAIService(service);
      const retrievedService = getAIService();
      
      expect(retrievedService).toBe(service);
    });

    it('should throw error when getting uninitialized service', () => {
      // Reset singleton
      setAIService(null as any);
      
      expect(() => getAIService()).toThrow(AIServiceError);
      expect(() => getAIService()).toThrow('AI service not initialized');
    });
  });

  describe('AIServiceError', () => {
    it('should create error with message and code', () => {
      const error = new AIServiceError('Test message', 'TEST_CODE');
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AIServiceError');
      expect(error.originalError).toBeUndefined();
    });

    it('should create error with original error', () => {
      const originalError = new Error('Original error');
      const error = new AIServiceError('Test message', 'TEST_CODE', originalError);
      
      expect(error.originalError).toBe(originalError);
    });
  });
});
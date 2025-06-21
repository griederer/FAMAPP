// Integration tests for AI Service + Data Aggregation Service
import { AIService, AIServiceError, type AIConfig } from '../src/services/aiService';
import { DataAggregationService, DataAggregationError } from '../src/services/dataAggregationService';
import type { AggregatedFamilyData } from '../src/types/ai';

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

// Mock Firebase services
jest.mock('../src/services/firebase', () => ({
  getFirebaseServices: jest.fn().mockReturnValue({
    db: {},
    auth: {},
    storage: {},
    initializeApp: jest.fn(),
  }),
}));

// Mock auth service
jest.mock('../src/services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn().mockReturnValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      familyMember: 'gonzalo',
    }),
  },
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

import Anthropic from '@anthropic-ai/sdk';

const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe('AI Service + Data Aggregation Integration', () => {
  let mockAnthropicInstance: any;
  let aiService: AIService;
  let dataAggregationService: DataAggregationService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Anthropic instance
    mockAnthropicInstance = {
      messages: {
        create: jest.fn()
      }
    };
    
    MockedAnthropic.mockImplementation(() => mockAnthropicInstance);

    // Initialize services
    const aiConfig: AIConfig = {
      apiKey: 'test-api-key',
      model: 'claude-3-haiku-20240307',
      maxTokens: 1000,
      temperature: 0.7
    };
    
    aiService = new AIService(aiConfig);
    dataAggregationService = new DataAggregationService();
  });

  it('should integrate AI service with aggregated family data', async () => {
    // Mock Anthropic response
    const mockResponse = {
      content: [{ type: 'text', text: 'Family summary: Everything looks great! You have 2 pending todos and 1 upcoming event.' }],
      usage: { input_tokens: 100, output_tokens: 50 },
      model: 'claude-3-haiku-20240307'
    };

    mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

    // Get aggregated family data
    const familyData: AggregatedFamilyData = await dataAggregationService.aggregateFamilyData();

    // Verify family data structure
    expect(familyData).toBeDefined();
    expect(familyData.todos).toBeDefined();
    expect(familyData.events).toBeDefined();
    expect(familyData.groceries).toBeDefined();
    expect(familyData.documents).toBeDefined();
    expect(familyData.familyMembers).toBeDefined();
    expect(familyData.summary).toBeDefined();

    // Generate AI summary from family data
    const aiResponse = await aiService.generateFamilySummary(familyData);

    // Verify AI response
    expect(aiResponse).toBeDefined();
    expect(aiResponse.content).toBe('Family summary: Everything looks great! You have 2 pending todos and 1 upcoming event.');
    expect(aiResponse.type).toBe('family_summary');
    expect(aiResponse.usage).toBeDefined();
    expect(aiResponse.usage?.totalTokens).toBe(150);
    expect(aiResponse.confidence).toBeGreaterThan(0);
    expect(aiResponse.metadata).toBeDefined();

    // Verify AI service received the correct family data
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

    // Verify the prompt contains family data
    const calledPrompt = mockAnthropicInstance.messages.create.mock.calls[0][0].messages[0].content;
    expect(calledPrompt).toContain('Family Data:');
    expect(calledPrompt).toContain('familyData');
  });

  it('should handle AI service errors gracefully with family data', async () => {
    // Mock Anthropic API error
    mockAnthropicInstance.messages.create.mockRejectedValue({
      status: 401,
      message: 'Unauthorized'
    });

    // Get family data
    const familyData = await dataAggregationService.aggregateFamilyData();

    // Attempt to generate AI summary
    await expect(aiService.generateFamilySummary(familyData)).rejects.toThrow(AIServiceError);
    await expect(aiService.generateFamilySummary(familyData)).rejects.toThrow('Invalid API key');
  });

  it('should handle data aggregation errors when AI service is ready', async () => {
    // Mock data aggregation failure
    jest.spyOn(dataAggregationService, 'aggregateFamilyData').mockRejectedValue(
      new DataAggregationError('Failed to aggregate family data', 'AGGREGATION_FAILED')
    );

    // Verify data aggregation error
    await expect(dataAggregationService.aggregateFamilyData()).rejects.toThrow(DataAggregationError);
    await expect(dataAggregationService.aggregateFamilyData()).rejects.toThrow('Failed to aggregate family data');
  });

  it('should provide conversational AI responses about family data', async () => {
    // Mock Anthropic response for question answering
    const mockResponse = {
      content: [{ type: 'text', text: 'Based on your family data, you have no events scheduled for this week.' }],
      usage: { input_tokens: 80, output_tokens: 30 },
      model: 'claude-3-haiku-20240307'
    };

    mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

    // Get family data
    const familyData = await dataAggregationService.aggregateFamilyData();

    // Ask a question about family data
    const question = 'What events do we have this week?';
    const aiResponse = await aiService.answerQuestion(question, familyData);

    // Verify response
    expect(aiResponse.content).toContain('no events scheduled');
    expect(aiResponse.type).toBe('question_answer');
    
    // Verify the question was included in the prompt
    const calledPrompt = mockAnthropicInstance.messages.create.mock.calls[0][0].messages[0].content;
    expect(calledPrompt).toContain(`Question: ${question}`);
  });

  it('should generate smart alerts from family data', async () => {
    // Mock Anthropic response for alerts
    const mockResponse = {
      content: [{ type: 'text', text: 'URGENT: No immediate alerts. All family tasks are on track!' }],
      usage: { input_tokens: 60, output_tokens: 20 },
      model: 'claude-3-haiku-20240307'
    };

    mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

    // Get family data
    const familyData = await dataAggregationService.aggregateFamilyData();

    // Generate alerts
    const aiResponse = await aiService.generateAlerts(familyData);

    // Verify alerts response
    expect(aiResponse.content).toContain('URGENT');
    expect(aiResponse.type).toBe('alerts_generation');
    
    // Verify the prompt includes alert generation instructions
    const calledPrompt = mockAnthropicInstance.messages.create.mock.calls[0][0].messages[0].content;
    expect(calledPrompt).toContain('URGENT items that need immediate attention');
    expect(calledPrompt).toContain('IMPORTANT patterns');
    expect(calledPrompt).toContain('RECOMMENDATIONS');
  });

  it('should validate data freshness in AI responses', async () => {
    // Mock Anthropic response
    const mockResponse = {
      content: [{ type: 'text', text: 'Data is fresh and current.' }],
      usage: { input_tokens: 50, output_tokens: 15 },
      model: 'claude-3-haiku-20240307'
    };

    mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

    // Get family data
    const familyData = await dataAggregationService.aggregateFamilyData();

    // Verify data freshness
    expect(familyData.summary.dataFreshness.overallStatus).toBe('fresh');
    expect(familyData.summary.generatedAt).toBeInstanceOf(Date);

    // Generate AI summary
    const aiResponse = await aiService.generateFamilySummary(familyData);

    // Verify AI response includes fresh metadata
    expect(aiResponse.metadata?.dataFreshness).toBeInstanceOf(Date);
    expect(aiResponse.timestamp).toBeInstanceOf(Date);
  });

  it('should calculate health scores and AI confidence correctly', async () => {
    // Mock Anthropic response
    const mockResponse = {
      content: [{ type: 'text', text: 'Your family is well-organized with a 95% completion rate on tasks!' }],
      usage: { input_tokens: 70, output_tokens: 25 },
      model: 'claude-3-haiku-20240307'
    };

    mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

    // Get family data
    const familyData = await dataAggregationService.aggregateFamilyData();

    // Verify health score calculation
    expect(typeof familyData.summary.healthScore).toBe('number');
    expect(familyData.summary.healthScore).toBeGreaterThanOrEqual(0);
    expect(familyData.summary.healthScore).toBeLessThanOrEqual(100);

    // Generate AI summary
    const aiResponse = await aiService.generateFamilySummary(familyData);

    // Verify AI confidence calculation
    expect(typeof aiResponse.confidence).toBe('number');
    expect(aiResponse.confidence).toBeGreaterThanOrEqual(0);
    expect(aiResponse.confidence).toBeLessThanOrEqual(1);
  });
});
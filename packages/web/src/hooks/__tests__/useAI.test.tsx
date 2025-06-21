// Unit tests for useAI hook
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock types and data
interface MockAIService {
  generateFamilySummary: any;
  askQuestion: any;
  healthCheck: any;
  generateInsights: any;
  generateRecommendations: any;
}

interface MockFamilyData {
  todos: { total: number; completed: number; urgent: number; overdue: number };
  events: {
    total: number;
    thisWeek: number;
    nextWeek: number;
    upcomingImportant: any[];
  };
  groceries: {
    total: number;
    categories: any[];
    urgent: number;
    estimated_cost: number;
  };
  members: any[];
  documents: { total: number; recent: any[] };
}

interface MockAIResponse {
  type: string;
  content: string;
  timestamp: Date;
  confidence: number;
  suggestions: any[];
}

// Mock the AI service
const mockAIService: MockAIService = {
  generateFamilySummary: vi.fn(),
  askQuestion: vi.fn(),
  healthCheck: vi.fn(),
  generateInsights: vi.fn(),
  generateRecommendations: vi.fn()
};

const mockFamilyData: MockFamilyData = {
  todos: { total: 10, completed: 5, urgent: 2, overdue: 1 },
  events: {
    total: 8,
    thisWeek: 3,
    nextWeek: 2,
    upcomingImportant: []
  },
  groceries: {
    total: 15,
    categories: [],
    urgent: 3,
    estimated_cost: 125.50
  },
  members: [],
  documents: { total: 20, recent: [] }
};

const mockAIResponse: MockAIResponse = {
  type: 'family_summary',
  content: 'Test AI response',
  timestamp: new Date(),
  confidence: 0.9,
  suggestions: []
};

// Mock the shared package
vi.mock('@famapp/shared', () => ({
  getAIService: vi.fn(() => mockAIService),
}));

// Mock the AI config
vi.mock('../config/ai', () => ({
  checkAIServiceHealth: vi.fn(() => Promise.resolve(true)),
}));

// Import hooks after mocking
import { useAI, useAIAvailable } from '../useAI';

describe('useAI Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockAIService.generateFamilySummary.mockResolvedValue(mockAIResponse);
    mockAIService.askQuestion.mockResolvedValue(mockAIResponse);
    mockAIService.healthCheck.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('useAI', () => {
    test('should initialize with loading state', () => {
      const { result } = renderHook(() => useAI());
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.aiService).toBe(null);
      expect(result.current.isHealthy).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should initialize AI service successfully', async () => {
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.aiService).toBe(mockAIService);
      expect(result.current.isHealthy).toBe(true);
      expect(result.current.error).toBe(null);
    });

    test('should handle AI service initialization failure', async () => {
      const { getAIService } = await import('@famapp/shared');
      vi.mocked(getAIService).mockReturnValue(null);
      
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.aiService).toBe(null);
      expect(result.current.isHealthy).toBe(false);
      expect(result.current.error).toBe('AI Service not initialized. Check your API configuration.');
    });

    test('should handle health check failure', async () => {
      const { checkAIServiceHealth } = await import('../config/ai');
      vi.mocked(checkAIServiceHealth).mockResolvedValue(false);
      
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isHealthy).toBe(false);
      expect(result.current.error).toBe('AI Service is not responding. Please check your API key and network connection.');
    });

    test('should generate family summary successfully', async () => {
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const response = await result.current.generateSummary(mockFamilyData);
      
      expect(mockAIService.generateFamilySummary).toHaveBeenCalledWith(mockFamilyData);
      expect(response).toBe(mockAIResponse);
    });

    test('should handle generateSummary when service unavailable', async () => {
      const { getAIService } = await import('@famapp/shared');
      vi.mocked(getAIService).mockReturnValue(null);
      
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const response = await result.current.generateSummary(mockFamilyData);
      
      expect(response).toBe(null);
      expect(result.current.error).toBe('AI Service is not available');
    });

    test('should handle generateSummary API error', async () => {
      mockAIService.generateFamilySummary.mockRejectedValue(new Error('API Error'));
      
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const response = await result.current.generateSummary(mockFamilyData);
      
      expect(response).toBe(null);
      expect(result.current.error).toBe('API Error');
    });

    test('should ask question successfully', async () => {
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const response = await result.current.askQuestion('What tasks are overdue?', 'family context');
      
      expect(mockAIService.askQuestion).toHaveBeenCalledWith('What tasks are overdue?', 'family context');
      expect(response).toBe(mockAIResponse);
    });

    test('should handle askQuestion when service unavailable', async () => {
      const { getAIService } = await import('@famapp/shared');
      vi.mocked(getAIService).mockReturnValue(null);
      
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const response = await result.current.askQuestion('Test question');
      
      expect(response).toBe(null);
      expect(result.current.error).toBe('AI Service is not available');
    });

    test('should handle askQuestion API error', async () => {
      mockAIService.askQuestion.mockRejectedValue(new Error('Question processing failed'));
      
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const response = await result.current.askQuestion('Test question');
      
      expect(response).toBe(null);
      expect(result.current.error).toBe('Question processing failed');
    });

    test('should perform manual health check', async () => {
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const isHealthy = await result.current.checkHealth();
      
      expect(isHealthy).toBe(true);
      expect(result.current.error).toBe(null);
    });

    test('should handle manual health check failure', async () => {
      const { checkAIServiceHealth } = await import('../config/ai');
      vi.mocked(checkAIServiceHealth).mockResolvedValue(false);
      
      const { result } = renderHook(() => useAI());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const isHealthy = await result.current.checkHealth();
      
      expect(isHealthy).toBe(false);
      expect(result.current.error).toBe('AI Service health check failed');
    });
  });

  describe('useAIAvailable', () => {
    test('should return unavailable when loading', () => {
      const { result } = renderHook(() => useAIAvailable());
      
      expect(result.current.isAvailable).toBe(false);
      expect(result.current.reason).toBe('Loading...');
    });

    test('should return available when healthy', async () => {
      const { result } = renderHook(() => useAIAvailable());
      
      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });
      
      expect(result.current.reason).toBeUndefined();
    });

    test('should return unavailable when service has error', async () => {
      const { getAIService } = await import('@famapp/shared');
      vi.mocked(getAIService).mockReturnValue(null);
      
      const { result } = renderHook(() => useAIAvailable());
      
      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });
      
      expect(result.current.reason).toBe('AI Service not initialized. Check your API configuration.');
    });

    test('should return unavailable when service is unhealthy', async () => {
      const { checkAIServiceHealth } = await import('../config/ai');
      vi.mocked(checkAIServiceHealth).mockResolvedValue(false);
      
      const { result } = renderHook(() => useAIAvailable());
      
      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });
      
      expect(result.current.reason).toBe('AI Service is not responding. Please check your API key and network connection.');
    });
  });
});
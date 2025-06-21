// React hook for AI service integration
import { useState, useEffect, useCallback } from 'react';
import { getAIService, type AIService, type AggregatedFamilyData, type AIResponse, type ConversationMessage } from '@famapp/shared';
import { checkAIServiceHealth } from '../config/ai';

// Hook return type
interface UseAIReturn {
  aiService: AIService | null;
  isHealthy: boolean;
  isLoading: boolean;
  error: string | null;
  generateSummary: (familyData: AggregatedFamilyData) => Promise<AIResponse | null>;
  askQuestion: (question: string, familyData: AggregatedFamilyData, conversationHistory?: ConversationMessage[]) => Promise<AIResponse | null>;
  checkHealth: () => Promise<boolean>;
}

// Custom hook for AI service integration
export function useAI(): UseAIReturn {
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize AI service and check health
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the AI service (should be initialized in config/ai.ts)
        const service = getAIService();
        if (!service) {
          throw new Error('AI Service not initialized. Check your API configuration.');
        }

        setAiService(service);

        // Check service health
        const healthy = await checkAIServiceHealth();
        setIsHealthy(healthy);

        if (!healthy) {
          setError('AI Service is not responding. Please check your API key and network connection.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setIsHealthy(false);
        setAiService(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Generate family summary
  const generateSummary = useCallback(async (familyData: AggregatedFamilyData): Promise<AIResponse | null> => {
    if (!aiService || !isHealthy) {
      setError('AI Service is not available');
      return null;
    }

    try {
      setError(null);
      const response = await aiService.generateFamilySummary(familyData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMessage);
      return null;
    }
  }, [aiService, isHealthy]);

  // Ask a question with family data context and optional conversation history
  const askQuestion = useCallback(async (question: string, familyData: AggregatedFamilyData, conversationHistory?: ConversationMessage[]): Promise<AIResponse | null> => {
    if (!aiService || !isHealthy) {
      setError('AI Service is not available');
      return null;
    }

    try {
      setError(null);
      // Use conversation history if provided, otherwise use simple question answering
      const response = conversationHistory && conversationHistory.length > 0
        ? await aiService.answerQuestionWithHistory(question, familyData, conversationHistory)
        : await aiService.answerQuestion(question, familyData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process question';
      setError(errorMessage);
      return null;
    }
  }, [aiService, isHealthy]);

  // Manual health check
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const healthy = await checkAIServiceHealth();
      setIsHealthy(healthy);
      
      if (!healthy) {
        setError('AI Service health check failed');
      } else {
        setError(null);
      }
      
      return healthy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
      setIsHealthy(false);
      return false;
    }
  }, []);

  return {
    aiService,
    isHealthy,
    isLoading,
    error,
    generateSummary,
    askQuestion,
    checkHealth
  };
}

// Hook for checking if AI features are available
export function useAIAvailable(): { isAvailable: boolean; reason?: string } {
  const { isHealthy, isLoading, error } = useAI();

  if (isLoading) {
    return { isAvailable: false, reason: 'Loading...' };
  }

  if (error) {
    return { isAvailable: false, reason: error };
  }

  if (!isHealthy) {
    return { isAvailable: false, reason: 'AI Service is not healthy' };
  }

  return { isAvailable: true };
}
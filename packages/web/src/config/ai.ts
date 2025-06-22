// AI Service configuration for web platform
import { AIService, createAIService, setAIService, type AIConfig } from '@famapp/shared';

// Environment configuration interface
interface AppEnvironmentConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
}

// Validate environment variables and provide defaults
function validateEnvironmentConfig(): AppEnvironmentConfig {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  const model = import.meta.env.VITE_AI_MODEL || 'claude-3-haiku-20240307';
  const maxTokens = parseInt(import.meta.env.VITE_AI_MAX_TOKENS || '1000', 10);
  const temperature = parseFloat(import.meta.env.VITE_AI_TEMPERATURE || '0.7');
  const environment = import.meta.env.VITE_APP_ENV || 'development';
  const debug = import.meta.env.VITE_AI_DEBUG === 'true';

  // Validate required API key
  if (!apiKey || apiKey === 'your_claude_api_key_here' || apiKey === 'sk-ant-api03-placeholder-add-your-key-here') {
    throw new Error(
      'Claude API key is required. Please set VITE_CLAUDE_API_KEY in your .env.local file. ' +
      'Get your API key from https://console.anthropic.com/'
    );
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error(
      'Invalid Claude API key format. Claude API keys should start with "sk-ant-". ' +
      'Please check your VITE_CLAUDE_API_KEY environment variable.'
    );
  }

  // Validate numeric values
  if (isNaN(maxTokens) || maxTokens <= 0 || maxTokens > 4096) {
    throw new Error('VITE_AI_MAX_TOKENS must be a positive number between 1 and 4096');
  }

  if (isNaN(temperature) || temperature < 0 || temperature > 1) {
    throw new Error('VITE_AI_TEMPERATURE must be a number between 0 and 1');
  }

  // Validate environment
  const validEnvironments = ['development', 'staging', 'production'];
  if (!validEnvironments.includes(environment as any)) {
    throw new Error(`VITE_APP_ENV must be one of: ${validEnvironments.join(', ')}`);
  }

  return {
    apiKey,
    model,
    maxTokens,
    temperature,
    environment: environment as 'development' | 'staging' | 'production',
    debug
  };
}

// Get AI configuration from environment
export function getAIConfig(): AIConfig {
  const envConfig = validateEnvironmentConfig();
  
  return {
    apiKey: envConfig.apiKey,
    model: envConfig.model,
    maxTokens: envConfig.maxTokens,
    temperature: envConfig.temperature
  };
}

// Get app environment configuration
export function getAppConfig(): AppEnvironmentConfig {
  return validateEnvironmentConfig();
}

// Initialize AI service with configuration
export function initializeAIService(): AIService {
  try {
    const config = getAIConfig();
    const appConfig = getAppConfig();
    
    // Log configuration in development mode (without exposing API key)
    if (appConfig.debug && appConfig.environment === 'development') {
      console.log('🤖 Initializing AI Service with configuration:', {
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        environment: appConfig.environment,
        apiKeyPresent: !!config.apiKey,
        apiKeyFormat: config.apiKey.startsWith('sk-ant-') ? 'valid' : 'invalid'
      });
    }

    const aiService = createAIService(config);
    setAIService(aiService);
    
    return aiService;
  } catch (error) {
    console.error('❌ Failed to initialize AI Service:', error);
    throw error;
  }
}

// Health check for AI service configuration
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const config = getAIConfig();
    const aiService = createAIService(config);
    
    // Perform a basic health check
    const isHealthy = await aiService.healthCheck();
    
    if (!isHealthy) {
      console.warn('⚠️ AI Service health check failed - service may be unavailable');
    }
    
    return isHealthy;
  } catch (error) {
    console.error('❌ AI Service health check error:', error);
    return false;
  }
}

// Export configuration utilities
export { validateEnvironmentConfig };

// Environment-specific configuration presets
export const ENVIRONMENT_PRESETS = {
  development: {
    model: 'claude-3-haiku-20240307',
    maxTokens: 1000,
    temperature: 0.7,
    debug: true
  },
  staging: {
    model: 'claude-3-haiku-20240307',
    maxTokens: 1500,
    temperature: 0.6,
    debug: false
  },
  production: {
    model: 'claude-3-haiku-20240307',
    maxTokens: 2000,
    temperature: 0.5,
    debug: false
  }
} as const;

// Type definitions for better TypeScript support
export type AppEnvironment = keyof typeof ENVIRONMENT_PRESETS;
export type { AppEnvironmentConfig };

// Initialize AI service with retry logic for production
// This ensures the AI service is available throughout the application
// Skip initialization during testing
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  // Use a timeout to ensure DOM is ready and environment variables are loaded
  setTimeout(() => {
    try {
      console.log('🤖 Attempting to initialize AI Service...');
      const aiService = initializeAIService();
      console.log('✅ AI Service initialized successfully');
    } catch (error) {
      console.error('❌ AI Service initialization failed:', error);
      // Try again after a delay in case of temporary issues
      setTimeout(() => {
        try {
          console.log('🔄 Retrying AI Service initialization...');
          const aiService = initializeAIService();
          console.log('✅ AI Service initialized successfully on retry');
        } catch (retryError) {
          console.error('❌ AI Service initialization failed on retry - AI features will be disabled:', retryError);
        }
      }, 2000);
    }
  }, 100);
}
// Unit tests for AI configuration
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock shared package before importing
vi.mock('@famapp/shared', () => ({
  createAIService: vi.fn(),
  setAIService: vi.fn(),
  getAIService: vi.fn(),
}));

import { getAIConfig, getAppConfig, validateEnvironmentConfig, ENVIRONMENT_PRESETS } from '../ai';

// Mock environment variables
const mockEnv = {
  VITE_CLAUDE_API_KEY: '',
  VITE_AI_MODEL: '',
  VITE_AI_MAX_TOKENS: '',
  VITE_AI_TEMPERATURE: '',
  VITE_APP_ENV: '',
  VITE_AI_DEBUG: ''
};

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: mockEnv
}));

describe('AI Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    Object.keys(mockEnv).forEach(key => {
      mockEnv[key as keyof typeof mockEnv] = '';
    });
    
    // Clear console mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateEnvironmentConfig', () => {
    test('should throw error when API key is missing', () => {
      expect(() => validateEnvironmentConfig()).toThrow(
        'Claude API key is required. Please set VITE_CLAUDE_API_KEY in your .env.local file.'
      );
    });

    test('should throw error when API key is placeholder', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'your_claude_api_key_here';
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'Claude API key is required. Please set VITE_CLAUDE_API_KEY in your .env.local file.'
      );
    });

    test('should throw error when API key format is invalid', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'invalid-key-format';
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'Invalid Claude API key format. Claude API keys should start with "sk-ant-".'
      );
    });

    test('should throw error when max tokens is invalid', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-valid-key';
      mockEnv.VITE_AI_MAX_TOKENS = 'invalid';
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'VITE_AI_MAX_TOKENS must be a positive number between 1 and 4096'
      );
    });

    test('should throw error when max tokens is out of range', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-valid-key';
      mockEnv.VITE_AI_MAX_TOKENS = '5000';
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'VITE_AI_MAX_TOKENS must be a positive number between 1 and 4096'
      );
    });

    test('should throw error when temperature is invalid', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-valid-key';
      mockEnv.VITE_AI_TEMPERATURE = 'invalid';
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'VITE_AI_TEMPERATURE must be a number between 0 and 1'
      );
    });

    test('should throw error when temperature is out of range', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-valid-key';
      mockEnv.VITE_AI_TEMPERATURE = '2.0';
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'VITE_AI_TEMPERATURE must be a number between 0 and 1'
      );
    });

    test('should throw error when environment is invalid', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-valid-key';
      mockEnv.VITE_APP_ENV = 'invalid';
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'VITE_APP_ENV must be one of: development, staging, production'
      );
    });

    test('should return valid configuration with defaults', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-valid-key';
      
      const config = validateEnvironmentConfig();
      
      expect(config).toEqual({
        apiKey: 'sk-ant-api03-valid-key',
        model: 'claude-3-haiku-20240307',
        maxTokens: 1000,
        temperature: 0.7,
        environment: 'development',
        debug: false
      });
    });

    test('should return valid configuration with custom values', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-custom-key';
      mockEnv.VITE_AI_MODEL = 'claude-3-sonnet-20240229';
      mockEnv.VITE_AI_MAX_TOKENS = '2000';
      mockEnv.VITE_AI_TEMPERATURE = '0.5';
      mockEnv.VITE_APP_ENV = 'production';
      mockEnv.VITE_AI_DEBUG = 'true';
      
      const config = validateEnvironmentConfig();
      
      expect(config).toEqual({
        apiKey: 'sk-ant-api03-custom-key',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 2000,
        temperature: 0.5,
        environment: 'production',
        debug: true
      });
    });
  });

  describe('getAIConfig', () => {
    test('should return AI configuration from environment', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-test-key';
      mockEnv.VITE_AI_MODEL = 'claude-3-haiku-20240307';
      mockEnv.VITE_AI_MAX_TOKENS = '1500';
      mockEnv.VITE_AI_TEMPERATURE = '0.6';
      
      const config = getAIConfig();
      
      expect(config).toEqual({
        apiKey: 'sk-ant-api03-test-key',
        model: 'claude-3-haiku-20240307',
        maxTokens: 1500,
        temperature: 0.6
      });
    });
  });

  describe('getAppConfig', () => {
    test('should return app configuration from environment', () => {
      mockEnv.VITE_CLAUDE_API_KEY = 'sk-ant-api03-test-key';
      mockEnv.VITE_APP_ENV = 'staging';
      mockEnv.VITE_AI_DEBUG = 'true';
      
      const config = getAppConfig();
      
      expect(config.environment).toBe('staging');
      expect(config.debug).toBe(true);
    });
  });

  describe('ENVIRONMENT_PRESETS', () => {
    test('should have correct presets for each environment', () => {
      expect(ENVIRONMENT_PRESETS.development).toEqual({
        model: 'claude-3-haiku-20240307',
        maxTokens: 1000,
        temperature: 0.7,
        debug: true
      });

      expect(ENVIRONMENT_PRESETS.staging).toEqual({
        model: 'claude-3-haiku-20240307',
        maxTokens: 1500,
        temperature: 0.6,
        debug: false
      });

      expect(ENVIRONMENT_PRESETS.production).toEqual({
        model: 'claude-3-haiku-20240307',
        maxTokens: 2000,
        temperature: 0.5,
        debug: false
      });
    });
  });
});
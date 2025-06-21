import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageAdapter } from '../../src/services/storage';
import { storageService } from '@famapp/shared';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('AsyncStorageAdapter', () => {
  let adapter: AsyncStorageAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new AsyncStorageAdapter();
  });

  describe('getItem', () => {
    it('calls AsyncStorage.getItem with correct key', async () => {
      jest.mocked(AsyncStorage.getItem).mockResolvedValue('test-value');

      const result = await adapter.getItem('test-key');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });

    it('returns null when AsyncStorage returns null', async () => {
      jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);

      const result = await adapter.getItem('nonexistent-key');

      expect(result).toBeNull();
    });

    it('handles AsyncStorage errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.mocked(AsyncStorage.getItem).mockRejectedValue(new Error('AsyncStorage error'));

      const result = await adapter.getItem('error-key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'AsyncStorage getItem error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('setItem', () => {
    it('calls AsyncStorage.setItem with correct parameters', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await adapter.setItem('test-key', 'test-value');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('throws error when AsyncStorage.setItem fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('AsyncStorage setItem error');
      jest.mocked(AsyncStorage.setItem).mockRejectedValue(testError);

      await expect(adapter.setItem('error-key', 'error-value')).rejects.toThrow(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'AsyncStorage setItem error:',
        testError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('calls AsyncStorage.removeItem with correct key', async () => {
      jest.mocked(AsyncStorage.removeItem).mockResolvedValue();

      await adapter.removeItem('test-key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('throws error when AsyncStorage.removeItem fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('AsyncStorage removeItem error');
      jest.mocked(AsyncStorage.removeItem).mockRejectedValue(testError);

      await expect(adapter.removeItem('error-key')).rejects.toThrow(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'AsyncStorage removeItem error:',
        testError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('calls AsyncStorage.clear', async () => {
      jest.mocked(AsyncStorage.clear).mockResolvedValue();

      await adapter.clear();

      expect(AsyncStorage.clear).toHaveBeenCalled();
    });

    it('throws error when AsyncStorage.clear fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('AsyncStorage clear error');
      jest.mocked(AsyncStorage.clear).mockRejectedValue(testError);

      await expect(adapter.clear()).rejects.toThrow(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'AsyncStorage clear error:',
        testError
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('Storage Service Integration', () => {
  it('sets AsyncStorage adapter on import', () => {
    const mockSetAdapter = jest.mocked(storageService.setAdapter);
    
    // Import the storage configuration
    require('../../src/services/storage');

    expect(mockSetAdapter).toHaveBeenCalledWith(
      expect.any(AsyncStorageAdapter)
    );
  });

  it('configures storage service only once', () => {
    const mockSetAdapter = jest.mocked(storageService.setAdapter);
    mockSetAdapter.mockClear();
    
    // Import multiple times
    require('../../src/services/storage');
    require('../../src/services/storage');
    require('../../src/services/storage');

    // Should only be called once due to module caching
    expect(mockSetAdapter).toHaveBeenCalledTimes(1);
  });

  it('provides AsyncStorageAdapter instance to shared service', () => {
    const mockSetAdapter = jest.mocked(storageService.setAdapter);
    
    require('../../src/services/storage');

    const adapterInstance = mockSetAdapter.mock.calls[0][0];
    expect(adapterInstance).toBeInstanceOf(AsyncStorageAdapter);
  });
});

describe('AsyncStorageAdapter Error Handling', () => {
  let adapter: AsyncStorageAdapter;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new AsyncStorageAdapter();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('logs errors for all methods', async () => {
    const error = new Error('Test error');
    
    jest.mocked(AsyncStorage.getItem).mockRejectedValue(error);
    jest.mocked(AsyncStorage.setItem).mockRejectedValue(error);
    jest.mocked(AsyncStorage.removeItem).mockRejectedValue(error);
    jest.mocked(AsyncStorage.clear).mockRejectedValue(error);

    // Test getItem error logging
    await adapter.getItem('test');
    expect(consoleErrorSpy).toHaveBeenCalledWith('AsyncStorage getItem error:', error);

    // Test setItem error logging
    try {
      await adapter.setItem('test', 'value');
    } catch {}
    expect(consoleErrorSpy).toHaveBeenCalledWith('AsyncStorage setItem error:', error);

    // Test removeItem error logging
    try {
      await adapter.removeItem('test');
    } catch {}
    expect(consoleErrorSpy).toHaveBeenCalledWith('AsyncStorage removeItem error:', error);

    // Test clear error logging
    try {
      await adapter.clear();
    } catch {}
    expect(consoleErrorSpy).toHaveBeenCalledWith('AsyncStorage clear error:', error);
  });

  it('handles different error types gracefully', async () => {
    // Test with string error
    jest.mocked(AsyncStorage.getItem).mockRejectedValue('String error');
    let result = await adapter.getItem('test');
    expect(result).toBeNull();

    // Test with undefined error
    jest.mocked(AsyncStorage.getItem).mockRejectedValue(undefined);
    result = await adapter.getItem('test');
    expect(result).toBeNull();

    // Test with object error
    jest.mocked(AsyncStorage.getItem).mockRejectedValue({ message: 'Object error' });
    result = await adapter.getItem('test');
    expect(result).toBeNull();
  });
});
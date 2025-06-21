import { StorageService, WebStorageAdapter } from '../src/services/storage';
import { setFirebaseServices, getFirebaseServices } from '../src/services/firebase';

// Mock localStorage for tests
const mockLocalStorage = {
  data: {} as Record<string, string>,
  length: 0,
  getItem: jest.fn((key: string): string | null => mockLocalStorage.data[key] || null),
  setItem: jest.fn((key: string, value: string): void => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: jest.fn((key: string): void => {
    delete mockLocalStorage.data[key];
  }),
  clear: jest.fn((): void => {
    mockLocalStorage.data = {};
  }),
  key: jest.fn((index: number): string | null => {
    const keys = Object.keys(mockLocalStorage.data);
    return keys[index] || null;
  }),
};

// Mock global localStorage
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

// Mock Firebase services
const mockFirebaseServices = {
  db: {},
  auth: {},
  storage: {},
  initializeApp: jest.fn(),
};

describe('Shared Services', () => {
  beforeEach(() => {
    mockLocalStorage.data = {};
    jest.clearAllMocks();
  });

  describe('StorageService', () => {
    it('should create storage service with web adapter', () => {
      const adapter = new WebStorageAdapter();
      const storageService = new StorageService(adapter);
      expect(storageService).toBeDefined();
    });

    it('should get and set string values', async () => {
      const adapter = new WebStorageAdapter();
      const storageService = new StorageService(adapter);

      await storageService.set('testKey', 'testValue');
      const value = await storageService.get('testKey');

      expect(value).toBe('testValue');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should get and set JSON values', async () => {
      const adapter = new WebStorageAdapter();
      const storageService = new StorageService(adapter);

      const testObject = { name: 'test', value: 123 };
      await storageService.setJSON('testKey', testObject);
      const value = await storageService.getJSON('testKey');

      expect(value).toEqual(testObject);
    });

    it('should remove values', async () => {
      const adapter = new WebStorageAdapter();
      const storageService = new StorageService(adapter);

      await storageService.set('testKey', 'testValue');
      await storageService.remove('testKey');
      const value = await storageService.get('testKey');

      expect(value).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should clear all values', async () => {
      const adapter = new WebStorageAdapter();
      const storageService = new StorageService(adapter);

      await storageService.set('key1', 'value1');
      await storageService.set('key2', 'value2');
      await storageService.clear();

      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });

    it('should handle JSON parse errors gracefully', async () => {
      const adapter = new WebStorageAdapter();
      const storageService = new StorageService(adapter);

      // Manually set invalid JSON
      mockLocalStorage.data['testKey'] = 'invalid json';
      
      const value = await storageService.getJSON('testKey');
      expect(value).toBeNull();
    });
  });

  describe('Firebase Services', () => {
    it('should set and get Firebase services', () => {
      setFirebaseServices(mockFirebaseServices as any);
      const services = getFirebaseServices();
      
      expect(services).toBe(mockFirebaseServices);
    });

    it('should throw error when getting services before setting', () => {
      // Reset Firebase services
      setFirebaseServices(null as any);
      
      expect(() => getFirebaseServices()).toThrow('Firebase services not initialized');
    });
  });

  describe('WebStorageAdapter', () => {
    it('should handle storage errors gracefully', async () => {
      const adapter = new WebStorageAdapter();
      
      // Mock an error
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const value = await adapter.getItem('testKey');
      expect(value).toBeNull();
    });

    it('should handle setItem errors', async () => {
      const adapter = new WebStorageAdapter();
      
      // Mock an error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(adapter.setItem('testKey', 'testValue')).rejects.toThrow('Storage quota exceeded');
    });
  });
});
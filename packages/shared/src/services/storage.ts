// Platform-agnostic storage interface for shared services

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Helper function to get storage
function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof global !== 'undefined' && (global as any).localStorage) {
    return (global as any).localStorage;
  }
  return null;
}

// Default implementation for web localStorage
export class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      const storage = getStorage();
      return storage?.getItem(key) || null;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = getStorage();
      if (!storage) throw new Error('Storage not available');
      storage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const storage = getStorage();
      if (!storage) throw new Error('Storage not available');
      storage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const storage = getStorage();
      if (!storage) throw new Error('Storage not available');
      storage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }
}

// Storage service singleton
export class StorageService {
  private adapter: StorageAdapter;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  setAdapter(adapter: StorageAdapter): void {
    this.adapter = adapter;
  }

  async get(key: string): Promise<string | null> {
    return this.adapter.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    return this.adapter.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    return this.adapter.removeItem(key);
  }

  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  // Convenience methods for JSON data
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('JSON parse error:', error);
      return null;
    }
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.set(key, jsonString);
    } catch (error) {
      console.error('JSON stringify error:', error);
      throw error;
    }
  }
}

// Default instance with web storage
export const storageService = new StorageService(new WebStorageAdapter());
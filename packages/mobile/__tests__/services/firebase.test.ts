import { setFirebaseServices } from '@famapp/shared';

// Mock Firebase React Native modules
jest.mock('@react-native-firebase/auth', () => () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  currentUser: null,
}));

jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: jest.fn(() => ({
    add: jest.fn(),
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    where: jest.fn(() => ({
      get: jest.fn(),
    })),
    orderBy: jest.fn(() => ({
      get: jest.fn(),
    })),
  })),
}));

jest.mock('@react-native-firebase/storage', () => () => ({
  ref: jest.fn(() => ({
    putFile: jest.fn(),
    getDownloadURL: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Firebase Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports Firebase configuration without errors', () => {
    expect(() => {
      require('../../src/config/firebase');
    }).not.toThrow();
  });

  it('calls setFirebaseServices with correct parameters', () => {
    const mockSetFirebaseServices = jest.mocked(setFirebaseServices);
    
    // Import the Firebase configuration
    require('../../src/config/firebase');

    expect(mockSetFirebaseServices).toHaveBeenCalledWith({
      db: expect.any(Object),
      auth: expect.any(Object),
      storage: expect.any(Object),
      googleProvider: null,
      initializeApp: expect.any(Function),
    });
  });

  it('provides auth service instance', () => {
    const mockSetFirebaseServices = jest.mocked(setFirebaseServices);
    
    require('../../src/config/firebase');

    const callArgs = mockSetFirebaseServices.mock.calls[0][0];
    expect(callArgs.auth).toBeDefined();
    expect(typeof callArgs.auth.signInWithEmailAndPassword).toBe('function');
    expect(typeof callArgs.auth.signOut).toBe('function');
    expect(typeof callArgs.auth.onAuthStateChanged).toBe('function');
  });

  it('provides firestore service instance', () => {
    const mockSetFirebaseServices = jest.mocked(setFirebaseServices);
    
    require('../../src/config/firebase');

    const callArgs = mockSetFirebaseServices.mock.calls[0][0];
    expect(callArgs.db).toBeDefined();
    expect(typeof callArgs.db.collection).toBe('function');
  });

  it('provides storage service instance', () => {
    const mockSetFirebaseServices = jest.mocked(setFirebaseServices);
    
    require('../../src/config/firebase');

    const callArgs = mockSetFirebaseServices.mock.calls[0][0];
    expect(callArgs.storage).toBeDefined();
    expect(typeof callArgs.storage.ref).toBe('function');
  });

  it('sets googleProvider to null for React Native', () => {
    const mockSetFirebaseServices = jest.mocked(setFirebaseServices);
    
    require('../../src/config/firebase');

    const callArgs = mockSetFirebaseServices.mock.calls[0][0];
    expect(callArgs.googleProvider).toBeNull();
  });

  it('provides empty initializeApp function', () => {
    const mockSetFirebaseServices = jest.mocked(setFirebaseServices);
    
    require('../../src/config/firebase');

    const callArgs = mockSetFirebaseServices.mock.calls[0][0];
    expect(typeof callArgs.initializeApp).toBe('function');
    
    // Should not throw when called
    expect(() => callArgs.initializeApp()).not.toThrow();
  });

  it('exports auth instance', () => {
    const firebaseConfig = require('../../src/config/firebase');
    
    expect(firebaseConfig.auth).toBeDefined();
    expect(firebaseConfig.db).toBeDefined();
    expect(firebaseConfig.storage).toBeDefined();
  });

  it('configures Firebase services only once', () => {
    const mockSetFirebaseServices = jest.mocked(setFirebaseServices);
    mockSetFirebaseServices.mockClear();
    
    // Import multiple times
    require('../../src/config/firebase');
    require('../../src/config/firebase');
    require('../../src/config/firebase');

    // Should only be called once due to module caching
    expect(mockSetFirebaseServices).toHaveBeenCalledTimes(1);
  });

  it('provides correct Firebase service structure', () => {
    const mockSetFirebaseServices = jest.mocked(setFirebaseServices);
    
    require('../../src/config/firebase');

    const callArgs = mockSetFirebaseServices.mock.calls[0][0];
    
    // Verify the structure matches what shared services expect
    expect(callArgs).toHaveProperty('db');
    expect(callArgs).toHaveProperty('auth');
    expect(callArgs).toHaveProperty('storage');
    expect(callArgs).toHaveProperty('googleProvider');
    expect(callArgs).toHaveProperty('initializeApp');
    
    // Verify types
    expect(typeof callArgs.db).toBe('object');
    expect(typeof callArgs.auth).toBe('object');
    expect(typeof callArgs.storage).toBe('object');
    expect(callArgs.googleProvider).toBeNull();
    expect(typeof callArgs.initializeApp).toBe('function');
  });
});
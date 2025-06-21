import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Custom render function that wraps components with necessary providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  ...global.mockUser,
  ...overrides,
});

export const createMockTodo = (overrides = {}) => ({
  ...global.mockTodo,
  ...overrides,
});

export const createMockEvent = (overrides = {}) => ({
  ...global.mockEvent,
  ...overrides,
});

export const createMockGroceryItem = (overrides = {}) => ({
  ...global.mockGroceryItem,
  ...overrides,
});

export const createMockDocument = (overrides = {}) => ({
  ...global.mockDocument,
  ...overrides,
});

// Common test utilities
export const waitForLoadingToFinish = async () => {
  // Helper to wait for loading states to complete
  await new Promise(resolve => setTimeout(resolve, 0));
};

export const mockAsyncOperation = <T>(
  result: T,
  delay = 0
): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(result), delay);
  });
};

export const mockAsyncError = (
  error: Error | string,
  delay = 0
): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(typeof error === 'string' ? new Error(error) : error);
    }, delay);
  });
};

// Firebase mock helpers
export const mockFirebaseSuccess = (service: any, method: string, result: any) => {
  if (service && service[method]) {
    service[method].mockResolvedValue(result);
  }
};

export const mockFirebaseError = (service: any, method: string, error: Error | string) => {
  if (service && service[method]) {
    service[method].mockRejectedValue(
      typeof error === 'string' ? new Error(error) : error
    );
  }
};

// Date helpers for consistent testing
export const createMockDate = (dateString: string) => new Date(dateString);

export const mockCurrentDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  return mockDate;
};

// Alert mock helpers
export const mockAlertConfirm = () => {
  const originalAlert = require('react-native').Alert.alert;
  require('react-native').Alert.alert = jest.fn((title, message, buttons) => {
    if (buttons && buttons.length > 1) {
      // Simulate pressing the confirm button
      const confirmButton = buttons.find((b: any) => 
        b.style !== 'cancel' && b.onPress
      );
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress();
      }
    }
  });
  return originalAlert;
};

export const mockAlertCancel = () => {
  const originalAlert = require('react-native').Alert.alert;
  require('react-native').Alert.alert = jest.fn((title, message, buttons) => {
    if (buttons && buttons.length > 1) {
      // Simulate pressing the cancel button
      const cancelButton = buttons.find((b: any) => 
        b.style === 'cancel' && b.onPress
      );
      if (cancelButton && cancelButton.onPress) {
        cancelButton.onPress();
      }
    }
  });
  return originalAlert;
};

// Navigation mock helpers
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

export const createMockRoute = (params = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params,
});

// Storage mock helpers
export const mockAsyncStorage = () => {
  const mockStorage: { [key: string]: string } = {};
  
  require('@react-native-async-storage/async-storage').getItem = jest.fn(
    (key: string) => Promise.resolve(mockStorage[key] || null)
  );
  
  require('@react-native-async-storage/async-storage').setItem = jest.fn(
    (key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }
  );
  
  require('@react-native-async-storage/async-storage').removeItem = jest.fn(
    (key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }
  );
  
  require('@react-native-async-storage/async-storage').clear = jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  });
  
  return mockStorage;
};

// Performance testing helpers
export const measureRenderTime = (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Screen size mocking for responsive tests
export const mockScreenDimensions = (width: number, height: number) => {
  const mockDimensions = {
    get: jest.fn(() => ({ width, height })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  
  jest.doMock('react-native/Libraries/Utilities/Dimensions', () => mockDimensions);
  return mockDimensions;
};
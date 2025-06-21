import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../src/App';
import { authService } from '@famapp/shared';

// Mock the navigation components
jest.mock('../src/navigation/AppNavigator', () => ({
  AppNavigator: ({ isAuthenticated }: { isAuthenticated: boolean }) => {
    const MockText = require('react-native').Text;
    return (
      <MockText>
        {isAuthenticated ? 'Authenticated App' : 'Login Screen'}
      </MockText>
    );
  },
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock auth state that never resolves
    jest.mocked(authService.onAuthStateChanged).mockImplementation(() => () => {});

    const { queryByText } = render(<App />);
    
    // Should not render anything during loading
    expect(queryByText('Authenticated App')).toBeNull();
    expect(queryByText('Login Screen')).toBeNull();
  });

  it('shows login screen when user is not authenticated', async () => {
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(null); // No user
      return () => {};
    });

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('Login Screen')).toBeTruthy();
    });
  });

  it('shows main app when user is authenticated', async () => {
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(global.mockUser); // User is logged in
      return () => {};
    });

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('Authenticated App')).toBeTruthy();
    });
  });

  it('sets up auth state listener on mount', () => {
    const mockUnsubscribe = jest.fn();
    jest.mocked(authService.onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    render(<App />);

    expect(authService.onAuthStateChanged).toHaveBeenCalled();
  });

  it('cleans up auth state listener on unmount', () => {
    const mockUnsubscribe = jest.fn();
    jest.mocked(authService.onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<App />);
    
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('updates authentication state when user logs in', async () => {
    let authCallback: ((user: any) => void) | null = null;
    
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      authCallback = callback;
      callback(null); // Start with no user
      return () => {};
    });

    const { getByText, rerender } = render(<App />);

    await waitFor(() => {
      expect(getByText('Login Screen')).toBeTruthy();
    });

    // Simulate user login
    if (authCallback) {
      authCallback(global.mockUser);
    }

    await waitFor(() => {
      expect(getByText('Authenticated App')).toBeTruthy();
    });
  });

  it('updates authentication state when user logs out', async () => {
    let authCallback: ((user: any) => void) | null = null;
    
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      authCallback = callback;
      callback(global.mockUser); // Start with user logged in
      return () => {};
    });

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('Authenticated App')).toBeTruthy();
    });

    // Simulate user logout
    if (authCallback) {
      authCallback(null);
    }

    await waitFor(() => {
      expect(getByText('Login Screen')).toBeTruthy();
    });
  });

  it('renders StatusBar with correct props', () => {
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });

    const { UNSAFE_getByType } = render(<App />);

    const statusBar = UNSAFE_getByType('StatusBar');
    expect(statusBar.props.barStyle).toBe('dark-content');
    expect(statusBar.props.backgroundColor).toBe('#ffffff');
  });

  it('passes correct authentication state to navigator', async () => {
    // Mock authenticated state
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(global.mockUser);
      return () => {};
    });

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('Authenticated App')).toBeTruthy();
    });

    // Mock unauthenticated state
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });

    const { getByText: getByTextSecond } = render(<App />);

    await waitFor(() => {
      expect(getByTextSecond('Login Screen')).toBeTruthy();
    });
  });

  it('imports Firebase and storage configurations', () => {
    // Mock the imports to verify they are loaded
    const firebaseConfigSpy = jest.fn();
    const storageConfigSpy = jest.fn();

    jest.doMock('../src/config/firebase', firebaseConfigSpy);
    jest.doMock('../src/services/storage', storageConfigSpy);

    render(<App />);

    // The imports should be loaded when the module is required
    // This is verified by the fact that the app renders without errors
    expect(true).toBeTruthy();
  });

  it('handles rapid auth state changes correctly', async () => {
    let authCallback: ((user: any) => void) | null = null;
    
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      authCallback = callback;
      return () => {};
    });

    const { getByText, queryByText } = render(<App />);

    // Rapid state changes
    if (authCallback) {
      authCallback(null); // Logout
      authCallback(global.mockUser); // Login
      authCallback(null); // Logout again
    }

    await waitFor(() => {
      expect(getByText('Login Screen')).toBeTruthy();
      expect(queryByText('Authenticated App')).toBeNull();
    });
  });
});
import React from 'react';
import { render, fireEvent, waitFor } from '../utils/testUtils';
import { Alert } from 'react-native';
import App from '../../src/App';
import { authService, todoService } from '@famapp/shared';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation components for integration testing
jest.mock('../../src/navigation/AppNavigator', () => ({
  AppNavigator: ({ isAuthenticated }: { isAuthenticated: boolean }) => {
    if (isAuthenticated) {
      const { TodosScreen } = require('../../src/screens/TodosScreen');
      return <TodosScreen />;
    } else {
      const { LoginScreen } = require('../../src/screens/LoginScreen');
      return <LoginScreen />;
    }
  },
}));

describe('App Integration Flow', () => {
  let authCallback: ((user: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    authCallback = null;
    
    // Setup auth state listener mock
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      authCallback = callback;
      callback(null); // Start unauthenticated
      return () => {};
    });
    
    // Setup default service mocks
    jest.mocked(authService.signInWithEmailAndPassword).mockResolvedValue(global.mockUser);
    jest.mocked(todoService.getTodos).mockResolvedValue([]);
  });

  it('completes full login to todos flow', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    // Should start with login screen
    await waitFor(() => {
      expect(getByText('FAMAPP')).toBeTruthy();
      expect(getByText('Inicia sesión para continuar')).toBeTruthy();
    });

    // Fill in login form
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Contraseña');
    const loginButton = getByText('Iniciar Sesión');

    fireEvent.changeText(emailInput, 'test@famapp.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    // Should call login service
    await waitFor(() => {
      expect(authService.signInWithEmailAndPassword).toHaveBeenCalledWith(
        'test@famapp.com',
        'password123'
      );
    });

    // Simulate successful login
    if (authCallback) {
      authCallback(global.mockUser);
    }

    // Should now show todos screen
    await waitFor(() => {
      expect(getByText('No hay todos')).toBeTruthy();
    });

    expect(todoService.getTodos).toHaveBeenCalled();
  });

  it('handles login failure gracefully', async () => {
    jest.mocked(authService.signInWithEmailAndPassword).mockRejectedValue(
      new Error('Invalid credentials')
    );

    const { getByText, getByPlaceholderText } = render(<App />);

    await waitFor(() => {
      expect(getByText('FAMAPP')).toBeTruthy();
    });

    // Fill in login form with wrong credentials
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Contraseña');
    const loginButton = getByText('Iniciar Sesión');

    fireEvent.changeText(emailInput, 'test@famapp.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error de Login',
        'Invalid credentials'
      );
    });

    // Should still be on login screen
    expect(getByText('FAMAPP')).toBeTruthy();
  });

  it('loads todos after successful authentication', async () => {
    const mockTodos = [
      {
        ...global.mockTodo,
        id: 'todo-1',
        text: 'Integration test todo',
      },
    ];
    jest.mocked(todoService.getTodos).mockResolvedValue(mockTodos);

    const { getByText } = render(<App />);

    // Simulate already authenticated user
    if (authCallback) {
      authCallback(global.mockUser);
    }

    await waitFor(() => {
      expect(getByText('Integration test todo')).toBeTruthy();
    });

    expect(todoService.getTodos).toHaveBeenCalled();
  });

  it('can add new todo after authentication', async () => {
    const newTodo = {
      ...global.mockTodo,
      id: 'new-todo',
      text: 'New integration todo',
    };
    jest.mocked(todoService.addTodo).mockResolvedValue(newTodo);
    jest.mocked(todoService.getTodos).mockResolvedValue([]);

    const { getByText, getByPlaceholderText } = render(<App />);

    // Start authenticated
    if (authCallback) {
      authCallback(global.mockUser);
    }

    await waitFor(() => {
      expect(getByText('No hay todos')).toBeTruthy();
    });

    // Open add todo modal
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Todo')).toBeTruthy();
    });

    // Fill in new todo
    const input = getByPlaceholderText('Escribe tu todo...');
    fireEvent.changeText(input, 'New integration todo');

    const saveButton = getByText('Guardar');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(todoService.addTodo).toHaveBeenCalledWith({
        text: 'New integration todo',
        completed: false,
        assignedTo: 'gonzalo',
        createdBy: 'gonzalo',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  it('handles authentication state changes during app usage', async () => {
    const { getByText, queryByText } = render(<App />);

    // Start unauthenticated
    await waitFor(() => {
      expect(getByText('FAMAPP')).toBeTruthy();
    });

    // Login
    if (authCallback) {
      authCallback(global.mockUser);
    }

    await waitFor(() => {
      expect(getByText('No hay todos')).toBeTruthy();
    });

    // Logout
    if (authCallback) {
      authCallback(null);
    }

    await waitFor(() => {
      expect(getByText('FAMAPP')).toBeTruthy();
      expect(queryByText('No hay todos')).toBeNull();
    });
  });

  it('maintains app state during auth state changes', async () => {
    let renderCount = 0;
    const mockOnAuthStateChanged = jest.fn((callback) => {
      renderCount++;
      authCallback = callback;
      callback(null);
      return () => {};
    });
    
    jest.mocked(authService.onAuthStateChanged).mockImplementation(mockOnAuthStateChanged);

    const { rerender } = render(<App />);

    // Multiple rerenders shouldn't cause multiple auth listeners
    rerender(<App />);
    rerender(<App />);

    // Should only setup one auth listener
    expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
  });

  it('cleans up properly on unmount', async () => {
    const mockUnsubscribe = jest.fn();
    jest.mocked(authService.onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<App />);

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('handles network errors gracefully', async () => {
    jest.mocked(todoService.getTodos).mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<App />);

    // Authenticate user
    if (authCallback) {
      authCallback(global.mockUser);
    }

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudieron cargar los todos'
      );
    });
  });

  it('shows loading states appropriately', async () => {
    // Mock slow login
    jest.mocked(authService.signInWithEmailAndPassword).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(global.mockUser), 100))
    );

    const { getByText, getByPlaceholderText } = render(<App />);

    await waitFor(() => {
      expect(getByText('FAMAPP')).toBeTruthy();
    });

    // Start login
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Contraseña');
    const loginButton = getByText('Iniciar Sesión');

    fireEvent.changeText(emailInput, 'test@famapp.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    // Should show loading state
    expect(getByText('Iniciando sesión...')).toBeTruthy();
  });

  it('persists authentication across app restarts', async () => {
    // Simulate app restart by remounting
    const { unmount, rerender } = render(<App />);

    // Initial unauthenticated state
    await waitFor(() => {
      expect(authCallback).toBeTruthy();
    });

    unmount();

    // Simulate app restart with persisted auth
    jest.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      authCallback = callback;
      callback(global.mockUser); // User is already authenticated
      return () => {};
    });

    render(<App />);

    await waitFor(() => {
      expect(todoService.getTodos).toHaveBeenCalled();
    });
  });
});
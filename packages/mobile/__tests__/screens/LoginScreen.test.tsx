import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '../../src/screens/LoginScreen';
import { authService } from '@famapp/shared';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByText('FAMAPP')).toBeTruthy();
    expect(getByText('Inicia sesión para continuar')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
    expect(getByText('Iniciar Sesión')).toBeTruthy();
  });

  it('shows error when fields are empty', async () => {
    const { getByText } = render(<LoginScreen />);
    
    const loginButton = getByText('Iniciar Sesión');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Por favor ingresa email y contraseña'
      );
    });
  });

  it('calls authService when login form is submitted', async () => {
    const mockSignIn = jest.mocked(authService.signInWithEmailAndPassword);
    mockSignIn.mockResolvedValueOnce(global.mockUser);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Contraseña');
    const loginButton = getByText('Iniciar Sesión');

    fireEvent.changeText(emailInput, 'test@famapp.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@famapp.com', 'password123');
    });
  });

  it('shows error message when login fails', async () => {
    const mockSignIn = jest.mocked(authService.signInWithEmailAndPassword);
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
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
  });

  it('shows loading state during login', async () => {
    const mockSignIn = jest.mocked(authService.signInWithEmailAndPassword);
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Contraseña');
    const loginButton = getByText('Iniciar Sesión');

    fireEvent.changeText(emailInput, 'test@famapp.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    expect(getByText('Iniciando sesión...')).toBeTruthy();
  });

  it('disables login button during loading', async () => {
    const mockSignIn = jest.mocked(authService.signInWithEmailAndPassword);
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Contraseña');
    const loginButton = getByText('Iniciar Sesión');

    fireEvent.changeText(emailInput, 'test@famapp.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    // Button should be disabled during loading
    expect(loginButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('handles keyboard avoiding view on iOS', () => {
    const { UNSAFE_getByType } = render(<LoginScreen />);
    
    // Should render KeyboardAvoidingView
    const keyboardAvoidingView = UNSAFE_getByType('KeyboardAvoidingView');
    expect(keyboardAvoidingView).toBeTruthy();
  });

  it('sets correct input properties', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Contraseña');

    // Email input should have correct keyboard type
    expect(emailInput.props.keyboardType).toBe('email-address');
    expect(emailInput.props.autoCapitalize).toBe('none');
    expect(emailInput.props.autoCorrect).toBe(false);

    // Password input should be secure
    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(passwordInput.props.autoCapitalize).toBe('none');
    expect(passwordInput.props.autoCorrect).toBe(false);
  });
});
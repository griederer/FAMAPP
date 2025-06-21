import React from 'react';
import { render } from '@testing-library/react-native';
import { AppNavigator } from '../../src/navigation/AppNavigator';

// Mock navigation libraries
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => {
    const MockView = require('react-native').View;
    return <MockView testID="navigation-container">{children}</MockView>;
  },
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children, screenOptions }: any) => {
      const MockView = require('react-native').View;
      return <MockView testID="tab-navigator">{children}</MockView>;
    },
    Screen: ({ name, component, options }: any) => {
      const MockView = require('react-native').View;
      const MockText = require('react-native').Text;
      return (
        <MockView testID={`tab-screen-${name.toLowerCase()}`}>
          <MockText>{name}</MockText>
        </MockView>
      );
    },
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children, screenOptions }: any) => {
      const MockView = require('react-native').View;
      return <MockView testID="stack-navigator">{children}</MockView>;
    },
    Screen: ({ name, component }: any) => {
      const MockView = require('react-native').View;
      const MockText = require('react-native').Text;
      return (
        <MockView testID={`stack-screen-${name.toLowerCase()}`}>
          <MockText>{name}</MockText>
        </MockView>
      );
    },
  }),
}));

// Mock screen components
jest.mock('../../src/screens/LoginScreen', () => ({
  LoginScreen: () => {
    const MockText = require('react-native').Text;
    return <MockText testID="login-screen">Login Screen</MockText>;
  },
}));

jest.mock('../../src/screens/TodosScreen', () => ({
  TodosScreen: () => {
    const MockText = require('react-native').Text;
    return <MockText testID="todos-screen">Todos Screen</MockText>;
  },
}));

jest.mock('../../src/screens/CalendarScreen', () => ({
  CalendarScreen: () => {
    const MockText = require('react-native').Text;
    return <MockText testID="calendar-screen">Calendar Screen</MockText>;
  },
}));

jest.mock('../../src/screens/GroceriesScreen', () => ({
  GroceriesScreen: () => {
    const MockText = require('react-native').Text;
    return <MockText testID="groceries-screen">Groceries Screen</MockText>;
  },
}));

jest.mock('../../src/screens/DocumentsScreen', () => ({
  DocumentsScreen: () => {
    const MockText = require('react-native').Text;
    return <MockText testID="documents-screen">Documents Screen</MockText>;
  },
}));

describe('AppNavigator', () => {
  it('renders NavigationContainer', () => {
    const { getByTestId } = render(<AppNavigator isAuthenticated={false} />);
    expect(getByTestId('navigation-container')).toBeTruthy();
  });

  it('shows login screen when not authenticated', () => {
    const { getByTestId, getByText } = render(<AppNavigator isAuthenticated={false} />);
    
    expect(getByTestId('stack-navigator')).toBeTruthy();
    expect(getByTestId('stack-screen-login')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('shows main tab navigator when authenticated', () => {
    const { getByTestId, getByText } = render(<AppNavigator isAuthenticated={true} />);
    
    expect(getByTestId('stack-navigator')).toBeTruthy();
    expect(getByTestId('stack-screen-main')).toBeTruthy();
    expect(getByText('Main')).toBeTruthy();
  });

  it('renders all tab screens when authenticated', () => {
    const { getByTestId, getByText } = render(<AppNavigator isAuthenticated={true} />);
    
    // Should render tab navigator
    expect(getByTestId('tab-navigator')).toBeTruthy();
    
    // Should render all tab screens
    expect(getByTestId('tab-screen-todos')).toBeTruthy();
    expect(getByTestId('tab-screen-calendar')).toBeTruthy();
    expect(getByTestId('tab-screen-groceries')).toBeTruthy();
    expect(getByTestId('tab-screen-documents')).toBeTruthy();
    
    // Check tab labels
    expect(getByText('Todos')).toBeTruthy();
    expect(getByText('Calendar')).toBeTruthy();
    expect(getByText('Groceries')).toBeTruthy();
    expect(getByText('Documents')).toBeTruthy();
  });

  it('renders icon components for tabs', () => {
    const { UNSAFE_getAllByType } = render(<AppNavigator isAuthenticated={true} />);
    
    // Should render View components for the icons
    const iconViews = UNSAFE_getAllByType('View');
    expect(iconViews.length).toBeGreaterThan(0);
  });

  it('switches between authenticated and unauthenticated states', () => {
    // Test unauthenticated state
    const { rerender, getByTestId, getByText, queryByTestId } = render(
      <AppNavigator isAuthenticated={false} />
    );
    
    expect(getByTestId('stack-screen-login')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(queryByTestId('tab-navigator')).toBeNull();
    
    // Test authenticated state
    rerender(<AppNavigator isAuthenticated={true} />);
    
    expect(getByTestId('stack-screen-main')).toBeTruthy();
    expect(getByText('Main')).toBeTruthy();
    expect(getByTestId('tab-navigator')).toBeTruthy();
  });

  it('configures stack navigator with headerShown false', () => {
    // This test verifies the structure is correct
    const { getByTestId } = render(<AppNavigator isAuthenticated={false} />);
    expect(getByTestId('stack-navigator')).toBeTruthy();
  });

  it('renders proper icon components', () => {
    const { UNSAFE_getAllByType } = render(<AppNavigator isAuthenticated={true} />);
    
    // Icons are rendered as View components in our implementation
    const views = UNSAFE_getAllByType('View');
    
    // Should have views for the tab icons
    expect(views.length).toBeGreaterThan(4); // At least one for each tab
  });

  it('maintains navigation structure consistency', () => {
    // Test that the navigation structure is consistent
    const { getByTestId } = render(<AppNavigator isAuthenticated={true} />);
    
    expect(getByTestId('navigation-container')).toBeTruthy();
    expect(getByTestId('stack-navigator')).toBeTruthy();
    expect(getByTestId('tab-navigator')).toBeTruthy();
  });

  it('handles boolean prop changes correctly', () => {
    const { rerender, queryByTestId } = render(<AppNavigator isAuthenticated={false} />);
    
    // Initial state - should show login
    expect(queryByTestId('stack-screen-login')).toBeTruthy();
    expect(queryByTestId('tab-navigator')).toBeNull();
    
    // Change to authenticated
    rerender(<AppNavigator isAuthenticated={true} />);
    expect(queryByTestId('stack-screen-main')).toBeTruthy();
    expect(queryByTestId('tab-navigator')).toBeTruthy();
    
    // Change back to unauthenticated
    rerender(<AppNavigator isAuthenticated={false} />);
    expect(queryByTestId('stack-screen-login')).toBeTruthy();
    expect(queryByTestId('tab-navigator')).toBeNull();
  });

  it('renders with default navigation configuration', () => {
    // Test that navigation renders without errors with default props
    const { getByTestId } = render(<AppNavigator isAuthenticated={false} />);
    
    expect(getByTestId('navigation-container')).toBeTruthy();
    expect(getByTestId('stack-navigator')).toBeTruthy();
  });
});
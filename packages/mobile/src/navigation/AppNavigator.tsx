// Main navigation for FAMAPP mobile
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import { TodosScreen } from '../screens/TodosScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { GroceriesScreen } from '../screens/GroceriesScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { LoginScreen } from '../screens/LoginScreen';

// Types
import type { ModuleId } from '@famapp/shared';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Tab.Screen 
        name="Todos" 
        component={TodosScreen}
        options={{
          title: 'Todos',
          tabBarIcon: ({ color, size }) => (
            <TodoIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <CalendarIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Groceries" 
        component={GroceriesScreen}
        options={{
          title: 'Groceries',
          tabBarIcon: ({ color, size }) => (
            <GroceriesIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size }) => (
            <DocumentsIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export function AppNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Placeholder icons (will be replaced with proper icons)
function TodoIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
  );
}

function CalendarIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
  );
}

function GroceriesIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
  );
}

function DocumentsIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
  );
}
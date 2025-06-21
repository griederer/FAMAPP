// Test setup for React Native components
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(),
}));

// Mock Firebase services
jest.mock('@famapp/shared', () => ({
  authService: {
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  todoService: {
    getTodos: jest.fn(),
    addTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
  },
  calendarService: {
    getEvents: jest.fn(),
    addEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  },
  groceryService: {
    getGroceries: jest.fn(),
    addGrocery: jest.fn(),
    updateGrocery: jest.fn(),
    deleteGrocery: jest.fn(),
  },
  documentService: {
    getDocuments: jest.fn(),
    uploadDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
  storageService: {
    setAdapter: jest.fn(),
  },
  setFirebaseServices: jest.fn(),
}));

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve('mockOpened')),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve()),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Global test utilities
global.mockUser = {
  uid: 'test-user-id',
  email: 'test@famapp.com',
  displayName: 'Test User',
  familyMember: 'gonzalo' as const,
  createdAt: new Date('2023-01-01'),
  lastLoginAt: new Date('2024-01-01'),
};

global.mockTodo = {
  id: 'test-todo-id',
  text: 'Test todo item',
  completed: false,
  assignedTo: 'gonzalo' as const,
  createdBy: 'gonzalo' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

global.mockEvent = {
  id: 'test-event-id',
  title: 'Test Event',
  description: 'Test event description',
  startDate: new Date('2024-01-01T10:00:00'),
  endDate: new Date('2024-01-01T11:00:00'),
  createdBy: 'gonzalo' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

global.mockGroceryItem = {
  id: 'test-grocery-id',
  name: 'Test Grocery Item',
  quantity: 1,
  purchased: false,
  addedBy: 'gonzalo' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

global.mockDocument = {
  id: 'test-document-id',
  name: 'test-document.pdf',
  url: 'https://example.com/test-document.pdf',
  size: 1024,
  mimeType: 'application/pdf',
  uploadedBy: 'gonzalo' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
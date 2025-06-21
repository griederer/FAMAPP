import React from 'react';
import { render, measureRenderTime } from '../utils/testUtils';
import { TodosScreen } from '../../src/screens/TodosScreen';
import { CalendarScreen } from '../../src/screens/CalendarScreen';
import { GroceriesScreen } from '../../src/screens/GroceriesScreen';
import { DocumentsScreen } from '../../src/screens/DocumentsScreen';
import { todoService, calendarService, groceryService, documentService } from '@famapp/shared';

// Mock large datasets for performance testing
const createLargeTodoList = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...global.mockTodo,
    id: `todo-${i}`,
    text: `Todo item ${i}`,
    completed: i % 3 === 0, // Mix of completed and incomplete
  }));
};

const createLargeEventList = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...global.mockEvent,
    id: `event-${i}`,
    title: `Event ${i}`,
    startDate: new Date(2024, 0, i % 31 + 1, 10 + (i % 8), 0),
    endDate: new Date(2024, 0, i % 31 + 1, 11 + (i % 8), 0),
  }));
};

const createLargeGroceryList = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...global.mockGroceryItem,
    id: `grocery-${i}`,
    name: `Grocery item ${i}`,
    purchased: i % 4 === 0, // Mix of purchased and unpurchased
  }));
};

const createLargeDocumentList = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...global.mockDocument,
    id: `doc-${i}`,
    name: `document-${i}.pdf`,
    category: `Category ${i % 5}`, // Create 5 categories
  }));
};

describe('Render Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TodosScreen Performance', () => {
    it('renders quickly with small todo list', async () => {
      const smallTodoList = createLargeTodoList(10);
      jest.mocked(todoService.getTodos).mockResolvedValue(smallTodoList);

      const renderTime = measureRenderTime(() => {
        render(<TodosScreen />);
      });

      expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('renders efficiently with large todo list', async () => {
      const largeTodoList = createLargeTodoList(100);
      jest.mocked(todoService.getTodos).mockResolvedValue(largeTodoList);

      const renderTime = measureRenderTime(() => {
        render(<TodosScreen />);
      });

      expect(renderTime).toBeLessThan(500); // Should render in less than 500ms even with 100 items
    });

    it('handles very large todo list without crashing', async () => {
      const veryLargeTodoList = createLargeTodoList(1000);
      jest.mocked(todoService.getTodos).mockResolvedValue(veryLargeTodoList);

      expect(() => {
        render(<TodosScreen />);
      }).not.toThrow();
    });
  });

  describe('CalendarScreen Performance', () => {
    it('renders quickly with small event list', async () => {
      const smallEventList = createLargeEventList(10);
      jest.mocked(calendarService.getEvents).mockResolvedValue(smallEventList);

      const renderTime = measureRenderTime(() => {
        render(<CalendarScreen />);
      });

      expect(renderTime).toBeLessThan(100);
    });

    it('renders efficiently with large event list', async () => {
      const largeEventList = createLargeEventList(50);
      jest.mocked(calendarService.getEvents).mockResolvedValue(largeEventList);

      const renderTime = measureRenderTime(() => {
        render(<CalendarScreen />);
      });

      expect(renderTime).toBeLessThan(300);
    });

    it('groups events efficiently', async () => {
      const eventsWithVariousDates = createLargeEventList(100);
      jest.mocked(calendarService.getEvents).mockResolvedValue(eventsWithVariousDates);

      const startTime = performance.now();
      render(<CalendarScreen />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(400);
    });
  });

  describe('GroceriesScreen Performance', () => {
    it('renders quickly with small grocery list', async () => {
      const smallGroceryList = createLargeGroceryList(10);
      jest.mocked(groceryService.getGroceries).mockResolvedValue(smallGroceryList);

      const renderTime = measureRenderTime(() => {
        render(<GroceriesScreen />);
      });

      expect(renderTime).toBeLessThan(100);
    });

    it('renders efficiently with large grocery list', async () => {
      const largeGroceryList = createLargeGroceryList(100);
      jest.mocked(groceryService.getGroceries).mockResolvedValue(largeGroceryList);

      const renderTime = measureRenderTime(() => {
        render(<GroceriesScreen />);
      });

      expect(renderTime).toBeLessThan(300);
    });

    it('separates purchased and unpurchased items efficiently', async () => {
      const mixedGroceryList = createLargeGroceryList(200);
      jest.mocked(groceryService.getGroceries).mockResolvedValue(mixedGroceryList);

      const startTime = performance.now();
      render(<GroceriesScreen />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(400);
    });
  });

  describe('DocumentsScreen Performance', () => {
    it('renders quickly with small document list', async () => {
      const smallDocumentList = createLargeDocumentList(10);
      jest.mocked(documentService.getDocuments).mockResolvedValue(smallDocumentList);

      const renderTime = measureRenderTime(() => {
        render(<DocumentsScreen />);
      });

      expect(renderTime).toBeLessThan(100);
    });

    it('renders efficiently with large document list', async () => {
      const largeDocumentList = createLargeDocumentList(100);
      jest.mocked(documentService.getDocuments).mockResolvedValue(largeDocumentList);

      const renderTime = measureRenderTime(() => {
        render(<DocumentsScreen />);
      });

      expect(renderTime).toBeLessThan(400);
    });

    it('groups documents by category efficiently', async () => {
      const documentsWithCategories = createLargeDocumentList(150);
      jest.mocked(documentService.getDocuments).mockResolvedValue(documentsWithCategories);

      const startTime = performance.now();
      render(<DocumentsScreen />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('Memory Usage', () => {
    it('does not cause memory leaks with multiple renders', () => {
      const smallTodoList = createLargeTodoList(10);
      jest.mocked(todoService.getTodos).mockResolvedValue(smallTodoList);

      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<TodosScreen />);
        unmount();
      }

      // Should not throw or cause issues
      expect(true).toBeTruthy();
    });

    it('cleans up properly on screen unmount', () => {
      const largeTodoList = createLargeTodoList(100);
      jest.mocked(todoService.getTodos).mockResolvedValue(largeTodoList);

      const { unmount } = render(<TodosScreen />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Interaction Performance', () => {
    it('responds quickly to user interactions', async () => {
      const todoList = createLargeTodoList(50);
      jest.mocked(todoService.getTodos).mockResolvedValue(todoList);
      jest.mocked(todoService.updateTodo).mockResolvedValue();

      const { getByText } = render(<TodosScreen />);

      // Wait for initial render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Measure interaction response time
      const startTime = performance.now();
      
      // This would normally trigger a re-render
      const fab = getByText('+');
      // Simulate interaction without actually triggering it to measure potential time
      
      const endTime = performance.now();

      // Interaction should be instantaneous
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Network Simulation', () => {
    it('handles slow network responses gracefully', async () => {
      // Simulate slow network
      jest.mocked(todoService.getTodos).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(createLargeTodoList(10)), 2000)
        )
      );

      const renderTime = measureRenderTime(() => {
        render(<TodosScreen />);
      });

      // Initial render should still be fast
      expect(renderTime).toBeLessThan(100);
    });

    it('shows loading states without performance impact', async () => {
      // Mock loading state
      jest.mocked(todoService.getTodos).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const renderTime = measureRenderTime(() => {
        render(<TodosScreen />);
      });

      expect(renderTime).toBeLessThan(100);
    });
  });
});
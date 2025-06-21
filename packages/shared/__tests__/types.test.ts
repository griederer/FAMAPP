import { FamilyMember, User, LoadingState, ApiError } from '../src/types/core';
import { Todo, TodoPriority, TodoStatus } from '../src/types/todo';
import { CalendarEvent } from '../src/types/calendar';
import { GroceryItem, GroceryList } from '../src/types/grocery';
import { FamilyDocument } from '../src/types/document';
import { Language } from '../src/types/i18n';

describe('Shared Types', () => {
  describe('Core Types', () => {
    it('should have correct FamilyMember values', () => {
      const members: FamilyMember[] = ['gonzalo', 'mpaz', 'borja', 'melody'];
      expect(members).toHaveLength(4);
    });

    it('should create User interface correctly', () => {
      const user: User = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        familyMember: 'gonzalo',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      expect(user.familyMember).toBe('gonzalo');
    });

    it('should have correct LoadingState values', () => {
      const states: LoadingState[] = ['idle', 'loading', 'success', 'error'];
      expect(states).toHaveLength(4);
    });
  });

  describe('Todo Types', () => {
    it('should have correct TodoPriority values', () => {
      const priorities: TodoPriority[] = ['low', 'medium', 'high'];
      expect(priorities).toHaveLength(3);
    });

    it('should have correct TodoStatus values', () => {
      const statuses: TodoStatus[] = ['pending', 'completed', 'archived'];
      expect(statuses).toHaveLength(3);
    });

    it('should create Todo interface correctly', () => {
      const todo: Todo = {
        id: 'test-id',
        title: 'Test Todo',
        completed: false,
        priority: 'medium',
        createdBy: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(todo.title).toBe('Test Todo');
      expect(todo.completed).toBe(false);
    });
  });

  describe('Calendar Types', () => {
    it('should create CalendarEvent interface correctly', () => {
      const event: CalendarEvent = {
        id: 'event-1',
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
        allDay: false,
        createdBy: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(event.title).toBe('Test Event');
      expect(event.allDay).toBe(false);
    });
  });

  describe('Grocery Types', () => {
    it('should create GroceryItem interface correctly', () => {
      const item: GroceryItem = {
        id: 'item-1',
        name: 'Apples',
        category: 'Fruits & Vegetables',
        quantity: 5,
        unit: 'pcs',
        checked: false,
        addedBy: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(item.name).toBe('Apples');
      expect(item.checked).toBe(false);
    });

    it('should create GroceryList interface correctly', () => {
      const list: GroceryList = {
        id: 'list-1',
        name: 'Weekly Shopping',
        createdBy: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: false,
        items: []
      };
      expect(list.name).toBe('Weekly Shopping');
      expect(list.completed).toBe(false);
    });
  });

  describe('Document Types', () => {
    it('should create FamilyDocument interface correctly', () => {
      const document: FamilyDocument = {
        id: 'doc-1',
        name: 'Test Document',
        description: 'A test document',
        category: 'Médicos',
        tags: ['important'],
        fileUrl: 'https://example.com/file.pdf',
        fileName: 'file.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedBy: 'user-id',
        sharedWith: ['gonzalo'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(document.name).toBe('Test Document');
      expect(document.category).toBe('Médicos');
    });
  });

  describe('I18n Types', () => {
    it('should have correct Language values', () => {
      const languages: Language[] = ['en', 'es'];
      expect(languages).toHaveLength(2);
    });
  });
});
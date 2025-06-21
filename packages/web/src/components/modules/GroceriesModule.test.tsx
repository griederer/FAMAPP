// Comprehensive tests for GroceriesModule
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GroceriesModule } from './GroceriesModule';
import { groceryService } from '../../services/groceryService';
import type { GroceryList, GroceryItem } from '../../services/groceryService';

// Mock the groceryService
vi.mock('../../services/groceryService', () => ({
  groceryService: {
    subscribeToGroceryLists: vi.fn(),
    createGroceryList: vi.fn(),
    updateGroceryList: vi.fn(),
    deleteGroceryList: vi.fn(),
    toggleGroceryListCompletion: vi.fn(),
    addGroceryItem: vi.fn(),
    updateGroceryItem: vi.fn(),
    deleteGroceryItem: vi.fn(),
  },
  GROCERY_CATEGORIES: [
    'Fruits & Vegetables',
    'Meat & Seafood',
    'Dairy & Eggs',
    'Bakery',
    'Pantry & Canned',
    'Frozen',
    'Snacks',
    'Beverages',
    'Personal Care',
    'Household',
    'Other'
  ],
  GROCERY_UNITS: [
    'pcs', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'gal', 'qt', 'pt', 'cup', 'tbsp', 'tsp', 'pack', 'bottle', 'can', 'box'
  ],
}));

const mockGroceryService = groceryService as any;

const sampleGroceryItems: GroceryItem[] = [
  {
    id: 'item1',
    name: 'Milk',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'l',
    checked: false,
    price: 3.50,
    notes: 'Organic if available',
    addedBy: 'user1',
    createdAt: new Date('2024-06-15T10:00:00'),
    updatedAt: new Date('2024-06-15T10:00:00'),
  },
  {
    id: 'item2',
    name: 'Apples',
    category: 'Fruits & Vegetables',
    quantity: 6,
    unit: 'pcs',
    checked: true,
    price: 2.99,
    addedBy: 'user1',
    checkedBy: 'user1',
    createdAt: new Date('2024-06-15T09:00:00'),
    updatedAt: new Date('2024-06-15T11:00:00'),
    checkedAt: new Date('2024-06-15T11:00:00'),
  },
];

const sampleGroceryLists: GroceryList[] = [
  {
    id: 'list1',
    name: 'Weekly Shopping',
    description: 'Regular weekly grocery shopping',
    createdBy: 'user1',
    assignedTo: 'gonzalo',
    createdAt: new Date('2024-06-15T08:00:00'),
    updatedAt: new Date('2024-06-15T10:00:00'),
    completed: false,
    items: sampleGroceryItems,
  },
  {
    id: 'list2',
    name: 'Party Supplies',
    description: 'Items for weekend party',
    createdBy: 'user1',
    assignedTo: 'mpaz',
    createdAt: new Date('2024-06-14T08:00:00'),
    updatedAt: new Date('2024-06-14T08:00:00'),
    completed: true,
    completedAt: new Date('2024-06-14T18:00:00'),
    items: [],
  },
];

describe('GroceriesModule', () => {
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    unsubscribeMock = vi.fn();
    mockGroceryService.subscribeToGroceryLists.mockImplementation((callback) => {
      setTimeout(() => {
        callback(sampleGroceryLists);
      }, 100);
      return unsubscribeMock;
    });

    mockGroceryService.createGroceryList.mockResolvedValue('new-list-id');
    mockGroceryService.updateGroceryList.mockResolvedValue(undefined);
    mockGroceryService.deleteGroceryList.mockResolvedValue(undefined);
    mockGroceryService.toggleGroceryListCompletion.mockResolvedValue(undefined);
    mockGroceryService.addGroceryItem.mockResolvedValue('new-item-id');
    mockGroceryService.updateGroceryItem.mockResolvedValue(undefined);
    mockGroceryService.deleteGroceryItem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders header with title and description', async () => {
      render(<GroceriesModule />);
      
      expect(screen.getByText('Grocery Lists')).toBeInTheDocument();
      expect(screen.getByText('Manage shopping lists together')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(<GroceriesModule />);
      
      // Look for the specific loading spinner element
      const loadingSpinner = document.querySelector('div[style*="animation: spin"]');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('displays stats cards after loading', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Lists')).toBeInTheDocument();
        expect(screen.getByText('Total Items')).toBeInTheDocument();
        expect(screen.getByText('Checked Items')).toBeInTheDocument();
      });
    });

    it('calculates and displays correct stats', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        // Check for Active Lists stat - find the card container with the title
        const activeListsTitle = screen.getByText('Active Lists');
        const activeListsCard = activeListsTitle.closest('div[style*="background-color: white"]');
        expect(activeListsCard).toHaveTextContent('Active Lists');
        expect(activeListsCard).toHaveTextContent('1');
        
        // Check for Total Items stat  
        const totalItemsTitle = screen.getByText('Total Items');
        const totalItemsCard = totalItemsTitle.closest('div[style*="background-color: white"]');
        expect(totalItemsCard).toHaveTextContent('Total Items');
        expect(totalItemsCard).toHaveTextContent('2');
        
        // Check for Checked Items stat
        const checkedItemsTitle = screen.getByText('Checked Items');
        const checkedItemsCard = checkedItemsTitle.closest('div[style*="background-color: white"]');
        expect(checkedItemsCard).toHaveTextContent('Checked Items');
        expect(checkedItemsCard).toHaveTextContent('1');
      });
    });
  });

  describe('Shopping Lists Display', () => {
    it('displays all shopping lists', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument();
        expect(screen.getByText('Party Supplies')).toBeInTheDocument();
      });
    });

    it('shows list descriptions when available', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        expect(screen.getByText('Regular weekly grocery shopping')).toBeInTheDocument();
        expect(screen.getByText('Items for weekend party')).toBeInTheDocument();
      });
    });

    it('shows completed badge for completed lists', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('shows item counts for each list', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        expect(screen.getByText('2 items')).toBeInTheDocument(); // Weekly Shopping
        expect(screen.getByText('0 items')).toBeInTheDocument(); // Party Supplies
      });
    });

    it('shows assignee information', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        expect(screen.getByText('Assigned to gonzalo')).toBeInTheDocument();
        expect(screen.getByText('Assigned to mpaz')).toBeInTheDocument();
      });
    });

    it('shows empty state when no lists exist', async () => {
      mockGroceryService.subscribeToGroceryLists.mockImplementation((callback) => {
        setTimeout(() => callback([]), 100);
        return unsubscribeMock;
      });

      render(<GroceriesModule />);
      
      await waitFor(() => {
        expect(screen.getByText('No shopping lists yet')).toBeInTheDocument();
        expect(screen.getByText('Create your first list to get started')).toBeInTheDocument();
      });
    });
  });

  describe('List Selection and Details', () => {
    it('selects list when clicked', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        const listItem = screen.getByText('Weekly Shopping');
        fireEvent.click(listItem.closest('div')!);
      });

      // Should show selected list details
      expect(screen.getByText('Add Item')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('displays items by category when list is selected', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        const listItem = screen.getByText('Weekly Shopping');
        fireEvent.click(listItem.closest('div')!);
      });

      await waitFor(() => {
        expect(screen.getByText('Dairy & Eggs')).toBeInTheDocument();
        expect(screen.getByText('Fruits & Vegetables')).toBeInTheDocument();
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Apples')).toBeInTheDocument();
      });
    });

    it('shows item details correctly', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        const listItem = screen.getByText('Weekly Shopping');
        fireEvent.click(listItem.closest('div')!);
      });

      await waitFor(() => {
        expect(screen.getByText('1 l')).toBeInTheDocument(); // Milk quantity
        expect(screen.getByText('6 pcs')).toBeInTheDocument(); // Apples quantity
        expect(screen.getByText('$3.50')).toBeInTheDocument(); // Milk price
        expect(screen.getByText('$2.99')).toBeInTheDocument(); // Apples price
        expect(screen.getByText('Organic if available')).toBeInTheDocument(); // Notes
      });
    });

    it('shows empty state when selected list has no items', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        const listItem = screen.getByText('Party Supplies');
        fireEvent.click(listItem.closest('div')!);
      });

      await waitFor(() => {
        expect(screen.getByText('No items in this list')).toBeInTheDocument();
        expect(screen.getByText('Add your first item to get started')).toBeInTheDocument();
      });
    });
  });

  describe('List Creation', () => {
    it('opens new list modal when button is clicked', async () => {
      render(<GroceriesModule />);
      
      const newListButton = screen.getByText('New List');
      fireEvent.click(newListButton);
      
      expect(screen.getByText('Create New Shopping List')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter list name')).toBeInTheDocument();
    });

    it('creates new list with correct data', async () => {
      render(<GroceriesModule />);
      
      const newListButton = screen.getByText('New List');
      fireEvent.click(newListButton);
      
      // Fill out form
      const nameInput = screen.getByPlaceholderText('Enter list name');
      const descriptionInput = screen.getByPlaceholderText('Add description');
      const assigneeSelect = screen.getByDisplayValue('Everyone');
      
      fireEvent.change(nameInput, { target: { value: 'New Test List' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.change(assigneeSelect, { target: { value: 'gonzalo' } });
      
      // Create list
      const createButton = screen.getByText('Create List');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockGroceryService.createGroceryList).toHaveBeenCalledWith({
          name: 'New Test List',
          description: 'Test description',
          assignedTo: 'gonzalo',
        });
      });
    });

    it('closes modal when cancel is clicked', () => {
      render(<GroceriesModule />);
      
      const newListButton = screen.getByText('New List');
      fireEvent.click(newListButton);
      
      expect(screen.getByText('Create New Shopping List')).toBeInTheDocument();
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Create New Shopping List')).not.toBeInTheDocument();
    });
  });

  describe('Item Management', () => {
    beforeEach(async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        const listItem = screen.getByText('Weekly Shopping');
        fireEvent.click(listItem.closest('div')!);
      });
    });

    it('opens add item modal when button is clicked', async () => {
      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);
      
      expect(screen.getByText('Add New Item')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter item name')).toBeInTheDocument();
    });

    it('creates new item with correct data', async () => {
      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);
      
      // Fill out form
      const nameInput = screen.getByPlaceholderText('Enter item name');
      const quantityInput = screen.getByDisplayValue('1');
      const priceInput = screen.getByPlaceholderText('0.00');
      const notesInput = screen.getByPlaceholderText('Add notes');
      
      fireEvent.change(nameInput, { target: { value: 'New Test Item' } });
      fireEvent.change(quantityInput, { target: { value: '2' } });
      fireEvent.change(priceInput, { target: { value: '5.99' } });
      fireEvent.change(notesInput, { target: { value: 'Test notes' } });
      
      // Add item
      const addButton = screen.getByText('Add Item');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(mockGroceryService.addGroceryItem).toHaveBeenCalledWith(
          'list1', // selectedList.id
          {
            name: 'New Test Item',
            category: 'Fruits & Vegetables', // default first category
            quantity: 2,
            unit: 'pcs', // default first unit
            price: 5.99,
            notes: 'Test notes',
          }
        );
      });
    });

    it('toggles item checked state', async () => {
      await waitFor(() => {
        // Find the milk item container first
        const milkText = screen.getByText('Milk');
        const milkContainer = milkText.closest('div[style*="display: flex"]');
        const milkCheckbox = milkContainer!.querySelector('input[type="checkbox"]') as HTMLInputElement;
        expect(milkCheckbox.checked).toBe(false);
        
        fireEvent.click(milkCheckbox);
      });
      
      expect(mockGroceryService.updateGroceryItem).toHaveBeenCalledWith('item1', { checked: true });
    });

    it('opens edit modal when edit button is clicked', async () => {
      await waitFor(() => {
        // Find the milk item container and then the edit button within it
        const milkText = screen.getByText('Milk');
        const milkContainer = milkText.closest('div[style*="display: flex"]');
        const editButton = milkContainer!.querySelector('button[style*="color: rgb(107, 114, 128)"]') as HTMLButtonElement;
        
        fireEvent.click(editButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Edit Item')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Milk')).toBeInTheDocument();
      });
    });

    it('deletes item when delete button is clicked', async () => {
      await waitFor(() => {
        // Find the milk item container and then the delete button within it
        const milkText = screen.getByText('Milk');
        const milkContainer = milkText.closest('div[style*="display: flex"]');
        const deleteButton = milkContainer!.querySelector('button[style*="color: rgb(220, 38, 38)"]') as HTMLButtonElement;
        
        fireEvent.click(deleteButton);
      });
      
      expect(mockGroceryService.deleteGroceryItem).toHaveBeenCalledWith('item1');
    });
  });

  describe('List Actions', () => {
    beforeEach(async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        const listItem = screen.getByText('Weekly Shopping');
        fireEvent.click(listItem.closest('div')!);
      });
    });

    it('toggles list completion', async () => {
      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);
      
      expect(mockGroceryService.toggleGroceryListCompletion).toHaveBeenCalledWith('list1');
    });

    it('deletes list when delete button is clicked', async () => {
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      expect(mockGroceryService.deleteGroceryList).toHaveBeenCalledWith('list1');
    });

    it('shows reopen button for completed lists', async () => {
      // Select completed list
      await waitFor(() => {
        const listItem = screen.getByText('Party Supplies');
        fireEvent.click(listItem.closest('div')!);
      });

      expect(screen.getByText('Reopen')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when list creation fails', async () => {
      mockGroceryService.createGroceryList.mockRejectedValue(new Error('Network error'));
      
      render(<GroceriesModule />);
      
      const newListButton = screen.getByText('New List');
      fireEvent.click(newListButton);
      
      const nameInput = screen.getByPlaceholderText('Enter list name');
      fireEvent.change(nameInput, { target: { value: 'Test List' } });
      
      const createButton = screen.getByText('Create List');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create list')).toBeInTheDocument();
      });
    });

    it('displays error message when item addition fails', async () => {
      mockGroceryService.addGroceryItem.mockRejectedValue(new Error('Network error'));
      
      render(<GroceriesModule />);
      
      await waitFor(() => {
        const listItem = screen.getByText('Weekly Shopping');
        fireEvent.click(listItem.closest('div')!);
      });

      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);
      
      const nameInput = screen.getByPlaceholderText('Enter item name');
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });
      
      const addButton = screen.getByText('Add Item');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to add item')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('does not create list without name', async () => {
      render(<GroceriesModule />);
      
      const newListButton = screen.getByText('New List');
      fireEvent.click(newListButton);
      
      const createButton = screen.getByText('Create List');
      fireEvent.click(createButton);
      
      expect(mockGroceryService.createGroceryList).not.toHaveBeenCalled();
    });

    it('does not create item without name', async () => {
      render(<GroceriesModule />);
      
      await waitFor(() => {
        const listItem = screen.getByText('Weekly Shopping');
        fireEvent.click(listItem.closest('div')!);
      });

      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);
      
      const addButton = screen.getByText('Add Item');
      fireEvent.click(addButton);
      
      expect(mockGroceryService.addGroceryItem).not.toHaveBeenCalled();
    });

    it('trims whitespace from inputs', async () => {
      render(<GroceriesModule />);
      
      const newListButton = screen.getByText('New List');
      fireEvent.click(newListButton);
      
      const nameInput = screen.getByPlaceholderText('Enter list name');
      fireEvent.change(nameInput, { target: { value: '  Test List  ' } });
      
      const createButton = screen.getByText('Create List');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockGroceryService.createGroceryList).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test List', // trimmed
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form inputs', async () => {
      render(<GroceriesModule />);
      
      const newListButton = screen.getByText('New List');
      fireEvent.click(newListButton);
      
      expect(screen.getByLabelText('List Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Assign To')).toBeInTheDocument();
    });

    it('supports keyboard navigation for buttons', async () => {
      render(<GroceriesModule />);
      
      const newListButton = screen.getByText('New List');
      expect(newListButton).toBeInTheDocument();
      
      newListButton.focus();
      fireEvent.keyDown(newListButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Create New Shopping List')).toBeInTheDocument();
      });
    });
  });
});
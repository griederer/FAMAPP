import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { GroceriesScreen } from '../../src/screens/GroceriesScreen';
import { groceryService } from '@famapp/shared';

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockGroceries = [
  {
    ...global.mockGroceryItem,
    id: 'grocery-1',
    name: 'Milk',
    quantity: 2,
    purchased: false,
  },
  {
    ...global.mockGroceryItem,
    id: 'grocery-2',
    name: 'Bread',
    quantity: 1,
    purchased: true,
    purchasedAt: new Date('2024-01-01T12:00:00'),
  },
  {
    ...global.mockGroceryItem,
    id: 'grocery-3',
    name: 'Apples',
    quantity: 5,
    purchased: false,
  },
];

describe('GroceriesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(groceryService.getGroceries).mockResolvedValue(mockGroceries);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<GroceriesScreen />);
    expect(getByText('Cargando productos...')).toBeTruthy();
  });

  it('loads and displays grocery items', async () => {
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
      expect(getByText('Bread')).toBeTruthy();
      expect(getByText('Apples')).toBeTruthy();
    });

    expect(groceryService.getGroceries).toHaveBeenCalled();
  });

  it('shows empty state when no groceries', async () => {
    jest.mocked(groceryService.getGroceries).mockResolvedValue([]);
    
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('No hay productos en la lista')).toBeTruthy();
    });
  });

  it('displays grocery item information correctly', async () => {
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
      expect(getByText('Cantidad: 2 • Agregado por: gonzalo')).toBeTruthy();
      expect(getByText('Cantidad: 5 • Agregado por: gonzalo')).toBeTruthy();
    });
  });

  it('shows purchased date for completed items', async () => {
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Comprado: 1/1/2024')).toBeTruthy();
    });
  });

  it('toggles grocery item purchase status', async () => {
    jest.mocked(groceryService.updateGrocery).mockResolvedValue();
    
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Find and press the milk item
    const milkItem = getByText('Milk').parent?.parent;
    fireEvent.press(milkItem!);

    await waitFor(() => {
      expect(groceryService.updateGrocery).toHaveBeenCalledWith('grocery-1', {
        purchased: true,
        purchasedAt: expect.any(Date)
      });
    });
  });

  it('shows add grocery modal when FAB is pressed', async () => {
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Press the FAB button
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Producto')).toBeTruthy();
      expect(getByText('Nombre del producto')).toBeTruthy();
      expect(getByText('Cantidad')).toBeTruthy();
    });
  });

  it('adds new grocery item', async () => {
    const newItem = { ...global.mockGroceryItem, id: 'new-grocery', name: 'Cheese' };
    jest.mocked(groceryService.addGrocery).mockResolvedValue(newItem);

    const { getByText, getByPlaceholderText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Open add modal
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Producto')).toBeTruthy();
    });

    // Fill in grocery details
    const nameInput = getByPlaceholderText('Nombre del producto');
    const quantityInput = getByPlaceholderText('Cantidad');
    
    fireEvent.changeText(nameInput, 'Cheese');
    fireEvent.changeText(quantityInput, '3');

    // Save the grocery
    const saveButton = getByText('Guardar');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(groceryService.addGrocery).toHaveBeenCalledWith({
        name: 'Cheese',
        quantity: 3,
        purchased: false,
        addedBy: 'gonzalo',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  it('handles delete grocery item', async () => {
    jest.mocked(groceryService.deleteGrocery).mockResolvedValue();

    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Long press to delete
    const milkItem = getByText('Milk').parent?.parent;
    fireEvent(milkItem!, 'onLongPress');

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Eliminar producto',
        '¿Estás seguro de que quieres eliminar este producto?',
        expect.arrayContaining([
          { text: 'Cancelar', style: 'cancel' },
          expect.objectContaining({ text: 'Eliminar', style: 'destructive' })
        ])
      );
    });
  });

  it('confirms deletion and calls delete service', async () => {
    jest.mocked(groceryService.deleteGrocery).mockResolvedValue();
    
    // Mock Alert.alert to automatically press delete
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const deleteButton = buttons?.find((b: any) => b.text === 'Eliminar');
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }
    });

    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Long press to delete
    const milkItem = getByText('Milk').parent?.parent;
    fireEvent(milkItem!, 'onLongPress');

    await waitFor(() => {
      expect(groceryService.deleteGrocery).toHaveBeenCalledWith('grocery-1');
    });
  });

  it('separates purchased and unpurchased items', async () => {
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      // Should show "Comprados" section header
      expect(getByText('Comprados')).toBeTruthy();
    });
  });

  it('cancels add grocery modal', async () => {
    const { getByText, queryByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Open add modal
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Producto')).toBeTruthy();
    });

    // Cancel the modal
    const cancelButton = getByText('Cancelar');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(queryByText('Nuevo Producto')).toBeNull();
    });
  });

  it('handles grocery loading error', async () => {
    jest.mocked(groceryService.getGroceries).mockRejectedValue(new Error('Network error'));

    render(<GroceriesScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudieron cargar los productos'
      );
    });
  });

  it('handles grocery update error', async () => {
    jest.mocked(groceryService.updateGrocery).mockRejectedValue(new Error('Update failed'));

    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Try to toggle grocery
    const milkItem = getByText('Milk').parent?.parent;
    fireEvent.press(milkItem!);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudo actualizar el producto'
      );
    });
  });

  it('handles add grocery error', async () => {
    jest.mocked(groceryService.addGrocery).mockRejectedValue(new Error('Add failed'));

    const { getByText, getByPlaceholderText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Open add modal and try to add grocery
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Producto')).toBeTruthy();
    });

    const nameInput = getByPlaceholderText('Nombre del producto');
    fireEvent.changeText(nameInput, 'New item');

    const saveButton = getByText('Guardar');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudo agregar el producto'
      );
    });
  });

  it('does not add empty grocery', async () => {
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Open add modal
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Producto')).toBeTruthy();
    });

    // Try to save without entering name
    const saveButton = getByText('Guardar');
    fireEvent.press(saveButton);

    // Should not call addGrocery
    expect(groceryService.addGrocery).not.toHaveBeenCalled();
  });

  it('handles invalid quantity input', async () => {
    const newItem = { ...global.mockGroceryItem, id: 'new-grocery', name: 'Test Item' };
    jest.mocked(groceryService.addGrocery).mockResolvedValue(newItem);

    const { getByText, getByPlaceholderText } = render(<GroceriesScreen />);

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    // Open add modal
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Producto')).toBeTruthy();
    });

    // Fill with invalid quantity
    const nameInput = getByPlaceholderText('Nombre del producto');
    const quantityInput = getByPlaceholderText('Cantidad');
    
    fireEvent.changeText(nameInput, 'Test Item');
    fireEvent.changeText(quantityInput, 'invalid');

    const saveButton = getByText('Guardar');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(groceryService.addGrocery).toHaveBeenCalledWith({
        name: 'Test Item',
        quantity: 1, // Should default to 1 for invalid input
        purchased: false,
        addedBy: 'gonzalo',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  it('shows purchased items with correct styling', async () => {
    const { getByText } = render(<GroceriesScreen />);

    await waitFor(() => {
      const breadText = getByText('Bread');
      // Should have strikethrough style for purchased items
      expect(breadText.props.style).toEqual(
        expect.objectContaining({
          textDecorationLine: 'line-through'
        })
      );
    });
  });
});
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { TodosScreen } from '../../src/screens/TodosScreen';
import { todoService } from '@famapp/shared';

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockTodos = [
  {
    ...global.mockTodo,
    id: 'todo-1',
    text: 'First todo',
    completed: false,
  },
  {
    ...global.mockTodo,
    id: 'todo-2',
    text: 'Second todo',
    completed: true,
  },
];

describe('TodosScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(todoService.getTodos).mockResolvedValue(mockTodos);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<TodosScreen />);
    expect(getByText('Cargando todos...')).toBeTruthy();
  });

  it('loads and displays todos', async () => {
    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
      expect(getByText('Second todo')).toBeTruthy();
    });

    expect(todoService.getTodos).toHaveBeenCalled();
  });

  it('shows empty state when no todos', async () => {
    jest.mocked(todoService.getTodos).mockResolvedValue([]);
    
    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('No hay todos')).toBeTruthy();
    });
  });

  it('displays todo information correctly', async () => {
    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
      expect(getByText('Asignado a: gonzalo')).toBeTruthy();
    });
  });

  it('toggles todo completion', async () => {
    jest.mocked(todoService.updateTodo).mockResolvedValue();
    
    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
    });

    // Find and press the todo item
    const todoItem = getByText('First todo').parent?.parent;
    fireEvent.press(todoItem!);

    await waitFor(() => {
      expect(todoService.updateTodo).toHaveBeenCalledWith('todo-1', {
        completed: true
      });
    });
  });

  it('shows add todo modal when FAB is pressed', async () => {
    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
    });

    // Press the FAB button
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Todo')).toBeTruthy();
      expect(getByText('Escribe tu todo...')).toBeTruthy();
    });
  });

  it('adds new todo', async () => {
    const newTodo = { ...global.mockTodo, id: 'new-todo', text: 'New todo item' };
    jest.mocked(todoService.addTodo).mockResolvedValue(newTodo);

    const { getByText, getByPlaceholderText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
    });

    // Open add modal
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Todo')).toBeTruthy();
    });

    // Fill in new todo text
    const input = getByPlaceholderText('Escribe tu todo...');
    fireEvent.changeText(input, 'New todo item');

    // Save the todo
    const saveButton = getByText('Guardar');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(todoService.addTodo).toHaveBeenCalledWith({
        text: 'New todo item',
        completed: false,
        assignedTo: 'gonzalo',
        createdBy: 'gonzalo',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  it('cancels add todo modal', async () => {
    const { getByText, queryByText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
    });

    // Open add modal
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Todo')).toBeTruthy();
    });

    // Cancel the modal
    const cancelButton = getByText('Cancelar');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(queryByText('Nuevo Todo')).toBeNull();
    });
  });

  it('handles todo loading error', async () => {
    jest.mocked(todoService.getTodos).mockRejectedValue(new Error('Network error'));

    render(<TodosScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudieron cargar los todos'
      );
    });
  });

  it('handles todo update error', async () => {
    jest.mocked(todoService.updateTodo).mockRejectedValue(new Error('Update failed'));

    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
    });

    // Try to toggle todo
    const todoItem = getByText('First todo').parent?.parent;
    fireEvent.press(todoItem!);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudo actualizar el todo'
      );
    });
  });

  it('handles add todo error', async () => {
    jest.mocked(todoService.addTodo).mockRejectedValue(new Error('Add failed'));

    const { getByText, getByPlaceholderText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
    });

    // Open add modal and try to add todo
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Todo')).toBeTruthy();
    });

    const input = getByPlaceholderText('Escribe tu todo...');
    fireEvent.changeText(input, 'New todo item');

    const saveButton = getByText('Guardar');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudo agregar el todo'
      );
    });
  });

  it('does not add empty todo', async () => {
    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      expect(getByText('First todo')).toBeTruthy();
    });

    // Open add modal
    const fab = getByText('+');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(getByText('Nuevo Todo')).toBeTruthy();
    });

    // Try to save without entering text
    const saveButton = getByText('Guardar');
    fireEvent.press(saveButton);

    // Should not call addTodo
    expect(todoService.addTodo).not.toHaveBeenCalled();
  });

  it('renders completed todos with strikethrough style', async () => {
    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      const secondTodoText = getByText('Second todo');
      // In React Native Testing Library, we can check style properties
      expect(secondTodoText.props.style).toEqual(
        expect.objectContaining({
          textDecorationLine: 'line-through'
        })
      );
    });
  });

  it('shows checkbox state correctly', async () => {
    const { getByText } = render(<TodosScreen />);

    await waitFor(() => {
      // Check that completed todo shows checkmark
      const completedTodoContainer = getByText('Second todo').parent?.parent;
      const checkmark = completedTodoContainer?.findByProps({ children: '✓' });
      expect(checkmark).toBeTruthy();
    });
  });
});
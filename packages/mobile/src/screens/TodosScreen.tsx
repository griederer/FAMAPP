// Todos screen for FAMAPP mobile
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { todoService } from '@famapp/shared';
import type { Todo, FamilyMember } from '@famapp/shared';

export function TodosScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const todosData = await todoService.getTodos();
      setTodos(todosData);
    } catch (error) {
      console.error('Error loading todos:', error);
      Alert.alert('Error', 'No se pudieron cargar los todos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    try {
      await todoService.updateTodo(todoId, { completed });
      setTodos(prev => 
        prev.map(todo => 
          todo.id === todoId ? { ...todo, completed } : todo
        )
      );
    } catch (error) {
      console.error('Error updating todo:', error);
      Alert.alert('Error', 'No se pudo actualizar el todo');
    }
  };

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;

    try {
      const newTodo: Omit<Todo, 'id'> = {
        text: newTodoText.trim(),
        completed: false,
        assignedTo: 'gonzalo' as FamilyMember, // Default assignment
        createdBy: 'gonzalo' as FamilyMember,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const addedTodo = await todoService.addTodo(newTodo);
      setTodos(prev => [addedTodo, ...prev]);
      setNewTodoText('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding todo:', error);
      Alert.alert('Error', 'No se pudo agregar el todo');
    }
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <TouchableOpacity
      style={[styles.todoItem, item.completed && styles.todoCompleted]}
      onPress={() => handleToggleTodo(item.id, !item.completed)}
    >
      <View style={styles.todoContent}>
        <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>
          {item.text}
        </Text>
        <Text style={styles.todoMeta}>
          Asignado a: {item.assignedTo}
        </Text>
      </View>
      <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Cargando todos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No hay todos</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuevo Todo</Text>
            <TouchableOpacity onPress={handleAddTodo}>
              <Text style={styles.modalSave}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.modalInput}
              placeholder="Escribe tu todo..."
              value={newTodoText}
              onChangeText={setNewTodoText}
              multiline
              autoFocus
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  todoCompleted: {
    opacity: 0.6,
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  todoMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalCancel: {
    fontSize: 16,
    color: '#ef4444',
  },
  modalSave: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalInput: {
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 100,
  },
});
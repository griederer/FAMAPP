// Groceries screen for FAMAPP mobile
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
import { groceryService } from '@famapp/shared';
import type { GroceryItem, FamilyMember } from '@famapp/shared';

export function GroceriesScreen() {
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  useEffect(() => {
    loadGroceries();
  }, []);

  const loadGroceries = async () => {
    try {
      const groceriesData = await groceryService.getGroceries();
      setGroceries(groceriesData);
    } catch (error) {
      console.error('Error loading groceries:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string, purchased: boolean) => {
    try {
      await groceryService.updateGrocery(itemId, { 
        purchased,
        purchasedAt: purchased ? new Date() : undefined
      });
      setGroceries(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, purchased, purchasedAt: purchased ? new Date() : undefined }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating grocery item:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      const newItem: Omit<GroceryItem, 'id'> = {
        name: newItemName.trim(),
        quantity: parseInt(newItemQuantity) || 1,
        purchased: false,
        addedBy: 'gonzalo' as FamilyMember,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const addedItem = await groceryService.addGrocery(newItem);
      setGroceries(prev => [addedItem, ...prev]);
      setNewItemName('');
      setNewItemQuantity('1');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding grocery item:', error);
      Alert.alert('Error', 'No se pudo agregar el producto');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await groceryService.deleteGrocery(itemId);
              setGroceries(prev => prev.filter(item => item.id !== itemId));
            } catch (error) {
              console.error('Error deleting grocery item:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const renderGroceryItem = ({ item }: { item: GroceryItem }) => (
    <TouchableOpacity
      style={[styles.groceryItem, item.purchased && styles.groceryPurchased]}
      onPress={() => handleToggleItem(item.id, !item.purchased)}
      onLongPress={() => handleDeleteItem(item.id)}
    >
      <View style={styles.groceryContent}>
        <Text style={[styles.groceryName, item.purchased && styles.groceryNamePurchased]}>
          {item.name}
        </Text>
        <Text style={styles.groceryMeta}>
          Cantidad: {item.quantity} • Agregado por: {item.addedBy}
        </Text>
        {item.purchased && item.purchasedAt && (
          <Text style={styles.purchasedDate}>
            Comprado: {item.purchasedAt.toLocaleDateString('es-ES')}
          </Text>
        )}
      </View>
      <View style={[styles.checkbox, item.purchased && styles.checkboxChecked]}>
        {item.purchased && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  // Separate purchased and unpurchased items
  const unpurchasedItems = groceries.filter(item => !item.purchased);
  const purchasedItems = groceries.filter(item => item.purchased);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...unpurchasedItems, ...purchasedItems]}
        renderItem={renderGroceryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No hay productos en la lista</Text>
          </View>
        }
        ListHeaderComponent={
          unpurchasedItems.length > 0 && purchasedItems.length > 0 ? (
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Comprados</Text>
            </View>
          ) : null
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
            <Text style={styles.modalTitle}>Nuevo Producto</Text>
            <TouchableOpacity onPress={handleAddItem}>
              <Text style={styles.modalSave}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del producto"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Cantidad"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
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
  sectionDivider: {
    marginTop: 24,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  groceryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  groceryPurchased: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  groceryContent: {
    flex: 1,
  },
  groceryName: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4,
    fontWeight: '500',
  },
  groceryNamePurchased: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  groceryMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  purchasedDate: {
    fontSize: 11,
    color: '#16a34a',
    fontStyle: 'italic',
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
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
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
    backgroundColor: '#16a34a',
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
    color: '#16a34a',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
});
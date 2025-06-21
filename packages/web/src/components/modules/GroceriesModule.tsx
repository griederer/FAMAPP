// Groceries module with shopping lists
import { useState, useEffect, useMemo } from 'react';
import { groceryService, GROCERY_CATEGORIES, GROCERY_UNITS } from '@famapp/shared';
import type { GroceryList, GroceryItem, CreateGroceryItemData, FamilyMember } from '@famapp/shared';

// Standard product catalog
const STANDARD_PRODUCTS = {
  'Dairy & Eggs': [
    'Milk', 'Eggs', 'Butter', 'Cheese', 'Yogurt', 'Cream', 'Sour Cream'
  ],
  'Meat & Seafood': [
    'Chicken Breast', 'Ground Beef', 'Pork Chops', 'Salmon', 'Shrimp', 'Turkey', 'Bacon'
  ],
  'Fruits & Vegetables': [
    'Onions', 'Carrots', 'Potatoes', 'Tomatoes', 'Lettuce', 'Broccoli', 'Bell Peppers', 'Garlic',
    'Bananas', 'Apples', 'Oranges', 'Grapes', 'Strawberries', 'Lemons', 'Avocados'
  ],
  'Pantry & Canned': [
    'Rice', 'Pasta', 'Bread', 'Flour', 'Sugar', 'Salt', 'Olive Oil', 'Beans'
  ],
  'Beverages': [
    'Water', 'Coffee', 'Tea', 'Juice', 'Soda', 'Wine', 'Beer'
  ],
  'Frozen': [
    'Ice Cream', 'Frozen Vegetables', 'Frozen Pizza', 'Frozen Berries'
  ],
  'Personal Care': [
    'Toothpaste', 'Shampoo', 'Soap', 'Toilet Paper', 'Deodorant'
  ]
} as const;

export function GroceriesModule() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  
  // New list form
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListAssignee, setNewListAssignee] = useState<FamilyMember | ''>('');
  
  // New item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<typeof GROCERY_CATEGORIES[number]>(GROCERY_CATEGORIES[0]);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState<typeof GROCERY_UNITS[number]>(GROCERY_UNITS[0]);
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [showStandardProducts, setShowStandardProducts] = useState(false);

  // Subscribe to grocery lists
  useEffect(() => {
    setLoading(true);
    const unsubscribe = groceryService.subscribeToGroceryLists((updatedLists) => {
      setLists(updatedLists);
      setLoading(false);
      setError(null);
      
      // Update selected list if it exists
      if (selectedList) {
        const updatedSelectedList = updatedLists.find(list => list.id === selectedList.id);
        setSelectedList(updatedSelectedList || null);
      }
    });

    return () => unsubscribe();
  }, [selectedList?.id]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeLists = lists.filter(list => !list.completed).length;
    const totalItems = lists.reduce((sum, list) => sum + list.items.length, 0);
    const checkedItems = lists.reduce((sum, list) => sum + list.items.filter(item => item.checked).length, 0);
    const completedLists = lists.filter(list => list.completed).length;
    
    return {
      activeLists,
      completedLists,
      totalItems,
      checkedItems,
      total: lists.length,
    };
  }, [lists]);

  // List management
  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      await groceryService.createGroceryList({
        name: newListName.trim(),
        description: newListDescription.trim() || undefined,
        assignedTo: newListAssignee as FamilyMember || undefined,
      });
      
      setShowNewListModal(false);
      setNewListName('');
      setNewListDescription('');
      setNewListAssignee('');
    } catch (err) {
      setError('Failed to create list');
      console.error('Error creating list:', err);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await groceryService.deleteGroceryList(listId);
      if (selectedList && selectedList.id === listId) {
        setSelectedList(null);
      }
    } catch (err) {
      setError('Failed to delete list');
      console.error('Error deleting list:', err);
    }
  };

  const handleToggleListCompletion = async (listId: string) => {
    try {
      await groceryService.toggleGroceryListCompletion(listId);
    } catch (err) {
      setError('Failed to update list');
      console.error('Error updating list:', err);
    }
  };

  // Product selection helper
  const handleSelectStandardProduct = (productName: string, category: string) => {
    setNewItemName(productName);
    setNewItemCategory(category as typeof GROCERY_CATEGORIES[number]);
    setShowStandardProducts(false);
    
    // Auto-set common units based on category
    const unitMap: { [key: string]: typeof GROCERY_UNITS[number] } = {
      'Dairy & Eggs': 'pcs',
      'Meat & Seafood': 'lb',
      'Fruits & Vegetables': 'lb',
      'Pantry & Canned': 'pcs',
      'Beverages': 'pcs',
      'Frozen': 'pcs',
      'Personal Care': 'pcs'
    };
    
    if (unitMap[category]) {
      setNewItemUnit(unitMap[category]);
    }
  };

  // Item management
  const handleCreateItem = async () => {
    if (!newItemName.trim() || !selectedList) return;

    try {
      const itemData: CreateGroceryItemData = {
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: newItemQuantity,
        unit: newItemUnit,
        notes: newItemNotes.trim() || undefined,
      };
      
      if (newItemPrice) {
        itemData.price = parseFloat(newItemPrice);
      }

      await groceryService.addGroceryItem(selectedList.id, itemData);
      
      setShowNewItemModal(false);
      resetItemForm();
    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding item:', err);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItemName.trim()) return;

    try {
      const updateData: any = {
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: newItemQuantity,
        unit: newItemUnit,
        notes: newItemNotes.trim() || undefined,
      };
      
      if (newItemPrice) {
        updateData.price = parseFloat(newItemPrice);
      }

      await groceryService.updateGroceryItem(editingItem.id, updateData);
      
      setShowNewItemModal(false);
      setEditingItem(null);
      resetItemForm();
    } catch (err) {
      setError('Failed to update item');
      console.error('Error updating item:', err);
    }
  };

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    try {
      await groceryService.updateGroceryItem(itemId, { checked });
    } catch (err) {
      setError('Failed to update item');
      console.error('Error updating item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await groceryService.deleteGroceryItem(itemId);
    } catch (err) {
      setError('Failed to delete item');
      console.error('Error deleting item:', err);
    }
  };

  const handleEditItem = (item: GroceryItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category as any);
    setNewItemQuantity(item.quantity);
    setNewItemUnit(item.unit as any);
    setNewItemPrice(item.price?.toString() || '');
    setNewItemNotes(item.notes || '');
    setShowNewItemModal(true);
  };

  const resetItemForm = () => {
    setNewItemName('');
    setNewItemCategory(GROCERY_CATEGORIES[0]);
    setNewItemQuantity(1);
    setNewItemUnit(GROCERY_UNITS[0]);
    setNewItemPrice('');
    setNewItemNotes('');
  };

  const openNewItemModal = () => {
    setEditingItem(null);
    resetItemForm();
    setShowNewItemModal(true);
  };

  // Get items by category for the selected list
  const itemsByCategory = useMemo(() => {
    if (!selectedList) return {};
    
    return selectedList.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);
  }, [selectedList]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      
      {/* Header Section */}
      <div style={{
        marginBottom: '40px',
        paddingTop: '32px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 8px 0',
              letterSpacing: '-0.025em',
            }}>
              Grocery Lists
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '0',
            }}>
              Manage shopping lists together
            </p>
          </div>
          
          <button
            onClick={() => setShowNewListModal(true)}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New List
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: '#6b7280',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #f59e0b',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Active Lists
                </h3>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="16" height="16" fill="#3b82f6" viewBox="0 0 24 24">
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                  </svg>
                </div>
              </div>
              <p style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0',
              }}>
                {stats.activeLists}
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Total Items
                </h3>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="16" height="16" fill="#10b981" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0',
              }}>
                {stats.totalItems}
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Checked Items
                </h3>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="16" height="16" fill="#f59e0b" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0',
              }}>
                {stats.checkedItems}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedList ? '1fr 2fr' : '1fr',
            gap: '32px',
            alignItems: 'start',
          }}>
            {/* Lists Overview */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0',
                }}>
                  Shopping Lists
                </h2>
                <button
                  onClick={() => setShowNewListModal(true)}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New List
                </button>
              </div>

              <div style={{ padding: '0' }}>
                {lists.length === 0 ? (
                  <div style={{
                    padding: '60px 24px',
                    textAlign: 'center',
                    color: '#6b7280',
                  }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 16px auto' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                    </svg>
                    <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>No shopping lists yet</p>
                    <p style={{ fontSize: '14px', margin: '0' }}>Create your first list to get started</p>
                  </div>
                ) : (
                  lists.map((list) => (
                    <div
                      key={list.id}
                      onClick={() => setSelectedList(list)}
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        backgroundColor: selectedList?.id === list.id ? '#fef3c7' : 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0',
                        }}>
                          {list.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          {list.completed && (
                            <span style={{
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              fontSize: '12px',
                              fontWeight: '600',
                              padding: '4px 8px',
                              borderRadius: '6px',
                            }}>
                              Completed
                            </span>
                          )}
                          <span style={{
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}>
                            {list.items.length} items
                          </span>
                        </div>
                      </div>
                      
                      {list.description && (
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: '0 0 8px 0',
                        }}>
                          {list.description}
                        </p>
                      )}
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}>
                        <span>
                          {list.assignedTo ? `Assigned to ${list.assignedTo}` : 'Everyone'}
                        </span>
                        <span>
                          {list.items.filter(item => item.checked).length} / {list.items.length} done
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected List Details */}
            {selectedList && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #f3f4f6',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '24px',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 4px 0',
                    }}>
                      {selectedList.name}
                    </h2>
                    {selectedList.description && (
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0',
                      }}>
                        {selectedList.description}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={openNewItemModal}
                      style={{
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Item
                    </button>
                    
                    <button
                      onClick={() => handleToggleListCompletion(selectedList.id)}
                      style={{
                        backgroundColor: selectedList.completed ? '#6b7280' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {selectedList.completed ? 'Reopen' : 'Complete'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteList(selectedList.id)}
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Items by Category */}
                <div style={{ padding: '24px' }}>
                  {Object.keys(itemsByCategory).length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: '#6b7280',
                    }}>
                      <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 16px auto' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>No items in this list</p>
                      <p style={{ fontSize: '14px', margin: '0' }}>Add your first item to get started</p>
                    </div>
                  ) : (
                    GROCERY_CATEGORIES.filter(category => itemsByCategory[category]?.length > 0).map(category => (
                      <div key={category} style={{ marginBottom: '32px' }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0 0 16px 0',
                          paddingBottom: '8px',
                          borderBottom: '2px solid #f3f4f6',
                        }}>
                          {category}
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {itemsByCategory[category].map(item => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                backgroundColor: item.checked ? '#f9fafb' : 'white',
                                borderRadius: '8px',
                                border: '1px solid #f3f4f6',
                                opacity: item.checked ? 0.7 : 1,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer',
                                }}
                              />
                              
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '4px',
                                }}>
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#1f2937',
                                    textDecoration: item.checked ? 'line-through' : 'none',
                                  }}>
                                    {item.name}
                                  </span>
                                  
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    backgroundColor: '#f3f4f6',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}>
                                    {item.quantity} {item.unit}
                                  </span>
                                  
                                  {item.price && (
                                    <span style={{
                                      fontSize: '12px',
                                      color: '#10b981',
                                      fontWeight: '600',
                                    }}>
                                      ${item.price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                
                                {item.notes && (
                                  <p style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    margin: '0',
                                  }}>
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => handleEditItem(item)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}>
          {error}
        </div>
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowNewListModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '500px',
              margin: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 24px 0',
            }}>
              Create New Shopping List
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                List Name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Description (Optional)
              </label>
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Add description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Assign To
              </label>
              <select
                value={newListAssignee}
                onChange={(e) => setNewListAssignee(e.target.value as FamilyMember | '')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Everyone</option>
                <option value="gonzalo">Gonzalo</option>
                <option value="mpaz">María Paz</option>
                <option value="borja">Borja</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowNewListModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Item Modal */}
      {showNewItemModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowNewItemModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '500px',
              margin: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 24px 0',
            }}>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>

            {/* Standard Product Selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0',
                }}>
                  Quick Select from Standard Products
                </label>
                <button
                  type="button"
                  onClick={() => setShowStandardProducts(!showStandardProducts)}
                  style={{
                    backgroundColor: showStandardProducts ? '#f59e0b' : '#f3f4f6',
                    color: showStandardProducts ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {showStandardProducts ? 'Hide' : 'Show'} Products
                </button>
              </div>

              {showStandardProducts && (
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}>
                  {Object.entries(STANDARD_PRODUCTS).map(([category, products]) => (
                    <div key={category} style={{ marginBottom: '16px' }}>
                      <h4 style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#4b5563',
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {category}
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}>
                        {products.map((product) => (
                          <button
                            key={product}
                            type="button"
                            onClick={() => handleSelectStandardProduct(product, category)}
                            style={{
                              backgroundColor: 'white',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f59e0b';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = '#f59e0b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#374151';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                          >
                            {product}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Item Name
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Enter item name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Category
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                  }}
                >
                  {GROCERY_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Quantity & Unit
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'white',
                      boxSizing: 'border-box',
                    }}
                  >
                    {GROCERY_UNITS.map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Price (Optional)
              </label>
              <input
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Notes (Optional)
              </label>
              <textarea
                value={newItemNotes}
                onChange={(e) => setNewItemNotes(e.target.value)}
                placeholder="Add notes"
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowNewItemModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleCreateItem}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Vertical Groceries module - clean list from top to bottom
import { useState, useEffect, useMemo } from 'react';
import { groceryService } from '@famapp/shared';
import type { GroceryList, CreateGroceryItemData } from '@famapp/shared';

// Comprehensive grocery list organized for vertical display
const GROCERY_ITEMS = [
  // Dairy & Eggs
  { name: 'Milk', category: 'Dairy & Eggs', emoji: '🥛' },
  { name: 'Eggs', category: 'Dairy & Eggs', emoji: '🥚' },
  { name: 'Butter', category: 'Dairy & Eggs', emoji: '🧈' },
  { name: 'Cheese', category: 'Dairy & Eggs', emoji: '🧀' },
  { name: 'Yogurt', category: 'Dairy & Eggs', emoji: '🥛' },
  { name: 'Cream', category: 'Dairy & Eggs', emoji: '🥛' },
  { name: 'Sour Cream', category: 'Dairy & Eggs', emoji: '🥛' },
  { name: 'Cottage Cheese', category: 'Dairy & Eggs', emoji: '🧀' },

  // Meat & Seafood  
  { name: 'Chicken Breast', category: 'Meat & Seafood', emoji: '🐔' },
  { name: 'Ground Beef', category: 'Meat & Seafood', emoji: '🥩' },
  { name: 'Pork Chops', category: 'Meat & Seafood', emoji: '🥩' },
  { name: 'Salmon', category: 'Meat & Seafood', emoji: '🐟' },
  { name: 'Shrimp', category: 'Meat & Seafood', emoji: '🦐' },
  { name: 'Turkey', category: 'Meat & Seafood', emoji: '🦃' },
  { name: 'Bacon', category: 'Meat & Seafood', emoji: '🥓' },
  { name: 'Ham', category: 'Meat & Seafood', emoji: '🍖' },

  // Fruits & Vegetables
  { name: 'Bananas', category: 'Fruits & Vegetables', emoji: '🍌' },
  { name: 'Apples', category: 'Fruits & Vegetables', emoji: '🍎' },
  { name: 'Oranges', category: 'Fruits & Vegetables', emoji: '🍊' },
  { name: 'Grapes', category: 'Fruits & Vegetables', emoji: '🍇' },
  { name: 'Strawberries', category: 'Fruits & Vegetables', emoji: '🍓' },
  { name: 'Lemons', category: 'Fruits & Vegetables', emoji: '🍋' },
  { name: 'Avocados', category: 'Fruits & Vegetables', emoji: '🥑' },
  { name: 'Tomatoes', category: 'Fruits & Vegetables', emoji: '🍅' },
  { name: 'Onions', category: 'Fruits & Vegetables', emoji: '🧅' },
  { name: 'Carrots', category: 'Fruits & Vegetables', emoji: '🥕' },
  { name: 'Potatoes', category: 'Fruits & Vegetables', emoji: '🥔' },
  { name: 'Lettuce', category: 'Fruits & Vegetables', emoji: '🥬' },
  { name: 'Broccoli', category: 'Fruits & Vegetables', emoji: '🥦' },
  { name: 'Bell Peppers', category: 'Fruits & Vegetables', emoji: '🫑' },
  { name: 'Garlic', category: 'Fruits & Vegetables', emoji: '🧄' },
  { name: 'Spinach', category: 'Fruits & Vegetables', emoji: '🥬' },

  // Pantry & Canned
  { name: 'Rice', category: 'Pantry & Canned', emoji: '🍚' },
  { name: 'Pasta', category: 'Pantry & Canned', emoji: '🍝' },
  { name: 'Bread', category: 'Pantry & Canned', emoji: '🍞' },
  { name: 'Flour', category: 'Pantry & Canned', emoji: '🌾' },
  { name: 'Sugar', category: 'Pantry & Canned', emoji: '🍯' },
  { name: 'Salt', category: 'Pantry & Canned', emoji: '🧂' },
  { name: 'Olive Oil', category: 'Pantry & Canned', emoji: '🫒' },
  { name: 'Beans', category: 'Pantry & Canned', emoji: '🫘' },
  { name: 'Tomato Sauce', category: 'Pantry & Canned', emoji: '🥫' },
  { name: 'Cereal', category: 'Pantry & Canned', emoji: '🥣' },

  // Beverages
  { name: 'Water', category: 'Beverages', emoji: '💧' },
  { name: 'Coffee', category: 'Beverages', emoji: '☕' },
  { name: 'Tea', category: 'Beverages', emoji: '🍵' },
  { name: 'Juice', category: 'Beverages', emoji: '🧃' },
  { name: 'Soda', category: 'Beverages', emoji: '🥤' },
  { name: 'Wine', category: 'Beverages', emoji: '🍷' },
  { name: 'Beer', category: 'Beverages', emoji: '🍺' },
  { name: 'Sparkling Water', category: 'Beverages', emoji: '🥤' },

  // Frozen
  { name: 'Ice Cream', category: 'Frozen', emoji: '🍦' },
  { name: 'Frozen Vegetables', category: 'Frozen', emoji: '🧊' },
  { name: 'Frozen Pizza', category: 'Frozen', emoji: '🍕' },
  { name: 'Frozen Berries', category: 'Frozen', emoji: '🫐' },
  { name: 'Frozen Chicken', category: 'Frozen', emoji: '🧊' },

  // Personal Care
  { name: 'Toothpaste', category: 'Personal Care', emoji: '🦷' },
  { name: 'Shampoo', category: 'Personal Care', emoji: '🧴' },
  { name: 'Soap', category: 'Personal Care', emoji: '🧼' },
  { name: 'Toilet Paper', category: 'Personal Care', emoji: '🧻' },
  { name: 'Deodorant', category: 'Personal Care', emoji: '🧴' },
  { name: 'Detergent', category: 'Personal Care', emoji: '🧽' },
];

export function GroceriesModule() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Subscribe to grocery lists
  useEffect(() => {
    setLoading(true);
    const unsubscribe = groceryService.subscribeToGroceryLists((updatedLists) => {
      setLists(updatedLists);
      setLoading(false);
      setError(null);
      
      if (selectedList) {
        const updatedSelectedList = updatedLists.find(list => list.id === selectedList.id);
        setSelectedList(updatedSelectedList || null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to selected list items for real-time updates
  useEffect(() => {
    if (!selectedList) return;

    const unsubscribe = groceryService.subscribeToGroceryItems(selectedList.id, (items) => {
      // Update the selected list with new items
      setSelectedList(prev => {
        if (!prev) return null;
        return { ...prev, items };
      });
      
      // Also update the list in the lists array
      setLists(prevLists => 
        prevLists.map(list => 
          list.id === selectedList.id 
            ? { ...list, items }
            : list
        )
      );
    });

    return () => unsubscribe();
  }, [selectedList?.id]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return GROCERY_ITEMS;
    
    return GROCERY_ITEMS.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof GROCERY_ITEMS } = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Get current shopping list item names
  const currentItemNames = useMemo(() => {
    if (!selectedList) return new Set();
    return new Set(selectedList.items.map(item => item.name));
  }, [selectedList]);

  // Create new list
  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      const newListId = await groceryService.createGroceryList({
        name: newListName.trim(),
      });
      
      // Wait a moment for the subscription to update
      setTimeout(() => {
        const newList = lists.find(list => list.id === newListId);
        if (newList) {
          setSelectedList(newList);
        }
      }, 100);
      
      setShowNewListModal(false);
      setNewListName('');
    } catch (err) {
      setError('Failed to create list');
      console.error('Error creating list:', err);
    }
  };

  // Select a list
  const handleSelectList = (list: GroceryList) => {
    setSelectedList(list);
  };

  // Add item to list
  const handleAddItem = async (itemName: string, category: string) => {
    if (!selectedList || currentItemNames.has(itemName)) return;

    try {
      const itemData: CreateGroceryItemData = {
        name: itemName,
        category: category,
        quantity: 1,
        unit: 'pcs',
      };
      
      await groceryService.addGroceryItem(selectedList.id, itemData);
    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding item:', err);
    }
  };

  // Remove item from list
  const handleRemoveItem = async (itemId: string) => {
    if (!selectedList) return;

    try {
      await groceryService.deleteGroceryItem(itemId);
    } catch (err) {
      setError('Failed to remove item');
      console.error('Error removing item:', err);
    }
  };

  // Add custom item
  const handleAddCustomItem = async () => {
    if (!customItem.trim() || !selectedList) return;

    try {
      const itemData: CreateGroceryItemData = {
        name: customItem.trim(),
        category: 'Other',
        quantity: 1,
        unit: 'pcs',
      };
      
      await groceryService.addGroceryItem(selectedList.id, itemData);
      setCustomItem('');
    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding item:', err);
    }
  };

  // Delete list
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

  // Toggle item completion
  const handleToggleItem = async (itemId: string) => {
    if (!selectedList) return;

    try {
      await groceryService.toggleGroceryItem(itemId);
      
      // Check if all items are checked after toggle (with a small delay for state to update)
      setTimeout(async () => {
        if (selectedList.items.length > 0) {
          // Find the item that was toggled and determine new state
          const toggledItem = selectedList.items.find(item => item.id === itemId);
          if (!toggledItem) return;
          
          // Create a hypothetical state with the toggled item
          const hypotheticalItems = selectedList.items.map(item => 
            item.id === itemId ? { ...item, checked: !item.checked } : item
          );
          
          const allChecked = hypotheticalItems.every(item => item.checked);
          if (allChecked && !selectedList.completed) {
            // Auto-complete the list when all items are checked
            await groceryService.toggleGroceryListCompletion(selectedList.id);
          }
        }
      }, 100);
    } catch (err) {
      setError('Failed to update item');
      console.error('Error toggling item:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{
        marginBottom: '32px',
        paddingTop: '32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1f2937',
          margin: '0 0 8px 0',
        }}>
          Shopping Lists
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0',
        }}>
          Simple vertical shopping list - add items from top to bottom
        </p>
      </div>

      {/* Lists Selection */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>
          Lists:
        </span>
        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => handleSelectList(list)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '2px solid',
              borderColor: selectedList?.id === list.id ? '#10b981' : '#e5e7eb',
              backgroundColor: selectedList?.id === list.id ? '#10b981' : 'white',
              color: selectedList?.id === list.id ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {list.name} ({list.items.length})
            {list.completed && ' ✓'}
          </button>
        ))}
        <button
          onClick={() => setShowNewListModal(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: '2px dashed #10b981',
            backgroundColor: 'transparent',
            color: '#10b981',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          + New List
        </button>
      </div>

      {selectedList ? (
        <>
          {/* Current Shopping List */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '2px solid #bbf7d0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#065f46',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              🛒 {selectedList.name}
              <span style={{ fontSize: '14px', fontWeight: '400' }}>
                ({selectedList.items.length} items)
              </span>
              {selectedList.completed && (
                <span style={{
                  fontSize: '14px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '500',
                }}>
                  ✓ Done
                </span>
              )}
              {!selectedList.completed && selectedList.items.length > 0 && selectedList.items.every(item => item.checked) && (
                <span style={{
                  fontSize: '14px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '500',
                  animation: 'pulse 2s infinite',
                }}>
                  All items found!
                </span>
              )}
            </h2>
            
            {selectedList.items.length === 0 ? (
              <p style={{ margin: '0', color: '#059669', fontStyle: 'italic' }}>
                Your shopping list is empty. Add items from the list below.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedList.items.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: item.checked ? '#dcfce7' : 'white',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      opacity: item.checked ? 0.8 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#059669',
                        minWidth: '24px',
                      }}>
                        {index + 1}.
                      </span>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: '500', 
                        color: '#065f46',
                        textDecoration: item.checked ? 'line-through' : 'none',
                        flex: 1,
                      }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        style={{
                          backgroundColor: item.checked ? '#10b981' : 'white',
                          color: item.checked ? 'white' : '#10b981',
                          border: '2px solid #10b981',
                          cursor: 'pointer',
                          fontSize: '16px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                        }}
                        title={item.checked ? "Mark as not found" : "Mark as found"}
                      >
                        {item.checked ? '✓' : ''}
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#dc2626',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '20px',
                          padding: '4px',
                          borderRadius: '4px',
                        }}
                        title="Remove from list"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => handleDeleteList(selectedList.id)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Delete List
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search for items..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                backgroundColor: 'white',
              }}
            />
          </div>

          {/* Custom Item Input */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              color: '#374151',
            }}>
              Add Custom Item
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                placeholder="Enter custom item name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomItem()}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={handleAddCustomItem}
                disabled={!customItem.trim()}
                style={{
                  backgroundColor: customItem.trim() ? '#10b981' : '#e5e7eb',
                  color: customItem.trim() ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: customItem.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Vertical Grocery List */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            overflow: 'hidden',
          }}>
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                {/* Category Header */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px 20px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {category}
                  </h3>
                </div>
                
                {/* Items List */}
                <div>
                  {items.map((item) => {
                    const isInList = currentItemNames.has(item.name);
                    return (
                      <div
                        key={item.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          borderBottom: '1px solid #f3f4f6',
                          backgroundColor: isInList ? '#f0fdf4' : 'white',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>{item.emoji}</span>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: '500',
                            color: isInList ? '#059669' : '#374151',
                          }}>
                            {item.name}
                          </span>
                          {isInList && (
                            <span style={{
                              fontSize: '12px',
                              color: '#059669',
                              backgroundColor: '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '500',
                            }}>
                              ✓ Added
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddItem(item.name, item.category)}
                          disabled={isInList}
                          style={{
                            backgroundColor: isInList ? '#e5e7eb' : '#10b981',
                            color: isInList ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isInList ? 'not-allowed' : 'pointer',
                            minWidth: '60px',
                          }}
                        >
                          {isInList ? '✓' : '+'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          color: '#6b7280',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>
            Select a list to start shopping
          </h3>
          <p style={{ fontSize: '14px', margin: '0' }}>
            Choose a list above or create a new one
          </p>
        </div>
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
            }}
            onClick={() => setShowNewListModal(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            zIndex: 50,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '20px',
            }}>
              Create New Shopping List
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                List Name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., Weekly Groceries"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewListModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: newListName.trim() ? '#10b981' : '#e5e7eb',
                  color: newListName.trim() ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: newListName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create List
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
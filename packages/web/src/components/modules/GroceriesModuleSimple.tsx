// Simple Groceries module - create list, check items, done!
import { useState, useEffect } from 'react';
import { groceryService } from '@famapp/shared';
import type { GroceryList, CreateGroceryItemData } from '@famapp/shared';

// Comprehensive grocery checklist
const GROCERY_CHECKLIST = {
  'Dairy & Eggs': [
    'Milk', 'Eggs', 'Butter', 'Cheese', 'Yogurt', 'Cream', 'Sour Cream', 'Cottage Cheese'
  ],
  'Meat & Seafood': [
    'Chicken Breast', 'Ground Beef', 'Pork Chops', 'Salmon', 'Shrimp', 'Turkey', 'Bacon', 'Ham'
  ],
  'Fruits & Vegetables': [
    'Bananas', 'Apples', 'Oranges', 'Grapes', 'Strawberries', 'Lemons', 'Avocados', 'Tomatoes',
    'Onions', 'Carrots', 'Potatoes', 'Lettuce', 'Broccoli', 'Bell Peppers', 'Garlic', 'Spinach'
  ],
  'Pantry & Canned': [
    'Rice', 'Pasta', 'Bread', 'Flour', 'Sugar', 'Salt', 'Olive Oil', 'Beans', 'Tomato Sauce', 'Cereal'
  ],
  'Beverages': [
    'Water', 'Coffee', 'Tea', 'Juice', 'Soda', 'Wine', 'Beer', 'Sparkling Water'
  ],
  'Frozen': [
    'Ice Cream', 'Frozen Vegetables', 'Frozen Pizza', 'Frozen Berries', 'Frozen Chicken'
  ],
  'Personal Care': [
    'Toothpaste', 'Shampoo', 'Soap', 'Toilet Paper', 'Deodorant', 'Detergent'
  ]
} as const;

export function GroceriesModule() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New list creation
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  // Custom item input
  const [customItem, setCustomItem] = useState('');
  
  // Checked items state (for adding to list)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

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

  // Create new list
  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      await groceryService.createGroceryList({
        name: newListName.trim(),
      });
      
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
    // Reset checked items when switching lists
    const currentItems = new Set(list.items.map(item => item.name));
    setCheckedItems(currentItems);
  };

  // Add item to list
  const handleAddItem = async (itemName: string, category: string) => {
    if (!selectedList) return;

    // Check if item already exists
    if (checkedItems.has(itemName)) {
      return; // Don't add duplicates
    }

    try {
      const itemData: CreateGroceryItemData = {
        name: itemName,
        category: category,
        quantity: 1,
        unit: 'pcs',
      };
      
      await groceryService.addGroceryItem(selectedList.id, itemData);
      
      // Update checked items state
      const newCheckedItems = new Set(checkedItems);
      newCheckedItems.add(itemName);
      setCheckedItems(newCheckedItems);
    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding item:', err);
    }
  };

  // Remove item from list
  const handleRemoveItem = async (itemId: string, itemName: string) => {
    if (!selectedList) return;

    try {
      console.log('Removing item ID:', itemId, 'Name:', itemName);
      
      // Delete from database
      await groceryService.deleteGroceryItem(itemId);
      console.log('Item deleted from database');
      
      // Update checked items state immediately
      const newCheckedItems = new Set(checkedItems);
      newCheckedItems.delete(itemName);
      setCheckedItems(newCheckedItems);
      console.log('Updated checked items state');
      
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
      
      // Add to checked items
      const newCheckedItems = new Set(checkedItems);
      newCheckedItems.add(customItem.trim());
      setCheckedItems(newCheckedItems);
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
        setCheckedItems(new Set());
      }
    } catch (err) {
      setError('Failed to delete list');
      console.error('Error deleting list:', err);
    }
  };

  // Complete list
  const handleCompleteList = async (listId: string) => {
    try {
      await groceryService.toggleGroceryListCompletion(listId);
    } catch (err) {
      setError('Failed to complete list');
      console.error('Error completing list:', err);
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
      maxWidth: '1200px',
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
          Create a list, check off what you need, shop!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        
        {/* Left Side - Lists */}
        <div style={{ width: '300px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0',
            }}>
              Your Lists
            </h2>
            <button
              onClick={() => setShowNewListModal(true)}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              + New List
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lists.map((list) => (
              <div
                key={list.id}
                onClick={() => handleSelectList(list)}
                style={{
                  padding: '16px',
                  backgroundColor: selectedList?.id === list.id ? '#eff6ff' : 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      margin: '0 0 4px 0',
                    }}>
                      {list.name}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0',
                    }}>
                      {list.items.length} items
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteList(list.id);
                      }}
                      style={{
                        backgroundColor: list.completed ? '#10b981' : '#f3f4f6',
                        color: list.completed ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {list.completed ? 'Done' : 'Complete'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Grocery Checklist */}
        <div style={{ flex: 1 }}>
          {selectedList ? (
            <>
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                }}>
                  {selectedList.name}
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0',
                }}>
                  Check items to add them to your list
                </p>
              </div>

              {/* Shopping List Items */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  margin: '0 0 12px 0',
                }}>
                  Your Shopping List ({selectedList.items.length} items)
                </h3>
                
                {selectedList.items.length === 0 ? (
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0',
                    fontStyle: 'italic',
                  }}>
                    No items yet - check items below to add them
                  </p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '8px',
                  }}>
                    {selectedList.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{
                          fontSize: '14px',
                          color: '#065f46',
                          fontWeight: '500',
                        }}>
                          {item.name}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id, item.name)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#dc2626',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '2px',
                          }}
                          title="Remove from list"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Item Input */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  margin: '0 0 12px 0',
                }}>
                  Add Custom Item
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={customItem}
                    onChange={(e) => setCustomItem(e.target.value)}
                    placeholder="Enter item name"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomItem()}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
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
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: customItem.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Grocery Checklist */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                maxHeight: '600px',
                overflowY: 'auto',
              }}>
                {Object.entries(GROCERY_CHECKLIST).map(([category, items]) => (
                  <div key={category} style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 12px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {category}
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '8px',
                    }}>
                      {items.map((item) => (
                        <button
                          key={item}
                          onClick={() => handleAddItem(item, category)}
                          disabled={checkedItems.has(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            cursor: checkedItems.has(item) ? 'not-allowed' : 'pointer',
                            backgroundColor: checkedItems.has(item) ? '#f3f4f6' : 'white',
                            color: checkedItems.has(item) ? '#9ca3af' : '#374151',
                            fontSize: '14px',
                            fontWeight: '500',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            opacity: checkedItems.has(item) ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!checkedItems.has(item)) {
                              e.currentTarget.style.backgroundColor = '#f0fdf4';
                              e.currentTarget.style.borderColor = '#10b981';
                              e.currentTarget.style.color = '#059669';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!checkedItems.has(item)) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.color = '#374151';
                            }
                          }}
                        >
                          {checkedItems.has(item) ? '✓ Added' : `+ ${item}`}
                        </button>
                      ))}
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
              height: '400px',
              color: '#6b7280',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#f3f4f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                🛒
              </div>
              <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>
                Select a list to start shopping
              </h3>
              <p style={{ fontSize: '14px', margin: '0' }}>
                Choose a list from the left or create a new one
              </p>
            </div>
          )}
        </div>
      </div>

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
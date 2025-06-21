// Clean TodoModule inspired by Things 3
import { useState, useMemo, useEffect } from 'react';
import { todoService } from '@famapp/shared';
import type { Todo, FamilyMember } from '@famapp/shared';

export function TodoModule() {
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editAssignee, setEditAssignee] = useState<FamilyMember | ''>('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    const unsubscribe = todoService.subscribeTodos(
      { archived: false }, // Only show non-archived todos
      (updatedTodos) => {
        setTodos(updatedTodos);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const pending = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;
    
    return {
      pending,
      completed,
      total: todos.length,
    };
  }, [todos]);

  const handleAddTask = async () => {
    try {
      await todoService.createTodo({
        title: 'New task',
        assignedTo: 'gonzalo' as FamilyMember,
      });
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating todo:', err);
    }
  };

  const toggleTask = async (id: string) => {
    try {
      await todoService.toggleComplete(id);
    } catch (err) {
      setError('Failed to toggle task');
      console.error('Error toggling todo:', err);
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingTask(todo.id);
    setEditText(todo.title);
    setEditAssignee(todo.assignedTo || '');
  };

  const saveEdit = async (id: string) => {
    if (editText.trim()) {
      try {
        const updateData: any = {
          title: editText.trim(),
        };
        
        if (editAssignee) {
          updateData.assignedTo = editAssignee as FamilyMember;
        }
        
        await todoService.updateTodo(id, updateData);
      } catch (err) {
        setError('Failed to update task');
        console.error('Error updating todo:', err);
      }
    }
    setEditingTask(null);
    setEditText('');
    setEditAssignee('');
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditText('');
    setEditAssignee('');
  };

  const deleteTask = async (id: string) => {
    try {
      await todoService.deleteTodo(id);
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting todo:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite',
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading tasks...</p>
        </div>
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
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

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
              To-Do Lists
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '0',
            }}>
              Organize family tasks and responsibilities
            </p>
          </div>
          
          <button 
            onClick={handleAddTask}
            style={{
            backgroundColor: '#3b82f6',
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        
        {/* Pending Tasks */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f3f4f6',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                margin: '0 0 8px 0',
              }}>
                Pending Tasks
              </p>
              <p style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#f59e0b',
                margin: '0',
              }}>
                {stats.pending}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f3f4f6',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                margin: '0 0 8px 0',
              }}>
                Completed
              </p>
              <p style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#10b981',
                margin: '0',
              }}>
                {stats.completed}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#d1fae5',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Tasks */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f3f4f6',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                margin: '0 0 8px 0',
              }}>
                Total Tasks
              </p>
              <p style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#3b82f6',
                margin: '0',
              }}>
                {stats.total}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#dbeafe',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0',
          }}>
            Recent Tasks ({todos.length})
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todos.map((todo) => (
            <div key={todo.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                
                {/* Checkbox */}
                <div 
                  onClick={() => toggleTask(todo.id)}
                  style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${todo.completed ? '#10b981' : '#d1d5db'}`,
                  backgroundColor: todo.completed ? '#10b981' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}>
                  {todo.completed && (
                    <svg width="12" height="12" fill="white" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Task Content */}
                <div style={{ flex: 1 }}>
                  {editingTask === todo.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Title Input */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(todo.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            fontSize: '16px',
                            border: '2px solid #3b82f6',
                            borderRadius: '8px',
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                          autoFocus
                          placeholder="Task title"
                        />
                        <button
                          onClick={() => saveEdit(todo.id)}
                          style={{
                            padding: '6px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: '6px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Assignee and Date Controls */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={editAssignee}
                          onChange={(e) => setEditAssignee(e.target.value as FamilyMember)}
                          style={{
                            padding: '6px 8px',
                            fontSize: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="gonzalo">Gonzalo</option>
                          <option value="mpaz">MPaz</option>
                          <option value="borja">Borja</option>
                        </select>
                        
                      </div>
                    </div>
                  ) : (
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: todo.completed ? '#9ca3af' : '#1f2937',
                      margin: '0 0 8px 0',
                      textDecoration: todo.completed ? 'line-through' : 'none',
                    }}>
                      {todo.title}
                    </p>
                  )}
                  
                  {editingTask !== todo.id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Assignee */}
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: 
                          todo.assignedTo === 'gonzalo' ? '#dbeafe' :
                          todo.assignedTo === 'mpaz' ? '#fce7f3' : '#f3e8ff',
                        color:
                          todo.assignedTo === 'gonzalo' ? '#1d4ed8' :
                          todo.assignedTo === 'mpaz' ? '#be185d' : '#7c3aed',
                      }}>
                        {todo.assignedTo === 'gonzalo' ? 'Gonzalo' : todo.assignedTo === 'mpaz' ? 'MPaz' : 'Borja'}
                      </span>

                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingTask !== todo.id && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => startEditing(todo)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        border: 'none',
                        opacity: '0.4',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.4';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'inherit';
                      }}
                      title="Edit task"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => deleteTask(todo.id)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        border: 'none',
                        opacity: '0.4',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.4';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'inherit';
                      }}
                      title="Delete task"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
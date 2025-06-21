// Simplified navigation component
import { useState, useEffect, useMemo } from 'react';
import { useTodos } from '../../hooks/useTodos';
import type { ModuleId } from '../../types/navigation';

interface NavigationProps {
  currentModule: ModuleId;
  onModuleChange: (moduleId: ModuleId) => void;
  className?: string;
}

export function Navigation({ currentModule, onModuleChange }: NavigationProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Get real todos data for badge count
  const { todos } = useTodos({ archived: false });
  const pendingTodosCount = useMemo(() => {
    return todos.filter(todo => !todo.completed).length;
  }, [todos]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    {
      id: 'todos' as ModuleId,
      name: 'To-Do Lists',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      badge: pendingTodosCount,
    },
    {
      id: 'calendar' as ModuleId,
      name: 'Calendar',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: 0, // TODO: Replace with real calendar events count when implemented
    },
    {
      id: 'groceries' as ModuleId,
      name: 'Groceries',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
        </svg>
      ),
    },
    {
      id: 'documents' as ModuleId,
      name: 'Documents',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      {!isMobile && (
        <nav style={{
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          height: '100%',
          width: '256px',
          padding: '24px 0',
        }}>
        <div style={{
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {navigationItems.map((item) => {
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModuleChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#6b7280',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                <div style={{
                  marginRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  color: isActive ? '#3b82f6' : '#9ca3af',
                }}>
                  {item.icon}
                </div>
                
                <span style={{ flex: 1 }}>{item.name}</span>
                
                {item.badge && item.badge > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    backgroundColor: isActive ? '#bfdbfe' : '#f3f4f6',
                    color: isActive ? '#1e40af' : '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        </nav>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <nav style={{
          display: 'flex',
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '0',
        }}>
        {navigationItems.map((item) => {
          const isActive = currentModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 8px',
                fontSize: '11px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: 'white',
                color: isActive ? '#3b82f6' : '#6b7280',
                position: 'relative',
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '32px',
                  height: '2px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '1px',
                }} />
              )}
              
              <div style={{
                position: 'relative',
                marginBottom: '4px',
              }}>
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              <span>{item.name}</span>
            </button>
          );
        })}
        </nav>
      )}
    </>
  );
}
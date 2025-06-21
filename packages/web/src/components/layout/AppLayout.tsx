// Main application layout with navigation
import { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { UserProfile } from '../auth/UserProfile';
import { useI18n } from '../../hooks';
import type { ModuleId, LayoutProps } from '../../types/navigation';

interface AppLayoutProps extends LayoutProps {
  onModuleChange?: (moduleId: ModuleId) => void;
}

export function AppLayout({ children, currentModule = 'todos', onModuleChange }: AppLayoutProps) {
  const [activeModule, setActiveModule] = useState<ModuleId>(currentModule);
  const [isMobile, setIsMobile] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleModuleChange = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
    onModuleChange?.(moduleId);
  };

  const getModuleTitle = (moduleId: ModuleId): string => {
    const titleKeys = {
      todos: 'todos.title',
      calendar: 'calendar.title',
      groceries: 'groceries.title',
      documents: 'documents.title',
    };
    return t(titleKeys[moduleId]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
        padding: '0 16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}>
          {/* Logo and App Name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                }}>F</span>
              </div>
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>FAMAPP</h1>
                {!isMobile && (
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: 0,
                  }}>Family Organizer</p>
                )}
              </div>
            </div>
            
            {/* Current Module Title - Desktop */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: '16px',
              }}>
                <div style={{
                  width: '1px',
                  height: '24px',
                  backgroundColor: '#d1d5db',
                  margin: '0 16px',
                }} />
                <span style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#374151',
                }}>
                  {getModuleTitle(activeModule)}
                </span>
              </div>
            )}
          </div>

          {/* Header Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Desktop Sidebar Navigation */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            flexShrink: 0,
          }}>
            <div style={{ width: '256px' }}>
              <Navigation
                currentModule={activeModule}
                onModuleChange={handleModuleChange}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
        }}>
          {/* Mobile Module Title */}
          {isMobile && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
              padding: '12px 16px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
              }}>
                {getModuleTitle(activeModule)}
              </h2>
            </div>
          )}

          {/* Content Area */}
          <div style={{
            width: '100%',
            padding: isMobile ? '16px' : '32px',
          }}>
            <div style={{
              width: '100%',
              minHeight: '80vh',
            }}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div>
          <Navigation
            currentModule={activeModule}
            onModuleChange={handleModuleChange}
          />
        </div>
      )}
    </div>
  );
}
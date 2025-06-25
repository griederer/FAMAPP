import { useEffect, useState, lazy, Suspense } from 'react'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { I18nProvider } from './context/I18nContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout'
import { LoadingState } from './components/ui/LoadingState'
import { PerformancePanel } from './components/debug'
import { initializeApp } from './utils/initializeApp'
import { userWhitelistService } from '@famapp/shared'
import { addBorjaSchoolEvents } from './utils/addBorjaSchoolEvents'
import type { ModuleId } from './types/navigation'

// Lazy load modules for code splitting
const TodoModule = lazy(() => import('./components/modules').then(m => ({ default: m.TodoModule })));
const CalendarModule = lazy(() => import('./components/modules').then(m => ({ default: m.CalendarModule })));
const GroceriesModule = lazy(() => import('./components/modules').then(m => ({ default: m.GroceriesModule })));
const DocumentsModule = lazy(() => import('./components/modules').then(m => ({ default: m.DocumentsModule })));
// AI Dashboard removed - using pure calendar and todo management

function App() {
  const [currentModule, setCurrentModule] = useState<ModuleId>('todos');

  useEffect(() => {
    // Initialize app configuration on startup
    initializeApp().catch(error => {
      console.error('Failed to initialize app:', error)
    })

    // Add debug functions to window for testing authorization and adding events
    // @ts-ignore
    window.debugAuth = {
      checkEmail: async (email: string) => {
        const isAuthorized = await userWhitelistService.isEmailAuthorized(email);
        const familyMember = await userWhitelistService.getFamilyMemberFromEmail(email);
        console.log(`Email: ${email}`);
        console.log(`Authorized: ${isAuthorized}`);
        console.log(`Family Member: ${familyMember}`);
        return { isAuthorized, familyMember };
      },
      getAllUsers: async () => {
        const users = await userWhitelistService.getAllAuthorizedUsers();
        console.log('All authorized users:', users);
        return users;
      },
      getWhitelist: async () => {
        const whitelist = await userWhitelistService.getWhitelist();
        console.log('Full whitelist config:', whitelist);
        return whitelist;
      },
      addBorjaEvents: async () => {
        try {
          await addBorjaSchoolEvents();
          console.log('🎉 All Borja school events added successfully!');
        } catch (error) {
          console.error('❌ Error adding Borja events:', error);
        }
      }
    };
    
    console.log('🔧 Debug functions available:');
    console.log('   - window.debugAuth.checkEmail("email")');
    console.log('   - window.debugAuth.getAllUsers()');
    console.log('   - window.debugAuth.getWhitelist()');
    console.log('   - window.debugAuth.addBorjaEvents() ← Add all school events!');
  }, [])

  const renderCurrentModule = () => {
    // Wrap modules in Suspense for lazy loading
    return (
      <Suspense fallback={<LoadingState message="Loading module..." />}>
        {(() => {
          switch (currentModule) {
            case 'todos':
              return <TodoModule />;
            case 'calendar':
              return <CalendarModule />;
            case 'groceries':
              return <GroceriesModule />;
            case 'documents':
              return <DocumentsModule />;
            // AI Dashboard removed - focusing on direct calendar and todo management
            default:
              return <TodoModule />;
          }
        })()}
      </Suspense>
    );
  };


  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProtectedRoute>
            <AppLayout 
              currentModule={currentModule} 
              onModuleChange={setCurrentModule}
            >
              {renderCurrentModule()}
            </AppLayout>
            {/* Performance monitoring panel for development */}
            <PerformancePanel />
          </ProtectedRoute>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
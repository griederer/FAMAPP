// Authentication context for FAMAPP
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, autoArchiveService } from '@famapp/shared';
import type { User, LoadingState } from '@famapp/shared';

interface AuthContextType {
  user: User | null;
  loading: LoadingState;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<LoadingState>('loading');
  const [error, setError] = useState<string | null>(null);

  // Listen to authentication state changes
  useEffect(() => {
    setLoading('loading');
    
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading('idle');
      
      // Start/stop auto-archive service based on authentication
      if (user) {
        autoArchiveService.start();
      } else {
        autoArchiveService.stop();
      }
    });

    return () => {
      unsubscribe();
      autoArchiveService.stop(); // Clean up when component unmounts
    };
  }, []);

  const signIn = async () => {
    try {
      setLoading('loading');
      setError(null);
      const user = await authService.signInWithGoogle();
      setUser(user);
      setLoading('success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setLoading('error');
      setUser(null);
    }
  };

  const signOut = async () => {
    try {
      setLoading('loading');
      setError(null);
      await authService.signOut();
      setUser(null);
      setLoading('idle');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      setLoading('error');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
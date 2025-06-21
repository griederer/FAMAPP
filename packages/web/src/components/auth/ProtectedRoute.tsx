// Protected route component
import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignIn } from './GoogleSignIn';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in if user is not authenticated
  if (!user) {
    return fallback || <GoogleSignIn />;
  }

  // User is authenticated, show protected content
  return <>{children}</>;
}
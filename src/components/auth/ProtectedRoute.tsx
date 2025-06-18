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
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
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
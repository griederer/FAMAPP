// User profile component
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface UserProfileProps {
  className?: string;
}

export function UserProfile({ className = '' }: UserProfileProps) {
  const { user, signOut, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
  };

  return (
    <div className={`user-profile ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="profile-button"
        aria-label="User menu"
        aria-expanded={showDropdown}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="profile-avatar"
          />
        ) : (
          <div className="profile-avatar-placeholder">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="profile-name">{user.familyMember}</span>
        <svg 
          className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
          viewBox="0 0 20 20" 
          fill="currentColor"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {showDropdown && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <p className="user-name">{user.displayName}</p>
            <p className="user-email">{user.email}</p>
          </div>
          <div className="dropdown-divider"></div>
          <button
            onClick={handleSignOut}
            disabled={loading === 'loading'}
            className="signout-button"
          >
            {loading === 'loading' ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}

      {showDropdown && (
        <div 
          className="dropdown-backdrop"
          onClick={() => setShowDropdown(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
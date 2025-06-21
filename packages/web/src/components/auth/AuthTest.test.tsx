import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoogleSignIn } from './GoogleSignIn'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthProvider } from '../../context/AuthContext'

// Mock Firebase config first
vi.mock('../../config/firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
  FAMILY_MEMBERS: ['Gonzalo', 'Mpaz', 'Borja', 'Melody']
}))

// Mock auth service
vi.mock('../../services/authService', () => ({
  authService: {
    onAuthStateChange: vi.fn((callback) => {
      callback(null) // No user by default
      return vi.fn() // Return unsubscribe function
    }),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    isAuthorizedEmail: vi.fn(),
    getFamilyMemberFromEmail: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}))

describe('Auth Components Integration', () => {
  it('renders GoogleSignIn component properly', () => {
    render(
      <AuthProvider>
        <GoogleSignIn />
      </AuthProvider>
    )
    
    expect(screen.getByText('FAMAPP')).toBeInTheDocument()
    expect(screen.getByText('Family Organizer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('renders ProtectedRoute with sign-in when not authenticated', () => {
    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )
    
    // Should show sign-in, not protected content
    expect(screen.getByText('FAMAPP')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
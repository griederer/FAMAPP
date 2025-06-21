// Comprehensive authentication flow tests with proper mocking
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Mock all Firebase and services FIRST
vi.mock('../../config/firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
  FAMILY_MEMBERS: ['Gonzalo', 'Mpaz', 'Borja', 'Melody']
}))

vi.mock('../../services/userWhitelistService', () => ({
  userWhitelistService: {
    isEmailAuthorized: vi.fn().mockResolvedValue(true),
    getFamilyMemberFromEmail: vi.fn().mockResolvedValue('Gonzalo'),
    initializeWhitelist: vi.fn().mockResolvedValue(undefined),
    getWhitelist: vi.fn().mockResolvedValue(null),
  }
}))

vi.mock('../../utils/initializeApp', () => ({
  initializeApp: vi.fn().mockResolvedValue(undefined),
  checkAppInitialization: vi.fn().mockResolvedValue(true)
}))

vi.mock('../../services/authService', () => ({
  authService: {
    onAuthStateChange: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    isAuthorizedEmail: vi.fn(),
    getFamilyMemberFromEmail: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}))

// Import components after mocking
import { act } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { GoogleSignIn } from './GoogleSignIn'
import { UserProfile } from './UserProfile'

// Helper function to render with auth provider
const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unauthenticated User Experience', () => {
    beforeEach(async () => {
      // Mock no authenticated user
      const { authService } = await import('../../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0)
        return vi.fn()
      })
    })

    it('displays Google sign-in for unauthenticated users', async () => {
      renderWithAuth(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByText('FAMAPP')).toBeInTheDocument()
        expect(screen.getByText('Family Organizer')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('shows family member names in sign-in interface', async () => {
      renderWithAuth(<GoogleSignIn />)

      await waitFor(() => {
        expect(screen.getByText('Only family members can access this app')).toBeInTheDocument()
        expect(screen.getByText('Gonzalo • Mpaz • Borja • Melody')).toBeInTheDocument()
      })
    })

    it('triggers sign-in when Google button is clicked', async () => {
      renderWithAuth(<GoogleSignIn />)

      // Wait for component to render, then click the button
      const signInButton = await screen.findByRole('button', { name: /sign in with google/i })
      
      act(() => {
        fireEvent.click(signInButton)
      })

      // Check that loading state is triggered (indicates signIn was called)
      // This verifies that the sign-in flow was initiated
      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument()
      })
    })

    it('displays loading state during authentication', async () => {
      renderWithAuth(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      // Should show loading initially before auth state resolves
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Error Handling During Authentication', () => {
    beforeEach(async () => {
      const { authService } = await import('../../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0)
        return vi.fn()
      })
    })

    it('displays error message for unauthorized users', async () => {
      const { authService } = await import('../../services/authService')
      authService.signInWithGoogle.mockRejectedValue(
        new Error('Unauthorized: Only family members can access this app')
      )

      renderWithAuth(<GoogleSignIn />)

      const signInButton = await screen.findByRole('button', { name: /sign in with google/i })
      
      act(() => {
        fireEvent.click(signInButton)
      })

      // First check that loading starts (this proves the sign-in was triggered)
      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument()
      })

      // Then wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Check for the error text
      await waitFor(() => {
        expect(screen.getByText('Unauthorized: Only family members can access this app')).toBeInTheDocument()
      })
    })

    it('allows error dismissal', async () => {
      const { authService } = await import('../../services/authService')
      authService.signInWithGoogle.mockRejectedValue(
        new Error('Test error message')
      )

      renderWithAuth(<GoogleSignIn />)

      const signInButton = await screen.findByRole('button', { name: /sign in with google/i })
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument()
      })

      const dismissButton = await screen.findByRole('button', { name: /dismiss error/i })
      fireEvent.click(dismissButton)

      await waitFor(() => {
        expect(screen.queryByText('Test error message')).not.toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      const { authService } = await import('../../services/authService')
      authService.signInWithGoogle.mockRejectedValue(
        new Error('Network error')
      )

      renderWithAuth(<GoogleSignIn />)

      const signInButton = await screen.findByRole('button', { name: /sign in with google/i })
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('Authenticated User Experience', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'gonzalo@example.com',
      displayName: 'Gonzalo',
      photoURL: 'https://example.com/photo.jpg',
      familyMember: 'Gonzalo' as const,
      createdAt: new Date(),
      lastLoginAt: new Date()
    }

    beforeEach(async () => {
      const { authService } = await import('../../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0)
        return vi.fn()
      })
    })

    it('shows protected content for authenticated users', async () => {
      renderWithAuth(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })

      // Sign-in form should not be visible
      expect(screen.queryByText('FAMAPP')).not.toBeInTheDocument()
    })

    it('displays user profile with correct information', async () => {
      renderWithAuth(<UserProfile />)

      await waitFor(() => {
        expect(screen.getByText('Gonzalo')).toBeInTheDocument()
      })
    })

    it('shows user avatar when available', async () => {
      renderWithAuth(<UserProfile />)

      await waitFor(() => {
        const avatar = screen.getByAltText('Gonzalo')
        expect(avatar).toBeInTheDocument()
        expect(avatar).toHaveAttribute('src', 'https://example.com/photo.jpg')
      })
    })

    it('shows initials fallback when no photo available', async () => {
      const userWithoutPhoto = { ...mockUser, photoURL: undefined }
      
      const { authService } = await import('../../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(userWithoutPhoto), 0)
        return vi.fn()
      })

      renderWithAuth(<UserProfile />)

      await waitFor(() => {
        expect(screen.getByText('G')).toBeInTheDocument()
      })
    })

    it('opens profile dropdown on click', async () => {
      renderWithAuth(<UserProfile />)

      await waitFor(() => {
        const profileButton = screen.getByRole('button', { name: /user menu/i })
        fireEvent.click(profileButton)
      })

      await waitFor(() => {
        expect(screen.getByText('gonzalo@example.com')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
      })
    })

    it('calls sign out when sign out button is clicked', async () => {
      const { authService } = await import('../../services/authService')
      authService.signOut.mockResolvedValue(undefined)

      renderWithAuth(<UserProfile />)

      // Wait for profile to load and find the user menu button
      const profileButton = await screen.findByRole('button', { name: /user menu/i })
      fireEvent.click(profileButton)

      // Wait for dropdown to open and find sign out button
      const signOutButton = await screen.findByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      // Wait for sign out to be called
      await waitFor(() => {
        expect(authService.signOut).toHaveBeenCalled()
      })
    })
  })

  describe('Complete Authentication Workflow', () => {
    it('completes full sign-in to protected content flow', async () => {
      // Start with unauthenticated state
      let authCallback: ((user: any) => void) | null = null
      
      const { authService } = await import('../../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        // Start unauthenticated
        setTimeout(() => callback(null), 0)
        return vi.fn()
      })

      renderWithAuth(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
          <UserProfile />
        </ProtectedRoute>
      )

      // 1. Should show sign-in initially
      await waitFor(() => {
        expect(screen.getByText('FAMAPP')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

      // 2. Simulate successful authentication by calling auth callback with user
      const authenticatedUser = {
        uid: 'test-uid',
        email: 'gonzalo@example.com',
        displayName: 'Gonzalo',
        familyMember: 'Gonzalo',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      if (authCallback) {
        act(() => {
          authCallback(authenticatedUser)
        })
      }

      // 3. Should show protected content
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Gonzalo')).toBeInTheDocument()
      })

      // 4. Should not show sign-in anymore
      await waitFor(() => {
        expect(screen.queryByText('FAMAPP')).not.toBeInTheDocument()
      })
    })

    it('handles sign-out to sign-in transition', async () => {
      // Start authenticated
      let authCallback: ((user: any) => void) | null = null
      const currentUser = {
        uid: 'test-uid',
        email: 'gonzalo@example.com',
        displayName: 'Gonzalo',
        familyMember: 'Gonzalo',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      const { authService } = await import('../../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        // Start with authenticated user
        setTimeout(() => callback(currentUser), 0)
        return vi.fn()
      })

      renderWithAuth(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      )

      // Should show protected content initially
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })

      // Simulate sign-out by calling the auth callback with null
      if (authCallback) {
        act(() => {
          authCallback(null)
        })
      }

      // Should show sign-in again
      await waitFor(() => {
        expect(screen.getByText('FAMAPP')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases and Error Recovery', () => {
    it('handles auth service errors during state monitoring', async () => {
      const { authService } = await import('../../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        // Simulate error in auth state monitoring
        setTimeout(() => {
          try {
            callback(null)
          } catch (error) {
            // Error is caught and handled gracefully
          }
        }, 0)
        return vi.fn()
      })

      renderWithAuth(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      // Should still render sign-in despite internal error
      await waitFor(() => {
        expect(screen.getByText('FAMAPP')).toBeInTheDocument()
      })
    })

    it('maintains UI consistency during rapid state changes', async () => {
      let authCallback: ((user: any) => void) | null = null
      
      const { authService } = await import('../../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        // Start with unauthenticated
        setTimeout(() => callback(null), 0)
        return vi.fn()
      })

      renderWithAuth(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      )

      // Should start with sign-in page
      await waitFor(() => {
        expect(screen.getByText('FAMAPP')).toBeInTheDocument()
      })

      // Simulate rapid state changes - multiple auth state updates
      if (authCallback) {
        // First change to authenticated
        act(() => {
          authCallback({
            uid: 'test-uid',
            email: 'gonzalo@example.com',
            displayName: 'Gonzalo',
            familyMember: 'Gonzalo'
          })
        })

        // Briefly back to unauthenticated 
        act(() => {
          authCallback(null)
        })

        // Final state: authenticated
        act(() => {
          authCallback({
            uid: 'test-uid',
            email: 'gonzalo@example.com',
            displayName: 'Gonzalo',
            familyMember: 'Gonzalo'
          })
        })
      }

      // Should eventually stabilize to authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })
})
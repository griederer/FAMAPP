// AuthContext comprehensive tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'

// Mock Firebase and services BEFORE importing anything else
vi.mock('../config/firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
  FAMILY_MEMBERS: ['Gonzalo', 'Mpaz', 'Borja', 'Melody']
}))

vi.mock('../services/userWhitelistService', () => ({
  userWhitelistService: {
    isEmailAuthorized: vi.fn().mockResolvedValue(true),
    getFamilyMemberFromEmail: vi.fn().mockResolvedValue('Gonzalo'),
    initializeWhitelist: vi.fn().mockResolvedValue(undefined),
    getWhitelist: vi.fn().mockResolvedValue(null),
  }
}))

vi.mock('../utils/initializeApp', () => ({
  initializeApp: vi.fn().mockResolvedValue(undefined),
  checkAppInitialization: vi.fn().mockResolvedValue(true)
}))

vi.mock('../services/authService', () => ({
  authService: {
    onAuthStateChange: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    isAuthorizedEmail: vi.fn(),
    getFamilyMemberFromEmail: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}))

// Now import the components
import { AuthProvider, useAuth } from './AuthContext'

// Test component to access auth context
function TestAuthContext() {
  const { user, loading, error, signIn, signOut, clearError } = useAuth()

  return (
    <div>
      <div data-testid="auth-loading">{loading}</div>
      <div data-testid="auth-user">{user ? user.familyMember : 'no-user'}</div>
      <div data-testid="auth-error">{error || 'no-error'}</div>
      <button onClick={signIn} data-testid="auth-sign-in">Sign In</button>
      <button onClick={signOut} data-testid="auth-sign-out">Sign Out</button>
      <button onClick={clearError} data-testid="auth-clear-error">Clear Error</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAuth hook validation', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestAuthContext />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })

    it('provides auth context when used within AuthProvider', async () => {
      const { authService } = await import('../services/authService')
      // Mock auth state change to call callback with null user
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0)
        return vi.fn() // unsubscribe function
      })

      render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      expect(screen.getByTestId('auth-user')).toBeInTheDocument()
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument()
      expect(screen.getByTestId('auth-error')).toBeInTheDocument()
    })
  })

  describe('Authentication state management', () => {
    it('starts with loading state and resolves to idle', async () => {
      let authCallback: ((user: any) => void) | null = null
      
      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return vi.fn()
      })

      render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      // Should start in loading state
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('loading')

      // Simulate auth state resolved
      act(() => {
        authCallback?.(null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('idle')
      })
    })

    it('sets user when authenticated', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'gonzalo@example.com',
        displayName: 'Gonzalo',
        familyMember: 'Gonzalo',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0)
        return vi.fn()
      })

      render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('auth-user')).toHaveTextContent('Gonzalo')
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('idle')
      })
    })
  })

  describe('Sign in functionality', () => {
    it('handles successful sign in', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'gonzalo@example.com',
        displayName: 'Gonzalo',
        familyMember: 'Gonzalo',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      // Start with no user
      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0)
        return vi.fn()
      })

      authService.signInWithGoogle.mockResolvedValue(mockUser)

      render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      // Wait for initial state
      await waitFor(() => {
        expect(screen.getByTestId('auth-user')).toHaveTextContent('no-user')
      })

      // Click sign in
      fireEvent.click(screen.getByTestId('auth-sign-in'))

      // Should show loading
      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('loading')
      })

      // Should eventually show success
      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('success')
      })

      expect(authService.signInWithGoogle).toHaveBeenCalled()
    })

    it('handles sign in errors', async () => {
      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0)
        return vi.fn()
      })

      const errorMessage = 'Unauthorized: Only family members can access this app'
      authService.signInWithGoogle.mockRejectedValue(new Error(errorMessage))

      render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      fireEvent.click(screen.getByTestId('auth-sign-in'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent(errorMessage)
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('error')
      })
    })

    it('clears errors on clearError call', async () => {
      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0)
        return vi.fn()
      })

      authService.signInWithGoogle.mockRejectedValue(new Error('Test error'))

      render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      // Trigger error
      fireEvent.click(screen.getByTestId('auth-sign-in'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Test error')
      })

      // Clear error
      fireEvent.click(screen.getByTestId('auth-clear-error'))

      expect(screen.getByTestId('auth-error')).toHaveTextContent('no-error')
    })
  })

  describe('Sign out functionality', () => {
    it('handles successful sign out', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'gonzalo@example.com',
        displayName: 'Gonzalo',
        familyMember: 'Gonzalo',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      // Start with authenticated user
      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0)
        return vi.fn()
      })

      authService.signOut.mockResolvedValue(undefined)

      render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      // Wait for user to be set
      await waitFor(() => {
        expect(screen.getByTestId('auth-user')).toHaveTextContent('Gonzalo')
      })

      // Click sign out
      fireEvent.click(screen.getByTestId('auth-sign-out'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('loading')
      })

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('idle')
      })

      expect(authService.signOut).toHaveBeenCalled()
    })

    it('handles sign out errors', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'gonzalo@example.com',
        displayName: 'Gonzalo',
        familyMember: 'Gonzalo',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0)
        return vi.fn()
      })

      authService.signOut.mockRejectedValue(new Error('Sign out failed'))

      render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      fireEvent.click(screen.getByTestId('auth-sign-out'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Sign out failed')
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('error')
      })
    })
  })

  describe('Component lifecycle', () => {
    it('unsubscribes from auth state changes on unmount', async () => {
      const mockUnsubscribe = vi.fn()
      
      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation(() => {
        return mockUnsubscribe
      })

      const { unmount } = render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('maintains state consistency across re-renders', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'gonzalo@example.com',
        displayName: 'Gonzalo',
        familyMember: 'Gonzalo',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      const { authService } = await import('../services/authService')
      authService.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0)
        return vi.fn()
      })

      const { rerender } = render(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('auth-user')).toHaveTextContent('Gonzalo')
      })

      // Re-render the component
      rerender(
        <AuthProvider>
          <TestAuthContext />
        </AuthProvider>
      )

      // User should still be there
      expect(screen.getByTestId('auth-user')).toHaveTextContent('Gonzalo')
    })
  })
})
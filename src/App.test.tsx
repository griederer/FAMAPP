import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock auth service
vi.mock('./services/authService', () => ({
  authService: {
    onAuthStateChange: vi.fn((callback) => {
      // Mock authenticated user
      callback({
        uid: 'test-uid',
        email: 'gonzalo@example.com',
        displayName: 'Gonzalo',
        familyMember: 'Gonzalo'
      })
      return vi.fn() // Return unsubscribe function
    }),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    isAuthorizedEmail: vi.fn(() => true),
    getFamilyMemberFromEmail: vi.fn(() => 'Gonzalo'),
    getCurrentUser: vi.fn(),
  }
}))

// Mock Firebase config
vi.mock('./config/firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
  FAMILY_MEMBERS: ['Gonzalo', 'Mpaz', 'Borja', 'Melody']
}))

describe('App', () => {
  it('renders FAMAPP heading when authenticated', async () => {
    render(<App />)
    expect(await screen.findByText('FAMAPP')).toBeInTheDocument()
  })

  it('renders coming soon message when authenticated', async () => {
    render(<App />)
    expect(await screen.findByText('Family Organizer - Coming Soon')).toBeInTheDocument()
  })
})
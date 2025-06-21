import { describe, it, expect, vi } from 'vitest'
import { render, screen } from './utils/testUtils'
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

// Mock todo service
vi.mock('./services/todoService', () => ({
  todoService: {
    subscribeTodos: vi.fn((filters, callback) => {
      // Mock empty todos array
      callback([])
      return vi.fn() // Return unsubscribe function
    }),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    toggleComplete: vi.fn(),
  }
}))

// Mock the initialization utility
vi.mock('./utils/initializeApp', () => ({
  initializeApp: vi.fn().mockResolvedValue(undefined),
  checkAppInitialization: vi.fn().mockResolvedValue(true)
}))

describe('App', () => {
  it('renders FAMAPP heading when authenticated', async () => {
    render(<App />)
    expect(await screen.findByText('FAMAPP')).toBeInTheDocument()
  })

})
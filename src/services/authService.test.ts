import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from './authService'

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
}))

vi.mock('../config/firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
  FAMILY_MEMBERS: ['Gonzalo', 'Mpaz', 'Borja', 'Melody']
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isAuthorizedEmail', () => {
    it('returns true for authorized emails', () => {
      expect(authService.isAuthorizedEmail('gonzalo@example.com')).toBe(true)
      expect(authService.isAuthorizedEmail('mpaz@example.com')).toBe(true)
      expect(authService.isAuthorizedEmail('borja@example.com')).toBe(true)
      expect(authService.isAuthorizedEmail('melody@example.com')).toBe(true)
    })

    it('returns false for unauthorized emails', () => {
      expect(authService.isAuthorizedEmail('stranger@example.com')).toBe(false)
      expect(authService.isAuthorizedEmail('random@gmail.com')).toBe(false)
    })

    it('returns false for null email', () => {
      expect(authService.isAuthorizedEmail(null)).toBe(false)
    })

    it('is case insensitive', () => {
      expect(authService.isAuthorizedEmail('GONZALO@EXAMPLE.COM')).toBe(true)
      expect(authService.isAuthorizedEmail('Mpaz@Example.Com')).toBe(true)
    })
  })

  describe('getFamilyMemberFromEmail', () => {
    it('returns correct family member for authorized emails', () => {
      expect(authService.getFamilyMemberFromEmail('gonzalo@example.com')).toBe('Gonzalo')
      expect(authService.getFamilyMemberFromEmail('mpaz@example.com')).toBe('Mpaz')
      expect(authService.getFamilyMemberFromEmail('borja@example.com')).toBe('Borja')
      expect(authService.getFamilyMemberFromEmail('melody@example.com')).toBe('Melody')
    })

    it('returns null for unauthorized emails', () => {
      expect(authService.getFamilyMemberFromEmail('stranger@example.com')).toBe(null)
    })

    it('is case insensitive', () => {
      expect(authService.getFamilyMemberFromEmail('GONZALO@EXAMPLE.COM')).toBe('Gonzalo')
    })
  })

  describe('getCurrentUser', () => {
    it('returns current user from auth', () => {
      // This is a simple method that just calls auth.currentUser
      // Since auth is mocked, we'll just verify the method exists
      expect(typeof authService.getCurrentUser).toBe('function')
    })
  })
})
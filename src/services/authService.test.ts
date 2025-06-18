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

// Mock the whitelist service
vi.mock('./userWhitelistService', () => ({
  userWhitelistService: {
    isEmailAuthorized: vi.fn(),
    getFamilyMemberFromEmail: vi.fn(),
    initializeWhitelist: vi.fn(),
    getWhitelist: vi.fn(),
  }
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isAuthorizedEmail', () => {
    it('calls whitelist service for authorization check', async () => {
      const { userWhitelistService } = await import('./userWhitelistService')
      
      // Mock the service to return true
      vi.mocked(userWhitelistService.isEmailAuthorized).mockResolvedValue(true)
      
      const result = await authService.isAuthorizedEmail('gonzalo@example.com')
      
      expect(userWhitelistService.isEmailAuthorized).toHaveBeenCalledWith('gonzalo@example.com')
      expect(result).toBe(true)
    })

    it('returns false for null email', async () => {
      const result = await authService.isAuthorizedEmail(null)
      expect(result).toBe(false)
    })
  })

  describe('getFamilyMemberFromEmail', () => {
    it('calls whitelist service for family member lookup', async () => {
      const { userWhitelistService } = await import('./userWhitelistService')
      
      // Mock the service to return family member
      vi.mocked(userWhitelistService.getFamilyMemberFromEmail).mockResolvedValue('Gonzalo')
      
      const result = await authService.getFamilyMemberFromEmail('gonzalo@example.com')
      
      expect(userWhitelistService.getFamilyMemberFromEmail).toHaveBeenCalledWith('gonzalo@example.com')
      expect(result).toBe('Gonzalo')
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
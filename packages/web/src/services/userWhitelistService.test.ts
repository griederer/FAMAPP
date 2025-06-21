// UserWhitelistService comprehensive tests with proper mocking
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/firebase', () => ({
  db: { name: 'mock-db' },
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}))

// Import service after mocking
import { userWhitelistService, type WhitelistConfig } from './userWhitelistService'

describe('UserWhitelistService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Whitelist Initialization', () => {
    it('creates new whitelist when none exists', async () => {
      // Mock document doesn't exist
      const { doc, getDoc, setDoc } = await import('firebase/firestore')
      doc.mockReturnValue({ id: 'family-whitelist', path: 'config/family-whitelist' })
      getDoc.mockResolvedValue({
        exists: () => false
      })
      setDoc.mockResolvedValue(undefined)

      await userWhitelistService.initializeWhitelist()

      expect(setDoc).toHaveBeenCalledTimes(1)
      
      // Check the structure of the created whitelist
      const setDocCall = setDoc.mock.calls[0]
      const whitelistData = setDocCall[1] as WhitelistConfig
      
      expect(whitelistData.version).toBe('1.0.0')
      expect(whitelistData.updatedBy).toBe('system')
      expect(whitelistData.authorizedUsers).toHaveLength(4)
      
      const familyMembers = whitelistData.authorizedUsers.map(user => user.familyMember)
      expect(familyMembers).toEqual(['Gonzalo', 'Mpaz', 'Borja', 'Melody'])
      
      whitelistData.authorizedUsers.forEach(user => {
        expect(user.isActive).toBe(true)
        expect(user.addedBy).toBe('system')
        expect(user.email).toMatch(/@example\.com$/)
      })
    })

    it('does not recreate whitelist when it already exists', async () => {
      // Mock document exists
      const { getDoc, setDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => true
      })

      await userWhitelistService.initializeWhitelist()

      expect(setDoc).not.toHaveBeenCalled()
    })

    it('handles initialization errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockRejectedValue(new Error('Firestore error'))

      // Should not throw error
      await expect(userWhitelistService.initializeWhitelist()).resolves.toBeUndefined()
    })
  })

  describe('Email Authorization', () => {
    const createMockWhitelist = (users: any[]) => ({
      exists: () => true,
      data: () => ({
        version: '1.0.0',
        updatedAt: { toDate: () => new Date() },
        updatedBy: 'system',
        authorizedUsers: users.map(user => ({
          ...user,
          addedAt: { toDate: () => new Date() }
        }))
      })
    })

    it('authorizes active users in whitelist', async () => {
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue(createMockWhitelist(users))

      const result = await userWhitelistService.isEmailAuthorized('gonzalo@example.com')
      expect(result).toBe(true)
    })

    it('rejects inactive users', async () => {
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: false,
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue(createMockWhitelist(users))

      const result = await userWhitelistService.isEmailAuthorized('gonzalo@example.com')
      expect(result).toBe(false)
    })

    it('rejects users not in whitelist', async () => {
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue(createMockWhitelist(users))

      const result = await userWhitelistService.isEmailAuthorized('stranger@example.com')
      expect(result).toBe(false)
    })

    it('is case insensitive for email comparison', async () => {
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue(createMockWhitelist(users))

      const result = await userWhitelistService.isEmailAuthorized('GONZALO@EXAMPLE.COM')
      expect(result).toBe(true)
    })

    it('initializes whitelist if none exists during authorization check', async () => {
      // First call - no whitelist exists
      const { getDoc, setDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValueOnce({
        exists: () => false
      })

      // Second call after initialization - whitelist exists
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedBy: 'system'
        }
      ]
      getDoc.mockResolvedValueOnce(createMockWhitelist(users))
      setDoc.mockResolvedValue(undefined)

      const result = await userWhitelistService.isEmailAuthorized('gonzalo@example.com')
      
      expect(setDoc).toHaveBeenCalled() // Whitelist was initialized
      expect(result).toBe(true)
    })

    it('handles authorization errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockRejectedValue(new Error('Firestore error'))

      const result = await userWhitelistService.isEmailAuthorized('gonzalo@example.com')
      expect(result).toBe(false) // Default to false on error
    })
  })

  describe('Family Member Lookup', () => {
    const createMockWhitelist = (users: any[]) => ({
      exists: () => true,
      data: () => ({
        version: '1.0.0',
        updatedAt: { toDate: () => new Date() },
        updatedBy: 'system',
        authorizedUsers: users.map(user => ({
          ...user,
          addedAt: { toDate: () => new Date() }
        }))
      })
    })

    it('returns correct family member for authorized active users', async () => {
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedBy: 'system'
        },
        {
          email: 'mpaz@example.com',
          familyMember: 'Mpaz',
          isActive: true,
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue(createMockWhitelist(users))

      const gonzaloResult = await userWhitelistService.getFamilyMemberFromEmail('gonzalo@example.com')
      expect(gonzaloResult).toBe('Gonzalo')

      const mpazResult = await userWhitelistService.getFamilyMemberFromEmail('mpaz@example.com')
      expect(mpazResult).toBe('Mpaz')
    })

    it('returns null for inactive users', async () => {
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: false,
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue(createMockWhitelist(users))

      const result = await userWhitelistService.getFamilyMemberFromEmail('gonzalo@example.com')
      expect(result).toBe(null)
    })

    it('returns null for users not in whitelist', async () => {
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue(createMockWhitelist(users))

      const result = await userWhitelistService.getFamilyMemberFromEmail('stranger@example.com')
      expect(result).toBe(null)
    })

    it('is case insensitive for email lookup', async () => {
      const users = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue(createMockWhitelist(users))

      const result = await userWhitelistService.getFamilyMemberFromEmail('GONZALO@EXAMPLE.COM')
      expect(result).toBe('Gonzalo')
    })

    it('handles lookup errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockRejectedValue(new Error('Firestore error'))

      const result = await userWhitelistService.getFamilyMemberFromEmail('gonzalo@example.com')
      expect(result).toBe(null) // Default to null on error
    })
  })

  describe('Whitelist Retrieval', () => {
    it('returns parsed whitelist with converted dates', async () => {
      const mockData = {
        version: '1.0.0',
        updatedAt: { toDate: () => new Date('2024-01-01') },
        updatedBy: 'system',
        authorizedUsers: [
          {
            email: 'gonzalo@example.com',
            familyMember: 'Gonzalo',
            isActive: true,
            addedAt: { toDate: () => new Date('2024-01-01') },
            addedBy: 'system'
          }
        ]
      }

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockData
      })

      const result = await userWhitelistService.getWhitelist()
      
      expect(result).not.toBeNull()
      expect(result!.version).toBe('1.0.0')
      expect(result!.updatedAt).toBeInstanceOf(Date)
      expect(result!.authorizedUsers[0].addedAt).toBeInstanceOf(Date)
    })

    it('returns null when whitelist does not exist', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => false
      })

      const result = await userWhitelistService.getWhitelist()
      expect(result).toBe(null)
    })

    it('handles retrieval errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockRejectedValue(new Error('Firestore error'))

      const result = await userWhitelistService.getWhitelist()
      expect(result).toBe(null)
    })
  })

  describe('User Management', () => {
    const createMockWhitelist = (users: any[]) => ({
      version: '1.0.0',
      updatedAt: new Date(),
      updatedBy: 'system',
      authorizedUsers: users
    })

    it('adds new authorized user', async () => {
      const existingUsers = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedAt: new Date(),
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...createMockWhitelist(existingUsers),
          updatedAt: { toDate: () => new Date() },
          authorizedUsers: existingUsers.map(user => ({
            ...user,
            addedAt: { toDate: () => new Date() }
          }))
        })
      })
      const { setDoc } = await import('firebase/firestore')
      setDoc.mockResolvedValue(undefined)

      const result = await userWhitelistService.addAuthorizedUser(
        'newuser@example.com',
        'Mpaz',
        'admin'
      )

      expect(result).toBe(true)
      expect(setDoc).toHaveBeenCalled()
      
      const updatedWhitelist = setDoc.mock.calls[0][1]
      expect(updatedWhitelist.authorizedUsers).toHaveLength(2)
      expect(updatedWhitelist.authorizedUsers[1].email).toBe('newuser@example.com')
      expect(updatedWhitelist.authorizedUsers[1].familyMember).toBe('Mpaz')
    })

    it('reactivates inactive user instead of adding duplicate', async () => {
      const existingUsers = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: false,
          addedAt: new Date(),
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...createMockWhitelist(existingUsers),
          updatedAt: { toDate: () => new Date() },
          authorizedUsers: existingUsers.map(user => ({
            ...user,
            addedAt: { toDate: () => new Date() }
          }))
        })
      })
      const { setDoc } = await import('firebase/firestore')
      setDoc.mockResolvedValue(undefined)

      const result = await userWhitelistService.addAuthorizedUser(
        'gonzalo@example.com',
        'Gonzalo',
        'admin'
      )

      expect(result).toBe(true)
      expect(setDoc).toHaveBeenCalled()
      
      const updatedWhitelist = setDoc.mock.calls[0][1]
      expect(updatedWhitelist.authorizedUsers).toHaveLength(1)
      expect(updatedWhitelist.authorizedUsers[0].isActive).toBe(true)
    })

    it('deactivates active user', async () => {
      const existingUsers = [
        {
          email: 'gonzalo@example.com',
          familyMember: 'Gonzalo',
          isActive: true,
          addedAt: new Date(),
          addedBy: 'system'
        }
      ]

      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...createMockWhitelist(existingUsers),
          updatedAt: { toDate: () => new Date() },
          authorizedUsers: existingUsers.map(user => ({
            ...user,
            addedAt: { toDate: () => new Date() }
          }))
        })
      })
      const { setDoc } = await import('firebase/firestore')
      setDoc.mockResolvedValue(undefined)

      const result = await userWhitelistService.deactivateUser(
        'gonzalo@example.com',
        'admin'
      )

      expect(result).toBe(true)
      expect(setDoc).toHaveBeenCalled()
      
      const updatedWhitelist = setDoc.mock.calls[0][1]
      expect(updatedWhitelist.authorizedUsers[0].isActive).toBe(false)
    })

    it('handles user management errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockRejectedValue(new Error('Firestore error'))

      const result = await userWhitelistService.addAuthorizedUser(
        'newuser@example.com',
        'Mpaz',
        'admin'
      )

      expect(result).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles missing whitelist data gracefully', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => null
      })

      const result = await userWhitelistService.isEmailAuthorized('gonzalo@example.com')
      expect(result).toBe(false)
    })

    it('handles corrupted whitelist data', async () => {
      const { getDoc } = await import('firebase/firestore')
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          version: '1.0.0',
          // Missing authorizedUsers array
        })
      })

      const result = await userWhitelistService.isEmailAuthorized('gonzalo@example.com')
      expect(result).toBe(false)
    })

    it('handles empty email strings', async () => {
      const result = await userWhitelistService.isEmailAuthorized('')
      expect(result).toBe(false)
    })
  })
})
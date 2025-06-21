import { describe, it, expect, beforeAll } from 'vitest'
import { auth, db, googleProvider, FAMILY_MEMBERS } from './firebase'

// Mock environment variables for testing
beforeAll(() => {
  // Set mock environment variables
  Object.defineProperty(import.meta, 'env', {
    value: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'famapp-e80ff.firebaseapp.com',
      VITE_FIREBASE_STORAGE_BUCKET: 'famapp-e80ff.appspot.com',
      VITE_FIREBASE_APP_ID: 'test-app-id'
    },
    writable: true
  })
})

describe('Firebase Configuration', () => {
  it('exports auth instance', () => {
    expect(auth).toBeDefined()
    expect(auth.app).toBeDefined()
  })

  it('exports firestore instance', () => {
    expect(db).toBeDefined()
    expect(db.app).toBeDefined()
  })

  it('exports Google provider with correct config', () => {
    expect(googleProvider).toBeDefined()
    expect(googleProvider.providerId).toBe('google.com')
  })

  it('defines family members correctly', () => {
    expect(FAMILY_MEMBERS).toEqual(['Gonzalo', 'Mpaz', 'Borja', 'Melody'])
    expect(FAMILY_MEMBERS).toHaveLength(4)
  })

  it('auth and db should use same app instance', () => {
    expect(auth.app).toBe(db.app)
  })
})
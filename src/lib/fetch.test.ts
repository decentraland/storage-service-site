import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthIdentity } from '@dcl/crypto'
import { server } from '@/test/server'
import { createAuthenticatedFetch, isIdentityValid } from './fetch'

// Mock the SSO client (v0.1.0 API) - must be at top level with vi.hoisted
const { mockGetIdentity } = vi.hoisted(() => ({
  mockGetIdentity: vi.fn()
}))

vi.mock('@dcl/single-sign-on-client', () => ({
  getIdentity: mockGetIdentity
}))

// Mock the signedFetch from decentraland-crypto-fetch (default export)
const mockSignedFetchLib = vi.fn()

vi.mock('decentraland-crypto-fetch', () => ({
  default: (url: string, init: RequestInit) => mockSignedFetchLib(url, init)
}))

describe('fetch utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isIdentityValid', () => {
    describe('when identity is valid', () => {
      it('should return true for future expiration date', () => {
        const futureDate = new Date(Date.now() + 3600000)
        const identity = { expiration: futureDate } as AuthIdentity

        expect(isIdentityValid(identity)).toBe(true)
      })
    })

    describe('when identity is expired', () => {
      it('should return false for past expiration date', () => {
        const pastDate = new Date(Date.now() - 3600000)
        const identity = { expiration: pastDate } as AuthIdentity

        expect(isIdentityValid(identity)).toBe(false)
      })
    })

    describe('when identity is null', () => {
      it('should return false', () => {
        expect(isIdentityValid(null)).toBe(false)
      })
    })

    describe('when identity has no expiration', () => {
      it('should return false', () => {
        const identity = {} as AuthIdentity

        expect(isIdentityValid(identity)).toBe(false)
      })
    })
  })

  describe('createAuthenticatedFetch', () => {
    const mockWallet = '0x1234567890abcdef1234567890abcdef12345678'
    const mockValidIdentity = {
      expiration: new Date(Date.now() + 3600000),
      authChain: []
    } as unknown as AuthIdentity
    const mockExpiredIdentity = {
      expiration: new Date(Date.now() - 3600000),
      authChain: []
    } as unknown as AuthIdentity

    describe('when user is signed in with valid identity', () => {
      beforeEach(() => {
        mockGetIdentity.mockResolvedValue(mockValidIdentity)
        mockSignedFetchLib.mockResolvedValue(new Response('{}'))
      })

      it('should use signedFetch', async () => {
        const authenticatedFetch = createAuthenticatedFetch(mockWallet, true)

        await authenticatedFetch('https://api.example.com/data')

        expect(mockSignedFetchLib).toHaveBeenCalledWith('https://api.example.com/data', {
          identity: mockValidIdentity
        })
      })

      it('should pass init options to signedFetch', async () => {
        const authenticatedFetch = createAuthenticatedFetch(mockWallet, true)
        const init = { method: 'POST', body: JSON.stringify({ key: 'value' }) }

        await authenticatedFetch('https://api.example.com/data', init)

        expect(mockSignedFetchLib).toHaveBeenCalledWith('https://api.example.com/data', {
          ...init,
          identity: mockValidIdentity
        })
      })
    })

    describe('when user is signed in but identity is expired', () => {
      beforeEach(() => {
        mockGetIdentity.mockResolvedValue(mockExpiredIdentity)
        // Add MSW handler for the fallback fetch
        server.use(
          http.get('https://api.example.com/data', () => {
            return HttpResponse.json({ success: true })
          })
        )
      })

      it('should not call signedFetch and use regular fetch', async () => {
        const authenticatedFetch = createAuthenticatedFetch(mockWallet, true)

        const response = await authenticatedFetch('https://api.example.com/data')

        expect(mockSignedFetchLib).not.toHaveBeenCalled()
        expect(response.ok).toBe(true)
      })
    })

    describe('when user is not signed in', () => {
      beforeEach(() => {
        server.use(
          http.get('https://api.example.com/data', () => {
            return HttpResponse.json({ success: true })
          })
        )
      })

      it('should not call signedFetch and use regular fetch', async () => {
        const authenticatedFetch = createAuthenticatedFetch(mockWallet, false)

        const response = await authenticatedFetch('https://api.example.com/data')

        expect(mockSignedFetchLib).not.toHaveBeenCalled()
        expect(response.ok).toBe(true)
      })
    })

    describe('when wallet is undefined', () => {
      beforeEach(() => {
        server.use(
          http.get('https://api.example.com/data', () => {
            return HttpResponse.json({ success: true })
          })
        )
      })

      it('should not call signedFetch and use regular fetch', async () => {
        const authenticatedFetch = createAuthenticatedFetch(undefined, true)

        const response = await authenticatedFetch('https://api.example.com/data')

        expect(mockSignedFetchLib).not.toHaveBeenCalled()
        expect(response.ok).toBe(true)
      })
    })

    describe('when signedFetch throws an error', () => {
      beforeEach(() => {
        mockGetIdentity.mockResolvedValue(mockValidIdentity)
        mockSignedFetchLib.mockImplementation(() => Promise.reject(new Error('Signing failed')))
        server.use(
          http.get('https://api.example.com/data', () => {
            return HttpResponse.json({ fallback: true })
          })
        )
      })

      it('should fall back to regular fetch without throwing', async () => {
        const authenticatedFetch = createAuthenticatedFetch(mockWallet, true)

        const response = await authenticatedFetch('https://api.example.com/data')

        expect(response.ok).toBe(true)
        const data = await response.json()
        expect(data).toEqual({ fallback: true })
      })
    })
  })
})

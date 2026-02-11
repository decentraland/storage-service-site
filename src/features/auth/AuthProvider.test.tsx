import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChainId } from '@dcl/schemas'
import type { Avatar } from '@dcl/schemas'
import { AuthProvider, useAuth } from './AuthProvider'

const mockTryPreviousConnection = vi.fn()
const mockDisconnect = vi.fn()
const mockGetProvider = vi.fn()

vi.mock('decentraland-connect', () => ({
  connection: {
    tryPreviousConnection: () => mockTryPreviousConnection(),
    disconnect: () => mockDisconnect(),
    getProvider: () => mockGetProvider()
  }
}))

const mockGetIdentity = vi.fn()
const mockClearIdentity = vi.fn()

vi.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: (address: string) => mockGetIdentity(address),
  localStorageClearIdentity: (address: string) => mockClearIdentity(address)
}))

const VALID_IDENTITY = { expiration: new Date(Date.now() + 86400000).toISOString() }
const LAST_WALLET_KEY = 'dcl-storage-ui-last-wallet'

const TestConsumer = () => {
  const { wallet, isSignedIn, isConnecting, signIn, signOut } = useAuth()
  return (
    <div>
      <span data-testid="wallet">{wallet ?? 'none'}</span>
      <span data-testid="isSignedIn">{String(isSignedIn)}</span>
      <span data-testid="isConnecting">{String(isConnecting)}</span>
      <button type="button" onClick={signIn} aria-label="Sign in">
        Sign in
      </button>
      <button type="button" onClick={signOut} aria-label="Sign out">
        Sign out
      </button>
    </div>
  )
}

const renderWithAuth = (overrides: { fetchAvatar?: (address: string) => Promise<Avatar | undefined> } = {}) => {
  const authConfig = {
    authUrl: '/auth',
    basePath: '/storage',
    defaultChainId: ChainId.ETHEREUM_MAINNET,
    fetchAvatar: undefined,
    ...overrides
  }
  return render(
    <MemoryRouter>
      <AuthProvider config={authConfig}>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('when tryPreviousConnection succeeds with account', () => {
    beforeEach(() => {
      mockTryPreviousConnection.mockResolvedValue({
        account: '0xconnected',
        chainId: ChainId.ETHEREUM_MAINNET,
        provider: null
      })
      mockGetIdentity.mockReturnValue(VALID_IDENTITY)
    })

    it('should set wallet and isSignedIn', async () => {
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('isConnecting').textContent).toBe('false')
      })

      expect(screen.getByTestId('wallet').textContent).toBe('0xconnected')
      expect(screen.getByTestId('isSignedIn').textContent).toBe('true')
    })
  })

  describe('when tryPreviousConnection throws', () => {
    beforeEach(() => {
      mockTryPreviousConnection.mockRejectedValue(new Error('Could not find a valid provider'))
      window.localStorage.setItem(LAST_WALLET_KEY, '0xrecovered')
      mockGetIdentity.mockImplementation((address: string) => {
        if (address === '0xrecovered') return VALID_IDENTITY
        return null
      })
    })

    it('should recover wallet and isSignedIn from last wallet and valid identity', async () => {
      renderWithAuth()

      await waitFor(
        () => {
          expect(screen.getByTestId('isConnecting').textContent).toBe('false')
          expect(screen.getByTestId('wallet').textContent).toBe('0xrecovered')
          expect(screen.getByTestId('isSignedIn').textContent).toBe('true')
        },
        { timeout: 3000 }
      )
    })
  })

  describe('when tryPreviousConnection returns no account', () => {
    beforeEach(() => {
      mockTryPreviousConnection.mockResolvedValue({
        account: null,
        chainId: ChainId.ETHEREUM_MAINNET,
        provider: null
      })
      window.localStorage.setItem(LAST_WALLET_KEY, '0xlast')
      mockGetIdentity.mockImplementation((address: string) => {
        if (address === '0xlast') return VALID_IDENTITY
        return null
      })
    })

    it('should recover wallet and isSignedIn from last wallet and valid identity', async () => {
      renderWithAuth()

      await waitFor(
        () => {
          expect(screen.getByTestId('isConnecting').textContent).toBe('false')
          expect(screen.getByTestId('wallet').textContent).toBe('0xlast')
          expect(screen.getByTestId('isSignedIn').textContent).toBe('true')
        },
        { timeout: 3000 }
      )
    })
  })

  describe('when the tab becomes visible', () => {
    it('should call tryPreviousConnection again', async () => {
      mockTryPreviousConnection.mockResolvedValue({
        account: null,
        chainId: ChainId.ETHEREUM_MAINNET,
        provider: null
      })
      mockGetIdentity.mockReturnValue(null)

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('isConnecting').textContent).toBe('false')
      })

      expect(mockTryPreviousConnection).toHaveBeenCalled()

      mockTryPreviousConnection.mockClear()
      document.dispatchEvent(new Event('visibilitychange'))
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })

      await waitFor(() => {
        expect(mockTryPreviousConnection).toHaveBeenCalled()
      })
    })
  })
})

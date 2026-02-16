import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { AppRoutes } from './routes'

// Mock useAuth for the SelectPage / AssetSelectorPage
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    wallet: '0xuser',
    isSignedIn: true,
    isConnecting: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    changeNetwork: vi.fn(),
    chainId: 1,
    avatar: undefined
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('AppRoutes', () => {
  describe('when navigating to the root route without params', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/' })
    })

    it('should redirect to /select', () => {
      expect(window.location.pathname).toBe('/select')
    })
  })

  describe('when navigating to the root route with realm param', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/?realm=test.dcl.eth' })
    })

    it('should redirect to /env with realm param', () => {
      expect(window.location.pathname).toBe('/env')
      expect(window.location.search).toContain('realm=test.dcl.eth')
    })
  })

  describe('when navigating to the root route with position param', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/?position=10,20' })
    })

    it('should redirect to /env with position param', () => {
      expect(window.location.pathname).toBe('/env')
      expect(window.location.search).toContain('position=10,20')
    })
  })

  describe('when navigating to the select route', () => {
    it('should render the asset selector page', async () => {
      renderWithProviders(<AppRoutes />, { route: '/select' })

      await waitFor(
        () => {
          expect(screen.getByRole('heading', { name: /select asset to manage/i })).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('when navigating to an unknown route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/unknown-route' })
    })

    it('should render the not found page', () => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  describe('when navigating to the env route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/env' })
    })

    it('should render the env page', async () => {
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /environment variables/i })).toBeInTheDocument()
      })
    })
  })

  describe('when navigating to the scene route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/scene' })
    })

    it('should render the scene page', async () => {
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scene storage/i })).toBeInTheDocument()
      })
    })
  })

  describe('when navigating to the players route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/players' })
    })

    it('should render the players page', async () => {
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /player storage/i })).toBeInTheDocument()
      })
    })
  })
})

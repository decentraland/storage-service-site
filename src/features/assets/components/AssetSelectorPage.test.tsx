import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { server } from '@/test/server'
import { renderWithProviders } from '@/test/utils'
import { AssetSelectorPage } from './AssetSelectorPage'

// Mock useAuth to provide wallet
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
  })
}))

// Mock useSignedFetch so requests are made with fetch and MSW can intercept
vi.mock('@/hooks/useSignedFetch', () => ({
  useSignedFetch: () => (url: string, init?: RequestInit) => fetch(url, init)
}))

describe('AssetSelectorPage', () => {
  describe('when loading', () => {
    it('should display loading indicator', () => {
      renderWithProviders(<AssetSelectorPage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when data is loaded', () => {
    it('should display the page title', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('Select Asset to Manage')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 15000)

    it('should display worlds section with DCL names', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      expect(screen.getByText('testscene.dcl.eth')).toBeInTheDocument()
    }, 15000)

    it('should display contributable domains', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('shared-world.dcl.eth')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 15000)

    it('should display lands section', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('My Parcel')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      expect(screen.getByText('My Estate')).toBeInTheDocument()
      expect(screen.getByText('Operated Parcel')).toBeInTheDocument()
    }, 15000)
  })

  describe('when clicking on a world', () => {
    it('should navigate to storage page with realm param', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      await user.click(screen.getByRole('button', { name: /select myworld\.dcl\.eth/i }))

      expect(window.location.search).toContain('realm=myworld.dcl.eth')
    }, 15000)
  })

  describe('when clicking on a land', () => {
    it('should navigate to storage page with position param', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('My Parcel')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      await user.click(screen.getByRole('button', { name: /select my parcel/i }))

      expect(window.location.search).toContain('position=10,20')
    }, 15000)
  })

  describe('when user has no assets', () => {
    it('should display empty state messages', async () => {
      // Override handlers to return empty data
      server.use(
        http.post(config.get('LAND_MANAGER_SUBGRAPH'), () =>
          HttpResponse.json({
            data: {
              ownerParcels: [],
              ownerEstates: [],
              updateOperatorParcels: [],
              updateOperatorEstates: [],
              tenantParcels: [],
              tenantEstates: [],
              lessorParcels: [],
              lessorEstates: [],
              ownerAuthorizations: [],
              operatorAuthorizations: []
            }
          })
        ),
        http.post(config.get('MARKETPLACE_SUBGRAPH'), () => HttpResponse.json({ data: { nfts: [] } })),
        http.get(`${config.get('WORLDS_CONTENT_SERVER_URL')}/wallet/contribute`, () => HttpResponse.json({ domains: [] }))
      )

      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('No worlds found')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      expect(screen.getByText('No lands found')).toBeInTheDocument()
    }, 15000)
  })
})

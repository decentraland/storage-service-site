import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { server } from '@/test/server'
import { renderWithProviders } from '@/test/utils'
import { AssetSelectorPage } from './AssetSelectorPage'

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

const waitForPageLoaded = async () => {
  await waitFor(
    () => {
      expect(screen.getByText('Select Asset to Manage')).toBeInTheDocument()
    },
    { timeout: 3000 }
  )
}

const clickLandsTab = async (user?: ReturnType<typeof userEvent.setup>) => {
  const u = user ?? userEvent.setup()
  await u.click(screen.getByRole('tab', { name: /lands/i }))
}

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

      await waitForPageLoaded()
    })

    it('should display tabs with item counts', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()

      expect(screen.getByRole('tab', { name: /worlds \(3\)/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /lands \(3\)/i })).toBeInTheDocument()
    })

    it('should display worlds in the default tab with DCL names', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      expect(screen.getByText('testscene.dcl.eth')).toBeInTheDocument()
    })

    it('should display contributable domains', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('shared-world.dcl.eth')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it('should display lands when switching to the Lands tab', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()
      await clickLandsTab()

      expect(screen.getByText('My Parcel')).toBeInTheDocument()
      expect(screen.getByText('My Estate')).toBeInTheDocument()
      expect(screen.getByText('Operated Parcel')).toBeInTheDocument()
    })
  })

  describe('when switching tabs', () => {
    it('should hide worlds and show lands when clicking the Lands tab', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()

      expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()

      await clickLandsTab()

      expect(screen.queryByText('myworld.dcl.eth')).not.toBeInTheDocument()
      expect(screen.getByText('My Parcel')).toBeInTheDocument()
    })

    it('should hide lands and show worlds when clicking back to the Worlds tab', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()
      await clickLandsTab()

      expect(screen.getByText('My Parcel')).toBeInTheDocument()

      await user.click(screen.getByRole('tab', { name: /worlds/i }))

      expect(screen.queryByText('My Parcel')).not.toBeInTheDocument()
      expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
    })
  })

  describe('when searching worlds', () => {
    it('should filter worlds by name', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()

      const searchInput = screen.getByLabelText(/search worlds/i)
      await user.type(searchInput, 'myworld')

      await waitFor(() => {
        expect(screen.queryByText('testscene.dcl.eth')).not.toBeInTheDocument()
      })

      expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
      expect(screen.queryByText('shared-world.dcl.eth')).not.toBeInTheDocument()
    })

    it('should show no search results message when no worlds match', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()

      const searchInput = screen.getByLabelText(/search worlds/i)
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText(/no results for "nonexistent"/i)).toBeInTheDocument()
      })
    })

    it('should clear search when clicking the clear button', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()

      const searchInput = screen.getByLabelText(/search worlds/i)
      await user.type(searchInput, 'myworld')

      await waitFor(() => {
        expect(screen.queryByText('testscene.dcl.eth')).not.toBeInTheDocument()
      })

      const clearButton = screen.getByLabelText(/clear search/i)
      await user.click(clearButton)

      await waitFor(() => {
        expect(screen.getByText('testscene.dcl.eth')).toBeInTheDocument()
      })

      expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
      expect(screen.getByText('shared-world.dcl.eth')).toBeInTheDocument()
    })
  })

  describe('when searching lands', () => {
    it('should filter lands by name', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()
      await clickLandsTab(user)

      const searchInput = screen.getByLabelText(/search lands/i)
      await user.type(searchInput, 'My Parcel')

      await waitFor(() => {
        expect(screen.queryByText('My Estate')).not.toBeInTheDocument()
      })

      expect(screen.getByText('My Parcel')).toBeInTheDocument()
    })

    it('should filter lands by position', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()
      await clickLandsTab(user)

      const searchInput = screen.getByLabelText(/search lands/i)
      await user.type(searchInput, '30,40')

      await waitFor(() => {
        expect(screen.queryByText('My Parcel')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Operated Parcel')).toBeInTheDocument()
      expect(screen.queryByText('My Estate')).not.toBeInTheDocument()
    })

    it('should filter lands by type', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()
      await clickLandsTab(user)

      const searchInput = screen.getByLabelText(/search lands/i)
      await user.type(searchInput, 'estate')

      await waitFor(() => {
        expect(screen.queryByText('My Parcel')).not.toBeInTheDocument()
      })

      expect(screen.getByText('My Estate')).toBeInTheDocument()
      expect(screen.queryByText('Operated Parcel')).not.toBeInTheDocument()
    })

    it('should show no search results message when no lands match', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()
      await clickLandsTab(user)

      const searchInput = screen.getByLabelText(/search lands/i)
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText(/no results for "nonexistent"/i)).toBeInTheDocument()
      })
    })
  })

  describe('when clicking on a world', () => {
    it('should navigate to storage page with realm and position params', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Wait for scenes to load so the EDIT button has a position
      await waitFor(
        () => {
          expect(screen.getAllByRole('button', { name: /edit/i }).length).toBeGreaterThan(0)
        },
        { timeout: 3000 }
      )

      // Click the first EDIT button (for myworld.dcl.eth which is first alphabetically)
      await user.click(screen.getAllByRole('button', { name: /^edit$/i })[0])

      expect(window.location.search).toContain('realm=myworld.dcl.eth')
      expect(window.location.search).toContain('position=')
    })
  })

  describe('when clicking on a land', () => {
    it('should navigate to storage page with position param', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AssetSelectorPage />)

      await waitForPageLoaded()
      await clickLandsTab(user)

      await user.click(screen.getByRole('button', { name: /select my parcel/i }))

      expect(window.location.search).toContain('position=10,20')
    })
  })

  describe('when user has no assets', () => {
    beforeEach(() => {
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
    })

    it('should display empty state for worlds', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('No worlds found')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it('should display empty state for lands', async () => {
      renderWithProviders(<AssetSelectorPage />)

      await waitFor(
        () => {
          expect(screen.getByText('Select Asset to Manage')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      await clickLandsTab()

      expect(screen.getByText('No lands found')).toBeInTheDocument()
    })
  })
})

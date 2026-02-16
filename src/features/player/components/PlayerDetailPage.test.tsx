import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { resetStorageApiStores } from '@/test/handlers'
import { renderWithProviders } from '@/test/utils'
import { PlayerDetailPage } from './PlayerDetailPage'

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ wallet: '0xtest', isSignedIn: true })
}))

vi.mock('@dcl/single-sign-on-client', () => ({
  getIdentity: vi.fn().mockResolvedValue({
    expiration: new Date(Date.now() + 86400000),
    authChain: []
  })
}))

vi.mock('decentraland-crypto-fetch', () => ({
  default: (url: string, init: Record<string, unknown> = {}) => {
    const { identity, metadata, ...fetchInit } = init
    return fetch(url, fetchInit as RequestInit)
  }
}))

describe('PlayerDetailPage', () => {
  beforeEach(() => {
    resetStorageApiStores()
  })

  describe('when viewing a player detail', () => {
    it('should show player keys and back button', async () => {
      renderWithProviders(<PlayerDetailPage address="0xplayer1" />, { route: '/players/0xplayer1' })

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 20000 }
      )
      expect(screen.getByText('progress')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /back to players/i })).toBeInTheDocument()
    }, 45000)

    it('should show add and clear this player buttons', async () => {
      renderWithProviders(<PlayerDetailPage address="0xplayer1" />, { route: '/players/0xplayer1' })

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 20000 }
      )

      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear storage for 0xplayer1/i })).toBeInTheDocument()
    }, 45000)

    it('should not show clear all players button', async () => {
      renderWithProviders(<PlayerDetailPage address="0xplayer1" />, { route: '/players/0xplayer1' })

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 20000 }
      )

      expect(screen.queryByRole('button', { name: /clear all players/i })).not.toBeInTheDocument()
    }, 45000)
  })

  describe('when adding a new value from detail view', () => {
    it('should pre-fill the address and disable it', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerDetailPage address="0xplayer1" />, { route: '/players/0xplayer1' })

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 20000 }
      )

      await user.click(screen.getByRole('button', { name: 'Add' }))

      const dialog = screen.getByRole('dialog')
      const addressField: HTMLInputElement = within(dialog).getByLabelText(/player address/i)
      expect(addressField.value).toBe('0xplayer1')
      expect(addressField).toBeDisabled()
    }, 45000)
  })

  describe('when clearing a player', () => {
    it('should show confirm dialog', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerDetailPage address="0xplayer1" />, { route: '/players/0xplayer1' })

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 20000 }
      )

      await user.click(screen.getByRole('button', { name: /clear storage for 0xplayer1/i }))

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText(/0xplayer1/i)).toBeInTheDocument()
    }, 45000)
  })
})

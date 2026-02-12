import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { resetStorageApiStores } from '@/test/handlers'
import { renderWithProviders } from '@/test/utils'
import { PlayerPage } from './PlayerPage'

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

describe('PlayerPage', () => {
  beforeEach(() => {
    resetStorageApiStores()
  })

  describe('when no address is loaded', () => {
    it('should show address input and Load keys button', () => {
      renderWithProviders(<PlayerPage />)

      expect(screen.getByLabelText(/player address/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /load keys/i })).toBeInTheDocument()
      expect(screen.getByText(/enter a player address/i)).toBeInTheDocument()
    })

    it('should display keys for address after loading', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerPage />)

      await user.type(screen.getByLabelText(/player address/i), '0xplayer1')
      await user.click(screen.getByRole('button', { name: /load keys/i }))

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      expect(screen.getByText('progress')).toBeInTheDocument()
    }, 15000)
  })

  describe('when keys are loaded for an address', () => {
    it('should show player keys', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerPage />)

      await user.type(screen.getByLabelText(/player address/i), '0xplayer1')
      await user.click(screen.getByRole('button', { name: /load keys/i }))

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      expect(screen.getByText('progress')).toBeInTheDocument()
    }, 15000)
  })

  describe('when editing a player value', () => {
    it('should show editable value in a dialog when clicking edit', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerPage />)

      await user.type(screen.getByLabelText(/player address/i), '0xplayer1')
      await user.click(screen.getByRole('button', { name: /load keys/i }))

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      const editButton = screen.getByRole('button', { name: /edit inventory/i })
      await user.click(editButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      await waitFor(
        () => {
          expect(within(dialog).getByLabelText(/value \(json\)/i)).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 15000)
  })

  describe('when adding a new player value', () => {
    it('should show a form to add new value', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerPage />)

      const addButton = screen.getByRole('button', { name: /add/i })
      await user.click(addButton)

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByLabelText(/player address/i)).toBeInTheDocument()
      expect(within(dialog).getByLabelText(/key/i)).toBeInTheDocument()
      expect(within(dialog).getByLabelText(/value/i)).toBeInTheDocument()
    })

    it('should add a new value after submitting the form', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerPage />)

      await user.click(screen.getByRole('button', { name: /add/i }))

      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByLabelText(/player address/i), '0xp1')
      await user.type(within(dialog).getByLabelText(/^key$/i), 'k1')
      await user.type(within(dialog).getByLabelText(/value \(json\)/i), '1')

      await user.click(within(dialog).getByRole('button', { name: /save/i }))

      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        },
        { timeout: 15000 }
      )
    }, 45000)
  })

  describe('when deleting a player value', () => {
    it('should show confirmation dialog and delete on confirm', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerPage />)

      await user.type(screen.getByLabelText(/player address/i), '0xplayer1')
      await user.click(screen.getByRole('button', { name: /load keys/i }))

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      const deleteButton = screen.getByRole('button', { name: /delete inventory/i })
      await user.click(deleteButton)

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 15000)
  })

  describe('when clearing all players', () => {
    it('should show clear all button', () => {
      renderWithProviders(<PlayerPage />)

      expect(screen.getByRole('button', { name: /clear all players/i })).toBeInTheDocument()
    })

    it('should show confirm dialog and complete on confirm', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<PlayerPage />)

      await user.click(screen.getByRole('button', { name: /clear all players/i }))

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText(/delete ALL player storage/i)).toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    })
  })
})

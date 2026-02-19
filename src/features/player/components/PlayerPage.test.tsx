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

  describe('when loading the page', () => {
    it('should show the title and action buttons', () => {
      renderWithProviders(<PlayerPage />)

      expect(screen.getByText(/player storage/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear all players/i })).toBeInTheDocument()
    })

    it('should display player cards after loading', async () => {
      renderWithProviders(<PlayerPage />)

      await waitFor(
        () => {
          expect(screen.getByLabelText(/view storage for 0xplayer1/i)).toBeInTheDocument()
        },
        { timeout: 20000 }
      )
      expect(screen.getByLabelText(/view storage for 0xplayer2/i)).toBeInTheDocument()
    }, 45000)
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
    }, 45000)
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

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 20000 })
    }, 45000)
  })
})

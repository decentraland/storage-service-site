import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { resetStorageApiStores } from '@/test/handlers'
import { renderWithProviders } from '@/test/utils'
import { PlayerPage } from './PlayerPage'

describe('PlayerPage', () => {
  beforeEach(() => {
    resetStorageApiStores()
  })

  describe('when loading players', () => {
    it('should show loading state initially', () => {
      renderWithProviders(<PlayerPage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should display player addresses after loading', async () => {
      renderWithProviders(<PlayerPage />)

      await waitFor(() => {
        expect(screen.getByText('0xplayer1')).toBeInTheDocument()
      })

      expect(screen.getByText('0xplayer2')).toBeInTheDocument()
    })
  })

  describe('when selecting a player', () => {
    it('should show player keys', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PlayerPage />)

      await waitFor(() => {
        expect(screen.getByText('0xplayer1')).toBeInTheDocument()
      })

      // Click to select the player
      await user.click(screen.getByRole('button', { name: /select 0xplayer1/i }))

      // Should show keys for that player
      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      expect(screen.getByText('progress')).toBeInTheDocument()
    }, 15000)
  })

  describe('when viewing a player value', () => {
    it('should show value in a dialog when clicking view', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PlayerPage />)

      await waitFor(() => {
        expect(screen.getByText('0xplayer1')).toBeInTheDocument()
      })

      // Select the player
      await user.click(screen.getByRole('button', { name: /select 0xplayer1/i }))

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      // Click view button for inventory
      const viewButton = screen.getByRole('button', { name: /view inventory/i })
      await user.click(viewButton)

      // Should show dialog with JSON value
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByText(/sword/i)).toBeInTheDocument()
    }, 15000)
  })

  describe('when adding a new player value', () => {
    it('should show a form to add new value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PlayerPage />)

      await waitFor(() => {
        expect(screen.getByText('0xplayer1')).toBeInTheDocument()
      })

      // Find the add button and click it
      const addButton = screen.getByRole('button', { name: /add/i })
      await user.click(addButton)

      // Should show a dialog with form fields
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByLabelText(/player address/i)).toBeInTheDocument()
      expect(within(dialog).getByLabelText(/key/i)).toBeInTheDocument()
      expect(within(dialog).getByLabelText(/value/i)).toBeInTheDocument()
    })

    it('should add a new value after submitting the form', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PlayerPage />)

      await waitFor(() => {
        expect(screen.getByText('0xplayer1')).toBeInTheDocument()
      })

      // Open add dialog
      await user.click(screen.getByRole('button', { name: /add/i }))

      // Get the dialog and fill the form - use short values to reduce typing time
      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByLabelText(/player address/i), '0xp1')
      await user.type(within(dialog).getByLabelText(/^key$/i), 'k1')
      await user.type(within(dialog).getByLabelText(/value \(json\)/i), '1')

      // Submit
      await user.click(within(dialog).getByRole('button', { name: /save/i }))

      // Dialog should close
      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 30000)
  })

  describe('when deleting a player value', () => {
    it('should show confirmation dialog and delete on confirm', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PlayerPage />)

      await waitFor(() => {
        expect(screen.getByText('0xplayer1')).toBeInTheDocument()
      })

      // Select the player
      await user.click(screen.getByRole('button', { name: /select 0xplayer1/i }))

      await waitFor(
        () => {
          expect(screen.getByText('inventory')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      // Click delete button for inventory
      const deleteButton = screen.getByRole('button', { name: /delete inventory/i })
      await user.click(deleteButton)

      // Confirm deletion in dialog
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    }, 15000)
  })

  describe('when clearing all players', () => {
    it('should show clear all button', async () => {
      renderWithProviders(<PlayerPage />)

      await waitFor(() => {
        expect(screen.getByText('0xplayer1')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /clear all players/i })).toBeInTheDocument()
    })

    it('should remove all players after confirming clear all', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PlayerPage />)

      await waitFor(() => {
        expect(screen.getByText('0xplayer1')).toBeInTheDocument()
      })

      // Click clear all
      await user.click(screen.getByRole('button', { name: /clear all players/i }))

      // Confirm in dialog
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      // Should show empty state
      await waitFor(() => {
        expect(screen.queryByText('0xplayer1')).not.toBeInTheDocument()
        expect(screen.queryByText('0xplayer2')).not.toBeInTheDocument()
      })

      expect(screen.getByText(/no players found/i)).toBeInTheDocument()
    })
  })
})

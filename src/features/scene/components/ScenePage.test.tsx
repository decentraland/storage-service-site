import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { resetStorageApiStores } from '@/test/handlers'
import { renderWithProviders } from '@/test/utils'
import { ScenePage } from './ScenePage'

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ wallet: '0xtest', isSignedIn: true })
}))

describe('ScenePage', () => {
  beforeEach(() => {
    resetStorageApiStores()
  })

  describe('when loading scene keys', () => {
    it('should show loading state initially', () => {
      renderWithProviders(<ScenePage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should display scene keys in a table after loading', async () => {
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      expect(screen.getByText('gameState')).toBeInTheDocument()
    })
  })

  describe('when editing a value', () => {
    it('should show edit button for each row', async () => {
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should show editable value in a dialog when clicking edit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      // Click edit button for leaderboard
      const editButton = screen.getByRole('button', { name: /edit leaderboard/i })
      await user.click(editButton)

      // Should show dialog with editable JSON value
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      await waitFor(() => {
        expect(within(dialog).getByLabelText(/value \(json\)/i)).toBeInTheDocument()
      })
    })
  })

  describe('when setting a new value', () => {
    it('should show a form to add new value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      // Find the add button and click it
      const addButton = screen.getByRole('button', { name: /add/i })
      expect(addButton).toBeInTheDocument()

      await user.click(addButton)

      // Should show a dialog with form fields
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByLabelText(/key/i)).toBeInTheDocument()
      expect(within(dialog).getByLabelText(/value/i)).toBeInTheDocument()
    })

    it('should add a new key after submitting the form', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      // Open add dialog
      await user.click(screen.getByRole('button', { name: /add/i }))

      // Get the dialog and fill the form
      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByLabelText(/key/i), 'newKey')
      // Use a simpler JSON value without special characters that might be escaped
      await user.type(within(dialog).getByLabelText(/value \(json\)/i), '123')

      // Submit
      await user.click(within(dialog).getByRole('button', { name: /save/i }))

      // Should show the new key in the table
      await waitFor(
        () => {
          expect(screen.getByText('newKey')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 15000)
  })

  describe('when deleting a value', () => {
    it('should show delete button for each row', async () => {
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('should remove the key after confirming delete', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      // Find the delete button for leaderboard
      const deleteButton = screen.getByRole('button', { name: /delete leaderboard/i })
      await user.click(deleteButton)

      // Confirm deletion in dialog
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      // Should no longer show leaderboard
      await waitFor(() => {
        expect(screen.queryByText('leaderboard')).not.toBeInTheDocument()
      })
    })
  })

  describe('when clearing all values', () => {
    it('should show clear all button', async () => {
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
    })

    it('should remove all keys after confirming clear all', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ScenePage />)

      await waitFor(() => {
        expect(screen.getByText('leaderboard')).toBeInTheDocument()
      })

      // Click clear all
      await user.click(screen.getByRole('button', { name: /clear all/i }))

      // Confirm in dialog
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      // Should show empty state
      await waitFor(() => {
        expect(screen.queryByText('leaderboard')).not.toBeInTheDocument()
        expect(screen.queryByText('gameState')).not.toBeInTheDocument()
      })

      expect(screen.getByText(/no scene values/i)).toBeInTheDocument()
    })
  })
})

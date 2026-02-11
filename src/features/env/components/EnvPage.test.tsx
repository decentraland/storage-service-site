import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { resetStorageApiStores } from '@/test/handlers'
import { renderWithProviders } from '@/test/utils'
import { EnvPage } from './EnvPage'

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ wallet: '0xtest', isSignedIn: true })
}))

describe('EnvPage', () => {
  beforeEach(() => {
    resetStorageApiStores()
  })

  describe('when loading env keys', () => {
    it('should show loading state initially', () => {
      renderWithProviders(<EnvPage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should display env keys in a table after loading', async () => {
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
      })

      expect(screen.getByText('DATABASE_URL')).toBeInTheDocument()
    })
  })

  describe('when editing an env value', () => {
    it('should show edit button for each row', async () => {
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should show editable value in a dialog when clicking edit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /edit API_KEY/i })
      await user.click(editButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      // Should show the key as read-only and value as editable
      await waitFor(() => {
        expect(within(dialog).getByLabelText(/value/i)).toBeInTheDocument()
      })
    })
  })

  describe('when setting a new env value', () => {
    it('should show a form to add new env', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
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

    it('should add a new env key after submitting the form', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
      })

      // Open add dialog
      await user.click(screen.getByRole('button', { name: /add/i }))

      // Get the dialog and fill the form
      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByLabelText(/key/i), 'NEW_KEY')
      await user.type(within(dialog).getByLabelText(/value/i), 'new-value')

      // Submit
      await user.click(within(dialog).getByRole('button', { name: /save/i }))

      // Should show the new key in the table
      await waitFor(() => {
        expect(screen.getByText('NEW_KEY')).toBeInTheDocument()
      })
    })
  })

  describe('when deleting an env value', () => {
    it('should show delete button for each row', async () => {
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('should remove the env key after confirming delete', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
      })

      // Find the delete button for API_KEY
      const deleteButton = screen.getByRole('button', { name: /delete API_KEY/i })
      await user.click(deleteButton)

      // Confirm deletion in dialog
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      // Should no longer show API_KEY
      await waitFor(() => {
        expect(screen.queryByText('API_KEY')).not.toBeInTheDocument()
      })
    })
  })

  describe('when clearing all env values', () => {
    it('should show clear all button', async () => {
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
    })

    it('should remove all env keys after confirming clear all', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EnvPage />)

      await waitFor(() => {
        expect(screen.getByText('API_KEY')).toBeInTheDocument()
      })

      // Click clear all
      await user.click(screen.getByRole('button', { name: /clear all/i }))

      // Confirm in dialog
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      // Should show empty state
      await waitFor(() => {
        expect(screen.queryByText('API_KEY')).not.toBeInTheDocument()
        expect(screen.queryByText('DATABASE_URL')).not.toBeInTheDocument()
      })

      expect(screen.getByText(/no environment variables/i)).toBeInTheDocument()
    })
  })
})

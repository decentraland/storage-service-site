import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { envClient } from '@/features/env'
import { resetStorageApiStores } from '@/test/handlers'
import { renderWithProviders } from '@/test/utils'
import { EnvPage } from './EnvPage'

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

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      expect(screen.getByText('DATABASE_URL')).toBeInTheDocument()
    })
  })

  describe('when editing an env value', () => {
    it('should show edit button for each row', async () => {
      renderWithProviders(<EnvPage />)

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should show editable value in a dialog when clicking edit', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<EnvPage />)

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const editButton = screen.getByRole('button', { name: /edit API_KEY/i })
      await user.click(editButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      // Should show the key as read-only and value as editable
      await waitFor(
        () => {
          expect(within(dialog).getByLabelText(/value/i)).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('when setting a new env value', () => {
    it('should show a form to add new env', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<EnvPage />)

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

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
      const user = userEvent.setup({ delay: null })
      const { store, rerender } = renderWithProviders(<EnvPage />)

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Open add dialog
      await user.click(screen.getByRole('button', { name: /add/i }))

      // Get the dialog and fill the form
      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByLabelText(/key/i), 'NEW_KEY')
      await user.type(within(dialog).getByLabelText(/value/i), 'new-value')

      // Submit
      await user.click(within(dialog).getByRole('button', { name: /save/i }))

      // Wait for dialog to close (mutation completed)
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 5000 })

      // Force refetch to get fresh data after mutation
      await act(async () => {
        await store
          .dispatch(
            envClient.endpoints.listEnvKeys.initiate(
              { wallet: '0xtest', isSignedIn: true, realm: null, position: null },
              { forceRefetch: true }
            )
          )
          .unwrap()
      })

      rerender(<EnvPage />)

      expect(screen.getByText('NEW_KEY')).toBeInTheDocument()
    }, 20000)
  })

  describe('when deleting an env value', () => {
    it('should show delete button for each row', async () => {
      renderWithProviders(<EnvPage />)

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('should remove the env key after confirming delete', async () => {
      const user = userEvent.setup({ delay: null })
      const { store, rerender } = renderWithProviders(<EnvPage />)

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Find the delete button for API_KEY
      const deleteButton = screen.getByRole('button', { name: /delete API_KEY/i })
      await user.click(deleteButton)

      // Confirm deletion in dialog
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      // Wait for dialog to close (mutation completed)
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 5000 })

      // Force refetch to get fresh data after mutation
      await act(async () => {
        await store
          .dispatch(
            envClient.endpoints.listEnvKeys.initiate(
              { wallet: '0xtest', isSignedIn: true, realm: null, position: null },
              { forceRefetch: true }
            )
          )
          .unwrap()
      })

      rerender(<EnvPage />)

      expect(screen.queryByText('API_KEY')).not.toBeInTheDocument()
    }, 20000)
  })

  describe('when clearing all env values', () => {
    it('should show clear all button', async () => {
      renderWithProviders(<EnvPage />)

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
    })

    it('should remove all env keys after confirming clear all', async () => {
      const user = userEvent.setup({ delay: null })
      const { store, rerender } = renderWithProviders(<EnvPage />)

      await waitFor(
        () => {
          expect(screen.getByText('API_KEY')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Click clear all
      await user.click(screen.getByRole('button', { name: /clear all/i }))

      // Confirm in dialog
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      // Wait for dialog to close (mutation completed)
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 5000 })

      // Force refetch to get fresh data after mutation
      await act(async () => {
        await store
          .dispatch(
            envClient.endpoints.listEnvKeys.initiate(
              { wallet: '0xtest', isSignedIn: true, realm: null, position: null },
              { forceRefetch: true }
            )
          )
          .unwrap()
      })

      rerender(<EnvPage />)

      expect(screen.queryByText('API_KEY')).not.toBeInTheDocument()
      expect(screen.queryByText('DATABASE_URL')).not.toBeInTheDocument()
      expect(screen.getByText(/no environment variables/i)).toBeInTheDocument()
    }, 20000)
  })
})

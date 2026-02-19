import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { sceneClient } from '@/features/scene'
import { resetStorageApiStores } from '@/test/handlers'
import { renderWithProviders } from '@/test/utils'
import { ScenePage } from './ScenePage'

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

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      expect(screen.getByText('gameState')).toBeInTheDocument()
    }, 45000)
  })

  describe('when editing a value', () => {
    it('should show edit button for each row', async () => {
      renderWithProviders(<ScenePage />)

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      expect(editButtons.length).toBeGreaterThan(0)
    }, 45000)

    it('should show editable value in a dialog when clicking edit', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<ScenePage />)

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      const editButton = screen.getByRole('button', { name: /edit leaderboard/i })
      await user.click(editButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      await waitFor(() => expect(within(dialog).getByLabelText(/value/i)).toBeInTheDocument(), { timeout: 20000 })
    }, 45000)
  })

  describe('when setting a new value', () => {
    it('should show a form to add new value', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<ScenePage />)

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      const addButton = screen.getByRole('button', { name: /add/i })
      expect(addButton).toBeInTheDocument()

      await user.click(addButton)

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByLabelText(/key/i)).toBeInTheDocument()
      expect(within(dialog).getByLabelText(/value/i)).toBeInTheDocument()
    }, 45000)

    it('should add a new key after submitting the form', async () => {
      const user = userEvent.setup({ delay: null })
      const { store, rerender } = renderWithProviders(<ScenePage />)

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      await user.click(screen.getByRole('button', { name: /add/i }))

      // Get the dialog and fill the form
      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByLabelText(/key/i), 'newKey')
      // Use a simpler JSON value without special characters that might be escaped
      await user.type(within(dialog).getByLabelText(/value/i), '123')

      // Submit
      await user.click(within(dialog).getByRole('button', { name: /save/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 20000 })

      // Force refetch to get fresh data after mutation
      await act(async () => {
        await store
          .dispatch(sceneClient.endpoints.listSceneKeys.initiate({ wallet: '0xtest', isSignedIn: true }, { forceRefetch: true }))
          .unwrap()
      })

      rerender(<ScenePage />)

      expect(screen.getByText('newKey')).toBeInTheDocument()
    }, 45000)
  })

  describe('when deleting a value', () => {
    it('should show delete button for each row', async () => {
      renderWithProviders(<ScenePage />)

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      expect(deleteButtons.length).toBeGreaterThan(0)
    }, 45000)

    it('should remove the key after confirming delete', async () => {
      const user = userEvent.setup({ delay: null })
      const { store, rerender } = renderWithProviders(<ScenePage />)

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      const deleteButton = screen.getByRole('button', { name: /delete leaderboard/i })
      await user.click(deleteButton)

      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 20000 })

      await act(async () => {
        await store
          .dispatch(
            sceneClient.endpoints.listSceneKeys.initiate(
              { wallet: '0xtest', isSignedIn: true, realm: null, position: null },
              { forceRefetch: true }
            )
          )
          .unwrap()
      })

      rerender(<ScenePage />)

      expect(screen.queryByText('leaderboard')).not.toBeInTheDocument()
    }, 45000)
  })

  describe('when clearing all values', () => {
    it('should show clear all button', async () => {
      renderWithProviders(<ScenePage />)

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
    }, 45000)

    it('should remove all keys after confirming clear all', async () => {
      const user = userEvent.setup({ delay: null })
      const { store, rerender } = renderWithProviders(<ScenePage />)

      await waitFor(() => expect(screen.getByText('leaderboard')).toBeInTheDocument(), { timeout: 20000 })

      await user.click(screen.getByRole('button', { name: /clear all/i }))

      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /confirm/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 20000 })

      await act(async () => {
        await store
          .dispatch(
            sceneClient.endpoints.listSceneKeys.initiate(
              { wallet: '0xtest', isSignedIn: true, realm: null, position: null },
              { forceRefetch: true }
            )
          )
          .unwrap()
      })

      rerender(<ScenePage />)

      expect(screen.queryByText('leaderboard')).not.toBeInTheDocument()
      expect(screen.queryByText('gameState')).not.toBeInTheDocument()
      expect(screen.getByText(/no scene values/i)).toBeInTheDocument()
    }, 45000)
  })
})

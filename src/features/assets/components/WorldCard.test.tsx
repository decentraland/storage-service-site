import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import type { World } from '../assets.types'
import { WorldCard } from './WorldCard'

describe('WorldCard', () => {
  const mockOwnedWorld: World = {
    name: 'myworld.dcl.eth',
    role: 'owner'
  }

  const mockCollabWorld: World = {
    name: 'shared-world.dcl.eth',
    role: 'collaborator'
  }

  const mockSingleSceneWorld: World = {
    name: 'testscene.dcl.eth',
    role: 'owner'
  }

  describe('when rendering an owned world card', () => {
    it('should display the world name', async () => {
      renderWithProviders(<WorldCard world={mockOwnedWorld} onEditClick={vi.fn()} />)

      expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
    })

    it('should display the owner chip', async () => {
      renderWithProviders(<WorldCard world={mockOwnedWorld} onEditClick={vi.fn()} />)

      expect(screen.getByText('Owner')).toBeInTheDocument()
    })

    it('should display scene count after loading', async () => {
      renderWithProviders(<WorldCard world={mockOwnedWorld} onEditClick={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('2 scenes')).toBeInTheDocument()
      })
    })
  })

  describe('when rendering a collaborator world card', () => {
    it('should display the world name', () => {
      renderWithProviders(<WorldCard world={mockCollabWorld} onEditClick={vi.fn()} />)

      expect(screen.getByText('shared-world.dcl.eth')).toBeInTheDocument()
    })

    it('should display the collaborator chip', () => {
      renderWithProviders(<WorldCard world={mockCollabWorld} onEditClick={vi.fn()} />)

      expect(screen.getByText('Collaborator')).toBeInTheDocument()
    })
  })

  describe('when clicking the EDIT button', () => {
    it('should call onEditClick with world name and first scene position', async () => {
      const handleEditClick = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<WorldCard world={mockOwnedWorld} onEditClick={handleEditClick} />)

      await waitFor(() => {
        expect(screen.getByText('2 scenes')).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /edit/i })[0])

      expect(handleEditClick).toHaveBeenCalledWith('myworld.dcl.eth', '0,0')
    })
  })

  describe('when world has multiple scenes', () => {
    it('should show the chevron dropdown button', async () => {
      renderWithProviders(<WorldCard world={mockOwnedWorld} onEditClick={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /select scene/i })).toBeInTheDocument()
      })
    })

    it('should show scene titles in dropdown menu', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WorldCard world={mockOwnedWorld} onEditClick={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /select scene/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /select scene/i }))

      expect(screen.getByText('Scene Alpha')).toBeInTheDocument()
      expect(screen.getByText('Scene Beta')).toBeInTheDocument()
    })

    it('should call onEditClick with selected scene position', async () => {
      const handleEditClick = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<WorldCard world={mockOwnedWorld} onEditClick={handleEditClick} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /select scene/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /select scene/i }))
      await user.click(screen.getByText('Scene Beta'))

      expect(handleEditClick).toHaveBeenCalledWith('myworld.dcl.eth', '1,0')
    })
  })

  describe('when world has a single scene', () => {
    it('should not show the chevron dropdown button', async () => {
      renderWithProviders(<WorldCard world={mockSingleSceneWorld} onEditClick={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('1 scene')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /select scene/i })).not.toBeInTheDocument()
    })

    it('should call onEditClick with world name and scene position on EDIT click', async () => {
      const handleEditClick = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<WorldCard world={mockSingleSceneWorld} onEditClick={handleEditClick} />)

      await waitFor(() => {
        expect(screen.getByText('1 scene')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /edit/i }))

      expect(handleEditClick).toHaveBeenCalledWith('testscene.dcl.eth', '0,0')
    })
  })
})

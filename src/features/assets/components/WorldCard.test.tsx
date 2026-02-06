import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import type { World } from '../assets.types'
import { WorldCard } from './WorldCard'

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<DclThemeProvider theme={darkTheme}>{ui}</DclThemeProvider>)
}

describe('WorldCard', () => {
  const mockOwnedWorld: World = {
    name: 'myworld.dcl.eth',
    role: 'owner'
  }

  const mockCollabWorld: World = {
    name: 'shared-world.dcl.eth',
    role: 'collaborator'
  }

  describe('when rendering an owned world card', () => {
    it('should display the world name', () => {
      renderWithTheme(<WorldCard world={mockOwnedWorld} onClick={vi.fn()} />)

      expect(screen.getByText('myworld.dcl.eth')).toBeInTheDocument()
    })

    it('should display the owner chip', () => {
      renderWithTheme(<WorldCard world={mockOwnedWorld} onClick={vi.fn()} />)

      expect(screen.getByText('Owner')).toBeInTheDocument()
    })
  })

  describe('when rendering a collaborator world card', () => {
    it('should display the world name', () => {
      renderWithTheme(<WorldCard world={mockCollabWorld} onClick={vi.fn()} />)

      expect(screen.getByText('shared-world.dcl.eth')).toBeInTheDocument()
    })

    it('should display the collaborator chip', () => {
      renderWithTheme(<WorldCard world={mockCollabWorld} onClick={vi.fn()} />)

      expect(screen.getByText('Collaborator')).toBeInTheDocument()
    })
  })

  describe('when clicking the card', () => {
    it('should call onClick handler', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      renderWithTheme(<WorldCard world={mockOwnedWorld} onClick={handleClick} />)

      await user.click(screen.getByRole('button', { name: /select myworld\.dcl\.eth/i }))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TranslationProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import en from '@/intl/en.json'
import { LandType, RoleType } from '../assets.types'
import type { Land } from '../assets.types'
import { LandCard } from './LandCard'

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <TranslationProvider locale="en" translations={{ en }}>
      <DclThemeProvider theme={darkTheme}>{ui}</DclThemeProvider>
    </TranslationProvider>
  )
}

describe('LandCard', () => {
  const mockParcel: Land = {
    id: 'parcel-10-20',
    tokenId: '123',
    type: LandType.PARCEL,
    role: RoleType.OWNER,
    x: 10,
    y: 20,
    name: 'My Parcel',
    description: null,
    owner: '0xuser',
    operators: []
  }

  const mockEstate: Land = {
    id: 'estate-1',
    tokenId: '456',
    type: LandType.ESTATE,
    role: RoleType.OPERATOR,
    parcels: [
      { x: 5, y: 6, id: 'p1' },
      { x: 5, y: 7, id: 'p2' }
    ],
    size: 2,
    name: 'My Estate',
    description: 'An estate',
    owner: '0xother',
    operators: ['0xuser']
  }

  describe('when rendering a parcel card', () => {
    it('should display the parcel name', () => {
      renderWithTheme(<LandCard land={mockParcel} onClick={vi.fn()} />)

      expect(screen.getByText('My Parcel')).toBeInTheDocument()
    })

    it('should display the role chip', () => {
      renderWithTheme(<LandCard land={mockParcel} onClick={vi.fn()} />)

      expect(screen.getByText('Owner')).toBeInTheDocument()
    })
  })

  describe('when rendering an estate card', () => {
    it('should display the estate name', () => {
      renderWithTheme(<LandCard land={mockEstate} onClick={vi.fn()} />)

      expect(screen.getByText('My Estate')).toBeInTheDocument()
    })

    it('should display the operator role', () => {
      renderWithTheme(<LandCard land={mockEstate} onClick={vi.fn()} />)

      expect(screen.getByText('Operator')).toBeInTheDocument()
    })
  })

  describe('when clicking the card', () => {
    it('should call onClick handler', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      renderWithTheme(<LandCard land={mockParcel} onClick={handleClick} />)

      await user.click(screen.getByRole('button', { name: /select my parcel/i }))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})

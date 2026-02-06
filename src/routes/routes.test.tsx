import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { AppRoutes } from './routes'

describe('AppRoutes', () => {
  describe('when navigating to the home route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/' })
    })

    it('should render the home page', () => {
      expect(screen.getByText(/storage service/i)).toBeInTheDocument()
    })
  })

  describe('when navigating to an unknown route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/unknown-route' })
    })

    it('should render the not found page', () => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  describe('when navigating to the env route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/env' })
    })

    it('should render the env page', async () => {
      // Wait for loading to complete and heading to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /environment variables/i })).toBeInTheDocument()
      })
    })
  })

  describe('when navigating to the scene route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/scene' })
    })

    it('should render the scene page', async () => {
      // Wait for loading to complete and heading to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scene storage/i })).toBeInTheDocument()
      })
    })
  })

  describe('when navigating to the players route', () => {
    beforeEach(() => {
      renderWithProviders(<AppRoutes />, { route: '/players' })
    })

    it('should render the players page placeholder', () => {
      expect(screen.getByRole('heading', { name: /player storage/i })).toBeInTheDocument()
    })
  })
})

import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { ProtectedRoute } from './ProtectedRoute'

const mockUseAuth = vi.fn()

vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth()
}))

const ProtectedRouteWithChild = () => (
  <Routes>
    <Route element={<ProtectedRoute />}>
      <Route path="*" element={<p>Protected content</p>} />
    </Route>
  </Routes>
)

describe('ProtectedRoute', () => {
  describe('when the user is connecting', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isConnecting: true,
        signIn: vi.fn()
      })
      renderWithProviders(<ProtectedRouteWithChild />)
    })

    it('should render a loading indicator', () => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should not render the protected content', () => {
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })

  describe('when the user is not signed in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isConnecting: false,
        signIn: vi.fn()
      })
      renderWithProviders(<ProtectedRouteWithChild />)
    })

    it('should render the login page', () => {
      expect(screen.getByText(/sign in required/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should not render the protected content', () => {
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })

  describe('when the user is signed in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isConnecting: false,
        signIn: vi.fn()
      })
      renderWithProviders(<ProtectedRouteWithChild />)
    })

    it('should render the protected content', () => {
      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })

    it('should not render the login page', () => {
      expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument()
    })

    it('should not render a loading indicator', () => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })
})

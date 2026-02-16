import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { Layout } from './Layout'

const mockOnClickSignIn = vi.fn()
const mockOnClickSignOut = vi.fn()
const mockOnClickNavbarItem = vi.fn()

describe('Layout', () => {
  describe('when rendering the layout', () => {
    beforeEach(() => {
      renderWithProviders(
        <Layout
          isSignedIn={false}
          isSigningIn={false}
          onClickSignIn={mockOnClickSignIn}
          onClickSignOut={mockOnClickSignOut}
          onClickNavbarItem={mockOnClickNavbarItem}
        >
          <div data-testid="child-content">Test Content</div>
        </Layout>
      )
    })

    it('should render the navbar', () => {
      // Navbar renders as a header element
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('should render the footer', () => {
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('should render children content', () => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('when the user is not signed in', () => {
    beforeEach(() => {
      renderWithProviders(
        <Layout
          isSignedIn={false}
          isSigningIn={false}
          onClickSignIn={mockOnClickSignIn}
          onClickSignOut={mockOnClickSignOut}
          onClickNavbarItem={mockOnClickNavbarItem}
        >
          <div>Content</div>
        </Layout>
      )
    })

    it('should show the sign in button', () => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  describe('when the user is signed in', () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'

    beforeEach(() => {
      renderWithProviders(
        <Layout
          isSignedIn={true}
          isSigningIn={false}
          address={mockAddress}
          onClickSignIn={mockOnClickSignIn}
          onClickSignOut={mockOnClickSignOut}
          onClickNavbarItem={mockOnClickNavbarItem}
        >
          <div data-testid="signed-in-content">Signed In Content</div>
        </Layout>
      )
    })

    it('should render the layout with signed in state', () => {
      expect(screen.getByTestId('signed-in-content')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })

  describe('when the user is signing in', () => {
    beforeEach(() => {
      renderWithProviders(
        <Layout
          isSignedIn={false}
          isSigningIn={true}
          onClickSignIn={mockOnClickSignIn}
          onClickSignOut={mockOnClickSignOut}
          onClickNavbarItem={mockOnClickNavbarItem}
        >
          <div data-testid="signing-in-content">Signing In Content</div>
        </Layout>
      )
    })

    it('should render the layout while signing in', () => {
      expect(screen.getByTestId('signing-in-content')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })
})

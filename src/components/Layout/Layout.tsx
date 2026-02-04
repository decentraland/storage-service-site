import type { ReactNode } from 'react'
import type { Avatar } from '@dcl/schemas'
import { Box, Container, Footer, Navbar, NavbarPages } from 'decentraland-ui2'

interface LayoutProps {
  children: ReactNode
  isSignedIn: boolean
  isSigningIn: boolean
  address?: string
  avatar?: Avatar
  onClickSignIn: () => void
  onClickSignOut: (event: React.MouseEvent<HTMLElement, MouseEvent>, trackingId: string) => void
  onClickNavbarItem: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    options: { eventTrackingName: string; url?: string; isExternal?: boolean }
  ) => void
}

const Layout = ({ children, isSignedIn, isSigningIn, address, avatar, onClickSignIn, onClickSignOut, onClickNavbarItem }: LayoutProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}
    >
      <Navbar
        activePage={NavbarPages.EXTRA}
        isSignedIn={isSignedIn}
        isSigningIn={isSigningIn}
        address={address}
        avatar={avatar}
        onClickSignIn={onClickSignIn}
        onClickSignOut={onClickSignOut}
        onClickNavbarItem={onClickNavbarItem}
      />
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flex: 1,
          pt: 8,
          pb: 4
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  )
}

export { Layout }
export type { LayoutProps }

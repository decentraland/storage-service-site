import { useCallback, useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ChainId } from '@dcl/schemas'
import { Layout } from '@/components/Layout'
import { config } from '@/config'
import { type AuthConfig, AuthProvider, useAuth } from '@/features/auth'
import { AppRoutes } from '@/routes'

const AppContent = () => {
  const { wallet, avatar, isSignedIn, isConnecting, signIn, signOut } = useAuth()

  const handleClickSignIn = useCallback(() => {
    signIn()
  }, [signIn])

  const handleClickSignOut = useCallback(() => {
    signOut()
  }, [signOut])

  const handleClickNavbarItem = useCallback(
    (_event: React.MouseEvent<HTMLElement, MouseEvent>, options: { url?: string; isExternal?: boolean }) => {
      if (options.url) {
        if (options.isExternal) {
          window.open(options.url, '_blank')
        } else {
          window.location.href = options.url
        }
      }
    },
    []
  )

  return (
    <Layout
      isSignedIn={isSignedIn}
      isSigningIn={isConnecting}
      address={wallet}
      avatar={avatar}
      onClickSignIn={handleClickSignIn}
      onClickSignOut={handleClickSignOut}
      onClickNavbarItem={handleClickNavbarItem}
    >
      <AppRoutes />
    </Layout>
  )
}

const App = () => {
  const authConfig: AuthConfig = useMemo(
    () => ({
      authUrl: config.get('AUTH_URL'),
      basePath: '/storage',
      defaultChainId: ChainId.ETHEREUM_MAINNET
    }),
    []
  )

  return (
    <BrowserRouter>
      <AuthProvider config={authConfig}>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export { App }

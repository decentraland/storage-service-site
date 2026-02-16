import { useCallback, useMemo } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { TranslationProvider } from '@dcl/hooks'
import { ChainId } from '@dcl/schemas'
import { Layout } from '@/components/Layout'
import { Sidebar } from '@/components/Sidebar'
import { config } from '@/config'
import { type AuthConfig, AuthProvider, useAuth } from '@/features/auth'
import en from '@/intl/en.json'
import { AppRoutes } from '@/routes'

const translations = { en }

const STORAGE_ROUTES = ['/env', '/scene', '/players']

const AppContent = () => {
  const { wallet, avatar, isSignedIn, isConnecting, signIn, signOut } = useAuth()
  const location = useLocation()

  const isStorageRoute = STORAGE_ROUTES.some(route => location.pathname.startsWith(route))

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
      sidebar={isStorageRoute && isSignedIn ? <Sidebar /> : undefined}
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
      <TranslationProvider locale="en" translations={translations}>
        <AuthProvider config={authConfig}>
          <AppContent />
        </AuthProvider>
      </TranslationProvider>
    </BrowserRouter>
  )
}

export { App }

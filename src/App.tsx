import { useCallback } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AppRoutes } from '@/routes'

const App = () => {
  // TODO: These will be replaced with actual auth context in Phase 3
  const isSignedIn = false
  const isSigningIn = false

  const handleClickSignIn = useCallback(() => {
    // TODO: Implement sign in logic in Phase 3
    console.log('Sign in clicked')
  }, [])

  const handleClickSignOut = useCallback(() => {
    // TODO: Implement sign out logic in Phase 3
    console.log('Sign out clicked')
  }, [])

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
    <BrowserRouter>
      <Layout
        isSignedIn={isSignedIn}
        isSigningIn={isSigningIn}
        onClickSignIn={handleClickSignIn}
        onClickSignOut={handleClickSignOut}
        onClickNavbarItem={handleClickNavbarItem}
      >
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  )
}

export { App }

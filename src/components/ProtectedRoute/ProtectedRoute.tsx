import { Outlet } from 'react-router-dom'
import { Box, CircularProgress } from 'decentraland-ui2'
import { useAuth } from '@/features/auth'
import { LoginPage } from '@/pages/Login'

const ProtectedRoute = () => {
  const { isSignedIn, isConnecting } = useAuth()

  if (isConnecting) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isSignedIn) {
    return <LoginPage />
  }

  return <Outlet />
}

export { ProtectedRoute }

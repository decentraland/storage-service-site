import { useCallback } from 'react'
import { Box, Button, Typography } from 'decentraland-ui2'
import { useAuth } from '@/features/auth'

const LoginPage = () => {
  const { signIn, isConnecting } = useAuth()

  const handleClickSignIn = useCallback(() => {
    signIn()
  }, [signIn])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2
      }}
    >
      <Typography variant="h5">Sign in required</Typography>
      <Typography variant="body1" color="text.secondary">
        Connect your wallet to manage world and player storage.
      </Typography>
      <Button variant="contained" onClick={handleClickSignIn} disabled={isConnecting} aria-label="Sign in">
        {isConnecting ? 'Connecting…' : 'Sign in'}
      </Button>
    </Box>
  )
}

export { LoginPage }

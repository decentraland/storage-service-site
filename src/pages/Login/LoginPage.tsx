import { useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useTranslation } from '@dcl/hooks'
import { useAuth } from '@/features/auth'

const LoginPage = () => {
  const { signIn, isConnecting } = useAuth()
  const { t } = useTranslation()

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
      <Typography variant="h5">{t('login_page.title')}</Typography>
      <Typography variant="body1" color="text.secondary">
        {t('login_page.subtitle')}
      </Typography>
      <Button variant="contained" onClick={handleClickSignIn} disabled={isConnecting} aria-label={t('login_page.sign_in')}>
        {isConnecting ? t('login_page.connecting') : t('login_page.sign_in')}
      </Button>
    </Box>
  )
}

export { LoginPage }

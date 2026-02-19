import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useTranslation } from '@dcl/hooks'

const UnauthorizedPage = () => {
  const { t } = useTranslation()

  const handleClickGoBack = () => {
    window.history.back()
  }

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
      <Typography variant="h5">{t('unauthorized_page.title')}</Typography>
      <Typography variant="body1" color="text.secondary">
        {t('unauthorized_page.subtitle')}
      </Typography>
      <Button variant="contained" onClick={handleClickGoBack} aria-label={t('unauthorized_page.go_back')}>
        {t('unauthorized_page.go_back')}
      </Button>
    </Box>
  )
}

export { UnauthorizedPage }
